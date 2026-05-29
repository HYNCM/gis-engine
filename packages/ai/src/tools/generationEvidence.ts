import { Ajv } from "ajv/dist/ajv.js";
import {
  CapabilityReportSchema,
  DiagnosticCodes,
  DiagnosticSchema,
  MapGenerationCommandSkeletonSchema,
  MapGenerationTargetDomainSchema,
  validateSpec,
  type CapabilityReport,
  type Diagnostic,
  type MapGenerationCommandSkeleton,
  type MapGenerationTargetDomain,
  type ValidationReport
} from "@gis-engine/engine";
import { applyCommandsTool } from "./applyCommands.js";
import { getContextSummary, type ContextSummary, type GisEngineToolName } from "./contextSummary.js";
import { exportExampleAppTool, ExportExampleAppToolInputSchema, type ExampleId } from "./exportExampleApp.js";
import { toolInputErrorsToDiagnostics } from "./schemaDiagnostics.js";
import { snapshotSpecTool, SnapshotSpecToolInputSchema } from "./snapshotSpec.js";
import {
  ContextSummaryToolResultSchema,
  SnapshotSpecToolResultSchema,
  ValidateSpecToolResultSchema
} from "../mcp/server.js";

const DiagnosticContractSchema = stripNestedIds(DiagnosticSchema);
const ContextSummaryContractSchema = stripNestedIds(ContextSummaryToolResultSchema);
const SnapshotSpecContractSchema = stripNestedIds(SnapshotSpecToolResultSchema);
const ValidationReportContractSchema = stripNestedIds(ValidateSpecToolResultSchema);

const GisEngineToolNameSchema = {
  type: "string",
  enum: ["validate_spec", "apply_commands", "export_spec", "get_context_summary", "snapshot_spec", "explain_spec", "export_example_app"]
} as const;

const DiagnosticCountsSchema = {
  type: "object",
  properties: {
    error: { type: "number" },
    warning: { type: "number" },
    info: { type: "number" }
  },
  required: ["error", "warning", "info"],
  additionalProperties: false
} as const;

export const GenerationEvidenceBundleInputSchema = {
  type: "object",
  properties: {
    promptHash: { type: "string", minLength: 1 },
    skeleton: stripNestedIds(MapGenerationCommandSkeletonSchema),
    capabilities: stripNestedIds(CapabilityReportSchema),
    snapshot: {
      type: "object",
      properties: {
        renderer: SnapshotSpecToolInputSchema.properties.renderer,
        options: SnapshotSpecToolInputSchema.properties.snapshot
      },
      additionalProperties: false
    },
    exampleId: ExportExampleAppToolInputSchema.properties.exampleId
  },
  required: ["promptHash", "skeleton"],
  additionalProperties: false
} as const;

export const GenerationEvidenceBundleSchema = {
  type: "object",
  properties: {
    promptHash: { type: "string" },
    status: { type: "string", enum: ["ready", "blocked"] },
    targetDomains: {
      type: "array",
      items: stripNestedIds(MapGenerationTargetDomainSchema)
    },
    toolSequence: {
      type: "array",
      items: GisEngineToolNameSchema
    },
    summary: ContextSummaryContractSchema,
    validation: ValidationReportContractSchema,
    commandEvidence: {
      type: "object",
      properties: {
        usedApplyCommands: { type: "boolean" },
        traceId: { type: "string" },
        commandCount: { type: "number" },
        resultStatuses: { type: "array", items: { type: "string", enum: ["applied", "skipped", "failed"] } },
        committed: { type: "boolean" },
        rolledBack: { type: "boolean" },
        diagnosticCounts: DiagnosticCountsSchema,
        changedPaths: { type: "array", items: { type: "string" } }
      },
      required: ["usedApplyCommands", "traceId", "commandCount", "resultStatuses", "committed", "rolledBack", "diagnosticCounts", "changedPaths"],
      additionalProperties: false
    },
    snapshotEvidence: {
      type: "object",
      properties: {
        requested: { type: "boolean" },
        renderer: { type: "string", enum: ["maplibre", "mock"] },
        passed: { type: "boolean" },
        dataUrlPresent: { type: "boolean" },
        diagnosticCounts: DiagnosticCountsSchema,
        result: SnapshotSpecContractSchema
      },
      required: ["requested", "renderer", "passed", "dataUrlPresent", "diagnosticCounts"],
      additionalProperties: false
    },
    exportEvidence: {
      type: "object",
      properties: {
        ready: { type: "boolean" },
        revision: { type: "string" },
        sourceCount: { type: "number" },
        layerCount: { type: "number" },
        diagnosticCounts: DiagnosticCountsSchema
      },
      required: ["ready", "sourceCount", "layerCount", "diagnosticCounts"],
      additionalProperties: false
    },
    exampleEvidence: {
      type: "object",
      properties: {
        exampleId: ExportExampleAppToolInputSchema.properties.exampleId,
        writesFiles: { type: "boolean", const: false },
        fileCount: { type: "number" },
        diagnosticCounts: DiagnosticCountsSchema
      },
      required: ["exampleId", "writesFiles", "fileCount", "diagnosticCounts"],
      additionalProperties: false
    },
    diagnostics: {
      type: "array",
      items: DiagnosticContractSchema
    }
  },
  required: [
    "promptHash",
    "status",
    "targetDomains",
    "toolSequence",
    "summary",
    "validation",
    "commandEvidence",
    "snapshotEvidence",
    "exportEvidence",
    "exampleEvidence",
    "diagnostics"
  ],
  additionalProperties: false
} as const;

