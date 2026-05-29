---
agent: engine-agent
period: 2026-05-29
generated_at: 2026-05-29T05:06:25Z
repo_revision: "36249b5"
inputs:
  - packages/scene3d-three-adapter/src/index.ts
  - packages/scene3d-three-adapter/README.md
  - packages/scene3d-three-adapter/package.json
  - packages/engine/package.json
  - packages/scene3d/package.json
  - packages/ai/package.json
  - tests/adapter/scene3d-three-adapter.test.ts
  - docs/reviews/sceneview3d-stable-renderer-adapter-contract-2026-05-25.md
  - command: pnpm --filter @gis-engine/scene3d-three-adapter build
  - command: pnpm test:adapter -- tests/adapter/scene3d-three-adapter.test.ts
owner: "@engine-agent"
decision_level: advisory
---

# SceneView3D SRC-002 Dependency Boundary Evidence

## Decision

`TASK-2026W23-SRC-002` can be treated as prerequisite evidence complete for the
current stable-renderer contract handoff. This is dependency-boundary evidence
only: it does not enable stable `view.mode: "scene3d"` and it does not approve
renderer runtime promotion.

## Evidence Items

### Adapter-local renderer dependency boundary

- Evidence: `packages/scene3d-three-adapter/src/index.ts` exposes
  `scene3dThreeAdapterBoundary.requiredRuntimePeerDependencies` as `three` and
  `3d-tiles-renderer`, while `auditScene3DThreeAdapterDependencyBoundary()`
  checks package manifests and source imports for renderer package leaks.
- Impact: architecture and AI safety stay protected because renderer libraries
  cannot silently move into `@gis-engine/engine`, `@gis-engine/scene3d`, or
  `@gis-engine/ai`.
- Action: keep future Three.js / 3DTilesRendererJS declarations adapter-owned;
  if a real renderer package adds them later, rerun the audit and record the
  package diff in a quality gate.
- Confidence: high.

### Manifest and source-import checks

- Evidence: `tests/adapter/scene3d-three-adapter.test.ts` reads live package
  manifests for `@gis-engine/engine`, `@gis-engine/scene3d`, `@gis-engine/ai`,
  and `@gis-engine/scene3d-three-adapter`, scans source imports under the core
  package roots, and expects a clean
  `Scene3DThreeAdapterDependencyBoundaryAudit`.
- Impact: the handoff is stronger than prose-only policy because package and
  import drift become deterministic test failures.
- Action: require this focused adapter suite whenever package metadata, core
  imports, adapter imports, worker dependencies, or renderer-package ownership
  changes.
- Confidence: high.

### Structured leak diagnostics

- Evidence: the same focused test suite injects manifest and import leaks for
  `three` and `3d-tiles-renderer` and expects
  `CAPABILITY.UNSUPPORTED` diagnostics at stable JSON-pointer paths such as
  `/dependencyBoundary/manifests/@gis-engine~1engine/dependencies/three` and
  `/dependencyBoundary/imports/@gis-engine~1engine/3d-tiles-renderer~1core`.
- Impact: code-reviewer and quality-guardian can block dependency leaks with
  machine-readable evidence instead of manual interpretation.
- Action: preserve path-stable diagnostics when extending the audit to real
  renderer dependencies, loaders, or workers.
- Confidence: high.

## Verification Commands

- `pnpm --filter @gis-engine/scene3d-three-adapter build`
- `pnpm test:adapter -- tests/adapter/scene3d-three-adapter.test.ts`

## Boundary

Stable `view.mode: "scene3d"` remains blocked under `TASK-2026W23-SRC-006`.
This report only closes the SRC-002 dependency-boundary prerequisite for the
current planning ledger.
