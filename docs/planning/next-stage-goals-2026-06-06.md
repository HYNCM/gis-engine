---
agent: orchestrator
period: 2026-06-06
generated_at: 2026-06-05T16:36:16Z
repo_revision: "8a59577"
inputs:
  - docs/reviews/full-project-review-2026-06-05.md
  - docs/reviews/w24-quality-acceptance-2026-06-05.md
  - docs/planning/monthly-roadmap.md
  - docs/planning/weekly-digest.md
  - docs/planning/task-burndown.md
  - docs/planning/dependency-graph.md
  - docs/planning/technical-debt-report.md
  - docs/planning/feature-specs/ai-map-workbench-promotion-scope.md
  - docs/research/capability-scorecard-w24-refresh.md
  - docs/planning/feature-specs/ai-map-workbench-real-system-evolution.md
  - docs/planning/feature-specs/ai-map-workbench-product-boundary.md
  - docs/planning/feature-specs/ai-map-workbench-product-implementation.md
  - docs/planning/feature-specs/cloud-native-source-promotion-candidates.md
  - docs/planning/feature-specs/generated-app-review-console.md
owner: "@orchestrator"
decision_level: advisory
---

# Next-Stage Goals: 2026-06-06

## Decision

W24 is accepted. The next stage should move from accepted contract evidence to
explicit promotion scopes, but only through fresh tasks and without reopening
closed batches.

The active directions are:

- AI Map Workbench remains local/example-scoped until a new product-promotion
  task proves runtime/service ownership, durable storage/auth/export scope, and
  release-grade visual evidence.
- Cloud-native source work stays contract-first; promote one format at a time
  from schema/policy evidence into bounded runtime claims.
- Performance and visual evidence are accepted; keep the weekly trend cuts
  current.
- Stable `view.mode: "scene3d"` remains blocked. MapLibre package movement
  stays gated by fresh official evidence and strict visual checks.
- No new MCP tool names, command-only mutation, schema-first inputs, and
  payload-free audit remain non-negotiable.

This snapshot supersedes the 2026-06-05 next-stage note as the active planning
entry point.

## Current State

| Area | Status | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| W24 review-console, cloud-native contracts, and strict visual evidence | accepted | W24 quality acceptance report; build, docs, resources, and strict visual tests | W24 can close cleanly without reopening earlier batches | Keep the accepted W24 evidence as the baseline for future planning | high |
| AI Map Workbench real-system promotion | scope frozen; product/hosted movement still blocked | `AWP-007`, `ai-map-workbench-promotion-scope.md`, `ai-map-workbench-product-boundary.md`, `technical-debt-report.md` | Product or hosted movement still lacks runtime/service ownership and storage/auth/export scope | Keep the frozen scope as the required input for any future product-promotion task | high |
| Cloud-native source promotion | contract-ready, runtime blocked | `cloud-native-source-promotion-candidates.md`, `cloud-native-source-readiness.md`, W24 schema/resource-policy tests | PMTiles, GeoParquet, and FlatGeobuf pressure exists, but runtime parser claims remain blocked | Promote one format at a time and keep schema/policy evidence first | high |
| Performance and visual evidence | accepted | `VPE-002` weekly trend cuts, strict visual maintenance tests, app-template visual tests | Release-quality claims now have repeated trend data | Keep weekly trend cuts current and release-capable scenes green | medium |
| MapLibre and SceneView3D guardrails | blocked / no-go | `MLD-004`, `SRC-006`, bundle-size and performance docs | Prevents package movement or stable 3D overclaim | Keep blocked until new official evidence and approvals exist | high |

## Next-Stage Queue

| Rank | Priority | Goal | Evidence | Exit Condition | Confidence |
| --- | --- | --- | --- | --- | --- |
| 1 | P0 | Define and freeze a fresh AI Map Workbench product-promotion scope | `AWP-007` gap list; `ai-map-workbench-promotion-scope.md`; product architecture docs | Route/module boundary, runtime/service ownership, durable storage/auth/export scope, and release-grade visual evidence are approved before any product or hosted movement | high |
| 2 | P1 | Promote the first cloud-native source candidate one format at a time | `cloud-native-source-promotion-candidates.md` | First candidate gets schema/policy/diagnostic coverage and delivery wording without runtime parser claims | high |
| 3 | P1 | Maintain perf and visual evidence | `VPE-002`, strict visual and release gates | Weekly trend cuts stay current and release-capable scenes stay green | medium |
| 4 | P2 | Keep docs and package guardrails aligned with current budgets and no-go decisions | `bundle-size.yml`, performance benchmarks, roadmap, release wording | Docs stay synchronized; no stale stable-3D or package-movement claims remain | high |

The promotion-scope freeze is complete in
`docs/planning/feature-specs/ai-map-workbench-promotion-scope.md`; the
remaining active queue starts at cloud-native source promotion, trend evidence,
and guardrails.

## Phase Order

1. Promotion scope before any product movement.
2. Cloud-native promotion one format at a time.
3. Trend evidence and visual gates next.
4. Guardrail maintenance and docs synchronization last.

## Validation Plan

| Gate | Required When | Command or Evidence |
| --- | --- | --- |
| Promotion scope | Any future AI Map Workbench product movement task starts | Fresh product-promotion task, ownership notes, `ai-map-workbench-promotion-scope.md`, and `pnpm check` evidence |
| Schema sync | Public TypeBox, MCP, command, delivery, or source schemas change | `pnpm build:schema`; schema-sync tests |
| Resource policy | URL, tile, range, worker, external asset, PMTiles, GeoParquet, or FlatGeobuf policy changes | `pnpm test:resources`; `tests/schema/resource-policy.test.ts` |
| Visual evidence | Rendering, visual fixture, release visual, or app-template claims change | `pnpm test:release:strict`; visual snapshot gate or explicit waiver |
| SceneView3D release | SceneView3D evidence changes | `pnpm test:release:scene3d`; stable runtime remains blocked |
| Docs | docs/index/planning changes | `node scripts/doc-generator.mjs links`; `pnpm test:docs` |
| Product refresh | Competitor, standards, or package evidence changes | Source URLs and checked dates recorded in a dated research report |

## Non-Goals

- No hosted promotion without a fresh explicit task.
- No runtime parsers or hidden fetches for cloud-native sources before schema
  and policy gates pass.
- No new MCP tool names.
- No stable SceneView3D promotion.
- No MapLibre package movement without fresh official evidence.
- No browser-side secrets, raw prompt retention by default, or direct
  `MapSpec` mutation outside the command system.
