import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import {
  ApplyCommandsToolInputSchema,
  applyCommands,
  type CapabilityReport,
  CapabilityReportSchema,
  type Diagnostic,
  DiagnosticCodes,
  DiagnosticSchema,
  type MapCommand,
  MapCommandSchema,
  type MapSpec,
  MapSpecSchema,
  validateSpec,
} from "@gis-engine/engine";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  type CallToolResult,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  SUPPORTED_PROTOCOL_VERSIONS,
} from "@modelcontextprotocol/sdk/types.js";
import { Ajv, type ValidateFunction } from "ajv/dist/ajv.js";
import { GisEngineToolNameSchema } from "../internal/mcpToolNames.js";
import { applyCommandsTool } from "../tools/applyCommands.js";
import { getContextSummary } from "../tools/contextSummary.js";
import { DiffSpecsToolInputSchema, diffSpecsTool } from "../tools/diffSpecs.js";
import { EditSpecToolInputSchema, editSpecTool } from "../tools/editSpec.js";
import { ExplainSpecToolInputSchema, explainSpecTool } from "../tools/explainSpec.js";
import {
  ExampleAppGenerationEvidenceSummarySchema,
  ExportExampleAppToolInputSchema,
  exportExampleAppTool,
} from "../tools/exportExampleApp.js";
import { GenerateSpecToolInputSchema, generateSpecTool } from "../tools/generateSpec.js";
import { InspectDataToolInputSchema, inspectDataTool } from "../tools/inspectData.js";
import { PMTilesCapabilityDecisionSchema } from "../tools/pmtilesCapability.js";
import { QueryFeaturesToolInputSchema, queryFeaturesTool } from "../tools/queryFeatures.js";
import { toolInputErrorsToDiagnostics } from "../tools/schemaDiagnostics.js";
import { DiagnosticCountsSchema, stripNestedIds } from "../tools/shared.js";
import { SnapshotSpecToolInputSchema, snapshotSpecTool } from "../tools/snapshotSpec.js";
import { StyleRecommendToolInputSchema, styleRecommendTool } from "../tools/styleRecommend.js";
import { TransformDataToolInputSchema, transformDataTool } from "../tools/transformData.js";

const DiagnosticContractSchema = stripNestedIds(DiagnosticSchema);
const CapabilityReportContractSchema = stripNestedIds(CapabilityReportSchema);
const packageRequire = createRequire(import.meta.url);
const packageVersion = (packageRequire("../../package.json") as { version: string }).version;
const MCP_JSON_SCHEMA_DIALECT = "http://json-schema.org/draft-07/schema#";

export const GIS_ENGINE_MCP_PROTOCOL_VERSION = "2025-11-25";

if (!SUPPORTED_PROTOCOL_VERSIONS.includes(GIS_ENGINE_MCP_PROTOCOL_VERSION)) {
  throw new Error(`MCP SDK does not support the GIS Engine protocol target ${GIS_ENGINE_MCP_PROTOCOL_VERSION}.`);
}

export const McpToolExecutionErrorSchema = {
  type: "object",
  properties: {
    diagnostics: { type: "array", items: DiagnosticContractSchema },
  },
  required: ["diagnostics"],
  additionalProperties: false,
} as const;

function withMcpToolExecutionError<const T extends object>(successSchema: T) {
  return {
    $schema: MCP_JSON_SCHEMA_DIALECT,
    type: "object",
    oneOf: [successSchema, McpToolExecutionErrorSchema],
  } as const;
}

function withMcpJsonSchemaDialect<const T extends object>(schema: T) {
  return {
    ...schema,
    $schema: MCP_JSON_SCHEMA_DIALECT,
  } as const;
}

export const ValidateSpecToolInputSchema = {
  type: "object",
  properties: {
    spec: MapSpecSchema,
  },
  required: ["spec"],
  additionalProperties: false,
} as const;

export const ExportSpecToolInputSchema = {
  type: "object",
  properties: {
    spec: MapSpecSchema,
    commands: { type: "array", items: MapCommandSchema },
    dryRun: { type: "boolean" },
    transaction: { type: "string", enum: ["atomic", "best-effort"] },
    traceId: { type: "string" },
  },
  required: ["spec"],
  additionalProperties: false,
} as const;

export const ContextSummaryToolInputSchema = {
  type: "object",
  properties: {
    spec: MapSpecSchema,
    capabilities: CapabilityReportContractSchema,
  },
  required: ["spec"],
  additionalProperties: false,
} as const;

