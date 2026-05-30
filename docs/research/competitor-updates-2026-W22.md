---
agent: competitive-intel
period: 2026-W22
generated_at: 2026-05-30T05:32:28Z
repo_revision: "374248689630327c1df2360fbcea684eaadc2c31"
inputs:
  - https://github.com/maplibre/maplibre-gl-js/releases
  - https://maplibre.org/maplibre-style-spec/
  - https://github.com/mapbox/mapbox-gl-js/releases
  - https://docs.mapbox.com/style-spec/guides/
  - https://docs.mapbox.com/mapbox-gl-js/example/pmtiles-vector-source/
  - https://github.com/CesiumGS/cesium/releases
  - https://github.com/mrdoob/three.js/releases
  - https://github.com/NASA-AMMOS/3DTilesRendererJS/releases
  - https://github.com/visgl/deck.gl/releases
  - https://github.com/apache/echarts/releases
  - https://github.com/openlayers/openlayers/releases
  - https://developers.arcgis.com/javascript/latest/release-notes/
  - https://developers.arcgis.com/javascript/latest/agentic-apps/ai-introduction/
  - https://github.com/protomaps/go-pmtiles/releases
  - https://docs.protomaps.com/pmtiles/
  - https://geoparquet.org/releases/v1.1.0/
  - https://github.com/flatgeobuf/flatgeobuf
  - https://github.com/flatgeobuf/flatgeobuf/releases
  - https://modelcontextprotocol.io/specification/
  - https://modelcontextprotocol.io/specification/2025-06-18/server/tools
  - https://platform.openai.com/docs/guides/structured-outputs
  - https://platform.openai.com/docs/guides/tools-computer-use
  - command: npm view maplibre-gl version time.modified --json
  - command: npm view mapbox-gl version time.modified --json
  - command: npm view cesium version time.modified --json
  - command: npm view three version time.modified --json
  - command: npm view 3d-tiles-renderer version time.modified --json
  - command: npm view deck.gl version time.modified --json
  - command: npm view @deck.gl/core version time.modified --json
  - command: npm view ol version time.modified --json
  - command: npm view echarts version time.modified --json
  - command: npm view @arcgis/core version time.modified --json
  - command: npm view @arcgis/ai-components version time.modified --json
  - command: npm view pmtiles version time.modified --json
  - command: npm view flatgeobuf version time.modified --json
  - command: npm view @modelcontextprotocol/sdk version time.modified --json
  - command: npm view @arcgis/core version time.modified --json
  - command: npm view @arcgis/ai-components version time.modified --json
  - command: npm view maplibre-gl version time.modified --json
  - command: npm view mapbox-gl version time.modified --json
  - command: npm view cesium version time.modified --json
  - command: npm view three version time.modified --json
  - command: npm view 3d-tiles-renderer version time.modified --json
owner: "@competitive-intel"
decision_level: advisory
---

# Competitor Updates: 2026-W22

Checked on 2026-05-29 and refreshed on 2026-05-30. This refresh uses official
project, package, or specification sources only. It updates the earlier W22
report after the W23 natural-language generation, generation-quality
hardening, and AIN delivery/planning batches closed, so the recommendations
focus on the next AI-native product loop rather than reopening completed
NLA/NLQ/AIN tasks.

## Executive Summary

External pressure is strongest in four places:

1. Natural-language GIS application generation is now a direct product signal.
   ArcGIS Maps SDK 5.0 documents AI components for agentic mapping
   applications and natural-language web map/data interaction. GIS Engine's
   answer should stay evidence-first: prompt classification -> structured
   generation request -> `MapGenerationCommandSkeleton` -> `apply_commands` ->
   diagnostics -> snapshot/export/example evidence.
2. Schema-driven style and source contracts remain a competitive baseline.
   MapLibre and Mapbox both keep public style specs at the center of their
   ecosystem, while Mapbox now documents PMTiles vector sources directly in GL
   JS examples. Generated maps therefore need auditable source/style/resource
   decisions, not free-form renderer mutation.
3. Cloud-native data expectations are broadening beyond vector tile URLs.
   PMTiles v3, GeoParquet 1.1, FlatGeobuf streaming/range semantics, and
   OpenLayers GeoZarr/GeoTIFF signals all point toward a future data-readiness
   layer with metadata validation, resource-policy diagnostics, and export
   handoff rules.
