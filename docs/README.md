# Documentation Map

This page defines which documents are current sources of truth, which are dated
evidence snapshots, and when old material should be archived instead of kept in
the active documentation tree.

## Current Sources of Truth

| Area | Documents | Keep Active While |
| --- | --- | --- |
| Project status | [../README.md](../README.md), [../CHANGELOG.md](../CHANGELOG.md) | They describe the current implementation and release state. |
| Agent operations | [../AGENTS.md](../AGENTS.md) | Multi-agent workflow or repo gates are still used. |
| Architecture | [architecture/core-framework.md](./architecture/core-framework.md), [architecture/core-capabilities.md](./architecture/core-capabilities.md) | They describe current runtime boundaries and capability staging. |
| Public contracts | [spec/contracts-and-interfaces.md](./spec/contracts-and-interfaces.md), [engineering/supported-feature-matrix.md](./engineering/supported-feature-matrix.md), [engineering/contract-freeze.md](./engineering/contract-freeze.md), [../packages/scene3d/README.md](../packages/scene3d/README.md), [../packages/scene3d-three-adapter/README.md](../packages/scene3d-three-adapter/README.md) | Public schemas, commands, adapters, MCP tools, or supported features can change. |
| Test and release gates | [engineering/ci-test-strategy.md](./engineering/ci-test-strategy.md), [engineering/maplibre-version-drift-audit.md](./engineering/maplibre-version-drift-audit.md), [engineering/v0.1-release-checklist.md](./engineering/v0.1-release-checklist.md), [planning/v0.2-gate-checklist.md](./planning/v0.2-gate-checklist.md) | CI/release evidence, dependency drift audits, and package readiness are still active. |
| SceneView3D promotion readiness | [planning/feature-specs/sceneview3d-promotion-readiness.md](./planning/feature-specs/sceneview3d-promotion-readiness.md), [reviews/sceneview3d-mcp-promotion-evidence-decision-2026-05-23.md](./reviews/sceneview3d-mcp-promotion-evidence-decision-2026-05-23.md), [reviews/sceneview3d-promotion-gate-2026-05-24.md](./reviews/sceneview3d-promotion-gate-2026-05-24.md) | W23 promotion-readiness package is Go; stable runtime claims remain blocked until the stable renderer contract gate. |
| SceneView3D stable renderer contract | [planning/feature-specs/sceneview3d-stable-renderer-contract.md](./planning/feature-specs/sceneview3d-stable-renderer-contract.md), [reviews/sceneview3d-stable-renderer-contract-qa-2026-05-24.md](./reviews/sceneview3d-stable-renderer-contract-qa-2026-05-24.md), [reviews/sceneview3d-stable-renderer-resource-policy-2026-05-24.md](./reviews/sceneview3d-stable-renderer-resource-policy-2026-05-24.md), [reviews/sceneview3d-src-evidence-decision-2026-05-25.md](./reviews/sceneview3d-src-evidence-decision-2026-05-25.md) | SRC-001 through SRC-006 drive the next stable renderer contract evidence; current SRC evidence is prerequisite-only and stable `view.mode: "scene3d"` remains blocked. |
| Active planning | [planning/monthly-roadmap.md](./planning/monthly-roadmap.md), [planning/weekly-digest.md](./planning/weekly-digest.md), [planning/technical-debt-report.md](./planning/technical-debt-report.md), [planning/resource-perf-gap-plan.md](./planning/resource-perf-gap-plan.md), [planning/sprint-2026-W23-ai-map-app-generation.md](./planning/sprint-2026-W23-ai-map-app-generation.md), [planning/sprint-2026-W23-generation-quality-hardening.md](./planning/sprint-2026-W23-generation-quality-hardening.md), [planning/sprint-2026-W25-sceneview3d-v1.md](./planning/sprint-2026-W25-sceneview3d-v1.md), [planning/sprint-2026-W22-scene3d-renderer-evidence.md](./planning/sprint-2026-W22-scene3d-renderer-evidence.md) | They drive current or next sprint work. |
| Feature specs | [planning/feature-specs/](./planning/feature-specs/) | The spec describes implemented behavior, a gated experimental boundary, or the next implementation target. |

## Dated Evidence Snapshots

These documents remain active because they provide release, audit, or research
evidence. They should not be edited to look timeless; update them only with
explicit follow-up status.

