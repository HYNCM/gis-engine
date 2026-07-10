---
generated_at: 2026-07-10T16:24:48.397Z
repo_revision: "511a1c9"
period: 2026-07-10
agent: orchestrator
decision_level: info
---

# Agent Health Dashboard (as of 2026-07-10)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Execution Health

| Agent | Cadence | Last Report | Last Run | Status | Age |
| --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-07-10 | 🟢 fresh | 0d |
| @product | weekly | docs/research/competitor-updates-2026-W24.md | 2026-06-09 | 🔴 overdue | 31d |
| @quality | daily | docs/reviews/quality-gate-workbench-product-route-2026-07-10.md | 2026-07-10 | 🟢 fresh | 0d |
| @builder | ad-hoc | — | — | 🟢 ok | — |
| @docs | daily | docs/reviews/documentation-audit-2026-07-06.md | 2026-07-06 | 🔴 overdue | 4d |

## Data Flow Health

✅ 所有 agent-to-agent 数据流时序正常。

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 0d | ✅ compliant |
| @product | 周一 00:00 UTC | 2d | 31d | ❌ breach |
| @quality | 每日 00:00 UTC | 1d | 0d | ✅ compliant |
| @docs | 每日 00:00 UTC | 2d | 4d | ❌ breach |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

- [ ] **@product**: 报告逾期 31 天 → 手动触发或检查 cron
- [ ] **@docs**: 报告逾期 4 天 → 手动触发或检查 cron

## Summary

- **健康 agent**: 3/5
- **问题 agent**: 2/5
- **数据流异常**: 0
- **生成时间**: 2026-07-10T16:24:48.406Z