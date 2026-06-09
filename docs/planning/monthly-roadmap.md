---
agent: orchestrator
period: current
generated_at: 2026-06-10T01:20:00+08:00
repo_revision: "4405f09d195a9a968075cdeea2a82d9eef692d4a"
inputs:
  - docs/planning/active-execution-queue-2026-06-09.md
  - docs/research/capability-scorecard.md
  - docs/research/competitor-updates-2026-W24.md
  - docs/archive/2026-06-10/planning/monthly-roadmap.md
owner: "@orchestrator"
decision_level: info
---

# Monthly Roadmap

This active roadmap is intentionally short. The former long-form roadmap was
archived to
[archive/2026-06-10/planning/monthly-roadmap.md](../archive/2026-06-10/planning/monthly-roadmap.md).

## Current Priorities

| Priority | Decision | Evidence |
| --- | --- | --- |
| SDK+CLI first | Remains the launch surface | [active queue](./active-execution-queue-2026-06-09.md) |
| AI Map Workbench | Keep as local/example plus promotion intake; no product/hosted movement without future Go | [promotion scope](./feature-specs/ai-map-workbench-promotion-scope.md) |
| Source runtime | Keep bounded PMTiles evidence and do not promote parser/query/runtime claims without a dedicated issue | [capability scorecard](../research/capability-scorecard.md) |
| SceneView3D | Keep adapter-local; stable runtime remains blocked | [stable renderer contract](./feature-specs/sceneview3d-stable-renderer-contract.md) |
| External signals | W25 refresh does not change priorities | [competitor update](../research/competitor-updates-2026-W24.md) |

## Maintenance

Monthly automation may overwrite this file. Keep active roadmap text focused on
current decisions; move dated strategy narratives to archive batches.
