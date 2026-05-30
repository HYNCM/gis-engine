---
agent: quality-guardian
period: 2026-05-30
generated_at: 2026-05-30T06:20:00Z
repo_revision: "unknown"
inputs:
  - AGENTS.md
  - .github/workflows/agent-weekly.yml
  - scripts/agent-runner.mjs
  - scripts/evolution-collector.mjs
  - docs/planning/evolution-framework.md
  - docs/planning/evolution-ledger.md
owner: "@quality-guardian"
decision_level: advisory
---

# Evolution Automation Gate

## Decision

Pass for the focused evolution-automation slice.

The evolution ledger remains a coordinator-owned planning artifact. Scheduled
automation may append weekly metric entries through `scripts/evolution-collector.mjs`,
but `scripts/agent-runner.mjs evolution-guardian` now writes an independent
review draft instead of overwriting `docs/planning/evolution-ledger.md`.

## Findings Closed

| Finding | Resolution | Evidence |
| --- | --- | --- |
| Ledger overwrite risk | `evolution-guardian` runner output moved to `docs/planning/evolution-review-{period}.md` with `agent: coordinator` front matter. | `node scripts/agent-runner.mjs evolution-guardian --period 2026-W22 --dry-run` |
| Placeholder weekly ledger entries | Weekly workflow now runs the collector as the ledger writer and uploads both ledger and collector output. | `.github/workflows/agent-weekly.yml` |
| Collector anomaly handling | Exit code `1` becomes a GitHub warning; other non-zero exits still fail the job. | workflow status branch on `${PIPESTATUS[0]}` |
| Unknown actual hours | D1 reports `N/A` until actual hours exist instead of defaulting actual to estimated. | `node scripts/evolution-collector.mjs --week 2026-W22 --dry-run` |
| Quality trend overcounting | D3 parses explicit `Gate/Command` result tables instead of whole-document keyword matches. | collector dry-run reports table-derived pass/fail counts |
| Weekly front matter gaps | Generated weekly report templates now include `inputs` and `owner`. | `.github/workflows/agent-weekly.yml` |

## Gate Evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Runner syntax | pass | `node --check scripts/agent-runner.mjs` |
| Evolution collector syntax | pass | `node --check scripts/evolution-collector.mjs` |
| Evolution runner dry-run | pass | outputs `docs/planning/evolution-review-2026-W22.md`, not the ledger |
| Collector dry-run | pass | W22 D1 actual hours are `0/27` known/unknown and average deviation is `N/A` |
| Workflow YAML parse | pass | Ruby YAML parse passed for all `.github/workflows/*.yml` |
| Deterministic check | pass | `pnpm check` passed in release-capable shell |
| Diff hygiene | pass | `git diff --check` |

## Waiver

Strict visual snapshot was not required for this non-rendering automation and
planning-document change. The first default-sandbox `pnpm check` failed only at
the known Chromium MachPort permission boundary; the same full command passed
in a release-capable shell.
