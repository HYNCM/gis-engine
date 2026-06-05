---
agent: orchestrator
period: 2026-W24
generated_at: 2026-06-05T16:36:16Z
repo_revision: "8a59577"
inputs:
  - AGENTS.md
  - docs/planning/next-stage-goals-2026-06-06.md
  - docs/planning/feature-specs/ai-map-workbench-promotion-scope.md
  - docs/research/competitor-updates-2026-W24.md
  - docs/research/capability-scorecard-w24-refresh.md
  - docs/research/competitor-updates-2026-W23.md
  - docs/reviews/quality-gate-2026-06-03.md
  - docs/reviews/quality-gate-2026-06-04.md
  - docs/reviews/documentation-audit-2026-06-04.md
  - docs/planning/feature-specs/sdk-cli-first-release.md
  - docs/design/phase-c-developer-experience.md
  - docs/planning/task-burndown.md
  - docs/planning/handoff-ledger.json
  - docs/planning/AGENT_HEALTH_DASHBOARD.md
  - command: pnpm docs:build
  - command: pnpm build:schema
  - command: pnpm check
  - command: pnpm test:docs
  - command: pnpm publish:dry
  - command: getting-started prepublish build + Playwright smoke
  - command: VitePress dev homepage + quick-start smoke
owner: "@orchestrator"
decision_level: advisory
---

# Weekly Digest: 2026-W24

## 2026-06-05 W24 Planning Ledger Reconciliation

The W24 placeholder queue has been reconciled against current repo revision
`4012f51` and refreshed product evidence from
`docs/research/competitor-updates-2026-W24.md`.

Accepted reconciliation state:

`TASK-2026W24-RCU-001` through `RCU-003` are accepted. Evidence lives in
`examples/ai-map-workbench/review-console.mjs`,
`examples/ai-map-workbench/server.mjs`, review-console fixtures, QA matrix
tests, and workbench-hardening tests.
`TASK-2026W24-CNS-001` through `CNS-003` are accepted as metadata and
resource-policy contracts only. They do not add runtime parsers, hidden
fetches, workers, or cloud-native feature queries.
The AI Map Workbench promotion scope is frozen in
`docs/planning/feature-specs/ai-map-workbench-promotion-scope.md`; product and
hosted movement remain blocked.
`TASK-2026W24-VPE-001` and `VPE-003` are accepted through strict-scene and
app-template visual tests.
`TASK-2026W24-VPE-002` now has two weekly trend cuts plus a comparative report,
so the perf trend evidence is accepted.
`TASK-2026W24-PRD-001` and `PRD-002` are complete at the product-document
level through the W24 competitor update and scorecard refresh.
`TASK-2026W24-EVO-001` through `EVO-003` have ledger entries, but those
entries remain pending evidence audit until current gate results are recorded.

Post-acceptance state:

| Scope | Status | Required acceptance evidence |
| --- | --- | --- |
| RCU | accepted | focused example tests, browser smoke, `pnpm check`, docs link audit |
| CNS | accepted as contract-only | `pnpm build:schema`, resource/schema tests, `pnpm check` |
| PROMOTION-SCOPE | done | `docs/planning/feature-specs/ai-map-workbench-promotion-scope.md`; fresh product-promotion task uses the frozen scope |
| VPE-001/VPE-003 | accepted | strict/app-template visual tests plus required visual gate or waiver |
| VPE-002 | accepted | weekly trend cuts, comparative report, `pnpm test:perf:trend` |
| PRD | done / consumed by orchestrator | W24 source URLs, npm command evidence, scorecard refresh |

Validation evidence captured during reconciliation:

| Command | Result | Notes |
| --- | --- | --- |
| `node scripts/doc-generator.mjs links` | pass | regenerated `docs/reviews/doc-link-audit.md` |
| `pnpm test:docs` | pass | docs guardrail tests passed |
| `pnpm test:qa-matrix` | pass | prompt-to-delivery QA matrix passed |
| focused W24 vitest suites | pass | review-console, workbench-hardening, cloud-native policy, resource release, strict visual maintenance, app-template visual, and perf trend suites passed |
| `pnpm build:schema` | pass | engine/scene3d/ai schema/build gate passed |
| `pnpm check` | pass after non-sandbox rerun | sandbox run was blocked by `listen EPERM 127.0.0.1`; the same command passed with listener-capable permissions |

## 2026-06-06 Next-Stage Goal Calibration

