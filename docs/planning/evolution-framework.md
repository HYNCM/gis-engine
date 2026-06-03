---
agent: orchestrator
period: 2026-W23
generated_at: 2026-06-03T00:00:00Z
repo_revision: "unknown"
inputs:
  - AGENTS.md
  - docs/planning/task-burndown.md
  - docs/planning/dependency-graph.md
  - scripts/agent-runner.mjs
  - scripts/dashboard-generator.mjs
owner: "@orchestrator"
decision_level: advisory
---

# Evolution Framework

GIS Engine treats the agent system itself as a product that should improve from
measured execution, not folklore.

This document is the governance-level source of truth for that evolution loop.
Dated planning or review snapshots may still use pre-2026-06-03 role names, but
the framework below follows the current 5-agent model:

- `@orchestrator`
- `@product`
- `@quality`
- `@builder`
- `@docs`

## Principles

1. The system is measurable: estimates, latency, gate outcomes, and reuse all
   leave evidence.
2. Rules adjust gradually: small weekly or monthly changes beat large resets.
3. Structural changes stay human-approved: no automatic rewriting of core repo
   rules, gate semantics, or public contracts.
4. Historical evidence stays dated: new governance should not rewrite old
   sprint or review artifacts to look timeless.

## Evolution Dimensions

| Dim | Name | What we measure | What it can change |
| --- | --- | --- | --- |
| D1 | Estimation accuracy | Estimated vs actual effort by task size and owner | Complexity baselines |
| D2 | Bottleneck recurrence | Critical-path wait time and repeated handoff stalls | Dependency sequencing |
| D3 | Quality trend | First-pass gate rate, rework loops, diagnostic coverage | Pre-flight checks and gate thresholds |
| D4 | Knowledge accumulation | Pattern reuse and pitfall avoidance | Pattern library and task templates |
| D5 | Responsibility balance | Load distribution across current agents | Focus allocation by product stage |
| D6 | Decision weight calibration | Priority formula accuracy over time | Product scoring coefficients |

## Current Responsibility Model

The evolution loop follows the consolidated 5-agent topology.

| Agent | Primary role in evolution |
| --- | --- |
| `@orchestrator` | Approves rule changes, owns final planning state, runs monthly evolution review |
| `@product` | Interprets competitor/product signals and recommends priority recalibration |
| `@quality` | Supplies gate-quality metrics, pass/block trends, and recurring failure classes |
| `@builder` | Supplies implementation throughput, dependency wait, and rework evidence across engine/ai/adapter/qa focus areas |
| `@docs` | Keeps the pattern/pitfall record, docs authority map, and change communication aligned |

## D5 Stage Targets

D5 no longer tracks five execution-owner micro-agents. It tracks the current
five-agent model instead.

| Stage | `@orchestrator` | `@product` | `@quality` | `@builder` | `@docs` |
| --- | --- | --- | --- | --- | --- |
| v0.1 alpha | 15% | 15% | 15% | 40% | 15% |
| v0.2 beta | 15% | 20% | 15% | 35% | 15% |
| v0.3-v0.9 | 15% | 20% | 20% | 30% | 15% |
| v1.0 release | 15% | 15% | 25% | 25% | 20% |

Interpretation:

- `@builder` carries the heaviest load while the runtime surface is still being
  shaped.
- `@quality` and `@docs` rise as the product moves toward release discipline.
- `@orchestrator` and `@product` remain stable because the planning and
  prioritization layer is always active.

## Cadence

| Layer | Cadence | Driver | Output |
| --- | --- | --- | --- |
| L1 Operational | Weekly | `agent-weekly` metrics collection | Ledger snapshot and anomaly list |
| L2 Strategic | Monthly | `@orchestrator` evolution review | Trend summary and rule-adjustment proposals |
| L3 Structural | Stage change | Product-stage promotion decision | Responsibility redistribution review and `AGENTS.md` proposal |

## Monthly Evolution Review

`evolution-guardian` is a responsibility subset of `@orchestrator`, not a
standalone agent.

The monthly review must:

1. collect the previous 4 weeks of D1-D6 evidence;
2. compare trends against the previous month;
3. extract at least one reusable pattern or pitfall when the sprint history
   justifies it;
4. propose only bounded rule changes;
5. append the result to `docs/planning/evolution-ledger.md`.

## Adjustment Authority

| Change type | Default mode | Approver |
| --- | --- | --- |
| Estimate baseline tweak below 2x | Auto-suggest | `@orchestrator` |
| Gate-threshold tweak | Auto-suggest | `@orchestrator` + `@quality` |
| Priority-weight micro-adjustment below 0.05 | Auto-suggest | `@orchestrator` + `@product` |
| Responsibility rebalance | Manual proposal | `@orchestrator` + `@product` |
| New/merged/removed agent | Manual proposal | `@orchestrator` |
| Public contract or repo-rule change | Manual proposal | separate code/contract review, never evolution-only |

## Hard Boundaries

The evolution loop must never auto-modify:

- schema-first and command-only repo rules;
- MCP tool names or public input/output schema requirements;
- resource-policy security boundaries;
- core gate semantics such as snapshot/release evidence requirements;
- product-stage Go/No-go decisions without explicit human approval.

## Knowledge System

### Pattern Library

Promote a pattern when it has clear reuse value and evidence from at least 3
tasks or 2 completed batches. Store the promoted pattern in the evolution
ledger, not scattered review files.

### Pitfall Library

Capture failures that repeatedly produce rework, missing evidence, or stale
docs. `@quality` and `@docs` should both check new active work against known
pitfalls before a batch closes.

### Intake Rule

Every closed sprint should contribute at least one of:

- a promoted pattern;
- a newly observed pitfall;
- an explicit note that no durable pattern/pitfall emerged.

## Automation Components

| Component | Path | Purpose |
| --- | --- | --- |
| Evolution collector | `scripts/evolution-collector.mjs` | Collects D1-D6 metrics and produces ledger inputs |
| Health dashboard | `scripts/dashboard-generator.mjs` → `docs/planning/AGENT_HEALTH_DASHBOARD.md` | Shows report freshness, handoff anomalies, and SLA status |
| Agent runner | `scripts/agent-runner.mjs` | Standardizes front matter, dry runs, and health checks |
| Weekly workflow | `.github/workflows/agent-weekly.yml` | Runs the current planning/research/documentation cadence |

## Health Dashboard Interpretation

`docs/planning/AGENT_HEALTH_DASHBOARD.md` is an automation-health view, not a
decision artifact. Use it to answer:

- Which current agents have fresh reports?
- Which handoff chains are late or inverted?
- Which cadence breached its freshness target?

Do not use it as a substitute for a real gate report, planning note, or
release decision.

## SLA Rules

- Weekly cadence targets should not drift beyond 8 days without an explicit
  recovery note.
- Daily cadence targets should not drift beyond 2 days without a blocking
  follow-up.
- Generated placeholder reports may keep the workflow moving, but they must be
  labeled as templates and followed by substantive evidence before they are used
  for advisory or blocking decisions.

## Relationship To Dated Evidence

Older files may still mention `code-reviewer`, `quality-guardian`,
`competitive-intel`, `product-strategist`, `task-distributor`, or the old
execution-owner split. Keep those historical labels in place when they describe
what actually happened at the time. The evolution framework exists to explain
how to read those files now, not to erase them.

## Version History

| Version | Date | Change |
| --- | --- | --- |
| v1.1 | 2026-06-03 | Aligned the framework with the 5-agent model and removed legacy governance duplication |
| v1.0 | 2026-05-30 | Initial D1-D6 framework, feedback loops, and knowledge system |
