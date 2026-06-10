---
agent: orchestrator
period: 2026-W25
generated_at: 2026-06-10T04:50:04Z
repo_revision: "5ecf3c14947ceb3fcfe204eb5e5e9c9e02c3fdc3"
inputs:
  - docs/planning/AGENT_HEALTH_DASHBOARD.md
  - docs/planning/handoff-ledger.json
  - docs/planning/issues-snapshot.md
  - docs/reviews/quality-gate-2026-06-10.md
  - docs/reviews/documentation-audit-2026-06-10.md
  - docs/reviews/first-run-acceptance-2026-06-10.md
  - docs/research/competitor-updates-2026-W24.md
  - command: gh issue create
owner: "@orchestrator"
decision_level: advisory
---

# W25 Orchestrator Goals

## Decision

W25 moves GIS Engine from release-hardening closure into adoption evidence.
The product surface remains SDK+CLI first. Studio and AI Map Workbench stay
reference/example surfaces unless a future product Go issue passes its gates.

Before new product work, restore governance evidence because the current health
dashboard reports stale quality/docs reports and a pending HOC-N3 handoff.

## Issue Queue

| Rank | Task ID | GitHub Issue | Priority | Owner | Exit Condition |
| --- | --- | --- | --- | --- | --- |
| 1 | `TASK-2026W25-GOV-001` | [#8](https://github.com/HYNCM/gis-engine/issues/8) | P1 | `@orchestrator`, `@quality`, `@docs` | Fresh quality/docs evidence, regenerated dashboard/ledger/snapshot, and HOC-N3 cleared or explicitly decided |
| 2 | `TASK-2026W25-ADOPT-001` | [#9](https://github.com/HYNCM/gis-engine/issues/9) | P1 | `@builder`, `@quality`, `@docs` | Fresh developer first-run path reaches a reviewable SDK+CLI generated map with preflight, manifest, and prompt-leak evidence |
| 3 | `TASK-2026W25-ADOPT-002` | [#10](https://github.com/HYNCM/gis-engine/issues/10) | P1 | `@builder`, `@quality` | OpenAI-compatible provider smoke covers success/failure normalization, timeout diagnostics, and secret/prompt safety without CI secrets |
| 4 | `TASK-2026W25-ADOPT-003` | [#11](https://github.com/HYNCM/gis-engine/issues/11) | P1 | `@builder`, `@quality`, `@docs` | Generated project audit artifacts remain hash-verifiable, schema-stable, and docs-aligned |
| 5 | `TASK-2026W25-DATA-001` | [#12](https://github.com/HYNCM/gis-engine/issues/12) | P2 | `@product`, `@quality` | PMTiles runtime query promotion boundary is specified without hidden IO, parser, worker, or feature-query overclaim |
| 6 | `TASK-2026W25-STUDIO-001` | [#13](https://github.com/HYNCM/gis-engine/issues/13) | P2 | `@product`, `@quality` | Studio/Workbench product Go/No-go checklist is current; hosted/product movement remains blocked without follow-up implementation evidence |

## Implementation Status

| Task ID | Status | Evidence | Next |
| --- | --- | --- | --- |
| `TASK-2026W25-GOV-001` | complete, issue closed | [quality gate](../reviews/quality-gate-2026-06-10.md), [docs audit](../reviews/documentation-audit-2026-06-10.md), [dashboard](./AGENT_HEALTH_DASHBOARD.md), [handoff ledger](./handoff-ledger.json) | Continue with #10 |
| `TASK-2026W25-ADOPT-001` | complete, issue closed | [first-run acceptance](../reviews/first-run-acceptance-2026-06-10.md), `pnpm smoke:first-run` | Continue with #10 |
| `TASK-2026W25-ADOPT-002` | next | [#10](https://github.com/HYNCM/gis-engine/issues/10) | Implement OpenAI-compatible provider smoke |
| `TASK-2026W25-ADOPT-003` | queued | [#11](https://github.com/HYNCM/gis-engine/issues/11) | Follow after provider smoke |
| `TASK-2026W25-DATA-001` | queued | [#12](https://github.com/HYNCM/gis-engine/issues/12) | P2 design only |
| `TASK-2026W25-STUDIO-001` | queued | [#13](https://github.com/HYNCM/gis-engine/issues/13) | P2 Go/No-go evidence only |

## Guardrails

- Keep SDK+CLI first for W25 execution.
- Do not add MCP tool names or aliases.
- Do not promote stable `view.mode: "scene3d"`.
- Do not claim PMTiles archive parsing, hidden range IO, workers, or runtime
  feature query until a dedicated promotion issue lands evidence.
- Keep Studio and AI Map Workbench out of the primary product promise unless a
  future Go issue passes ownership, auth/storage/export, resource-policy, MCP
  safety, rollback, and release-grade visual checks.

## Current Implementation Order

1. `TASK-2026W25-ADOPT-002`: add OpenAI-compatible provider smoke without
   requiring CI secrets.
2. `TASK-2026W25-ADOPT-003`: harden generated-project auditability regression.

## Validation Policy

For W25 planning-only edits, run `node scripts/issues-snapshot.mjs`,
`node scripts/doc-generator.mjs links`, `pnpm test:docs`, and `git diff --check`.
For implementation work, use the issue-specific gates plus `pnpm check` when
public contracts, examples, or release evidence are touched.
