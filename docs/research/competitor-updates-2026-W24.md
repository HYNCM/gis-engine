---
agent: product
period: 2026-W24
generated_at: 2026-06-09T16:48:15Z
repo_revision: "7ca08513bada13b127bf22cee101546329c266e7"
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
  - command: npm view geotiff version dist-tags --json
  - command: npm view geozarr version dist-tags --json
  - command: gh api repos/maplibre/maplibre-gl-js/releases/latest
  - command: gh api repos/mapbox/mapbox-gl-js/releases/latest
  - https://github.com/maplibre/maplibre-gl-js/releases
  - https://docs.mapbox.com/mapbox-gl-js/example/pmtiles-vector-source/
  - https://developers.arcgis.com/javascript/latest/release-notes/
  - https://developers.arcgis.com/javascript/latest/agentic-apps/ai-introduction/
  - https://modelcontextprotocol.io/specification/
  - https://modelcontextprotocol.io/specification/2025-06-18/server/tools
  - https://docs.protomaps.com/pmtiles/
  - https://geoparquet.org/releases/v1.1.0/
  - https://flatgeobuf.org/
  - https://docs.ogc.org/is/19-008r4/19-008r4.html
  - https://github.com/zarr-developers/geozarr-spec
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

## 2026-06-07 Productization Refresh

Checked at `2026-06-06T19:20:59Z` (`2026-06-07` Asia/Shanghai) with current
network access. This refresh closes the earlier environment-limited npm signal
gap but does not change the W24 roadmap priority.

| Project | Current npm signal | Delta From 2026-06-05 | GIS Engine Action |
| --- | --- | --- | --- |
| GIS Engine GA packages | `@gis-engine/engine`, `@gis-engine/ai`, `@gis-engine/cli`, and `@gis-engine/scene3d` are `1.0.0` on `latest`; `@gis-engine/scene3d` also has `next: 1.0.0` | Confirms GA publish state | Keep SDK+CLI installability and CLI bin smoke as P0 productization gates |
| MapLibre GL JS | `maplibre-gl` `5.24.0`, `next: 6.0.0-11` | No change | Keep current dependency range; no v6 package movement without strict visual evidence |
| Mapbox GL JS | `mapbox-gl` `3.24.0`, `next: 3.25.0-rc.1` | No change | Keep PMTiles/vector-source pressure as source-readiness work, not hidden IO |
| MCP TypeScript SDK | `@modelcontextprotocol/sdk` `1.29.0` | No change | Keep seven documented snake_case tool names frozen |
| ArcGIS Maps SDK / AI components | `@arcgis/core` `5.0.19`, `next: 5.2.0-next.10`; `@arcgis/ai-components` `5.0.19`, `next: 5.2.0-next.9` | `next` tags advanced slightly | Keep Workbench promotion intake blocked on ownership/auth/storage/export and visual evidence |
| Cloud-native data | `pmtiles` `4.4.1`, `flatgeobuf` `4.4.0`, `ol` `10.9.0`, `dev: 10.9.1-dev.1780767961894` | OpenLayers dev tag advanced | Promote one runtime source only through caller-controlled loader/resource-policy evidence |
| 3D / visualization | `cesium` `1.142.0`, `three` `0.184.0`, `3d-tiles-renderer` `0.4.27`, `deck.gl` `9.3.3`, `echarts` `6.1.0` | No release-gate-changing latest movement | Keep SceneView3D adapter-local and stable `view.mode: "scene3d"` blocked |

Commands used:
`npm view maplibre-gl version dist-tags --json`,
`npm view mapbox-gl version dist-tags --json`,
`npm view @modelcontextprotocol/sdk version dist-tags --json`,
`npm view @arcgis/core version dist-tags --json`,
`npm view @arcgis/ai-components version dist-tags --json`,
`npm view pmtiles version dist-tags --json`,
`npm view flatgeobuf version dist-tags --json`,
`npm view ol version dist-tags --json`,
`npm view cesium version dist-tags --json`,
`npm view three version dist-tags --json`,
`npm view 3d-tiles-renderer version dist-tags --json`,
`npm view deck.gl version dist-tags --json`,
`npm view echarts version dist-tags --json`,
`npm view @gis-engine/engine version dist-tags --json`,
`npm view @gis-engine/ai version dist-tags --json`,
`npm view @gis-engine/cli version dist-tags --json`, and
`npm view @gis-engine/scene3d version dist-tags --json`.

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

## 2026-06-08 Productization Closure Refresh

Checked at `2026-06-08T13:48:14Z` with current network access.

