---
agent: product
period: 2026-W29
generated_at: 2026-07-13T15:54:58Z
repo_revision: "bdd71e24a6cacc88cef578211943685a23890e38"
inputs:
  - package.json
  - packages/ai/src/mcp/server.ts
  - packages/engine/src/sources/pmtiles-loader.ts
  - packages/scene3d-three-adapter/README.md
  - docs/intent/project-definition.md
  - docs/planning/feature-specs/current-product-definition.md
  - docs/planning/feature-specs/pmtiles-runtime-query-promotion-boundary.md
  - docs/planning/feature-specs/review-console-workbench-go-gate.md
  - docs/planning/monthly-roadmap.md
  - https://github.com/maplibre/maplibre-gl-js/releases/tag/v5.24.0
  - https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.0.0-17
  - https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.0.0-20
  - https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.0.0-21
  - https://github.com/mapbox/mapbox-gl-js/releases/tag/v3.25.0
  - https://github.com/mapbox/mapbox-gl-js/releases/tag/v3.26.0
  - https://github.com/CesiumGS/cesium/releases/tag/1.142
  - https://github.com/CesiumGS/cesium/releases/tag/1.143
  - https://github.com/mrdoob/three.js/releases/tag/r185
  - https://github.com/NASA-AMMOS/3DTilesRendererJS/releases/tag/v0.4.28
  - https://github.com/visgl/deck.gl/releases/tag/v9.3.0
  - https://github.com/openlayers/openlayers/releases/tag/v10.9.0
  - https://github.com/protomaps/PMTiles
  - https://geoparquet.org/releases/v1.1.0/
  - https://github.com/modelcontextprotocol/modelcontextprotocol/releases/tag/2025-11-25
  - https://modelcontextprotocol.io/specification/2025-11-25/server/tools
  - https://github.com/modelcontextprotocol/modelcontextprotocol/releases/tag/2026-07-28-RC
  - https://developers.openai.com/api/docs/guides/structured-outputs
  - https://developers.arcgis.com/javascript/latest/agentic-apps/ai-introduction/
owner: "@product"
decision_level: advisory
status: ready-for-planning
---

# Competitor Updates: 2026-W29

Checked on `2026-07-13` (ISO week `2026-W29`). Package metadata came from the
npm registry in this run; release and behavior claims came only from the
official sources listed in the source ledger. This report is planning input. It
does not approve package upgrades, new public MCP tools, hidden network IO,
hosted Workbench GA, or stable SceneView3D promotion.

## Executive Decision

The highest-leverage next phase is contract convergence, not a new renderer or
another format badge.

1. GIS Engine has a strong schema/command/diagnostic foundation, but its public
   MCP implementation now exposes 14 tools while the repository operating
   contract still freezes seven names. Every descriptor declares an
   `outputSchema`, yet MCP results are serialized only as text and do not return
   `structuredContent`. MCP `2025-11-25` makes this gap material.
2. Cloud-native pressure is real, especially from OpenLayers 10.9, PMTiles v3,
   and GeoParquet 1.1. The immediate product task is capability-truth
   reconciliation: the repo exports a range-IO PMTiles runtime loader while the
   active product definition and promotion boundary still say runtime query is
   No-go. Adding another loader before resolving that contradiction would make
   product claims less reliable.
3. MapLibre v6 prereleases now include event-type and `Map`/`Camera` structural
   changes. Mapbox 3.25/3.26 continues advancing ESM packaging, model/terrain,
   and vector-tile performance. The current MapLibre 5.24 pin remains sensible,
   but the next 2D slice should be a real compatibility matrix, not an automatic
   dependency bump.
4. Cesium 1.142 added direct MVT-to-3D-Tiles loading with feature metadata and
   picking, while Three.js r185 and 3DTilesRendererJS remain active. GIS
   Engine's adapter package still intentionally contains no Three.js or
   3DTilesRendererJS runtime dependency. SceneView3D should therefore remain an
   evidence milestone after the contract and source-truth work.
