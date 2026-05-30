---
agent: task-distributor
period: 2026-W23
generated_at: 2026-05-30T07:12:55Z
repo_revision: "b799f7a"
inputs:
  - docs/planning/feature-specs/spatial-query-evidence-hardening.md
  - docs/research/competitor-updates-2026-W22.md
  - docs/research/capability-scorecard.md
  - docs/planning/feature-specs/spatial-analysis-promotion-criteria.md
  - docs/planning/feature-specs/generated-app-delivery-ux.md
owner: "@task-distributor"
decision_level: advisory
---

# Sprint Handoff: Spatial Query Evidence Hardening

## Goal

Harden point/bbox spatial query evidence after the Generated App Review Console
batch. The sprint keeps spatial analysis in the evidence lane: no new MCP tool,
no geoprocessing execution, no hidden IO, and no stable SceneView3D promotion.

## Task DAG

```mermaid
flowchart LR
  A["TASK-2026W23-SQH-001 boundary spec"]
  A --> B["TASK-2026W23-SQH-002 query capability gate"]
  B --> C["TASK-2026W23-SQH-003 invalid/source diagnostics"]
  C --> D["TASK-2026W23-SQH-004 result caps and fixtures"]
  D --> E["TASK-2026W23-SQH-005 delivery mapping"]
  E --> F["TASK-2026W23-SQH-006 quality gate and closure"]
```

| id | title | priority | complexity | owner | status | depends on | acceptance | finish gates |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-2026W23-SQH-001 | Freeze spatial query hardening boundary | P0 | S | `@product-strategist`, `@task-distributor` | done | GIR batch closed | Boundary states point/bbox only, no MCP alias, no geoprocessing, no new source loader, and no stable SceneView3D promotion. | planning review; `pnpm test:docs`; `pnpm check`; `git diff --check` |
| TASK-2026W23-SQH-002 | Add explicit query capability gate | P0 | M | `@engine-agent`, `@ai-agent` | done | SQH-001 | Generation/query evidence names adapter query capability or an explicit waiver before ready state. | `pnpm build:schema`; `pnpm test:schema-sync`; `pnpm test:commands`; `pnpm test:ai`; `pnpm check`; `git diff --check` |
| TASK-2026W23-SQH-003 | Harden invalid point/bbox/source diagnostics | P1 | M | `@engine-agent`, `@qa-agent` | todo | SQH-002 | Non-finite point, reversed bbox, missing layer/source, hidden layer, URL GeoJSON, PMTiles/vector unsupported source, and empty result cases have stable codes and paths. | `pnpm test:commands`; `pnpm test:ai`; `pnpm check` |
| TASK-2026W23-SQH-004 | Add result caps and deterministic fixture evidence | P1 | M | `@qa-agent` | todo | SQH-003 | Query evidence records result cap, feature count, layer/source ids, and diagnostic counts without unbounded payloads. | `pnpm test:ai`; `pnpm test:commands`; perf smoke only if result-size logic changes |
| TASK-2026W23-SQH-005 | Map hardened query evidence into generated-app delivery | P1 | M | `@ai-agent`, `@docs-agent` | todo | SQH-004 | `generationEvidence.delivery` shows query ready/follow-up/blocked states without parsing prose or adding MCP aliases. | `pnpm test:ai`; `pnpm test:docs`; `pnpm check` |
| TASK-2026W23-SQH-006 | Run quality gate and serialized planning closure | P1 | S | `@quality-guardian`, `@coordinator` | todo | SQH-005 | Gate report confirms schema-first, command-only mutation, structured diagnostics, adapter boundary, resource policy, and frozen MCP tool names remain intact. | `pnpm build:schema`; `pnpm check`; visual gate waived only with non-rendering rationale |

## Owner Boundaries

- `engine-agent`: public schemas, command diagnostics, and query runtime
  contracts when behavior changes.
- `ai-agent`: generation evidence bundle and MCP-facing output schemas.
- `qa-agent`: deterministic query fixtures, invalid cases, result caps, and
  regression evidence.
- `docs-agent`: user-facing delivery/status wording.
- `quality-guardian`: final gate and visual waiver decision when the slice is
  non-rendering.

## Next Execution Task

`TASK-2026W23-SQH-003` should enter execution state next. It must keep the
hardening slice to invalid point/bbox/source diagnostics and avoid widening
into PMTiles/vector parsing, new MCP tools, or advanced geoprocessing.
