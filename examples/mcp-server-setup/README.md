# mcp-server-setup

Demonstrates how to set up and use the GIS Engine MCP server, both as a standalone transport and via the programmatic `callGisEngineTool` helper.

## What This Example Shows

1. **Starting an MCP server** with `createGisEngineMcpServer()` over stdio transport.
2. **Calling MCP tools programmatically** with `callGisEngineTool()` — useful for testing and scripting without a full MCP client.
3. **Listing available tools** — the server exposes the canonical 14-tool
   inventory with typed input/output schemas and structured result envelopes.

The example targets MCP `2025-11-25`. Tool descriptors use the JSON Schema
draft-07 dialect for both `inputSchema` and `outputSchema`.

## Files

| File | Purpose |
|---|---|
| `start-server.ts` | Starts the MCP server over stdio. Run with an MCP client (Claude, Cursor, Copilot). |
| `call-tools.ts` | Calls MCP tools programmatically and prints results. |
| `map.json` | A sample MapSpec used as input for the tool calls. |

## Key Concepts

The MCP server wraps all engine capabilities as typed tools:

Canonical `tools/list` order: `apply_commands`, `validate_spec`, `export_spec`,
`get_context_summary`, `snapshot_spec`, `explain_spec`, `export_example_app`,
`diff_specs`, `generate_spec`, `inspect_data`, `edit_spec`, `query_features`,
`style_recommend`, `transform_data`.

| Tool | Purpose |
|---|---|
| `apply_commands` | Apply commands to a MapSpec and get diagnostics |
| `validate_spec` | Check a MapSpec for schema and semantic errors |
| `export_spec` | Export the current MapSpec |
| `get_context_summary` | Get a structured summary for AI context |
| `snapshot_spec` | Take a deterministic snapshot |
| `explain_spec` | Get a human-readable explanation |
| `export_example_app` | Generate an example app manifest |
| `diff_specs` | Compare two MapSpecs and generate command differences |
| `generate_spec` | Generate a MapSpec skeleton from structured intent |
| `inspect_data` | Inspect inline GeoJSON structure and bounds |
| `edit_spec` | Edit a MapSpec using natural-language instructions |
| `query_features` | Query inline GeoJSON by point or bounding box |
| `style_recommend` | Recommend styles from GeoJSON properties and geometry |
| `transform_data` | Transform inline GeoJSON with bounded operations |

## Usage

### Programmatic (no MCP client needed)

```bash
npx tsx call-tools.ts
```

### As MCP server (for AI agents)

```bash
npx tsx start-server.ts
```

Configure your AI agent to connect via stdio transport.
