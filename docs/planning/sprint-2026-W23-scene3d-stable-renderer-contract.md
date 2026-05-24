---
agent: task-distributor
period: 2026-05-25
generated_at: 2026-05-24T16:14:09Z
repo_revision: "487f80a45c14954cd9418c3a62ebc82601fedb62"
inputs:
  - docs/planning/task-burndown.md
  - docs/planning/dependency-graph.md
  - docs/planning/monthly-roadmap.md
  - docs/planning/feature-specs/sceneview3d-stable-renderer-contract.md
owner: "@task-distributor"
decision_level: advisory
---

# Sprint Handoff: SceneView3D Stable Renderer Contract

## Conclusion

This is the 2026-05-25 task handoff for the next SceneView3D promotion slice.
The W23 promotion-readiness package is accepted as planning evidence, but stable
`view.mode: "scene3d"` remains blocked. The next work is contract definition,
evidence production, and gate alignment before any stable runtime promotion can
be reconsidered.

Planning state remains single-writer. Execution owners may implement code,
tests, reports, or review findings in their scoped areas, but they must not
update shared planning markdown directly. Accepted status changes are serialized
by `@task-distributor` or `@coordinator` after evidence exists.

## Owner Assignments

| Owner | Assignment | Write Scope | Handoff Artifact |
| --- | --- | --- | --- |
| `@adapter-agent` | Define the stable renderer adapter contract, dependency boundary, lifecycle semantics, and adapter-local snapshot/query obligations. | `packages/scene3d-three-adapter/*`, adapter tests, adapter README | Adapter contract delta report, lifecycle matrix, dependency-boundary audit, adapter test output |
| `@qa-agent` | Produce real renderer visual, snapshot, query, lifecycle, and browser-metric evidence for the contract. | snapshot tests, visual fixtures, evidence reports | Snapshot/query evidence report and release-runner output |
| `@engine-agent` | Confirm resource-policy, schema, diagnostics, and package-boundary implications without pulling renderer dependencies into core. | `packages/engine/src/*`, schema/resource tests, package boundary checks | Contract delta note and resource-policy evidence |
| `@ai-agent` | Assess whether any renderer evidence belongs in MCP context, and keep existing public MCP context extension-only unless a new contract is approved. | `packages/ai/src/*`, AI/MCP tests | MCP exposure decision or no-change note |
| `@docs-agent` | Keep public status, release notes, and human-facing resource-policy docs aligned with the accepted gate state. | README, CHANGELOG, docs | Docs alignment report |
| `@quality-guardian` | Rerun the necessary gates and issue pass/block/waiver findings for SRC evidence. | gate report only | Stable runtime promotion gate report |
| `@coordinator` | Resolve accepted evidence, record Go/No-go, and keep stable runtime blocked until all prerequisites pass. | planning state and decision notes | Coordinator decision note |

## SRC Task Ledger

| id | title | priority | complexity | owner | status | dependencies | evidence target | acceptance | finish gates |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-2026W23-SRC-001 | Define stable renderer adapter contract | P0 | M | `@adapter-agent` | todo | W23 promotion-readiness package Go | Adapter contract delta report plus focused adapter contract tests under `tests/adapter` | Contract names load, render, resize, camera sync, snapshot, query, destroy, diagnostics, resource readiness, and cleanup obligations without changing stable `view.mode`. | `pnpm test:adapter -- tests/adapter/scene3d-three-adapter.test.ts`; `pnpm --filter @gis-engine/scene3d-three-adapter build`; code-reviewer boundary audit |
| TASK-2026W23-SRC-002 | Freeze Three.js and 3DTilesRendererJS dependency boundary | P0 | S | `@adapter-agent`, `@engine-agent` | todo | SRC-001 | Dependency-boundary audit naming allowed package locations and any package.json/import checks | Three.js and 3DTilesRendererJS remain adapter-local; `@gis-engine/engine`, `@gis-engine/scene3d`, and `@gis-engine/ai` do not import renderer packages or workers. | `pnpm --filter @gis-engine/scene3d-three-adapter build`; dependency isolation check or audit evidence; `pnpm check` when package metadata or imports change |
| TASK-2026W23-SRC-003 | Specify lifecycle and failure-state semantics | P1 | M | `@adapter-agent`, `@qa-agent` | todo | SRC-001 | Lifecycle matrix report covering load, reload, resize, cancel, failure, recovery, destroy, and repeated destroy | State transitions are deterministic, idempotent where expected, and return structured diagnostics with stable codes and paths for resource, renderer, dimension, and lifecycle failures. | Adapter lifecycle contract tests; `pnpm check` when runtime behavior or diagnostics change |
| TASK-2026W23-SRC-004 | Specify stable snapshot and query semantics | P1 | M | `@qa-agent`, `@adapter-agent` | todo | SRC-001, SRC-003 | Snapshot/query evidence report with browser metrics, fixture names, pick cases, and diagnostic outcomes | Snapshot/query evidence defines nonblank metrics, stable camera and dimensions, resource readiness, pick identity, no-hit behavior, and hidden/missing layer diagnostics. | `pnpm test:release:scene3d`; `pnpm test:snapshot:visual`; strict visual snapshot before any beta/stable renderer claim |
| TASK-2026W23-SRC-005 | Align SceneView3D resource policy and release gates | P1 | M | `@engine-agent`, `@quality-guardian`, `@docs-agent` | todo | SRC-002, SRC-004 | Resource-policy test output, release-gate matrix, and docs alignment note | Resource-policy implementation/tests/docs name 3D Tiles JSON, model, texture, worker, timeout, external URL, and example asset expectations; release gates state exact PR, beta, and stable triggers. | `pnpm test:resources`; `pnpm test:schema -- tests/schema/resource-policy.test.ts` when schema policy changes; `pnpm test:release:scene3d`; visual snapshot gate or coordinator waiver only for non-rendering changes |
| TASK-2026W23-SRC-006 | Issue stable runtime promotion readiness decision | P0 | S | `@quality-guardian`, `@coordinator` | blocked | SRC-001, SRC-002, SRC-003, SRC-004, SRC-005 | Quality-guardian gate report and coordinator decision note listing accepted evidence or blockers | A future gate either accepts the real renderer contract package or keeps stable `view.mode: "scene3d"` blocked with explicit blocker codes and follow-up owners. | `pnpm build:schema` if public schema/tool contracts changed; `pnpm check`; `pnpm test:release:scene3d`; strict visual snapshot evidence or release waiver; coordinator records Go/No-go decision |

