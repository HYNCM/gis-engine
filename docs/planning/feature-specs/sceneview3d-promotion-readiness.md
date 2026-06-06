---
agent: product-strategist
period: 2026-W23
generated_at: 2026-05-23T13:05:10Z
repo_revision: "cef340d"
inputs:
  - docs/archive/2026-05-30/planning/sprint-2026-W23-scene3d-promotion-readiness.md
  - docs/planning/monthly-roadmap.md
  - ../../reviews/full-project-review-2026-06-05.md
  - docs/planning/task-burndown.md
  - docs/spec/contracts-and-interfaces.md
  - packages/scene3d-three-adapter/README.md
decision_level: advisory
---

# SceneView3D Promotion Readiness Rubric

## Decision

SceneView3D stable runtime promotion remains blocked until the W23 promotion
readiness package is complete. The package turns the existing W22 renderer
evidence into a decision-ready bundle for a future go/no-go review, without
changing `view.mode: "scene3d"` stability or moving renderer dependencies into
core packages.

## Required Evidence

| Signal | Required evidence | Owner | Acceptable source | Blocker if missing |
| --- | --- | --- | --- | --- |
| Promotion rubric | Explicit criteria, owners, blockers, and threshold for stable promotion review | `@product-strategist` | this document plus sprint plan | No shared decision rule |
| Browser matrix | Frame, console, and renderer diagnostics from the release-capable browser runner across the promotion matrix | `@qa-agent` | browser runner report, snapshot evidence, release gate evidence | Missing cross-run evidence or console diagnostics |
| Adapter summary | Consolidated load-plan, resource-report, runtime, snapshot, query, and release evidence from the adapter spike | `@adapter-agent` | adapter report, adapter tests, release evidence | Missing one of the adapter evidence components |
| Guardrails | Explicit stable-runtime blocker diagnostics and promotion boundary codes | `@engine-agent` | schema / diagnostics changes, resource-policy tests, contract tests | Stable promotion path can proceed without blockers |
| MCP decision | Explicit decision on whether promotion evidence summaries stay out of MCP context | `@ai-agent` | MCP contract report or test update | MCP exposes promotion summaries as stable runtime context |
| Docs alignment | Roadmap, debt, and release checklist updated to match the decision | `@docs-agent` | roadmap/debt/checklist docs | Public docs claim a stable promotion decision that was not made |
| Go/no-go gate | Final review verdict with explicit reasoning and follow-up owner | `@quality-guardian` | gate report | No decision or an unconditional promotion pass |

## Readiness States

### blocked

One or more required evidence rows are missing, stale, or contradictory.

### decision-ready

All required evidence exists, but the final gate has not yet issued a review
verdict.

### promotion-ready

The final gate passed, the decision is documented, and the result still keeps
stable `view.mode: "scene3d"` blocked until the next promotion step is
explicitly approved.

## Promotion Rules

- Missing any P0 or P1 evidence keeps the work blocked.
- The browser matrix must include the release-capable runner and the visual
  evidence it produced.
- The adapter summary must stay spike-local; it may summarize evidence, but it
  may not claim stable renderer support.
- Stable-runtime guardrails must define explicit blocker diagnostics; no silent
  fallback is acceptable.
- MCP may either keep promotion evidence summaries out of context or expose
  them behind an explicit contract, but not as stable runtime support.
- Docs must reflect the current decision verbatim and may not overstate
  readiness.

## Evidence Targets

- `docs/archive/2026-05-30/planning/sprint-2026-W23-scene3d-promotion-readiness.md`
- `tests/snapshot/smoke/scene3d-release-visual-gate.test.ts`
- `tests/snapshot/visual/scene3d-three-adapter.spec.ts`
- `tests/adapter/scene3d-three-adapter.test.ts`
- `tests/ai/mcp-integration.test.ts`
- `docs/planning/monthly-roadmap.md`
- `../../reviews/full-project-review-2026-06-05.md`
- `docs/planning/task-burndown.md`

## Non-Goals

- Do not enable stable `view.mode: "scene3d"`.
- Do not add renderer dependencies to `@gis-engine/engine`.
- Do not bypass resource policy, snapshot, or release visual gates.
- Do not treat a promotion decision as a product launch.
