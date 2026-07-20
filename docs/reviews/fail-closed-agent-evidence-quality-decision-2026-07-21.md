---
agent: quality
period: 2026-07-21
generated_at: 2026-07-20T16:34:43Z
repo_revision: "8621336f4eb2593eb04300971c2c1c2d6fe67e23"
inputs:
  - https://github.com/HYNCM/gis-engine/issues/30
  - docs/planning/next-step-plan.md
  - docs/reviews/builder-evidence-2026-07-21-task-30.md
  - scripts/planning-evidence.mjs
  - scripts/issues-snapshot.mjs
  - scripts/handoff-ledger.mjs
  - scripts/dashboard-generator.mjs
  - scripts/sla-checker.mjs
  - tests/framework/agent-framework.test.ts
  - tests/framework/issues-snapshot.test.ts
  - tests/framework/planning-evidence-workflow.test.ts
  - tests/framework/dashboard-generator.test.ts
owner: "@quality"
decision_level: blocking
evidence_kind: specialist
---

# Fail-closed Agent Evidence Quality Decision

## HOC-N3 Decision

**PASS for Task 4 / issue #30.** The bounded planning-evidence integrity slice
meets the repository's fail-closed and specialist-evidence contracts. This
decision excludes the concurrent MapLibre compatibility files and does not
change or approve Task 3.

| Gate | Decision | Evidence | Confidence |
| --- | --- | --- | --- |
| Authenticated issue state | Pass | Weekly and monthly workflows declare `issues: read`, pass `GH_TOKEN`, and invoke the bundled planning-evidence command before commit | high |
| Unavailable issue state | Pass, fail closed | Both snapshot and bundled CLI tests exit `2` and preserve existing artifacts byte-for-byte | high |
| HOC-N1 and HOC-N3 template rejection | Pass | Parameterized tests reject template upstream and downstream evidence for both required flows | high |
| Specialist freshness and SLA | Pass | Dashboard and SLA tests classify a recent template as non-fresh and critical | high |
| Fixture consistency | Pass | One fixture run carries the same evidence run id and issue counts through snapshot, ledger, and dashboard | high |

## Re-review Closure

The prior review findings are closed:

1. The deployed `planning-evidence.mjs` CLI now has a negative integration test
   that seeds all three planning artifacts, injects a failing `gh`, expects exit
   code `2`, verifies the fetch ran in the requested root, and confirms all
   artifact contents remain unchanged.
2. HOC template rejection is parameterized for both HOC-N1 and HOC-N3, including
   template upstream and template downstream cases. Neither path can become
   `consumed`.
3. Workflow regression tests now lock both `permissions: issues: read` and
   `GH_TOKEN: ${{ github.token }}` for weekly and monthly refreshes.
4. Builder evidence now records the expanded full framework result as six files
   and 26 tests. The independent Task 4-only run excludes MapLibre and passes 22
   tests across five files.

## Verification Evidence

The following checks passed in the current worktree based on the stated
repository revision:

| Check | Result |
| --- | --- |
| Task 4-only framework tests | PASS, 5 files / 22 tests |
| `pnpm test:docs` | PASS, 5 files / 34 tests |
| `node scripts/issues-snapshot.mjs --dry-run` | Expected fail-closed exit `2`; existing snapshot preserved |
| `node scripts/planning-evidence.mjs --dry-run` | Expected fail-closed exit `2`; all planning evidence preserved |
| Fixture-backed bundled dry-run | PASS, 1 open / 1 closed / 2 total; HOC-N1 and HOC-N3 consumed |
| Weekly/monthly workflow YAML parse | PASS |
| `git diff --check` | PASS |

The committed planning snapshot, handoff ledger, and dashboard retained their
pre-review SHA-256 values. No planning ledger was regenerated or edited during
this review.

## Constraints

| Constraint | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Template output is never specialist evidence | `classifyReportEvidence`, HOC tests, dashboard/SLA tests | Prevents green automation from masking stale product or quality decisions | Keep template markers dominant over contradictory front matter | high |
| Issue refresh must remain authenticated and fail closed | Workflow permissions/token tests and bundled CLI preservation test | Prevents unavailable GitHub state from replacing valid planning evidence | Preserve exit `2` and no-write behavior whenever issue state is unavailable | high |
| Snapshot, ledger, and dashboard remain one evidence run | Fixture workflow test and shared `evidence_run_id` | Prevents planning surfaces from disagreeing about issue or handoff state | Continue generating the three artifacts through `planning-evidence.mjs` | high |

## Limits

- Local GitHub authentication is unavailable; both live dry-runs returned HTTP
  401 as expected. Hosted authentication is verified through explicit workflow
  permissions/token plumbing and deterministic fixture coverage, not a live
  successful issue fetch in this review.
- Remote CI has not run on the uncommitted Task 4 diff.
- Concurrent MapLibre files and gates are outside this HOC-N3 decision.

This report is quality evidence only. `@orchestrator` remains the sole writer
for accepted planning-state updates.
