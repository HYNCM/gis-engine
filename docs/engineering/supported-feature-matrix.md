# Supported Feature Matrix

This matrix defines the current MapLibre MVP surface after the 2026-05-17 v0.2 checkpoint. Features outside this table must return structured diagnostics instead of being silently accepted.

| Area | Supported surface | Notes |
| --- | --- | --- |
| Sources | `geojson`, `raster`, `pmtiles`, `vector` | PMTiles is transformed to a MapLibre vector source URL; generic vector tile URL templates support `tiles[]` and `url`. |
| Layers | `background`, `raster`, `fill`, `line`, `circle`, `symbol-lite`, `fill-extrusion-lite` | `symbol-lite` maps to MapLibre `symbol`; `fill-extrusion-lite` maps to MapLibre `fill-extrusion` only when explicitly gated as experimental 2.5D. |
| Expressions | `get`, `step`, `interpolate`, `literal`, `case`, `match`, `zoom`, `to-number`, `to-string` | `interpolate` supports linear interpolation only. |
| View | `center`, `zoom`, `bearing`, `pitch` | Bounds fitting remains command-level state in v0.1. |
| Commands | `addSource`, `removeSource`, `addLayer`, `removeLayer`, `setPaint`, `setLayout`, `reorderLayer`, `setView`, `fitBounds` | `baseRevision` conflicts are rejected; `collectTrace` returns deterministic audit traces; v0.1 does not automatically retry or perform three-way merge. |
| Current MCP tools | `validate_spec`, `apply_commands`, `export_spec`, `get_context_summary`, `snapshot_spec`, `explain_spec`, `export_example_app` | These are the only tool names exposed by the current MCP server. CamelCase aliases are intentionally unsupported. Tool descriptors include input and output schemas. |
| Snapshot smoke | data-url adapter smoke | Required deterministic gate. Must run under Node/Vitest and must not require real browser canvas, GPU, or WebGL. |
| Snapshot visual | Playwright + real browser MapLibre GL canvas | Conditional/release validation for pixel health and optional baseline diff. Current scenarios cover GeoJSON and generated local MVT. This is separate from `pnpm check` unless a release job explicitly requires visual snapshots. |
| MapLibre adapter binding | Transformer + adapter contract MVP | Visual snapshot tests exercise real browser MapLibre GL canvas health. |
| Experimental boundary | `fill-extrusion-lite`, `scene3d` | `fill-extrusion-lite` is beta-supported by the MapLibre adapter behind explicit gates; `scene3d` is reserved and returns unsupported diagnostics. |

Explicitly out of scope for the current stable surface: full symbol placement, terrain, globe, 3D Tiles, custom WebGL layers, heatmap, clusters, SceneView3D runtime, and full Mapbox expression compatibility.
