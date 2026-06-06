---
agent: coordinator
period: 2026-05-29
generated_at: 2026-05-29T05:47:40Z
repo_revision: "6f76b57"
inputs:
  - docs/reviews/sceneview3d-src-006-stable-runtime-gate-2026-05-29.md
  - docs/archive/2026-05-30/reviews/sceneview3d-src-002-dependency-boundary-2026-05-29.md
  - docs/archive/2026-05-30/reviews/sceneview3d-src-005-resource-release-gate-2026-05-29.md
  - docs/planning/task-burndown.md
  - docs/planning/dependency-graph.md
owner: "@coordinator"
decision_level: blocking
---

# SceneView3D SRC-006 Stable Runtime Decision

## Decision

No-go for stable `view.mode: "scene3d"` runtime promotion.

`TASK-2026W23-SRC-006` is closed as a decision task, not as a runtime
promotion. Stable SceneView3D remains blocked, and the current public product
surface stays `extensions.scene3d` plus AI-facing planning/evidence summaries.

## Rationale

### Current Gates Passed For No-go Evidence

- Evidence: `docs/reviews/sceneview3d-src-006-stable-runtime-gate-2026-05-29.md`
  records passing adapter, resource, release scene3d, visual snapshot,
  build:schema, and `pnpm check` evidence for the current decision package.
- Impact: the No-go decision is based on the current HEAD gate state, not only
  on older SRC-001 through SRC-005 reports.
- Action: preserve the result as a closed decision package and require a new
  task before reopening stable runtime promotion.
- Confidence: high.

### Close SRC-006 As No-go

- Evidence: `docs/reviews/sceneview3d-src-006-stable-runtime-gate-2026-05-29.md`
  records a quality-guardian No-go with prerequisite SRC-001 through SRC-005
  evidence accepted.
- Impact: the planned stable-renderer contract sequence now has a real decision
  artifact instead of an indefinite blocked placeholder.
- Action: update planning ledgers to `done / no-go` for SRC-006 while keeping
  stable runtime disabled.
- Confidence: high.

### Preserve The Product Boundary

- Evidence: release-gate tests continue to report extension-only runtime,
  `stableViewMode: false`, and `stablePromotionAllowed: false`.
- Impact: natural-language AI app generation can explain scene browsing as a
  bounded capability without overpromising stable 3D runtime rendering.
- Action: keep `get_context_summary` / `explain_spec` capability summaries
  aligned with extension-only scene browsing until a future Go decision exists.
- Confidence: high.

### Move The Backlog To Next Planning

- Evidence: SRC-001 through SRC-006 now have accepted evidence or an explicit
  No-go decision; no remaining active SRC handoff item should stay as `todo` or
  unresolved `blocked` in the planning ledger.
- Impact: the next iteration can move from evidence closure into competitor
  analysis, product design, and task planning for the natural-language map app
  generation goal.
- Action: start the next planning cycle around AI orchestration, spatial
  analysis operations, scene browsing blockers, and real renderer promotion
  prerequisites.
- Confidence: high.

## Next Planning Inputs

- Dated competitor evidence for AI-friendly map/app generation, 3D Tiles,
  WebGPU/WebGL renderer paths, PMTiles/vector source workflows, and MCP-style
  tool contracts.
- Product design for natural-language map generation across feature display,
  spatial analysis, and scene browsing.
- Task-distributor DAG with owners for AI orchestration, engine/spatial
  analysis contracts, adapter renderer blockers, QA evidence, and docs.
