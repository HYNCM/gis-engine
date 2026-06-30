---
agent: orchestrator
period: issue-snapshot
generated_at: 2026-06-30T23:30:00+08:00
repo_revision: "6f1e867"
inputs:
  - GitHub Issues API
owner: "@orchestrator"
decision_level: info
---

# GitHub Issues Planning Snapshot

> This file is generated from GitHub Issues when `gh issue list` is available. Markdown planning files remain snapshots; GitHub Issues are the canonical task state once enabled.

## Status

- **v1.1.0 released** (tag `v1.1.0`, commit `6f1e867`) — 19 changesets consumed
- Open issues: 1
- Closed issues in snapshot: 18
- Total returned: 19
- Boundary enforcement regression tests (Task 1 of next-step-plan): completed

## Next Implementation Targets

The next accepted work is guardrail-oriented, not adoption cleanup.

| Target | next-step-plan Task | Scope | Owner | Verification Gate |
| --- | --- | --- | --- | --- |
| Core-vs-extension contract matrix | Task 2 | Document stable core fields vs extension-only fields in architecture and spec docs | @builder | `pnpm test:docs` + `node scripts/doc-generator.mjs links` |
| Extension-only evidence slice | Task 3 | Add narrow extension-only example/test proving extension payloads stay out of stable core | @builder | `pnpm test:ai` + `pnpm test:examples` + `pnpm test:docs` |
| Queue refresh (this task) | Task 4 | Refresh planning snapshots to point at guardrail work | @orchestrator | `pnpm test:docs` |

- **#22** remains the single open issue and tracks the core/extension boundary matrix — the next guardrail slice.
- No planning artifact points at SDK+CLI adoption cleanup as the active priority.

## Issues

| Issue | State | Title | Labels | Assignees | Milestone | Updated |
| --- | --- | --- | --- | --- | --- | --- |
| #22 | OPEN | [TASK-2026W25-DOC-001: Generate the core/extension boundary matrix from one source](https://github.com/HYNCM/gis-engine/issues/22) | documentation, enhancement, priority:p2, track:productization, agent:quality, agent:builder | - | - | 2026-06-18T16:05:55Z |
| #21 | CLOSED | [TASK-2026W26-CLI-003: CLI install smoke builds generated app](https://github.com/HYNCM/gis-engine/issues/21) | enhancement, priority:p2, track:productization, agent:quality, agent:builder | - | - | 2026-06-13T18:07:18Z |
| #20 | CLOSED | [TASK-2026W26-CLI-002: Generated app review rail next-action visibility](https://github.com/HYNCM/gis-engine/issues/20) | enhancement, priority:p2, track:productization, agent:quality, agent:builder | - | - | 2026-06-13T16:39:15Z |
| #19 | CLOSED | [TASK-2026W26-CLI-001: Preflight text next-action visibility](https://github.com/HYNCM/gis-engine/issues/19) | enhancement, priority:p2, track:productization, agent:quality, agent:builder | - | - | 2026-06-13T15:29:37Z |
| #18 | CLOSED | [TASK-2026W26-DATA-004: GeoTIFF runtime/query promotion gate](https://github.com/HYNCM/gis-engine/issues/18) | enhancement, priority:p2, track:productization, agent:quality, agent:builder | - | - | 2026-06-12T13:22:37Z |
| #17 | CLOSED | [TASK-2026W26-DATA-003: FlatGeobuf runtime/query promotion gate](https://github.com/HYNCM/gis-engine/issues/17) | enhancement, priority:p2, track:productization, agent:quality, agent:builder | - | - | 2026-06-11T17:43:29Z |
| #16 | CLOSED | [TASK-2026W26-DATA-002: GeoParquet runtime/query promotion gate](https://github.com/HYNCM/gis-engine/issues/16) | enhancement, priority:p2, track:productization, agent:quality, agent:builder | - | - | 2026-06-11T17:33:38Z |
| #15 | CLOSED | [TASK-2026W26-STUDIO-001: Review-console Workbench product route Go gate](https://github.com/HYNCM/gis-engine/issues/15) | documentation, agent:product, priority:p2, track:productization, agent:quality | - | - | 2026-06-11T17:09:05Z |
| #14 | CLOSED | [TASK-2026W26-DATA-001: PMTiles runtime query loader contract and negative fixtures](https://github.com/HYNCM/gis-engine/issues/14) | enhancement, track:productization, agent:quality, agent:builder, priority:p1 | - | - | 2026-06-11T17:05:09Z |
| #13 | CLOSED | [TASK-2026W25-STUDIO-001: Studio and Workbench product Go/No-go evidence](https://github.com/HYNCM/gis-engine/issues/13) | documentation, agent:product, priority:p2, track:productization, agent:quality | - | - | 2026-06-10T05:46:52Z |
| #12 | CLOSED | [TASK-2026W25-DATA-001: bounded PMTiles runtime query promotion design](https://github.com/HYNCM/gis-engine/issues/12) | enhancement, agent:product, priority:p2, track:productization, agent:quality | - | - | 2026-06-10T05:46:52Z |
| #11 | CLOSED | [TASK-2026W25-ADOPT-003: generated project auditability regression](https://github.com/HYNCM/gis-engine/issues/11) | enhancement, track:productization, agent:quality, agent:builder, priority:p1 | - | - | 2026-06-10T05:46:52Z |
| #10 | CLOSED | [TASK-2026W25-ADOPT-002: OpenAI-compatible provider end-to-end smoke](https://github.com/HYNCM/gis-engine/issues/10) | enhancement, track:productization, agent:quality, agent:builder, priority:p1 | - | - | 2026-06-10T05:46:52Z |
| #9 | CLOSED | [TASK-2026W25-ADOPT-001: SDK+CLI 30-minute first-run acceptance](https://github.com/HYNCM/gis-engine/issues/9) | enhancement, track:productization, agent:quality, agent:builder, priority:p1 | - | - | 2026-06-10T04:56:48Z |
| #8 | CLOSED | [TASK-2026W25-GOV-001: restore quality/docs cadence and HOC-N3 handoff](https://github.com/HYNCM/gis-engine/issues/8) | documentation, track:productization, agent:quality, priority:p1 | - | - | 2026-06-10T04:56:48Z |
| #7 | CLOSED | [TASK-2026W24-PROD-009: post-release SDK+CLI consumer regression](https://github.com/HYNCM/gis-engine/issues/7) | enhancement, track:productization, agent:quality, agent:builder, priority:p1 | - | - | 2026-06-09T16:39:46Z |
| #6 | CLOSED | [TASK-2026W24-PROD-011: external signal refresh for W25 planning](https://github.com/HYNCM/gis-engine/issues/6) | documentation, agent:product, priority:p2, track:productization | - | - | 2026-06-09T16:59:55Z |
| #5 | CLOSED | [TASK-2026W24-PROD-008: PMTiles point/bbox feature-query promotion gate](https://github.com/HYNCM/gis-engine/issues/5) | enhancement, track:productization, agent:quality, agent:builder, priority:p1 | - | - | 2026-06-09T16:39:47Z |
| #4 | CLOSED | [TASK-2026W24-PROD-010: AI Map Workbench product-promotion intake](https://github.com/HYNCM/gis-engine/issues/4) | enhancement, agent:product, priority:p2, track:productization, agent:quality | - | - | 2026-06-09T16:59:54Z |