const JsonPatchOperationSchema = {
  type: "object",
  properties: {
    op: { type: "string", enum: ["add", "remove", "replace"] },
    path: { type: "string" },
    value: {},
  },
  required: ["op", "path"],
  additionalProperties: false,
} as const;

const ValidationReportSchema = {
  type: "object",
  properties: {
    valid: { type: "boolean" },
    diagnostics: { type: "array", items: DiagnosticContractSchema },
    stats: {
      type: "object",
      properties: {
        sourceCount: { type: "number" },
        layerCount: { type: "number" },
        visibleLayerCount: { type: "number" },
      },
      required: ["sourceCount", "layerCount", "visibleLayerCount"],
      additionalProperties: false,
    },
  },
  required: ["valid", "diagnostics", "stats"],
  additionalProperties: false,
} as const;

const CommandResultSchema = {
  type: "object",
  properties: {
    commandId: { type: "string" },
    sequenceId: { type: "number" },
    status: { type: "string", enum: ["applied", "skipped", "failed"] },
    baseRevision: { type: "string" },
    nextRevision: { type: "string" },
    changedPaths: { type: "array", items: { type: "string" } },
    patch: { type: "array", items: JsonPatchOperationSchema },
    inversePatch: { type: "array", items: JsonPatchOperationSchema },
    diagnostics: { type: "array", items: DiagnosticContractSchema },
    traceId: { type: "string" },
  },
  required: ["commandId", "sequenceId", "status", "changedPaths", "diagnostics"],
  additionalProperties: false,
} as const;

const CommandAuthorSchema = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["human", "agent", "system"] },
    id: { type: "string" },
    name: { type: "string" },
  },
  required: ["type"],
  additionalProperties: false,
} as const;

const CommandTraceSchema = {
  type: "object",
  properties: {
    traceId: { type: "string" },
    commandId: { type: "string" },
    sequenceId: { type: "number" },
    status: { type: "string", enum: ["applied", "skipped", "failed"] },
    startedAt: { type: "string" },
    endedAt: { type: "string" },
    baseRevision: { type: "string" },
    nextRevision: { type: "string" },
    author: CommandAuthorSchema,
    reason: { type: "string" },
    sourcePromptHash: { type: "string" },
    diagnostics: { type: "array", items: DiagnosticContractSchema },
    changedPaths: { type: "array", items: { type: "string" } },
  },
  required: ["traceId", "commandId", "sequenceId", "status", "startedAt", "endedAt", "diagnostics", "changedPaths"],
  additionalProperties: false,
} as const;

export const ApplyCommandsToolResultSchema = {
  type: "object",
  properties: {
    spec: MapSpecSchema,
    results: { type: "array", items: CommandResultSchema },
    transaction: { type: "string", enum: ["atomic", "best-effort"] },
    dryRun: { type: "boolean" },
    committed: { type: "boolean" },
    rolledBack: { type: "boolean" },
    traceId: { type: "string" },
    traces: { type: "array", items: CommandTraceSchema },
  },
  required: ["spec", "results", "transaction", "dryRun", "committed", "rolledBack", "traceId"],
  additionalProperties: false,
} as const;

export const ValidateSpecToolResultSchema = ValidationReportSchema;
export const ExportSpecToolResultSchema = MapSpecSchema;

const CapabilityDomainSummarySchema = {
  type: "object",
  properties: {
    id: { type: "string", enum: ["feature-display", "spatial-analysis", "scene-browsing"] },
    status: { type: "string", enum: ["supported", "experimental", "blocked"] },
    supported: { type: "array", items: { type: "string" } },
    experimental: { type: "array", items: { type: "string" } },
    blocked: { type: "array", items: { type: "string" } },
    tools: {
      type: "array",
      items: GisEngineToolNameSchema,
    },
    evidence: { type: "array", items: { type: "string" } },
  },
  required: ["id", "status", "supported", "experimental", "blocked", "tools", "evidence"],
  additionalProperties: false,
} as const;

const CapabilitySummarySchema = {
  type: "object",
  properties: {
    domains: { type: "array", items: CapabilityDomainSummarySchema },
  },
  required: ["domains"],
  additionalProperties: false,
} as const;

const SourceContractSchema = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["archive", "schema"] },
    state: { type: "string", enum: ["explicit", "not-applicable", "not-checked"] },
    metadataFields: { type: "array", items: { type: "string" } },
    policyFields: { type: "array", items: { type: "string" } },
  },
  required: ["kind", "state", "metadataFields", "policyFields"],
  additionalProperties: false,
} as const;

