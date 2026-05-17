import { pathToFileURL } from "node:url";
import { Ajv, type ValidateFunction } from "ajv/dist/ajv.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import {
  ApplyCommandsToolInputSchema,
  DiagnosticCodes,
  MapCommandSchema,
  MapSpecSchema,
  applyCommands,
  validateSpec,
  type CapabilityReport,
  type Diagnostic,
  type MapCommand,
  type MapSpec
} from "@gis-engine/engine";
import { applyCommandsTool } from "../tools/applyCommands.js";
import { getContextSummary } from "../tools/contextSummary.js";
import { explainSpecTool, ExplainSpecToolInputSchema } from "../tools/explainSpec.js";
import { exportExampleAppTool, ExportExampleAppToolInputSchema } from "../tools/exportExampleApp.js";
import { toolInputErrorsToDiagnostics } from "../tools/schemaDiagnostics.js";
import { snapshotSpecTool, SnapshotSpecToolInputSchema } from "../tools/snapshotSpec.js";

const ValidateSpecToolInputSchema = {
  type: "object",
  properties: {
    spec: MapSpecSchema
  },
  required: ["spec"],
  additionalProperties: false
} as const;

const ExportSpecToolInputSchema = {
  type: "object",
  properties: {
    spec: MapSpecSchema,
    commands: { type: "array", items: MapCommandSchema },
    dryRun: { type: "boolean" },
    transaction: { type: "string", enum: ["atomic", "best-effort"] },
    traceId: { type: "string" }
  },
  required: ["spec"],
  additionalProperties: false
} as const;

const ContextSummaryToolInputSchema = {
  type: "object",
  properties: {
    spec: MapSpecSchema,
    capabilities: { type: "object", additionalProperties: true }
  },
  required: ["spec"],
  additionalProperties: false
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
    inputSchema: ApplyCommandsToolInputSchema
  },
  {
    name: "validate_spec",
    description: "Validate a MapSpec and return diagnostics.",
    inputSchema: ValidateSpecToolInputSchema
  },
  {
    name: "export_spec",
    description: "Return a validated, optionally command-modified MapSpec.",
    inputSchema: ExportSpecToolInputSchema
  },
  {
    name: "get_context_summary",
    description: "Return a compact summary of a MapSpec for AI planning and review.",
    inputSchema: ContextSummaryToolInputSchema
  },
  {
    name: "snapshot_spec",
    description: "Validate a MapSpec and produce a headless snapshot result without real WebGL.",
    inputSchema: SnapshotSpecToolInputSchema
  },
  {
    name: "explain_spec",
    description: "Return a structured AI-facing summary with full validation diagnostics.",
    inputSchema: ExplainSpecToolInputSchema
  },
  {
    name: "export_example_app",
    description: "Return a manifest and file list for a bundled example without writing files.",
    inputSchema: ExportExampleAppToolInputSchema
  }
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
      const input = validateToolInput<ValidateSpecToolInput>(validateValidateSpecInput, args, "Invalid validate_spec tool input.");
      if (!input.ok) return toolTextResult(input.diagnostics, true);
      return toolTextResult(validateSpec(input.input.spec));
    }

    if (name === "export_spec") {
      const input = validateToolInput<ExportSpecToolInput>(validateExportSpecInput, args, "Invalid export_spec tool input.");
      if (!input.ok) return toolTextResult(input.diagnostics, true);
      const { spec, commands = [], dryRun = false, transaction, traceId } = input.input;
      const validation = validateSpec(spec);
      if (!validation.valid) return toolTextResult(validation.diagnostics, true);
      if (commands.length === 0) return toolTextResult(spec);
      const result = applyCommands(spec, commands, {
        dryRun,
        ...(transaction ? { transaction } : {}),
        ...(traceId ? { traceId } : {})
      });
      const diagnostics = result.results.flatMap((commandResult) => commandResult.diagnostics);
      if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) return toolTextResult(diagnostics, true);
      return toolTextResult(result.spec);
    }

    if (name === "get_context_summary") {
      const input = validateToolInput<ContextSummaryToolInput>(validateContextSummaryInput, args, "Invalid get_context_summary tool input.");
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

    return toolTextResult([toolErrorDiagnostic(`Tool not found: ${name}`, DiagnosticCodes.CommandUnsupported)], true);
  } catch (error) {
    return toolTextResult([toolErrorDiagnostic(error instanceof Error ? error.message : "Unknown tool failure.")], true);
  }
}

export function createGisEngineMcpServer(): Server {
  const server = new Server(
    {
      name: "gis-engine",
      version: "0.1.0"
    },
    {
      capabilities: {
        tools: {}
      }
    }
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

function toolTextResult(value: unknown, isError = false): { isError?: boolean; content: Array<{ type: "text"; text: string }> } {
  return {
    ...(isError ? { isError: true } : {}),
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }]
  };
}

function validateToolInput<T>(validateInput: ValidateFunction, args: unknown, fallbackMessage: string): ToolInputResult<T> {
  if (validateInput(args)) return { ok: true, input: args as T };
  return {
    ok: false,
    diagnostics: toolInputErrorsToDiagnostics(validateInput.errors, fallbackMessage)
  };
}

function toolErrorDiagnostic(message: string, code: Diagnostic["code"] = DiagnosticCodes.SpecInvalidType): Diagnostic {
  return {
    severity: "error",
    code,
    message,
    path: "/"
  };
}
