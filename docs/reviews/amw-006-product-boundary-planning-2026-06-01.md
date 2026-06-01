---
agent: coordinator
period: 2026-W23
generated_at: 2026-06-01T14:16:38Z
repo_revision: "7f59f3ef6711a15dba844ee5277c3f397ef3f264"
inputs:
  - docs/research/competitor-updates-2026-W23.md
  - docs/reviews/amw-004-promotion-gate-2026-05-31.md
  - docs/reviews/amw-005-provider-profiles-2026-05-31.md
  - docs/reviews/mld-004-go-no-go-2026-06-01.md
  - docs/planning/feature-specs/ai-map-workbench-product-boundary.md
  - docs/planning/sprint-2026-W23-ai-map-workbench-product-boundary.md
owner: "@coordinator @product-strategist @task-distributor"
decision_level: advisory
---

# AMW-006 Product Boundary Planning

## Decision

The next implementation batch is AI Map Workbench product-boundary hardening,
not MapLibre package movement and not workbench product promotion. This report
accepts `TASK-2026W23-AMW-006` as a planning-only boundary freeze and opens
`TASK-2026W23-AMW-007` as the next queued task.

The workbench remains under `examples/ai-map-workbench` until provider
credential/resource administration, durable audit, review actions, visual
evidence, and a quality-guardian/coordinator promotion gate are all complete.

## Evidence

| Check | Result | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Current external signal | accepted | `docs/research/competitor-updates-2026-W23.md` records 2026-06-01 npm package evidence and official source inputs. | Planning can proceed from current dated evidence rather than the W23 template. | Keep package movement separate from AMW product-boundary tasks. | high |
| AMW product hold | accepted | `docs/reviews/amw-004-promotion-gate-2026-05-31.md` holds product promotion pending app boundary, credential/resource review, durable audit, visual evidence, and review actions. | The next task must design the missing product boundary before moving files or hosting. | Start with provider credential/resource administration. | high |
| Provider profile safety | accepted | `docs/reviews/amw-005-provider-profiles-2026-05-31.md` accepts server-side provider profiles but keeps product promotion on hold. | Existing code can stay local/example-scoped while product requirements are planned. | Preserve server-only credential lookup and browser-safe metadata. | high |
| MapLibre movement | blocked | `docs/reviews/mld-004-go-no-go-2026-06-01.md` records package movement No-go. | AMW planning must not smuggle dependency upgrades into this batch. | Open a separate future package-movement task only with strict visual evidence. | high |
| Product-boundary DAG | accepted | `docs/planning/sprint-2026-W23-ai-map-workbench-product-boundary.md` creates AMW-006 through AMW-010 with disjoint evidence targets. | Execution owners have a bounded next path. | Queue `TASK-2026W23-AMW-007`. | high |

## Boundaries Preserved

- No hosted deployment or auth system.
- No durable database implementation.
- No arbitrary provider request templates.
- No raw prompt retention by default.
- No browser-side credentials, provider bodies, or direct map mutation.
- No new MCP tool names.
- No MapLibre package movement.
- No PMTiles archive parsing or vector tile decoding.
- No stable SceneView3D runtime promotion.

## Verification

Required for this planning-only slice:

- `pnpm test:docs`
- `pnpm check`
- `git diff --check`

This report satisfies `TASK-2026W23-AMW-006`. The next queued task is
`TASK-2026W23-AMW-007`.