const SourceArchiveContractSchema = {
  type: "object",
  properties: {
    state: { type: "string", enum: ["explicit", "not-applicable", "not-checked"] },
    metadataFields: { type: "array", items: { type: "string" } },
    policyFields: { type: "array", items: { type: "string" } },
  },
  required: ["state", "metadataFields", "policyFields"],
  additionalProperties: false,
} as const;

const SourceRuntimeLoadPlanSchema = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["ready", "metadata-required", "blocked"] },
    sourceLayerIds: { type: "array", items: { type: "string" } },
    diagnosticCounts: DiagnosticCountsSchema,
    requirements: {
      type: "object",
      properties: {
        mapLibreVectorSource: { type: "boolean", const: true },
        sourceLayerMetadata: { type: "boolean", const: true },
        rangeRequests: { type: "boolean", const: true },
        worker: { type: "boolean", const: true },
        archiveMetadata: { type: "boolean" },
        archiveParsing: { type: "boolean", const: false },
        featureQuery: { type: "boolean", const: false },
      },
      required: [
        "mapLibreVectorSource",
        "sourceLayerMetadata",
        "rangeRequests",
        "worker",
        "archiveMetadata",
        "archiveParsing",
        "featureQuery",
      ],
      additionalProperties: false,
    },
  },
  required: ["status", "sourceLayerIds", "diagnosticCounts", "requirements"],
  additionalProperties: false,
} as const;

const SourceReadinessSchema = {
  type: "object",
  properties: {
    sourceId: { type: "string" },
    type: { type: "string" },
    state: { type: "string", enum: ["supported", "readiness-only", "blocked"] },
    queryReady: { type: "boolean" },
    fixtureEvidenceReady: { type: "boolean" },
    fixtureEvidenceStatus: { type: "string", enum: ["not-requested", "ready", "empty", "blocked"] },
    resourcePolicy: { type: "string", enum: ["passed", "blocked", "not-applicable", "not-checked"] },
    sourceContract: SourceContractSchema,
    archiveContract: SourceArchiveContractSchema,
    runtimeLoadPlan: SourceRuntimeLoadPlanSchema,
    capabilityDecision: PMTilesCapabilityDecisionSchema,
  },
  required: ["sourceId", "type", "state", "queryReady", "resourcePolicy"],
  additionalProperties: false,
} as const;

const Scene3DContextSummarySchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "extension-only" },
    stableViewMode: { type: "boolean", const: false },
    runtimeSupported: { type: "boolean", const: false },
    sourceCount: { type: "number" },
    layerCount: { type: "number" },
    visibleLayerCount: { type: "number" },
    pickableLayerCount: { type: "number" },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          sourceContract: SourceContractSchema,
        },
        required: ["id", "type"],
        additionalProperties: false,
      },
    },
    layers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          source: { type: "string" },
          visibility: { type: "string", enum: ["visible", "none"] },
          pickable: { type: "boolean" },
        },
        required: ["id", "type", "source", "visibility", "pickable"],
        additionalProperties: false,
      },
    },
    resourcePolicy: {
      type: "object",
      properties: {
        present: { type: "boolean" },
        maxTilesetJsonBytes: { type: "number" },
        maxModelBytes: { type: "number" },
        maxTextureCount: { type: "number" },
        maxTextureBytes: { type: "number" },
        maxWorkers: { type: "number" },
        timeoutMs: { type: "number" },
      },
      required: ["present"],
      additionalProperties: false,
    },
    snapshot: {
      type: "object",
      properties: {
        mockPassed: { type: "boolean" },
        pendingSourceIds: { type: "array", items: { type: "string" } },
        diagnosticCounts: DiagnosticCountsSchema,
      },
      required: ["mockPassed", "pendingSourceIds", "diagnosticCounts"],
      additionalProperties: false,
    },
    query: {
      type: "object",
      properties: {
        pickCount: { type: "number" },
        diagnosticCounts: DiagnosticCountsSchema,
      },
      required: ["pickCount", "diagnosticCounts"],
      additionalProperties: false,
    },
    capabilities: CapabilityReportSchema,
  },
  required: [
    "status",
    "stableViewMode",
    "runtimeSupported",
    "sourceCount",
    "layerCount",
    "visibleLayerCount",
    "pickableLayerCount",
    "sources",
    "layers",
    "resourcePolicy",
    "snapshot",
    "query",
    "capabilities",
  ],
  additionalProperties: false,
} as const;

