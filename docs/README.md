# Documentation Map

This page defines which documents are current sources of truth, which are dated
evidence snapshots, and when old material should be archived.

> **Last cleanup**: 2026-05-30 — reduced from ~100+ to ~50 active files.
> See [archive/2026-05-30/](./archive/2026-05-30/) for the archived batch.

## Current Sources of Truth

| Area | Documents | Notes |
| --- | --- | --- |
| Project status | [../README.md](../README.md), [../CHANGELOG.md](../CHANGELOG.md) | Current implementation and release state. |
| Agent operations | [../AGENTS.md](../AGENTS.md) | Multi-agent workflow, repo gates, evolution ecosystem. |
| Architecture | [architecture/core-framework.md](./architecture/core-framework.md), [architecture/core-capabilities.md](./architecture/core-capabilities.md) | Runtime boundaries, capability staging, package structure. |
| Public contracts | [spec/contracts-and-interfaces.md](./spec/contracts-and-interfaces.md), [engineering/supported-feature-matrix.md](./engineering/supported-feature-matrix.md), [engineering/contract-freeze.md](./engineering/contract-freeze.md), [../packages/scene3d/README.md](../packages/scene3d/README.md), [../packages/scene3d-three-adapter/README.md](../packages/scene3d-three-adapter/README.md) | Schemas, commands, adapters, MCP tools. |
| Test and release gates | [engineering/ci-test-strategy.md](./engineering/ci-test-strategy.md), [engineering/release-wording-guardrails.md](./engineering/release-wording-guardrails.md), [engineering/maplibre-version-drift-audit.md](./engineering/maplibre-version-drift-audit.md), [planning/v0.2-release.md](./planning/v0.2-release.md) | CI strategy, release wording guardrails, dependency drift, release checklist & notes. |
| SceneView3D stable runtime decision | [planning/feature-specs/sceneview3d-stable-renderer-contract.md](./planning/feature-specs/sceneview3d-stable-renderer-contract.md), [reviews/sceneview3d-src-evidence-decision-2026-05-25.md](./reviews/sceneview3d-src-evidence-decision-2026-05-25.md), [reviews/sceneview3d-src-006-stable-runtime-gate-2026-05-29.md](./reviews/sceneview3d-src-006-stable-runtime-gate-2026-05-29.md), [planning/sceneview3d-src-006-stable-runtime-decision-2026-05-29.md](./planning/sceneview3d-src-006-stable-runtime-decision-2026-05-29.md) | SRC-006 No-go is final; stable `view.mode: "scene3d"` remains blocked. Intermediate SRC evidence is archived. |
| Active planning | [planning/monthly-roadmap.md](./planning/monthly-roadmap.md), [planning/weekly-digest.md](./planning/weekly-digest.md), [planning/technical-debt-report.md](./planning/technical-debt-report.md), [planning/resource-perf-gap-plan.md](./planning/resource-perf-gap-plan.md), [planning/task-burndown.md](./planning/task-burndown.md), [planning/dependency-graph.md](./planning/dependency-graph.md), [planning/evolution-framework.md](./planning/evolution-framework.md), [planning/evolution-ledger.md](./planning/evolution-ledger.md) | Living planning and tracking documents. |
| Current sprints | [planning/sprint-2026-W23-ai-map-app-generation.md](./planning/sprint-2026-W23-ai-map-app-generation.md), [planning/sprint-2026-W23-generation-quality-hardening.md](./planning/sprint-2026-W23-generation-quality-hardening.md), [planning/sprint-2026-W25-sceneview3d-v1.md](./planning/sprint-2026-W25-sceneview3d-v1.md) | Active or upcoming sprint work. |
| Feature specs | [planning/feature-specs/](./planning/feature-specs/) | 17 feature specifications for implemented or gated capabilities. |

## Dated Evidence Snapshots

These remain active because they provide current release, audit, or research
evidence. Do not edit them to look timeless.

### Reviews

