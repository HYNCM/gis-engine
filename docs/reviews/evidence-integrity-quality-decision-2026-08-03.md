---
agent: quality
period: 2026-08-03
generated_at: 2026-08-03T16:56:05Z
repo_revision: "64dca5a7"
inputs:
  - https://github.com/HYNCM/gis-engine/issues/43
  - scripts/handoff-ledger.mjs
  - scripts/sla-checker.mjs
  - scripts/recovery-incident.mjs
  - scripts/git-push-retry.mjs
  - .github/workflows/agent-daily.yml
  - .github/workflows/agent-weekly.yml
  - .github/workflows/agent-monthly.yml
  - .github/workflows/agent-failure-recovery.yml
  - tests/framework/agent-framework.test.ts
  - tests/framework/dashboard-generator.test.ts
  - tests/framework/recovery-incident.test.ts
  - tests/framework/git-push-retry.test.ts
owner: "@quality"
decision_level: blocking
gate_result: conditional-pass
evidence_kind: specialist
---

# Evidence Integrity Quality Decision

## HOC-N3 Decision

**PASS for the bounded issue #43 implementation contract; BLOCK current cadence
evidence-health claims until stale specialist artifacts are refreshed.** Machine
templates remain traceable in the ledger and dashboard, but SLA and required
handoffs select the latest specialist artifact as proof. The workflows now fail
before committing a green health claim when specialist evidence or a required
handoff is stale or missing.

| Area | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Specialist selection | Focused tests prove a newer template cannot satisfy SLA/HOC and cannot mask a fresh specialist report; template-only and stale paths return `EVIDENCE.TEMPLATE_NOT_SPECIALIST` or `EVIDENCE.SPECIALIST_STALE` with an action | Automated templates can no longer manufacture freshness or invalidate valid specialist work | Keep freshness consumers on the specialist selector and preserve template trace fields | high |
| Specialist timestamps | Missing, invalid, and future `generated_at` values return `EVIDENCE.GENERATED_AT_MISSING`, `EVIDENCE.GENERATED_AT_INVALID`, or `EVIDENCE.GENERATED_AT_FUTURE`; exactly five minutes of clock skew is accepted and one millisecond beyond it is rejected | Filesystem mtime and future-dated reports cannot manufacture specialist proof, while a small explicit clock difference remains operable | Keep the five-minute tolerance explicit and require valid report front matter for SLA/HOC proof | high |
| Specialist history | Mixed-history tests prove that a newest invalid or future specialist artifact blocks SLA/HOC proof and Dashboard green state even when an older fresh specialist exists; a newer template remains trace-only and does not mask older valid proof | Producers cannot recover a green claim by falling back past a bad authoritative specialist artifact | Validate the newest specialist candidate before accepting proof; never search older specialist history after candidate failure | high |
| Dashboard SLA health | A 36-hour-old quality report is `overdue` because quality's registry SLA is 24 hours; dashboard health and SLA compliance consume the same specialist diagnostic | The visual health summary cannot remain green after the configured SLA has breached | Derive health from `AGENT_REGISTRY.slaMaxHours`; do not reintroduce cadence-specific day constants | high |
| Cadence enforcement | Daily, weekly, and monthly writers share `agent-artifact-writers-${{ github.ref }}` and run SLA then HOC checks before commit | Stale/missing proof produces deterministic job failure instead of a committed green dashboard | @orchestrator refreshes specialist evidence; do not bypass the nonzero gate | high |
| Recovery incidents | Recovery tests cover deterministic markers, oldest canonical selection, open update/comment, closed reopen, and distinct run creation; an executable workflow-step regression proves every captured TSV row is attempted before accumulated reconciliation failures produce a nonzero exit | One failed run maps to one durable incident, and one reconciliation error cannot suppress later incident attempts | Deploy to `main`, retain #32 as the historical canonical recommendation, and defer #33-#35 closure until post-deploy verification | high |
| Recovery serialization | `.github/workflows/agent-failure-recovery.yml` uses the shared `agent-failure-recovery` concurrency group with `cancel-in-progress: false` | Scheduled and manually dispatched scans cannot race the list-then-create incident sequence for the same marker | Keep the group independent of trigger/ref and preserve non-cancelling queue semantics | high |
| Concurrent writers | Push tests cover first non-fast-forward then fetch/rebase/second-push success, bounded exhaustion, and `git rebase --abort` after conflicts; abort failure details are retained without replacing `GIT.REBASE_FAILED` | Concurrent main movement is reconciled safely, while conflicts leave no avoidable in-progress rebase state | Keep retry bound at three and fail closed on fetch/rebase/push errors | high |
| Workflow YAML | `pnpm knip` no longer reports YAML multiple-document or duplicate-map parser errors after the emergency heredoc and checkout structure fixes | Static analysis can now expose real repository inventory findings | Retain structurally indented heredocs and valid single-map checkout configuration | high |