export const ContextSummaryToolResultSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    revision: { type: "string" },
    view: MapSpecSchema.properties.view,
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          sourceContract: SourceContractSchema,
        },
        required: ["id", "type"],
        additionalProperties: false,
      },
    },
    sourceReadiness: {
      type: "array",
      items: SourceReadinessSchema,
    },
    layers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          source: { type: "string" },
          visibility: { type: "string", enum: ["visible", "none"] },
        },
        required: ["id", "type", "visibility"],
        additionalProperties: false,
      },
    },
    validation: {
      type: "object",
      properties: {
        valid: { type: "boolean" },
        diagnosticCounts: DiagnosticCountsSchema,
      },
      required: ["valid", "diagnosticCounts"],
      additionalProperties: false,
    },
    capabilitySummary: CapabilitySummarySchema,
    capabilities: CapabilityReportContractSchema,
    scene3d: Scene3DContextSummarySchema,
  },
  required: ["view", "sources", "sourceReadiness", "layers", "validation", "capabilitySummary"],
  additionalProperties: false,
} as const;

export const SnapshotSpecToolResultSchema = {
  type: "object",
  properties: {
    passed: { type: "boolean" },
    diagnostics: { type: "array", items: DiagnosticContractSchema },
    dataUrl: { type: "string" },
    renderer: { type: "string", enum: ["maplibre", "mock"] },
    validation: ValidationReportSchema,
  },
  required: ["passed", "diagnostics", "renderer", "validation"],
  additionalProperties: false,
} as const;

export const ExplainSpecToolResultSchema = {
  type: "object",
  properties: {
    summary: ContextSummaryToolResultSchema,
    validation: ValidationReportSchema,
    diagnostics: { type: "array", items: DiagnosticContractSchema },
  },
  required: ["summary", "validation", "diagnostics"],
  additionalProperties: false,
} as const;

export const ExportExampleAppToolResultSchema = {
  type: "object",
  properties: {
    exampleId: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    writesFiles: { type: "boolean", const: false },
    files: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          role: { type: "string", enum: ["spec", "data", "commands", "script"] },
          mediaType: { type: "string" },
          required: { type: "boolean" },
          description: { type: "string" },
        },
        required: ["path", "role", "mediaType", "required", "description"],
        additionalProperties: false,
      },
    },
    notes: { type: "array", items: { type: "string" } },
    generationEvidence: ExampleAppGenerationEvidenceSummarySchema,
  },
  required: ["exampleId", "title", "description", "writesFiles", "files", "notes"],
  additionalProperties: false,
} as const;

export const DiffSpecsToolResultSchema = {
  type: "object",
  properties: {
    commands: { type: "array", items: MapCommandSchema },
    summary: {
      type: "object",
      properties: {
        added: { type: "array", items: { type: "string" } },
        removed: { type: "array", items: { type: "string" } },
        modified: { type: "array", items: { type: "string" } },
        unchanged: { type: "array", items: { type: "string" } },
      },
      required: ["added", "removed", "modified", "unchanged"],
      additionalProperties: false,
    },
    diagnostics: { type: "array", items: DiagnosticContractSchema },
  },
  required: ["commands", "summary", "diagnostics"],
  additionalProperties: false,
} as const;

export const GenerateSpecToolResultSchema = {
  type: "object",
  properties: {
    spec: MapSpecSchema,
    diagnostics: { type: "array", items: DiagnosticContractSchema },
    suggestions: { type: "array", items: { type: "string" } },
  },
  required: ["spec", "diagnostics", "suggestions"],
  additionalProperties: false,
} as const;

export const InspectDataToolResultSchema = {
  type: "object",
  properties: {
    featureCount: { type: "number" },
    propertySchema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          types: { type: "array", items: { type: "string" } },
          sampleValues: { type: "array" },
        },
        required: ["name", "types", "sampleValues"],
        additionalProperties: false,
      },
    },
    geometryTypes: { type: "array", items: { type: "string" } },
    sample: { type: "array" },
    bounds: { type: "array", items: { type: "number" }, minItems: 4, maxItems: 4 },
    suggestions: { type: "array", items: { type: "string" } },
  },
  required: ["featureCount", "propertySchema", "geometryTypes", "sample", "bounds", "suggestions"],
  additionalProperties: false,
} as const;

export const EditSpecToolResultSchema = {
  type: "object",
  properties: {
    spec: MapSpecSchema,
    commands: { type: "array", items: MapCommandSchema },
    diagnostics: { type: "array", items: DiagnosticContractSchema },
    summary: { type: "string" },
  },
  required: ["spec", "commands", "diagnostics", "summary"],
  additionalProperties: false,
} as const;

