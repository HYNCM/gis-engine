---
agent: adapter-agent
period: 2026-W23
generated_at: 2026-05-26T16:37:31Z
repo_revision: "661d6dc"
inputs:
  - packages/scene3d-three-adapter/src/index.ts
  - packages/scene3d-three-adapter/README.md
  - tests/adapter/scene3d-three-adapter.test.ts
  - tests/snapshot/smoke/scene3d-stable-renderer-contract.test.ts
  - command: pnpm test:adapter -- tests/adapter/scene3d-three-adapter.test.ts
  - command: pnpm test:snapshot:smoke -- tests/snapshot/smoke/scene3d-stable-renderer-contract.test.ts
  - command: pnpm --filter @gis-engine/scene3d-three-adapter build
owner: "@adapter-agent"
decision_level: advisory
---

# SceneView3D Adapter Lifecycle Semantics Evidence

## Scope

This adapter-agent slice advances `TASK-2026W23-SRC-001` and
`TASK-2026W23-SRC-003` inside the adapter-owned surface. It does not enable
stable `view.mode: "scene3d"` and keeps `stableRuntimeBlocked: true`.

## Contract Delta

- Evidence: `getScene3DThreeAdapterStableRendererContract()` now includes the
  adapter-local lifecycle semantics matrix, and
  `getScene3DThreeAdapterLifecycleSemantics()` exposes that matrix directly.
- Impact: future renderer work has machine-readable obligations for load,
  reload, resize, snapshot, query, failure, cancel, destroy, and cleanup states.
- Action: keep the matrix aligned with adapter tests before any stable renderer
  promotion package is reviewed.
- Confidence: high.

## Failure-State Semantics

- Evidence: resource-policy load failures now return `loaded: false`, keep the
  runtime out of the loaded state, and add `/runtime/failed/load` alongside the
  existing resource-policy diagnostic paths.
- Impact: failed load evidence cannot be mistaken for a usable renderer state.
- Action: future real renderer implementation should preserve the failed-state
  paths `/runtime/failed/load`, `/runtime/failed/snapshot`, and
  `/runtime/failed/query`.
- Confidence: high.

- Evidence: adapter snapshot resize failures now report
  `/renderer/resize/width` and `/renderer/resize/height` diagnostics.
- Impact: invalid viewport dimensions are structured and path-stable instead of
  being hidden inside mock snapshot summaries.
- Action: wire future renderer resize validation to these same paths.
- Confidence: high.

## Cleanup Semantics

- Evidence: `destroy()` now returns deterministic cleanup counters for planned
  resources and workers, plus loaded/failed/already-destroyed state flags.
- Impact: adapter-local cleanup evidence can be reviewed without enabling real
  Three.js or 3DTilesRendererJS resources during the spike.
- Action: replace the counters with real disposal counts only after the renderer
  package is promoted inside the adapter boundary.
- Confidence: high.

## Verification

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm test:adapter -- tests/adapter/scene3d-three-adapter.test.ts` | pass | 7 adapter files, 46 tests |
| `pnpm test:snapshot:smoke -- tests/snapshot/smoke/scene3d-stable-renderer-contract.test.ts` | pass outside sandbox | default sandbox hit Chromium MachPort permission denial; non-sandbox rerun passed 4 smoke files, 14 tests |
| `pnpm --filter @gis-engine/scene3d-three-adapter build` | pass | TypeScript adapter package build |

## Follow-Up

- `@qa-agent`: replace spike-local counters with real renderer lifecycle,
  snapshot, query, and nonblank visual evidence before any beta or stable claim.
- `@quality-guardian`: keep SRC-006 blocked until SRC-001 through SRC-005 are
  accepted and coordinator records an explicit promotion decision.
