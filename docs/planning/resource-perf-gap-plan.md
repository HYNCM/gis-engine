---
agent: task-distributor
period: 2026-W21
generated_at: 2026-05-17T16:35:00Z
repo_revision: "acdf28e"
inputs:
  - docs/reviews/daily-audit-2026-05-17.md
  - docs/engineering/ci-test-strategy.md
  - tests/resources/resource-release.test.ts
  - tests/perf/perf-smoke.test.ts
decision_level: advisory
---

# Resource and Performance Gap Plan

## Current Gap

The daily audit found that resource-release and perf smoke coverage are narrower
than the CI strategy describes. The v0.2 checkpoint now has schema, MCP, vector,
command, snapshot, and visual evidence; this plan remains open specifically for
lifecycle and performance depth.

## Resource Release Follow-Ups

| Task | Scope | Acceptance |
| --- | --- | --- |
| RESOURCE-001 | destroy after `snapshot()` | destroyed runtime returns a stable diagnostic or resource report |
| RESOURCE-002 | destroy after `queryFeatures()` | query path does not retain stale adapter state |
| RESOURCE-003 | adapter listener cleanup | listeners are removed or reported in `ResourceReport` |
| RESOURCE-004 | unsupported resource verification | unverifiable WebGL/browser resources report `verifiable: false` when modeled |

## Performance Smoke Follow-Ups

| Task | Scope | Acceptance |
| --- | --- | --- |
| PERF-001 | command replay baseline | 50-command replay stays under the existing smoke budget |
| PERF-002 | create/render smoke | `createMap` with a small GeoJSON fixture completes under a deterministic local budget |
| PERF-003 | query smoke | point/bbox query against inline GeoJSON completes under a deterministic local budget |
| PERF-004 | snapshot smoke timing | headless snapshot completes under a deterministic local budget |
| PERF-005 | destroy smoke timing | destroy completes and returns a clean resource report |

## Sequencing

1. Keep current perf smoke as the baseline guard.
2. Add deterministic Node-level resource tests before browser-only resource
   checks.
3. Add small-fixture performance tests before 1k/10k/100k feature scenarios.
4. Treat large-data performance as nightly/release evidence, not PR-blocking
   until the fixture and runner are stable.

## Non-Goals

- Browser long-task measurement in PR.
- GPU/WebGL memory verification in Node.
- Hard performance promises for real remote tiles.
- 100k feature stress tests as default PR blockers.
