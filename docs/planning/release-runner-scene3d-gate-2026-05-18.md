---
agent: quality-guardian
period: 2026-W27
generated_at: 2026-05-18T03:13:31Z
repo_revision: "84189fb"
inputs:
  - docs/planning/sprint-2026-W25-sceneview3d-v1.md
  - packages/scene3d/src/index.ts
  - tests/snapshot/smoke/scene3d-release-visual-gate.test.ts
decision_level: advisory
---

# SceneView3D Release Visual Gate

## Gate

`scene3d.release.visual` is the release-runner smoke gate for SceneView3D v1
preparation work. It does not claim stable 3D runtime support. Until a real
SceneView3D renderer adapter exists, the gate accepts only deterministic
extension evidence and an explicit coordinator waiver for missing renderer
visual evidence.

Run it directly with:

```bash
pnpm test:release:scene3d
```

It is also included in `pnpm test:snapshot:smoke`, so `pnpm check` exercises the
gate by default.

## Evidence Requirements

The gate calls `evaluateScene3DReleaseVisualGate` and records:

- `snapshotScene3DMock` strict evidence with all required scene sources marked
  loaded.
- `queryScene3DMock` deterministic pick evidence for pickable scene layers.
- Optional renderer visual evidence from a future release-capable 3D browser
  runner.
- Optional coordinator waiver with `id`, `reason`, `followUpTaskId`, and
  `approvedBy: "coordinator"`.

## Release Decision Rules

| Condition | Decision |
| --- | --- |
| strict mock snapshot or query evidence has errors | `failed` |
| release mode lacks renderer visual evidence and lacks coordinator waiver | `failed` |
| release mode lacks renderer visual evidence but has coordinator waiver | `waived` |
| release mode has passing renderer visual evidence | `passed` |
| local/PR mode with deterministic evidence and no strict renderer requirement | `passed` |

Waivers cannot bypass pending resources, blank-scene diagnostics,
layer/source diagnostics, or missing query evidence for pickable layers.

## Follow-Up

The waiver path is temporary. `TASK-2026W27-005` must record the v1 alpha gate
audit and either keep the coordinator waiver tied to the next renderer-adapter
task or replace it with a real renderer visual report.