W24 acceptance closes the review-console / cloud-native / visual-evidence queue.
The authoritative next-stage snapshot is
`docs/planning/next-stage-goals-2026-06-06.md`.

Accepted planning state:

- W24 local review-console, cloud-native contracts, strict visual evidence, and
  W24 product refresh are accepted.
- The AI Map Workbench promotion scope is frozen in
  `docs/planning/feature-specs/ai-map-workbench-promotion-scope.md`.
- AI Map Workbench remains local/example-scoped; product and hosted promotion
  stay No-go.
- Cloud-native source work stays contract-first; runtime parser claims remain
  blocked.
- `VPE-002` is accepted through two weekly trend cuts plus a comparative
  report.
- Stable `view.mode: "scene3d"` and MapLibre package movement remain blocked.

Reconciled next-stage queue:

| id | Priority | Owner | Status | Target artifact | Exit condition |
| --- | --- | --- | --- | --- | --- |
| PROMOTION-SCOPE | P0 | `@product` + `@orchestrator` | done | `docs/planning/feature-specs/ai-map-workbench-promotion-scope.md` | runtime/service ownership, durable storage/auth/export scope, and release-grade visual evidence are defined before any product or hosted movement |
| SOURCE-PROMOTION | P1 | `@builder` + `@quality` + `@docs` | queued | cloud-native source promotion candidates | one format is promoted from schema/policy evidence without runtime parser overclaim |
| VPE-002 | P1 | `@builder` + `@quality` | done / accepted | weekly perf trend ledger | repeated trend artifacts and comparative report retained |
| GUARDRAILS | P2 | `@orchestrator` + `@docs` | ongoing | docs/package guardrails | current budgets and no-go decisions stay synchronized in planning and release docs |

The next-stage plan is intentionally narrower than W24: it is about defining
promotion scopes and evidence maturity, not reopening closed contract batches.
The promotion-scope freeze is complete; the remaining queue starts at
cloud-native source promotion.

## 2026-06-04 Orchestrator Refresh

This refresh consumes the newer product and quality evidence that the handoff
ledger flagged as pending. The planning defect was not a runtime failure: the
latest product, quality, and docs reports had moved past the 2026-05-29 digest,
so HOC-N1 and HOC-N3 appeared stale even though the execution batches were
closed.

Current defect review:

| Finding | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Orchestrator digest lagged product and quality reports | `docs/planning/handoff-ledger.json` flagged product -> orchestrator and quality -> orchestrator as pending because this digest was older than 2026-06-01/06-04 reports | Planning health dashboard showed two data-flow anomalies | Refresh this digest, regenerate handoff ledger and dashboard | high |
| Phase C DX design was stale | `docs/design/phase-c-developer-experience.md` still described 11 VitePress 404s and missing migration/example docs, while `pnpm docs:build`, package READMEs, example READMEs, and migration docs are now present | Next work could reopen completed docs tasks | Recalibrate Phase C to release DX verification and publish-readiness checks | high |
| Engine package README had broken relative next-step links | `packages/engine/README.md` pointed to `../packages/cli/README.md` and `../examples/` from inside `packages/engine` | npm/GitHub readers could land on invalid local paths | Fix links to `../cli/README.md` and `../../examples/` | high |
| Environment-limited gates were re-run in a listener/browser-capable run | `pnpm check` passed; `pnpm test:docs` passed; `pnpm publish:dry` passed for the four GA packages; getting-started prepublish build and Playwright smoke passed; VitePress dev homepage and quick-start smoke passed | DX and release-readiness evidence no longer depends on stale sandbox-waiver wording | Keep these gates in the release checklist and rerun before merge/release | high |

Accepted state:

- AI Map Workbench AWP is closed as local example hardening Go and
  product/hosted promotion No-go.
- SDK + CLI First Release Productization is closed through
  `docs/planning/feature-specs/sdk-cli-first-release.md`.
- MapLibre v6 remains a prerelease compatibility gate, not a GA package move.
- SceneView3D stable `view.mode: "scene3d"` remains blocked.

Next work plan:

