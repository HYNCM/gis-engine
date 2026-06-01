---
agent: competitive-intel
period: 2026-W22
generated_at: 2026-05-30T19:16:41Z
repo_revision: "8609e5f"
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
benchmark below was refreshed on 2026-05-31 from official sources recorded in
`competitor-updates-2026-W22.md`.

| Dimension | GIS Engine Score | Current External Benchmark | Evidence Note | Confidence |
| --- | ---: | --- | --- | --- |
| AI operability | 9.5/10 | ArcGIS AI components; MCP tools and structured-output schema contracts | GIS Engine now has prompt planning schemas, planner provenance, explicit point/bbox query capability gates, invalid/source diagnostics, result caps, generated-app manifest evidence, `delivery.spatialQueryReadiness`, scene-browsing blocker visibility, release wording guardrails, `capabilitySummary`, command-only generation, MCP output schemas, diagnostics, and prompt QA scenarios. The open gap is future source/geoprocessing promotion, not the evidence spine. | high |
| 2D performance | 6.5/10 | MapLibre v5/v6 drift; Mapbox style spec and PMTiles examples | Generic vector sources, PMTiles-compatible URL policy, MapLibre transformation, and visual/smoke evidence exist. The next score bump requires a version-drift audit and generated-style compatibility checks before dependency movement. | high |
| 3D readiness | 5.4/10 | CesiumJS, Three.js, 3DTilesRendererJS, deck.gl WebGPU/3D Tiles movement | SceneView3D has adapter contract, dependency boundary, lifecycle, snapshot/query, browser evidence, release-gate rules, and SRC-006 No-go. This remains evidence readiness, not stable runtime support. | high |
| Developer experience | 8.0/10 | ArcGIS natural-language map UX; Mapbox/MapLibre examples; ECharts option-first visualization | Generated-app evidence now carries compact manifest summaries, delivery status, spatial-query readiness, source-readiness boundaries, confirmation boundaries, follow-up tasks, scene-browsing blockers, and docs wording guardrails. The next gap is renderer/source drift audit before any dependency or cloud-native promotion. | medium |
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

## 2026-05-30 Addendum

- AI operability rises from 9.2 to 9.3 because AIN-001 through AIN-005 closed:
  generated-app delivery now has schema-testable status, acceptance,
  confirmation, source-readiness, follow-up, and extension-only scene-browsing
  fields.
- Developer experience rises from 7.5 to 7.6 because those delivery fields are
  available to productize. It does not rise further because there is no
  generated-app review console or prompt-to-delivery QA matrix yet.
- 2D performance, 3D readiness, and ecosystem/data readiness stay unchanged.
  The 2026-05-30 package checks reinforce existing MapLibre/Mapbox/PMTiles and
  SceneView3D pressure but do not add accepted runtime support.

## 2026-05-30 Post-GIR Addendum

- AI operability rises from 9.3 to 9.4 because `GIR-001` through `GIR-006`
  closed the generated-app review-console batch with prompt-to-delivery QA and
  testable release wording guardrails.
- Developer experience rises from 7.6 to 7.8 because generated-app handoff
  sections, source/spatial readiness, and public wording boundaries are now
  serialized in planning and tests.
- The next score bump is blocked on Spatial Query Evidence Hardening: adapter
  query capability must become explicit, invalid point/bbox/source cases need
  stable diagnostics, and result caps must prevent unbounded payload claims.

## Next Scorecard Update Requirements

- Verify external releases again in the current run before changing scores.
- Do not raise 3D readiness for stable runtime until a future quality-guardian
  and coordinator Go decision accepts real renderer evidence.
- Treat MapLibre, Mapbox, deck.gl, Three.js, and 3DTilesRendererJS package
  movement as evidence work: adapter tests, resource policy, smoke snapshots,
  and visual runner notes must accompany any dependency score bump.
- Treat GeoParquet, FlatGeobuf, GeoZarr, or PMTiles behavior changes as
  resource-policy/data-readiness work before implementation claims.
- Treat Generated App Review Console work as product/AI evidence hardening. It
  can raise AI operability or developer-experience scores only after the
  review sections, acceptance fixtures, and wording guardrails have test or
  docs evidence.

## 2026-05-31 Post-SQH Addendum

- AI operability rises from 9.4 to 9.5 because `SQH-001` through `SQH-006`
  closed explicit query capability gates, invalid/source diagnostics, result
  caps, delivery query-state mapping, and the final quality gate.
- Developer experience rises from 7.8 to 8.0 because generated-app handoff now
  exposes `delivery.spatialQueryReadiness` without prose parsing or feature
  payloads.
- 2D performance stays at 6.5 because no MapLibre dependency movement happened.
  The next score bump requires the MapLibre Source Drift Audit to pass before
  package updates.
- 3D readiness stays at 5.4 and ecosystem/data readiness stays at 7.0 because
  this refresh does not promote SceneView3D stable runtime, PMTiles archive
  parsing, vector tile decoding, or cloud-native feature queries.

## 2026-06-01 Post-MLD Addendum

- 2D performance stays at 6.5 because `MLD-002` through `MLD-004` closed the
  MapLibre source drift audit as compatibility evidence and a package-movement
  No-go, not as an upgrade.
- The next 2D performance score bump requires a separate package-movement task
  with refreshed official package/changelog evidence, example loading
  compatibility, deterministic gates, and strict visual snapshot evidence.
- AI operability, 3D readiness, developer experience, and ecosystem/data
  readiness stay unchanged because this closure does not add source parsers,
  hidden fetches, MCP aliases, or stable SceneView3D runtime.

## 2026-06-01 W23 Planning Refresh Addendum

- AI operability stays at 9.5. The current run refreshed W23 evidence and
  opened the AI Map Workbench product-boundary task batch, but it did not add
  new public schemas, MCP tools, or review-action runtime behavior.
- Developer experience stays at 8.0 until the AMW product-boundary batch
  accepts provider credential/resource administration, durable audit semantics,
  command-safe review actions, and visual evidence. The pressure is now clear,
  but the score should move only after accepted implementation or gate evidence.
- 2D performance stays at 6.5 because `maplibre-gl` remains on the current
  range and `MLD-004` remains a package-movement No-go.
- 3D readiness stays at 5.4 because SceneView3D stable runtime remains blocked
  after SRC-006.
- Ecosystem/data readiness stays at 7.0 because cloud-native source signals
  remain promotion candidates, not parser/query implementations.
