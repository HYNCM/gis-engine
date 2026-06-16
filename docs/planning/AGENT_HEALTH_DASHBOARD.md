---
generated_at: 2026-06-16T02:16:28.935Z
repo_revision: "ad86a3d"
period: 2026-06-16
agent: orchestrator
decision_level: info
---

# Agent Health Dashboard (as of 2026-06-16)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Execution Health

| Agent | Cadence | Last Report | Last Run | Status | Age |
| --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-06-10 | 🟢 ok | 6d |
| @product | weekly | docs/research/competitor-updates-2026-W24.md | 2026-06-09 | 🟢 ok | 6d |
| @quality | daily | docs/reviews/quality-gate-2026-06-10.md | 2026-06-10 | 🔴 overdue | 6d |
| @builder | ad-hoc | — | — | 🟢 ok | — |
| @docs | daily | docs/reviews/documentation-audit-2026-06-10.md | 2026-06-10 | 🔴 overdue | 6d |

## Data Flow Health

✅ 所有 agent-to-agent 数据流时序正常。

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 6d | ❌ breach |
| @product | 周一 00:00 UTC | 2d | 6d | ❌ breach |
| @quality | 每日 00:00 UTC | 1d | 6d | ❌ breach |
| @docs | 每日 00:00 UTC | 2d | 6d | ❌ breach |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

- [ ] **@quality**: 报告逾期 6 天 → 手动触发或检查 cron
- [ ] **@docs**: 报告逾期 6 天 → 手动触发或检查 cron

## Summary

- **健康 agent**: 3/5
- **问题 agent**: 2/5
- **数据流异常**: 0
- **生成时间**: 2026-06-16T02:16:28.938Z