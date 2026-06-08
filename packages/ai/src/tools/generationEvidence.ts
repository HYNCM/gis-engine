import { createHash } from "node:crypto";
import {
  type CapabilityReport,
  CapabilityReportSchema,
  createSourceReadinessReport,
  type Diagnostic,
  DiagnosticCodes,
  DiagnosticSchema,
  type FeatureQueryResult,
  type MapGenerationAnalysisEvidence,
  type MapGenerationAnalysisOperation,
  MapGenerationAnalysisOperationSchema,
  type MapGenerationCommandSkeleton,
  MapGenerationCommandSkeletonSchema,
  type MapGenerationPromptPlanFromSchema,
  MapGenerationPromptPlanSchema,
  type MapGenerationQueryReadinessOperation,
  MapGenerationQueryReadinessOperationSchema,
  type MapGenerationTargetDomain,
  MapGenerationTargetDomainSchema,
  MapLibreAdapter,
  MapRuntime,
  type MapSpec,
  MockAdapter,
  type QueryFeaturesOptions,
  type RendererAdapter,
  Scene3DStableRuntimeBlockerCodes,
  type SourceReadinessEntry,
  type SourceRuntimeReadinessSummary,
  type ValidationReport,
  validateSpec,
} from "@gis-engine/engine";
import { Ajv } from "ajv/dist/ajv.js";
import {
  ContextSummaryToolResultSchema,
  SnapshotSpecToolResultSchema,
  ValidateSpecToolResultSchema,
} from "../mcp/server.js";
import { applyCommandsTool } from "./applyCommands.js";
import { type ContextSummary, type GisEngineToolName, getContextSummary } from "./contextSummary.js";
import {
  type ExampleAppDeliverySummary,
  ExampleAppDeliverySummarySchema,
  type ExampleAppGenerationEvidenceSummary,
  ExampleAppGenerationEvidenceSummarySchema,
  type ExampleId,
  ExportExampleAppToolInputSchema,
  exportExampleAppTool,
} from "./exportExampleApp.js";
import { toolInputErrorsToDiagnostics } from "./schemaDiagnostics.js";
import {
  countDiagnostics,
  createHeadlessContainer,
  DiagnosticCountsSchema,
  stripNestedIds,
  zeroDiagnosticCounts,
} from "./shared.js";
import { SnapshotSpecToolInputSchema, snapshotSpecTool } from "./snapshotSpec.js";

const DiagnosticContractSchema = stripNestedIds(DiagnosticSchema);
const ContextSummaryContractSchema = stripNestedIds(ContextSummaryToolResultSchema);
const SnapshotSpecContractSchema = stripNestedIds(SnapshotSpecToolResultSchema);
const ValidationReportContractSchema = stripNestedIds(ValidateSpecToolResultSchema);
type Scene3DStableRuntimeBlockerCode =
  (typeof Scene3DStableRuntimeBlockerCodes)[keyof typeof Scene3DStableRuntimeBlockerCodes];

const GisEngineToolNameSchema = {
  type: "string",
  enum: [
    "validate_spec",
    "apply_commands",
    "export_spec",
    "get_context_summary",
    "snapshot_spec",
    "explain_spec",
    "export_example_app",
  ],
} as const;

const DEFAULT_SPATIAL_QUERY_RESULT_LIMIT = 100;

const PlannerConfidenceSchema = {
  type: "object",
  properties: {
    level: { type: "string", enum: ["high", "medium", "low", "unknown"] },
    score: { type: "number", minimum: 0, maximum: 1 },
    reasons: { type: "array", items: { type: "string" } },
  },
  required: ["level", "score", "reasons"],
  additionalProperties: false,
} as const;

const PointSpatialQueryCaseSchema = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 },
    operation: { type: "string", const: "point-query" },
    point: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
    layers: { type: "array", items: { type: "string" } },
  },
  required: ["id", "operation", "point"],
  additionalProperties: false,
} as const;

const BboxSpatialQueryCaseSchema = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 },
    operation: { type: "string", const: "bbox-query" },
    bbox: { type: "array", items: { type: "number" }, minItems: 4, maxItems: 4 },
    layers: { type: "array", items: { type: "string" } },
  },
  required: ["id", "operation", "bbox"],
  additionalProperties: false,
} as const;

const SpatialQueryCaseSchema = {
  anyOf: [PointSpatialQueryCaseSchema, BboxSpatialQueryCaseSchema],
} as const;

const SpatialQueryCapabilityWaiverSchema = {
  type: "object",
  properties: {
    reason: { type: "string", minLength: 1 },
    approvedBy: { type: "string", minLength: 1 },
    followUpTaskId: { type: "string", minLength: 1 },
  },
  required: ["reason", "approvedBy", "followUpTaskId"],
  additionalProperties: false,
} as const;

const SpatialQueryCapabilityGateSchema = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["passed", "waived", "blocked"] },
    requiredQueries: { type: "array", items: { type: "string", enum: ["point", "bbox"] } },
    providedQueries: { type: "array", items: { type: "string" } },
    waiver: SpatialQueryCapabilityWaiverSchema,
  },
  required: ["status", "requiredQueries", "providedQueries"],
  additionalProperties: false,
} as const;

const SpatialQueryCaseEvidenceSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    operation: stripNestedIds(MapGenerationQueryReadinessOperationSchema),
    layerIds: { type: "array", items: { type: "string" } },
    sourceIds: { type: "array", items: { type: "string" } },
    featureCount: { type: "number" },
    resultLimit: { type: "number" },
    resultTruncated: { type: "boolean" },
    fixtureHash: { type: "string", minLength: 1 },
    passed: { type: "boolean" },
    diagnosticCounts: DiagnosticCountsSchema,
  },
  required: [
    "id",
    "operation",
    "layerIds",
    "sourceIds",
    "featureCount",
    "resultLimit",
    "resultTruncated",
    "fixtureHash",
    "passed",
    "diagnosticCounts",
  ],
  additionalProperties: false,
} as const;

export const GenerationEvidenceBundleInputSchema = {
  type: "object",
  properties: {
    promptHash: { type: "string", minLength: 1 },
    skeleton: stripNestedIds(MapGenerationCommandSkeletonSchema),
    planner: {
      type: "object",
      properties: {
        plan: stripNestedIds(MapGenerationPromptPlanSchema),
        confidence: PlannerConfidenceSchema,
      },
      required: ["plan"],
      additionalProperties: false,
    },
    capabilities: stripNestedIds(CapabilityReportSchema),
    snapshot: {
      type: "object",
      properties: {
        renderer: SnapshotSpecToolInputSchema.properties.renderer,
        options: SnapshotSpecToolInputSchema.properties.snapshot,
      },
      additionalProperties: false,
    },
    spatialQueries: {
      type: "object",
      properties: {
        renderer: SnapshotSpecToolInputSchema.properties.renderer,
        cases: { type: "array", items: SpatialQueryCaseSchema },
        capabilityWaiver: SpatialQueryCapabilityWaiverSchema,
      },
      required: ["cases"],
      additionalProperties: false,
    },
    exampleId: ExportExampleAppToolInputSchema.properties.exampleId,
  },
  required: ["promptHash", "skeleton"],
  additionalProperties: false,
} as const;