export interface GenerationEvidenceBundleInput {
  promptHash: string;
  skeleton: MapGenerationCommandSkeleton;
  capabilities?: CapabilityReport;
  snapshot?: {
    renderer?: "maplibre" | "mock";
    options?: {
      width?: number;
      height?: number;
      pixelRatio?: number;
      format?: "png" | "jpeg" | "data-url";
      targetLayers?: string[];
    };
  };
  exampleId?: ExampleId;
}

export interface GenerationCommandEvidence {
  usedApplyCommands: boolean;
  traceId: string;
  commandCount: number;
  resultStatuses: Array<"applied" | "skipped" | "failed">;
  committed: boolean;
  rolledBack: boolean;
  diagnosticCounts: Record<Diagnostic["severity"], number>;
  changedPaths: string[];
}

export interface GenerationSnapshotEvidence {
  requested: boolean;
  renderer: "maplibre" | "mock";
  passed: boolean;
  dataUrlPresent: boolean;
  diagnosticCounts: Record<Diagnostic["severity"], number>;
  result?: unknown;
}

export interface GenerationExportEvidence {
  ready: boolean;
  revision?: string;
  sourceCount: number;
  layerCount: number;
  diagnosticCounts: Record<Diagnostic["severity"], number>;
}

export interface GenerationExampleEvidence {
  exampleId: ExampleId;
  writesFiles: false;
  fileCount: number;
  diagnosticCounts: Record<Diagnostic["severity"], number>;
}

export interface GenerationEvidenceBundle {
  promptHash: string;
  status: "ready" | "blocked";
  targetDomains: MapGenerationTargetDomain[];
  toolSequence: GisEngineToolName[];
  summary: ContextSummary;
  validation: ValidationReport;
  commandEvidence: GenerationCommandEvidence;
  snapshotEvidence: GenerationSnapshotEvidence;
  exportEvidence: GenerationExportEvidence;
  exampleEvidence: GenerationExampleEvidence;
  diagnostics: Diagnostic[];
}

export type GenerationEvidenceBundleResponse =
  | { ok: true; result: GenerationEvidenceBundle; diagnostics: [] }
  | { ok: false; diagnostics: Diagnostic[] };

const ajv = new Ajv({ allErrors: true, strict: false });
const validateInput = ajv.compile(GenerationEvidenceBundleInputSchema);

