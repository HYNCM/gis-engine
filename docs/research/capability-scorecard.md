---
agent: competitive-intel
period: 2026-W22
generated_at: 2026-05-29T10:20:00Z
repo_revision: "d628fd1454a44859e57d8996343413684a541c30"
inputs:
  - docs/research/competitor-updates-2026-W22.md
  - docs/planning/sprint-2026-W23-ai-map-app-generation.md
  - docs/reviews/nla-002-generation-command-contract-2026-05-29.md
  - docs/reviews/nla-003-mcp-orchestration-evidence-2026-05-29.md
  - docs/reviews/nla-006-prompt-evidence-scenarios-2026-05-29.md
  - docs/reviews/nla-008-serialized-planning-handoff-2026-05-29.md
  - docs/reviews/nlq-007-serialized-quality-hardening-planning-2026-05-29.md
  - docs/planning/sceneview3d-src-006-stable-runtime-decision-2026-05-29.md
owner: "@competitive-intel"
decision_level: advisory
---

# Capability Scorecard

Scores are advisory product signals, not release approvals. Every external
benchmark below was refreshed on 2026-05-29 from official sources recorded in
`competitor-updates-2026-W22.md`.

| Dimension | GIS Engine Score | Current External Benchmark | Evidence Note | Confidence |
| --- | ---: | --- | --- | --- |
| AI operability | 9.2/10 | ArcGIS AI components; MCP tools and structured-output schema contracts | GIS Engine now has prompt planning schemas, planner provenance, point/bbox query evidence, generated-app manifest evidence, scene-browsing blocker visibility, `capabilitySummary`, command-only generation, MCP output schemas, diagnostics, and prompt QA scenarios. The open gap is productized generated-app delivery UX, not the evidence spine. | high |
| 2D performance | 6.5/10 | MapLibre v5/v6 drift; Mapbox style spec and PMTiles examples | Generic vector sources, PMTiles-compatible URL policy, MapLibre transformation, and visual/smoke evidence exist. The next score bump requires a version-drift audit and generated-style compatibility checks before dependency movement. | high |
| 3D readiness | 5.4/10 | CesiumJS, Three.js, 3DTilesRendererJS, deck.gl WebGPU/3D Tiles movement | SceneView3D has adapter contract, dependency boundary, lifecycle, snapshot/query, browser evidence, release-gate rules, and SRC-006 No-go. This remains evidence readiness, not stable runtime support. | high |
| Developer experience | 7.5/10 | ArcGIS natural-language map UX; Mapbox/MapLibre examples; ECharts option-first visualization | Generated-app evidence now carries compact manifest summaries, spatial-query readiness, source-readiness boundaries, and scene-browsing blockers. The next gap is user-facing delivery/acceptance UX. | medium |
| Ecosystem and data readiness | 7.0/10 | PMTiles v3, GeoParquet 1.1, FlatGeobuf range access, OpenLayers GeoZarr/GeoTIFF | GIS Engine has resource policy, portable vector-source foundations, and a cloud-native readiness matrix. GeoParquet/FlatGeobuf/GeoZarr remain blocked until schema/resource-policy/runtime contracts exist. | high |

## W22 Delta

- AI operability rises from 9.0 to 9.2 because NLQ-001 through NLQ-007 closed:
  generated app evidence now includes planner, spatial-query, export manifest,
  source-readiness, scene-browsing blocker, and serialized planning evidence.
  It does not reach 10 because generated-app delivery and acceptance UX are not
  productized yet.
- 2D performance rises from 6.3 to 6.5 because this refresh adds MapLibre v6
  prerelease drift and Mapbox style-spec/PMTiles evidence as explicit future
  audit targets. No package movement happened in this cycle.
- 3D readiness rises from 5.2 to 5.4 because the NLA evidence loop preserves
  SceneView3D blocker visibility after SRC-006. Stable `view.mode: "scene3d"`
  remains blocked and must not be scored as runtime support.
- Developer experience rises from 7.2 to 7.5 because generated-app manifest
  evidence now exposes compact blocker/readiness summaries. The next DX gap is
  an inspectable app delivery flow.
- Ecosystem/data readiness rises from 6.8 to 7.0 because NLQ-005 records
  support/readiness/blocked states for cloud-native sources. These are not yet
  source implementations.

## Next Scorecard Update Requirements

- Verify external releases again in the current run before changing scores.
- Do not raise 3D readiness for stable runtime until a future quality-guardian
  and coordinator Go decision accepts real renderer evidence.
- Treat MapLibre, Mapbox, deck.gl, Three.js, and 3DTilesRendererJS package
  movement as evidence work: adapter tests, resource policy, smoke snapshots,
  and visual runner notes must accompany any dependency score bump.
- Treat GeoParquet, FlatGeobuf, GeoZarr, or PMTiles behavior changes as
  resource-policy/data-readiness work before implementation claims.