export const GenerationEvidenceBundleSchema = {
  type: "object",
  properties: {
    promptHash: { type: "string" },
    status: { type: "string", enum: ["ready", "blocked"] },
    targetDomains: {
      type: "array",
      items: stripNestedIds(MapGenerationTargetDomainSchema),
    },
    toolSequence: {
      type: "array",
      items: GisEngineToolNameSchema,
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
        changedPaths: { type: "array", items: { type: "string" } },
      },
      required: [
        "usedApplyCommands",
        "traceId",
        "commandCount",
        "resultStatuses",
        "committed",
        "rolledBack",
        "diagnosticCounts",
        "changedPaths",
      ],
      additionalProperties: false,
    },
    plannerEvidence: {
      type: "object",
      properties: {
        provided: { type: "boolean" },
        plannerId: { type: "string" },
        promptHash: { type: "string" },
        traceId: { type: "string" },
        commandTraceId: { type: "string" },
        retainedRawPrompt: { type: "boolean", const: false },
        confidence: PlannerConfidenceSchema,
        acceptedIntentFields: { type: "array", items: { type: "string" } },
        unsupportedIntentFields: { type: "array", items: { type: "string" } },
        sourcePromptHashes: { type: "array", items: { type: "string" } },
        diagnosticCounts: DiagnosticCountsSchema,
      },
      required: [
        "provided",
        "plannerId",
        "promptHash",
        "traceId",
        "commandTraceId",
        "retainedRawPrompt",
        "confidence",
        "acceptedIntentFields",
        "unsupportedIntentFields",
        "sourcePromptHashes",
        "diagnosticCounts",
      ],
      additionalProperties: false,
    },
    spatialQueryEvidence: {
      type: "object",
      properties: {
        requested: { type: "boolean" },
        ready: { type: "boolean" },
        renderer: { type: "string", enum: ["maplibre", "mock"] },
        status: { type: "string", enum: ["ready", "blocked", "not-requested"] },
        requestedOperations: { type: "array", items: stripNestedIds(MapGenerationAnalysisOperationSchema) },
        acceptedQueryOperations: { type: "array", items: stripNestedIds(MapGenerationQueryReadinessOperationSchema) },
        blockedOperations: { type: "array", items: stripNestedIds(MapGenerationAnalysisOperationSchema) },
        unsupportedOperations: { type: "array", items: stripNestedIds(MapGenerationAnalysisOperationSchema) },
        capabilityQueries: { type: "array", items: { type: "string" } },
        capabilityGate: SpatialQueryCapabilityGateSchema,
        queryableSourceIds: { type: "array", items: { type: "string" } },
        queryableLayerIds: { type: "array", items: { type: "string" } },
        hiddenLayerIds: { type: "array", items: { type: "string" } },
        unsupportedSourceIds: { type: "array", items: { type: "string" } },
        missingSourceIds: { type: "array", items: { type: "string" } },
        cases: { type: "array", items: SpatialQueryCaseEvidenceSchema },
        diagnosticCounts: DiagnosticCountsSchema,
      },
      required: [
        "requested",
        "ready",
        "renderer",
        "status",
        "requestedOperations",
        "acceptedQueryOperations",
        "blockedOperations",
        "unsupportedOperations",
        "capabilityQueries",
        "capabilityGate",
        "queryableSourceIds",
        "queryableLayerIds",
        "hiddenLayerIds",
        "unsupportedSourceIds",
        "missingSourceIds",
        "cases",
        "diagnosticCounts",
      ],
      additionalProperties: false,
    },
    snapshotEvidence: {
      type: "object",
      properties: {
        requested: { type: "boolean" },
        renderer: { type: "string", enum: ["maplibre", "mock"] },
        passed: { type: "boolean" },
        dataUrlPresent: { type: "boolean" },
        diagnosticCounts: DiagnosticCountsSchema,
        result: SnapshotSpecContractSchema,
      },
      required: ["requested", "renderer", "passed", "dataUrlPresent", "diagnosticCounts"],
      additionalProperties: false,
    },
    exportEvidence: {
      type: "object",
      properties: {
        ready: { type: "boolean" },
        revision: { type: "string" },
        sourceCount: { type: "number" },
        layerCount: { type: "number" },
        diagnosticCounts: DiagnosticCountsSchema,
      },
      required: ["ready", "sourceCount", "layerCount", "diagnosticCounts"],
      additionalProperties: false,
    },
    delivery: ExampleAppDeliverySummarySchema,
    exampleEvidence: {
      type: "object",
      properties: {
        exampleId: ExportExampleAppToolInputSchema.properties.exampleId,
        writesFiles: { type: "boolean", const: false },
        fileCount: { type: "number" },
        diagnosticCounts: DiagnosticCountsSchema,
        generationEvidence: ExampleAppGenerationEvidenceSummarySchema,
      },
      required: ["exampleId", "writesFiles", "fileCount", "diagnosticCounts"],
      additionalProperties: false,
    },
    diagnostics: {
      type: "array",
      items: DiagnosticContractSchema,
    },
  },
  required: [
    "promptHash",
    "status",
    "targetDomains",
    "toolSequence",
    "summary",
    "validation",
    "commandEvidence",
    "plannerEvidence",
    "spatialQueryEvidence",
    "snapshotEvidence",
    "exportEvidence",
    "delivery",
    "exampleEvidence",
    "diagnostics",
  ],
  additionalProperties: false,
} as const;

export interface GenerationEvidenceBundleInput {
  promptHash: string;
  skeleton: MapGenerationCommandSkeleton;
  planner?: {
    plan: MapGenerationPromptPlanFromSchema;
    confidence?: PlannerConfidence;
  };
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
  spatialQueries?: {
    renderer?: "maplibre" | "mock";
    cases: SpatialQueryCaseInput[];
    capabilityWaiver?: SpatialQueryCapabilityWaiver;
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

export interface PlannerConfidence {
  level: "high" | "medium" | "low" | "unknown";
  score: number;
  reasons: string[];
}

export interface GenerationPlannerEvidence {
  provided: boolean;
  plannerId: string;
  promptHash: string;
  traceId: string;
  commandTraceId: string;
  retainedRawPrompt: false;
  confidence: PlannerConfidence;
  acceptedIntentFields: string[];
  unsupportedIntentFields: string[];
  sourcePromptHashes: string[];
  diagnosticCounts: Record<Diagnostic["severity"], number>;
}

export type SpatialQueryCaseInput =
  | {
      id: string;
      operation: "point-query";
      point: [number, number];
      layers?: string[];
    }
  | {
      id: string;
      operation: "bbox-query";
      bbox: [number, number, number, number];
      layers?: string[];
    };

export interface SpatialQueryCapabilityWaiver {
  reason: string;
  approvedBy: string;
  followUpTaskId: string;
}

export interface SpatialQueryCapabilityGate {
  status: "passed" | "waived" | "blocked";
  requiredQueries: Array<"point" | "bbox">;
  providedQueries: string[];
  waiver?: SpatialQueryCapabilityWaiver;
}

export interface GenerationSpatialQueryCaseEvidence {
  id: string;
  operation: MapGenerationQueryReadinessOperation;
  layerIds: string[];
  sourceIds: string[];
  featureCount: number;
  resultLimit: number;
  resultTruncated: boolean;
  fixtureHash: string;
  passed: boolean;
  diagnosticCounts: Record<Diagnostic["severity"], number>;
}

export interface GenerationSpatialQueryEvidence {
  requested: boolean;
  ready: boolean;
  renderer: "maplibre" | "mock";
  status: "ready" | "blocked" | "not-requested";
  requestedOperations: MapGenerationAnalysisOperation[];
  acceptedQueryOperations: MapGenerationQueryReadinessOperation[];
  blockedOperations: MapGenerationAnalysisOperation[];
  unsupportedOperations: MapGenerationAnalysisOperation[];
  capabilityQueries: string[];
  capabilityGate: SpatialQueryCapabilityGate;
  queryableSourceIds: string[];
  queryableLayerIds: string[];
  hiddenLayerIds: string[];
  unsupportedSourceIds: string[];
  missingSourceIds: string[];
  cases: GenerationSpatialQueryCaseEvidence[];
  diagnosticCounts: Record<Diagnostic["severity"], number>;
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
  generationEvidence?: ExampleAppGenerationEvidenceSummary;
}

export interface GenerationEvidenceBundle {
  promptHash: string;
  status: "ready" | "blocked";
  targetDomains: MapGenerationTargetDomain[];
  toolSequence: GisEngineToolName[];
  summary: ContextSummary;
  validation: ValidationReport;
  commandEvidence: GenerationCommandEvidence;
  plannerEvidence: GenerationPlannerEvidence;
  spatialQueryEvidence: GenerationSpatialQueryEvidence;
  snapshotEvidence: GenerationSnapshotEvidence;
  exportEvidence: GenerationExportEvidence;
  delivery: ExampleAppDeliverySummary;
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
      diagnostics: toolInputErrorsToDiagnostics(validateInput.errors, "Invalid generation evidence bundle input."),
    };
  }

  const typedInput = input as GenerationEvidenceBundleInput;
  const validation = validateSpec(typedInput.skeleton.spec);
  const summary = getContextSummary({
    spec: typedInput.skeleton.spec,
    ...(typedInput.capabilities ? { capabilities: typedInput.capabilities } : {}),
  });
  const commandEvidence = buildCommandEvidence(typedInput.skeleton);
  const plannerEvidence = buildPlannerEvidence(typedInput, commandEvidence);
  const spatialQueryEvidence = await buildSpatialQueryEvidence(typedInput);
  const snapshotEvidence = await buildSnapshotEvidence(typedInput);
  const exportEvidence = buildExportEvidence(typedInput.skeleton, validation);
  const diagnosticsBeforeExample = [
    ...plannerEvidence.diagnostics,
    ...typedInput.skeleton.diagnostics,
    ...validation.diagnostics,
    ...commandEvidenceDiagnostics(typedInput.skeleton, commandEvidence),
    ...spatialQueryEvidence.diagnostics,
    ...snapshotEvidenceDiagnostics(snapshotEvidence),
  ];
  const visibleDiagnosticsBeforeExample = diagnosticsBeforeExample.filter(
    (diagnostic) => diagnostic.severity === "error" || diagnostic.severity === "warning",
  );
  const statusBeforeExample =
    typedInput.skeleton.status === "blocked" ||
    !validation.valid ||
    plannerEvidence.diagnosticCounts.error > 0 ||
    commandEvidence.diagnosticCounts.error > 0 ||
    spatialQueryEvidence.diagnosticCounts.error > 0 ||
    snapshotEvidence.diagnosticCounts.error > 0
      ? "blocked"
      : "ready";
  const manifestGenerationEvidence = buildExampleManifestGenerationEvidenceSummary({
    input: typedInput,
    summary,
    commandEvidence,
    plannerEvidence,
    spatialQueryEvidence,
    snapshotEvidence,
    exportEvidence,
    status: statusBeforeExample,
    diagnostics: visibleDiagnosticsBeforeExample,
  });
  const exampleEvidence = buildExampleEvidence(typedInput.exampleId ?? "ai-map-edit", manifestGenerationEvidence);
  const diagnostics = [...diagnosticsBeforeExample, ...exampleEvidence.diagnostics];
  const visibleDiagnostics = diagnostics.filter(
    (diagnostic) => diagnostic.severity === "error" || diagnostic.severity === "warning",
  );
  const status = statusBeforeExample === "blocked" || exampleEvidence.diagnosticCounts.error > 0 ? "blocked" : "ready";

