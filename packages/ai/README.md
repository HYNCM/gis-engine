# @gis-engine/ai

Version v1.5.0 exposes the stable MCP `2025-11-25` contract. Public descriptors use JSON Schema draft-07.

## Run

```bash
npm install @gis-engine/ai @gis-engine/engine
npx gis-engine-mcp
```

## Contract

The canonical 14-tool inventory, in `tools/list` order, is:

`apply_commands`, `validate_spec`, `export_spec`, `get_context_summary`, `snapshot_spec`, `explain_spec`, `export_example_app`, `diff_specs`, `generate_spec`, `inspect_data`, `edit_spec`, `query_features`, `style_recommend`, `transform_data`.

Successful calls include schema-conforming `structuredContent`. Execution failures use the structured `{ diagnostics: Diagnostic[] }` envelope and retain the legacy JSON diagnostics text block.

Scene browsing remains extension-only and must not be cited as stable renderer evidence.

## Signposts

- [MCP server](src/mcp/server.ts)
- [Tool schemas](src/tools)
- [Contract tests](../../tests/ai/mcp-contract-convergence.test.ts)
- [Generated API reference](../../docs/website/api/reference/ai)