5. ArcGIS AI components make conversational map navigation and data exploration
   easy to discover, but the official docs still label them beta and warn about
   nondeterministic inaccuracies. GIS Engine should compete on reviewability,
   deterministic commands, and structured evidence rather than on chat surface
   breadth alone.

## Current Repository Baseline

| Surface | Current evidence | Product reading |
| --- | --- | --- |
| Release/toolchain | Packages are `1.5.0`; root pins pnpm `11.9.0`, Node `>=22.13.0`, and MapLibre `5.24.0` in the lockfile. | SDK + CLI remains the primary adoption surface. |
| AI/MCP | `gisEngineTools` exposes 14 snake_case tools and tests assert exactly 14; every descriptor has input/output schemas. `toolTextResult()` returns only text content. | Strong implementation breadth, but public-tool governance and MCP structured-result conformance must be reconciled before expansion. |
| Cloud-native | Public source schemas include PMTiles, FlatGeobuf, GeoParquet, and GeoTIFF. `PMTilesRuntimeLoader` is exported and performs caller-supplied range IO; active planning still says PMTiles runtime query is No-go. | Capability truth is internally inconsistent. Treat runtime support as unapproved until a quality/orchestrator promotion decision resolves it. |
| SceneView3D | `@gis-engine/scene3d-three-adapter` is `0.2.5`, has no Three.js/3DTilesRendererJS dependency, creates no graphics context, and keeps `stableViewMode: false`. | Contract scaffold and deterministic evidence only; no stable renderer claim. |
| Workbench | Feature-flagged candidate route has conditional Go; hosted GA remains blocked on auth, deployment, monitoring, and support policy. | Preserve the review-console advantage, but do not let hosting work outrank public contract correctness. |

## External Signals

| Project | Verified signal | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| MapLibre GL JS | npm stable remains `5.24.0`; `next` is `6.0.0-21`. v6 prereleases change strongly typed map events, make `Map` compose `Camera`, remove internal `map.transform`, and add a missing-style-image resolver. | Adapter/event compatibility can break even if style-spec behavior appears stable. | Keep 5.24 as the release baseline; require public-API-only adapter checks, event compile tests, example load, smoke snapshots, and strict visuals before v6 movement. | high |
| Mapbox GL JS | `3.26.0` is stable. 3.25 switched the ESM entry point to named exports, exposed more layer-level setters, and improved model, symbol, and vector-tile performance; 3.26 improves terrain raycasting and model LOD. | The commercial benchmark is moving on packaging, expressions, and 2D/3D convergence. | Audit expression/layer-property gaps and bundle behavior; do not copy proprietary APIs into core contracts. | high |
| CesiumJS | `1.143.0` is stable. 1.142 introduced `MVTDataProvider`, which loads MVT as 3D Tiles with style, picking, and structural metadata; 1.143 adds `KHR_meshopt_compression`. | Feature identity and metadata are becoming part of the expected 3D evidence contract, not just pixels. | Add picking metadata and compressed glTF cases to the future adapter evidence matrix before considering stable promotion. | high |
| Three.js / 3DTilesRendererJS | Three.js is `0.185.1` (`r185`). 3DTilesRendererJS is `0.4.28`; its latest patch fixed missing required PMTiles/vector-tile dependencies, and its official README shows metadata, PMTiles vector overlays, WMTS/WMS, and multiple 3D Tiles providers. | A real adapter will carry nontrivial dependency, loader, credential, and resource-policy obligations. | Keep dependencies adapter-local; build one real browser renderer slice with load, picking, snapshot, teardown, and blocked-resource evidence. | high |
| deck.gl | `9.3.6` is current; the 9.3 release highlights widgets, controllers, and WebGPU improvements. | Visualization UX and GPU evolution remain competitive pressure, but do not alter the generic core boundary. | Use deck.gl as a visual/performance benchmark; avoid a second renderer integration until the current adapter gate is decision-ready. | medium |
| OpenLayers | `10.9.0` is current. Its release adds major GeoZarr/GeoTIFF improvements, multi-group/per-band metadata, custom fetch, more efficient tile loading, concurrent byte-range coalescing, and WebGL precision/performance work. | Cloud-native raster and caller-controlled IO are now concrete browser-SDK benchmarks. | Prioritize a loader-policy contract with abort, range budgets, caching/coalescing evidence, CRS/band diagnostics, and deterministic negative fixtures. | high |
| PMTiles / GeoParquet | `pmtiles` remains `4.4.1`; PMTiles v3 is a single-file tiled archive designed for static object storage. GeoParquet 1.1 defines optional bbox covering and GeoArrow-native encodings for more efficient spatial filtering. | Users expect range-addressable data and metadata-aware filtering without a custom backend. | Finish one truthful PMTiles end-to-end promotion gate first; retain GeoParquet as a separately gated read-only spike using bbox/CRS/encoding fixtures. | high |
| MCP / structured outputs | MCP `2025-11-25` is stable and defines `outputSchema` plus `structuredContent`; structured results must conform when an output schema is declared. `2026-07-28-RC` is explicitly not final. OpenAI's official guide recommends schema-constrained Structured Outputs over JSON mode when supported. | Schema declarations without protocol-native structured results weaken interoperability and machine verification. | Freeze tool expansion, choose the approved public tool inventory, return conforming `structuredContent` with text fallback, and add protocol-version/conformance tests against the stable spec. Track the RC only. | high |
| ArcGIS Maps SDK / AI components | `@arcgis/core` and `@arcgis/ai-components` are `5.1.12`. Official docs provide assistant, navigation, data-exploration, help, and custom-agent paths, while explicitly marking AI components beta and warning about inaccuracies. | Competitor pressure is highest on discoverable AI workflow UX, but deterministic acceptance remains an open differentiator. | Keep the Workbench as a review console with command evidence, refusals/diagnostics, and audit receipts; defer hosted GA until its separate launch gate passes. | high |

