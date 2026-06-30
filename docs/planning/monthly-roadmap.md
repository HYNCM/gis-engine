---
agent: orchestrator
period: 2026-06
generated_at: 2026-06-30T14:00:00Z
repo_revision: "3890290"
inputs:
  - docs/planning/orchestrator-goals-2026-W25.md
  - docs/planning/next-step-plan.md
  - docs/reviews/first-run-acceptance-2026-06-10.md
  - docs/reviews/provider-smoke-2026-06-10.md
  - docs/reviews/generated-project-audit-regression-2026-06-10.md
  - docs/planning/feature-specs/pmtiles-runtime-query-promotion-boundary.md
  - docs/planning/feature-specs/studio-workbench-product-go-no-go.md
  - docs/planning/active-execution-queue-2026-06-09.md
  - docs/research/capability-scorecard.md
  - docs/research/competitor-updates-2026-W24.md
  - docs/archive/2026-06-10/planning/monthly-roadmap.md
  - .changeset/
owner: "@orchestrator"
decision_level: info
---

# Monthly Roadmap

This active roadmap is intentionally short. The former long-form roadmap was
archived to
[archive/2026-06-10/planning/monthly-roadmap.md](../archive/2026-06-10/planning/monthly-roadmap.md).

## Release Status

| Version | Status | Date | Notes |
| --- | --- | --- | --- |
| v1.0.0 | **Released** | 2026-06-10 | Initial stable release — SDK, CLI, engine, AI/MCP tools |
| v1.1.0 | **In progress** | 2026-06-30 | 19 changesets consumed; CLI productization enhancements |
| SceneView3D | Experimental | via `--tag next` | Not promoted to stable; adapter-local only |

### v1.1.0 Change Scope

| Area | Changes |
| --- | --- |
| **CLI app templates** | Delivery evidence, preflight artifact, review details, artifact manifest, MapSpec validation, map reload, artifact verification |
| **Engine** | PMTiles runtime load-plan preflight, source readiness report |
| **AI** | AI readiness context summary, generation evidence |
| **Scene3D** | Linked group passive version bump |

## Current Priorities

| Priority | Decision | Evidence |
| --- | --- | --- |
| SDK+CLI first | Remains the launch surface | [active queue](./active-execution-queue-2026-06-09.md) |
| W25 adoption evidence | #8-#13 queue closed with governance, SDK+CLI first-run, provider smoke, audit regression, and P2 No-go boundaries | [orchestrator goals](./orchestrator-goals-2026-W25.md) |
| First-run acceptance | Packed-package SDK+CLI first-run path is now a repeatable W25 smoke/report | [first-run acceptance](../reviews/first-run-acceptance-2026-06-10.md) |
| Provider compatibility | OpenAI-compatible provider adoption path has a local no-secret smoke gate | [provider smoke](../reviews/provider-smoke-2026-06-10.md) |
| Generated auditability | Generated project bundles stay reviewable, hash-verifiable, and prompt-safe | [audit regression](../reviews/generated-project-audit-regression-2026-06-10.md) |
| AI Map Workbench | Keep as local/example; no product/hosted movement without future Go | [Studio/Workbench No-go](./feature-specs/studio-workbench-product-go-no-go.md) |
| Core/extension matrix | Guardrail issue #22 keeps boundary wording, example evidence, and snapshot sync aligned | [issue #22](https://github.com/HYNCM/gis-engine/issues/22) |
| Source runtime | Keep bounded PMTiles evidence and do not promote parser/query/runtime claims without a dedicated issue | [PMTiles boundary](./feature-specs/pmtiles-runtime-query-promotion-boundary.md) |
| SceneView3D | Keep adapter-local; stable runtime remains blocked | [stable renderer contract](./feature-specs/sceneview3d-stable-renderer-contract.md) |
| External signals | W25 refresh does not change priorities | [competitor update](../research/competitor-updates-2026-W24.md) |

## July 2026 Focus

| Item | Scope | Owner |
| --- | --- | --- |
| Core-vs-extension matrix | Complete next-step-plan Tasks 2-4: matrix documentation, extension evidence collection, queue refresh | @builder |
| SceneView3D renderer evidence | Collect real renderer snapshot/query/visual evidence for future stable promotion | @builder (adapter + qa) |
| CLI test coverage | Expand beyond 2 test files for 4641-line CLI source; add integration and edge-case coverage | @builder (qa) |
| Multi-platform CI matrix | Add macOS + Node 20/22 to CI matrix for broader compatibility validation | @builder |

## Risks & Known Blockers

| Risk | Status | Impact |
| --- | --- | --- |
| SceneView3D stable runtime | **Blocked** — blocker code still prevents stable promotion | Cannot enable `view.mode: "scene3d"` without `--tag next` |
| PMTiles runtime query | **No-go** — no promotion without dedicated issue and evidence | Parser/query/runtime claims remain bounded |
| Studio/Workbench productization | **No-go** — no product/hosted movement | Remains local/example only |
| CLI test gap | **Advisory** — 4641 lines of source with only 2 test files | Regression risk for CLI enhancements |

## Maintenance

Monthly automation may overwrite this file. Keep active roadmap text focused on
current decisions; move dated strategy narratives to archive batches.