  return {
    ok: true,
    result: {
      promptHash: typedInput.promptHash,
      status,
      targetDomains: typedInput.skeleton.targetDomains,
      toolSequence: [
        "get_context_summary",
        "validate_spec",
        "apply_commands",
        "snapshot_spec",
        "export_spec",
        "export_example_app",
      ],
      summary,
      validation,
      commandEvidence,
      plannerEvidence: stripPlannerDiagnostics(plannerEvidence),
      spatialQueryEvidence: stripSpatialQueryDiagnostics(spatialQueryEvidence),
      snapshotEvidence: stripInternalDiagnostics(snapshotEvidence),
      exportEvidence,
      delivery: manifestGenerationEvidence.delivery,
      exampleEvidence: stripExampleDiagnostics(exampleEvidence),
      diagnostics: visibleDiagnostics,
    },
    diagnostics: [],
  };
}

function buildPlannerEvidence(
  input: GenerationEvidenceBundleInput,
  commandEvidence: GenerationCommandEvidence,
): GenerationPlannerEvidence & { diagnostics: Diagnostic[] } {
  const sourcePromptHashes = unique(
    input.skeleton.commands
      .map((command) => command.sourcePromptHash)
      .filter((hash): hash is string => typeof hash === "string" && hash.length > 0),
  );

  if (!input.planner) {
    return {
      provided: false,
      plannerId: "unreported",
      promptHash: input.promptHash,
      traceId: input.skeleton.traceId,
      commandTraceId: commandEvidence.traceId,
      retainedRawPrompt: false,
      confidence: {
        level: "unknown",
        score: 0,
        reasons: ["Planner plan was not provided with this generation evidence bundle."],
      },
      acceptedIntentFields: [],
      unsupportedIntentFields: [],
      sourcePromptHashes,
      diagnosticCounts: zeroDiagnosticCounts(),
      diagnostics: [],
    };
  }

  const diagnostics = [
    ...(input.planner.plan.diagnostics as Diagnostic[]),
    ...plannerHashDiagnostics(input.promptHash, input.planner.plan.provenance.promptHash),
    ...plannerTraceDiagnostics(input.skeleton.traceId, input.planner.plan.traceId),
    ...sourcePromptHashDiagnostics(input.promptHash, sourcePromptHashes),
  ];

  return {
    provided: true,
    plannerId: input.planner.plan.provenance.plannerId,
    promptHash: input.planner.plan.provenance.promptHash,
    traceId: input.planner.plan.traceId,
    commandTraceId: commandEvidence.traceId,
    retainedRawPrompt: input.planner.plan.provenance.retainedRawPrompt,
    confidence: input.planner.confidence ?? plannerConfidenceFromDiagnostics(diagnostics),
    acceptedIntentFields: input.planner.plan.provenance.acceptedIntentFields,
    unsupportedIntentFields: input.planner.plan.provenance.unsupportedIntentFields,
    sourcePromptHashes,
    diagnosticCounts: countDiagnostics(diagnostics),
    diagnostics,
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
      changedPaths: [],
    };
  }

  const result = applyCommandsTool({
    spec: skeleton.baseSpec,
    commands: skeleton.commands,
    collectTrace: true,
    traceId: skeleton.traceId,
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
      changedPaths: [],
    };
  }

  const diagnostics = [
    ...result.result.results.flatMap((commandResult) => commandResult.diagnostics),
    ...specMismatchDiagnostics(skeleton, result.result),
  ];

  return {
    usedApplyCommands: true,
    traceId: result.result.traceId,
    commandCount: skeleton.commands.length,
    resultStatuses: result.result.results.map((commandResult) => commandResult.status),
    committed: result.result.committed,
    rolledBack: result.result.rolledBack,
    diagnosticCounts: countDiagnostics(diagnostics),
    changedPaths: unique(result.result.results.flatMap((commandResult) => commandResult.changedPaths)),
  };
}

function plannerHashDiagnostics(inputPromptHash: string, plannerPromptHash: string): Diagnostic[] {
  return inputPromptHash === plannerPromptHash
    ? []
    : [
        {
          severity: "error",
          code: DiagnosticCodes.SpecInvalidType,
          message: "Generation evidence promptHash must match the planner promptHash.",
          path: "/planner/plan/promptHash",
          fix: {
            kind: "manual",
            confidence: "high",
            message: "Regenerate the evidence bundle with the same promptHash used by the planner.",
          },
        },
      ];
}

function plannerTraceDiagnostics(skeletonTraceId: string, plannerTraceId: string): Diagnostic[] {
  return skeletonTraceId === plannerTraceId
    ? []
    : [
        {
          severity: "error",
          code: DiagnosticCodes.CommandInvalidPatch,
          message: "Generation evidence skeleton traceId must match the planner traceId.",
          path: "/planner/plan/traceId",
          fix: {
            kind: "manual",
            confidence: "high",
            message: "Create the command skeleton from the planner request instead of mixing traces.",
          },
        },
      ];
}

function sourcePromptHashDiagnostics(promptHash: string, sourcePromptHashes: string[]): Diagnostic[] {
  const mismatched = sourcePromptHashes.filter((hash) => hash !== promptHash);
  return mismatched.length === 0
    ? []
    : [
        {
          severity: "error",
          code: DiagnosticCodes.CommandInvalidPatch,
          message: "Generation command sourcePromptHash values must match the evidence promptHash.",
          path: "/skeleton/commands",
          relatedResources: mismatched.map((hash) => ({ kind: "command" as const, id: hash })),
          fix: {
            kind: "manual",
            confidence: "high",
            message: "Regenerate command skeleton commands from the same planner request and prompt hash.",
          },
        },
      ];
}

function plannerConfidenceFromDiagnostics(diagnostics: Diagnostic[]): PlannerConfidence {
  const counts = countDiagnostics(diagnostics);
  if (counts.error > 0) {
    return {
      level: "low",
      score: 0,
      reasons: ["Planner evidence has blocking diagnostics."],
    };
  }
  if (counts.warning > 0) {
    return {
      level: "medium",
      score: 0.7,
      reasons: ["Planner evidence has warnings but no blocking diagnostics."],
    };
  }
  return {
    level: "high",
    score: 1,
    reasons: ["Planner evidence has no diagnostics."],
  };
}

const unsupportedSpatialOperations: MapGenerationAnalysisOperation[] = [
  "aggregation",
  "buffer",
  "intersection",
  "overlay",
  "routing",
];

interface SpatialSpecReadiness {
  queryableSourceIds: string[];
  queryableLayerIds: string[];
  hiddenLayerIds: string[];
  unsupportedSourceIds: string[];
  missingSourceIds: string[];
}

async function buildSpatialQueryEvidence(
  input: GenerationEvidenceBundleInput,
): Promise<GenerationSpatialQueryEvidence & { diagnostics: Diagnostic[] }> {
  const analysisEvidence = input.skeleton.analysisEvidence;
  const renderer = input.spatialQueries?.renderer ?? "mock";
  const capabilityQueries = unique(input.capabilities?.queries ?? []);
  const readiness = summarizeSpatialSpecReadiness(input.skeleton.spec);
  const capabilityGate = buildSpatialQueryCapabilityGate(
    analysisEvidence,
    capabilityQueries,
    input.spatialQueries?.capabilityWaiver,
  );
  const resultLimit = DEFAULT_SPATIAL_QUERY_RESULT_LIMIT;

  if (!analysisEvidence.requested) {
    return {
      requested: false,
      ready: false,
      renderer,
      status: "not-requested",
      requestedOperations: [],
      acceptedQueryOperations: [],
      blockedOperations: [],
      unsupportedOperations: unsupportedSpatialOperations,
      capabilityQueries,
      capabilityGate,
      ...readiness,
      cases: [],
      diagnosticCounts: zeroDiagnosticCounts(),
      diagnostics: [],
    };
  }

  const setupDiagnostics = spatialQuerySetupDiagnostics(input, readiness, capabilityGate);
  const cases =
    input.skeleton.status === "ready" && setupDiagnostics.every((diagnostic) => diagnostic.severity !== "error")
      ? await runSpatialQueryCases(input, readiness, renderer, resultLimit)
      : { evidence: [], diagnostics: [] };
  const diagnostics = [...setupDiagnostics, ...cases.diagnostics];
  const diagnosticCounts = countDiagnostics([...analysisEvidence.diagnostics, ...diagnostics]);
  const caseEvidence = cases.evidence;
  const ready =
    analysisEvidence.status === "ready" &&
    capabilityGate.status !== "blocked" &&
    diagnosticCounts.error === 0 &&
    analysisEvidence.acceptedQueryOperations.length > 0 &&
    caseEvidence.length > 0 &&
    caseEvidence.every((entry) => entry.passed);

  return {
    requested: true,
    ready,
    renderer,
    status: ready ? "ready" : "blocked",
    requestedOperations: analysisEvidence.requestedOperations,
    acceptedQueryOperations: analysisEvidence.acceptedQueryOperations,
    blockedOperations: analysisEvidence.blockedOperations,
    unsupportedOperations: unsupportedSpatialOperations,
    capabilityQueries,
    capabilityGate,
    ...readiness,
    cases: caseEvidence,
    diagnosticCounts,
    diagnostics,
  };
}