export const QueryFeaturesToolResultSchema = {
  type: "object",
  properties: {
    queryType: { type: "string", enum: ["point", "bbox", "all"] },
    featureCount: { type: "number" },
    features: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", const: "Feature" },
          id: {},
          geometry: {
            type: "object",
            properties: {
              type: { type: "string" },
            },
            required: ["type"],
            additionalProperties: false,
          },
          properties: {},
        },
        required: ["type", "properties"],
        additionalProperties: false,
      },
    },
    suggestions: { type: "array", items: { type: "string" } },
  },
  required: ["queryType", "featureCount", "features", "suggestions"],
  additionalProperties: false,
} as const;

export const StyleRecommendToolResultSchema = {
  type: "object",
  properties: {
    featureCount: { type: "number" },
    geometryTypes: { type: "array", items: { type: "string" } },
    primaryGeometry: { type: "string" },
    numericProperties: { type: "array", items: { type: "string" } },
    categoricalProperties: { type: "array", items: { type: "string" } },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          layerType: { type: "string" },
          rationale: { type: "string" },
          paint: { type: "object" },
          layout: { type: "object" },
          priority: { type: "number" },
        },
        required: ["layerType", "rationale", "paint", "layout", "priority"],
        additionalProperties: false,
      },
    },
    diagnostics: { type: "array", items: DiagnosticContractSchema },
  },
  required: [
    "featureCount",
    "geometryTypes",
    "primaryGeometry",
    "numericProperties",
    "categoricalProperties",
    "recommendations",
    "diagnostics",
  ],
  additionalProperties: false,
} as const;

export const TransformDataToolResultSchema = {
  type: "object",
  properties: {
    operationCount: { type: "number" },
    inputFeatureCount: { type: "number" },
    outputFeatureCount: { type: "number" },
    output: {
      type: "object",
      properties: {
        type: { type: "string" },
        features: { type: "array" },
      },
      required: ["type", "features"],
      additionalProperties: false,
    },
    aggregations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          groupBy: { type: "string" },
          aggregation: { type: "string" },
          property: { type: "string" },
          groups: {
            type: "array",
            items: {
              type: "object",
              properties: {
                key: { type: "string" },
                value: { type: "number" },
                count: { type: "number" },
              },
              required: ["key", "value", "count"],
              additionalProperties: false,
            },
          },
        },
        required: ["groupBy", "aggregation", "groups"],
        additionalProperties: false,
      },
    },
    diagnostics: { type: "array", items: DiagnosticContractSchema },
  },
  required: ["operationCount", "inputFeatureCount", "outputFeatureCount", "output", "diagnostics"],
  additionalProperties: false,
} as const;

interface ValidateSpecToolInput {
  spec: MapSpec;
}

interface ExportSpecToolInput {
  spec: MapSpec;
  commands?: MapCommand[];
  dryRun?: boolean;
  transaction?: "atomic" | "best-effort";
  traceId?: string;
}

interface ContextSummaryToolInput {
  spec: MapSpec;
  capabilities?: CapabilityReport;
}

type ToolInputResult<T> = { ok: true; input: T } | { ok: false; diagnostics: Diagnostic[] };

const ajv = new Ajv({ allErrors: true, strict: false });

const validateValidateSpecInput = ajv.compile(ValidateSpecToolInputSchema);
const validateExportSpecInput = ajv.compile(ExportSpecToolInputSchema);
const validateContextSummaryInput = ajv.compile(ContextSummaryToolInputSchema);

