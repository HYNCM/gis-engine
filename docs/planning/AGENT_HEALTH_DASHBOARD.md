---
generated_at: 2026-10-01T04:58:10.959Z
repo_revision: "a8d558e"
period: 2026-10-01
agent: orchestrator
inputs:
  - scripts/dashboard-generator.mjs
  - docs/planning/handoff-ledger.json
owner: "@orchestrator"
decision_level: info
evidence_run_id: planning-evidence-20261001T045810959Z
---

# Agent Health Dashboard (as of 2026-10-01)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Planning Evidence

| Issue Source | Open | Closed | Total | Required Handoffs |
| --- | ---: | ---: | ---: | --- |
| authenticated | 70 | 30 | 100 | 0/2 consumed |

## Execution Health

| Agent | Cadence | Specialist Report | Last Run | Latest Template | Status | Age |
| --- | --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-08-19 | — | 🔴 overdue | 43d |
| @product | weekly | docs/research/competitor-updates-2026-W32.md | 2026-08-05 | — | 🔴 overdue | 57d |
| @quality | daily | docs/reviews/workbench-v1-quality-decision-2026-08-19.md | 2026-08-19 | docs/reviews/quality-gate-2026-07-06.md (2026-07-06) | 🔴 overdue | 43d |
| @builder | ad-hoc | docs/reviews/workbench-v1-builder-evidence-2026-08-19.md | 2026-08-19 | — | 🟢 ok | 43d |
| @docs | daily | docs/reviews/documentation-audit-2026-08-06.md | 2026-08-05 | docs/reviews/documentation-audit-2026-07-06.md (2026-07-06) | 🔴 overdue | 57d |

## Data Flow Health

| Flow | Issue | Severity |
| --- | --- | --- |
| product → orchestrator<br/>*competitor signals and priority recommendations (HOC-N1)* | product specialist evidence is 1356.8h old (SLA: 48h) | 🔴 error |
| builder → quality<br/>*implementation evidence and test results (HOC-N2)* | quality specialist evidence is 1022.2h old (SLA: 24h) | 🟡 warning |
| quality → orchestrator<br/>*gate pass/block and release readiness (HOC-N3)* | quality specialist evidence is 1022.2h old (SLA: 24h) | 🔴 error |

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 43d | ❌ breach |
| @product | 周一 00:00 UTC | 2d | 57d | ❌ breach |
| @quality | 每日 00:00 UTC | 1d | 43d | ❌ breach |
| @docs | 每日 00:00 UTC | 2d | 57d | ❌ breach |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

- [ ] **@orchestrator**: 报告逾期 43 天 → 手动触发或检查 cron
- [ ] **@product**: 报告逾期 57 天 → 手动触发或检查 cron
- [ ] **@quality**: 报告逾期 43 天 → 手动触发或检查 cron
- [ ] **@docs**: 报告逾期 57 天 → 手动触发或检查 cron
- [ ] **product → orchestrator**: product specialist evidence is 1356.8h old (SLA: 48h) → 检查 handoff 时序
- [ ] **builder → quality**: quality specialist evidence is 1022.2h old (SLA: 24h) → 检查 handoff 时序
- [ ] **quality → orchestrator**: quality specialist evidence is 1022.2h old (SLA: 24h) → 检查 handoff 时序

## Summary

- **健康 agent**: 1/5
- **问题 agent**: 4/5
- **数据流异常**: 3
- **生成时间**: 2026-10-01T04:58:10.959Z