function buildSpatialQueryCapabilityGate(
  analysisEvidence: MapGenerationAnalysisEvidence,
  providedQueries: string[],
  waiver: SpatialQueryCapabilityWaiver | undefined,
): SpatialQueryCapabilityGate {
  if (!analysisEvidence.requested || analysisEvidence.acceptedQueryOperations.length === 0) {
    return {
      status: "passed",
      requiredQueries: [],
      providedQueries,
    };
  }

  const requiredQueries = uniqueSpatialQueryTypes(
    analysisEvidence.acceptedQueryOperations.map(queryTypeForAnalysisOperation),
  );
  const missingQueries = requiredQueries.filter((query) => !providedQueries.includes(query));
  if (missingQueries.length === 0) {
    return {
      status: "passed",
      requiredQueries,
      providedQueries,
    };
  }

  if (waiver) {
    return {
      status: "waived",
      requiredQueries,
      providedQueries,
      waiver,
    };
  }

  return {
    status: "blocked",
    requiredQueries,
    providedQueries,
  };
}

function spatialQuerySetupDiagnostics(
  input: GenerationEvidenceBundleInput,
  readiness: SpatialSpecReadiness,
  capabilityGate: SpatialQueryCapabilityGate,
): Diagnostic[] {
  const analysisEvidence = input.skeleton.analysisEvidence;
  if (!analysisEvidence.requested || analysisEvidence.acceptedQueryOperations.length === 0) return [];

  const diagnostics: Diagnostic[] = [];
  const cases = input.spatialQueries?.cases ?? [];

  if (capabilityGate.status === "blocked") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: `Spatial query evidence requires explicit adapter query capabilities or a waiver for: ${capabilityGate.requiredQueries.join(", ")}.`,
      path: "/capabilities/queries",
      relatedResources: input.capabilities ? [{ kind: "adapter", id: input.capabilities.renderer }] : [],
      fix: {
        kind: "manual",
        confidence: "high",
        message:
          "Declare point and bbox query capabilities for the adapter, or provide an explicit spatial query capability waiver with a follow-up task.",
      },
    });
  }

  if (readiness.queryableLayerIds.length === 0) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: "Spatial query evidence requires at least one visible layer backed by inline GeoJSON data.",
      path: "/skeleton/spec/layers",
      fix: {
        kind: "manual",
        confidence: "high",
        message: "Add a visible layer with an inline GeoJSON source before claiming point or bbox query readiness.",
      },
    });
  }

  if (cases.length === 0) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: "Spatial query evidence requires at least one point-query or bbox-query case.",
      path: "/spatialQueries/cases",
      fix: {
        kind: "manual",
        confidence: "high",
        message: "Add deterministic point-query or bbox-query cases to the generation evidence bundle.",
      },
    });
  }

  return diagnostics;
}

async function runSpatialQueryCases(
  input: GenerationEvidenceBundleInput,
  readiness: SpatialSpecReadiness,
  renderer: "maplibre" | "mock",
  resultLimit: number,
): Promise<{ evidence: GenerationSpatialQueryCaseEvidence[]; diagnostics: Diagnostic[] }> {
  const cases = input.spatialQueries?.cases ?? [];
  if (cases.length === 0) return { evidence: [], diagnostics: [] };

  const diagnostics: Diagnostic[] = [];
  const evidenceByIndex = new Array<GenerationSpatialQueryCaseEvidence | undefined>(cases.length);
  const pendingCases: Array<{ queryCase: SpatialQueryCaseInput; index: number }> = [];

  for (const [index, queryCase] of cases.entries()) {
    const operationDiagnostics = spatialQueryCaseOperationDiagnostics(input, queryCase, index);
    if (operationDiagnostics.length > 0) {
      diagnostics.push(...operationDiagnostics);
      evidenceByIndex[index] = emptySpatialQueryCaseEvidence(
        input.skeleton.spec,
        readiness,
        queryCase,
        operationDiagnostics,
        resultLimit,
      );
    } else {
      pendingCases.push({ queryCase, index });
    }
  }

  if (pendingCases.length === 0) {
    return { evidence: compactSpatialQueryCaseEvidence(evidenceByIndex), diagnostics };
  }

  const adapter = createHeadlessAdapter(renderer);
  let runtime: MapRuntime | undefined;

  try {
    runtime = await MapRuntime.create(input.skeleton.spec, {
      adapter,
      container: createHeadlessContainer(),
    });

    for (const { queryCase, index } of pendingCases) {
      const result = await runtime.queryFeatures(queryOptionsForSpatialQueryCase(readiness, queryCase));
      const caseDiagnostics = result.diagnostics.map((diagnostic) =>
        prefixSpatialQueryCaseDiagnostic(diagnostic, index),
      );
      if (result.features.length === 0 && caseDiagnostics.every((diagnostic) => diagnostic.severity !== "error")) {
        caseDiagnostics.push(spatialQueryEmptyResultDiagnostic(input.skeleton.spec, readiness, queryCase, index));
      }
      diagnostics.push(...caseDiagnostics);
      evidenceByIndex[index] = spatialQueryCaseEvidence(
        input.skeleton.spec,
        readiness,
        queryCase,
        result,
        caseDiagnostics,
        resultLimit,
      );
    }

    return { evidence: compactSpatialQueryCaseEvidence(evidenceByIndex), diagnostics };
  } catch (error) {
    return {
      evidence: compactSpatialQueryCaseEvidence(evidenceByIndex),
      diagnostics: [...diagnostics, spatialQueryRuntimeDiagnostic(error)],
    };
  } finally {
    if (runtime) {
      await runtime.destroy();
    } else {
      await adapter.destroy();
    }
  }
}

function spatialQueryCaseOperationDiagnostics(
  input: GenerationEvidenceBundleInput,
  queryCase: SpatialQueryCaseInput,
  index: number,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  if (!input.skeleton.analysisEvidence.acceptedQueryOperations.includes(queryCase.operation)) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: `Spatial query case "${queryCase.id}" uses operation "${queryCase.operation}" that was not accepted by the planner request.`,
      path: `/spatialQueries/cases/${index}/operation`,
      fix: {
        kind: "manual",
        confidence: "high",
        message: "Keep spatial query cases aligned with accepted point-query and bbox-query planner operations.",
      },
    });
  }

  for (const [layerIndex, layerId] of (queryCase.layers ?? []).entries()) {
    const layer = input.skeleton.spec.layers.find((entry) => entry.id === layerId);
    if (!layer) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.LayerNotFound,
        message: `Spatial query case "${queryCase.id}" targets missing layer "${layerId}".`,
        path: `/spatialQueries/cases/${index}/layers/${layerIndex}`,
        relatedResources: [{ kind: "layer", id: layerId }],
        fix: {
          kind: "manual",
          confidence: "high",
          message: "Check the query layer id or omit layers to query all queryable layers.",
        },
      });
      continue;
    }

    if (layer.source && !input.skeleton.spec.sources[layer.source]) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SourceNotFound,
        message: `Spatial query case "${queryCase.id}" targets layer "${layerId}" with missing source "${layer.source}".`,
        path: `/spatialQueries/cases/${index}/layers/${layerIndex}/source`,
        relatedResources: [
          { kind: "layer", id: layerId },
          { kind: "source", id: layer.source },
        ],
        fix: {
          kind: "manual",
          confidence: "medium",
          message: "Add the missing source or query a layer with an existing source.",
        },
      });
      continue;
    }

    if (layer?.layout?.visibility === "none") {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.CapabilityUnsupported,
        message: `Spatial query case "${queryCase.id}" targets hidden layer "${layerId}".`,
        path: `/spatialQueries/cases/${index}/layers/${layerIndex}`,
        relatedResources: [{ kind: "layer", id: layerId }],
        fix: {
          kind: "manual",
          confidence: "high",
          message: "Query a visible layer, or make the layer visible before claiming query readiness evidence.",
        },
      });
    }
  }

  return diagnostics;
}

function compactSpatialQueryCaseEvidence(
  evidenceByIndex: Array<GenerationSpatialQueryCaseEvidence | undefined>,
): GenerationSpatialQueryCaseEvidence[] {
  return evidenceByIndex.filter((entry): entry is GenerationSpatialQueryCaseEvidence => entry !== undefined);
}

