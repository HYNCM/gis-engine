---
agent: task-distributor
period: 2026-05-30
generated_at: 2026-05-30T05:05:17Z
repo_revision: "40655ce798d4bbad5067a4ecafab915c45456392"
inputs:
  - docs/planning/feature-specs/cloud-native-source-readiness.md
  - docs/planning/feature-specs/spatial-analysis-readiness.md
  - docs/planning/feature-specs/cloud-native-source-promotion-candidates.md
  - docs/planning/feature-specs/spatial-analysis-promotion-criteria.md
  - docs/planning/sprint-2026-W22-ai-native-next-loop.md
owner: "@task-distributor"
decision_level: advisory
---

# AIN-003 / AIN-004 Promotion Criteria Handoff

`TASK-2026W22-AIN-003` and `TASK-2026W22-AIN-004` are now split into future
promotion gates. This is a planning and documentation handoff only: no source
runtime, parser, worker, geoprocessing operation, or MCP tool alias was added.

## Evidence

| Requirement | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| PMTiles and blocked cloud-native formats are separated into gates | `docs/planning/feature-specs/cloud-native-source-promotion-candidates.md` defines PMTiles archive metadata, PMTiles feature query, GeoParquet, FlatGeobuf, GeoTIFF, and GeoZarr follow-up tasks. | Future source work can start from schema/resource-policy/query/export evidence rather than direct runtime implementation. | Assign AIN-003A through AIN-003F only when owner capacity and fixture strategy are available. | high |
| Source promotion requires resource policy before IO | The source promotion spec names URL/range/worker/byte/timeout paths and policy tests for every candidate. | Generated apps cannot silently fetch, parse archives, or start workers. | Keep `delivery.confirmations` aligned with any future source state promotion. | high |
| Spatial-analysis promotion criteria are operation-specific | `docs/planning/feature-specs/spatial-analysis-promotion-criteria.md` defines point/bbox hardening plus buffer, intersection, overlay, routing, and aggregation gates. | AI can explain blocked operations and future tasks without implying geoprocessing support. | Implement AIN-004A before any richer operation; use schema/command/diagnostic gates for later operations. | high |
| MCP exposure stays frozen | Both specs require assessment through the existing tool list before any public tool name is proposed. | The documented MCP surface remains stable. | Do not add `spatial_query`, `generate_map_app`, or source-specific tool aliases without a separate approved contract. | high |

## Gate Output

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm check` | pass | Full deterministic gate passed after source/spatial promotion planning updates. |
| `git diff --check` | pass | No whitespace errors. |

## Residual Risk

- These are promotion criteria, not implementation evidence. They intentionally
  leave GeoParquet, FlatGeobuf, GeoTIFF, GeoZarr, buffer, overlay,
  intersection, routing, and aggregation blocked.
- PMTiles remains readiness-only for archive parsing and feature query until a
  parser/resource/query gate lands.
