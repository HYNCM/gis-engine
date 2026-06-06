import {
  type Diagnostic,
  DiagnosticCodes,
  MapLibreAdapter,
  MapRuntime,
  type MapSpec,
  MapSpecSchema,
  MockAdapter,
  type RendererAdapter,
  type SnapshotOptions,
  type SnapshotResult,
  type ValidationReport,
  validateSpec,
} from "@gis-engine/engine";
import { Ajv } from "ajv/dist/ajv.js";
import { toolInputErrorsToDiagnostics } from "./schemaDiagnostics.js";
import { createHeadlessContainer } from "./shared.js";

export const SnapshotSpecToolInputSchema = {
  type: "object",
  properties: {
    spec: MapSpecSchema,
    renderer: { type: "string", enum: ["maplibre", "mock"] },
    snapshot: {
      type: "object",
      properties: {
        width: { type: "number" },
        height: { type: "number" },
        pixelRatio: { type: "number" },
        format: { type: "string", enum: ["png", "jpeg", "data-url"] },
        targetLayers: { type: "array", items: { type: "string" } },
      },
      additionalProperties: false,
    },
  },
  required: ["spec"],
  additionalProperties: false,
} as const;

export interface SnapshotSpecToolInput {
  spec: MapSpec;
  renderer?: "maplibre" | "mock";
  snapshot?: SnapshotOptions;
}

export interface SnapshotSpecToolResult extends SnapshotResult {
  renderer: "maplibre" | "mock";
  validation: ValidationReport;
}

export type SnapshotSpecToolResponse =
  | { ok: true; result: SnapshotSpecToolResult; diagnostics: [] }
  | { ok: false; diagnostics: Diagnostic[] };

const ajv = new Ajv({ allErrors: true, strict: false });
const validateInput = ajv.compile(SnapshotSpecToolInputSchema);

export async function snapshotSpecTool(input: unknown): Promise<SnapshotSpecToolResponse> {
  if (!validateInput(input)) {
    return {
      ok: false,
      diagnostics: toolInputErrorsToDiagnostics(validateInput.errors, "Invalid snapshot_spec tool input."),
    };
  }

  const typedInput = input as SnapshotSpecToolInput;
  const renderer = typedInput.renderer ?? "maplibre";
  const validation = validateSpec(typedInput.spec);

  if (!validation.valid) {
    return {
      ok: true,
      result: {
        passed: false,
        diagnostics: validation.diagnostics,
        renderer,
        validation,
      },
      diagnostics: [],
    };
  }

  const adapter = createHeadlessAdapter(renderer);
  let runtime: MapRuntime | undefined;

  try {
    runtime = await MapRuntime.create(typedInput.spec, {
      adapter,
      container: createHeadlessContainer(),
    });
    const snapshot = await runtime.snapshot(typedInput.snapshot ?? {});
    return {
      ok: true,
      result: {
        ...snapshot,
        diagnostics: [...validation.diagnostics, ...snapshot.diagnostics],
        renderer,
        validation,
      },
      diagnostics: [],
    };
  } catch (error) {
    return {
      ok: true,
      result: {
        passed: false,
        diagnostics: [...validation.diagnostics, renderErrorDiagnostic(error)],
        renderer,
        validation,
      },
      diagnostics: [],
    };
  } finally {
    if (runtime) {
      await runtime.destroy();
    } else {
      await adapter.destroy();
    }
  }
}

function createHeadlessAdapter(renderer: "maplibre" | "mock"): RendererAdapter {
  return renderer === "mock" ? new MockAdapter() : new MapLibreAdapter();
}

function renderErrorDiagnostic(error: unknown): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.RenderAdapterError,
    message: error instanceof Error ? error.message : "Renderer adapter failed while creating a snapshot.",
  };
}
