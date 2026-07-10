---
agent: orchestrator
period: 2026-07
generated_at: 2026-07-10T16:23:47Z
repo_revision: "511a1c9"
inputs:
  - docs/planning/orchestrator-goals-2026-W25.md
  - docs/planning/next-step-plan.md
  - docs/planning/issues-snapshot.md
  - docs/reviews/first-run-acceptance-2026-07-06.md
  - docs/reviews/quality-gate-2026-07-06.md
  - docs/reviews/quality-gate-workbench-product-route-2026-07-10.md
  - docs/architecture/core-extension-boundary-matrix.json
  - docs/reviews/provider-smoke-2026-06-10.md
  - docs/reviews/generated-project-audit-regression-2026-06-10.md
  - docs/planning/feature-specs/pmtiles-runtime-query-promotion-boundary.md
  - docs/planning/feature-specs/studio-workbench-product-go-no-go.md
  - docs/planning/feature-specs/review-console-workbench-go-gate.md
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
| v1.1.0 | **Released** | 2026-06-30 | CLI productization enhancements |
| v1.4.0 | **Released** | 2026-07-02 | Expression engine, heatmap/symbol layers, new MCP tools |
| v1.5.0 | **Released** | 2026-07-06 | SDK maturity sprint: test coverage, CI matrix, perf budgets, docs, first-run acceptance |
| SceneView3D | Experimental | via `--tag next` | Not promoted to stable; adapter-local only |

### v1.5.0 Change Scope

| Area | Changes |
| --- | --- |
| **CLI tests** | +74 new tests (lint, community, generate, bin-dispatch); 215 total |
| **CI matrix** | Node 22+24, macOS lint job |
| **Performance** | Smoke budgets tightened, applyCommands batch benchmarks |
| **Docs** | Migration guide, boundary regression tests, example README standardization |
| **Visual snapshots** | +data-driven-styling scenario (4 total) |

## Current Priorities

| Priority | Decision | Evidence |
| --- | --- | --- |
| Open queue | No open GitHub Issues after #25 closure | [issues snapshot](./issues-snapshot.md) |
| SDK+CLI first | Remains the launch surface | [active queue](./active-execution-queue-2026-06-09.md) |
| W25 adoption evidence | #8-#13 queue closed with governance, SDK+CLI first-run, provider smoke, audit regression, and P2 No-go boundaries | [orchestrator goals](./orchestrator-goals-2026-W25.md) |
| First-run acceptance | Strict Node 22 / pnpm 11.9 release-env first-run path passed; Vite scaffold now carries MapLibre dependency and CSS import | [first-run acceptance](../reviews/first-run-acceptance-2026-07-06.md) |
| Provider compatibility | OpenAI-compatible provider adoption path has a local no-secret smoke gate | [provider smoke](../reviews/provider-smoke-2026-06-10.md) |
| Generated auditability | Generated project bundles stay reviewable, hash-verifiable, and prompt-safe | [audit regression](../reviews/generated-project-audit-regression-2026-06-10.md) |
| AI Map Workbench | #25 advanced the feature-flagged product-route candidate; hosted GA remains blocked | [Workbench Go gate](./feature-specs/review-console-workbench-go-gate.md) |
| Core/extension matrix | Guardrail issue #22 is closed; architecture/spec matrices render from one structured source and docs tests enforce sync | [matrix source](../architecture/core-extension-boundary-matrix.json) |
| Source runtime | Keep bounded PMTiles evidence and do not promote parser/query/runtime claims without a dedicated issue | [PMTiles boundary](./feature-specs/pmtiles-runtime-query-promotion-boundary.md) |
| SceneView3D | Keep adapter-local; stable runtime remains blocked | [stable renderer contract](./feature-specs/sceneview3d-stable-renderer-contract.md) |
| External signals | W24 refresh is stale for current claims; refresh @product before using competitor/standards signals to reprioritize | [competitor update](../research/competitor-updates-2026-W24.md) |

## August 2026 Focus (v1.6)

| Item | Scope | Owner |
| --- | --- | --- |
| Review-console Workbench | Plan the separate hosted launch gate for auth, deployment, monitoring, and support policy | @orchestrator |
| SceneView3D evidence | Collect real renderer evidence for stable promotion decision | @builder |
| Cloud-native sources | FlatGeobuf/GeoParquet runtime loading spike | @builder |
| Expression completeness | Close remaining Mapbox expression gaps | @builder |
| Developer experience | Interactive playground, API reference polish | @builder |

## Risks & Known Blockers

| Risk | Status | Impact |
| --- | --- | --- |
| SceneView3D stable runtime | **Blocked** — blocker code still prevents stable promotion | Cannot enable `view.mode: "scene3d"` without `--tag next` |
| PMTiles runtime query | **No-go** — no promotion without dedicated issue and evidence | Parser/query/runtime claims remain bounded |
| Studio/Workbench productization | **Candidate route Go** — #25 closed with green CI and @quality conditional Go | Hosted GA remains No-go until a separate launch issue approves auth, deployment, monitoring, and support |
| CLI test gap | **Resolved** — 215 tests across 8 files | All CLI modules covered |
| Product research freshness | **Overdue** — latest product report is W24 | Do not claim current competitor or standards status before refresh |

## Maintenance

Monthly automation may overwrite this file. Keep active roadmap text focused on
current decisions; move dated strategy narratives to archive batches.