function emptySpatialQueryCaseEvidence(
  spec: MapSpec,
  readiness: SpatialSpecReadiness,
  queryCase: SpatialQueryCaseInput,
  diagnostics: Diagnostic[],
  resultLimit: number,
): GenerationSpatialQueryCaseEvidence {
  return {
    id: queryCase.id,
    operation: queryCase.operation,
    layerIds: selectedLayerIdsForCase(spec, readiness, queryCase),
    sourceIds: selectedSourceIdsForCase(spec, readiness, queryCase),
    featureCount: 0,
    resultLimit,
    resultTruncated: false,
    fixtureHash: spatialQueryFixtureHash(spec, readiness, queryCase, resultLimit),
    passed: false,
    diagnosticCounts: countDiagnostics(diagnostics),
  };
}

function spatialQueryCaseEvidence(
  spec: MapSpec,
  readiness: SpatialSpecReadiness,
  queryCase: SpatialQueryCaseInput,
  result: FeatureQueryResult,
  diagnostics: Diagnostic[],
  resultLimit: number,
): GenerationSpatialQueryCaseEvidence {
  const counts = countDiagnostics(diagnostics);
  return {
    id: queryCase.id,
    operation: queryCase.operation,
    layerIds: selectedLayerIdsForCase(spec, readiness, queryCase),
    sourceIds: selectedSourceIdsForCase(spec, readiness, queryCase),
    featureCount: result.features.length,
    resultLimit,
    resultTruncated: result.features.length > resultLimit,
    fixtureHash: spatialQueryFixtureHash(spec, readiness, queryCase, resultLimit),
    passed: counts.error === 0,
    diagnosticCounts: counts,
  };
}

function spatialQueryFixtureHash(
  spec: MapSpec,
  readiness: SpatialSpecReadiness,
  queryCase: SpatialQueryCaseInput,
  resultLimit: number,
): string {
  const fixture = {
    id: queryCase.id,
    operation: queryCase.operation,
    query: queryCase.operation === "point-query" ? { point: queryCase.point } : { bbox: queryCase.bbox },
    requestedLayerIds: queryCase.layers ?? [],
    layerIds: selectedLayerIdsForCase(spec, readiness, queryCase),
    sourceIds: selectedSourceIdsForCase(spec, readiness, queryCase),
    resultLimit,
  };
  return `sha256:${createHash("sha256").update(JSON.stringify(fixture)).digest("hex")}`;
}

function spatialQueryEmptyResultDiagnostic(
  spec: MapSpec,
  readiness: SpatialSpecReadiness,
  queryCase: SpatialQueryCaseInput,
  index: number,
): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.CapabilityUnsupported,
    message: `Spatial query case "${queryCase.id}" returned no features.`,
    path: `/spatialQueries/cases/${index}/result`,
    relatedResources: [
      ...selectedLayerIdsForCase(spec, readiness, queryCase).map((layerId) => ({
        kind: "layer" as const,
        id: layerId,
      })),
      ...selectedSourceIdsForCase(spec, readiness, queryCase).map((sourceId) => ({
        kind: "source" as const,
        id: sourceId,
      })),
    ],
    fix: {
      kind: "manual",
      confidence: "medium",
      message:
        "Use a deterministic query case that returns at least one feature, or keep the case as blocked evidence.",
    },
  };
}

function queryOptionsForSpatialQueryCase(
  readiness: SpatialSpecReadiness,
  queryCase: SpatialQueryCaseInput,
): QueryFeaturesOptions {
  const layers = queryCase.layers ?? readiness.queryableLayerIds;
  return queryCase.operation === "point-query"
    ? {
        point: queryCase.point,
        ...(layers.length > 0 ? { layers } : {}),
      }
    : {
        bbox: queryCase.bbox,
        ...(layers.length > 0 ? { layers } : {}),
      };
}

function summarizeSpatialSpecReadiness(spec: MapSpec): SpatialSpecReadiness {
  const queryableSourceIds = new Set<string>();
  const queryableLayerIds: string[] = [];
  const hiddenLayerIds: string[] = [];
  const unsupportedSourceIds = new Set<string>();
  const missingSourceIds = new Set<string>();

  for (const layer of spec.layers) {
    if (!layer.source) continue;
    if (layer.layout?.visibility === "none") {
      hiddenLayerIds.push(layer.id);
      continue;
    }

    const source = spec.sources[layer.source];
    if (!source) {
      missingSourceIds.add(layer.source);
      continue;
    }

    if (source.type === "geojson" && typeof source.data !== "string") {
      queryableSourceIds.add(layer.source);
      queryableLayerIds.push(layer.id);
      continue;
    }

    unsupportedSourceIds.add(layer.source);
  }

  return {
    queryableSourceIds: unique([...queryableSourceIds]),
    queryableLayerIds: unique(queryableLayerIds),
    hiddenLayerIds: unique(hiddenLayerIds),
    unsupportedSourceIds: unique([...unsupportedSourceIds]),
    missingSourceIds: unique([...missingSourceIds]),
  };
}

function selectedLayerIdsForCase(
  spec: MapSpec,
  readiness: SpatialSpecReadiness,
  queryCase: SpatialQueryCaseInput,
): string[] {
  return unique(
    queryCase.layers ??
      readiness.queryableLayerIds.filter((layerId) => spec.layers.some((layer) => layer.id === layerId)),
  );
}

function selectedSourceIdsForCase(
  spec: MapSpec,
  readiness: SpatialSpecReadiness,
  queryCase: SpatialQueryCaseInput,
): string[] {
  if (!queryCase.layers) return readiness.queryableSourceIds;
  return unique(
    queryCase.layers
      .map((layerId) => spec.layers.find((layer) => layer.id === layerId)?.source)
      .filter((sourceId): sourceId is string => typeof sourceId === "string" && sourceId.length > 0),
  );
}

function queryTypeForAnalysisOperation(operation: MapGenerationQueryReadinessOperation): "point" | "bbox" {
  return operation === "point-query" ? "point" : "bbox";
}

function prefixSpatialQueryCaseDiagnostic(diagnostic: Diagnostic, index: number): Diagnostic {
  const suffix = diagnostic.path && diagnostic.path !== "/" ? diagnostic.path : "";
  return {
    ...diagnostic,
    path: `/spatialQueries/cases/${index}${suffix}`,
  };
}

function spatialQueryRuntimeDiagnostic(error: unknown): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.RenderAdapterError,
    message: error instanceof Error ? error.message : "Renderer adapter failed while creating spatial query evidence.",
    path: "/spatialQueries",
  };
}

function createHeadlessAdapter(renderer: "maplibre" | "mock"): RendererAdapter {
  return renderer === "mock" ? new MockAdapter() : new MapLibreAdapter();
}

async function buildSnapshotEvidence(
  input: GenerationEvidenceBundleInput,
): Promise<GenerationSnapshotEvidence & { diagnostics: Diagnostic[] }> {
  const renderer = input.snapshot?.renderer ?? "maplibre";
  if (input.skeleton.status === "blocked") {
    return {
      requested: false,
      renderer,
      passed: false,
      dataUrlPresent: false,
      diagnosticCounts: zeroDiagnosticCounts(),
      diagnostics: [],
    };
  }

  const response = await snapshotSpecTool({
    spec: input.skeleton.spec,
    renderer,
    ...(input.snapshot?.options ? { snapshot: input.snapshot.options } : {}),
  });

  if (!response.ok) {
    return {
      requested: true,
      renderer,
      passed: false,
      dataUrlPresent: false,
      diagnosticCounts: countDiagnostics(response.diagnostics),
      diagnostics: response.diagnostics,
    };
  }

  return {
    requested: true,
    renderer: response.result.renderer,
    passed: response.result.passed,
    dataUrlPresent: typeof response.result.dataUrl === "string" && response.result.dataUrl.length > 0,
    diagnosticCounts: countDiagnostics(response.result.diagnostics),
    result: response.result,
    diagnostics: response.result.diagnostics,
  };
}

function buildExportEvidence(
  skeleton: MapGenerationCommandSkeleton,
  validation: ValidationReport,
): GenerationExportEvidence {
  return {
    ready: skeleton.status === "ready" && validation.valid,
    ...(skeleton.spec.revision ? { revision: skeleton.spec.revision } : {}),
    sourceCount: Object.keys(skeleton.spec.sources).length,
    layerCount: skeleton.spec.layers.length,
    diagnosticCounts: countDiagnostics(validation.diagnostics),
  };
}