| Area | Current signal | Delta From 2026-06-07 | GIS Engine Action |
| --- | --- | --- | --- |
| GitHub PRs | `gh pr list --repo HYNCM/gis-engine --state open` returned `[]` | No open PRs | Direct `main` release-productization work can use local gates plus pushed CI status |
| GitHub Actions | Latest 10 runs were `success`; current `5ddec91` runs include CI, Agent Daily Cadence, Bundle Size, Deploy Docs, and Agent Failure Recovery | Removes the prior unknown Actions-state caveat for the pushed `001A` commit | Continue checking Actions before release claims for any new pushed commit |
| GIS Engine GA packages | `@gis-engine/engine`, `@gis-engine/ai`, `@gis-engine/cli`, and `@gis-engine/scene3d` are `1.0.0` on `latest`; scene3d also has `next: 1.0.0` | Confirms the local `1.0.0` identity matches npm latest | Keep linked-group install smoke and publish dry-run as release gates |
| MapLibre GL JS | `maplibre-gl` `5.24.0`, `next: 6.0.0-12` | `next` advanced from `6.0.0-11` | Still no package movement; future v6 task needs visual evidence |
| Mapbox GL JS | `mapbox-gl` `3.24.0`, `next: 3.25.0-rc.1` | No stable change | Keep PMTiles/vector-source pressure as source-readiness work |
| MCP TypeScript SDK | `@modelcontextprotocol/sdk` `1.29.0` | No change | Keep documented snake_case tool names and schemas frozen |
| ArcGIS Maps SDK / AI components | `@arcgis/core` `5.0.19`, `next: 5.2.0-next.12`; `@arcgis/ai-components` `5.0.19`, `next: 5.2.0-next.9` | Core `next` advanced; AI stable unchanged | Keep Workbench product movement blocked on owner/auth/storage/export/visual gates |
| Cloud-native data | `pmtiles` `4.4.1`, `flatgeobuf` `4.4.0`, `ol` `10.9.0`, `dev: 10.9.1-dev.1780925129923` | OpenLayers dev tag advanced | Accept PMTiles display/load-plan only; keep parsers/query blocked |
| 3D / visualization | `cesium` `1.142.0`, `three` `0.184.0`, `3d-tiles-renderer` `0.4.27`, `deck.gl` `9.3.3`, `echarts` `6.1.0` | No release-gate-changing stable movement | Keep SceneView3D adapter-local and stable `view.mode: "scene3d"` blocked |

Commands used:
`gh pr list --repo HYNCM/gis-engine --state open --limit 10 --json number,title,state,headRefName,updatedAt,url`,
`gh run list --repo HYNCM/gis-engine --limit 10 --json databaseId,workflowName,status,conclusion,createdAt,headBranch,headSha,url`,
`npm view @gis-engine/engine version dist-tags --json`,
`npm view @gis-engine/ai version dist-tags --json`,
`npm view @gis-engine/cli version dist-tags --json`,
`npm view @gis-engine/scene3d version dist-tags --json`,
`npm view maplibre-gl version dist-tags --json`,
`npm view mapbox-gl version dist-tags --json`,
`npm view @modelcontextprotocol/sdk version dist-tags --json`,
`npm view @arcgis/core version dist-tags --json`,
`npm view @arcgis/ai-components version dist-tags --json`,
`npm view pmtiles version dist-tags --json`,
`npm view flatgeobuf version dist-tags --json`,
`npm view ol version dist-tags --json`,
`npm view cesium version dist-tags --json`,
`npm view three version dist-tags --json`,
`npm view 3d-tiles-renderer version dist-tags --json`,
`npm view deck.gl version dist-tags --json`, and
`npm view echarts version dist-tags --json`.

## 2026-06-10 W25 Planning External Signal Refresh

