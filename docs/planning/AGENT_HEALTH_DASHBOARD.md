---
generated_at: 2026-11-08T02:47:02.655Z
repo_revision: "94298b6"
period: 2026-11-08
agent: orchestrator
inputs:
  - scripts/dashboard-generator.mjs
  - docs/planning/handoff-ledger.json
owner: "@orchestrator"
decision_level: info
---

# Agent Health Dashboard (as of 2026-11-08)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Execution Health

| Agent | Cadence | Specialist Report | Last Run | Latest Template | Status | Age |
| --- | --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-10-01 | — | 🔴 overdue | 37d |
| @product | weekly | docs/research/competitor-updates-2026-W40.md | 2026-10-01 | — | 🔴 overdue | 38d |
| @quality | daily | docs/reviews/quality-gate-release-2026-10-01.md | 2026-10-01 | docs/reviews/quality-gate-2026-07-06.md (2026-07-06) | 🔴 overdue | 38d |
| @builder | ad-hoc | docs/reviews/review-fixes-builder-evidence-2026-10-01.md | 2026-10-01 | — | 🟢 ok | 38d |
| @docs | daily | docs/reviews/documentation-audit-2026-10-01.md | 2026-10-01 | docs/reviews/documentation-audit-2026-07-06.md (2026-07-06) | 🔴 overdue | 38d |

## Data Flow Health

| Flow | Issue | Severity |
| --- | --- | --- |
| product → orchestrator<br/>*competitor signals and priority recommendations (HOC-N1)* | product specialist evidence is 906.8h old (SLA: 48h) | 🔴 error |
| builder → quality<br/>*implementation evidence and test results (HOC-N2)* | quality specialist evidence is 900.7h old (SLA: 24h) | 🟡 warning |
| quality → orchestrator<br/>*gate pass/block and release readiness (HOC-N3)* | quality specialist evidence is 900.7h old (SLA: 24h) | 🔴 error |

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 37d | ❌ breach |
| @product | 周一 00:00 UTC | 2d | 38d | ❌ breach |
| @quality | 每日 00:00 UTC | 1d | 38d | ❌ breach |
| @docs | 每日 00:00 UTC | 2d | 38d | ❌ breach |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

- [ ] **@orchestrator**: 报告逾期 37 天 → 手动触发或检查 cron
- [ ] **@product**: 报告逾期 38 天 → 手动触发或检查 cron
- [ ] **@quality**: 报告逾期 38 天 → 手动触发或检查 cron
- [ ] **@docs**: 报告逾期 38 天 → 手动触发或检查 cron
- [ ] **product → orchestrator**: product specialist evidence is 906.8h old (SLA: 48h) → 检查 handoff 时序
- [ ] **builder → quality**: quality specialist evidence is 900.7h old (SLA: 24h) → 检查 handoff 时序
- [ ] **quality → orchestrator**: quality specialist evidence is 900.7h old (SLA: 24h) → 检查 handoff 时序

## Summary

- **健康 agent**: 1/5
- **问题 agent**: 4/5
- **数据流异常**: 3
- **生成时间**: 2026-11-08T02:47:02.655Z