export async function createGenerationEvidenceBundle(input: unknown): Promise<GenerationEvidenceBundleResponse> {
  if (!validateInput(input)) {
    return {
      ok: false,
      diagnostics: toolInputErrorsToDiagnostics(validateInput.errors, "Invalid generation evidence bundle input.")
    };
  }

  const typedInput = input as GenerationEvidenceBundleInput;
  const validation = validateSpec(typedInput.skeleton.spec);
  const summary = getContextSummary({
    spec: typedInput.skeleton.spec,
    ...(typedInput.capabilities ? { capabilities: typedInput.capabilities } : {})
  });
  const commandEvidence = buildCommandEvidence(typedInput.skeleton);
  const snapshotEvidence = await buildSnapshotEvidence(typedInput);
  const exportEvidence = buildExportEvidence(typedInput.skeleton, validation);
  const exampleEvidence = buildExampleEvidence(typedInput.exampleId ?? "ai-map-edit");
  const diagnostics = [
    ...typedInput.skeleton.diagnostics,
    ...validation.diagnostics,
    ...commandEvidenceDiagnostics(typedInput.skeleton, commandEvidence),
    ...snapshotEvidenceDiagnostics(snapshotEvidence),
    ...exampleEvidence.diagnostics
  ];
  const visibleDiagnostics = diagnostics.filter((diagnostic) => diagnostic.severity === "error" || diagnostic.severity === "warning");
  const status =
    typedInput.skeleton.status === "blocked" ||
    !validation.valid ||
    commandEvidence.diagnosticCounts.error > 0 ||
    snapshotEvidence.diagnosticCounts.error > 0
      ? "blocked"
      : "ready";

  return {
    ok: true,
    result: {
      promptHash: typedInput.promptHash,
      status,
      targetDomains: typedInput.skeleton.targetDomains,
      toolSequence: ["get_context_summary", "validate_spec", "apply_commands", "snapshot_spec", "export_spec", "export_example_app"],
      summary,
      validation,
      commandEvidence,
      snapshotEvidence: stripInternalDiagnostics(snapshotEvidence),
      exportEvidence,
      exampleEvidence: stripExampleDiagnostics(exampleEvidence),
      diagnostics: visibleDiagnostics
    },
    diagnostics: []
  };
}

function buildCommandEvidence(skeleton: MapGenerationCommandSkeleton): GenerationCommandEvidence {
  if (skeleton.commands.length === 0) {
    return {
      usedApplyCommands: false,
      traceId: skeleton.traceId,
      commandCount: 0,
      resultStatuses: [],
      committed: false,
      rolledBack: false,
      diagnosticCounts: zeroDiagnosticCounts(),
      changedPaths: []
    };
  }

  const result = applyCommandsTool({
    spec: skeleton.baseSpec,
    commands: skeleton.commands,
    collectTrace: true,
    traceId: skeleton.traceId
  });

  if (!result.ok) {
    return {
      usedApplyCommands: true,
      traceId: skeleton.traceId,
      commandCount: skeleton.commands.length,
      resultStatuses: ["failed"],
      committed: false,
      rolledBack: true,
      diagnosticCounts: countDiagnostics(result.diagnostics),
      changedPaths: []
    };
  }

  const diagnostics = [
    ...result.result.results.flatMap((commandResult) => commandResult.diagnostics),
    ...specMismatchDiagnostics(skeleton, result.result)
  ];

  return {
    usedApplyCommands: true,
    traceId: result.result.traceId,
    commandCount: skeleton.commands.length,
    resultStatuses: result.result.results.map((commandResult) => commandResult.status),
    committed: result.result.committed,
    rolledBack: result.result.rolledBack,
    diagnosticCounts: countDiagnostics(diagnostics),
    changedPaths: unique(result.result.results.flatMap((commandResult) => commandResult.changedPaths))
  };
}

async function buildSnapshotEvidence(input: GenerationEvidenceBundleInput): Promise<GenerationSnapshotEvidence & { diagnostics: Diagnostic[] }> {
  const renderer = input.snapshot?.renderer ?? "maplibre";
  if (input.skeleton.status === "blocked") {
    return {
      requested: false,
      renderer,
      passed: false,
      dataUrlPresent: false,
      diagnosticCounts: zeroDiagnosticCounts(),
      diagnostics: []
    };
  }

  const response = await snapshotSpecTool({
    spec: input.skeleton.spec,
    renderer,
    ...(input.snapshot?.options ? { snapshot: input.snapshot.options } : {})
  });

  if (!response.ok) {
    return {
      requested: true,
      renderer,
      passed: false,
      dataUrlPresent: false,
      diagnosticCounts: countDiagnostics(response.diagnostics),
      diagnostics: response.diagnostics
    };
  }

  return {
    requested: true,
    renderer: response.result.renderer,
    passed: response.result.passed,
    dataUrlPresent: typeof response.result.dataUrl === "string" && response.result.dataUrl.length > 0,
    diagnosticCounts: countDiagnostics(response.result.diagnostics),
    result: response.result,
    diagnostics: response.result.diagnostics
  };
}

