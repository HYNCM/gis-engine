# Release Notes

## Unreleased

GeoParquet versioned metadata now requires explicit `1.1.0` or reviewed
`2.0.0-rc.1` evidence and has a breaking `@gis-engine/engine` changeset. This
main-branch contract is not part of the published v1.5.0 package. It does not
promote GeoParquet fetch, parsing, WASM execution, display, or feature query;
all runtime paths remain No-go until a separate quality-approved release gate.

## v1.5.0

GIS Engine v1.5.0 is the current public SDK and CLI release line. It extends
the schema-first, command-only workflow with a complete AI-facing contract while
keeping experimental product, renderer, and cloud-native runtime claims behind
their promotion gates.

### MCP Contract

The [MCP overview](/mcp/overview) documents the canonical 14 MCP tools in the
exact `tools/list` order:

`apply_commands`, `validate_spec`, `export_spec`, `get_context_summary`,
`snapshot_spec`, `explain_spec`, `export_example_app`, `diff_specs`,
`generate_spec`, `inspect_data`, `edit_spec`, `query_features`,
`style_recommend`, `transform_data`

The first seven tools form the Core lifecycle group. `diff_specs`,
`generate_spec`, and `edit_spec` are Authoring extensions. `inspect_data`,
`query_features`, `style_recommend`, and `transform_data` are Data intelligence
tools. Public descriptors include both `inputSchema` and `outputSchema`, and
successful calls return schema-conforming `structuredContent`.

### Release Boundaries

- **Hosted Workbench GA**: No-go.
- **Stable SceneView3D**: No-go.
- **PMTiles runtime query support**: No-go.

The AI Map Workbench remains a local reference implementation, stable
`view.mode: "scene3d"` remains blocked, and PMTiles runtime archive loading and
feature query remain blocked. Fixture evidence, IO-free preflight, and
adapter-local evidence do not promote those capabilities.

### Historical Record

The complete v1.0.0 release record follows. Package versions and npm tags in
that section describe the v1.0.0 release at that time; they are not statements
about current registry tags.

## v1.0.0

First stable release of GIS Engine — a schema-first, AI-native map rendering SDK.

### Release Summary

GIS Engine v1.0.0 closes the gap between a contract-heavy engine core and a
usable external developer experience. The release ships the stable SDK + CLI
line, generated API reference, migration guidance, release verification chain,
and first-run paths for both CLI scaffold and CDN single-file usage.

### Packages

| Package | Version | Tag |
|---|---|---|
| `@gis-engine/engine` | 1.0.0 | latest |
| `@gis-engine/ai` | 1.0.0 | latest |
| `@gis-engine/cli` | 1.0.0 | latest |
| `@gis-engine/scene3d` | 1.0.0 | next |
| `@gis-engine/scene3d-three-adapter` | 0.2.x | (not published) |

### Highlights

**@gis-engine/engine** — Core runtime with `MapSpec` schema (TypeBox + Ajv), command system (`applyCommands` with JSON Patch RFC 6902), structured diagnostics, snapshot validation, renderer adapter contract (`MockAdapter` / `MapLibreAdapter`), and resource policy enforcement.

**@gis-engine/ai** — MCP server with seven tools (`validate_spec`, `apply_commands`, `export_spec`, `get_context_summary`, `snapshot_spec`, `explain_spec`, `export_example_app`), generation orchestration via `planMapGenerationRequest`, and evidence bundles via `createGenerationEvidenceBundle`.

**@gis-engine/cli** — Developer CLI with `create-gis-map` scaffolding and `--generate` flag for AI-powered map generation workflows.

**@gis-engine/scene3d** — Experimental 3D scene contract scaffold. Published under `next` tag — `view.mode: "scene3d"` is reserved and not a stable runtime mode. Includes `validateSceneResourceLoadPlan`, `snapshotScene3DMock`, `queryScene3DMock`, and `evaluateScene3DReleaseVisualGate`.

### Migration Note

- Existing `0.2.x`, `0.3.x`, and `0.4.x` users should start with
  [/guide/migrate-v0x-to-v1](/guide/migrate-v0x-to-v1).
- The public MCP tool surface remains seven tools; no migration is required for
  tool names.
- SceneView3D and runtime-blocked cloud-native loaders remain explicitly
  blocked in public wording and should not be treated as newly promoted
  runtime capabilities.

### Known Limitations

- No automatic retry for command application or export flows.
- No three-way merge for concurrent editing.
- `MapLibreAdapter` is an MVP renderer binding, not a complete MapLibre GL JS replacement.
- `fill-extrusion-lite` is experimental and gated by `capabilities.experimental`.
- scene3d terrain, glTF, and 3D Tiles are not implemented renderers yet.

### Installation

```bash
npm install @gis-engine/engine maplibre-gl
```

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map
```