| id | Priority | Owner | Status | Target artifact | Exit condition |
| --- | --- | --- | --- | --- | --- |
| DX-VERIFY-003 | P1 | `@builder` + `@docs` | done | `examples/getting-started` and docs dev smoke evidence | getting-started validates/renders/applies `recolor-cities`; docs homepage and quick-start load without page errors |
| DX-VERIFY-004 | P1 | `@quality` | done | package tarball/publish-dry evidence | `pnpm publish:dry` passes for the four GA publish packages and excludes `@gis-engine/scene3d-three-adapter` |
| DX-VERIFY-005 | P0 | `@orchestrator` | done | this digest, handoff ledger, health dashboard | HOC-N1 and HOC-N3 freshness anomalies cleared after regeneration |
| DX-VERIFY-006 | P2 | `@docs` | queued | docs/DX release checklist | docs build, link audit, docs tests, CLI tests, and package README links remain green |

## Cycle Conclusion

W22 refreshed the competitor view and converted it into an execution path rather
than a broad roadmap reset. The external signals reinforce the current GIS
Engine direction:

- PMTiles/vector source support is a competitive requirement, not an optional
  demo feature.
- SceneView3D should keep advancing through adapter-local evidence and release
  gates, not through immediate stable runtime promotion.
- MCP input/output schema discipline remains a release requirement for
  AI-native map editing.

The execution loop is complete for W22: SceneView3D Three adapter lifecycle
diagnostics now expose stable pre-load and post-destroy paths, MapLibre version
drift has a pre-upgrade audit checklist, and the SRC-006 decision closes the
stable renderer contract sequence as No-go while keeping stable runtime
promotion blocked.

The final W22 planning update opens the W23 AI map app generation loop. Current
ArcGIS AI component documentation makes natural-language map interaction and
agent orchestration a current product signal. GIS Engine's response is a
verifiable pipeline, not an opaque chat surface: prompt -> `capabilitySummary`
-> `MapSpec` -> commands -> diagnostics -> snapshot/export evidence.

The post-NLA W22 refresh confirms that NLA-001 through NLA-008 are complete and
should not be reopened as active backlog. The next W23 handoff is generation
quality hardening: typed prompt planner boundary, planner provenance evidence,
spatial query evidence, generated-app export manifest, cloud-native source
readiness, and SceneView3D blocker transparency.

The first generation-quality slice is complete: `planMapGenerationRequest()`
adds a typed prompt planner boundary that accepts prompt hash plus structured
intent, rejects raw prompt retention by default, and feeds the existing command
skeleton without adding an MCP alias.

The second generation-quality slice is complete: `GenerationEvidenceBundle`
now exposes `plannerEvidence` with confidence, prompt/trace provenance,
accepted/unsupported intent fields, source prompt hashes, and planner
diagnostics.

2026-05-30 update: AIN-001 through AIN-005 are complete. The orchestrator
therefore switched from execution state to planning state, refreshed official
competitor/package signals, and opened the Generated App Review Console sprint.
The product theme is no longer "can the evidence spine exist"; it is "can a
user or agent inspect and accept a generated map app without reading free-form
prose." `GIR-001` through `GIR-006` are complete; the Generated App Review
Console batch is closed and the next move is a fresh planning loop.

2026-05-30 post-GIR planning update: the planning loop refreshed package and
official-source evidence again and opened **Spatial Query Evidence Hardening**
as the next sprint. `SQH-001` freezes the point/bbox-only boundary and is
complete. `SQH-002` adds the explicit query capability gate; execution should
move to `TASK-2026W23-SQH-003`.

## Current Signals