function buildExportEvidence(skeleton: MapGenerationCommandSkeleton, validation: ValidationReport): GenerationExportEvidence {
  return {
    ready: skeleton.status === "ready" && validation.valid,
    ...(skeleton.spec.revision ? { revision: skeleton.spec.revision } : {}),
    sourceCount: Object.keys(skeleton.spec.sources).length,
    layerCount: skeleton.spec.layers.length,
    diagnosticCounts: countDiagnostics(validation.diagnostics)
  };
}

function buildExampleEvidence(exampleId: ExampleId): GenerationExampleEvidence & { diagnostics: Diagnostic[] } {
  const response = exportExampleAppTool({ exampleId });
  if (!response.ok) {
    return {
      exampleId,
      writesFiles: false,
      fileCount: 0,
      diagnosticCounts: countDiagnostics(response.diagnostics),
      diagnostics: response.diagnostics
    };
  }

  return {
    exampleId,
    writesFiles: response.result.writesFiles,
    fileCount: response.result.files.length,
    diagnosticCounts: zeroDiagnosticCounts(),
    diagnostics: []
  };
}

function commandEvidenceDiagnostics(skeleton: MapGenerationCommandSkeleton, commandEvidence: GenerationCommandEvidence): Diagnostic[] {
  if (skeleton.commands.length === 0) return [];
  return specMismatchDiagnosticsFromEvidence(skeleton, commandEvidence);
}

function specMismatchDiagnostics(skeleton: MapGenerationCommandSkeleton, result: { spec: unknown }): Diagnostic[] {
  return JSON.stringify(result.spec) === JSON.stringify(skeleton.spec) ? [] : [specMismatchDiagnostic()];
}

function specMismatchDiagnosticsFromEvidence(skeleton: MapGenerationCommandSkeleton, commandEvidence: GenerationCommandEvidence): Diagnostic[] {
  if (!commandEvidence.usedApplyCommands || skeleton.commands.length === 0) return [];
  const replay = applyCommandsTool({
    spec: skeleton.baseSpec,
    commands: skeleton.commands,
    traceId: skeleton.traceId
  });
  if (!replay.ok) return replay.diagnostics;
  return specMismatchDiagnostics(skeleton, replay.result);
}

function specMismatchDiagnostic(): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.CommandInvalidPatch,
    message: "Generation evidence bundle spec does not match replaying the skeleton commands through apply_commands.",
    path: "/skeleton/spec",
    relatedResources: [{ kind: "command", path: "/skeleton/commands" }],
    fix: {
      kind: "manual",
      confidence: "high",
      message: "Regenerate the skeleton spec by replaying commands from baseSpec instead of editing the MapSpec directly."
    }
  };
}

function snapshotEvidenceDiagnostics(snapshotEvidence: GenerationSnapshotEvidence & { diagnostics?: Diagnostic[] }): Diagnostic[] {
  return snapshotEvidence.diagnostics ?? [];
}

function stripInternalDiagnostics(snapshotEvidence: GenerationSnapshotEvidence & { diagnostics?: Diagnostic[] }): GenerationSnapshotEvidence {
  const { diagnostics: _diagnostics, ...publicEvidence } = snapshotEvidence;
  return publicEvidence;
}

function stripExampleDiagnostics(exampleEvidence: GenerationExampleEvidence & { diagnostics?: Diagnostic[] }): GenerationExampleEvidence {
  const { diagnostics: _diagnostics, ...publicEvidence } = exampleEvidence;
  return publicEvidence;
}

function countDiagnostics(diagnostics: Diagnostic[]): Record<Diagnostic["severity"], number> {
  return diagnostics.reduce<Record<Diagnostic["severity"], number>>(
    (counts, diagnostic) => {
      counts[diagnostic.severity] += 1;
      return counts;
    },
    zeroDiagnosticCounts()
  );
}

function zeroDiagnosticCounts(): Record<Diagnostic["severity"], number> {
  return { error: 0, warning: 0, info: 0 };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function stripNestedIds<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripNestedIds) as T;
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "$id").map(([key, entry]) => [key, stripNestedIds(entry)])) as T;
}
