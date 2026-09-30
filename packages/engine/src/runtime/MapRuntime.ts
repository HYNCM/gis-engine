import { applyCommands } from "../commands/applyCommands.js";
import { DiagnosticCodes } from "../diagnostics/codes.js";
import type { RendererAdapter } from "../renderer/adapter.js";
import { validateSpec } from "../spec/validate.js";
import type {
  ApplyOptions,
  CommandResult,
  Diagnostic,
  FeatureQueryResult,
  MapCommand,
  MapSpec,
  QueryFeaturesOptions,
  ResourceReport,
  SnapshotOptions,
  SnapshotResult,
  ValidationReport,
} from "../types.js";

export interface MapRuntimeOptions {
  adapter: RendererAdapter;
  container: HTMLElement;
}

export class MapSpecValidationError extends Error {
  readonly diagnostics: Diagnostic[];
  readonly report: ValidationReport;

  constructor(report: ValidationReport) {
    super("MapSpec validation failed.");
    this.name = "MapSpecValidationError";
    this.diagnostics = report.diagnostics;
    this.report = report;
  }
}

export class MapRuntime {
  #spec: MapSpec;
  #adapter: RendererAdapter;
  #container: HTMLElement;
  #destroyed = false;
  #needsReload = false;
  #applyQueue: Promise<void> = Promise.resolve();

  private constructor(spec: MapSpec, options: MapRuntimeOptions) {
    this.#spec = structuredClone(spec);
    this.#adapter = options.adapter;
    this.#container = options.container;
  }

  static async create(spec: MapSpec, options: MapRuntimeOptions): Promise<MapRuntime> {
    const report = validateSpec(spec);
    if (!report.valid) throw new MapSpecValidationError(report);

    const runtime = new MapRuntime(spec, options);
    await runtime.#adapter.load(runtime.#spec, { container: runtime.#container });
    return runtime;
  }

  async apply(commands: MapCommand | MapCommand[], options: ApplyOptions = {}): Promise<CommandResult[]> {
    this.#assertAlive();

    const queuedCommands = structuredClone(commands) as MapCommand | MapCommand[];
    const queuedOptions = structuredClone(options) as ApplyOptions;
    const run = this.#applyQueue.then(() => this.#applyImmediately(queuedCommands, queuedOptions));
    this.#applyQueue = run.then(
      () => undefined,
      () => undefined,
    );

    return run;
  }

  async #applyImmediately(commands: MapCommand | MapCommand[], options: ApplyOptions): Promise<CommandResult[]> {
    this.#assertAlive();
    const commandList = Array.isArray(commands) ? commands : [commands];

    if (this.#needsReload) {
      const recoverDiagnostics = await this.#reloadLastCommittedSpec();
      if (recoverDiagnostics) {
        return commandList.map((command, sequenceId) => ({
          commandId: command.id,
          sequenceId,
          status: "failed" as const,
          changedPaths: [],
          diagnostics: recoverDiagnostics,
          ...(options.traceId ? { traceId: options.traceId } : {}),
        }));
      }
    }

    const result = applyCommands(this.#spec, commands, options);
    const patch = result.committed
      ? result.results.flatMap((commandResult, index) =>
          commandList[index]?.dryRun ? [] : (commandResult.patch ?? []),
        )
      : [];

    if (!options.dryRun && patch.length > 0) {
      let failureDiagnostics: Diagnostic[] | undefined;
      try {
        const adapterResult = await this.#adapter.applyPatch(patch, { container: this.#container });
        if (adapterResult.diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
          failureDiagnostics = adapterResult.diagnostics;
        }
      } catch (error) {
        failureDiagnostics = [adapterErrorDiagnostic(error)];
      }

      if (failureDiagnostics) {
        this.#needsReload = true;
        const recoverDiagnostics = await this.#reloadLastCommittedSpec();
        const combined = recoverDiagnostics ? [...failureDiagnostics, ...recoverDiagnostics] : failureDiagnostics;
        return markAdapterFailure(result.results, combined);
      }

      this.#spec = result.spec;
    }

    return result.results;
  }

  exportSpec(): MapSpec {
    this.#assertAlive();
    return structuredClone(this.#spec);
  }

  validate(): ValidationReport {
    this.#assertAlive();
    return validateSpec(this.#spec);
  }

  async queryFeatures(options: QueryFeaturesOptions): Promise<FeatureQueryResult> {
    // Reads observe the last committed state: an in-flight apply must settle first.
    await this.#applyQueue;
    this.#assertAlive();
    return this.#adapter.queryFeatures(options);
  }

  async snapshot(options: SnapshotOptions = {}): Promise<SnapshotResult> {
    await this.#applyQueue;
    this.#assertAlive();
    return this.#adapter.snapshot(options);
  }

  resize(): void {
    this.#assertAlive();
    this.#adapter.resize({
      width: this.#container.clientWidth,
      height: this.#container.clientHeight,
    });
  }

  async destroy(): Promise<ResourceReport> {
    if (this.#destroyed) {
      return alreadyDestroyedReport();
    }

    // Destroy is the terminal queue entry: every queued apply settles before the adapter is released.
    const pending = this.#applyQueue;
    this.#applyQueue = Promise.resolve();
    await pending.catch(() => undefined);
    // A second destroy queued behind the first one must not release the adapter twice.
    if (this.#destroyed) {
      return alreadyDestroyedReport();
    }
    this.#destroyed = true;
    return this.#adapter.destroy();
  }

  #assertAlive(): void {
    if (this.#destroyed) throw new Error("MapRuntime has been destroyed.");
  }

  async #reloadLastCommittedSpec(): Promise<Diagnostic[] | undefined> {
    try {
      await this.#adapter.load(this.#spec, { container: this.#container });
    } catch (error) {
      return [
        {
          severity: "error",
          code: DiagnosticCodes.RenderRecoverFailed,
          message: `Failed to reload the last committed MapSpec into the renderer adapter: ${
            error instanceof Error ? error.message : String(error)
          }`,
          fix: {
            kind: "manual",
            confidence: "medium",
            message:
              "The renderer may show uncommitted state; retry once the adapter recovers, or recreate the runtime.",
          },
        },
      ];
    }
    this.#needsReload = false;
    return undefined;
  }
}

function alreadyDestroyedReport(): ResourceReport {
  return {
    destroyed: true,
    diagnostics: [
      {
        severity: "info",
        code: DiagnosticCodes.RenderDestroyed,
        message: "MapRuntime is already destroyed.",
      },
    ],
  };
}

function markAdapterFailure(results: CommandResult[], diagnostics: Diagnostic[]): CommandResult[] {
  const adapterDiagnostics = ensureAdapterErrorDiagnostic(diagnostics);
  return results.map((commandResult) => ({
    ...commandResult,
    status: "failed",
    diagnostics: [...commandResult.diagnostics, ...adapterDiagnostics],
  }));
}

function ensureAdapterErrorDiagnostic(diagnostics: Diagnostic[]): Diagnostic[] {
  const hasRenderAdapterError = diagnostics.some(
    (diagnostic) => diagnostic.code === DiagnosticCodes.RenderAdapterError,
  );
  if (hasRenderAdapterError) return diagnostics;
  return [
    {
      severity: "error",
      code: DiagnosticCodes.RenderAdapterError,
      message: "Renderer adapter failed while applying patches.",
    },
    ...diagnostics,
  ];
}

function adapterErrorDiagnostic(error: unknown): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.RenderAdapterError,
    message: error instanceof Error ? error.message : "Renderer adapter failed while applying patches.",
  };
}