## Priority Recommendations

Formula from `AGENTS.md`:

```text
priority =
  competitor_threat * 0.35 +
  ai_operability_gain * 0.30 +
  user_value * 0.20 +
  technical_debt_reduction * 0.10 -
  delivery_risk * 0.05
```

Each factor is scored from 0 to 10. Parenthetical text is the evidence-based
reason for that factor score.

| Rank | Candidate direction | Threat | AI gain | User value | Debt reduction | Delivery risk | Priority |
| ---: | --- | --- | --- | --- | --- | --- | ---: |
| 1 | MCP stable-spec and public-tool contract convergence | 9 (MCP stable revision moved; ArcGIS/OpenAI normalize schema-driven tools) | 10 (restores machine-verifiable tool results) | 8 (reliable cross-client behavior) | 10 (14-vs-7 and text-vs-schema drift) | 3 (bounded server/tests/docs change) | **8.60** |
| 2 | Cloud-native capability-truth gate, PMTiles first | 8 (OpenLayers, PMTiles, GeoParquet) | 7 (source readiness becomes trustworthy to agents) | 9 (real remote-data workflow) | 10 (exported loader conflicts with active No-go) | 6 (range IO, decode, security, fixtures) | **7.40** |
| 3 | MapLibre v6 / Mapbox 3.26 compatibility and expression audit | 8 (two fast-moving 2D baselines) | 5 (better deterministic translation) | 8 (protects the primary renderer path) | 8 (stale audit assumptions) | 4 (mostly matrix/tests before upgrade) | **6.50** |
| 4 | Hosted Workbench launch-gate specification | 7 (ArcGIS agentic UX is increasingly packaged) | 7 (reviewable agent workflow) | 8 (coherent product surface) | 4 (candidate route already exists) | 9 (auth, operations, support, security) | **6.10** |
| 5 | Real SceneView3D adapter evidence slice | 8 (Cesium/MVT and Three/3D Tiles advance) | 4 (limited effect on current AI loop) | 7 (visible roadmap value) | 8 (contract scaffold lacks runtime proof) | 9 (renderer, assets, picking, cleanup, visuals) | **5.75** |

### Recommendation 1: MCP Contract Convergence

