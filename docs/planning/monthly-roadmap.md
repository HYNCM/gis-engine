---
agent: orchestrator
period: current
generated_at: 2026-06-10T05:47:12Z
repo_revision: "0254a85"
inputs:
  - docs/planning/orchestrator-goals-2026-W25.md
  - docs/reviews/first-run-acceptance-2026-06-10.md
  - docs/reviews/provider-smoke-2026-06-10.md
  - docs/reviews/generated-project-audit-regression-2026-06-10.md
  - docs/planning/feature-specs/pmtiles-runtime-query-promotion-boundary.md
  - docs/planning/feature-specs/studio-workbench-product-go-no-go.md
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
| W25 adoption evidence | #8-#13 queue closed with governance, SDK+CLI first-run, provider smoke, audit regression, and P2 No-go boundaries | [orchestrator goals](./orchestrator-goals-2026-W25.md) |
| First-run acceptance | Packed-package SDK+CLI first-run path is now a repeatable W25 smoke/report | [first-run acceptance](../reviews/first-run-acceptance-2026-06-10.md) |
| Provider compatibility | OpenAI-compatible provider adoption path has a local no-secret smoke gate | [provider smoke](../reviews/provider-smoke-2026-06-10.md) |
| Generated auditability | Generated project bundles stay reviewable, hash-verifiable, and prompt-safe | [audit regression](../reviews/generated-project-audit-regression-2026-06-10.md) |
| AI Map Workbench | Keep as local/example; no product/hosted movement without future Go | [Studio/Workbench No-go](./feature-specs/studio-workbench-product-go-no-go.md) |
| Source runtime | Keep PMTiles evidence bounded and track the next GeoParquet source/runtime slice as a dedicated issue | [PMTiles boundary](./feature-specs/pmtiles-runtime-query-promotion-boundary.md) |
| SceneView3D | Keep adapter-local; stable runtime remains blocked | [stable renderer contract](./feature-specs/sceneview3d-stable-renderer-contract.md) |
| External signals | W25 refresh does not change priorities | [competitor update](../research/competitor-updates-2026-W24.md) |

## Maintenance

Monthly automation may overwrite this file. Keep active roadmap text focused on
current decisions; move dated strategy narratives to archive batches.
