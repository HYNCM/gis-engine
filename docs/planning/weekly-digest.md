---
agent: orchestrator
period: 2026-W40
generated_at: 2026-10-01T14:52:00Z
repo_revision: "2c69806"
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
  - https://github.com/HYNCM/gis-engine/actions/runs/36866555879
  - https://github.com/HYNCM/gis-engine/actions/runs/36873486290
  - https://github.com/HYNCM/gis-engine/actions/runs/36874558507
  - https://github.com/HYNCM/gis-engine/actions/runs/36877446387
  - https://github.com/HYNCM/gis-engine/actions/runs/36878170757
  - https://github.com/HYNCM/gis-engine/pull/123
  - https://github.com/HYNCM/gis-engine/pull/124
  - https://github.com/HYNCM/gis-engine/pull/125
  - https://github.com/HYNCM/gis-engine/pull/126
  - https://github.com/HYNCM/gis-engine/pull/112
  - https://github.com/HYNCM/gis-engine/pull/113
  - https://github.com/HYNCM/gis-engine/pull/47
owner: "@orchestrator"
decision_level: advisory
evidence_kind: specialist
---

# Weekly Digest — 2026-W40

## Headline: batch and framework hardening landed, release is blocked for a new reason

All six P1 and three P2 findings in `docs/reviews/project-review-2026-10-01.md`
were fixed test-first and committed to `main` (121061d..5883e71), and four
framework follow-ups (#123..#126) are merged on top. @quality holds
**conditional-pass** for merge
(`docs/reviews/quality-gate-2026-10-01.md`) and re-issued its **blocking**
HOC-N3 **block**
(`docs/reviews/quality-gate-release-2026-10-01.md`, 14:05Z). The reason changed:
the release chain now executes in CI on Ubuntu (`36866555879`, 5m22s, 5 visual
tests passed against the committed Linux baselines), so missing visual evidence
is no longer the blocker. What blocks release is that the version-bump PR which
would clear the pending `major` changeset fails `pnpm check` at its own head
(`36873486290`): the docs-consistency gate demands both the "Unreleased"
wording and the changeset file that `changesets/action` deletes in that commit.

## Framework hardening (2026-10-01 afternoon)

- **#125** `308ac3e`: `test:agent-framework` builds workspace entry points
  before collecting the framework suite, so a clean checkout no longer reports
  `Total: 0 tests in 0 files` behind a `Cannot find module .../dist/...` error.
- **#124** `c6c93ec`: the agent runner will not overwrite a report whose body
  classifies as specialist evidence. Proven twice in production — Agent Daily
  `36866485698` and Agent Monthly `36874558507` both logged
  `按单写者约定未覆盖` rather than clobbering filled analysis, and the Monthly
  run's handoff ledger recorded its HOC-N3 upstream release gate as
  `sha256 e320d977…`, byte-identical to the file on disk.
- **#123** `ef42ece`: job-level bot-actor guards on the four PR-facing
  workflows. **Its originally stated effect was wrong and is corrected here**:
  workflow approval is decided when a run is created, before any job or `if:`
  expression evaluates, so these guards cannot prevent `action_required`
  parking. Their real consequence is that an approved bot run reports green
  while skipping every job. Kept for the CI-cost protection that consequence
  buys, not as a parking fix; the guard stays honest only as long as nobody
  reads a skipped bot run as a gate pass.
- **#126** `82d3933`: `.github/workflows/release-verify.yml`, a manual
  `workflow_dispatch` entry point running the non-publishing release chain on
  `ubuntu-latest` at any ref (`permissions: contents: read`, no publish, no
  snapshot update). This is what made the PR #47 finding above reachable.
- Each of the four carries a guard test in `tests/framework/`:
  `agent-framework-build-precondition`, `agent-runner-report-preservation`,
  `pr-workflow-bot-guard`, and `release-verify-workflow`. The last one pins the
  workflow to manual triggers, read-only permissions, and the absence of any
  publish or snapshot-update path.

## Monthly evidence refresh (2026-10)

- `docs/planning/monthly-roadmap.md` is regenerated for 2026-10 with W40
  priorities: MapLibre v6 compatibility evidence first, MCP 2026-07-28 migration
  assessment second, then release-path visual evidence and cadence reliability.
  The 14:17Z Monthly cadence left it untouched by design — #124 treats it as
  specialist evidence and refuses to flatten it back to a template.
- The capability scorecard is explicitly **not current** (still W32, external
  evidence checked 2026-08-06). Refreshing it against checked sources is a
  November precondition, not a hidden input to these priorities.

## Remote CI state

- Push runs on `5883e71` are green across CI, Release, and Agent Daily Cadence
  (36840459838 / 36840459851 / 36840459902), as are the runs on the framework
  merges and on `dd96530` (CI `36874540129`, Release `36874540352`, Agent Daily
  `36874540357`).
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
- Before this cycle's triage, 42 incidents were open on purpose: 32 older Daily
  incidents, 8 Weekly (`#98`, `#106`, `#116`, `#90`, `#81`, `#73`, `#63`, `#55`),
  and 2 Monthly (`#83`, `#122`). The previous revision of this bullet said
  "33 older Daily", which miscounts by one —
  `gh issue list --label agent-escalation --state open` totalled 42 at that
  point, and today's framework merges filed nothing new. The latest Agent Weekly
  Cadence run (36372641006, 2026-09-28) and the previous Monthly run
  (36817352239) were both still `failure`, so those incidents had no green
  replacement run to close against. No issue is deleted.
- Re-dispatching Monthly (`36874558507` at `dd96530`) changed what the failure
  means. `scripts/sla-checker.mjs` now reports
  `✅ 所有 agent 均在 SLA 范围内` where Weekly on 2026-09-28 had logged four
  violations at ~1282h stale, so the staleness half of the health gate is
  cleared. The job still exits 1, now on `handoff-ledger.mjs --check`: HOC-N3 is
  `pending` with `note: "orchestrator report is older than quality report"`
  because the 14:05Z release-gate re-issue outranks the 12:20Z digest. That is
  the contract behaving as designed — re-issuing @quality evidence obligates an
  @orchestrator refresh, and #124 correctly stops automation from faking one.
  It also means cadence green is now gated on a human/agent planning update, not
  on a broken script.
- Monthly's `orchestrator-commit` step pushed `1059e9c` with only generated
  artifacts (`AGENT_HEALTH_DASHBOARD.md`, `handoff-ledger.json`,
  `issues-snapshot.md`); no specialist report was in the diff.

## Cadence health is green for the first time in this window

- Agent Weekly Cadence `36877446387` (2026-10-01, at `998d46f`) is
  completed/success — the first green Weekly since `30778954232` on 2026-08-03,
  ending a streak of eight consecutive failures (`31346702789` … `36372641006`).
  All eight failed at `Gate specialist evidence health`.
- Agent Monthly Cadence `36878170757` (at `eb84ed2`) is completed/success — the
  first green Monthly since `30681675206` on 2026-08-01, ending three
  consecutive failures (`33469125219`, `36817352239`, `36874558507`). It
  committed `2c69806`, generated artifacts only.
- Five escalation incidents were closed as **completed** against those green
  replacement runs: Weekly `#98`, `#106`, `#116` and Monthly `#83`, `#122`. Each
  closure comment cites the failing step and the stale-hour range measured from
  that run's own log (`634.8..636.6h`, `945.5..947.3h`, `1113.5..1115.2h`,
  `1281.7..1283.5h`, `1021.5..1356.8h`). Nothing was deleted.
