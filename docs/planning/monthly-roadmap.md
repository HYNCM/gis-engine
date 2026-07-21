---
agent: orchestrator
period: 2026-07
generated_at: 2026-07-20T17:03:46Z
repo_revision: "282c4a3136fa93a761c49ef9e05c4aedccc3d9b7"
inputs:
  - docs/research/competitor-updates-2026-W29.md
  - docs/research/capability-scorecard.md
  - docs/reviews/quality-gate-planning-input-2026-07-13.md
  - docs/planning/next-step-plan.md
  - docs/planning/issues-snapshot.md
  - docs/reviews/pmtiles-capability-truth-quality-decision-2026-07-20.md
  - docs/reviews/maplibre-v5-v6-compatibility-quality-decision-2026-07-21.md
  - docs/reviews/fail-closed-agent-evidence-quality-decision-2026-07-21.md
owner: "@orchestrator"
decision_level: advisory
evidence_kind: specialist
---

# Monthly Roadmap

## Current Product State

| Surface | Decision | Evidence |
| --- | --- | --- |
| SDK + CLI | Primary stable adoption surface; packages are at v1.5.0 | [CHANGELOG](../../CHANGELOG.md) |
| MCP | Canonical 14-tool MCP 2025-11-25 contract passes locally; merge pending | [next-stage plan](./next-step-plan.md) |
| PMTiles | Display/load-plan Go; runtime archive load/query remain fail-closed No-go | [quality decision](../reviews/pmtiles-capability-truth-quality-decision-2026-07-20.md) |
| MapLibre | Exact-version matrix passes; keep 5.24.0 and do not adopt 6.0.0-22 | [quality decision](../reviews/maplibre-v5-v6-compatibility-quality-decision-2026-07-21.md) |
| Workbench | Feature-flagged candidate route only; hosted GA remains No-go | [Workbench gate](./feature-specs/review-console-workbench-go-gate.md) |
| SceneView3D | Experimental adapter evidence only; stable `view.mode: "scene3d"` remains blocked | [stable renderer contract](./feature-specs/sceneview3d-stable-renderer-contract.md) |

## W29-W30 Stage

Milestone: [2026 W29-W30 Contract Convergence](https://github.com/HYNCM/gis-engine/milestone/1).

| Order | Issue | Target outcome | Gate |
| ---: | --- | --- | --- |
| P0 | [#27 MCP contract convergence](https://github.com/HYNCM/gis-engine/issues/27) | Implemented and quality-passed; issue open pending merge | local gates pass; remote PR gate pending |
| P1 | [#28 PMTiles capability truth](https://github.com/HYNCM/gis-engine/issues/28) | Implemented bounded Go/No-go decision and quality pass | local gates pass; remote PR gate pending |
| P1 | [#29 MapLibre compatibility](https://github.com/HYNCM/gis-engine/issues/29) | Both exact entries pass; keep/bump decision is keep 5.24.0 | local strict matrix passes; remote PR matrix pending |
| P2 | [#30 Agent evidence integrity](https://github.com/HYNCM/gis-engine/issues/30) | Fail-closed implementation and quality pass | local framework/docs gates pass; remote PR gate pending |

Tasks #28 and #29 may proceed in parallel only after #27 freezes the AI-facing
public contract. Reserve 20% of capacity for #30, consistent with the repository
infrastructure allocation rule.

## Deferred Directions

| Direction | Current score | Evidence | Impact | Action | Confidence |
| --- | ---: | --- | --- | --- | --- |
| Hosted Workbench launch gate | 6.10 | Candidate route exists, but auth, deployment, monitoring, and support evidence do not | High security and operational risk if promoted early | Keep hosted GA No-go; reassess after this milestone with a separate launch issue | high |
| Real SceneView3D renderer evidence | 5.75 | Adapter package has no renderer dependency or graphics context | High delivery and resource-policy risk for limited current AI-loop gain | Keep adapter-local; define a later browser slice with picking, snapshot, cleanup, and blocked-resource evidence | high |
| Additional cloud-native runtimes | below PMTiles gate | GeoParquet, FlatGeobuf, and GeoTIFF remain independently bounded | Mixing formats would hide capability-specific failure semantics | Do not combine them with #28; open separate promotion gates after PMTiles truth is settled | high |

## Stage Exit Requirements

- [ ] Close #27 before any new MCP tool or package-release claim.
- [x] Record independent, current quality decisions for #28 and #29; open
      issues are not promotion evidence.
- [x] Confirm the next weekly automation preserves specialist reports and
      canonical issue state without treating templates as decisions.
- [ ] Pass full path-aware gates on every code-bearing PR; keep visual/resource
      waivers limited to genuinely non-rendering changes.

## Risks

| Risk | Status | Mitigation |
| --- | --- | --- |
| Public tool contract drift | **contained; merge pending** | #27 freezes inventory and structured results before expansion. |
| PMTiles claims exceed evidence | **contained; runtime No-go** | #28 separates display, load, and query decisions. |
| MapLibre peer range exceeds proven compatibility | **contained; bump No-go** | #29 gates exact versions and keeps 5.24.0. |
| Green automation masks stale specialist evidence | **contained; merge pending** | #30 makes evidence preservation and HOC freshness fail closed. |
| Hosted/3D promotion pressure bypasses gates | **blocked by plan** | Keep these directions outside the milestone and preserve explicit No-go wording. |

## Maintenance

GitHub Issues are the canonical task state. Keep this file as a compact decision
snapshot and regenerate issue status before changing completion claims.
