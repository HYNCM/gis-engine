---
title: Review Report Guide
description: Current review streams, rolling reports, and retention rules
generated_at: 2026-06-03T10:00:00Z
scope: "Current active review tree"
auto_generated: false
---

# Review Report Guide

This file is the entry point for `docs/reviews/`. It is intentionally short.
Use it to understand what kinds of reports stay active, which ones are rolling
templates, and where to look for the real evidence.

## How To Read This Directory

- `daily-audit-*`, `quality-gate-*`, and `documentation-audit-*` are rolling
  machine-generated templates plus local follow-up notes. They are freshness
  signals, not the final source of truth by themselves.
- Named streams such as `SQH`, `MLD`, `AMW`, `AWP`, and `SL*` are dated review
  artifacts for a bounded workstream.
- If you need the current operating rules, read `AGENTS.md` and
  `docs/README.md` first, then come back to the dated reports for evidence.

## Current Review Streams

| Stream | Purpose | Typical files |
| --- | --- | --- |
| Rolling audits | Daily quality/docs cadence and release gate freshness | `daily-audit-*`, `quality-gate-*`, `documentation-audit-*`, `release-readiness-*` |
| Spatial query hardening | Query readiness, diagnostics, and closure evidence | `sqh-*` |
| MapLibre drift audit | Dependency drift, resource, and go/no-go evidence | `mld-*`, `mlc-*` |
| AI generation / NL planning | Generation contracts, planner provenance, delivery wording | `nla-*`, `nlq-*`, `ain-*`, `gir-*` |
| AI Map Workbench | Product boundary, provider/resource controls, durable audit, implementation gate | `amw-*`, `awp-*` |
| Studio local | Review/export/local continuity workstreams | `ser-*`, `slh-*`, `sll-*`, `slr-*`, `slw-*`, `slx-*` |
| Cross-cutting reviews | Architecture or capability-wide conclusions | `architecture-assessment-*`, `ai-orchestration-capability-summary-*`, `main-provider-evidence-hardening-*` |

## Rolling Report Rules

| Report type | Keep active | Notes |
| --- | --- | --- |
| `daily-audit-*` | Latest 7 days | Freshness signal only; older files can be deleted. |
| `quality-gate-*` | Latest 7 days | Use named stream reports for substantive acceptance details. |
| `documentation-audit-*` | Latest 7 days | Keep the newest real audit with concrete findings. |
| `release-readiness-*` | Latest relevant cut | Keep while the release window is active. |

## Legacy Naming Note

Many dated reports were produced before the 2026-06-03 role consolidation.
Older front matter may still say `code-reviewer`, `quality-guardian`,
`competitive-intel`, or `task-distributor`. Read those as historical owner
labels, not as the current operating model.

## Where Current Health Lives

- Current report freshness and handoff anomalies:
  [../planning/AGENT_HEALTH_DASHBOARD.md](../planning/AGENT_HEALTH_DASHBOARD.md)
- Current doc map and authority rules: [../README.md](../README.md) and
  [../../README.md](../../README.md)
- Current operating model: [../../AGENTS.md](../../AGENTS.md)

## When To Archive

Archive a review batch when:

- the follow-up sprint or gate is closed;
- the outcome is captured in current planning or contract docs;
- the active tree would become harder to scan if it stays here.

Do not rewrite dated reports to match newer terminology unless the change is
limited to a clearly marked follow-up note.