| Type | Documents |
| --- | --- |
| Reviews and gates | [reviews/daily-audit-2026-05-17.md](./reviews/daily-audit-2026-05-17.md), [reviews/quality-gate-2026-05-17.md](./reviews/quality-gate-2026-05-17.md), [reviews/v0.2-checkpoint-audit-2026-05-17.md](./reviews/v0.2-checkpoint-audit-2026-05-17.md), [reviews/documentation-audit-2026-05-18.md](./reviews/documentation-audit-2026-05-18.md), [reviews/documentation-audit-2026-05-22.md](./reviews/documentation-audit-2026-05-22.md), [reviews/daily-audit-2026-05-24.md](./reviews/daily-audit-2026-05-24.md), [reviews/quality-gate-2026-05-24.md](./reviews/quality-gate-2026-05-24.md), [reviews/automation-hardening-gate-2026-05-24.md](./reviews/automation-hardening-gate-2026-05-24.md), [reviews/documentation-audit-2026-05-25.md](./reviews/documentation-audit-2026-05-25.md), [reviews/sceneview3d-src-evidence-decision-2026-05-25.md](./reviews/sceneview3d-src-evidence-decision-2026-05-25.md) |
| AI generation evidence | [reviews/nla-002-generation-command-contract-2026-05-29.md](./reviews/nla-002-generation-command-contract-2026-05-29.md), [reviews/nla-003-mcp-orchestration-evidence-2026-05-29.md](./reviews/nla-003-mcp-orchestration-evidence-2026-05-29.md), [reviews/nla-004-generation-scenarios-2026-05-29.md](./reviews/nla-004-generation-scenarios-2026-05-29.md), [reviews/nla-005-scene-browsing-extension-boundary-2026-05-29.md](./reviews/nla-005-scene-browsing-extension-boundary-2026-05-29.md), [reviews/nla-006-prompt-evidence-scenarios-2026-05-29.md](./reviews/nla-006-prompt-evidence-scenarios-2026-05-29.md), [reviews/nla-007-docs-release-wording-2026-05-29.md](./reviews/nla-007-docs-release-wording-2026-05-29.md), [reviews/nla-008-serialized-planning-handoff-2026-05-29.md](./reviews/nla-008-serialized-planning-handoff-2026-05-29.md), [reviews/nlq-001-prompt-planner-boundary-2026-05-29.md](./reviews/nlq-001-prompt-planner-boundary-2026-05-29.md), [reviews/nlq-002-planner-provenance-evidence-2026-05-29.md](./reviews/nlq-002-planner-provenance-evidence-2026-05-29.md) |
| Market research | [research/competitor-updates-2026-W20.md](./research/competitor-updates-2026-W20.md), [research/capability-scorecard.md](./research/capability-scorecard.md), [research/sceneview3d-adapter-feasibility-2026-05-18.md](./research/sceneview3d-adapter-feasibility-2026-05-18.md) |
| Sprint snapshots | [planning/sprint-2026-W23-ai-map-app-generation.md](./planning/sprint-2026-W23-ai-map-app-generation.md), [planning/sprint-2026-W23-generation-quality-hardening.md](./planning/sprint-2026-W23-generation-quality-hardening.md), [planning/sprint-2026-W25-sceneview3d-v1.md](./planning/sprint-2026-W25-sceneview3d-v1.md), [planning/sprint-2026-W22-scene3d-renderer-evidence.md](./planning/sprint-2026-W22-scene3d-renderer-evidence.md), [planning/task-burndown.md](./planning/task-burndown.md), [planning/dependency-graph.md](./planning/dependency-graph.md) |
| SceneView3D v1 evidence | [planning/release-runner-scene3d-gate-2026-05-18.md](./planning/release-runner-scene3d-gate-2026-05-18.md), [planning/sceneview3d-alpha-gate-audit-2026-05-18.md](./planning/sceneview3d-alpha-gate-audit-2026-05-18.md) |
| Release evidence | [planning/v0.2-release-note-draft.md](./planning/v0.2-release-note-draft.md), [planning/package-release-review-2026-05-18.md](./planning/package-release-review-2026-05-18.md), [planning/release-runner-evidence-2026-05-18.md](./planning/release-runner-evidence-2026-05-18.md), [planning/perf-nightly-evidence-2026-05-18.md](./planning/perf-nightly-evidence-2026-05-18.md) |

## Archive Criteria

Archive a document when all of these are true:

- It describes an earlier repo stage that is no longer the current operating
  model.
- Its decisions have been absorbed by active contracts, release gates, feature
  specs, or README status.
- Keeping it in the active tree would make users wonder whether an old plan is
  still authoritative.

Do not archive documents that still contain an open release item, active
follow-up, or public contract not represented elsewhere.

## Current Archive

- [archive/2026-05-18/README.md](./archive/2026-05-18/README.md)
- [archive/2026-05-18/planning/sprint-2026-W21.md](./archive/2026-05-18/planning/sprint-2026-W21.md)