| Source | Signal | Impact | Confidence |
| --- | --- | --- | --- |
| competitive-intel | ArcGIS AI components document agentic mapping applications, natural-language UI, map-scoped context, tools, and orchestration | Make natural-language map app generation the W23 product spine while preserving evidence-first gates | high |
| competitive-intel | Mapbox documents PMTiles vector source use; MapLibre release drift can affect module/WebGL baselines | Keep vector source evidence release-gated and add a MapLibre version-drift audit before upgrades | high |
| competitive-intel | CesiumJS, Three.js, and 3DTilesRendererJS remain active 3D reference points | Continue adapter-local SceneView3D renderer contract work; stable runtime stays blocked | high |
| competitive-intel | MCP tools spec includes output schemas | Keep public MCP `inputSchema` and `outputSchema` as blocking contract checks | high |
| competitive-intel | PMTiles v3, GeoParquet 1.1, FlatGeobuf range semantics, and OpenLayers GeoZarr/GeoTIFF widen cloud-native data expectations | Plan source readiness and resource-policy diagnostics before adding new source support | high |
| competitive-intel | Structured outputs and computer-use tooling reinforce JSON Schema, screenshots, allowlists, and confirmation boundaries | Keep generated-app and visual evidence auditable and side-effect-aware | high |
| product-strategist | W22 scorecard raises AI operability, 2D cloud-native, and 3D readiness scores, but not stable 3D runtime | Next iteration is evidence hardening, not broad scope expansion | high |
| product-strategist | AIN delivery states are schema-testable, but the user-facing review console is still missing | Open Generated App Review Console as the next productized delivery slice | high |
| competitive-intel | 2026-05-30 npm checks show ArcGIS AI packages at 5.0.19, MapLibre at 5.24.0, Mapbox GL JS at 3.24.0, Cesium at 1.141.0, and 3DTilesRendererJS at 0.4.27 | Keep natural-language app generation, source readiness, and adapter-local SceneView3D evidence as the main pressure points | high |
| competitive-intel | Post-GIR checks keep PMTiles, GeoParquet, FlatGeobuf, GeoTIFF, GeoZarr, MCP output schemas, and ArcGIS agentic app pressure visible | Harden point/bbox query evidence before adding new loaders, geoprocessing, or MCP aliases | high |
| product-strategist | GIR is closed and the weakest accepted boundary is now spatial query evidence | Keep Spatial Query Evidence Hardening focused on SQH-003 invalid/source diagnostics after the explicit capability gate | high |
| adapter-agent | Lifecycle diagnostics now include `/runtime/not-loaded/{operation}` and `/runtime/destroyed/{operation}` | AI/debug tooling can identify failure state without parsing diagnostic messages | high |

## Decisions

1. Preserve stable `view.mode: "scene3d"` as blocked after SRC-006 No-go.
2. Treat MapLibre upgrade pressure as an audit/checklist task before dependency
   movement.
3. Keep PMTiles/vector source examples tied to schema, resource-policy,
   smoke-snapshot, and visual-snapshot evidence.
4. Count the lifecycle diagnostics patch as the first W22 execution slice under
   `TASK-2026W22-CSI-003`.
5. Accept SRC-001 through SRC-005 as prerequisite contract evidence and close
   SRC-006 as No-go; stable runtime promotion remains blocked.
6. Move the next planning loop back to natural-language map app generation:
   competitor analysis, product design, and task-distributor DAG.
7. Treat W23 natural-language generation as an evidence bundle problem before
   adding tool aliases or broad spatial-analysis operations.
8. After NLA-008, open a new W23 generation-quality sprint instead of editing
   the completed NLA task batch.
9. After AIN-005, open Generated App Review Console and treat review/acceptance
   fixtures as the next P0 task before broad source, spatial-analysis, or
   SceneView3D runtime expansion.
10. After GIR-006, open Spatial Query Evidence Hardening; do not widen it into
    PMTiles/vector parsing, new MCP tools, advanced geoprocessing, or stable
    SceneView3D runtime.

## Execution Status

