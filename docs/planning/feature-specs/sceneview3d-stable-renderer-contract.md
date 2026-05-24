---
agent: coordinator
period: 2026-W23
generated_at: 2026-05-24T15:35:46Z
repo_revision: "1b607fd"
inputs:
  - docs/reviews/sceneview3d-promotion-gate-2026-05-24.md
  - docs/planning/feature-specs/sceneview3d-promotion-readiness.md
  - docs/planning/sprint-2026-W23-scene3d-promotion-readiness.md
  - docs/planning/sprint-2026-W22-scene3d-renderer-evidence.md
  - docs/planning/feature-specs/sceneview3d-v1-rfc.md
  - AGENTS.md
owner: "@coordinator"
decision_level: advisory
---

# SceneView3D Stable Renderer Contract Plan

## Decision Boundary

The W23 promotion-readiness package is accepted as planning evidence, but stable
`view.mode: "scene3d"` runtime promotion remains blocked. The next phase is a
contract-definition slice: define what a real stable renderer must prove before
any runtime switch, schema widening, or public stable claim is allowed.

Current decision state:

- W23 promotion-readiness package: Go.
- Stable `view.mode: "scene3d"` runtime promotion: No-go / blocked.
- This document is a shared planning handoff only. It does not claim that any
  SRC implementation task is complete.

Coordinator single-writer note: execution owners must return evidence artifacts
or findings for their assigned slices. They must not directly update shared
planning state; accepted status changes are serialized here, in
`docs/planning/task-burndown.md`, or in `docs/planning/dependency-graph.md` by
`@coordinator`.

## Contract Scope

| Area | Required Contract | Owner | Evidence Target | Blocker If Missing |
| --- | --- | --- | --- | --- |
| Renderer contract | A stable renderer interface for load, render, resize, camera sync, snapshot, query, destroy, and diagnostic reporting | `@adapter-agent` | adapter contract report and tests | Browser evidence remains spike-local only |
| Dependency boundary | Three.js and 3DTilesRendererJS stay inside `@gis-engine/scene3d-three-adapter`; core `@gis-engine/engine` and `@gis-engine/scene3d` do not import renderer packages | `@adapter-agent`, `@engine-agent` | dependency isolation test and package boundary audit | Renderer dependency leaks into core runtime |
| Lifecycle semantics | Deterministic load, reload, failure recovery, cancellation, resize, destroy, and resource cleanup states | `@adapter-agent`, `@qa-agent` | lifecycle matrix and failure diagnostics | Runtime can hang, leak resources, or report ambiguous state |
| Snapshot semantics | Nonblank frame metrics, deterministic camera, stable dimensions, resource readiness, and diagnostic codes for blank/pending/error frames | `@qa-agent` | release visual report and snapshot tests | Visual evidence cannot support release claims |
| Query semantics | Stable pick coordinates, object identity, layer/source references, hidden/missing layer diagnostics, and deterministic no-hit behavior | `@qa-agent`, `@adapter-agent` | query contract tests and browser evidence | AI tools cannot audit generated 3D edits |
| Resource policy | 3D Tiles JSON, model, texture, worker, timeout, external URL, and example asset checks remain aligned with resource policy implementation and docs | `@engine-agent`, `@docs-agent` | resource-policy tests and human-facing policy section | Remote/resource side effects are not explicit |
| Release gate | `pnpm test:release:scene3d`, strict visual snapshot evidence, adapter contract tests, and quality-guardian decision are required before beta/stable claims | `@quality-guardian` | gate report with pass/block/waiver | Promotion bypasses AI-native merge standard |

## Execution Handoff

