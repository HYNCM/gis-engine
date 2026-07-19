# @gis-engine/ai

AI and MCP tool layer for GIS Engine. It wraps the public `@gis-engine/engine`
contracts without reaching into renderer internals.

## Quick Setup

### Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gis-engine": {
      "command": "npx",
      "args": ["-y", "@gis-engine/ai"]
    }
  }
}
```

Or if installed locally in your project:

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

### Cursor

Add the same JSON block above to your Cursor MCP settings
(`Settings → MCP → Add new global MCP server config`).

### Smithery

Install via Smithery CLI for Claude Desktop automatically:

```bash
npx -y @smithery/cli install @gis-engine/ai --client claude
```

### Available Tools (14 tools)

Canonical `tools/list` order: `apply_commands`, `validate_spec`, `export_spec`,
`get_context_summary`, `snapshot_spec`, `explain_spec`, `export_example_app`,
`diff_specs`, `generate_spec`, `inspect_data`, `edit_spec`, `query_features`,
`style_recommend`, `transform_data`.

| Tool | Description |
|---|---|
| `validate_spec` | Validate a MapSpec against the schema and return diagnostics |
| `apply_commands` | Apply a series of MapCommands to mutate a MapSpec |
| `export_spec` | Export a validated, optionally command-modified MapSpec |
| `get_context_summary` | Get a compact summary of the map state plus AI capability boundaries |
| `snapshot_spec` | Validate a MapSpec and produce a headless snapshot result |
| `explain_spec` | Return a structured AI-facing summary with full validation diagnostics |
| `export_example_app` | Return a manifest and file list for a bundled example (no files written) |
| `diff_specs` | Compare two MapSpecs and output the command diff with a change summary |
| `generate_spec` | Generate a MapSpec skeleton from a structured intent description |
| `inspect_data` | Inspect GeoJSON structure, properties, geometry types, and bounds |
| `edit_spec` | Edit a MapSpec using natural-language instructions through commands |
| `query_features` | Query inline GeoJSON features by point or bounding box |
| `style_recommend` | Recommend data-driven layer styles from inline GeoJSON |
| `transform_data` | Filter, aggregate, select, sort, or rename inline GeoJSON |

The server targets MCP `2025-11-25`. Each public tool descriptor exposes both
`inputSchema` and `outputSchema` using the JSON Schema draft-07 dialect.
`apply_commands` accepts `collectTrace: true` for review flows that need
command provenance, changed paths, and conflict diagnostics in the result.
The default `tools/list` inventory contains all 14 tools. The seven lifecycle
tools form the Phase 1 Core group; the remaining tools are additive Authoring
extensions and Data intelligence capabilities. Successful calls return schema-conforming
`structuredContent` plus a JSON text block. Execution errors return a
schema-conforming `{ diagnostics: [...] }` envelope and retain the legacy
diagnostics array in the text block.

## Generation Evidence Bundle

`planMapGenerationRequest()` in `@gis-engine/engine` is the typed planner
boundary for prompt hashes plus structured intent. It rejects raw prompt text by
default and produces `MapGenerationRequest`-compatible handoff data.

`createGenerationEvidenceBundle()` is the current prompt-level handoff helper.
It does not register a new MCP tool. Instead, it composes the existing public
contracts into one auditable result:

```txt
get_context_summary -> validate_spec -> apply_commands -> snapshot_spec -> export_spec -> export_example_app
```

The bundle records the prompt hash, target domains, command replay evidence,
planner evidence, point/bbox spatial query evidence, snapshot evidence, export
readiness, example manifest evidence, and structured diagnostics. Spatial query
evidence includes a `capabilityGate` so point/bbox cases are ready only when the
adapter declares matching query capability or an explicit waiver records the
reason, approver, and follow-up task. Invalid query geometry, missing/hidden
layers, missing sources, unsupported URL/archive/vector sources, and empty
results use stable case-local diagnostic paths under `/spatialQueries/cases`.
Each spatial query case also records bounded result metadata through
`resultLimit`, `resultTruncated`, and a deterministic `fixtureHash`, while
keeping raw feature payloads out of evidence and generated-app summaries.
`plannerEvidence` carries planner id, confidence, prompt/trace provenance,
accepted and unsupported intent fields, source prompt hashes, and diagnostic
counts. `exampleEvidence.generationEvidence` is the compact export manifest
handoff summary; it includes status, target domains, diagnostic counts, command
summary, planner summary, spatial query summary, scene browsing blocker
summary, snapshot status, export counts, and a delivery summary without
exposing feature payloads or snapshot data URLs. The delivery summary exposes
schema-testable `ready`, `blocked`, `needs-confirmation`, and
`follow-up-required` states, plus per-section status, confirmation boundaries,
follow-up tasks, source readiness as `supported`, `readiness-only`, or
`blocked`, and `spatialQueryReadiness` for query case state, capability gate
state, result caps, follow-up task ids, and blocked layer/source ids. A
generated app should be treated as ready only when the bundle returns
`status: "ready"`, `delivery.status: "ready"`, and the relevant
planner/spatial-query/snapshot/export evidence passes.

Scene browsing remains extension-only in this flow. `extensions.scene3d` can be
summarized through mock snapshot/query evidence, but
`view.mode: "scene3d"` and renderer-specific SceneView3D evidence remain
blocked until a future stable-runtime gate is accepted. The compact
`sceneBrowsing` summary includes `state: "extension-only"` and
`stableRuntimeBlocked: true` when scene browsing is present without stable
runtime approval. Mock snapshot/query summaries are readiness evidence only and
must not be cited as stable renderer evidence.

## AI Orchestration Guidance

`get_context_summary` and `explain_spec` return a `capabilitySummary` block
with three AI-facing domains:

- `feature-display`: supported 2D MapSpec sources/layers, experimental 2.5D
  `fill-extrusion-lite` gates, and the tools to validate, command-edit, export,
  snapshot, or discover bundled examples. The public source surface remains
  limited to `geojson`, `raster`, `pmtiles`, and `vector` at runtime; GeoParquet,
  FlatGeobuf, and GeoTIFF are public MapSpec source contracts with runtime
  blocked, and GeoZarr remains blocked until TypeBox schemas, resource-policy
  paths, diagnostics, adapter boundaries, and tests exist.
- `spatial-analysis`: current point/bbox query readiness is discoverable
  through capability metadata, but there is no dedicated public MCP query,
  buffer, intersection, overlay, routing, or aggregation tool yet.
- `scene-browsing`: `extensions.scene3d` is experimental and extension-only.
  `view.mode: "scene3d"` remains blocked until the stable renderer gate is
  explicitly accepted; the summary exposes mock snapshot/query evidence without
  promoting stable runtime support.

`get_context_summary` also includes a compact `sourceReadiness` array derived
from the engine `createSourceReadinessReport()` contract. PMTiles sources carry
an explicit archive contract snapshot so generation can see readiness, query
status, and policy context before review-console evidence is built; inline
GeoJSON reports resource policy as `not-applicable` because no URL policy check
is needed.

## Programmatic Usage

```typescript
import { callGisEngineTool, listGisEngineTools } from "@gis-engine/ai";

// List available tools
const tools = await listGisEngineTools();

// Call a tool
const result = await callGisEngineTool({
  name: "validate_spec",
  arguments: { spec: myMapSpec }
});
```

## Install

```bash
npm install @gis-engine/ai @gis-engine/engine
```

## MCP Server

```bash
# Run directly via npx (recommended)
npx -y @gis-engine/ai

# Or run from a local install
node node_modules/@gis-engine/ai/dist/mcp/server.js
```

The server communicates over stdio and returns structured diagnostics for tool
input or execution failures.

## API Reference

See the full API documentation at [gis-engine.dev/api/ai](https://gis-engine.dev/api/ai).
