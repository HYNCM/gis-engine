# @gis-engine/ai

AI and MCP tool layer for GIS Engine. It wraps the public `@gis-engine/engine`
contracts without reaching into renderer internals.

## Install

```bash
npm install @gis-engine/ai @gis-engine/engine
```

## Tools

The current MCP tool names are:

- `validate_spec`
- `apply_commands`
- `export_spec`
- `get_context_summary`
- `snapshot_spec`
- `explain_spec`
- `export_example_app`

Each public tool descriptor exposes both `inputSchema` and `outputSchema`.
`apply_commands` accepts `collectTrace: true` for review flows that need
command provenance, changed paths, and conflict diagnostics in the result.

## MCP Server

```bash
node node_modules/@gis-engine/ai/dist/mcp/server.js
```

The server communicates over stdio and returns structured diagnostics for tool
input or execution failures.
