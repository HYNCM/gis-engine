---
agent: orchestrator
period: 2026-W40
generated_at: 2026-10-01T12:20:00Z
repo_revision: "5883e71"
inputs:
  - docs/research/competitor-updates-2026-W40.md
  - docs/planning/monthly-roadmap.md
  - docs/reviews/quality-gate-release-2026-10-01.md
  - docs/reviews/quality-gate-2026-10-01.md
  - docs/reviews/review-fixes-builder-evidence-2026-10-01.md
  - docs/reviews/documentation-audit-2026-10-01.md
  - docs/reviews/project-review-2026-10-01.md
  - docs/planning/issues-snapshot.md
  - https://github.com/HYNCM/gis-engine/actions/runs/36817352239
  - https://github.com/HYNCM/gis-engine/actions/runs/36834064620
  - https://github.com/HYNCM/gis-engine/actions/runs/36840459838
  - https://github.com/HYNCM/gis-engine/pull/112
  - https://github.com/HYNCM/gis-engine/pull/113
  - https://github.com/HYNCM/gis-engine/pull/47
owner: "@orchestrator"
decision_level: advisory
evidence_kind: specialist
---

# Weekly Digest — 2026-W40

## Headline: review batch landed, main is green, release is still blocked

All six P1 and three P2 findings in `docs/reviews/project-review-2026-10-01.md`
were fixed test-first and committed to `main` (121061d..5883e71). @quality holds
**conditional-pass** for merge
(`docs/reviews/quality-gate-2026-10-01.md`) and issued a **blocking** HOC-N3
**block** for release readiness
(`docs/reviews/quality-gate-release-2026-10-01.md`): the `release:verify` path
has never executed in CI, and `pnpm release:verify` cannot run off CI either
(`release-preflight` fails on `node: expected major 22; found 26.0.0`).

## Monthly evidence refresh (2026-10)

- `docs/planning/monthly-roadmap.md` is regenerated for 2026-10 with W40
  priorities: MapLibre v6 compatibility evidence first, MCP 2026-07-28 migration
  assessment second, then release-path visual evidence and cadence reliability.
- The capability scorecard is explicitly **not current** (still W32, external
  evidence checked 2026-08-06). Refreshing it against checked sources is a
  November precondition, not a hidden input to these priorities.

## Remote CI state

- Push runs on `5883e71` are green across CI, Release, and Agent Daily Cadence
  (36840459838 / 36840459851 / 36840459902).
- Two latent CI defects surfaced while landing the batch and are fixed: the
  agent gate budget was 120s against a `pnpm check` needing ~118s, so the daily
  quality gate was a coin flip (21609d8), and the workbench chat-race test
  submitted its second edit without waiting for the provider handler to enter
  (4b62370, from CI run 36837116518).
- Linux pixel baselines are generated, reviewed and committed (c32105e, from
  run 36834064620) with a completeness guard, so a missing foreign-platform
  frame can no longer pass silently.
- **#119 is resolved and closed**: `@gis-engine/cli` dropped to 44,737 B against
  the unchanged 65,536 B budget by disabling CLI source maps (18c7728); Bundle
  Size push run 36833975471 is green.

## Escalation backlog state

- 67 `agent-escalation` issues were open, not the 31 recorded in the previous
  revision of this digest: incidents are keyed by workflow plus failed run id in
  `scripts/recovery-incident.mjs`, so every failed run filed its own issue, and
  nothing closes them automatically.
- 25 Daily incidents in the #91..#121 window are now closed as **completed** —
  their own exit requirement (a successful replacement run) is met. They were
  closed as completed rather than duplicate because they are not duplicates of
  each other; they are repeat observations of causes that are now fixed.
- 42 remain open and stay open on purpose: 33 older Daily incidents, 8 Weekly,
  and 2 Monthly. The latest Agent Weekly Cadence run (36372641006, 2026-09-28)
  and the latest Monthly run (36817352239) are both still `failure`, so those
  incidents have no green replacement run to close against. No issue is deleted.

## Queue and approvals

- PR #47 (`chore: version packages`, head now `df3bfbd`) keeps landing its four
  PR runs in `action_required` because the head commit is authored by
  `github-actions[bot]`; each push to `main` regenerates it, so the pending queue
  grows by four per bump. Repository approval settings will not be relaxed; a
  bot-actor guard on the PR-triggered workflows is the proposed fix.
- PR #112 (studio-state-safety) and #113 (event-driven-agent-gates) remain open;
  per triage rule #113 closes as duplicate after its quiet window, never delete.
- `codex/evidence-record-a` merged into `main` and deleted locally; PR #67
  merged, its worktree preserved untouched.
- Workbench Alpha gate still waits on naming 5 target WebGIS engineers (user
  decision).

## Priorities for next week (priority formula applied, inputs from @product W40)

1. **P1 — Release-path visual evidence** (@orchestrator + @quality): give CI a
   non-publishing way to run `release:verify` on `ubuntu-latest`, then accept the
   evidence before any release claim or PR #47 merge.
2. **P2 — MapLibre v6 compatibility evidence** (@builder adapter + @quality):
   upstream is v6.11.2 while the matrix pins v5.
3. **P2 — MCP 2026-07-28 migration assessment** (@builder ai): stateless routing,
   MRTR elicitation, 12-month deprecation window.
4. **P2 — Cadence reliability** (@orchestrator): a green Weekly replacement run
   to close the Weekly incidents, plus escalation dedupe and a
   green-replacement close rule.
5. **P3 — community.ts name-escaping follow-up** (advisory carry-over from
   P2-2).