4. 3D and WebGPU pressure is rising, but the safe GIS Engine path is unchanged.
   CesiumJS, Three.js, 3DTilesRendererJS, and deck.gl continue to move on 3D
   Tiles, metadata, terrain, WebGPU, and Gaussian splats. This supports
   adapter-local SceneView3D evidence work, not stable `view.mode: "scene3d"`
   promotion.

## New Releases And Signals

| Project | Checked signal | GIS Engine impact | Confidence |
| --- | --- | --- | --- |
| ArcGIS Maps SDK JS | Official 5.0 release notes name AI components beta for agentic mapping apps; npm reports `@arcgis/core` and `@arcgis/ai-components` at 5.0.19 on 2026-05-29. | Prioritize a real prompt planner/parser contract and generated-app evidence bundle polish, while keeping generated edits schema-first and command-only. | high |
| MapLibre GL JS | npm stable is `maplibre-gl` 5.24.0, while GitHub releases show v6 prereleases with ESM-only/WebGL2/API drift signals; the style spec is explicitly for software that generates or processes styles. | Add upgrade drift tasks before dependency movement, and use the style spec as the validation target for AI-generated styling. | high |
| Mapbox GL JS | npm shows `mapbox-gl` 3.24.0; official style spec guidance exposes schema/validation, and the PMTiles vector source example treats `.pmtiles` URLs as first-class source input. | Keep vector/PMTiles examples release-gated and make generated source decisions auditable through resource policy and export evidence. | high |
| CesiumJS | npm shows Cesium 1.141.0; official releases include continued 3D Tiles/vector/metadata and advanced 3D visualization movement. | Use CesiumJS as a high-fidelity reference only; do not pull Cesium into core packages. | high |
| Three.js | npm shows `three` 0.184.0 / r184, with active migration guidance around renderer behavior. | Keep Three.js isolated in adapter packages and require browser/snapshot evidence for any renderer claim. | high |
| 3DTilesRendererJS | npm shows `3d-tiles-renderer` 0.4.27, modified 2026-05-25; GitHub release notes include PMTiles/MVT overlay and structural metadata signals in the 0.4.x line. | If future SceneView3D work consumes 3D Tiles, lock event-field, overlay, and metadata semantics in adapter-local contract tests. | high |
| deck.gl | GitHub releases show a 9.3.x line with widgets/controllers/WebGPU work; npm `deck.gl` and `@deck.gl/core` currently report 9.3.2. | Treat declarative layer and WebGPU pressure as evidence for adapter contracts, not a reason to hand-roll renderer logic in core. | high |
| ECharts | npm shows ECharts 6.1.0, modified 2026-05-19; official release notes continue option-first visualization improvements. | Use option-first design as a UX reference for AI-verifiable visualization configs, not as GIS renderer parity. | high |
| OpenLayers | npm shows `ol` 10.9.0, modified 2026-05-22; official releases include GeoZarr/GeoTIFF, WebGL, and flat-style evolution. | Plan cloud-native raster/array source readiness behind schemas and resource policy before implementation. | high |
| PMTiles | PMTiles current spec is v3; `pmtiles` npm is 4.4.1; go-pmtiles releases show active CLI work and MapLibre Vector Tile `.mlt` support in the 1.30 line. | Generated maps may reference PMTiles, but edits should produce rebuild/export tasks rather than pretending archive mutation is in-place. | high |
| GeoParquet | Official GeoParquet 1.1.0 defines JSON Schema validation, WKB/GeoArrow encodings, CRS metadata, and `covering.bbox` for query acceleration. | Create a data-readiness feature path for metadata validation, bbox query planning, CRS diagnostics, and large-data export evidence. | high |
| FlatGeobuf | Official repo/spec describes magic bytes, version signaling, optional Hilbert R-tree index, streaming/random access, and HTTP range behavior; GitHub releases have no current release artifact. | Treat FlatGeobuf as a fixture-pinned static vector-source candidate with medium confidence until release cadence is clearer. | medium |
| MCP / structured outputs / computer-use tooling | MCP latest spec page now points beyond the 2025-06-18 tool schema page; OpenAI structured outputs and computer-use docs reinforce JSON Schema contracts, tool safety, screenshots, allowlists, and high-risk confirmation. | Keep GIS Engine MCP descriptors with input and output schemas, structured diagnostics, command-only mutation, browser evidence, and explicit human/safety boundaries. | high |

