---
agent: orchestrator
period: 2026-07
generated_at: 2026-07-13T16:06:22Z
repo_revision: "bdd71e24a6cacc88cef578211943685a23890e38"
inputs:
  - docs/research/competitor-updates-2026-W29.md
  - docs/research/capability-scorecard.md
  - docs/reviews/quality-gate-planning-input-2026-07-13.md
  - docs/planning/next-step-plan.md
  - docs/planning/issues-snapshot.md
owner: "@orchestrator"
decision_level: advisory
---

# Monthly Roadmap

## Current Product State

| Surface | Decision | Evidence |
| --- | --- | --- |
| SDK + CLI | Primary stable adoption surface; packages are at v1.5.0 | [CHANGELOG](../../CHANGELOG.md) |
| MCP | Release prerequisite: public inventory and stable structured-result contract must converge | [W29 research](../research/competitor-updates-2026-W29.md) |
| PMTiles | Capability truth unresolved; loader export does not by itself approve runtime-query support | [PMTiles boundary](./feature-specs/pmtiles-runtime-query-promotion-boundary.md) |
| MapLibre | Keep 5.24 as the release baseline pending a v5-v6 compatibility matrix | [next-stage plan](./next-step-plan.md) |
| Workbench | Feature-flagged candidate route only; hosted GA remains No-go | [Workbench gate](./feature-specs/review-console-workbench-go-gate.md) |
| SceneView3D | Experimental adapter evidence only; stable `view.mode: "scene3d"` remains blocked | [stable renderer contract](./feature-specs/sceneview3d-stable-renderer-contract.md) |

## W29-W30 Stage

Milestone: [2026 W29-W30 Contract Convergence](https://github.com/HYNCM/gis-engine/milestone/1).

| Order | Issue | Target outcome | Gate |
| ---: | --- | --- | --- |
| P0 | [#27 MCP contract convergence](https://github.com/HYNCM/gis-engine/issues/27) | One public tool inventory and schema-conforming `structuredContent` with text compatibility | `pnpm build:schema`, `pnpm test:ai`, `pnpm check`, @quality pass |
| P1 | [#28 PMTiles capability truth](https://github.com/HYNCM/gis-engine/issues/28) | Explicit display/load/query Go or No-go backed by resource and negative fixtures | resource/runtime/adapter/AI gates, @quality decision |
| P1 | [#29 MapLibre compatibility](https://github.com/HYNCM/gis-engine/issues/29) | Executable v5-v6 matrix without an automatic dependency bump | adapter/browser/strict visual gates, @quality keep/bump decision |
| P2 | [#30 Agent evidence integrity](https://github.com/HYNCM/gis-engine/issues/30) | Authenticated issue snapshots and fail-closed specialist/HOC freshness | agent-framework and docs-link gates |

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
- [ ] Record independent, current quality decisions for #28 and #29; open
      issues are not promotion evidence.
- [ ] Confirm the next weekly automation preserves specialist reports and
      canonical issue state without treating templates as decisions.
- [ ] Pass full path-aware gates on every code-bearing PR; keep visual/resource
      waivers limited to genuinely non-rendering changes.

## Risks

| Risk | Status | Mitigation |
| --- | --- | --- |
| Public tool contract drift | **P0 open** | #27 freezes inventory and structured results before expansion. |
| PMTiles claims exceed evidence | **P1 open** | #28 separates display, load, and query decisions. |
| MapLibre peer range exceeds proven compatibility | **P1 open** | #29 creates an exact-version matrix before movement. |
| Green automation masks stale specialist evidence | **P2 open** | #30 makes evidence preservation and HOC freshness fail closed. |
| Hosted/3D promotion pressure bypasses gates | **blocked by plan** | Keep these directions outside the milestone and preserve explicit No-go wording. |

## Maintenance

GitHub Issues are the canonical task state. Keep this file as a compact decision
snapshot and regenerate issue status before changing completion claims.
