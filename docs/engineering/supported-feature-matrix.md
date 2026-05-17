# Supported Feature Matrix

This matrix defines the v0.1 MapLibre MVP surface. Features outside this table must return structured diagnostics instead of being silently accepted.

| Area | Supported in v0.1 | Notes |
| --- | --- | --- |
| Sources | `geojson`, `raster`, `pmtiles` | PMTiles is transformed to a MapLibre vector source URL. |
| Layers | `background`, `raster`, `fill`, `line`, `circle`, `symbol-lite` | `symbol-lite` maps to MapLibre `symbol` without full collision/layout guarantees. |
| Expressions | `get`, `step`, `interpolate`, `literal` | `interpolate` supports linear interpolation only. |
| View | `center`, `zoom`, `bearing`, `pitch` | Bounds fitting remains command-level state in v0.1. |
| Snapshot | data URL smoke | Pixel regression is a later hardening step. |

Explicitly out of scope for v0.1: full symbol placement, terrain, globe, 3D Tiles, custom WebGL layers, heatmap, clusters, and full Mapbox expression compatibility.