Observed package versions from `npm view` on 2026-05-29 after NLQ closure:
`maplibre-gl` 5.24.0, `mapbox-gl` 3.24.0, `cesium` 1.141.0, `three` 0.184.0,
`3d-tiles-renderer` 0.4.27, `deck.gl` 9.3.2, `@deck.gl/core` 9.3.2,
`ol` 10.9.0, `echarts` 6.1.0, `@arcgis/core` 5.0.19,
`@arcgis/ai-components` 5.0.19, `pmtiles` 4.4.1, `flatgeobuf` 4.4.0, and
`@modelcontextprotocol/sdk` 1.29.0.

## 2026-05-30 Next-Loop Refresh

The AIN batch is now closed, so the refreshed competitive signal should feed a
new planning batch. Official and package-registry checks on 2026-05-30 showed:

| Project | 2026-05-30 checked signal | GIS Engine impact | Confidence |
| --- | --- | --- | --- |
| ArcGIS Maps SDK JS / AI components | Official 5.0 release notes document AI components beta for assistant, navigation, data exploration, help, and agentic map interaction. `npm view` reported `@arcgis/core` 5.0.19 modified 2026-05-30T04:05:41Z and `@arcgis/ai-components` 5.0.19 modified 2026-05-30T04:42:47Z. | The next product slice should make generated app review and acceptance inspectable. Do not add MCP aliases; compose the existing tools into a clearer evidence handoff. | high |
| Mapbox GL JS | `npm view` reported `mapbox-gl` 3.24.0 modified 2026-05-18. Official changelog and PMTiles examples keep model, terrain, raster, and PMTiles loading pressure visible. | Keep PMTiles and raster parity behind schema, resource-policy, diagnostics, and snapshot gates. Generated apps should expose source readiness rather than imply archive mutation or new loaders. | high |
| MapLibre GL JS | `npm view` reported `maplibre-gl` 5.24.0 modified 2026-05-21; upstream release stream continues v6 prerelease work with WebGL2/ESM drift implications. | Run the existing MapLibre version-drift checklist before dependency movement. The review console should explain renderer/source limits without depending on a package upgrade. | high |
| CesiumJS / Three.js / 3DTilesRendererJS | `npm view` reported `cesium` 1.141.0, `three` 0.184.0, and `3d-tiles-renderer` 0.4.27 modified 2026-05-25. Official 3D ecosystem movement continues around metadata, load events, runtime evidence, and 3D Tiles. | Keep SceneView3D evidence adapter-local. Future metadata/query work needs schema and visual evidence; stable `view.mode: "scene3d"` remains blocked after SRC-006. | high |
| PMTiles and cloud-native data | `npm view` reported `pmtiles` 4.4.1 and `flatgeobuf` 4.4.0; PMTiles appears in official Mapbox loading paths while GeoParquet, FlatGeobuf, GeoTIFF, and GeoZarr remain readiness candidates. | Prioritize PMTiles readiness wording and review-console source cards before runtime parser/worker work. GeoParquet/FlatGeobuf/GeoTIFF/GeoZarr stay blocked or readiness-only until promotion gates land. | medium-high |

## Threats To GIS Engine Assumptions

### Natural-Language Apps Need A Real Planner Boundary

- Evidence: ArcGIS AI components make agentic map applications and
  natural-language web map/data interaction an official product surface.
- Impact: product and AI safety; GIS Engine now has the generation evidence
  skeleton, but not a public free-form prompt parser/planner contract.
- Action: create the next W23 task batch around a typed prompt planner that
  returns `MapGenerationRequest` / command skeleton evidence, without adding
  MCP tool aliases.
- Confidence: high.

### Cloud-Native Sources Need Readiness Diagnostics

- Evidence: Mapbox PMTiles examples, PMTiles v3 docs, GeoParquet 1.1 metadata,
  FlatGeobuf range semantics, and OpenLayers GeoZarr/GeoTIFF work all point to
  portable source expectations.
- Impact: user value, resource policy, and future spatial-analysis readiness.
- Action: add a data-readiness plan covering PMTiles, GeoParquet, and
  FlatGeobuf metadata, range access, CRS, bbox, and export handoff diagnostics.
- Confidence: high.

### SceneView3D Should Stay Adapter-Gated

- Evidence: CesiumJS, Three.js, deck.gl, and 3DTilesRendererJS continue active
  3D/WebGPU/metadata movement, but the repo's SRC-006 decision remains No-go.
