# Supported Feature Matrix

This matrix defines the current MapLibre MVP surface after the 2026-05-17
v0.2 checkpoint and the 2026-05-18 SceneView3D v1 preparation pass. Features
outside this table must return structured diagnostics instead of being silently
accepted.

| Area | Supported surface | Notes |
| --- | --- | --- |
| Sources | `geojson`, `raster`, `pmtiles`, `vector` | PMTiles is transformed to a MapLibre vector source URL; generic vector tile URL templates support `tiles[]` and `url`. |
| Layers | `background`, `raster`, `fill`, `line`, `circle`, `symbol-lite`, `fill-extrusion-lite` | `symbol-lite` maps to MapLibre `symbol`; `fill-extrusion-lite` maps to MapLibre `fill-extrusion` only when explicitly gated as experimental 2.5D. |
| Expressions | `get`, `step`, `interpolate`, `literal`, `case`, `match`, `zoom`, `to-number`, `to-string` | `interpolate` supports linear interpolation only. |
| View | `center`, `zoom`, `bearing`, `pitch` | Bounds fitting remains command-level state in v0.1. |
| Commands | `addSource`, `removeSource`, `addLayer`, `removeLayer`, `setPaint`, `setLayout`, `reorderLayer`, `setView`, `fitBounds`; SceneView3D prep commands `setSceneCamera`, `addSceneSource`, `removeSceneSource`, `addSceneLayer`, `removeSceneLayer`, `setSceneLayerVisibility` | `baseRevision` conflicts are rejected; `collectTrace` returns deterministic audit traces; v0.1 does not automatically retry or perform three-way merge. SceneView3D prep commands mutate only `extensions.scene3d`. |
| Current MCP tools | `validate_spec`, `apply_commands`, `export_spec`, `get_context_summary`, `snapshot_spec`, `explain_spec`, `export_example_app` | These are the only tool names exposed by the current MCP server. CamelCase aliases are intentionally unsupported. Tool descriptors include input and output schemas. `get_context_summary` and `explain_spec` include extension-only SceneView3D context when present. |
| Natural-language generation evidence | `MapGenerationRequestSchema`, `createMapGenerationCommandSkeleton()`, `createGenerationEvidenceBundle()` | Prompt-level handoff evidence composes existing tool contracts, command replay, diagnostics, snapshot/export readiness, and example manifests. It does not expose a `generate_map_app` MCP tool. Spatial-analysis stays readiness-only, and scene browsing stays under `extensions.scene3d`. |
| Snapshot smoke | data-url adapter smoke plus SceneView3D release visual gate contract | Required deterministic gate. Must run under Node/Vitest and must not require real browser canvas, GPU, or WebGL. SceneView3D release mode requires renderer visual evidence or a coordinator waiver, and waivers cannot bypass pending resources or snapshot/query diagnostics. |
| Snapshot visual | Playwright + real browser MapLibre GL canvas | Conditional/release validation for pixel health and optional baseline diff. Current scenarios cover GeoJSON, generated local MVT, and gated `fill-extrusion-lite`. This is separate from `pnpm check` unless a release job explicitly requires visual snapshots. |
| MapLibre adapter binding | Transformer + adapter contract MVP | Visual snapshot tests exercise real browser MapLibre GL canvas health. |
| Experimental boundary | `fill-extrusion-lite`, `extensions.scene3d`, `@gis-engine/scene3d` scaffold, `@gis-engine/scene3d-three-adapter` spike | `fill-extrusion-lite` is beta-supported by the MapLibre adapter behind explicit gates. `extensions.scene3d` has a formal schema, source URL policy checks, layer-source validation, command patches, loader resource load plan gate, mock snapshot/query contracts, MCP context summaries, and release visual waiver rules. The Three.js adapter spike currently creates deterministic load-plan/resource-policy evidence only; `view.mode: "scene3d"` still returns unsupported diagnostics. |

Explicitly out of scope for the current stable surface: full symbol placement,
terrain rendering, globe, production 3D Tiles loading, glTF rendering, custom
WebGL layers, heatmap, clusters, SceneView3D runtime, and full Mapbox expression
compatibility.