export const gisEngineTools = [
  {
    name: "apply_commands",
    description:
      "Apply a series of MapCommands to a MapSpec to modify the map state. Use when: the user wants to add layers, change styles, set the view, or perform any map state mutation; pre-check modifications before committing. Do NOT use when: the user only needs to read, query, or export the current map state. Example: user says 'add a heatmap layer showing population density'.",
    inputSchema: withMcpJsonSchemaDialect(ApplyCommandsToolInputSchema),
    outputSchema: withMcpToolExecutionError(ApplyCommandsToolResultSchema),
  },
  {
    name: "validate_spec",
    description:
      "Validate a MapSpec and return diagnostics. Use when: the user submits a MapSpec and needs to check its correctness; as a pre-check before apply_commands. Do NOT use when: the spec is already known to be valid and only needs to be exported or explained.",
    inputSchema: withMcpJsonSchemaDialect(ValidateSpecToolInputSchema),
    outputSchema: withMcpToolExecutionError(ValidateSpecToolResultSchema),
  },
  {
    name: "export_spec",
    description:
      "Return a validated, optionally command-modified MapSpec. Use when: the user needs the final usable MapSpec JSON for deployment or sharing; applying a batch of commands and exporting the result in one step. Do NOT use when: the user only needs to validate or preview the spec without obtaining the full output.",
    inputSchema: withMcpJsonSchemaDialect(ExportSpecToolInputSchema),
    outputSchema: withMcpToolExecutionError(ExportSpecToolResultSchema),
  },
  {
    name: "get_context_summary",
    description:
      "Return a compact MapSpec summary plus AI orchestration capability boundaries for planning and review. Use when: the user or an AI agent needs a comprehensive overview of the current MapSpec structure, layers, sources, and capability status. Do NOT use when: the user intends to modify the map — use apply_commands or edit_spec instead.",
    inputSchema: withMcpJsonSchemaDialect(ContextSummaryToolInputSchema),
    outputSchema: withMcpToolExecutionError(ContextSummaryToolResultSchema),
  },
  {
    name: "snapshot_spec",
    description:
      "Validate a MapSpec and produce a headless snapshot result without real WebGL. Use when: the user needs a visual screenshot image of the map as verification evidence or for visual review. Do NOT use when: the user only needs structured data, diagnostics, or a text summary — use explain_spec or get_context_summary instead.",
    inputSchema: withMcpJsonSchemaDialect(SnapshotSpecToolInputSchema),
    outputSchema: withMcpToolExecutionError(SnapshotSpecToolResultSchema),
  },
  {
    name: "explain_spec",
    description:
      "Return a structured AI-facing summary, capability boundaries, and full validation diagnostics. Use when: the user or an AI agent needs to understand what a MapSpec contains — layers, sources, styles, and their relationships — in a machine-readable format. Do NOT use when: the user wants to modify the map — use apply_commands or edit_spec instead.",
    inputSchema: withMcpJsonSchemaDialect(ExplainSpecToolInputSchema),
    outputSchema: withMcpToolExecutionError(ExplainSpecToolResultSchema),
  },
  {
    name: "export_example_app",
    description:
      "Return a manifest and file list for a bundled example without writing files. Use when: the user needs a self-contained runnable example application with spec, data, and script files for learning or demonstration. Do NOT use when: the user only needs the MapSpec JSON — use export_spec instead.",
    inputSchema: withMcpJsonSchemaDialect(ExportExampleAppToolInputSchema),
    outputSchema: withMcpToolExecutionError(ExportExampleAppToolResultSchema),
  },
  {
    name: "diff_specs",
    description:
      "Compare two MapSpec objects and output the command set needed to transform one into the other, with a summary of changes. Use when: the user needs to understand what changed between two versions of a MapSpec or generate migration commands. Do NOT use when: the user only needs to inspect or explain a single spec.",
    inputSchema: withMcpJsonSchemaDialect(DiffSpecsToolInputSchema),
    outputSchema: withMcpToolExecutionError(DiffSpecsToolResultSchema),
  },
  {
    name: "generate_spec",
    description:
      "Generate a MapSpec skeleton from a structured intent description, with validation and improvement suggestions. Use when: the user describes the desired map in natural language and needs a MapSpec created from scratch. Do NOT use when: a MapSpec already exists and only needs small modifications — use edit_spec instead. Example: user says 'create a choropleth map showing GDP by province in China'.",
    inputSchema: withMcpJsonSchemaDialect(GenerateSpecToolInputSchema),
    outputSchema: withMcpToolExecutionError(GenerateSpecToolResultSchema),
  },
  {
    name: "inspect_data",
    description:
      "Inspect GeoJSON data structure, properties, geometry types, and bounds to understand the data before visualization. Use when: the user needs to understand the structure, property types, and statistical summary of GeoJSON data before building a map. Do NOT use when: the user wants to transform the data — use transform_data instead.",
    inputSchema: withMcpJsonSchemaDialect(InspectDataToolInputSchema),
    outputSchema: withMcpToolExecutionError(InspectDataToolResultSchema),
  },
  {
    name: "edit_spec",
    description:
      "Edit a MapSpec using natural language instructions. Supports adding/removing layers, changing paint/layout properties, setting filters, and modifying the view. Use when: a MapSpec already exists and the user wants to make small to moderate changes using natural language. Do NOT use when: creating a spec from scratch (use generate_spec) or when precise command-level control is needed (use apply_commands).",
    inputSchema: withMcpJsonSchemaDialect(EditSpecToolInputSchema),
    outputSchema: withMcpToolExecutionError(EditSpecToolResultSchema),
  },
  {
    name: "query_features",
    description:
      "Query GeoJSON features by point or bounding box spatial filter. Returns matching features with properties and geometry types. Use when: the user needs to find features at a specific map location or within a bounding box for inspection or interaction. Do NOT use when: the user needs a global data summary — use inspect_data instead.",
    inputSchema: withMcpJsonSchemaDialect(QueryFeaturesToolInputSchema),
    outputSchema: withMcpToolExecutionError(QueryFeaturesToolResultSchema),
  },
  {
    name: "style_recommend",
    description:
      "Analyze GeoJSON data features and recommend appropriate map layer types, paint properties, and style configurations based on geometry types, property distributions, and optional context hints. Use when: the user has GeoJSON data and wants data-driven suggestions for visualization styling. Do NOT use when: the user has already specified exact style parameters and does not need recommendations.",
    inputSchema: withMcpJsonSchemaDialect(StyleRecommendToolInputSchema),
    outputSchema: withMcpToolExecutionError(StyleRecommendToolResultSchema),
  },
  {
    name: "transform_data",
    description:
      "Transform GeoJSON data with filter, aggregate, select, sort, and rename operations. Supports property-based filtering, group-by aggregation (count/sum/avg/min/max), property selection, sorting, and renaming. Use when: the user needs to filter, aggregate, sort, or reshape GeoJSON data before visualization. Do NOT use when: the user only needs to inspect the data structure — use inspect_data instead.",
    inputSchema: withMcpJsonSchemaDialect(TransformDataToolInputSchema),
    outputSchema: withMcpToolExecutionError(TransformDataToolResultSchema),
  },
] as const;

