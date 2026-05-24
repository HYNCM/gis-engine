---
agent: adapter-agent
period: 2026-W23
generated_at: 2026-05-24T16:28:35Z
repo_revision: "0db4f54"
inputs:
  - packages/scene3d-three-adapter/src/index.ts
  - packages/scene3d-three-adapter/README.md
  - tests/adapter/scene3d-three-adapter.test.ts
  - docs/planning/feature-specs/sceneview3d-stable-renderer-contract.md
owner: "@adapter-agent"
decision_level: advisory
---

# SceneView3D Stable Renderer Adapter Contract Evidence

## Scope

This adapter-agent slice advances `TASK-2026W23-SRC-001` and
`TASK-2026W23-SRC-002` only inside the adapter-owned surface. It does not enable
stable `view.mode: "scene3d"` and does not add Three.js, CesiumJS, or
3DTilesRendererJS dependencies to core packages.

## Contract Delta

- Evidence: `packages/scene3d-three-adapter/src/index.ts` already exposes
  `getScene3DThreeAdapterStableRendererContract()` with load, render, resize,
  camera, snapshot, query, destroy, diagnostics, and resource cleanup
  obligations.
- Impact: future real renderer work has an adapter-local obligation list without
  widening core runtime support.
- Action: keep these obligations as the adapter-side handoff target for
  `TASK-2026W23-SRC-001`.
- Confidence: high.

## Dependency Boundary

- Evidence: `auditScene3DThreeAdapterDependencyBoundary()` now converts manifest
  and source-import evidence into `Scene3DThreeAdapterDependencyBoundaryAudit`
  with structured `CAPABILITY.UNSUPPORTED` diagnostics for dependency leaks.
- Impact: `TASK-2026W23-SRC-002` can be reviewed from an adapter-produced
  evidence object instead of prose-only package-boundary claims.
- Action: keep renderer packages limited to adapter-owned packages; during the
  spike, even `@gis-engine/scene3d-three-adapter` keeps `three` and
  `3d-tiles-renderer` undeclared until the real renderer package is promoted.
- Confidence: high.

## Blocked Stable Runtime Reason

- Evidence: the contract and audit both keep `stableViewMode: false` and
  `runtimeSupported: false`; stable runtime blocker diagnostics still cover
  `/view/mode`, `/capabilities/renderer`, and `/capabilities/dimensions`.
- Impact: adapter evidence can support planning and review, but cannot be used
  as a beta/stable SceneView3D runtime claim.
- Action: `TASK-2026W23-SRC-006` remains blocked until quality-guardian and
  coordinator accept real renderer lifecycle, snapshot, query, visual, resource
  policy, and dependency-boundary evidence.
- Confidence: high.

## Verification

- Evidence: `pnpm --filter @gis-engine/scene3d-three-adapter build` passed.
- Impact: the adapter package TypeScript API and declarations compile.
- Action: keep this as the minimum package gate for adapter contract changes.
- Confidence: high.

- Evidence: `pnpm -s vitest run tests/adapter/scene3d-three-adapter.test.ts`
  passed with 13 tests.
- Impact: focused adapter evidence covers the new dependency-boundary audit
  success and failure diagnostics.
- Action: keep this focused test green before accepting the adapter slice.
- Confidence: high.

- Evidence: `pnpm test:adapter -- tests/adapter/scene3d-three-adapter.test.ts`
  passed 7 adapter files and 43 tests under the current workspace script.
- Impact: the broader adapter suite did not regress while exercising the current
  script path.
- Action: if a single-file adapter script is required later, invoke Vitest
  directly with `pnpm -s vitest run tests/adapter/scene3d-three-adapter.test.ts`.
- Confidence: high.

## Next Steps

- `@code-reviewer`: confirm that the audit helper stays adapter-local and does
  not create a core dependency scanner contract.
- `@quality-guardian`: use the audit output as advisory SRC-002 evidence, not as
  stable runtime promotion evidence.
- `@qa-agent`: continue owning browser visual evidence and nonblank frame metrics
  before any beta/stable renderer claim.
