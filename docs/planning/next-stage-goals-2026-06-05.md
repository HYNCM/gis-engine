---
agent: orchestrator
period: 2026-06-05
generated_at: 2026-06-05T13:05:41Z
repo_revision: "4012f51"
inputs:
  - README.md
  - AGENTS.md
  - docs/planning/weekly-digest.md
  - docs/planning/monthly-roadmap.md
  - docs/planning/task-burndown.md
  - docs/planning/dependency-graph.md
  - docs/planning/AGENT_HEALTH_DASHBOARD.md
  - docs/planning/feature-specs/generated-app-review-console.md
  - docs/planning/feature-specs/generated-app-delivery-ux.md
  - docs/planning/feature-specs/cloud-native-source-promotion-candidates.md
  - docs/planning/feature-specs/cloud-native-source-readiness.md
  - docs/planning/feature-specs/ai-map-workbench-product-implementation.md
  - docs/research/capability-scorecard.md
  - docs/research/capability-scorecard-w24-refresh.md
  - docs/research/competitor-updates-2026-W23.md
  - docs/research/competitor-updates-2026-W24.md
owner: "@orchestrator"
decision_level: advisory
---

# Next-Stage Goals: 2026-06-05

## Decision

GIS Engine is past the SDK + CLI first-release productization checkpoint. The
next stage should move from evidence scaffolding to productized review
experience, while keeping the existing architectural guardrails intact:

- Schema-first public inputs.
- Command-only mutation through `MapCommand` and `applyCommands`.
- Structured diagnostics and stable paths.
- Frozen MCP tool names.
- No raw prompt retention by default.
- AI Map Workbench remains local/example-scoped.
- Stable `view.mode: "scene3d"` remains blocked after SRC-006.
- MapLibre v6 remains prerelease/audit-only; no package movement in this plan.

This snapshot opens the 2026-W24 planning queue. It does not claim that W24
competitor evidence, visual trend data, performance trends, PMTiles parsing,
GeoParquet schemas, or review-console UI implementation are complete.

## 2026-06-05 Reconciliation Update

The original snapshot was generated at `270a8d3`. Current repo revision
`4012f51` contains implementation/test artifacts for `RCU-*`, `CNS-*`,
`VPE-001`, and `VPE-003`, plus a W24 product refresh. @quality acceptance
report at `docs/reviews/w24-quality-acceptance-2026-06-05.md` (HOC-N3)
records formal PASS for `RCU-001~003`, `CNS-001~003` (schema/policy
contracts only, NOT runtime parsers), `VPE-001`, and `VPE-003`. All 525
tests pass (`pnpm check` green), schema build passes, docs tests pass.
`VPE-002` has a perf-trend harness but still requires repeated
nightly/release trend data before it can be closed. No W24 acceptance item
promotes stable SceneView3D runtime, hosted AI Map Workbench, hidden source IO,
or cloud-native parser runtime.

## Current State

| Area | Status | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| SDK + CLI productization | complete | `docs/planning/feature-specs/sdk-cli-first-release.md`; `@gis-engine/cli` 0.4.0; `--generate --template app` evidence in the W23 digest | Users can start from SDK and CLI rather than Studio | Keep GA package gates in release checklists | high |
| Generated-app delivery evidence | complete as contract | `generationEvidence.delivery`; `docs/planning/feature-specs/generated-app-delivery-ux.md`; `GIR-001` through `GIR-006` | The evidence spine exists, but review remains too document/test-centric | Build an inspectable UI on top of the five delivery sections | high |
| AI Map Workbench | local hardening complete / hosted no-go | `AWP-001` through `AWP-007`; `examples/ai-map-workbench` | The workbench is a useful local reference, not a product surface | Reuse patterns for the review-console UI without promoting hosted scope | high |
| Cloud-native sources | readiness/promotion gates planned | `cloud-native-source-readiness.md`; `cloud-native-source-promotion-candidates.md` | PMTiles and GeoParquet pressure is visible but runtime claims remain blocked | Promote one schema/policy contract at a time before parser work | high |
| Visual and performance evidence | exists but trend-thin | strict visual runner and nightly perf harness are documented in planning history | Release claims need repeated evidence, not one-off runs | Maintain strict scenes and accumulate two weeks of perf data | medium |
| Agent health | reconciled after product refresh | `docs/research/competitor-updates-2026-W24.md`; `docs/research/capability-scorecard.md`; regenerated handoff/dashboard artifacts | Orchestrator can consume W24 product evidence after this reconciliation, but quality acceptance still depends on current gates | Keep product refresh on weekly cadence and do not reuse stale external evidence | high |

## W24 Task Queue

