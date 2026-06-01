---
agent: task-distributor
period: 2026-W22
generated_at: 2026-05-30T19:16:41Z
repo_revision: "8609e5f"
inputs:
  - docs/planning/feature-specs/maplibre-source-drift-audit.md
  - docs/research/competitor-updates-2026-W22.md
  - docs/research/capability-scorecard.md
  - docs/engineering/maplibre-version-drift-audit.md
owner: "@task-distributor"
decision_level: advisory
---

# Sprint 2026-W22: MapLibre Source Drift Audit

## Dependency Graph

```mermaid
flowchart LR
  A["TASK-2026W22-MLD-001 boundary and DAG"]
  A --> B["TASK-2026W22-MLD-002 adapter/source compatibility"]
  B --> C["TASK-2026W22-MLD-003 resource and delivery evidence"]
  C --> D["TASK-2026W22-MLD-004 smoke/visual Go-No-go"]
```

## Task Batch

| id | title | priority | complexity | owner | status | depends on | acceptance | finish gates |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-2026W22-MLD-001 | Freeze MapLibre source drift audit boundary | P0 | S | `@product-strategist`, `@task-distributor` | done | SQH-006 | Audit is scoped to package/source drift and explicitly excludes package upgrades, MCP aliases, PMTiles archive parsing, vector decoding, and stable SceneView3D promotion. | planning review; `pnpm test:docs`; `pnpm check`; `git diff --check` |
| TASK-2026W22-MLD-002 | Audit adapter and source compatibility against drift signals | P0 | M | `@engine-agent`, `@qa-agent` | done | MLD-001 | `docs/reviews/mld-002-maplibre-drift-audit-2026-05-31.md` records adapter/source drift impact; SourceLoader is present as contract-only evidence; no package movement occurred. | `pnpm test:adapter`; `pnpm test:resources`; `pnpm test:snapshot:smoke`; `pnpm check` |
| TASK-2026W22-MLD-003 | Map resource policy and delivery evidence for source drift | P1 | M | `@engine-agent`, `@ai-agent`, `@docs-agent` | done | MLD-002 | `docs/reviews/mld-003-resource-delivery-evidence-2026-06-01.md` keeps PMTiles/vector delivery readiness bounded by resource policy, without archive parsing or hidden fetches. | `pnpm test:resources`; `pnpm test:ai`; `pnpm test:docs`; `pnpm check` |
| TASK-2026W22-MLD-004 | Publish MapLibre drift Go-No-go gate | P1 | S | `@quality-guardian`, `@coordinator` | done / no-go | MLD-003 | `docs/reviews/mld-004-go-no-go-2026-06-01.md` blocks package movement until refreshed official evidence and strict visual gates exist. | `pnpm build:schema`; `pnpm check`; visual gate or explicit non-rendering waiver |

## Owner Boundaries

- `engine-agent`: adapter, transformer, source schema, and resource-policy
  evidence.
- `qa-agent`: deterministic smoke, adapter, resource, and snapshot evidence.
- `ai-agent`: generated-app delivery/source readiness alignment only.
- `docs-agent`: human-facing audit report and checklist alignment.
- `quality-guardian`: final Go/No-go decision for future package movement.

## Current Handoff

No execution task remains in this MLD batch. Future MapLibre package movement
must be opened as a new task after official package/changelog evidence is
refreshed in that run, examples/runtime loading compatibility is scoped, and
strict visual evidence is available or explicitly waived as conditional.
