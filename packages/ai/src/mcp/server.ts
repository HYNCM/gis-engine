import { pathToFileURL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import {
  ApplyCommandsToolInputSchema,
  MapCommandSchema,
  MapSpecSchema,
  applyCommands,
  validateSpec,
  type CapabilityReport,
  type MapCommand,
  type MapSpec
} from "@gis-engine/engine";
import { applyCommandsTool } from "../tools/applyCommands.js";
import { getContextSummary } from "../tools/contextSummary.js";
import { explainSpecTool, ExplainSpecToolInputSchema } from "../tools/explainSpec.js";
import { exportExampleAppTool, ExportExampleAppToolInputSchema } from "../tools/exportExampleApp.js";
import { snapshotSpecTool, SnapshotSpecToolInputSchema } from "../tools/snapshotSpec.js";

export const gisEngineTools = [
  {
    name: "apply_commands",
    description: "Apply a series of MapCommands to a MapSpec to modify the map state.",
    inputSchema: ApplyCommandsToolInputSchema
  },
  {
    name: "validate_spec",
    description: "Validate a MapSpec and return diagnostics.",
    inputSchema: {
      type: "object",
      properties: {
        spec: MapSpecSchema
      },
      required: ["spec"],
      additionalProperties: false
    }
  },
  {
    name: "export_spec",
    description: "Return a validated, optionally command-modified MapSpec.",
    inputSchema: {
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
    }
  },
  {
    name: "get_context_summary",
    description: "Return a compact summary of a MapSpec for AI planning and review.",
    inputSchema: {
      type: "object",
      properties: {
        spec: MapSpecSchema,
        capabilities: { type: "object" }
      },
      required: ["spec"],
      additionalProperties: false
    }
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
      const { spec } = requireObjectWithSpec(args);
      return toolTextResult(validateSpec(spec));
    }

    if (name === "export_spec") {
      const { spec, commands, dryRun, transaction, traceId } = requireExportSpecInput(args);
      if (commands.length === 0) return toolTextResult(spec);
      const result = applyCommands(spec, commands, {
        dryRun,
        ...(transaction ? { transaction } : {}),
        ...(traceId ? { traceId } : {})
      });
      return toolTextResult(result.spec);
    }

    if (name === "get_context_summary") {
      const { spec, capabilities } = requireContextSummaryInput(args);
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

    throw new Error(`Tool not found: ${name}`);
  } catch (error) {
    return toolTextResult(error instanceof Error ? { message: error.message } : { message: "Unknown error" }, true);
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

function requireObjectWithSpec(args: unknown): { spec: MapSpec } {
  if (!args || typeof args !== "object" || !("spec" in args)) throw new Error("Missing spec argument.");
  return { spec: (args as { spec: MapSpec }).spec };
}

function requireExportSpecInput(args: unknown): {
  spec: MapSpec;
  commands: MapCommand[];
  dryRun: boolean;
  transaction?: "atomic" | "best-effort";
  traceId?: string;
} {
  const { spec } = requireObjectWithSpec(args);
  const input = args as {
    commands?: MapCommand[];
    dryRun?: boolean;
    transaction?: "atomic" | "best-effort";
    traceId?: string;
  };

  return {
    spec,
    commands: Array.isArray(input.commands) ? input.commands : [],
    dryRun: input.dryRun ?? false,
    ...(input.transaction ? { transaction: input.transaction } : {}),
    ...(input.traceId ? { traceId: input.traceId } : {})
  };
}

function requireContextSummaryInput(args: unknown): { spec: MapSpec; capabilities?: CapabilityReport } {
  const { spec } = requireObjectWithSpec(args);
  const capabilities = (args as { capabilities?: CapabilityReport }).capabilities;
  return { spec, ...(capabilities ? { capabilities } : {}) };
}