- Backlog after that triage: **37 open** — 32 Daily and 5 Weekly (`#90`, `#81`,
  `#73`, `#63`, `#55`), 0 Monthly. The remaining Weekly and Daily incidents stay
  open on purpose: they were not individually re-diagnosed, and a green
  replacement run satisfies the letter of their exit requirement without proving
  their specific failure matched the fixed class.
- Operator pitfall worth recording: Weekly and Monthly share
  `concurrency: agent-artifact-writers-<ref>` with `cancel-in-progress: false`,
  which protects a *running* job but replaces a *queued* one. Dispatching both
  six seconds apart cancelled Monthly `36877440116` before its first job started.
  Dispatch one cadence, wait for it to finish, then dispatch the other.

## Queue and approvals

- PR #47 (`chore: version packages`, head `efe5b3d`) keeps landing its four PR
  runs in `action_required` because the head commit is authored by
  `github-actions[bot]`. Every push to `main` regenerates the bump, so the parked
  queue grows by four per push: **48 runs across 12 head SHAs** at the time of
  writing, up from 20 across 6 SHAs earlier today — and the cadence commits
  recorded in this digest are themselves part of that growth. Repository
  approval settings will not be relaxed, and #123 turned out not to park-proof
  the queue — see the correction above. The decision that matters is no longer
  "approve the runs": CI at that head fails `pnpm check`, so #47 cannot be merged
  as authored.
- PR #112 (studio-state-safety) and #113 (event-driven-agent-gates) remain open;
  per triage rule #113 closes as duplicate after its quiet window, never delete.
- `codex/evidence-record-a` merged into `main` and deleted locally; PR #67
  merged, its worktree preserved untouched.
- Workbench Alpha gate still waits on naming 5 target WebGIS engineers (user
  decision).

## Priorities for next week (priority formula applied, inputs from @product W40)

1. **P1 — Release-state documentation transition** (@builder, then @quality):
   the former P1, "give CI a non-publishing `release:verify` on Ubuntu", is
   closed by #126 and run `36866555879`. Its replacement is the blocker that
   finding exposed: move `docs/migration/geoparquet-versioned-metadata.md`,
   `docs/website/release-notes.md` and the engine API reference out of
   "Unreleased / changeset pending" into the released version, and teach
   `tests/docs/public-docs-consistency.test.ts` the released-state expectations
   instead of dropping the assertion. No release claim and no PR #47 merge
   before it, and the gate is not to be weakened to make the bump green.
2. **P1 — Bot-run lever decision** (human): an owner-scoped token for
   `changesets/action` so bump commits are human-authored, or an explicit
   acceptance that approving a bot run yields skipped jobs and no signal.
3. **P2 — MapLibre v6 compatibility evidence** (@builder adapter + @quality):
   upstream is v6.11.2 while the matrix pins v5.
4. **P2 — MCP 2026-07-28 migration assessment** (@builder ai): stateless routing,
   MRTR elicitation, 12-month deprecation window.
5. **P2 — Escalation backlog policy** (@orchestrator + human decision): Weekly
   and Monthly are now green and five incidents closed, so the mechanism is
   proven. The open question is the remaining 37 — 32 Daily and 5 Weekly — which
   were not individually re-diagnosed. Either write an explicit
   green-replacement close rule with an audit comment template and sweep them, or
   assign per-run diagnosis before closing. Either way: never delete.
6. **P3 — community.ts name-escaping follow-up** (advisory carry-over from
   P2-2).
