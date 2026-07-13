---
agent: orchestrator
period: 2026-W29
generated_at: 2026-07-13T16:06:22Z
repo_revision: "bdd71e24a6cacc88cef578211943685a23890e38"
inputs:
  - docs/planning/issues-snapshot.md
  - docs/planning/next-step-plan.md
  - docs/research/competitor-updates-2026-W29.md
  - docs/reviews/quality-gate-planning-input-2026-07-13.md
owner: "@orchestrator"
decision_level: info
---

# Task Burndown

GitHub Issues are the canonical task state. This file is a compact pointer for
automation and does not duplicate hand-maintained completion percentages.

## Current Queue

| Priority | Issue | State at planning time | Owner / gate | Entry point |
| --- | --- | --- | --- | --- |
| P0 | #27 MCP stable-spec and public-tool contract | Open, first | @builder AI / @quality | [issue](https://github.com/HYNCM/gis-engine/issues/27) |
| P1 | #28 PMTiles runtime capability truth | Open, depends on #27 | @builder engine+QA / @quality | [issue](https://github.com/HYNCM/gis-engine/issues/28) |
| P1 | #29 MapLibre v5-v6 compatibility matrix | Open, depends on #27 | @builder adapter+QA / @quality | [issue](https://github.com/HYNCM/gis-engine/issues/29) |
| P2 | #30 Agent planning evidence integrity | Open, 20% infrastructure capacity | @builder QA / @quality | [issue](https://github.com/HYNCM/gis-engine/issues/30) |

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
