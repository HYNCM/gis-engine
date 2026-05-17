# Supported Feature Matrix

This matrix defines the current MapLibre MVP surface. Features outside this table must return structured diagnostics instead of being silently accepted.

| Area | Supported in v0.1 | Notes |
| --- | --- | --- |
| Sources | `geojson`, `raster`, `pmtiles`, `vector` | PMTiles is transformed to a MapLibre vector source URL; generic vector tile URL templates are v0.2. |
| Layers | `background`, `raster`, `fill`, `line`, `circle`, `symbol-lite` | `symbol-lite` maps to MapLibre `symbol` without full collision/layout guarantees. |
| Expressions | `get`, `step`, `interpolate`, `literal`, `case`, `match`, `zoom`, `to-number`, `to-string` | `interpolate` supports linear interpolation only. |
| View | `center`, `zoom`, `bearing`, `pitch` | Bounds fitting remains command-level state in v0.1. |
| Commands | `addSource`, `removeSource`, `addLayer`, `removeLayer`, `setPaint`, `setLayout`, `reorderLayer`, `setView`, `fitBounds` | `baseRevision` conflicts are rejected; v0.1 does not automatically retry or perform three-way merge. |
| Current MCP tools | `validate_spec`, `apply_commands`, `export_spec`, `get_context_summary`, `snapshot_spec`, `explain_spec`, `export_example_app` | These are the only v0.1 tool names exposed by the current MCP server. CamelCase aliases are intentionally unsupported. |
| Snapshot smoke | data-url adapter smoke | Required deterministic gate. Must run under Node/Vitest and must not require real browser canvas, GPU, or WebGL. |
| Snapshot visual | Playwright + real browser MapLibre GL canvas | Conditional/release validation for pixel health and optional baseline diff. This is separate from `pnpm check` unless a release job explicitly requires visual snapshots. |
| MapLibre adapter binding | Transformer + adapter contract MVP | Visual snapshot tests exercise real browser MapLibre GL canvas health. |

Explicitly out of scope for the current stable surface: full symbol placement, terrain, globe, 3D Tiles, custom WebGL layers, heatmap, clusters, SceneView3D runtime, and full Mapbox expression compatibility.