function buildExampleManifestGenerationEvidenceSummary(input: {
  input: GenerationEvidenceBundleInput;
  summary: ContextSummary;
  commandEvidence: GenerationCommandEvidence;
  plannerEvidence: GenerationPlannerEvidence;
  spatialQueryEvidence: GenerationSpatialQueryEvidence;
  snapshotEvidence: GenerationSnapshotEvidence;
  exportEvidence: GenerationExportEvidence;
  status: "ready" | "blocked";
  diagnostics: Diagnostic[];
}): ExampleAppGenerationEvidenceSummary {
  const sceneBrowsing = buildSceneBrowsingManifestSummary(input.input, input.summary, input.status, input.diagnostics);
  const delivery = buildDeliverySummary({
    input: input.input,
    status: input.status,
    commandEvidence: input.commandEvidence,
    plannerEvidence: input.plannerEvidence,
    spatialQueryEvidence: input.spatialQueryEvidence,
    snapshotEvidence: input.snapshotEvidence,
    exportEvidence: input.exportEvidence,
    sceneBrowsing,
    diagnostics: input.diagnostics,
  });

  return {
    promptHash: input.input.promptHash,
    status: input.status,
    delivery,
    targetDomains: input.input.skeleton.targetDomains,
    toolSequence: [
      "get_context_summary",
      "validate_spec",
      "apply_commands",
      "snapshot_spec",
      "export_spec",
      "export_example_app",
    ],
    diagnosticCounts: countDiagnostics(input.diagnostics),
    command: {
      usedApplyCommands: input.commandEvidence.usedApplyCommands,
      commandCount: input.commandEvidence.commandCount,
      committed: input.commandEvidence.committed,
      rolledBack: input.commandEvidence.rolledBack,
    },
    planner: {
      provided: input.plannerEvidence.provided,
      confidenceLevel: input.plannerEvidence.confidence.level,
      unsupportedIntentCount: input.plannerEvidence.unsupportedIntentFields.length,
    },
    spatialQuery: {
      requested: input.spatialQueryEvidence.requested,
      ready: input.spatialQueryEvidence.ready,
      status: input.spatialQueryEvidence.status,
      caseCount: input.spatialQueryEvidence.cases.length,
      blockedOperations: input.spatialQueryEvidence.blockedOperations,
    },
    sceneBrowsing,
    snapshot: {
      requested: input.snapshotEvidence.requested,
      renderer: input.snapshotEvidence.renderer,
      passed: input.snapshotEvidence.passed,
    },
    export: {
      ready: input.exportEvidence.ready,
      sourceCount: input.exportEvidence.sourceCount,
      layerCount: input.exportEvidence.layerCount,
    },
  };
}

function buildSceneBrowsingManifestSummary(
  input: GenerationEvidenceBundleInput,
  summary: ContextSummary,
  status: "ready" | "blocked",
  diagnostics: Diagnostic[],
): ExampleAppGenerationEvidenceSummary["sceneBrowsing"] {
  const diagnosticBlockerCodes = uniqueScene3DStableRuntimeBlockerCodes(
    diagnostics.map((diagnostic) => diagnostic.blockerCode).filter(isScene3DStableRuntimeBlockerCode),
  );
  const requested =
    input.skeleton.targetDomains.includes("scene-browsing") ||
    summary.scene3d !== undefined ||
    diagnosticBlockerCodes.length > 0;
  const stableRuntimeBlockerCodes = requested
    ? uniqueScene3DStableRuntimeBlockerCodes([
        ...diagnosticBlockerCodes,
        ...Object.values(Scene3DStableRuntimeBlockerCodes),
      ])
    : [];

  return {
    requested,
    status: !requested
      ? "not-requested"
      : status === "blocked" || diagnosticBlockerCodes.length > 0
        ? "blocked"
        : "experimental",
    extensionPresent: summary.scene3d !== undefined,
    stableViewMode: false,
    runtimeSupported: false,
    stableRuntimeBlocked: true,
    state: !requested
      ? "not-requested"
      : status === "blocked" || diagnosticBlockerCodes.length > 0
        ? "blocked"
        : "extension-only",
    sourceCount: summary.scene3d?.sourceCount ?? 0,
    layerCount: summary.scene3d?.layerCount ?? 0,
    sourceIds: summary.scene3d?.sources.map((source) => source.id) ?? [],
    layerIds: summary.scene3d?.layers.map((layer) => layer.id) ?? [],
    pickableLayerCount: summary.scene3d?.pickableLayerCount ?? 0,
    mockSnapshotPassed: summary.scene3d?.snapshot.mockPassed ?? false,
    mockQueryPickCount: summary.scene3d?.query.pickCount ?? 0,
    stableRuntimeBlockerCodes,
  };
}

function buildDeliverySummary(input: {
  input: GenerationEvidenceBundleInput;
  status: "ready" | "blocked";
  commandEvidence: GenerationCommandEvidence;
  plannerEvidence: GenerationPlannerEvidence;
  spatialQueryEvidence: GenerationSpatialQueryEvidence;
  snapshotEvidence: GenerationSnapshotEvidence;
  exportEvidence: GenerationExportEvidence;
  sceneBrowsing: ExampleAppGenerationEvidenceSummary["sceneBrowsing"];
  diagnostics: Diagnostic[];
}): ExampleAppDeliverySummary {
  const sourceReadiness = buildSourceReadiness(input.input.skeleton.spec);
  const sourcePromotionCandidates = buildSourcePromotionCandidates(sourceReadiness);
  const spatialQueryReadiness = buildSpatialQueryDeliveryReadiness(input.spatialQueryEvidence);
  const confirmations = buildDeliveryConfirmations(sourceReadiness);
  const confirmationRequired = confirmations.some((confirmation) => confirmation.required);
  const followUps = buildDeliveryFollowUps(input, sourceReadiness);
  const sourceBlockerCount = sourceReadiness.filter((source) => source.state === "blocked").length;
  const status = deliveryStatus(
    sourceBlockerCount > 0 ? "blocked" : input.status,
    confirmationRequired,
    followUps.length,
  );
  const dataAndAnalysisBlockerCount = input.spatialQueryEvidence.diagnosticCounts.error + sourceBlockerCount;
  const dataAndAnalysisFollowUpCount = dataSectionFollowUpCount(followUps);
  const sceneBrowsingBlockerCount =
    input.sceneBrowsing.status === "blocked"
      ? Math.max(input.sceneBrowsing.stableRuntimeBlockerCodes.length, sceneBlockerDiagnosticCount(input.diagnostics))
      : 0;
  const dataConfirmationRequired = confirmations.some(
    (confirmation) =>
      confirmation.required &&
      (confirmation.reason === "external-resource" ||
        confirmation.reason === "network-fetch" ||
        confirmation.reason === "archive-parsing" ||
        confirmation.reason === "worker-use"),
  );

  return {
    status,
    acceptance: {
      state: status,
      ready: status === "ready",
      blocked: status === "blocked",
      needsConfirmation: status === "needs-confirmation",
      followUpRequired: status === "follow-up-required",
    },
    sections: [
      {
        id: "readiness",
        status,
        blockerCount: countDiagnostics(input.diagnostics).error,
        confirmationRequired,
        followUpCount: followUps.length,
      },
      {
        id: "files",
        status: "ready",
        blockerCount: 0,
        confirmationRequired: false,
        followUpCount: 0,
      },
      {
        id: "map-edits",
        status: input.commandEvidence.diagnosticCounts.error > 0 ? "blocked" : "ready",
        blockerCount: input.commandEvidence.diagnosticCounts.error,
        confirmationRequired: false,
        followUpCount: followUps.filter((followUp) => followUp.id.startsWith("planner.")).length,
      },
      {
        id: "data-and-analysis",
        status:
          dataAndAnalysisBlockerCount > 0
            ? "blocked"
            : dataConfirmationRequired
              ? "needs-confirmation"
              : dataAndAnalysisFollowUpCount > 0
                ? "follow-up-required"
                : "ready",
        blockerCount: dataAndAnalysisBlockerCount,
        confirmationRequired: dataConfirmationRequired,
        followUpCount: dataAndAnalysisFollowUpCount,
      },
      {
        id: "scene-browsing",
        status:
          sceneBrowsingBlockerCount > 0 ? "blocked" : input.sceneBrowsing.requested ? "follow-up-required" : "ready",
        blockerCount: sceneBrowsingBlockerCount,
        confirmationRequired: false,
        followUpCount: followUps.filter((followUp) => followUp.id.startsWith("scene-browsing.")).length,
      },
    ],
    confirmations,
    confirmationRequired,
    followUps,
    sourceReadiness,
    sourcePromotionCandidates,
    spatialQueryReadiness,
  };
}

