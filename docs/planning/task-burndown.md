---
agent: orchestrator
period: 2026-W29
generated_at: 2026-07-20T17:03:46Z
repo_revision: "282c4a3136fa93a761c49ef9e05c4aedccc3d9b7"
inputs:
  - docs/planning/issues-snapshot.md
  - docs/planning/next-step-plan.md
  - docs/research/competitor-updates-2026-W29.md
  - docs/reviews/quality-gate-planning-input-2026-07-13.md
  - docs/reviews/maplibre-v5-v6-compatibility-quality-decision-2026-07-21.md
  - docs/reviews/fail-closed-agent-evidence-quality-decision-2026-07-21.md
owner: "@orchestrator"
decision_level: info
evidence_kind: specialist
---

# Task Burndown

GitHub Issues are the canonical task state. This file is a compact pointer for
automation and does not duplicate hand-maintained completion percentages.

## Current Queue

| Priority | Issue | State at planning time | Owner / gate | Entry point |
| --- | --- | --- | --- | --- |
| P0 | #27 MCP stable-spec and public-tool contract | Implemented + quality PASS; GitHub OPEN pending merge | @builder AI / @quality | [issue](https://github.com/HYNCM/gis-engine/issues/27) |
| P1 | #28 PMTiles runtime capability truth | Implemented + quality PASS; GitHub OPEN pending merge | @builder engine+QA / @quality | [issue](https://github.com/HYNCM/gis-engine/issues/28) |
| P1 | #29 MapLibre v5-v6 compatibility matrix | Implemented + quality PASS; keep 5.24.0; GitHub OPEN pending merge | @builder adapter+QA / @quality | [issue](https://github.com/HYNCM/gis-engine/issues/29) |
| P2 | #30 Agent planning evidence integrity | Implemented + quality PASS; GitHub OPEN pending merge | @builder QA / @quality | [issue](https://github.com/HYNCM/gis-engine/issues/30) |

All four issues belong to
[milestone 1](https://github.com/HYNCM/gis-engine/milestone/1). Use
[issues-snapshot.md](./issues-snapshot.md) for generated current state and
[next-step-plan.md](./next-step-plan.md) for acceptance and verification.

## Deferred

- Hosted Workbench GA: No-go pending a separate auth/deployment/monitoring/support gate.
- Stable SceneView3D: blocked pending a real renderer evidence issue.
- GeoParquet, FlatGeobuf, and GeoTIFF runtime work: separate future promotion gates.

## Maintenance

- Do not mark issues complete here; close them in GitHub after their quality gate.
- Regenerate the issue snapshot and planning health artifacts after issue changes.
- Preserve the historical burndown in
  [archive/2026-06-10/planning/task-burndown.md](../archive/2026-06-10/planning/task-burndown.md).
