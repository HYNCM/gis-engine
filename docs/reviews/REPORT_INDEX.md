---
title: Review Report Guide
description: Current review streams, rolling reports, archive pointers, and retention rules
generated_at: 2026-06-10T01:20:00+08:00
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
- Named streams are dated review artifacts for bounded workstreams. Completed
  AMW/AWP and Studio local streams now live in
  [../archive/2026-06-10/reviews/](../archive/2026-06-10/reviews/).
- If you need the current operating rules, read `AGENTS.md` and
  `docs/README.md` first, then come back to the dated reports for evidence.

## Current Review Streams

| Stream | Purpose | Typical files |
| --- | --- | --- |
| Rolling audits | Daily quality/docs cadence and release gate freshness | `daily-audit-*`, `quality-gate-*`, `quality-gate-release-*`, `documentation-audit-*`, `release-readiness-*` |
| Perf trend evidence | Weekly lifecycle timings and trend artifacts for VPE-002 | `perf-trend-*` |
| PR quality evidence | Pull-request path-aware gate summaries from `pr-quality.yml` | GitHub Actions summary/artifact, not committed by default |
| Spatial query hardening | Query readiness, diagnostics, and closure evidence | `sqh-*` |
| MapLibre drift audit | Dependency drift, resource, and go/no-go evidence | `mld-*`, `mlc-*` |
| AI generation / NL planning | Generation contracts, planner provenance, delivery wording | `nla-*`, `nlq-*`, `ain-*`, `gir-*` |
| Productization closure | Release runner, PMTiles promotion, SDK+CLI regression, Workbench intake, external signal refresh | `prod-*`, `quality-waiver-*` |
| W25 adoption evidence | Governance restoration, provider smoke, generated-project audit regression, and P2 No-go boundaries | `first-run-acceptance-*`, `provider-smoke-*`, `generated-project-audit-regression-*`, `pmtiles-runtime-query-promotion-boundary-*`, `studio-workbench-product-go-no-go-*` |
| AI Map Workbench archive | Product boundary, provider/resource controls, durable audit, implementation gate | [archive/2026-06-10/reviews/](../archive/2026-06-10/reviews/) |
| Studio local archive | Review/export/local continuity workstreams | [archive/2026-06-10/reviews/](../archive/2026-06-10/reviews/) |
| Cross-cutting reviews | Architecture or capability-wide conclusions | `architecture-assessment-*`, `ai-orchestration-capability-summary-*`, `main-provider-evidence-hardening-*` |

## Rolling Report Rules

| Report type | Keep active | Notes |
| --- | --- | --- |
| `daily-audit-*` | Latest 7 days | Freshness signal only; older files can be deleted. |
| `quality-gate-*` | Latest 7 days | Use named stream reports for substantive acceptance details. |
| `documentation-audit-*` | Latest 7 days | Keep the newest real audit with concrete findings. |
| `quality-gate-release-*` / `release-readiness-*` | Latest relevant cut | Keep while the release window is active. |
| `perf-trend-*` | Latest weekly trend cut | Keep while VPE-002 trend accumulation is active. |

Use `node scripts/report-retention.mjs` to preview stale rolling reports and
`node scripts/report-retention.mjs --apply` from automation or an explicit
maintenance task to enforce the retention window.

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

## Latest Archive Batch

The 2026-06-10 cleanup moved completed AMW/AWP, Studio local, project review,
and earlier productization review evidence out of this active directory. Use
[../archive/2026-06-10/](../archive/2026-06-10/) for the detailed archive map.
