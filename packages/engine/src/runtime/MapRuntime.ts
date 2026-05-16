import { applyCommands } from "../commands/applyCommands.js";
import { DiagnosticCodes } from "../diagnostics/codes.js";
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
  ValidationReport
} from "../types.js";
import type { RendererAdapter } from "../renderer/adapter.js";

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
    const result = applyCommands(this.#spec, commands, options);
    const commandList = Array.isArray(commands) ? commands : [commands];
    const transaction = options.transaction ?? "atomic";
    const failedAtomicBatch = transaction === "atomic" && result.results.some((commandResult) => commandResult.status === "failed");
    const patch = failedAtomicBatch
      ? []
      : result.results.flatMap((commandResult, index) => (commandList[index]?.dryRun ? [] : commandResult.patch ?? []));

    if (!options.dryRun && patch.length > 0) {
      const adapterResult = await this.#adapter.applyPatch(patch, { container: this.#container });
      if (adapterResult.diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
        return result.results.map((commandResult) => ({
          ...commandResult,
          status: "failed",
          diagnostics: [...commandResult.diagnostics, ...adapterResult.diagnostics]
        }));
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

  queryFeatures(options: QueryFeaturesOptions): Promise<FeatureQueryResult> {
    this.#assertAlive();
    return this.#adapter.queryFeatures(options);
  }

  snapshot(options: SnapshotOptions = {}): Promise<SnapshotResult> {
    this.#assertAlive();
    return this.#adapter.snapshot(options);
  }

  async destroy(): Promise<ResourceReport> {
    if (this.#destroyed) {
      return {
        destroyed: true,
        diagnostics: [
          {
            severity: "info",
            code: DiagnosticCodes.RenderDestroyed,
            message: "MapRuntime is already destroyed."
          }
        ]
      };
    }

    this.#destroyed = true;
    return this.#adapter.destroy();
  }

  #assertAlive(): void {
    if (this.#destroyed) throw new Error("MapRuntime has been destroyed.");
  }
}