| id | Status | Evidence |
| --- | --- | --- |
| TASK-2026W22-CSI-001 | done | `docs/research/competitor-updates-2026-W22.md` |
| TASK-2026W22-CSI-002 | done | `docs/research/capability-scorecard.md` |
| TASK-2026W22-CSI-003 | done | `packages/scene3d-three-adapter/src/index.ts`, adapter tests, smoke lifecycle tests, `docs/archive/2026-05-30/reviews/sceneview3d-lifecycle-diagnostics-2026-05-25.md` |
| TASK-2026W22-CSI-004 | done | this digest and `docs/planning/monthly-roadmap.md` |
| TASK-2026W22-CSI-005 | done | `docs/engineering/maplibre-version-drift-audit.md` |
| TASK-2026W22-CSI-006 | done | `docs/reviews/sceneview3d-src-evidence-decision-2026-05-25.md`, `docs/reviews/sceneview3d-src-006-stable-runtime-gate-2026-05-29.md`, `docs/planning/sceneview3d-src-006-stable-runtime-decision-2026-05-29.md` |
| TASK-2026W23-NLA-001 through NLA-008 | done | `docs/planning/sprint-2026-W23-ai-map-app-generation.md`, `docs/reviews/nla-008-serialized-planning-handoff-2026-05-29.md` |
| TASK-2026W23-NLQ-001 | done | `docs/reviews/nlq-001-prompt-planner-boundary-2026-05-29.md` |
| TASK-2026W23-NLQ-002 | done | `docs/reviews/nlq-002-planner-provenance-evidence-2026-05-29.md` |
| TASK-2026W23-NLQ-003 | done | `docs/reviews/nlq-003-spatial-query-evidence-2026-05-29.md` |
| TASK-2026W23-NLQ-004 | done | `docs/reviews/nlq-004-export-manifest-evidence-2026-05-29.md` |
| TASK-2026W23-NLQ-005 | done | `docs/planning/feature-specs/cloud-native-source-readiness.md` |
| TASK-2026W23-NLQ-006 | done | `docs/reviews/nlq-006-scene-browsing-blocker-visibility-2026-05-29.md` |
| TASK-2026W23-NLQ-007 | done | `docs/reviews/nlq-007-serialized-quality-hardening-planning-2026-05-29.md` |
| TASK-2026W22-AIN-001 through AIN-002 | done | `docs/reviews/ain-001-002-generated-app-delivery-acceptance-2026-05-30.md`; `generationEvidence.delivery` contract |
| TASK-2026W22-AIN-003 through AIN-004 | done | `docs/reviews/ain-003-004-promotion-criteria-2026-05-30.md`; source and spatial-analysis promotion criteria |
| TASK-2026W22-AIN-005 | done | `docs/reviews/ain-005-scene-browsing-delivery-copy-2026-05-30.md`; extension-only scene browsing delivery copy |
| TASK-2026W22-GIR-001 | done | `docs/planning/feature-specs/generated-app-review-console.md`; review-console PRD/spec |
| TASK-2026W22-GIR-002 | done | `tests/ai/generation-evidence.test.ts`; delivery-review acceptance fixtures |
| TASK-2026W22-GIR-003 | done | `docs/planning/feature-specs/generated-app-review-console.md`, `docs/planning/feature-specs/cloud-native-source-readiness.md`; source readiness review cards |
| TASK-2026W22-GIR-004 | done | `docs/reviews/gir-004-spatial-analysis-review-section-mapping-2026-05-30.md`; spatial-analysis review cards mapped into delivery evidence |
| TASK-2026W22-GIR-005 | done | `docs/reviews/gir-005-prompt-to-delivery-qa-scenarios-2026-05-30.md`; prompt-to-delivery QA scenarios |
| TASK-2026W22-GIR-006 | done | `docs/reviews/gir-006-public-wording-release-guardrails-2026-05-30.md`; release wording guardrail docs and tests |
| TASK-2026W23-SQH-001 | done | `docs/planning/feature-specs/spatial-query-evidence-hardening.md`; `docs/planning/sprint-2026-W23-spatial-query-hardening.md`; `docs/reviews/sqh-001-spatial-query-hardening-boundary-2026-05-30.md` |
| TASK-2026W23-SQH-002 | done | `docs/reviews/sqh-002-query-capability-gate-2026-05-30.md`; `spatialQueryEvidence.capabilityGate` |
| TASK-2026W23-SQH-003 | done | `docs/reviews/sqh-003-invalid-source-diagnostics-2026-05-30.md`; invalid/source diagnostic matrix |
| TASK-2026W23-SQH-004 | done | `docs/reviews/sqh-004-result-caps-fixtures-2026-05-30.md`; result caps and fixture hashes |
| TASK-2026W23-SQH-005 | done | `docs/reviews/sqh-005-delivery-mapping-2026-05-31.md`; `delivery.spatialQueryReadiness` |
| TASK-2026W23-SQH-006 | done | `docs/reviews/sqh-006-quality-gate-closure-2026-05-31.md`; quality gate pass and closure |
| TASK-2026W22-MLD-001 | done | `docs/planning/feature-specs/maplibre-source-drift-audit.md`; `docs/planning/sprint-2026-W22-maplibre-source-drift-audit.md` |
| TASK-2026W22-MLD-002 | done | `docs/reviews/mld-002-maplibre-drift-audit-2026-05-31.md`; `packages/engine/src/sources/contract.ts`; adapter/source compatibility evidence |
| TASK-2026W22-MLD-003 | done | `docs/reviews/mld-003-resource-delivery-evidence-2026-06-01.md`; PMTiles/vector resource and delivery boundary evidence |
| TASK-2026W22-MLD-004 | done / no-go | `docs/reviews/mld-004-go-no-go-2026-06-01.md`; package movement blocked pending refreshed official evidence and strict visual gates |
| TASK-2026W22-AMW-001 through AMW-005 | done | `examples/ai-map-workbench`; provider-gated local review surface, provider profiles, and promotion hold evidence |
| TASK-2026W23-AMW-006 | done | `docs/research/competitor-updates-2026-W23.md`; `docs/planning/feature-specs/ai-map-workbench-product-boundary.md`; `docs/planning/sprint-2026-W23-ai-map-workbench-product-boundary.md`; `docs/reviews/amw-006-product-boundary-planning-2026-06-01.md` |
| TASK-2026W23-AMW-007 | done | `docs/planning/feature-specs/ai-map-workbench-provider-administration.md`; `docs/reviews/amw-007-provider-resource-admin-2026-06-01.md`; provider credential/resource administration design before hosted/product use |
| TASK-2026W23-AMW-008 | done | `docs/planning/feature-specs/ai-map-workbench-durable-audit.md`; `docs/reviews/amw-008-durable-audit-retention-export-2026-06-01.md`; durable audit retention/export design before persistent storage or product promotion |
| TASK-2026W23-AMW-009 | done | `docs/planning/feature-specs/ai-map-workbench-review-actions.md`; command-safe accept/block/follow-up review action design |
| TASK-2026W23-AMW-010 | done / no-go | `docs/reviews/amw-010-product-promotion-go-no-go-2026-06-02.md`; local example Go, product app and hosted promotion No-go |
| TASK-2026W23-AWP-001 | done | `docs/planning/feature-specs/ai-map-workbench-product-implementation.md`; `docs/planning/sprint-2026-W23-ai-map-workbench-product-implementation.md`; implementation loop opened without product promotion |
| TASK-2026W23-AWP-002 | done | `docs/reviews/awp-002-provider-resource-enforcement-2026-06-02.md`; provider base URL policy, timeout/abort, response byte cap, and leak regressions |
| TASK-2026W23-AWP-003 | done | `docs/reviews/awp-003-product-ownership-project-model-2026-06-02.md`; product ownership, route/module boundary, project identity model, and non-go language |
| TASK-2026W23-AWP-004 | done | `docs/reviews/awp-004-authorized-durable-audit-contract-2026-06-02.md`; durable audit contract helpers for project-scoped access, export caps, deletion receipts, and raw-payload rejection |
| TASK-2026W23-AWP-005 | done | `docs/reviews/awp-005-command-safe-review-decisions-2026-06-02.md`; command-safe review decisions as append-only evidence, not direct `MapSpec` mutation |
| TASK-2026W23-AWP-006 | done | `docs/reviews/awp-006-repeatable-workbench-ui-evidence-2026-06-02.md`; repeatable workbench UI evidence for provider, evidence, diagnostics, audit, and review-decision states |
| TASK-2026W23-AWP-007 | done / no-go | `docs/reviews/awp-007-product-implementation-go-no-go-2026-06-02.md`; local example hardening Go, product/hosted promotion No-go |

