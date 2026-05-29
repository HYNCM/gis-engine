---
agent: competitive-intel
period: 2026-W22
generated_at: 2026-05-29T07:51:47Z
repo_revision: "704104dfc92719ca73481b8f79d85d527c9a73da"
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
owner: "@competitive-intel"
decision_level: advisory
---

# Competitor Updates: 2026-W22

Checked on 2026-05-29. This refresh uses official project, package, or
specification sources only. It updates the earlier W22 report after the W23
natural-language generation backlog closed, so the recommendations focus on
the next AI-native product loop rather than reopening completed NLA tasks.

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

Observed package versions from `npm view` on 2026-05-29: `maplibre-gl`
5.24.0, `mapbox-gl` 3.24.0, `cesium` 1.141.0, `three` 0.184.0,
`3d-tiles-renderer` 0.4.27, `deck.gl` 9.3.2, `@deck.gl/core` 9.3.2,
`ol` 10.9.0, `echarts` 6.1.0, `@arcgis/core` 5.0.19,
`@arcgis/ai-components` 5.0.19, `pmtiles` 4.4.1, and `flatgeobuf` 4.4.0.

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

### [P0] Add A Typed Prompt Planner Contract

- Evidence: ArcGIS AI components validate natural-language map application
  generation as a competitive surface; local NLA work already has a structured
  evidence skeleton.
- Impact: product, AI safety, developer experience.
- Action: `@ai-agent` and `@engine-agent` should define a prompt planner input
  and output contract that emits `MapGenerationRequest`, diagnostics, and trace
  metadata, then prove it with command and AI tests.
- Confidence: high.

### [P0] Design Spatial Query Evidence Before Geoprocessing

- Evidence: GeoParquet `covering.bbox`, OpenLayers data-source signals, and
  existing local spatial-analysis readiness all point to query-readiness first.
- Impact: spatial analysis, AI safety, future data support.
- Action: `@engine-agent` and `@ai-agent` should keep point/bbox query evidence
  first and preserve blocked diagnostics for buffer, overlay, routing, and
  aggregation until public commands exist.
- Confidence: high.

### [P1] Harden Generated-App Export Evidence

- Evidence: current generation evidence includes export/example summaries, but
  packageable app delivery is the next user-visible step.
- Impact: developer experience and release clarity.
- Action: `@ai-agent`, `@docs-agent`, and `@qa-agent` should make
  `export_example_app` surface generation evidence, diagnostics, and asset
  resource status without writing files as a side effect.
- Confidence: medium.

### [P1] Create A Cloud-Native Source Readiness Matrix

- Evidence: PMTiles, GeoParquet, FlatGeobuf, and OpenLayers source signals show
  that generated maps will need portable source diagnostics beyond URL syntax.
- Impact: resource policy, data interoperability, spatial-analysis readiness.
- Action: `@engine-agent` and `@docs-agent` should draft support states,
  blocked diagnostics, and test-fixture expectations before adding new source
  implementations.
- Confidence: high.

### [P1] Keep Scene Browsing Blockers Visible In Generation Evidence

- Evidence: SRC-006 is No-go and NLA-005/NLA-006 already prove stable scene3d
  blocked prompts.
- Impact: release safety and AI explainability.
- Action: `@adapter-agent` and `@qa-agent` should preserve
  `SCENE3D.STABLE_RUNTIME_*` blockers in generated-app evidence and keep
  renderer evidence out of the public NLA bundle until a future Go decision.
- Confidence: high.
