---
agent: docs-agent
period: 2026-W23
generated_at: 2026-05-24T14:29:18Z
repo_revision: "42d8c01"
inputs:
  - docs/reviews/sceneview3d-promotion-gate-2026-05-24.md
  - docs/planning/feature-specs/sceneview3d-promotion-readiness.md
  - docs/planning/sprint-2026-W23-scene3d-promotion-readiness.md
  - docs/planning/sprint-2026-W22-scene3d-renderer-evidence.md
  - docs/planning/feature-specs/sceneview3d-v1-rfc.md
  - AGENTS.md
owner: "@docs-agent"
decision_level: advisory
---

# SceneView3D Stable Renderer Contract Plan

## Decision Boundary

The W23 promotion-readiness package is accepted as planning evidence, but stable
`view.mode: "scene3d"` runtime promotion remains blocked. The next phase is a
contract-definition slice: define what a real stable renderer must prove before
any runtime switch, schema widening, or public stable claim is allowed.

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

## Planning Tasks

| id | title | priority | complexity | owner | status | dependencies | acceptance |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-2026W23-SRC-001 | Define stable renderer adapter contract | P0 | M | `@adapter-agent` | todo | W23 promotion gate | Contract names lifecycle, snapshot, query, diagnostics, and destroy obligations without changing stable `view.mode`. |
| TASK-2026W23-SRC-002 | Freeze Three.js and 3DTilesRendererJS dependency boundary | P0 | S | `@adapter-agent`, `@engine-agent` | todo | SRC-001 | Three.js and 3DTilesRendererJS remain adapter-local; core packages have dependency-isolation checks. |
| TASK-2026W23-SRC-003 | Specify lifecycle and failure-state semantics | P1 | M | `@adapter-agent`, `@qa-agent` | todo | SRC-001 | Load/reload/resize/destroy/failure transitions are deterministic and return structured diagnostics. |
| TASK-2026W23-SRC-004 | Specify stable snapshot and query semantics | P1 | M | `@qa-agent`, `@adapter-agent` | todo | SRC-001, SRC-003 | Snapshot and query evidence define nonblank metrics, camera/dimension determinism, pick identity, no-hit, and hidden/missing layer behavior. |
| TASK-2026W23-SRC-005 | Align SceneView3D resource policy and release gates | P1 | M | `@engine-agent`, `@quality-guardian`, `@docs-agent` | todo | SRC-002, SRC-004 | Resource-policy tests/docs and release gates name the exact checks required before beta or stable renderer claims. |
| TASK-2026W23-SRC-006 | Issue stable runtime promotion readiness decision | P0 | S | `@quality-guardian`, `@coordinator` | blocked | SRC-001, SRC-002, SRC-003, SRC-004, SRC-005 | A future gate either accepts the real renderer contract package or keeps stable `view.mode: "scene3d"` blocked with explicit blockers. |

## Release Gate Requirements

- `pnpm -s build:schema` when public schema, diagnostics, or tool output
  contracts change.
- `pnpm -s check` for deterministic repository health.
- `pnpm -s test:release:scene3d` for SceneView3D release visual evidence.
- `pnpm -s test:snapshot:visual` and
  `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm -s test:snapshot:visual` before
  any beta/stable renderer claim.
- `pnpm --filter @gis-engine/scene3d-three-adapter build` and adapter contract
  tests for dependency isolation and renderer lifecycle behavior.

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