## Next Handoff

- `@engine-agent` / `@docs-agent`: use the MapLibre version-drift checklist
  before any `maplibre-gl` package movement.
- `@quality-guardian` / `@coordinator`: keep stable runtime blocked after
  SRC-006 No-go until a future full gate provides real renderer visual evidence
  or an approved release waiver.
- `@adapter-agent` / `@qa-agent`: keep lifecycle, snapshot, query, and visual
  evidence disjoint and adapter-local.
- `@coordinator`, `@competitive-intel`, `@product-strategist`, and
  `@task-distributor`: the prior NLA, AIN, GIR, SQH, and MLD planning-loop
  handoffs are consumed by `AMW-006`. Do not reopen them unless fresh evidence
  creates a new task.
- `@quality-guardian` / `@coordinator`: keep MapLibre package movement blocked
  until a future run refreshes official package evidence, scopes example
  loading compatibility, and accepts strict visual evidence or an explicit
  conditional waiver.
- `@coordinator`, `@competitive-intel`, `@product-strategist`, and
  `@task-distributor`: the AI Map Workbench product-boundary batch is closed by
  `TASK-2026W23-AMW-010` as product promotion No-go. The fresh planning loop is
  now `TASK-2026W23-AWP-001` through `AWP-007`; use it before any product app
  movement, hosted deployment, durable audit runtime, or review-action
  implementation.
- `@coordinator` and `@product-strategist`: the AWP implementation batch is
  closed. Open a fresh product-app promotion task only if runtime ownership,
  storage/auth/export implementation scope, and release evidence are accepted.