- **Evidence:** MCP stable tools specification; OpenAI Structured Outputs guide;
  `packages/ai/src/mcp/server.ts`; `tests/ai/mcp-integration.test.ts`; AGENTS MCP
  contract.
- **Impact:** Public AI behavior and architecture. A declared schema currently
  cannot be consumed as protocol-native structured output, and the approved
  tool inventory is ambiguous.
- **Action:** `@orchestrator` should open one blocking contract-reconciliation
  issue owned by `@builder` (AI focus), with `@quality` acceptance for tool
  inventory, `structuredContent`, schema conformance, compatibility text, and
  no undocumented aliases.
- **Confidence:** high.

### Recommendation 2: PMTiles Capability Truth

- **Evidence:** PMTiles v3 official repository; OpenLayers 10.9 release;
  `packages/engine/src/sources/pmtiles-loader.ts`; active PMTiles No-go spec.
- **Impact:** Product claims, security/resource policy, and user trust. The code
  can report runtime readiness that planning has not approved, and the loader
  itself documents simplified directory/tile-id behavior.
- **Action:** `@orchestrator` should gate public promotion on spec-correct
  archive fixtures, caller-controlled range IO, abort/budget/cache evidence,
  decoder ownership, structured diagnostics, adapter query integration, and a
  final `@quality` Go/No-go. Do not start GeoParquet runtime implementation in
  the same issue.
- **Confidence:** high.

### Recommendation 3: 2D Compatibility Audit

- **Evidence:** MapLibre v5.24/v6.0.0-21 release notes; Mapbox 3.25/3.26 release
  notes; current MapLibre 5.24 lockfile and adapter tests.
- **Impact:** The primary SDK renderer path, TypeScript consumers, visual
  stability, and future package movement.
- **Action:** `@orchestrator` should schedule a matrix that compiles against
  MapLibre 5.24 and latest v6 prerelease, exercises only public APIs, records
  event/type drift, runs generated examples, and captures smoke/strict visuals.
  Upgrade only in a later decision after v6 becomes stable.
- **Confidence:** high.

### Recommendation 4: Hosted Workbench Launch Gate

- **Evidence:** ArcGIS agentic-app documentation and current
  `review-console-workbench-go-gate.md`, which gives the candidate route a
  conditional Go but keeps hosted GA blocked.
- **Impact:** Product UX and operations. A hosted route could improve discovery
  and review, but it also creates authentication, deployment, monitoring,
  support, privacy, and rollback obligations that the SDK/CLI does not carry.
- **Action:** `@orchestrator` should keep this as a separate launch-spec issue
  after the contract/source-truth work, with explicit owners and Go/No-go
  evidence for every blocked operational surface.
- **Confidence:** high.

### Recommendation 5: Real SceneView3D Evidence Slice

- **Evidence:** Cesium 1.142/1.143, Three.js r185, 3DTilesRendererJS 0.4.28 and
  capability inventory, plus the local adapter README/package manifest showing
  no real renderer dependency or graphics context.
- **Impact:** 3D product credibility, performance, resource security, and
  adapter architecture. The existing contract cannot prove that real assets
  render, pick, cancel, or clean up correctly.
- **Action:** `@orchestrator` should authorize one adapter-local browser slice
  after higher-ranked work: one controlled 3D Tiles/glTF fixture, resource
  policy, picking metadata, lifecycle teardown, canvas evidence, snapshot, and
  release-capable visual gate. Stable promotion remains a later decision.
- **Confidence:** high.

## HOC-N1 Handoff: @product -> @orchestrator

**Status:** `ready-for-planning`

Required artifacts:

1. `docs/research/competitor-updates-2026-W29.md`
2. `docs/research/capability-scorecard.md`

Planning intake:

- Make MCP/public-tool contract convergence the first issue and release
  prerequisite.
- Make PMTiles capability-truth reconciliation the second issue; keep
  GeoParquet/FlatGeobuf as separate promotion gates.
- Plan the MapLibre compatibility matrix before dependency movement.
- Keep hosted Workbench and real SceneView3D evidence as independently gated
  follow-ups; neither is approved for GA/stable promotion by this handoff.
