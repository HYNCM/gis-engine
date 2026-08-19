---
agent: orchestrator
period: 2026-08
generated_at: 2026-08-19T15:28:05Z
repo_revision: "5be1b147"
inputs:
  - docs/planning/issues-snapshot.md
  - docs/planning/weekly-digest.md
  - docs/reviews/workbench-v1-quality-decision-2026-08-19.md
  - https://github.com/HYNCM/gis-engine/milestone/3
  - https://github.com/HYNCM/gis-engine/issues/66
  - https://github.com/HYNCM/gis-engine/pull/67
  - https://github.com/HYNCM/gis-engine/pull/47
owner: "@orchestrator"
decision_level: advisory
evidence_kind: specialist
---

# Monthly Roadmap

## Product State

Workbench is now the primary product narrative and remains independently
versioned at `0.x`. `@gis-engine/engine`, `@gis-engine/ai`, CLI, and the
canonical MCP server are its shared foundation. Engine semver does not imply
Workbench maturity.

| Surface | August decision | Evidence |
| --- | --- | --- |
| Workbench | Draft implementation candidate; begin review and Alpha preparation | PR [#67](https://github.com/HYNCM/gis-engine/pull/67) |
| Milestone 3 | OPEN; implementation scope complete, product metrics open | Issue [#66](https://github.com/HYNCM/gis-engine/issues/66) |
| SDK/CLI/MCP | Compatibility preserved; 14-tool MCP inventory unchanged | [quality decision](../reviews/workbench-v1-quality-decision-2026-08-19.md) |
| PR #47 | Engine-only breaking GeoParquet metadata release | PR [#47](https://github.com/HYNCM/gis-engine/pull/47) |
| 3D | No promotion | independent SceneView3D gate remains authoritative |
| Hosted/cloud | No planning authorization | local v1 must pass first and user demand must be explicit |

## Milestone 3 Sequence

| Stage | State | Exit requirement |
| --- | --- | --- |
| Definition convergence | Complete | product definition, v1 spec, boundary matrix, regression tests |
| Implementation candidate | Complete, Draft review | final-head CI and human review |
| Alpha | Not started | 5 target engineers; >=80% within 30 minutes; all exports build; no leaks |
| Local v1 | Not started | 10 target users; >=80%; P90 <=30 minutes; install/upgrade/recovery evidence |
| Cloud/3D evaluation | Blocked | local v1 pass plus separate product and quality gates |

## Immediate Queue

1. Finalize PR #67 review evidence without merging while promotion blockers
   remain.
2. Triage the generated app's one high and one moderate npm advisory.
3. Prepare the Alpha study protocol and participant evidence template.
4. Preserve 20% to 30% capacity for CI, dependency, migration, and release
   reliability work discovered during validation.

## Risks

| Risk | Status | Mitigation |
| --- | --- | --- |
| Automated green is mistaken for product success | blocked | Keep #66 open and user metrics unchecked |
| Engine 2.0 is mistaken for Workbench maturity | contained | PR #47 and public docs carry explicit boundary text |
| Generated dependency advisories reach users | open | Record exact dependency chain and remediate or approve a bounded exception |
| Stale market evidence changes priorities implicitly | blocked | HOC-N1 remains stale; no external adoption decision in this run |
| Local branch evidence is mistaken for release evidence | contained | Require final-head CI, review, merge, and release artifact proof separately |
