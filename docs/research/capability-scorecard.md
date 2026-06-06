---
agent: product
period: 2026-W24
generated_at: 2026-06-05T13:05:41Z
repo_revision: "4012f51"
inputs:
  - docs/research/competitor-updates-2026-W24.md
  - docs/research/capability-scorecard-w24-refresh.md
  - docs/research/competitor-updates-2026-W22.md
  - docs/archive/2026-06-06/planning/sprint-2026-W23-ai-map-app-generation.md
  - docs/reviews/nla-002-generation-command-contract-2026-05-29.md
  - docs/reviews/nla-003-mcp-orchestration-evidence-2026-05-29.md
  - docs/reviews/nla-006-prompt-evidence-scenarios-2026-05-29.md
  - docs/reviews/nla-008-serialized-planning-handoff-2026-05-29.md
  - docs/reviews/nlq-007-serialized-quality-hardening-planning-2026-05-29.md
  - docs/archive/2026-06-06/planning/sceneview3d-src-006-stable-runtime-decision-2026-05-29.md
owner: "@product"
decision_level: advisory
---

# Capability Scorecard

Scores are advisory product signals, not release approvals. The current
external benchmark was refreshed on 2026-06-05 from npm metadata and official
sources recorded in `competitor-updates-2026-W24.md`.

| Dimension | GIS Engine Score | Current External Benchmark | Evidence Note | Confidence |
| --- | ---: | --- | --- | --- |
| AI operability | 9.6/10 | ArcGIS AI components; MCP tools and structured-output schema contracts | GIS Engine now has prompt planning schemas, planner provenance, explicit point/bbox query capability gates, invalid/source diagnostics, result caps, generated-app manifest evidence, `delivery.spatialQueryReadiness`, scene-browsing blocker visibility, release wording guardrails, `capabilitySummary`, command-only generation, MCP output schemas, diagnostics, prompt QA scenarios, and a structured review-console state contract. The open gap is future source/geoprocessing promotion, not the evidence spine. | high |
| 2D performance | 6.6/10 | MapLibre v5/v6 drift; Mapbox style spec and PMTiles examples | Generic vector sources, PMTiles-compatible URL policy, MapLibre transformation, visual/smoke evidence, strict 3-scene maintenance, and a perf trend harness exist. The next score bump requires repeated trend data and a separate package-movement gate. | medium |
| 3D readiness | 5.4/10 | CesiumJS, Three.js, 3DTilesRendererJS, deck.gl WebGPU/3D Tiles movement | SceneView3D has adapter contract, dependency boundary, lifecycle, snapshot/query, browser evidence, release-gate rules, and SRC-006 No-go. Cesium package movement is an ecosystem signal only; this remains evidence readiness, not stable runtime support. | high |
| Developer experience | 8.2/10 | ArcGIS natural-language map UX; Mapbox/MapLibre examples; ECharts option-first visualization | Generated-app evidence now carries compact manifest summaries, delivery status, spatial-query readiness, source-readiness boundaries, confirmation boundaries, follow-up tasks, scene-browsing blockers, docs wording guardrails, review-console sections, and prompt-to-delivery QA fixtures. The next gap is release-grade browser acceptance and sustained perf/visual evidence. | high |
| Ecosystem and data readiness | 7.2/10 | PMTiles v3, GeoParquet 1.1, FlatGeobuf range access, OpenLayers GeoZarr/GeoTIFF | GIS Engine has resource policy, portable vector-source foundations, a cloud-native readiness matrix, and W24 PMTiles/GeoParquet/FlatGeobuf metadata-policy contracts. Runtime parsers, workers, hidden IO, and cloud-native feature queries remain blocked. | high |

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

## 2026-06-01 AMW-007 Addendum

- Developer experience stays at 8.0. Provider credential/resource
  administration is now a design handoff, but the workbench still lacks durable
  audit retention/export, review actions, visual product evidence, and a
  quality-guardian/coordinator promotion decision.
- AI operability stays at 9.5 because no public AI schema or MCP contract
  changed. The next score movement requires accepted durable audit or review
  action evidence, not design text alone.

## 2026-06-01 AMW-008 Addendum

- Developer experience stays at 8.0. Durable audit retention/export is now a
  design handoff, but the workbench still lacks review-action runtime behavior,
  visual product evidence, and a quality-guardian/coordinator promotion
  decision.
- AI operability stays at 9.5 because AMW-008 adds no public AI schema, MCP
  contract, durable storage runtime, or review-action runtime behavior. After
  AMW-009 design acceptance, the next score movement requires implementation
  evidence or a product-promotion gate.

## 2026-06-02 AMW-009 Addendum

- Developer experience stays at 8.0. Command-safe review actions are now a
  design handoff, but no action controls, review-decision endpoint, durable
  storage, visual product evidence, or product-promotion gate has landed.
