---
agent: quality-guardian
period: 2026-05-29
generated_at: 2026-05-29T05:06:25Z
repo_revision: "36249b5"
inputs:
  - packages/engine/src/spec/resource-policy.ts
  - packages/engine/src/spec/validate.ts
  - packages/scene3d/src/index.ts
  - tests/schema/resource-policy.test.ts
  - tests/resources/scene3d-loader-policy.test.ts
  - tests/snapshot/smoke/scene3d-release-visual-gate.test.ts
  - docs/engineering/ci-test-strategy.md
  - docs/reviews/sceneview3d-src-002-dependency-boundary-2026-05-29.md
  - docs/reviews/sceneview3d-src-004-qa-evidence-2026-05-27.md
  - command: pnpm test:resources
  - command: pnpm test:schema -- tests/schema/resource-policy.test.ts
  - command: pnpm test:release:scene3d
owner: "@quality-guardian"
decision_level: advisory
---

# SceneView3D SRC-005 Resource Policy and Release Gate Evidence

## Decision

`TASK-2026W23-SRC-005` can be treated as prerequisite evidence complete for the
current stable-renderer contract handoff. This accepts resource-policy and
release-gate alignment only; it does not approve beta/stable SceneView3D
runtime support. `TASK-2026W23-SRC-006` remains blocked.

## Evidence Items

### Scene resource URL policy alignment

- Evidence: `tests/schema/resource-policy.test.ts` covers
  `/extensions/scene3d/sources/*/url`, including blocked `file:` URLs and
  allowlisted remote SceneView3D hosts through `resourcePolicy.allowedHosts`.
- Impact: generated map applications cannot silently introduce unreviewed
  SceneView3D external assets; AI-generated scene browsing stays auditable.
- Action: require schema/resource-policy tests whenever SceneView3D URL, tile,
  example asset, or external host behavior changes.
- Confidence: high.

### Loader-level budget and failure diagnostics

- Evidence: `tests/resources/scene3d-loader-policy.test.ts` covers 3D Tiles
  JSON bytes, model bytes, texture count, texture bytes, workers, timeout,
  unsupported asset type, missing source, and external renderer asset allowlist
  behavior.
- Impact: release gates can distinguish size, timeout, missing source,
  unsupported asset, and URL policy failures through stable diagnostics instead
  of natural-language-only loader errors.
- Action: extend this coverage before adding new public SceneView3D resource
  kinds, loader resource classes, or worker policies.
- Confidence: high.

### Release-gate semantics

- Evidence: `docs/engineering/ci-test-strategy.md` defines
  `scene3d.release.visual` as the deterministic release-runner gate and
  documents that missing real renderer visual evidence in release mode requires
  a coordinator waiver and follow-up task. It also states that waiver cannot
  bypass pending-resource, blank-scene, layer/source, or query diagnostics.
- Impact: SRC evidence can close prerequisites while stable runtime promotion
  stays protected by quality-guardian and coordinator review.
- Action: run `pnpm test:release:scene3d` for SRC-004, SRC-005, SRC-006, and
  every beta/stable renderer evidence claim; require strict visual snapshot
  evidence before beta/stable claims unless a release waiver is recorded.
- Confidence: high.

### Dependency prerequisite link

- Evidence: `docs/reviews/sceneview3d-src-002-dependency-boundary-2026-05-29.md`
  closes the SRC-002 dependency-boundary prerequisite as adapter-local evidence,
  while `docs/reviews/sceneview3d-src-004-qa-evidence-2026-05-27.md` records
  snapshot/query semantics and release-capable evidence boundaries.
- Impact: SRC-005 can be accepted without weakening the SRC-006 stable runtime
  gate because both prerequisite surfaces still preserve explicit blocked
  stable runtime semantics.
- Action: keep SRC-006 blocked until quality-guardian accepts real renderer
  lifecycle, snapshot/query, resource, dependency, and strict visual evidence.
- Confidence: high.

## Verification Commands

- `pnpm test:resources`
- `pnpm test:schema -- tests/schema/resource-policy.test.ts`
- `pnpm test:release:scene3d`
- `pnpm check`

## Boundary

This is a prerequisite-evidence report, not a promotion decision. Stable
`view.mode: "scene3d"` remains blocked until a future quality-guardian gate and
coordinator decision explicitly accept SRC-006.
