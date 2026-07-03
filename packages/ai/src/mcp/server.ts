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
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Ajv, type ValidateFunction } from "ajv/dist/ajv.js";
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
import { toolInputErrorsToDiagnostics } from "../tools/schemaDiagnostics.js";
import { DiagnosticCountsSchema, stripNestedIds } from "../tools/shared.js";
import { SnapshotSpecToolInputSchema, snapshotSpecTool } from "../tools/snapshotSpec.js";

const DiagnosticContractSchema = stripNestedIds(DiagnosticSchema);
const CapabilityReportContractSchema = stripNestedIds(CapabilityReportSchema);

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
      items: {
        type: "string",
        enum: [
          "validate_spec",
          "apply_commands",
          "export_spec",
          "get_context_summary",
          "snapshot_spec",
          "explain_spec",
          "export_example_app",
          "diff_specs",
          "generate_spec",
          "inspect_data",
          "edit_spec",
        ],
      },
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
    resourcePolicy: { type: "string", enum: ["passed", "blocked", "not-applicable", "not-checked"] },
    sourceContract: SourceContractSchema,
    archiveContract: SourceArchiveContractSchema,
    runtimeLoadPlan: SourceRuntimeLoadPlanSchema,
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
    description: "Apply a series of MapCommands to a MapSpec to modify the map state.",
    inputSchema: ApplyCommandsToolInputSchema,
    outputSchema: ApplyCommandsToolResultSchema,
  },
  {
    name: "validate_spec",
    description: "Validate a MapSpec and return diagnostics.",
    inputSchema: ValidateSpecToolInputSchema,
    outputSchema: ValidateSpecToolResultSchema,
  },
  {
    name: "export_spec",
    description: "Return a validated, optionally command-modified MapSpec.",
    inputSchema: ExportSpecToolInputSchema,
    outputSchema: ExportSpecToolResultSchema,
  },
  {
    name: "get_context_summary",
    description:
      "Return a compact MapSpec summary plus AI orchestration capability boundaries for planning and review.",
    inputSchema: ContextSummaryToolInputSchema,
    outputSchema: ContextSummaryToolResultSchema,
  },
  {
    name: "snapshot_spec",
    description: "Validate a MapSpec and produce a headless snapshot result without real WebGL.",
    inputSchema: SnapshotSpecToolInputSchema,
    outputSchema: SnapshotSpecToolResultSchema,
  },
  {
    name: "explain_spec",
    description: "Return a structured AI-facing summary, capability boundaries, and full validation diagnostics.",
    inputSchema: ExplainSpecToolInputSchema,
    outputSchema: ExplainSpecToolResultSchema,
  },
  {
    name: "export_example_app",
    description: "Return a manifest and file list for a bundled example without writing files.",
    inputSchema: ExportExampleAppToolInputSchema,
    outputSchema: ExportExampleAppToolResultSchema,
  },
  {
    name: "diff_specs",
    description:
      "Compare two MapSpec objects and output the command set needed to transform one into the other, with a summary of changes.",
    inputSchema: DiffSpecsToolInputSchema,
    outputSchema: DiffSpecsToolResultSchema,
  },
  {
    name: "generate_spec",
    description:
      "Generate a MapSpec skeleton from a structured intent description, with validation and improvement suggestions.",
    inputSchema: GenerateSpecToolInputSchema,
    outputSchema: GenerateSpecToolResultSchema,
  },
  {
    name: "inspect_data",
    description:
      "Inspect GeoJSON data structure, properties, geometry types, and bounds to understand the data before visualization.",
    inputSchema: InspectDataToolInputSchema,
    outputSchema: InspectDataToolResultSchema,
  },
  {
    name: "edit_spec",
    description:
      "Edit a MapSpec using natural language instructions. Supports adding/removing layers, changing paint/layout properties, setting filters, and modifying the view.",
    inputSchema: EditSpecToolInputSchema,
    outputSchema: EditSpecToolResultSchema,
  },
] as const;

export async function listGisEngineTools(): Promise<{ tools: typeof gisEngineTools }> {
  return { tools: gisEngineTools };
}

export async function callGisEngineTool(request: { params: { name: string; arguments?: unknown } }): Promise<{
  isError?: boolean;
  content: Array<{ type: "text"; text: string }>;
}> {
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

    return toolTextResult([toolErrorDiagnostic(`Tool not found: ${name}`, DiagnosticCodes.CommandUnsupported)], true);
  } catch (error) {
    return toolTextResult(
      [toolErrorDiagnostic(error instanceof Error ? error.message : "Unknown tool failure.")],
      true,
    );
  }
}

export function createGisEngineMcpServer(): Server {
  const server = new Server(
    {
      name: "gis-engine",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, listGisEngineTools);
  server.setRequestHandler(CallToolRequestSchema, callGisEngineTool);
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

function toolTextResult(
  value: unknown,
  isError = false,
): { isError?: boolean; content: Array<{ type: "text"; text: string }> } {
  return {
    ...(isError ? { isError: true } : {}),
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
  };
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
