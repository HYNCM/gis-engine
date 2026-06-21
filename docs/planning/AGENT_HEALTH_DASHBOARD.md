---
generated_at: 2026-06-21T02:10:45.615Z
repo_revision: "ace05bb"
period: 2026-06-21
agent: orchestrator
decision_level: info
---

# Agent Health Dashboard (as of 2026-06-21)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Execution Health

| Agent | Cadence | Last Report | Last Run | Status | Age |
| --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-06-10 | 🔴 overdue | 11d |
| @product | weekly | docs/research/competitor-updates-2026-W24.md | 2026-06-09 | 🔴 overdue | 11d |
| @quality | daily | docs/reviews/quality-gate-2026-06-10.md | 2026-06-10 | 🔴 overdue | 11d |
| @builder | ad-hoc | — | — | 🟢 ok | — |
| @docs | daily | docs/reviews/documentation-audit-2026-06-10.md | 2026-06-10 | 🔴 overdue | 11d |

## Data Flow Health

✅ 所有 agent-to-agent 数据流时序正常。

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 11d | ❌ breach |
| @product | 周一 00:00 UTC | 2d | 11d | ❌ breach |
| @quality | 每日 00:00 UTC | 1d | 11d | ❌ breach |
| @docs | 每日 00:00 UTC | 2d | 11d | ❌ breach |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

- [ ] **@orchestrator**: 报告逾期 11 天 → 手动触发或检查 cron
- [ ] **@product**: 报告逾期 11 天 → 手动触发或检查 cron
- [ ] **@quality**: 报告逾期 11 天 → 手动触发或检查 cron
- [ ] **@docs**: 报告逾期 11 天 → 手动触发或检查 cron

## Summary

- **健康 agent**: 1/5
- **问题 agent**: 4/5
- **数据流异常**: 0
- **生成时间**: 2026-06-21T02:10:45.618Z