**AI generation evidence (NLA stream, 2026-05-29)**:
[nla-002](./reviews/nla-002-generation-command-contract-2026-05-29.md),
[nla-003](./reviews/nla-003-mcp-orchestration-evidence-2026-05-29.md),
[nla-004](./reviews/nla-004-generation-scenarios-2026-05-29.md),
[nla-005](./reviews/nla-005-scene-browsing-extension-boundary-2026-05-29.md),
[nla-006](./reviews/nla-006-prompt-evidence-scenarios-2026-05-29.md),
[nla-007](./reviews/nla-007-docs-release-wording-2026-05-29.md),
[nla-008](./reviews/nla-008-serialized-planning-handoff-2026-05-29.md)

**Natural-language query evidence (NLQ stream, 2026-05-29)**:
[nlq-001](./reviews/nlq-001-prompt-planner-boundary-2026-05-29.md),
[nlq-002](./reviews/nlq-002-planner-provenance-evidence-2026-05-29.md),
[nlq-003](./reviews/nlq-003-spatial-query-evidence-2026-05-29.md),
[nlq-004](./reviews/nlq-004-export-manifest-evidence-2026-05-29.md),
[nlq-006](./reviews/nlq-006-scene-browsing-blocker-visibility-2026-05-29.md),
[nlq-007](./reviews/nlq-007-serialized-quality-hardening-planning-2026-05-29.md)

**AI delivery acceptance (AIN stream, 2026-05-30)**:
[ain-001-002](./reviews/ain-001-002-generated-app-delivery-acceptance-2026-05-30.md),
[ain-003-004](./reviews/ain-003-004-promotion-criteria-2026-05-30.md),
[ain-005](./reviews/ain-005-scene-browsing-delivery-copy-2026-05-30.md)

**Generated App Review Console (GIR stream, 2026-05-30)**:
[gir-004](./reviews/gir-004-spatial-analysis-review-section-mapping-2026-05-30.md),
[gir-005](./reviews/gir-005-prompt-to-delivery-qa-scenarios-2026-05-30.md),
[gir-006](./reviews/gir-006-public-wording-release-guardrails-2026-05-30.md)

**Other active reviews**:
[ai-orchestration-capability-summary-2026-05-27.md](./reviews/ai-orchestration-capability-summary-2026-05-27.md),
[sceneview3d-src-evidence-decision-2026-05-25.md](./reviews/sceneview3d-src-evidence-decision-2026-05-25.md),
[sceneview3d-src-006-stable-runtime-gate-2026-05-29.md](./reviews/sceneview3d-src-006-stable-runtime-gate-2026-05-29.md)

### Research

- [capability-scorecard.md](./research/capability-scorecard.md) — Updated weekly.
- [competitive-analysis-ai-native-2d-3d.md](./research/competitive-analysis-ai-native-2d-3d.md) — Merged with former mainstream-map-engines.md.
- [competitor-updates-2026-W22.md](./research/competitor-updates-2026-W22.md) — Most recent competitor update.

## Archive Criteria

Archive a document when all of these are true:

- It describes an earlier repo stage that is no longer the current operating model.
- Its decisions have been absorbed by active contracts, release gates, feature specs, or README status.
- Keeping it in the active tree would make users wonder whether an old plan is still authoritative.

Do not archive documents that still contain an open release item, active follow-up, or public contract not represented elsewhere.

## Archive Index

| Batch | Contents | Date |
| --- | --- | --- |
| [archive/2026-05-18/](./archive/2026-05-18/) | Early blueprint reviews, W21 sprint plan | 2026-05-18 |
| [archive/2026-05-30/](./archive/2026-05-30/) | Planning/release snapshots (14), old reviews (20), old research (3), v0.1 engineering (3) | 2026-05-30 |

## Maintenance

- Sprint snapshots should be archived 2 weeks after sprint completion.
- Weekly competitor updates: keep only the latest 2 weeks active.
- Daily audits and quality gates: keep only the latest in active tree.
- Run `pnpm check` after any documentation restructuring to verify link integrity.