export async function listGisEngineTools(): Promise<{ tools: typeof gisEngineTools }> {
  return { tools: gisEngineTools };
}

type McpContent = { type: "text"; text: string } | { type: "image"; data: string; mimeType: string };

type McpToolCallResult = CallToolResult;

export async function callGisEngineTool(request: {
  params: { name: string; arguments?: unknown };
}): Promise<McpToolCallResult> {
  const { name, arguments: args } = request.params;

  try {
    if (name === "apply_commands") {
      const result = applyCommandsTool(args);
      return toolTextResult(result.ok ? result.result : result.diagnostics, !result.ok);
    }

    if (name === "validate_spec") {
      const input = validateToolInput<ValidateSpecToolInput>(
        validateValidateSpecInput,
        args,
        "Invalid validate_spec tool input.",
      );
      if (!input.ok) return toolTextResult(input.diagnostics, true);
      return toolTextResult(validateSpec(input.input.spec));
    }

    if (name === "export_spec") {
      const input = validateToolInput<ExportSpecToolInput>(
        validateExportSpecInput,
        args,
        "Invalid export_spec tool input.",
      );
      if (!input.ok) return toolTextResult(input.diagnostics, true);
      const { spec, commands = [], dryRun = false, transaction, traceId } = input.input;
      const validation = validateSpec(spec);
      if (!validation.valid) return toolTextResult(validation.diagnostics, true);
      if (commands.length === 0) return toolTextResult(spec);
      const result = applyCommands(spec, commands, {
        dryRun,
        ...(transaction ? { transaction } : {}),
        ...(traceId ? { traceId } : {}),
      });
      const diagnostics = result.results.flatMap((commandResult) => commandResult.diagnostics);
      if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) return toolTextResult(diagnostics, true);
      return toolTextResult(result.spec);
    }

    if (name === "get_context_summary") {
      const input = validateToolInput<ContextSummaryToolInput>(
        validateContextSummaryInput,
        args,
        "Invalid get_context_summary tool input.",
      );
      if (!input.ok) return toolTextResult(input.diagnostics, true);
      const { spec, capabilities } = input.input;
      return toolTextResult(getContextSummary({ spec, ...(capabilities ? { capabilities } : {}) }));
    }

    if (name === "snapshot_spec") {
      const result = await snapshotSpecTool(args);
      if (result.ok && result.result.passed && result.result.dataUrl) {
        return toolImageResult(result.result.dataUrl, {
          passed: result.result.passed,
          diagnostics: result.result.diagnostics,
          renderer: result.result.renderer,
          validation: result.result.validation,
        });
      }
      return toolTextResult(result.ok ? result.result : result.diagnostics, !result.ok);
    }

    if (name === "explain_spec") {
      const result = explainSpecTool(args);
      return toolTextResult(result.ok ? result.result : result.diagnostics, !result.ok);
    }

    if (name === "export_example_app") {
      const result = exportExampleAppTool(args);
      return toolTextResult(result.ok ? result.result : result.diagnostics, !result.ok);
    }

    if (name === "diff_specs") {
      const result = diffSpecsTool(args);
      return toolTextResult(result.ok ? result.result : result.diagnostics, !result.ok);
    }

    if (name === "generate_spec") {
      const result = generateSpecTool(args);
      return toolTextResult(result.ok ? result.result : result.diagnostics, !result.ok);
    }

    if (name === "inspect_data") {
      const result = inspectDataTool(args);
      return toolTextResult(result.ok ? result.result : result.diagnostics, !result.ok);
    }

    if (name === "edit_spec") {
      const result = editSpecTool(args);
      return toolTextResult(result.ok ? result.result : result.diagnostics, !result.ok);
    }

    if (name === "query_features") {
      const result = queryFeaturesTool(args);
      return toolTextResult(result.ok ? result.result : result.diagnostics, !result.ok);
    }

    if (name === "style_recommend") {
      const result = styleRecommendTool(args);
      return toolTextResult(result.ok ? result.result : result.diagnostics, !result.ok);
    }

    if (name === "transform_data") {
      const result = transformDataTool(args);
      return toolTextResult(result.ok ? result.result : result.diagnostics, !result.ok);
    }

    return toolTextResult([toolErrorDiagnostic(`Tool not found: ${name}`, DiagnosticCodes.CommandUnsupported)], true);
  } catch (error) {
    return toolTextResult(
      [toolErrorDiagnostic(error instanceof Error ? error.message : "Unknown tool failure.")],
      true,
    );
  }
}

