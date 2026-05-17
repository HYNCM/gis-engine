# Supported Feature Matrix

This matrix defines the v0.1 MapLibre MVP surface. Features outside this table must return structured diagnostics instead of being silently accepted.

| Area | Supported in v0.1 | Notes |
| --- | --- | --- |
| Sources | `geojson`, `raster`, `pmtiles` | PMTiles is transformed to a MapLibre vector source URL. |
| Layers | `background`, `raster`, `fill`, `line`, `circle`, `symbol-lite` | `symbol-lite` maps to MapLibre `symbol` without full collision/layout guarantees. |
| Expressions | `get`, `step`, `interpolate`, `literal` | `interpolate` supports linear interpolation only. |
| View | `center`, `zoom`, `bearing`, `pitch` | Bounds fitting remains command-level state in v0.1. |
| Commands | `addSource`, `removeSource`, `addLayer`, `removeLayer`, `setPaint`, `setLayout`, `reorderLayer`, `setView`, `fitBounds` | `baseRevision` conflicts are rejected; v0.1 does not automatically retry or perform three-way merge. |
| Current MCP tools | `validate_spec`, `apply_commands`, `export_spec`, `get_context_summary` | These are the only v0.1 tool names exposed by the current MCP server. CamelCase aliases are intentionally unsupported. |
| Planned MCP tools | `snapshot_spec`, `explain_spec`, `export_example_app` | Future additions must use snake_case and include schema/contract tests before release. |
| Snapshot smoke | data-url adapter smoke | Required deterministic gate. Must run under Node/Vitest and must not require real browser canvas, GPU, or WebGL. |
| Snapshot visual | Playwright + real browser MapLibre GL canvas | Conditional/release validation for pixel health and optional baseline diff. This is separate from `pnpm check` unless a release job explicitly requires visual snapshots. |
| MapLibre adapter binding | Transformer + adapter contract MVP | Real browser MapLibre GL canvas binding is deferred to a future `RFC-QC-*` change. |

Explicitly out of scope for v0.1: full symbol placement, terrain, globe, 3D Tiles, custom WebGL layers, heatmap, clusters, and full Mapbox expression compatibility.
