# Documentation Map

This page separates current operating docs from dated evidence so the active
tree stays readable.

> **Last cleanup**: 2026-06-06 — documentation audit: expired rolling reports,
> completed feature reviews, and superseded planning docs removed; completed
> sprint/spec docs archived; orphaned directories linked.

## Read This First

Use the docs in this order:

1. `README.md` for repo status and public package surface.
2. `AGENTS.md` for the current 5-agent operating model.
3. `docs/` contract and engineering docs for rules that must stay aligned with
   code.
4. `docs/planning/`, `docs/research/`, and `docs/reviews/` for dated planning
   and evidence snapshots.

## Current Sources Of Truth

| Area | Documents | Notes |
| --- | --- | --- |
| Repo status | [../README.md](../README.md), [../CHANGELOG.md](../CHANGELOG.md) | Current package/runtime status and release notes. |
| Operating model | [../AGENTS.md](../AGENTS.md), [planning/agent-handoff-contracts.md](./planning/agent-handoff-contracts.md), [planning/evolution-framework.md](./planning/evolution-framework.md), [planning/handoff-ledger.json](./planning/handoff-ledger.json) | Current multi-agent rules, handoff contracts, handoff consumption state, and evolution governance. |
| Architecture | [architecture/core-framework.md](./architecture/core-framework.md), [architecture/core-capabilities.md](./architecture/core-capabilities.md) | Runtime boundaries, capability staging, package layout. |
| Public contracts | [spec/contracts-and-interfaces.md](./spec/contracts-and-interfaces.md), [engineering/supported-feature-matrix.md](./engineering/supported-feature-matrix.md), [engineering/contract-freeze.md](./engineering/contract-freeze.md) | Schemas, commands, diagnostics, adapters, MCP surface. |
| Release and test policy | [engineering/ci-test-strategy.md](./engineering/ci-test-strategy.md), [engineering/release-wording-guardrails.md](./engineering/release-wording-guardrails.md), [engineering/maplibre-version-drift-audit.md](./engineering/maplibre-version-drift-audit.md), [engineering/documentation-artifact-policy.md](./engineering/documentation-artifact-policy.md) | Deterministic gates, wording guardrails, dependency-drift checklist, documentation artifact policy. |
| SceneView3D stable runtime decision | [planning/feature-specs/sceneview3d-stable-renderer-contract.md](./planning/feature-specs/sceneview3d-stable-renderer-contract.md), [reviews/sceneview3d-src-006-stable-runtime-gate-2026-05-29.md](./reviews/sceneview3d-src-006-stable-runtime-gate-2026-05-29.md) | Stable `view.mode: "scene3d"` remains blocked. Decision archived in [archive/2026-06-06/](./archive/2026-06-06/). |
| Public docs site | [website/index.md](./website/index.md), [website/guide/](./website/guide/), [website/api/](./website/api/) | Reader-facing guide/API material for the website build. |
| CLI reference | [cli/provider-config.md](./cli/provider-config.md), [cli/templates.md](./cli/templates.md) | CLI provider configuration and template authoring. |
| Migration guides | [migration/README.md](./migration/README.md), [migration/migrating-from-maplibre.md](./migration/migrating-from-maplibre.md), [migration/v0.2-to-v0.3.md](./migration/v0.2-to-v0.3.md) | Upgrade paths for SDK consumers. |
| Design documents | [design/phase-b-provider-http-layer.md](./design/phase-b-provider-http-layer.md), [design/phase-c-developer-experience.md](./design/phase-c-developer-experience.md) | Phase B/C design specs for provider HTTP layer and DX. |

## Dated But Active Evidence

These files are intentionally timestamped snapshots. Keep them factual instead
of rewriting them to sound timeless.

| Area | Entry point | Notes |
| --- | --- | --- |
| Reviews and gates | [reviews/REPORT_INDEX.md](./reviews/REPORT_INDEX.md) | Review streams, rolling audits, retention rules. |
| Planning snapshots | [planning/next-stage-goals-2026-06-06.md](./planning/next-stage-goals-2026-06-06.md), [planning/monthly-roadmap.md](./planning/monthly-roadmap.md), [planning/weekly-digest.md](./planning/weekly-digest.md), [planning/task-burndown.md](./planning/task-burndown.md), [planning/dependency-graph.md](./planning/dependency-graph.md) | GitHub Issues become the canonical task state when available; markdown files are generated or approved snapshots. |
| Sprint plans | [planning/](./planning/) | `sprint-*` and many `feature-specs/*` files are bounded planning artifacts. |
| Research | [research/capability-scorecard.md](./research/capability-scorecard.md), [research/competitor-updates-2026-W24.md](./research/competitor-updates-2026-W24.md) | W24 score movement is absorbed into the current scorecard; older research archived. |
| Automation health | [planning/AGENT_HEALTH_DASHBOARD.md](./planning/AGENT_HEALTH_DASHBOARD.md), [planning/handoff-ledger.json](./planning/handoff-ledger.json) | Generated dashboard for current report freshness and HOC-N1/N2/N3 consumption state. |

## Legacy Naming Note

The operating model changed on 2026-06-03 from 11 roles to 5 agents. Older
planning and review snapshots may still use legacy labels such as
`coordinator`, `competitive-intel`, `product-strategist`, `code-reviewer`,
`quality-guardian`, `task-distributor`, `engine-agent`, `ai-agent`,
`adapter-agent`, `qa-agent`, and `docs-agent`.

Use this mapping when reading dated evidence:

| Legacy label | Current reading |
| --- | --- |
| `coordinator` + `task-distributor` | `@orchestrator` |
| `competitive-intel` + `product-strategist` | `@product` |
| `code-reviewer` + `quality-guardian` | `@quality` |
| `engine-agent` + `ai-agent` + `adapter-agent` + `qa-agent` | `@builder` |
| `docs-agent` | `@docs` |

Important: some contract text and code-level fields still use legacy tokens
such as `coordinator` waiver language. Do not bulk-rename those without the
matching schema/code migration.

## Archive Rules

Archive a document when all of these are true:

- its decision has been absorbed by current contracts, gates, or README status;
- it no longer changes sprint or release behavior;
- leaving it in the active tree would create ambiguity about authority.

Delete rather than archive only for rolling machine-generated reports that are
covered by the retention window.

## Archive Index

| Batch | Contents | Date |
| --- | --- | --- |
| [archive/2026-05-18/](./archive/2026-05-18/) | Early blueprint reviews and W21 planning | 2026-05-18 |
| [archive/2026-05-30/](./archive/2026-05-30/) | Older planning/release snapshots, prior research, superseded reviews | 2026-05-30 |
| [archive/2026-06-02/](./archive/2026-06-02/) | Completed W22 planning, older competitor update, finished superpowers specs | 2026-06-02 |
| [archive/2026-06-06/](./archive/2026-06-06/) | W23 sprint plans, completed feature specs, v0.2 release docs, sceneview3d decision | 2026-06-06 |
| [archive/2026-06-07/](./archive/2026-06-07/) | Reference-driven simplification appendices absorbed into current sources | 2026-06-07 |

## Maintenance

- Keep root and `docs/` index pages short and authoritative.
- Prefer one entry-point page per area over long raw file dumps.
- Keep rolling `daily-audit-*`, `quality-gate-*`, and
  `documentation-audit-*` files to the latest 7 active days with
  `node scripts/report-retention.mjs --apply`.
- Run `pnpm test:docs`, `node scripts/doc-generator.mjs links`, and the
  relevant deterministic gates after doc restructuring.
