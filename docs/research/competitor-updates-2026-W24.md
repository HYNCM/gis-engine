---
agent: product
period: 2026-W24
generated_at: 2026-06-05T13:05:41Z
repo_revision: "4012f51"
inputs:
  - command: npm view maplibre-gl version dist-tags --json
  - command: npm view mapbox-gl version dist-tags --json
  - command: npm view @modelcontextprotocol/sdk version dist-tags --json
  - command: npm view @arcgis/core version dist-tags --json
  - command: npm view @arcgis/ai-components version dist-tags --json
  - command: npm view pmtiles version dist-tags --json
  - command: npm view flatgeobuf version dist-tags --json
  - command: npm view ol version dist-tags --json
  - command: npm view cesium version dist-tags --json
  - command: npm view three version dist-tags --json
  - command: npm view 3d-tiles-renderer version dist-tags --json
  - command: npm view deck.gl version dist-tags --json
  - command: npm view echarts version dist-tags --json
  - https://github.com/maplibre/maplibre-gl-js/releases
  - https://docs.mapbox.com/mapbox-gl-js/example/pmtiles-vector-source/
  - https://developers.arcgis.com/javascript/latest/release-notes/
  - https://developers.arcgis.com/javascript/latest/agentic-apps/ai-introduction/
  - https://modelcontextprotocol.io/specification/
  - https://docs.protomaps.com/pmtiles/
  - https://geoparquet.org/releases/v1.1.0/
owner: "@product"
decision_level: advisory
---

# Competitor Updates: 2026-W24

Checked on 2026-06-05. This refresh replaces the W24 placeholder with dated npm
metadata and official-source URLs. It is a planning input only; it does not
approve package movement, hidden source loading, product workbench hosting, or
stable SceneView3D runtime promotion.

## Executive Summary

1. Package pressure is still bounded. `maplibre-gl` remains `5.24.0` with
   `next` at `6.0.0-11`; `mapbox-gl` remains `3.24.0` with `next` at
   `3.25.0-rc.1`; `@modelcontextprotocol/sdk` remains `1.29.0`.
2. ArcGIS agentic-map pressure is unchanged in direction but current enough to
   keep review-console UX as the P0 productization path. GIS Engine should
   continue making generated-map acceptance inspectable from structured
   evidence instead of free-form assistant prose.
3. Cloud-native data pressure remains real, and W24 implementation work has
   moved the response from placeholder planning to metadata/policy contracts
   for PMTiles, GeoParquet, and FlatGeobuf. This still is not parser/query
   runtime support.
4. 3D ecosystem movement does not change the product gate. `cesium` moved from
   the W23 checked `1.141.0` to `1.142.0`, while `three` and
   `3d-tiles-renderer` stay unchanged. SceneView3D remains adapter-local and
   stable `view.mode: "scene3d"` remains blocked after SRC-006.

## Refreshed Package Signals

| Project | 2026-06-05 checked signal | GIS Engine impact | Confidence |
| --- | --- | --- | --- |
| ArcGIS Maps SDK JS / AI components | `@arcgis/core` and `@arcgis/ai-components` are `5.0.19`; `next` tags point at `5.2.0-next.8`. | Keep agentic map review as product pressure. Do not promote hosted workbench without ownership, credential, durable audit, and release visual gates. | high |
| MapLibre GL JS | `maplibre-gl` is `5.24.0`; `next` is `6.0.0-11`. | Keep current dependency range. Future v6 movement still requires a separate package-movement task with strict visual evidence. | high |
| Mapbox GL JS | `mapbox-gl` is `3.24.0`; `next` is `3.25.0-rc.1`. | PMTiles/vector examples continue to pressure source-readiness UX, but do not justify archive parsing or hidden fetches. | high |
| MCP TypeScript SDK | `@modelcontextprotocol/sdk` is `1.29.0`. | Keep the seven documented snake_case GIS Engine tools and input/output schemas frozen. | high |
| PMTiles / FlatGeobuf / OpenLayers | `pmtiles` is `4.4.1`, `flatgeobuf` is `4.4.0`, and `ol` is `10.9.0` with `dev` at `10.9.1-dev.1780494309225`. | Treat W24 cloud-native work as schema/resource-policy readiness. Runtime parsers, range IO, and workers remain blocked unless separately promoted. | high |
| CesiumJS / Three.js / 3DTilesRendererJS / deck.gl | `cesium` is `1.142.0`, `three` is `0.184.0`, `3d-tiles-renderer` is `0.4.27`, and `deck.gl` is `9.3.3`. | Continue adapter-local SceneView3D evidence. Do not move stable `view.mode: "scene3d"` without a future quality/orchestrator Go. | high |
| ECharts | `echarts` is `6.1.0`. | Option-first visualization remains a useful reference for declarative, reviewable state but does not change GIS Engine roadmap priority. | medium |

Observed package versions from `npm view` on 2026-06-05:
`maplibre-gl` `5.24.0`, `mapbox-gl` `3.24.0`,
`@modelcontextprotocol/sdk` `1.29.0`, `@arcgis/core` `5.0.19`,
`@arcgis/ai-components` `5.0.19`, `pmtiles` `4.4.1`,
`flatgeobuf` `4.4.0`, `ol` `10.9.0`, `cesium` `1.142.0`,
`three` `0.184.0`, `3d-tiles-renderer` `0.4.27`, `deck.gl` `9.3.3`,
and `echarts` `6.1.0`.

## Product Impact

| Signal | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Review-console pressure remains P0 | ArcGIS agentic app docs plus GIS Engine W24 review-console implementation/tests | AI-generated app acceptance needs a structured product surface, not prose review | Keep `RCU-001` and `RCU-002` as implemented/pending quality acceptance; require browser smoke before Done | high |
| Cloud-native source support must stay contract-first | PMTiles, GeoParquet, FlatGeobuf, and OpenLayers signals plus W24 validators/tests | Users will expect cloud-native formats, but hidden IO would violate resource policy | Treat `CNS-001` through `CNS-003` as implemented contracts pending quality acceptance; parser/runtime stays backlog | high |
| Visual/perf evidence needs real trend data | W24 adds strict scene and perf-trend tests, but `VPE-002` asks for two weeks of trends | A one-time harness is not the same as trend evidence | Mark VPE harness implemented and keep two-week trend accumulation as backlog/ongoing evidence | high |
| MapLibre movement remains blocked | `maplibre-gl` stable/next tags unchanged from W23 | Package movement would affect rendering and examples | Open a future package-movement task only after stable v6, lockfile diff, example loading, and strict visual gate | high |
| SceneView3D stable runtime remains blocked | Cesium moved to `1.142.0`, but GIS Engine SRC-006 No-go still controls promotion | Ecosystem movement is not accepted runtime evidence | Keep stable `view.mode: "scene3d"` blocked; use adapter-local evidence only | high |

## W24 Reconciliation Outcome

1. `PRD-001` is complete and consumed by the updated orchestrator digest and
   handoff ledger.
2. `PRD-002` is complete: `capability-scorecard.md` records the W24 scores and
   keeps SceneView3D/source-runtime blockers intact.
3. `RCU-*`, `CNS-*`, and `VPE-001/VPE-003` are reclassified as
   `implemented / pending quality acceptance` instead of `queued`.
4. `VPE-002` is reclassified as `harness implemented / trend backlog` because
   two weeks of nightly evidence cannot be complete from one implementation
   commit.
5. Do not convert any cloud-native policy contract into a runtime parser,
   hidden fetch, worker, or source loader claim in public docs.