- Merge these advisory priorities with a fresh HOC-N3 quality decision. This
  report does not override an existing blocking gate.

HOC-N1 validation:

- External claims were checked in this run and have official URLs below.
- The scorecard is dated `2026-W29` and includes W24-to-W29 deltas.
- Priority recommendations include factor justifications plus Evidence,
  Impact, Action, and Confidence.

## Official Source Ledger

All entries were checked at `2026-07-13T15:54:58Z` unless stated otherwise.

| Area | Official source | Observed evidence |
| --- | --- | --- |
| MapLibre stable | https://github.com/maplibre/maplibre-gl-js/releases/tag/v5.24.0 | Published `2026-04-23`; performance optimizations and terrain/globe fixes. |
| MapLibre prerelease | https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.0.0-17, https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.0.0-20, and https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.0.0-21 | Published `2026-06-24`, `2026-07-05`, and `2026-07-12`; event typing, `Map`/`Camera` structure, and resolver changes. `6.0.0-21` is latest npm `next`. |
| Mapbox | https://github.com/mapbox/mapbox-gl-js/releases/tag/v3.25.0 and https://github.com/mapbox/mapbox-gl-js/releases/tag/v3.26.0 | Published `2026-06-17` and `2026-07-09`; ESM/performance changes followed by terrain/model changes. npm latest is `3.26.0`. |
| Cesium | https://github.com/CesiumGS/cesium/releases/tag/1.142 and https://github.com/CesiumGS/cesium/releases/tag/1.143 | Published `2026-06-01` and `2026-07-01`; MVT provider/metadata then meshopt support. |
| Three.js | https://github.com/mrdoob/three.js/releases/tag/r185 | Published `2026-07-01`; npm latest `0.185.1`. |
| 3DTilesRendererJS | https://github.com/NASA-AMMOS/3DTilesRendererJS/releases/tag/v0.4.28 and https://github.com/NASA-AMMOS/3DTilesRendererJS | Published `2026-06-09`; package fix plus official capability/examples inventory. |
| deck.gl | https://github.com/visgl/deck.gl/releases/tag/v9.3.0 | Published `2026-04-13`; 9.3 focus. npm latest is `9.3.6`. |
| OpenLayers | https://github.com/openlayers/openlayers/releases/tag/v10.9.0 | Published `2026-04-15`; GeoZarr/GeoTIFF, range loading, and WebGL changes. |
| PMTiles | https://github.com/protomaps/PMTiles | Official README identifies v3, single-file archive, object-storage, MapLibre/OpenLayers consumption. npm latest is `4.4.1`. |
| GeoParquet | https://geoparquet.org/releases/v1.1.0/ | Stable specification for CRS, bbox covering, and optional GeoArrow-native encodings. |
| MCP stable | https://github.com/modelcontextprotocol/modelcontextprotocol/releases/tag/2025-11-25 and https://modelcontextprotocol.io/specification/2025-11-25/server/tools | Stable release plus input/output schema and structured-content contract. npm SDK latest is `1.29.0`. |
| MCP draft | https://github.com/modelcontextprotocol/modelcontextprotocol/releases/tag/2026-07-28-RC | Explicit prerelease/RC; not a planning baseline for implementation. |
| Structured outputs | https://developers.openai.com/api/docs/guides/structured-outputs | Official schema-adherence, refusal, and schema/type-divergence guidance. |
| ArcGIS agentic apps | https://developers.arcgis.com/javascript/latest/agentic-apps/ai-introduction/ | Assistant/agent/tool architecture, navigation and exploration agents, beta warning. npm latest packages are `5.1.12`. |

Registry commands executed in this run included
`npm view <package> version dist-tags time.modified repository.url homepage
--json` for `maplibre-gl`, `mapbox-gl`, `cesium`, `three`,
`3d-tiles-renderer`, `deck.gl`, `ol`, `pmtiles`, `geoparquet`,
`@modelcontextprotocol/sdk`, `@arcgis/core`, `@arcgis/ai-components`,
`flatgeobuf`, and `echarts`.
