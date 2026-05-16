import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { applyCommandsTool } from "../tools/applyCommands.js";
import { validateSpec, DiagnosticCodes } from "@gis-engine/engine";

const server = new Server(
  {
    name: "gis-engine",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "apply_commands",
        description: "Apply a series of MapCommands to a MapSpec to modify the map state.",
        inputSchema: {
          type: "object",
          properties: {
            spec: { type: "object", description: "The current MapSpec." },
            commands: {
              type: "array",
              items: { type: "object" },
              description: "Array of MapCommands to apply."
            },
            dryRun: { type: "boolean", description: "If true, validates but does not return a modified spec." },
            transaction: {
              type: "string",
              enum: ["atomic", "best-effort"],
              description: "Transaction mode."
            }
          },
          required: ["spec", "commands"]
        }
      },
      {
        name: "validate_spec",
        description: "Validate a MapSpec and return diagnostics.",
        inputSchema: {
          type: "object",
          properties: {
            spec: { type: "object", description: "The MapSpec to validate." }
          },
          required: ["spec"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "apply_commands") {
      const result = applyCommandsTool(args);
      if (result.ok) {
        return {
          content: [{ type: "text", text: JSON.stringify(result.result, null, 2) }]
        };
      } else {
        return {
          isError: true,
          content: [{ type: "text", text: JSON.stringify(result.diagnostics, null, 2) }]
        };
      }
    }

    if (name === "validate_spec") {
      if (!args || typeof args !== "object" || !("spec" in args)) {
        throw new Error("Missing spec argument");
      }
      const result = validateSpec(args.spec as any);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text", text: error.message || "Unknown error" }]
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GIS Engine MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in MCP server:", error);
  process.exit(1);
});