Checked at `2026-06-09T16:48:15Z` (`2026-06-10` Asia/Shanghai) using npm
metadata, GitHub release API, and official-source URL reachability checks. This
refresh closes `TASK-2026W24-PROD-011` / GitHub issue
[#6](https://github.com/HYNCM/gis-engine/issues/6) for W25 planning input only.

### Package and Release Signals

| Area | Current Signal | Delta From 2026-06-08 | GIS Engine Action | Confidence |
| --- | --- | --- | --- | --- |
| MapLibre GL JS | npm `maplibre-gl` `5.24.0`, `next: 6.0.0-13`; GitHub latest release `v5.24.0` published `2026-04-23T06:30:43Z` | `next` advanced from `6.0.0-12`; stable unchanged | No package movement. Future v6 work still needs lockfile diff, example load, smoke snapshot, and strict visual evidence. | high |
| Mapbox GL JS | npm `mapbox-gl` `3.24.0`, `next: 3.25.0-rc.1`; GitHub latest release `v3.24.0` published `2026-05-18T12:28:39Z`; PMTiles vector-source example reachable | No stable change | Keep PMTiles/vector-source pressure as source-readiness and fixture evidence, not hidden IO or parser promotion. | high |
| MCP TypeScript SDK and spec | npm `@modelcontextprotocol/sdk` `1.29.0`; official 2025-06-18 server tools page reachable and includes tool `inputSchema` / `outputSchema` contract terms | No package change | Keep the seven documented GIS Engine snake_case tools frozen with input and output schemas. | high |
| ArcGIS Maps SDK / AI components | npm `@arcgis/core` `5.0.19`, `next: 5.2.0-next.13`; npm `@arcgis/ai-components` `5.0.19`, `next: 5.2.0-next.10`; ArcGIS release notes and agentic-app docs reachable | `next` tags advanced slightly | Keep AI Map Workbench product movement blocked until the promotion intake owners/auth/storage/export/visual gates are consumed by a future Go issue. | high |
| PMTiles | npm `pmtiles` `4.4.1`; Protomaps PMTiles concepts and Mapbox PMTiles vector example reachable | No package change | Keep accepted runtime scope to URL-compatible display/load-plan plus deterministic fixture query evidence; no archive parsing or hidden range IO. | high |
| FlatGeobuf / OpenLayers | npm `flatgeobuf` `4.4.0`; npm `ol` `10.9.0`, `dev: 10.9.1-dev.1780937436158`; FlatGeobuf official site reachable | OpenLayers dev tag advanced | Keep FlatGeobuf as policy/schema readiness only; no runtime parser or feature-query claim. | high |
| GeoParquet | Official GeoParquet `v1.1.0` page reachable | No new accepted runtime signal | Keep schema/metadata readiness; no runtime source support claim. | high |
| GeoTIFF | npm `geotiff` `3.0.5`, `beta: 3.1.0-beta.0`; OGC GeoTIFF Standard 1.1 page reachable | First explicit W25 GeoTIFF package/spec row | Treat as source-roadmap input only; runtime support needs resource-policy and fixture gates. | medium |
| GeoZarr | npm `geozarr` returned 404; the probed zarr.dev GeoZarr landing path returned 404; `zarr-developers/geozarr-spec` GitHub page reachable; `zarr-developers/geozarr-toolkit` shows active ecosystem work | First explicit W25 GeoZarr weak-signal row | Do not score as stable runtime pressure. Track as standards/ecosystem watch item only. | medium |
| 3D / visualization | npm `cesium` `1.142.0`, `three` `0.184.0`, `3d-tiles-renderer` `0.4.28`, `deck.gl` `9.3.3`, `echarts` `6.1.0` | `3d-tiles-renderer` advanced from `0.4.27` to `0.4.28`; others unchanged | Continue adapter-local SceneView3D evidence; no stable `view.mode: "scene3d"` promotion. | high |

Commands used:
`npm view maplibre-gl version dist-tags --json`,
`npm view mapbox-gl version dist-tags --json`,
`npm view @modelcontextprotocol/sdk version dist-tags --json`,
`npm view @arcgis/core version dist-tags --json`,
`npm view @arcgis/ai-components version dist-tags --json`,
`npm view pmtiles version dist-tags --json`,
`npm view flatgeobuf version dist-tags --json`,
`npm view ol version dist-tags --json`,
`npm view geotiff version dist-tags --json`,
`npm view geozarr version dist-tags --json`,
`npm view cesium version dist-tags --json`,
`npm view three version dist-tags --json`,
`npm view 3d-tiles-renderer version dist-tags --json`,
`npm view deck.gl version dist-tags --json`,
`npm view echarts version dist-tags --json`,
`gh api repos/maplibre/maplibre-gl-js/releases/latest --jq '{tag_name,name,published_at,html_url}'`,
and `gh api repos/mapbox/mapbox-gl-js/releases/latest --jq '{tag_name,name,published_at,html_url}'`.

Official-source URL checks returned HTTP 200 for
`https://github.com/maplibre/maplibre-gl-js/releases/tag/v5.24.0`,
`https://github.com/mapbox/mapbox-gl-js/releases/tag/v3.24.0`,
`https://docs.mapbox.com/mapbox-gl-js/example/pmtiles-vector-source/`,
`https://modelcontextprotocol.io/specification/2025-06-18/server/tools`,
`https://docs.protomaps.com/pmtiles/`,
`https://geoparquet.org/releases/v1.1.0/`,
`https://flatgeobuf.org/`,
`https://docs.ogc.org/is/19-008r4/19-008r4.html`,
`https://github.com/zarr-developers/geozarr-spec`,
`https://developers.arcgis.com/javascript/latest/release-notes/`, and
`https://developers.arcgis.com/javascript/latest/agentic-apps/ai-introduction/`.

### W25 Roadmap Outcome

No W25 priority changes are recommended from this refresh.

- SDK+CLI-first remains the launch surface. Studio and AI Map Workbench remain
  reference/example or intake surfaces unless a future product Go issue passes
  ownership, auth, storage, export, resource-policy, MCP, and visual gates.
- The bounded source-promotion plan stands. PMTiles now has accepted
  display/load-plan and deterministic fixture query evidence, but not archive
  parsing, vector tile decoding, workers, hidden range IO, or runtime
  cloud-native feature queries.
- MapLibre v6 remains a future package-movement task, not W25 automatic work.
- GeoTIFF and GeoZarr are watch items for source-roadmap planning. The current
  evidence does not justify a runtime parser or query implementation.
- `3d-tiles-renderer` patch movement is not enough to change SceneView3D
  priority; stable `view.mode: "scene3d"` stays blocked.
