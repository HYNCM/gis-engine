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

## AI Orchestration Guidance

`get_context_summary` and `explain_spec` return a `capabilitySummary` block
with three AI-facing domains:

- `feature-display`: supported 2D MapSpec sources/layers, experimental 2.5D
  `fill-extrusion-lite` gates, and the tools to validate, command-edit, export,
  snapshot, or discover bundled examples.
- `spatial-analysis`: current point/bbox query readiness is discoverable
  through capability metadata, but there is no dedicated public MCP query,
  buffer, intersection, overlay, routing, or aggregation tool yet.
- `scene-browsing`: `extensions.scene3d` is experimental and extension-only.
  `view.mode: "scene3d"` remains blocked until the stable renderer gate is
  explicitly accepted; the summary exposes mock snapshot/query evidence without
  promoting stable runtime support.

## MCP Server

```bash
node node_modules/@gis-engine/ai/dist/mcp/server.js
```

The server communicates over stdio and returns structured diagnostics for tool
input or execution failures.
