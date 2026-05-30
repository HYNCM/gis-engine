---
agent: qa-agent
period: ad-hoc
generated_at: 2026-05-26T16:37:27Z
repo_revision: "661d6dcd95ee6d90d353062733581d00c67f82c4"
inputs:
  - tests/snapshot/smoke/scene3d-stable-renderer-contract.test.ts
  - tests/snapshot/smoke/scene3d-release-visual-gate.test.ts
  - tests/snapshot/scene3d-browser-runner.ts
  - tests/snapshot/visual/scene3d-three-adapter.spec.ts
  - packages/scene3d-three-adapter/src/index.ts
  - docs/reviews/sceneview3d-stable-renderer-contract-qa-2026-05-24.md
  - command: pnpm -s vitest run tests/snapshot/smoke/scene3d-stable-renderer-contract.test.ts
  - command: pnpm -s vitest run tests/snapshot/smoke/scene3d-release-visual-gate.test.ts -t "allows the extension-only release gate|blocks release mode|does not let a waiver bypass|passes release mode"
  - command: pnpm -s test:release:scene3d
  - command: pnpm -s test:snapshot:visual
owner: "@qa-agent"
decision_level: advisory
---

# SceneView3D SRC-004 QA Evidence

## Decision

This slice strengthens `TASK-2026W23-SRC-004` snapshot/query evidence semantics
only. It does not approve beta or stable SceneView3D runtime support, does not
update visual baselines, and does not modify planning state. Stable
`view.mode: "scene3d"` remains blocked.

## Evidence Matrix

| Surface | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Stable snapshot/query contract | `tests/snapshot/smoke/scene3d-stable-renderer-contract.test.ts` now checks the adapter stable-renderer contract still marks runtime blocked while naming snapshot/query required evidence and diagnostic paths. | Future renderer work cannot treat mock snapshot/query evidence as stable runtime approval. | Keep these assertions green whenever snapshot/query obligations change. | high |
| Browser runner report | `tests/snapshot/scene3d-browser-runner.ts` now emits `promotionMatrix.snapshotQueryEvidence` with fixture path, snapshot dimensions, pending sources, pick ids, layer ids, source ids, and diagnostic counts. | QA reports can point at machine-readable fixture and pick semantics instead of prose-only browser evidence. | Preserve this report shape for release-capable runner evidence. | high |
| Release visual gate semantics | `tests/snapshot/smoke/scene3d-release-visual-gate.test.ts` asserts release visual evidence remains `extension-only` with `stableViewMode: false` and `stablePromotionAllowed: false`. | A passing visual gate cannot silently become a stable runtime Go decision. | Require a separate `SRC-006` quality-guardian/coordinator decision before promotion. | high |
| Visual snapshot assertion | `tests/snapshot/visual/scene3d-three-adapter.spec.ts` checks the same snapshot/query evidence block when Playwright can launch. | Strict visual evidence will include nonblank frame metrics plus deterministic query identity. | Rerun this gate in a release-capable browser environment before beta/stable claims. | high |

## Verification

| Command | Result | Evidence |
| --- | --- | --- |
| `pnpm -s vitest run tests/snapshot/smoke/scene3d-stable-renderer-contract.test.ts` | pass | 1 file, 3 tests passed |
| `pnpm -s vitest run tests/snapshot/smoke/scene3d-release-visual-gate.test.ts -t "allows the extension-only release gate\|blocks release mode\|does not let a waiver bypass\|passes release mode"` | pass | deterministic release-gate subset passed, 4 tests passed and browser runner test skipped |
| `pnpm -s test:release:scene3d` | blocked by environment | 4 tests passed; browser runner test failed at `chromium.launch()` with `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.93887: Permission denied (1100)` |
| `pnpm -s test:snapshot:visual` | blocked by environment | 3 visual tests passed; `scene3d-three-adapter.spec.ts` failed at `chromium.launch()` with `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.94671: Permission denied (1100)` |

## Blockers

### Browser Runner Blocked By macOS Sandbox

- Evidence: both `pnpm -s test:release:scene3d` and
  `pnpm -s test:snapshot:visual` reached the SceneView3D browser runner and
  failed while launching Playwright Chromium with MachPort permission denial.
- Impact: this run cannot provide new release-capable nonblank browser evidence
  for SceneView3D, even though deterministic smoke semantics passed.
- Action: rerun the exact same gates in a release-capable or non-sandboxed
  environment before accepting browser visual evidence.
- Confidence: high.

### Stable Runtime Remains No-Go

- Evidence: the updated assertions and existing adapter contract keep
  `stableViewMode: false`, `runtimeSupported: false`, and
  `stablePromotionAllowed: false`.
- Impact: `SRC-004` evidence can support the handoff contract, but it is not a
  stable runtime promotion decision.
- Action: keep `TASK-2026W23-SRC-006` blocked until quality-guardian and
  coordinator accept real renderer lifecycle, snapshot, query, resource-policy,
  strict visual, and release evidence.
- Confidence: high.
