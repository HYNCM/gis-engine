---
agent: product
period: 2026-10
generated_at: 2026-10-01T12:05:00Z
repo_revision: "5883e71"
inputs:
  - docs/research/competitor-updates-2026-W40.md
  - docs/research/capability-scorecard.md
  - docs/reviews/project-review-2026-10-01.md
  - docs/reviews/quality-gate-2026-10-01.md
  - docs/reviews/review-fixes-builder-evidence-2026-10-01.md
  - docs/planning/weekly-digest.md
  - docs/planning/issues-snapshot.md
  - https://github.com/HYNCM/gis-engine/pull/47
  - https://github.com/HYNCM/gis-engine/issues/66
owner: "@product"
decision_level: advisory
evidence_kind: specialist
status: ready-for-planning
---

# Monthly Roadmap — 2026-10

External facts in this document were checked on **2026-10-01** and are limited
to the signals recorded in [competitor-updates-2026-W40.md](../research/competitor-updates-2026-W40.md).
Nothing here is a merge, release, or runtime-promotion approval.

> **Correction (2026-11-10):** The Release row, Priority 3, and the release-risk
> row below were corrected to the 2026-10-01 14:05Z gate state, superseding the
> 12:05Z observation this file was generated with. Ubuntu strict visual evidence
> exists (release-verify run `36866555879`, 5 visual tests passed against the
> committed Linux baselines); the release blocker is the version-bump PR
> docs-consistency deadlock. See [weekly-digest.md](weekly-digest.md) and
> [quality-gate-release-2026-10-01.md](../reviews/quality-gate-release-2026-10-01.md).

## Product State

Workbench remains the primary product narrative at `0.x`, built on
`@gis-engine/engine`, `@gis-engine/ai`, CLI, and the canonical MCP server.
Engine semver still does not imply Workbench maturity.

| Surface | October position | Evidence |
| --- | --- | --- |
| Rendering contract | 2D path hardened; adapter is validated against MapLibre `5.24.0` while upstream is `v6.11.2` | W40 signal 1, [compat matrix](../../scripts/maplibre-compat-matrix.mjs) |
| AI protocol | 14-tool MCP inventory intact on the pinned `2025-11-25`; `2026-07-28` starts a 12-month migration clock | W40 signal 2 |
| Quality bar | All nine findings of the 2026-10-01 review fixed test-first, conditional-pass for merge | [quality gate](../reviews/quality-gate-2026-10-01.md) |
| Release | Not release-capable: Ubuntu strict visual evidence exists (release-verify run `36866555879`); the blocker is the version-bump PR docs-consistency deadlock | [quality gate re-issue](../reviews/quality-gate-release-2026-10-01.md), [weekly digest](weekly-digest.md) |
| 3D | No promotion; stable `view.mode: "scene3d"` stays adapter-gated | AGENTS.md boundary, W40 signal 3 |
| Alpha | Not started — waiting on 5 named target WebGIS engineers (user decision) | issue [#66](https://github.com/HYNCM/gis-engine/issues/66) |

## Scorecard status

`docs/research/capability-scorecard.md` still reports W32 scores with external
evidence checked 2026-08-06. It is **not** current and must not be cited as a
baseline for October decisions. The W40 deltas (2D performance/ecosystem −1,
AI operability −1, developer experience +1, 3D readiness 0) are directional
signals only until the scorecard is refreshed against checked sources.

## Priority Queue

Using the AGENTS.md priority formula with the W40 inputs:

1. **MapLibre v6 compatibility evidence** — threat 8, debt 6, risk 3 → highest.
   Extend the exact-version compat matrix to the current v6 line before the next
   rendering contract change; the P1-4 camera sync fix is only proven against v5.
   Owner: @builder (adapter) + @quality.
2. **MCP 2026-07-28 migration assessment** — threat 7, contractual AI-operability
   exposure. Stateless routing, MRTR elicitation, deprecated transports and
   Dynamic Client Registration. The snake_case tool inventory and draft-07
   input/output schema discipline should survive unchanged. Owner: @builder (ai).
3. **Release-path visual evidence** — unblocks the first credible release claim.
   Ubuntu strict visual evidence now exists: the manual `release-verify`
   workflow (#126) ran the chain on `ubuntu-latest` (`36866555879`, 5 visual
   tests passed against the committed Linux baselines). The remaining blocker
   is the version-bump PR docs-consistency deadlock, not missing baselines.
   Owner: @orchestrator + @quality.
4. **Cadence reliability and queue hygiene** — 67 open `agent-escalation` issues,
   the latest Weekly run (`36372641006`) and latest Monthly run (`36817352239`)
   both failing, and PR #47 runs accumulating in `action_required`. This is
   infrastructure work inside the 20–30% reserve, not roadmap feature capacity.
5. **Alpha study start** — blocked solely on naming participants; no engineering
   dependency.

## Risks

| Risk | Status | Mitigation |
| --- | --- | --- |
| A superseded renderer major line becomes the de facto contract | open | Priority 1 before any rendering contract change |
| Automated green is mistaken for product success | contained | #66 stays open with user metrics unchecked |
| Pinned MCP revision read as protocol leadership | open | Priority 2 assessment; no adoption claim without it |
| Stale scorecard drives priorities implicitly | contained | Scorecard staleness declared above; refresh before the November roadmap |
| Release claims without Ubuntu visual evidence | contained | Ubuntu visual evidence exists (run `36866555879`); release blocked on the version-bump PR gate deadlock; PR #47 not merged |
| Cadence noise replaces signal in the issue tracker | open | Dedupe escalation incidents and add a green-replacement close rule |

## Handoff Required

To @orchestrator (HOC-N1): priorities 1–4 with the owners above; issue closures
for the escalation backlog and the PR #47 approvals are human decisions and are
deliberately not assumed here. To @quality: accept or reject the Priority 3
release-path evidence when it exists. Confidence: high for the W40 signals and
the quality-gate facts, medium for MCP migration pace.
