---
agent: orchestrator
period: 2026-06-05
generated_at: 2026-06-05T11:57:46Z
repo_revision: "270a8d3c502816fc2c79177ffb3a1d9fbabc97ae"
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
  - docs/research/competitor-updates-2026-W23.md
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

## Current State

| Area | Status | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| SDK + CLI productization | complete | `docs/planning/feature-specs/sdk-cli-first-release.md`; `@gis-engine/cli` 0.4.0; `--generate --template app` evidence in the W23 digest | Users can start from SDK and CLI rather than Studio | Keep GA package gates in release checklists | high |
| Generated-app delivery evidence | complete as contract | `generationEvidence.delivery`; `docs/planning/feature-specs/generated-app-delivery-ux.md`; `GIR-001` through `GIR-006` | The evidence spine exists, but review remains too document/test-centric | Build an inspectable UI on top of the five delivery sections | high |
| AI Map Workbench | local hardening complete / hosted no-go | `AWP-001` through `AWP-007`; `examples/ai-map-workbench` | The workbench is a useful local reference, not a product surface | Reuse patterns for the review-console UI without promoting hosted scope | high |
| Cloud-native sources | readiness/promotion gates planned | `cloud-native-source-readiness.md`; `cloud-native-source-promotion-candidates.md` | PMTiles and GeoParquet pressure is visible but runtime claims remain blocked | Promote one schema/policy contract at a time before parser work | high |
| Visual and performance evidence | exists but trend-thin | strict visual runner and nightly perf harness are documented in planning history | Release claims need repeated evidence, not one-off runs | Maintain strict scenes and accumulate two weeks of perf data | medium |
| Agent health | product SLA breach | Regenerated `docs/planning/AGENT_HEALTH_DASHBOARD.md` at 2026-06-05T12:02:18Z shows `@product` current age 4d vs 2d max latency | Orchestrator should not treat W23 research as current after the SLA breach | Refresh W24 competitor update and scorecard by 2026-06-08 | high |

## W24 Task Queue

| id | Priority | Phase | Owner | Status | Target artifact | Exit condition |
| --- | --- | --- | --- | --- | --- | --- |
| TASK-2026W24-RCU-001 | P0 | productized review | `@builder`, `@quality`, `@docs` | queued | review-console UI over five-section delivery schema | Browser-rendered delivery summary, files/export, map edits, data/sources, spatial analysis, and scene browsing sections; no new MCP tool and no direct `MapSpec` mutation |
| TASK-2026W24-RCU-002 | P0 | productized review | `@builder`, `@quality` | queued | Prompt-to-Delivery QA Matrix UI | Deterministic clickable test cards for ready, blocked, needs-confirmation, and follow-up-required scenarios |
| TASK-2026W24-RCU-003 | P0 | productized review | `@builder`, `@quality`, `@docs` | queued | AI Map Workbench local-hardening delta | Review actions, durable audit contract, and credential safety are visible in local/example evidence without product/hosted promotion |
| TASK-2026W24-CNS-001 | P1 | cloud-native data | `@builder`, `@quality`, `@docs` | queued | PMTiles archive parsing contract | TypeBox/resource-policy/smoke tests define archive metadata/range behavior while feature query remains blocked unless separately promoted |
| TASK-2026W24-CNS-002 | P1 | cloud-native data | `@builder`, `@quality`, `@docs` | queued | GeoParquet source schema contract | TypeBox schema covers bbox, CRS, WKB/GeoArrow encoding, and blocked/runtime-no-claim diagnostics |
| TASK-2026W24-CNS-003 | P1 | cloud-native data | `@builder`, `@quality`, `@docs` | queued | resource-policy range/bbox/index rules | PMTiles range, GeoParquet bbox/range, and FlatGeobuf index paths produce stable allow/deny diagnostics before IO |
| TASK-2026W24-VPE-001 | P1 | visual/perf evidence | `@builder`, `@quality` | queued | 3-scene strict visual maintenance | GeoJSON, MVT, and `fill-extrusion-lite` strict visual scenes remain release-capable |
| TASK-2026W24-VPE-002 | P1 | visual/perf evidence | `@builder`, `@quality` | queued | nightly perf trend ledger | 1k/10k/100k lifecycle runs accumulate for two weeks with trend notes and regressions called out |
| TASK-2026W24-VPE-003 | P1 | visual/perf evidence | `@builder`, `@quality`, `@docs` | queued | app-template visual scene | Earthquake template app gets a deterministic visual snapshot or an explicit release waiver |
| TASK-2026W24-EVO-001 | P2 | evolution metrics | `@orchestrator`, `@quality` | queued | D1 estimation accuracy entries | W24 estimates and actuals are recorded in the evolution ledger |
| TASK-2026W24-EVO-002 | P2 | evolution metrics | `@orchestrator`, `@quality` | queued | D3 quality trend entries | First-pass gate rate and rework count are recorded for W24 |
| TASK-2026W24-EVO-003 | P2 | evolution metrics | `@orchestrator`, `@docs` | queued | D4 pattern/pitfall entries | At least two patterns and one pitfall are extracted for the sprint |
| TASK-2026W24-PRD-001 | P1 | product refresh | `@product` | queued | `docs/research/competitor-updates-2026-W24.md` | Official/npm/source checks are refreshed by 2026-06-08 and source dates are recorded |
| TASK-2026W24-PRD-002 | P1 | product refresh | `@product`, `@orchestrator` | queued | `docs/research/capability-scorecard.md` | Five-dimension scorecard is refreshed after W24 competitor evidence; SceneView3D stable and unsupported source claims remain blocked |

## Phase Order

1. Productized review experience first: `RCU-001` through `RCU-003`.
2. Cloud-native data contracts second: `CNS-001` through `CNS-003`.
3. Visual/performance evidence hardening in parallel where owners have capacity.
4. Evolution metrics start with W24 estimates before implementation begins.
5. Product SLA repair by refreshing W24 competitor evidence by 2026-06-08.

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
