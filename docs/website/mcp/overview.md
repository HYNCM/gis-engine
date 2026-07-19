# MCP Tools Overview

GIS Engine exposes a canonical default inventory of **14 MCP tools** for AI
agents. Every tool has typed `inputSchema` and `outputSchema`; successful calls
return schema-conforming `structuredContent` plus JSON text, and execution
errors return `{ diagnostics: [...] }` plus the legacy diagnostics text array.
The server targets MCP `2025-11-25`, and descriptor schemas use the JSON Schema
draft-07 dialect.

Canonical `tools/list` order: `apply_commands`, `validate_spec`, `export_spec`,
`get_context_summary`, `snapshot_spec`, `explain_spec`, `export_example_app`,
`diff_specs`, `generate_spec`, `inspect_data`, `edit_spec`, `query_features`,
`style_recommend`, `transform_data`.

## Tool List

| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `apply_commands` | Edit a map through commands | `{ spec, commands, dryRun? }` | Updated spec + audit |
| `validate_spec` | Validate a MapSpec document | `{ spec: MapSpec }` | `{ valid, diagnostics, stats }` |
| `export_spec` | Export current map state | `{ spec, commands?, dryRun? }` | Clean MapSpec JSON |
| `get_context_summary` | Summarize engine capabilities | `{ spec, capabilities }` | Capability summary |
| `snapshot_spec` | Take a deterministic snapshot | `{ spec, renderer?, snapshot? }` | `{ passed, diagnostics, dataUrl?, renderer, validation }` |
| `explain_spec` | Return a structured map explanation | `{ spec, capabilities? }` | `{ summary, validation, diagnostics }` |
| `export_example_app` | Return a bundled example manifest | `{ exampleId, generationEvidence? }` | `{ exampleId, title, description, writesFiles, files, notes, generationEvidence? }` |
| `diff_specs` | Compare two MapSpecs | `{ before, after, options? }` | Commands + change summary |
| `generate_spec` | Generate a MapSpec skeleton | `{ intent, options? }` | Spec + diagnostics + suggestions |
| `inspect_data` | Inspect inline GeoJSON | `{ geojson, sampleSize? }` | Data schema + bounds + suggestions |
| `edit_spec` | Edit a MapSpec through commands | `{ spec, instruction }` | Spec + commands + diagnostics |
| `query_features` | Query inline GeoJSON | `{ geojson, point? or bbox? }` | Bounded matching features |
| `style_recommend` | Recommend data-driven styles | `{ geojson, hints? }` | Layer recommendations + diagnostics |
| `transform_data` | Transform inline GeoJSON | `{ geojson, operations }` | Transformed output + diagnostics |

The first seven tools are the Phase 1 Core lifecycle group. `diff_specs`,
`generate_spec`, and `edit_spec` are Authoring extensions. `inspect_data`,
`query_features`, `style_recommend`, and `transform_data` form the Data
intelligence group. These groups do not change the default `tools/list`
inventory or order.

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