| id | Priority | Phase | Owner | Status | Target artifact | Exit condition |
| --- | --- | --- | --- | --- | --- | --- |
| TASK-2026W24-RCU-001 | P0 | productized review | `@builder`, `@quality`, `@docs` | done | `examples/ai-map-workbench/review-console.mjs`; review-console tests | Browser-rendered delivery summary, files/export, map edits, data/sources, spatial analysis, and scene browsing sections; no new MCP tool and no direct `MapSpec` mutation |
| TASK-2026W24-RCU-002 | P0 | productized review | `@builder`, `@quality` | done | Prompt-to-Delivery QA Matrix fixtures/tests | Deterministic clickable test cards for ready, blocked, needs-confirmation, and follow-up-required scenarios |
| TASK-2026W24-RCU-003 | P0 | productized review | `@builder`, `@quality`, `@docs` | done | workbench server/review hardening tests | Review actions, durable audit contract, and credential safety are visible in local/example evidence without product/hosted promotion |
| TASK-2026W24-CNS-001 | P1 | cloud-native data | `@builder`, `@quality`, `@docs` | done (schema/policy contract only) | PMTiles archive metadata/range contract | TypeBox/resource-policy/smoke tests define archive metadata/range behavior while feature query remains blocked unless separately promoted |
| TASK-2026W24-CNS-002 | P1 | cloud-native data | `@builder`, `@quality`, `@docs` | done (schema/policy contract only) | GeoParquet source schema contract | TypeBox schema covers bbox, CRS, WKB/GeoArrow encoding, and blocked/runtime-no-claim diagnostics |
| TASK-2026W24-CNS-003 | P1 | cloud-native data | `@builder`, `@quality`, `@docs` | done (schema/policy contract only) | resource-policy range/bbox/index rules | PMTiles range, GeoParquet bbox/range, and FlatGeobuf index paths produce stable allow/deny diagnostics before IO |
| TASK-2026W24-VPE-001 | P1 | visual/perf evidence | `@builder`, `@quality` | done | 3-scene strict visual maintenance test | GeoJSON, MVT, and `fill-extrusion-lite` strict visual scenes remain release-capable |
| TASK-2026W24-VPE-002 | P1 | visual/perf evidence | `@builder`, `@quality` | harness implemented / trend backlog | nightly perf trend ledger harness | 1k/10k/100k lifecycle runs need repeated nightly/release trend evidence before Done |
| TASK-2026W24-VPE-003 | P1 | visual/perf evidence | `@builder`, `@quality`, `@docs` | done | app-template visual scene test | Earthquake template app gets a deterministic visual snapshot or an explicit release waiver |
| TASK-2026W24-EVO-001 | P2 | evolution metrics | `@orchestrator`, `@quality` | done | D1 estimation accuracy entries | W24 estimates and actuals are recorded in the evolution ledger |
| TASK-2026W24-EVO-002 | P2 | evolution metrics | `@orchestrator`, `@quality` | done | D3 quality trend entries | First-pass gate rate and rework count are recorded for W24 |
| TASK-2026W24-EVO-003 | P2 | evolution metrics | `@orchestrator`, `@docs` | done | D4 pattern/pitfall entries | At least two patterns and one pitfall are extracted for the sprint |
| TASK-2026W24-PRD-001 | P1 | product refresh | `@product` | done / consumed | `docs/research/competitor-updates-2026-W24.md` | Official/npm/source checks are refreshed and source dates are recorded |
| TASK-2026W24-PRD-002 | P1 | product refresh | `@product`, `@orchestrator` | done / consumed | `docs/research/capability-scorecard.md` | Five-dimension scorecard is refreshed after W24 competitor evidence; SceneView3D stable and unsupported source claims remain blocked |

## Phase Order

1. Productized review experience first: `RCU-001` through `RCU-003`; current
   state is done and quality accepted.
2. Cloud-native data contracts second: `CNS-001` through `CNS-003`; current
   state is done and quality accepted without runtime parsers.
3. Visual/performance evidence hardening in parallel; `VPE-001` and `VPE-003`
   are done and quality accepted, while `VPE-002` remains backlog for repeated
   trend data.
4. Evolution metrics start with W24 estimates before implementation begins and
   must stay tied to actual gate evidence at closure.
5. Product SLA repair is complete at the document level through the W24
   competitor update and scorecard refresh; orchestrator consumption is handled
   by the updated weekly digest and handoff ledger.

## Validation Plan

| Gate | Required When | Command or Evidence |
| --- | --- | --- |
| Schema sync | public TypeBox, MCP, command, delivery, or source schemas change | `pnpm build:schema`; schema-sync tests |
| Deterministic check | every implementation or planning closeout | `pnpm check` |
| Resource policy | URL, tile, range, worker, external asset, PMTiles, GeoParquet, or FlatGeobuf policy changes | `pnpm test:resources`; `tests/schema/resource-policy.test.ts` |
| Review-console UI | UI implementation changes | focused example/app tests plus browser smoke evidence |
| Strict visual | rendering, visual fixture, app template, or release visual claims | `pnpm test:release:strict`; visual snapshot gate or explicit waiver |
| SceneView3D release | SceneView3D evidence changes | `pnpm test:release:scene3d`; stable runtime remains blocked |
| Docs | docs/index/planning changes | `node scripts/doc-generator.mjs links`; `pnpm test:docs` |
| Product refresh | competitor/standards/package evidence changes | source URLs and checked dates recorded in W24 report |

## Non-Goals

- No stable SceneView3D runtime promotion.
- No GeoParquet, FlatGeobuf, GeoTIFF, GeoZarr, or PMTiles parser runtime before
  the planned schema/resource-policy gates pass.
- No new MCP tool names.
- No AI Map Workbench hosted/product promotion.
- No MapLibre v6 package upgrade.
- No online playground scope.
- No automatic modification of AGENTS.md core safety rules.
