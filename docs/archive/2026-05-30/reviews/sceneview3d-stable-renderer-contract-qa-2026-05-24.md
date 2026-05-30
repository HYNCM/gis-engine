---
agent: qa-agent
period: 2026-W23
generated_at: 2026-05-24T15:37:59Z
repo_revision: "1b607fd"
inputs:
  - docs/planning/feature-specs/sceneview3d-stable-renderer-contract.md
  - tests/snapshot/smoke/scene3d-stable-renderer-contract.test.ts
  - tests/snapshot/smoke/scene3d-release-visual-gate.test.ts
  - tests/snapshot/smoke/scene3d-mock-snapshot.test.ts
  - tests/adapter/scene3d-mock-query.test.ts
  - packages/scene3d/src/index.ts
  - packages/scene3d-three-adapter/src/index.ts
owner: "@qa-agent"
decision_level: advisory
---

# SceneView3D Stable Renderer Contract QA Report

## Decision

QA semantics slice complete for `TASK-2026W23-SRC-003` and `TASK-2026W23-SRC-004`.
Stable `view.mode: "scene3d"` remains blocked. The new smoke contract captures
the lifecycle, failure, snapshot, and query expectations without promoting any
mock or spike evidence to stable renderer status.

## Lifecycle / Failure

- Evidence: [tests/snapshot/smoke/scene3d-stable-renderer-contract.test.ts](/Users/chengming/CodeXProjects/gis-engine/tests/snapshot/smoke/scene3d-stable-renderer-contract.test.ts)
  now asserts deterministic load/reload/snapshot/destroy transitions, repeated
  load parity, post-destroy `RENDER.DESTROYED` diagnostics, and resource-policy
  failure reporting.
- Impact: future stable renderer work has a concrete state-transition target and
  cannot claim success without structured diagnostics for failure and cleanup.
- Action: keep lifecycle parity aligned with this smoke contract before any
  stable promotion discussion.
- Confidence: high.

## Snapshot / Query

- Evidence: the same smoke test fixes nonblank render metrics, snapshot
  dimension determinism, pick identity, no-hit behavior, hidden-layer filtering,
  and missing-layer/source diagnostics using `SNAPSHOT.BLANK_CANVAS`,
  `LAYER.NOT_FOUND`, and `SRC.NOT_FOUND`.
- Impact: stable renderer evidence now has a clear separation between
  deterministic adapter-local results and real nonblank frame metrics.
- Action: preserve these semantics when replacing spike-local evidence with a
  real stable renderer implementation.
- Confidence: high.

## Stable Boundary

- Evidence: the smoke test also validates `validateSpec()` blocker codes for
  `/view/mode`, `/capabilities/renderer`, and `/capabilities/dimensions`, and
  the promotion summary still reports `stablePromotionAllowed: false`.
- Impact: the repo still refuses stable `scene3d` promotion even when
  spike-local load/snapshot/query evidence passes.
- Action: do not treat mock or spike evidence as stable renderer evidence.
- Confidence: high.

## Verification

- Evidence: `pnpm vitest run tests/snapshot/smoke/scene3d-stable-renderer-contract.test.ts`
  passed.
- Impact: the new contract file parses and the current public API behavior
  matches the recorded QA semantics.
- Action: keep this test in the smoke lane alongside the existing SceneView3D
  gate coverage.
- Confidence: high.
