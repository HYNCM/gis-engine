# MCP Tools Overview

GIS Engine exposes **7 MCP tools** for AI agents. Every tool has typed
`inputSchema` and `outputSchema`—LLMs can call them without guesswork.

## Tool List

| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `validate_spec` | Validate a MapSpec document | `{ spec: MapSpec }` | Diagnostics array |
| `apply_commands` | Edit a map through commands | `{ spec, commands, dryRun? }` | Updated spec + audit |
| `export_spec` | Export current map state | `{ spec, commands?, dryRun? }` | Clean MapSpec JSON |
| `get_context_summary` | Summarize engine capabilities | `{ spec, capabilities }` | Capability summary |
| `snapshot_spec` | Take a deterministic snapshot | `{ spec }` | Snapshot hash + metadata |
| `explain_spec` | Human-readable map explanation | `{ spec, capabilities? }` | Natural language summary |
| `export_example_app` | Generate example app manifest | `{ spec, manifest }` | App manifest + evidence |

## Setup

### Direct MCP Server

```typescript
import { createGisEngineMcpServer } from "@gis-engine/ai/mcp";

const server = createGisEngineMcpServer();

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Claude Desktop / Cursor

```json
{
  "mcpServers": {
    "gis-engine": {
      "command": "node",
      "args": ["node_modules/@gis-engine/ai/dist/mcp/server.js"]
    }
  }
}
```

## Security

All MCP tools are **read-only / command-only**:
- No direct filesystem access
- No network requests beyond configured resource policy
- All map mutations go through the command system
- Structured diagnostics make failures machine-actionable

## Tool Names

Only snake_case tool names are supported (`validate_spec`, `apply_commands`, etc.).
CamelCase aliases are intentionally unsupported to keep the contract unambiguous.