async function handleMcpToolCall(request: {
  params: { name: string; arguments?: unknown };
}): Promise<McpToolCallResult> {
  if (!gisEngineTools.some((tool) => tool.name === request.params.name)) {
    throw new McpError(ErrorCode.InvalidParams, `Unknown tool: ${request.params.name}`);
  }
  return callGisEngineTool(request);
}

export function createGisEngineMcpServer(): Server {
  const server = new Server(
    {
      name: "gis-engine",
      version: packageVersion,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, listGisEngineTools);
  server.setRequestHandler(CallToolRequestSchema, handleMcpToolCall);
  return server;
}

export async function main(): Promise<void> {
  const server = createGisEngineMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GIS Engine MCP Server running on stdio");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error("Fatal error in MCP server:", error);
    process.exit(1);
  });
}

function toolTextResult(value: unknown, isError = false): McpToolCallResult {
  const text = JSON.stringify(value, null, 2);
  if (isError) {
    if (!Array.isArray(value)) throw new TypeError("MCP tool errors must be diagnostic arrays.");
    return {
      isError: true,
      content: [{ type: "text", text }],
      structuredContent: { diagnostics: value },
    };
  }

  return {
    content: [{ type: "text", text }],
    structuredContent: asStructuredContent(value),
  };
}

function toolImageResult(dataUrl: string, metadata: object): McpToolCallResult {
  const structuredContent = asStructuredContent(metadata);
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return {
      content: [{ type: "text", text: JSON.stringify(metadata, null, 2) }],
      structuredContent,
    };
  }
  const [, mimeType, base64Data] = match;
  if (!mimeType || !base64Data) {
    return {
      content: [{ type: "text", text: JSON.stringify(metadata, null, 2) }],
      structuredContent,
    };
  }
  const content: Array<McpContent> = [{ type: "image", data: base64Data, mimeType }];
  content.push({ type: "text", text: JSON.stringify(metadata, null, 2) });
  return { content, structuredContent };
}

function asStructuredContent(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("MCP structured content must be a JSON object.");
  }
  return value as Record<string, unknown>;
}

function validateToolInput<T>(
  validateInput: ValidateFunction,
  args: unknown,
  fallbackMessage: string,
): ToolInputResult<T> {
  if (validateInput(args)) return { ok: true, input: args as T };
  return {
    ok: false,
    diagnostics: toolInputErrorsToDiagnostics(validateInput.errors, fallbackMessage),
  };
}

function toolErrorDiagnostic(message: string, code: Diagnostic["code"] = DiagnosticCodes.SpecInvalidType): Diagnostic {
  return {
    severity: "error",
    code,
    message,
    path: "/",
  };
}