| id | title | priority | complexity | owner | status | dependencies | evidence target | acceptance | finish gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-2026W23-SRC-001 | Define stable renderer adapter contract | P0 | M | `@adapter-agent` | todo | W23 promotion gate | Adapter contract delta report plus focused adapter contract tests under `tests/adapter` | Contract names load, render, resize, camera sync, snapshot, query, destroy, diagnostics, resource readiness, and cleanup obligations without changing stable `view.mode`. | `pnpm test:adapter -- tests/adapter/scene3d-three-adapter.test.ts`; `pnpm --filter @gis-engine/scene3d-three-adapter build`; code-reviewer confirms no core renderer dependency leak |
| TASK-2026W23-SRC-002 | Freeze Three.js and 3DTilesRendererJS dependency boundary | P0 | S | `@adapter-agent`, `@engine-agent` | todo | SRC-001 | Dependency-boundary audit naming allowed package locations and any package.json/import checks | Three.js and 3DTilesRendererJS remain adapter-local; `@gis-engine/engine`, `@gis-engine/scene3d`, and `@gis-engine/ai` do not import renderer packages or workers. | `pnpm --filter @gis-engine/scene3d-three-adapter build`; dependency isolation check or audit evidence; `pnpm check` when package metadata or imports change |
| TASK-2026W23-SRC-003 | Specify lifecycle and failure-state semantics | P1 | M | `@adapter-agent`, `@qa-agent` | todo | SRC-001 | Lifecycle matrix report covering load, reload, resize, cancel, failure, recovery, destroy, and repeated destroy | State transitions are deterministic, idempotent where expected, and return structured diagnostics with stable codes and paths for resource, renderer, dimension, and lifecycle failures. | Lifecycle contract tests pass through adapter suite; `pnpm check` when runtime behavior or diagnostics change |
| TASK-2026W23-SRC-004 | Specify stable snapshot and query semantics | P1 | M | `@qa-agent`, `@adapter-agent` | todo | SRC-001, SRC-003 | Snapshot/query evidence report with browser metrics, fixture names, pick cases, and diagnostic outcomes | Snapshot/query evidence defines nonblank metrics, stable camera and dimensions, resource readiness, pick identity, no-hit behavior, and hidden/missing layer diagnostics. | `pnpm test:release:scene3d`; `pnpm test:snapshot:visual`; strict visual snapshot before any beta/stable renderer claim |
| TASK-2026W23-SRC-005 | Align SceneView3D resource policy and release gates | P1 | M | `@engine-agent`, `@quality-guardian`, `@docs-agent` | todo | SRC-002, SRC-004 | Resource-policy test output, release-gate matrix, and docs alignment note | Resource-policy implementation/tests/docs name 3D Tiles JSON, model, texture, worker, timeout, external URL, and example asset expectations; release gates state exact PR, beta, and stable triggers. | `pnpm test:resources`; `pnpm test:schema -- tests/schema/resource-policy.test.ts` when schema policy changes; `pnpm test:release:scene3d`; visual snapshot gate or explicit coordinator waiver only for non-rendering changes |
| TASK-2026W23-SRC-006 | Issue stable runtime promotion readiness decision | P0 | S | `@quality-guardian`, `@coordinator` | blocked | SRC-001, SRC-002, SRC-003, SRC-004, SRC-005 | Quality-guardian gate report and coordinator decision note listing accepted evidence or blockers | A future gate either accepts the real renderer contract package or keeps stable `view.mode: "scene3d"` blocked with explicit blocker codes and follow-up owners. | `pnpm build:schema` if public schema/tool contracts changed; `pnpm check`; `pnpm test:release:scene3d`; strict visual snapshot evidence or release waiver; coordinator records Go/No-go decision |

## Release Gate Requirements

The next quality gate is conditional on the touched surface:

- Adapter contract tests: required for `SRC-001`, `SRC-003`, `SRC-004`, and any
  change to `packages/scene3d-three-adapter`, adapter lifecycle, snapshot, query,
  or renderer evidence handoff.
- Resource policy tests: required for `SRC-002`, `SRC-005`, and any URL, tile,
  worker, model, texture, timeout, example asset, or package-boundary change.
- `pnpm test:release:scene3d`: required for `SRC-004`, `SRC-005`, `SRC-006`,
  and every claim that SceneView3D renderer evidence supports beta/stable
  readiness.
- Visual snapshots: `pnpm test:snapshot:visual` is required when rendering,
  fixture, style, browser runner, visual evidence, or adapter output can change;
  `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual` is required
  before any beta/stable renderer claim unless coordinator records a release
  waiver with follow-up tasks.
- `pnpm build:schema`: required when TypeBox schemas, generated schema
  artifacts, diagnostics, MCP input/output schemas, public command contracts, or
  public resource policy contracts change.
- `pnpm check`: required for final handoff, `SRC-006`, package metadata/import
  boundary changes, and any PR that wants quality-guardian acceptance.
- `pnpm --filter @gis-engine/scene3d-three-adapter build`: required for adapter
  package changes and dependency-boundary evidence.

Current gate state remains: W23 promotion-readiness package = Go; stable
runtime promotion = No-go / blocked.

## Recommendations

### Keep Stable Runtime Blocked

- Evidence: `docs/reviews/sceneview3d-promotion-gate-2026-05-24.md` accepts the
  W23 promotion-readiness package but issues no-go for stable runtime.
- Impact: AI safety and architecture remain protected while the real renderer
  contract is still being specified.
- Action: `@coordinator` keeps stable `view.mode: "scene3d"` out of release
  scope until `TASK-2026W23-SRC-006` passes.
- Confidence: high.

### Define Contract Before Implementation Expansion

- Evidence: existing W22/W23 evidence proves browser capture and adapter
  summary handoff, not a stable runtime contract.
- Impact: product planning gets a clear promotion path without leaking
  renderer dependencies or ambiguous lifecycle semantics into core packages.
- Action: `@task-distributor` schedules `SRC-001` through `SRC-005` before any
  stable runtime implementation task.
- Confidence: high.

## Non-Goals

- Do not enable stable `view.mode: "scene3d"`.
- Do not add Three.js, 3DTilesRendererJS, CesiumJS, glTF loaders, workers, or
  WebGPU-only code to `@gis-engine/engine`.
- Do not expose renderer promotion summaries through public MCP context unless a
  separate MCP contract update is approved.
- Do not treat mock snapshot/query evidence as stable renderer evidence.