function buildSpatialQueryDeliveryReadiness(
  spatialQueryEvidence: GenerationSpatialQueryEvidence,
): ExampleAppDeliverySummary["spatialQueryReadiness"] {
  const followUpTaskIds = spatialQueryEvidence.capabilityGate.waiver
    ? [spatialQueryEvidence.capabilityGate.waiver.followUpTaskId]
    : [];
  const passedCaseCount = spatialQueryEvidence.cases.filter(
    (entry) => entry.passed && entry.diagnosticCounts.error === 0,
  ).length;
  const failedCaseCount = spatialQueryEvidence.cases.length - passedCaseCount;
  const blockerCount = spatialQueryEvidence.diagnosticCounts.error;
  const state = !spatialQueryEvidence.requested
    ? "not-requested"
    : blockerCount > 0 || spatialQueryEvidence.status === "blocked"
      ? "blocked"
      : followUpTaskIds.length > 0
        ? "follow-up-required"
        : "ready";

  return {
    requested: spatialQueryEvidence.requested,
    state,
    status: spatialQueryEvidence.status,
    capabilityGateStatus: spatialQueryEvidence.capabilityGate.status,
    requiredQueries: spatialQueryEvidence.capabilityGate.requiredQueries,
    providedQueries: spatialQueryEvidence.capabilityGate.providedQueries,
    caseCount: spatialQueryEvidence.cases.length,
    passedCaseCount,
    failedCaseCount,
    resultLimit: spatialQueryEvidence.cases[0]?.resultLimit ?? DEFAULT_SPATIAL_QUERY_RESULT_LIMIT,
    resultTruncated: spatialQueryEvidence.cases.some((entry) => entry.resultTruncated),
    blockerCount,
    followUpCount: followUpTaskIds.length,
    followUpTaskIds,
    queryableLayerIds: spatialQueryEvidence.queryableLayerIds,
    queryableSourceIds: spatialQueryEvidence.queryableSourceIds,
    unsupportedSourceIds: spatialQueryEvidence.unsupportedSourceIds,
    missingSourceIds: spatialQueryEvidence.missingSourceIds,
    hiddenLayerIds: spatialQueryEvidence.hiddenLayerIds,
    blockedOperations: spatialQueryEvidence.blockedOperations,
    cases: spatialQueryEvidence.cases.map((entry) => ({
      id: entry.id,
      state: entry.passed && entry.diagnosticCounts.error === 0 ? "ready" : "blocked",
      operation: entry.operation,
      layerIds: entry.layerIds,
      sourceIds: entry.sourceIds,
      featureCount: entry.featureCount,
      resultLimit: entry.resultLimit,
      resultTruncated: entry.resultTruncated,
      fixtureHash: entry.fixtureHash,
      diagnosticCounts: entry.diagnosticCounts,
    })),
  };
}

function deliveryStatus(
  status: "ready" | "blocked",
  confirmationRequired: boolean,
  followUpCount: number,
): ExampleAppDeliverySummary["status"] {
  if (status === "blocked") return "blocked";
  if (confirmationRequired) return "needs-confirmation";
  if (followUpCount > 0) return "follow-up-required";
  return "ready";
}

function buildSourceReadiness(spec: MapSpec): ExampleAppDeliverySummary["sourceReadiness"] {
  const sourceMap = new Map(Object.entries(spec.sources));
  return createSourceReadinessReport(spec).sources.map((readiness) => {
    const source = sourceMap.get(readiness.sourceId);
    const confirmationReasons = sourceConfirmationReasons(source);
    const archiveContract = sourceArchiveContract(source);

    return {
      sourceId: readiness.sourceId,
      type: readiness.type,
      state: readiness.state,
      queryReady: readiness.queryReady,
      resourcePolicy: readiness.resourcePolicy,
      confirmationReasons,
      ...(archiveContract ? { archiveContract } : {}),
      ...(readiness.runtimeLoadPlan
        ? { runtimeLoadPlan: summarizePMTilesRuntimeLoadPlan(readiness.runtimeLoadPlan) }
        : {}),
      notes: sourceReadinessNotes(readiness, source),
    };
  });
}

function summarizePMTilesRuntimeLoadPlan(
  plan: SourceRuntimeReadinessSummary,
): NonNullable<ExampleAppDeliverySummary["sourceReadiness"][number]["runtimeLoadPlan"]> {
  return {
    status: plan.status,
    sourceLayerIds: plan.sourceLayerIds,
    diagnosticCounts: plan.diagnosticCounts,
    requirements: plan.requirements,
  };
}

function sourceReadinessNotes(
  readiness: SourceReadinessEntry,
  source: MapSpec["sources"][string] | undefined,
): ExampleAppDeliverySummary["sourceReadiness"][number]["notes"] {
  if (source?.type === "geojson" && typeof source.data !== "string") {
    return ["Inline GeoJSON is schema-valid, display-ready, and eligible for deterministic point/bbox query evidence."];
  }

  if (source?.type === "geojson") {
    return [
      "URL GeoJSON is display/export ready, but headless query evidence must not fetch it without a future loader contract.",
    ];
  }

  if (source?.type === "pmtiles") {
    return [
      "PMTiles is URL-compatible for display/export evidence, while archive parsing and feature query support remain future contracts.",
      ...(readiness.state === "blocked"
        ? [
            "PMTiles runtime load-plan preflight is blocked; fix resource policy, source-layer metadata, or archive policy diagnostics before delivery.",
          ]
        : []),
    ];
  }

  if (source?.type === "raster") {
    return ["Raster tiles are display/export ready; feature query and raster sampling remain blocked future work."];
  }

  if (source?.type === "vector") {
    return [
      "Vector tile URLs are display/export ready; headless feature query support requires a future tile decode contract.",
    ];
  }

  return [...readiness.limitations, readiness.nextAction];
}

function buildSourcePromotionCandidates(
  sourceReadiness: ExampleAppDeliverySummary["sourceReadiness"],
): NonNullable<ExampleAppDeliverySummary["sourcePromotionCandidates"]> {
  return sourceReadiness.flatMap((source) => {
    if (source.state === "supported") return [];
    const definition =
      sourcePromotionCandidateDefinitions[source.type as keyof typeof sourcePromotionCandidateDefinitions];
    if (!definition) return [];
    const archiveContract =
      source.archiveContract ?? (source.type === "pmtiles" ? createPmtilesArchiveContract() : undefined);

    return [
      {
        candidateId: `source-promotion.${source.type}.${source.sourceId}`,
        format: definition.format,
        state: source.state,
        resourcePolicy: source.resourcePolicy ?? "not-checked",
        ...(archiveContract ? { archiveContract } : {}),
        target: definition.target,
        exitCondition: definition.exitCondition,
        sourceIds: [source.sourceId],
        notes: [...source.notes, definition.note],
      },
    ];
  });
}

const sourcePromotionCandidateDefinitions = {
  pmtiles: {
    format: "pmtiles",
    target: "PMTiles archive metadata promotion gate",
    exitCondition:
      "Schema, resource-policy, and manifest evidence must prove archive metadata is explicit while archive parsing and feature query remain blocked.",
    note: "Promote only one format at a time; archive parsing stays blocked until the gate passes.",
  },
  geoparquet: {
    format: "geoparquet",
    target: "GeoParquet runtime/query promotion gate",
    exitCondition:
      "Public MapSpec schema wiring is already in place; read-only query fixtures, resource policy, and runtime-blocker diagnostics must pass before display or query support is promoted.",
    note: "Public MapSpec schema is wired; runtime loading remains blocked until read-only evidence lands.",
  },
  flatgeobuf: {
    format: "flatgeobuf",
    target: "FlatGeobuf runtime/query promotion gate",
    exitCondition:
      "Public MapSpec schema wiring is already in place; read-only query fixtures, stream/index diagnostics, resource policy, and deterministic negative fixtures must pass before runtime loading is promoted.",
    note: "Public MapSpec schema is wired; runtime loading remains blocked until read-only evidence lands.",
  },
  geotiff: {
    format: "geotiff",
    target: "GeoTIFF raster source gate",
    exitCondition:
      "Raster schema, band/CRS/no-data diagnostics, resource policy, and snapshot strategy must land before display/export is promoted.",
    note: "Raster sampling stays blocked until display evidence exists.",
  },
  geozarr: {
    format: "geozarr",
    target: "GeoZarr array source gate",
    exitCondition:
      "Array-store schema, chunk policy, worker budget, and blocked query/sampling diagnostics must land before runtime support is promoted.",
    note: "Chunked array support stays blocked until deterministic fixtures exist.",
  },
} as const;

function sourceArchiveContract(
  source: MapSpec["sources"][string] | undefined,
): ExampleAppDeliverySummary["sourceReadiness"][number]["archiveContract"] | undefined {
  if (source?.type !== "pmtiles") return undefined;
  return createPmtilesArchiveContract();
}

function createPmtilesArchiveContract(): NonNullable<
  ExampleAppDeliverySummary["sourceReadiness"][number]["archiveContract"]
> {
  return {
    state: "explicit",
    metadataFields: [
      "specVersion",
      "archiveBytes",
      "rootDirectoryOffset",
      "rootDirectoryLength",
      "hasVectorTiles",
      "hasRasterTiles",
      "tileType",
      "minZoom",
      "maxZoom",
      "bounds",
    ],
    policyFields: ["maxArchiveBytes", "maxRootDirectoryBytes", "allowRangeRequests", "maxRangeSegments", "timeoutMs"],
  };
}

function sourceConfirmationReasons(
  source: MapSpec["sources"][string] | undefined,
): ExampleAppDeliverySummary["sourceReadiness"][number]["confirmationReasons"] {
  if (!source) return [];
  const urls = sourceUrls(source);
  const reasons = new Set<ExampleAppDeliverySummary["sourceReadiness"][number]["confirmationReasons"][number]>();
  if (urls.length > 0) reasons.add("external-resource");
  if (urls.some(isRemoteUrl)) reasons.add("network-fetch");
  if (source.type === "pmtiles") reasons.add("archive-parsing");
  return [...reasons];
}

function sourceUrls(source: MapSpec["sources"][string]): string[] {
  if (source.type === "geojson" && typeof source.data === "string") return [source.data];
  if (source.type === "raster") return source.tiles;
  if (source.type === "pmtiles") return [source.url];
  if (source.type === "vector") return "url" in source ? [source.url] : source.tiles;
  return [];
}

function isRemoteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function buildDeliveryConfirmations(
  sourceReadiness: ExampleAppDeliverySummary["sourceReadiness"],
): ExampleAppDeliverySummary["confirmations"] {
  const sourcesByReason = (reason: ExampleAppDeliverySummary["confirmations"][number]["reason"]): string[] =>
    sourceReadiness.filter((source) => source.confirmationReasons.includes(reason)).map((source) => source.sourceId);

  const externalSourceIds = sourcesByReason("external-resource");
  const networkSourceIds = sourcesByReason("network-fetch");
  const archiveSourceIds = sourcesByReason("archive-parsing");

  return [
    {
      reason: "external-resource",
      required: externalSourceIds.length > 0,
      target: "MapSpec.sources URL-bearing entries",
      ...(externalSourceIds.length > 0 ? { sourceIds: externalSourceIds } : {}),
    },
    {
      reason: "network-fetch",
      required: networkSourceIds.length > 0,
      target: "future resource loader fetch",
      ...(networkSourceIds.length > 0 ? { sourceIds: networkSourceIds } : {}),
    },
    {
      reason: "archive-parsing",
      required: archiveSourceIds.length > 0,
      target: "future archive parser or range reader",
      ...(archiveSourceIds.length > 0 ? { sourceIds: archiveSourceIds } : {}),
    },
    {
      reason: "worker-use",
      required: false,
      target: "future worker-backed data decode",
    },
    {
      reason: "file-write",
      required: false,
      target: "export_example_app manifest output",
    },
  ];
}

function buildDeliveryFollowUps(
  input: {
    plannerEvidence: GenerationPlannerEvidence;
    spatialQueryEvidence: GenerationSpatialQueryEvidence;
    sceneBrowsing: ExampleAppGenerationEvidenceSummary["sceneBrowsing"];
  },
  sourceReadiness: ExampleAppDeliverySummary["sourceReadiness"],
): ExampleAppDeliverySummary["followUps"] {
  const followUps: ExampleAppDeliverySummary["followUps"] = [];

  for (const field of input.plannerEvidence.unsupportedIntentFields) {
    followUps.push({
      id: `planner.unsupported-intent.${field}`,
      owner: "@ai-agent",
      targetArtifact: "packages/ai/src/tools/generationEvidence.ts",
      reason: `Planner intent field "${field}" is not accepted by the current generation contract.`,
    });
  }

  for (const operation of input.spatialQueryEvidence.blockedOperations) {
    followUps.push({
      id: `analysis.blocked-operation.${operation}`,
      owner: "@engine-agent",
      targetArtifact: "docs/planning/feature-specs/spatial-analysis-readiness.md",
      reason: `Spatial analysis operation "${operation}" needs schema, command semantics, diagnostics, fixtures, and MCP exposure assessment before promotion.`,
    });
  }

  if (
    input.spatialQueryEvidence.capabilityGate.status === "waived" &&
    input.spatialQueryEvidence.capabilityGate.waiver
  ) {
    followUps.push({
      id: `spatial-query.capability-waiver.${input.spatialQueryEvidence.capabilityGate.waiver.followUpTaskId}`,
      owner: "@ai-agent",
      targetArtifact: "packages/ai/src/tools/generationEvidence.ts",
      reason: `Spatial query capability waiver must be closed by ${input.spatialQueryEvidence.capabilityGate.waiver.followUpTaskId} before treating adapter query support as complete.`,
    });
  }

  for (const source of sourceReadiness.filter((entry) => entry.state === "readiness-only")) {
    followUps.push({
      id: `source-readiness.${source.sourceId}`,
      owner: "@engine-agent",
      targetArtifact: "docs/planning/feature-specs/cloud-native-source-readiness.md",
      reason: `Source "${source.sourceId}" is ${source.type} readiness-only; runtime fetch, archive parsing, or query semantics need a future contract before stronger claims.`,
    });
  }

  if (input.sceneBrowsing.requested && input.sceneBrowsing.status !== "blocked") {
    followUps.push({
      id: "scene-browsing.stable-runtime-gate",
      owner: "@quality-guardian",
      targetArtifact: "docs/planning/sceneview3d-src-006-stable-runtime-decision-2026-05-29.md",
      reason:
        "Scene browsing is extension-only; stable runtime promotion still needs a future quality-guardian and coordinator Go decision.",
      blockerCode: Scene3DStableRuntimeBlockerCodes.ViewMode,
    });
  }

  return followUps;
}

function sceneBlockerDiagnosticCount(diagnostics: Diagnostic[]): number {
  return diagnostics.filter((diagnostic) => isScene3DStableRuntimeBlockerCode(diagnostic.blockerCode)).length;
}

function dataSectionFollowUpCount(followUps: ExampleAppDeliverySummary["followUps"]): number {
  return followUps.filter(
    (followUp) =>
      followUp.id.startsWith("analysis.") ||
      followUp.id.startsWith("source-readiness.") ||
      followUp.id.startsWith("spatial-query."),
  ).length;
}

function buildExampleEvidence(
  exampleId: ExampleId,
  generationEvidence: ExampleAppGenerationEvidenceSummary,
): GenerationExampleEvidence & { diagnostics: Diagnostic[] } {
  const response = exportExampleAppTool({ exampleId, generationEvidence });
  if (!response.ok) {
    return {
      exampleId,
      writesFiles: false,
      fileCount: 0,
      diagnosticCounts: countDiagnostics(response.diagnostics),
      diagnostics: response.diagnostics,
    };
  }

  return {
    exampleId,
    writesFiles: response.result.writesFiles,
    fileCount: response.result.files.length,
    ...(response.result.generationEvidence ? { generationEvidence: response.result.generationEvidence } : {}),
    diagnosticCounts: zeroDiagnosticCounts(),
    diagnostics: [],
  };
}

function commandEvidenceDiagnostics(
  skeleton: MapGenerationCommandSkeleton,
  commandEvidence: GenerationCommandEvidence,
): Diagnostic[] {
  if (skeleton.commands.length === 0) return [];
  return specMismatchDiagnosticsFromEvidence(skeleton, commandEvidence);
}

function specMismatchDiagnostics(skeleton: MapGenerationCommandSkeleton, result: { spec: unknown }): Diagnostic[] {
  return JSON.stringify(result.spec) === JSON.stringify(skeleton.spec) ? [] : [specMismatchDiagnostic()];
}

function specMismatchDiagnosticsFromEvidence(
  skeleton: MapGenerationCommandSkeleton,
  commandEvidence: GenerationCommandEvidence,
): Diagnostic[] {
  if (!commandEvidence.usedApplyCommands || skeleton.commands.length === 0) return [];
  const replay = applyCommandsTool({
    spec: skeleton.baseSpec,
    commands: skeleton.commands,
    traceId: skeleton.traceId,
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
      message:
        "Regenerate the skeleton spec by replaying commands from baseSpec instead of editing the MapSpec directly.",
    },
  };
}

function snapshotEvidenceDiagnostics(
  snapshotEvidence: GenerationSnapshotEvidence & { diagnostics?: Diagnostic[] },
): Diagnostic[] {
  return snapshotEvidence.diagnostics ?? [];
}

function stripInternalDiagnostics(
  snapshotEvidence: GenerationSnapshotEvidence & { diagnostics?: Diagnostic[] },
): GenerationSnapshotEvidence {
  const { diagnostics: _diagnostics, ...publicEvidence } = snapshotEvidence;
  return publicEvidence;
}

function stripPlannerDiagnostics(
  plannerEvidence: GenerationPlannerEvidence & { diagnostics?: Diagnostic[] },
): GenerationPlannerEvidence {
  const { diagnostics: _diagnostics, ...publicEvidence } = plannerEvidence;
  return publicEvidence;
}

function stripSpatialQueryDiagnostics(
  spatialQueryEvidence: GenerationSpatialQueryEvidence & { diagnostics?: Diagnostic[] },
): GenerationSpatialQueryEvidence {
  const { diagnostics: _diagnostics, ...publicEvidence } = spatialQueryEvidence;
  return publicEvidence;
}

function stripExampleDiagnostics(
  exampleEvidence: GenerationExampleEvidence & { diagnostics?: Diagnostic[] },
): GenerationExampleEvidence {
  const { diagnostics: _diagnostics, ...publicEvidence } = exampleEvidence;
  return publicEvidence;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function uniqueSpatialQueryTypes(values: Array<"point" | "bbox">): Array<"point" | "bbox"> {
  return unique(values) as Array<"point" | "bbox">;
}

function isScene3DStableRuntimeBlockerCode(value: unknown): value is Scene3DStableRuntimeBlockerCode {
  return (
    typeof value === "string" &&
    Object.values(Scene3DStableRuntimeBlockerCodes).includes(value as Scene3DStableRuntimeBlockerCode)
  );
}

function uniqueScene3DStableRuntimeBlockerCodes(
  values: Scene3DStableRuntimeBlockerCode[],
): Scene3DStableRuntimeBlockerCode[] {
  return unique(values) as Scene3DStableRuntimeBlockerCode[];
}