## TDD Evidence

| Cycle | Result |
| --- | --- |
| Specialist selection RED | Expected FAIL: 6 focused failures; selector ignored the requested kind, SLA lacked stable codes, HOC selected the newer template, and dashboard masked the specialist |
| Specialist selection GREEN | PASS: 2 files / 21 tests |
| Recovery/push/workflow RED | Expected FAIL: 7 focused failures; both helper modules were absent and cadence workflow contracts were unmet |
| Recovery/push/workflow GREEN | PASS: 3 files / 26 tests |
| Reliability self-review RED | Expected FAIL: 3 focused failures for stale remote ref rebasing, hidden template trace, and fail-open GitHub query fallback |
| Reliability self-review GREEN | PASS: 3 files / 24 tests |
| Recovery reconciliation review RED | Expected FAIL: 2 focused failures; the first CLI failure stopped the TSV loop and recovery scans had no shared concurrency group |
| Recovery reconciliation review GREEN | PASS: 1 file / 22 tests; both TSV rows were attempted, the step exited nonzero after accumulation, and concurrency is non-cancelling |
| Timestamp/dashboard/push-abort RED | Expected FAIL: 3 files / 7 failures / 26 passes; specialist timestamps fell back to mtime or accepted the future, 36-hour quality evidence stayed green, and rebase failure did not abort |
| Timestamp/dashboard/push-abort GREEN | PASS: 3 files / 33 tests; explicit timestamp diagnostics, five-minute skew boundary, registry-derived health, and abort cleanup are covered |
| Authoritative specialist history RED | Expected FAIL: 2 files / 4 failures / 29 passes; newer invalid and future specialist artifacts both fell back to older fresh proof and left Dashboard green |
| Authoritative specialist history GREEN | PASS: 2 files / 33 tests; SLA, HOC, and Dashboard fail closed on the newest specialist candidate while the template exception remains green |

## Fail-Closed Evidence

| Check | Result |
| --- | --- |
| `node scripts/sla-checker.mjs --period 2026-08-03` | Expected exit 2: orchestrator, product, and docs specialist evidence exceeded their configured SLA; each result returned `EVIDENCE.SPECIALIST_STALE` semantics and a refresh action |
| `node scripts/handoff-ledger.mjs --check --dry-run` | Expected exit 1: required HOC-N1 upstream product evidence and HOC-N3 downstream orchestrator evidence were stale; JSON included `EVIDENCE.SPECIALIST_STALE` and owner actions |
| `pnpm test:agent-framework` | PASS: 8 files / 54 tests |
| `pnpm check` (restricted sandbox) | Expected environment failure after successful build and preceding suites: 23 Workbench tests could not bind `127.0.0.1` (`listen EPERM`) |
| `pnpm check` (outside restricted sandbox) | PASS: complete build, test matrix, smoke snapshots, and Studio suite |
| `git diff --check` | PASS |

## Bounded Knip Follow-up Recommendation

The YAML parser blocker is fixed. The remaining `pnpm knip` exit 1 is a
separate repository inventory task, not evidence-integrity implementation
scope.

| Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- |
| `pnpm knip` reached its real findings: 55 unused files, 2 unused dev dependencies, 2 unlisted dependencies, 9 unused exports, 9 unused exported types, 1 duplicate export, and 4 configuration hints | Broad suppression or opportunistic deletion here could hide real dependency errors or remove intentional examples/config entries | @quality opens a bounded follow-up to classify each category; prioritize the two unlisted MapLibre dependencies and duplicate export, and do not add broad ignore rules | high |

## Constraints

- This decision does not refresh specialist product, orchestrator, or docs
  artifacts and does not authorize a green cadence health claim.
- No GitHub issue was closed or edited.
- No MCP, MapLibre, GeoParquet, bundle policy, planning state, or promotion
  decision was changed.