## Execution Order

1. `@adapter-agent` starts SRC-001 and returns the renderer contract delta before
   any dependent task claims completion.
2. `@adapter-agent` and `@engine-agent` use SRC-001 to close SRC-002 boundary
   evidence without moving renderer dependencies into core packages.
3. `@adapter-agent` and `@qa-agent` use SRC-001 to define SRC-003 lifecycle
   semantics and failure diagnostics.
4. `@qa-agent` and `@adapter-agent` use SRC-001 and SRC-003 to produce SRC-004
   snapshot/query evidence.
5. `@engine-agent`, `@quality-guardian`, and `@docs-agent` use SRC-002 and
   SRC-004 to align SRC-005 resource policy and release gates.
6. `@quality-guardian` and `@coordinator` keep SRC-006 blocked until SRC-001
   through SRC-005 have accepted evidence.

## Acceptance Criteria

- Stable `view.mode: "scene3d"` remains blocked until SRC-006 passes.
- Every SRC task has an owner, evidence target, acceptance condition, and finish
  gate before execution starts.
- Renderer dependencies remain adapter-local and do not enter
  `@gis-engine/engine`, `@gis-engine/scene3d`, or `@gis-engine/ai`.
- Snapshot/query evidence distinguishes mock evidence, browser renderer
  evidence, release visual evidence, and strict visual snapshot evidence.
- Resource-policy implementation, tests, and docs stay aligned for URLs, 3D
  Tiles JSON, model, texture, worker, timeout, and example asset behavior.
- MCP exposure remains unchanged unless `@ai-agent` proposes a new public
  contract and the coordinator accepts it.
- Planning state updates are serialized by `@task-distributor` or
  `@coordinator` after evidence handoff, not by execution owners.

## Finish Gates

- `pnpm test:adapter -- tests/adapter/scene3d-three-adapter.test.ts`
- `pnpm --filter @gis-engine/scene3d-three-adapter build`
- `pnpm test:release:scene3d`
- `pnpm test:snapshot:visual`
- `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual` before any
  beta/stable renderer claim unless coordinator records a release waiver.
- `pnpm build:schema` when public schemas, diagnostics, MCP schemas, command
  contracts, or public resource-policy contracts change.
- `pnpm check` for final handoff, package metadata/import-boundary changes, and
  any quality-guardian acceptance claim.

## Parallel Write Rules

- Shared planning markdown has a single writer: `@task-distributor` or
  `@coordinator`.
- Execution owners must not edit `docs/planning/task-burndown.md`,
  `docs/planning/dependency-graph.md`, or this sprint handoff directly while
  implementing their scoped evidence.
- Owner reports may propose status changes, blockers, or dependency updates;
  accepted changes are applied in one serialized planning update.
- SRC-001 through SRC-005 stay `todo` until owner evidence exists and is
  accepted. SRC-006 stays `blocked` until all prerequisite evidence is accepted.
- If GitHub Issues, Linear, Jira, or another tracker becomes canonical, this
  markdown file becomes a snapshot that references tracker ids rather than a
  hand-maintained task database.

## Recommendations

### Keep Stable Runtime Blocked

- Evidence: `docs/reviews/sceneview3d-promotion-gate-2026-05-24.md` accepted
  the W23 promotion-readiness package but kept stable runtime as No-go.
- Impact: AI safety and adapter-boundary integrity stay protected while the
  real renderer contract is still unaccepted.
- Action: `@coordinator` keeps stable `view.mode: "scene3d"` out of release
  scope until SRC-006 passes.
- Confidence: high.

### Start With Adapter Contract Evidence

- Evidence: `docs/planning/feature-specs/sceneview3d-stable-renderer-contract.md`
  makes SRC-001 the prerequisite for dependency, lifecycle, snapshot/query, and
  release-gate work.
- Impact: downstream owners get a stable target instead of producing
  incompatible evidence.
- Action: `@adapter-agent` delivers SRC-001 before SRC-002 through SRC-004 are
  marked complete.
- Confidence: high.

### Keep Planning Updates Serialized

- Evidence: `AGENTS.md` and the current planning ledgers define planning docs
  as evidence snapshots with coordinator/task-distributor single-writer
  ownership.
- Impact: the next integration pass can accept or reject owner evidence without
  racing divergent markdown states.
- Action: execution owners submit reports or diffs; `@task-distributor` or
  `@coordinator` updates planning status after review.
- Confidence: high.

## Risks

- SRC-004 may require a release-capable browser/visual environment; if it is
  unavailable, PR-level work may record a waiver only for non-rendering changes,
  but beta/stable claims still require strict visual evidence or a coordinator
  release waiver with follow-up tasks.
- SRC-002 can drift if package metadata or imports change during adapter work;
  any renderer dependency leak into core packages blocks stable promotion.
- SRC-005 must keep implementation, tests, and docs synchronized; resource
  policy drift blocks release evidence acceptance.
