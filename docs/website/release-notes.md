# Release Notes

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
