---
agent: orchestrator
period: 2026-W34-W38
generated_at: 2026-08-19T15:28:05Z
repo_revision: "5be1b147"
inputs:
  - docs/planning/issues-snapshot.md
  - docs/planning/weekly-digest.md
  - docs/reviews/workbench-v1-quality-decision-2026-08-19.md
  - https://github.com/HYNCM/gis-engine/issues/66
  - https://github.com/HYNCM/gis-engine/pull/67
owner: "@orchestrator"
decision_level: advisory
evidence_kind: specialist
---

# Next Stage Plan: Workbench Alpha Validation

## Outcome

Move the reviewed Workbench implementation candidate into a measured five-user
Alpha without promoting local v1, hosted capability, stable 3D, or engine
release scope.

## Ordered Work

1. Require all PR #67 final-head checks and close review findings.
2. Resolve or formally bound the generated dependency audit findings.
3. Define a repeatable participant script covering create, inspect, describe,
   preview, apply, export, build, reopen, and abandon/recover paths.
4. Run five target WebGIS engineers and record duration, completion, export
   build, blocking diagnostics, and leak checks.
5. Make an Alpha Go/No-go decision from the measured threshold; keep Issue #66
   open if any threshold is missed.

## Acceptance

- [ ] PR #67 final-head CI passes and review is complete.
- [ ] One high and one moderate npm advisory are triaged at package level.
- [ ] Five target engineers participate.
- [ ] At least four finish the golden path within 30 minutes.
- [ ] Every produced export installs and builds.
- [ ] No credential, raw provider body, raw prompt, or source-data leak occurs.
- [ ] Blocking diagnostics are never recorded as success.

## Guardrails

- A Draft PR is not merged-main or released-package evidence.
- Automated E2E is not a substitute for target-user completion data.
- Workbench remains `0.x`; PR #47 cannot satisfy this plan.
- The MCP inventory remains 14 tools in canonical order.
- MapLibre 2D is the only Workbench v1 rendering claim.
- HOC-N1 is stale; no external protocol, format, or competitor-driven adoption
  decision may enter this stage without current official-source evidence.
