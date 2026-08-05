---
agent: orchestrator
period: 2026-08
generated_at: 2026-08-05T17:28:00Z
repo_revision: "23472d8050cad0178c49f85f045f488bd5aaaf41"
evidence_run_id: planning-evidence-20260805T171819860Z
inputs:
  - docs/research/competitor-updates-2026-W32.md
  - docs/research/capability-scorecard.md
  - docs/planning/next-step-plan.md
  - docs/planning/issues-snapshot.md
  - docs/reviews/package-size-budget-quality-decision-2026-08-05.md
  - docs/reviews/geoparquet-version-boundary-quality-decision-2026-08-03.md
  - docs/reviews/maplibre-6.1-quality-decision-2026-08-03.md
  - docs/reviews/mcp-2026-07-28-quality-decision-2026-08-03.md
  - docs/reviews/documentation-audit-2026-08-06.md
  - https://github.com/HYNCM/gis-engine/milestone/2
owner: "@orchestrator"
decision_level: advisory
evidence_kind: specialist
---

# Monthly Roadmap

## Current Product State

| Surface | August decision | Evidence |
| --- | --- | --- |
| SDK + CLI | Stable v1.5.0 remains the published adoption line | [release notes](../website/release-notes.md) |
| MCP | Ordered 14-tool 2025-11-25 contract is the default; 2026-07-28 adoption is No-go | [quality decision](../reviews/mcp-2026-07-28-quality-decision-2026-08-03.md) |
| MapLibre | 5.24.0 and 6.1.0 compatibility passes; keep 5.24.0 as default | [quality decision](../reviews/maplibre-6.1-quality-decision-2026-08-03.md) |
| GeoParquet | Exact 1.1/2.0-RC metadata readiness passes with a breaking unreleased changeset | [quality decision](../reviews/geoparquet-version-boundary-quality-decision-2026-08-03.md) |
| PMTiles | URL display/load-plan Go; archive load and feature query remain No-go | [quality decision](../reviews/pmtiles-capability-truth-quality-decision-2026-07-20.md) |
| SceneView3D | Experimental adapter-local evidence only; stable mode remains blocked | [stable contract](./feature-specs/sceneview3d-stable-renderer-contract.md) |
| Workbench | Local reference/candidate route only; hosted GA remains No-go | [Workbench gate](./feature-specs/review-console-workbench-go-gate.md) |

## W32-W34 Milestone

Milestone: [2026 W32-W34 Compatibility and Evidence Integrity](https://github.com/HYNCM/gis-engine/milestone/2).

| Priority | Issue | Final result | Remote evidence |
| --- | --- | --- | --- |
| P0 | #41 release truth | PASS, CLOSED | PR #46 / main `23472d8` |
| P0 | #43 evidence/recovery integrity | PASS, CLOSED | recovery run 31028265187 |
| P1 | #38 MapLibre 6.1 matrix | PASS, CLOSED; keep baseline | PR #46 final-head matrix |
| P1 | #40 MCP 2026-07-28 matrix | PASS, CLOSED; keep baseline | PR #46 final-head contract gate |
| P2 | #39 package budgets | PASS, CLOSED | PR #46 bundle-size gate |
| P2 | #42 GeoParquet version boundary | PASS, CLOSED; runtime No-go | PR #46 schema/quality gates |

Milestone 2 is closed with zero open issues. Authenticated planning run
`planning-evidence-20260805T171819860Z` records 3 open follow-ups, 35 closed
issues, 2/2 required HOCs consumed, and 5/5 agents healthy.

## Next Queue

| Rank | Direction | State | Owner / gate |
| ---: | --- | --- | --- |
| 1 | #44 static inventory and dependency declarations | Open P1 follow-up | @builder / @quality |
| 2 | #45 report-retention unit | Open P2 follow-up | @orchestrator + @builder + @docs / @quality |
| 3 | #48 Release action runtime upgrade | Open P2 follow-up | @builder / @quality |
| advisory | MCP 2026-07-28 v2 discovery/transport intake | Do not open implementation until milestone 2 closes and scope is approved | @product -> @orchestrator |
| watch | GeoParquet 2.0 final contract delta | Trigger only when an official final tag exists | @product |
| gated | PMTiles runtime or MapLibre default adoption | Separate issues only; no implicit promotion | @orchestrator / @quality |

Reserve at least 20% of the next sprint for #44/#45/#48 and other verified
infrastructure debt. Do not let the higher-scored MCP research bypass current
release, security, schema, or evidence-integrity gates.

## August Exit Requirements

- [x] Merge final-head-green implementation PR for #38-#43.
- [x] Prove recovery incident deduplication on merged `main`, then reconcile
      historical duplicate issues #32-#35.
- [x] Close milestone 2 only when it has zero open issues.
- [x] Generate an authenticated post-merge issue snapshot, HOC ledger, and
      health dashboard from one evidence run.
- [x] Keep #44/#45/#48 open with explicit owners and no broad suppression or data
      deletion.

## Risks

| Risk | Status | Mitigation |
| --- | --- | --- |
| Stable upstream release is mistaken for default adoption | contained | Keep MapLibre 5.24.0 and MCP 2025-11-25 defaults explicit. |
| GeoParquet metadata docs are mistaken for published v1.5/runtime support | contained | Breaking changeset plus unreleased notices; runtime remains blocked. |
| Green branch evidence is mistaken for merged delivery | contained | PR #46 final-head CI, main workflows, recovery run, and Issue closure are recorded. |
| Release automation cannot open its version PR | contained | Repository Actions PR permission enabled with default token still read; Release rerun created PR #47 and skipped npm publish. |
| Release actions rely on deprecated Node 20 bundles | tracked in #48 | Upgrade action majors with release guardrails; do not combine with versioning or publication. |
| Static inventory debt is hidden by ignore rules | tracked in #44 | Classify findings and forbid broad suppression. |
| Retention cleanup deletes evidence under ambiguous policy | tracked in #45 | No deletion until the unit and boundary tests are approved. |
