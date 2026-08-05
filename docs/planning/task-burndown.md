---
agent: orchestrator
period: 2026-W32
generated_at: 2026-08-05T16:20:00Z
repo_revision: "5800a6d034898a17a94eb46a621ac52943d5919d"
inputs:
  - docs/planning/issues-snapshot.md
  - docs/planning/next-step-plan.md
  - docs/research/competitor-updates-2026-W32.md
  - docs/reviews/package-size-budget-quality-decision-2026-08-05.md
  - docs/reviews/documentation-audit-2026-08-06.md
owner: "@orchestrator"
decision_level: info
evidence_kind: specialist
---

# Task Burndown

GitHub Issues are canonical task state. This snapshot records the pre-merge
branch decision and does not mark open issues as delivered.

## Milestone 2

| Priority | Issue | Branch state | Owner / gate | Remote state at planning time |
| --- | --- | --- | --- | --- |
| P0 | [#41 release truth](https://github.com/HYNCM/gis-engine/issues/41) | implemented + quality PASS | @docs + @builder / @quality | OPEN |
| P0 | [#43 evidence integrity](https://github.com/HYNCM/gis-engine/issues/43) | implemented + quality PASS; merged-main recovery proof pending | @builder QA / @quality | OPEN |
| P1 | [#38 MapLibre 6.1 compatibility](https://github.com/HYNCM/gis-engine/issues/38) | implemented + quality PASS; keep 5.24.0 | @builder adapter+QA / @quality | OPEN |
| P1 | [#40 MCP 2026-07-28 compatibility](https://github.com/HYNCM/gis-engine/issues/40) | implemented + quality PASS; keep 2025-11-25 | @builder AI / @quality | OPEN |
| P2 | [#39 package budget policy](https://github.com/HYNCM/gis-engine/issues/39) | implemented + quality PASS | @builder QA / @quality | OPEN |
| P2 | [#42 GeoParquet version boundary](https://github.com/HYNCM/gis-engine/issues/42) | implemented + quality PASS; runtime No-go | @builder engine / @quality | OPEN |

Milestone 2 closes only after the final implementation head lands on `main`,
all six issues close, and the merged recovery workflow proves #43 behavior.

## Follow-Up Queue

| Priority | Issue | State | Boundary |
| --- | --- | --- | --- |
| P1 | [#44 static inventory](https://github.com/HYNCM/gis-engine/issues/44) | OPEN | no broad ignore or evidence-free deletion |
| P2 | [#45 report retention](https://github.com/HYNCM/gis-engine/issues/45) | OPEN | no deletion until unit and tests are approved |

## Historical Recovery Incidents

Issues #32-#35 remain open until a manual merged-main recovery run proves that
the same failed run maps to one deterministic canonical issue. Their closure is
part of #43 post-merge reconciliation, not evidence that the code was already
delivered.
