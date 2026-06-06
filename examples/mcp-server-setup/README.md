# mcp-server-setup

Demonstrates how to set up and use the GIS Engine MCP server, both as a standalone transport and via the programmatic `callGisEngineTool` helper.

## What This Example Shows

1. **Starting an MCP server** with `createGisEngineMcpServer()` over stdio transport.
2. **Calling MCP tools programmatically** with `callGisEngineTool()` — useful for testing and scripting without a full MCP client.
3. **Listing available tools** — the server exposes 7 tools with typed input/output schemas.

## Files

| File | Purpose |
|---|---|
| `start-server.ts` | Starts the MCP server over stdio. Run with an MCP client (Claude, Cursor, Copilot). |
| `call-tools.ts` | Calls MCP tools programmatically and prints results. |
| `map.json` | A sample MapSpec used as input for the tool calls. |

## Key Concepts

The MCP server wraps all engine capabilities as typed tools:

| Tool | Purpose |
|---|---|
| `validate_spec` | Check a MapSpec for schema and semantic errors |
| `apply_commands` | Apply commands to a MapSpec and get diagnostics |
| `export_spec` | Export the current MapSpec |
| `get_context_summary` | Get a structured summary for AI context |
| `snapshot_spec` | Take a deterministic snapshot |
| `explain_spec` | Get a human-readable explanation |
| `export_example_app` | Generate an example app manifest |

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