- AI operability stays at 9.5 because AMW-009 adds no public AI schema, MCP
  contract, runtime review action behavior, or new command surface. The next
  score movement requires implementation evidence or an accepted AMW-010
  product-promotion gate.

## 2026-06-02 AMW-010 / AWP-001 Addendum

- Developer experience stays at 8.0. AMW-010 accepted the local example as Go
  but recorded product app and hosted promotion as No-go, and AWP-001 opens the
  implementation planning loop without adding runtime behavior.
- AI operability stays at 9.5 because AWP-001 adds no public AI schema, MCP
  contract, provider runtime enforcement, durable audit runtime, or review
  decision endpoint.
- The next score movement requires accepted implementation evidence from
  `AWP-002` provider resource enforcement, `AWP-005` review decisions, and
  `AWP-006` repeatable UI evidence, not planning text alone.

## 2026-06-02 AWP-002 Addendum

- Developer experience stays at 8.0. Provider resource enforcement is now
  implemented for the local example, but product ownership, durable audit,
  review-action runtime, and repeatable product workflow evidence remain open.
- AI operability stays at 9.5 because the change hardens provider IO and
  diagnostics without adding public MCP tools or new map mutation paths.
- The next score movement requires product ownership plus accepted durable
  audit, review-action, and UI evidence, not provider enforcement alone.

## 2026-06-02 AWP-003 Addendum

- Developer experience stays at 8.0. Product ownership, route/module boundary,
  and project identity semantics are documented, but no product app movement,
  durable audit runtime, review-action runtime, or repeatable UI evidence exists.
- AI operability stays at 9.5 because project identity is payload-free and keeps
  mutation through existing command evidence, but no new public tool or runtime
  capability is added.
- The next score movement requires durable audit contract plus accepted
  review-action and UI evidence, not ownership planning alone.

## 2026-06-02 AWP-004 Addendum

- Developer experience stays at 8.0. Durable audit contract helpers now make
  project-scoped access, export caps, deletion receipts, and raw-payload
  rejection testable, but there is still no product app, durable store, export
  endpoint, review-action runtime, or repeatable UI evidence.
- AI operability stays at 9.5 because audit evidence remains compact and
  payload-free without adding public MCP tools or direct mutation paths.
- The next score movement requires command-safe review decisions plus accepted
  repeatable UI evidence, not audit contract helpers alone.

## 2026-06-02 AWP-005 Addendum

- Developer experience stays at 8.0. Local review decision controls now make
  accept/block/follow-up outcomes usable inside the example, but product app
  movement, durable review storage, hosted deployment, and repeatable UI
  evidence remain open.
- AI operability stays at 9.5 because decisions are append-only compact evidence
  and do not create new mutation paths or MCP tool names.
- The next score movement requires `AWP-006` repeatable UI evidence and the
  later `AWP-007` product implementation gate, not review decision runtime
  alone.

## 2026-06-02 AWP-006 Addendum

- Developer experience stays at 8.0. Repeatable UI smoke evidence now covers
  provider selector, evidence rails, diagnostics, audit, command JSON, and
  review-decision states, but product app movement and hosted deployment remain
  blocked.
- AI operability stays at 9.5 because the UI evidence confirms command-only
  mutation and compact review/audit evidence without adding MCP tool names.
- The next score movement requires the `AWP-007` product implementation gate;
  repeatable local smoke alone is not a product promotion decision.

## 2026-06-02 AWP-007 Addendum

- Developer experience stays at 8.0. The AWP batch is closed with local example
  hardening Go, but product app movement and hosted deployment remain No-go.
- AI operability stays at 9.5 because the gate preserves schema/command/MCP
  boundaries and avoids promoting local evidence into a product claim.
- Future score movement requires a new product-app promotion task with runtime
  ownership, durable storage/auth/export scope, and release-grade visual
  evidence.

## 2026-06-05 W24 Refresh Addendum

- AI operability rises from 9.5 to 9.6 because the W24 review-console contract
  and QA matrix fixtures make generated-app acceptance states inspectable from
  structured evidence. This does not add MCP tool names or new mutation paths.
- 2D performance rises from 6.5 to 6.6 because W24 adds strict visual
  maintenance and a perf trend harness, but it does not include MapLibre
  package movement or sustained two-week trend evidence.
- 3D readiness stays at 5.4. `cesium` moved to `1.142.0`, but SceneView3D
  stable runtime remains blocked after SRC-006 and W24 adds no accepted stable
  renderer promotion evidence.
- Developer experience rises from 8.0 to 8.2 because the local review-console
  state contract and prompt-to-delivery QA cards reduce the previous
  document/test-centric review gap without promoting AI Map Workbench to a
  hosted product.
- Ecosystem/data readiness rises from 7.0 to 7.2 because PMTiles archive
  metadata, GeoParquet schema, and FlatGeobuf policy validation are now
  explicit contracts with tests. Runtime parsers, range IO, workers, hidden
  fetches, and cloud-native feature queries remain blocked.