- Impact: architecture and release honesty; natural-language generation must
  not smuggle stable 3D runtime through snapshot or export evidence.
- Action: keep scene browsing extension-only and maintain separate adapter
  evidence, release visual, and coordinator promotion gates.
- Confidence: high.

### MCP And Structured Outputs Are Contract Pressure

- Evidence: MCP tools expose schema contracts; OpenAI structured outputs
  emphasize JSON Schema matching; computer-use docs emphasize controlled loops,
  screenshots, allowlists, and user confirmation for high-risk actions.
- Impact: AI operability and security; GIS Engine generated-app workflows need
  machine-readable diagnostics plus explicit side-effect boundaries.
- Action: keep public tool names frozen and route any future prompt/planner work
  through existing MCP descriptors, evidence bundles, and command traces.
- Confidence: high.

## Recommended Follow-Up Tasks

### [P0] Design The Generated-App Delivery UX Contract

- Evidence: ArcGIS AI components validate agentic/natural-language map apps as
  a product surface, and NLQ-001 through NLQ-007 now provide a structured
  evidence spine.
- Impact: product and developer experience; the next gap is how a user receives,
  inspects, accepts, and iterates on a generated map application.
- Action: `@product-strategist`, `@ai-agent`, and `@docs-agent` should define a
  generated-app delivery contract for manifest sections, readiness badges,
  blocked capability explanations, and confirmation boundaries.
- Confidence: high.

### [P0] Plan Source-Readiness Promotion Tasks Before Implementation

- Evidence: PMTiles, GeoParquet, FlatGeobuf, and OpenLayers GeoZarr/GeoTIFF
  signals show broad cloud-native source pressure, while NLQ-005 keeps
  unsupported formats blocked.
- Impact: data interoperability, resource policy, spatial-analysis readiness.
- Action: `@engine-agent` and `@docs-agent` should split future source work into
  schema/resource-policy diagnostics, fixture gates, and export handoff tasks
  before any GeoParquet, FlatGeobuf, GeoTIFF, or GeoZarr implementation claim.
- Confidence: high.

### [P1] Define Post-NLQ Spatial Analysis Promotion Criteria

- Evidence: GeoParquet `covering.bbox` and existing point/bbox query evidence
  support read-only query readiness, but geoprocessing remains blocked.
- Impact: AI safety and user trust; generated apps must explain why buffer,
  overlay, routing, aggregation, and intersection are not executable yet.
- Action: `@engine-agent`, `@ai-agent`, and `@qa-agent` should draft promotion
  criteria for each future operation: schema, command semantics, diagnostics,
  deterministic fixtures, and MCP exposure assessment.
- Confidence: high.

### [P1] Keep Scene Browsing As Product Copy, Not Runtime Promotion

- Evidence: CesiumJS, Three.js, deck.gl, and 3DTilesRendererJS keep external 3D
  pressure high, but SRC-006 and NLQ-006 preserve the stable-runtime blocker.
- Impact: release honesty and generated-app UX; users can see scene-browsing
  intent without receiving a false stable 3D renderer claim.
- Action: `@adapter-agent`, `@qa-agent`, and `@docs-agent` should plan
  user-facing scene-browsing copy and evidence summaries separately from any
  future stable-runtime Go package.
- Confidence: high.

### [P2] Refresh MapLibre And Mapbox Drift Before Dependency Movement

- Evidence: MapLibre and Mapbox package lines continue moving, and generated
  styles now depend on schema/style compatibility.
- Impact: 2D reliability and generated-map rendering quality.
- Action: `@engine-agent` should use the MapLibre version-drift checklist
  before package upgrades, including transformer, style-spec, resource-policy,
  smoke snapshot, and visual snapshot evidence.
- Confidence: medium.

### [P0] Productize Generated-App Review And Acceptance

- Evidence: ArcGIS AI components make agentic map applications a current
  product signal, while AIN-001 through AIN-005 closed the structured delivery
  contract and promotion criteria.
- Impact: user value and AI safety; the next gap is an inspectable review
  surface that maps generated-app status to diagnostics, command trace,
  snapshot/export evidence, source readiness, spatial-analysis readiness, and
  extension-only scene browsing.
- Action: `@product-strategist`, `@docs-agent`, `@ai-agent`, and `@qa-agent`
  should open the Generated App Review Console sprint. It must use the
  existing MCP tools, preserve side-effect boundaries, and keep unsupported
  source/spatial/scene capabilities blocked.
- Confidence: high.
