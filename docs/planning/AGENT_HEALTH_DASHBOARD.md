---
generated_at: 2026-07-18T01:11:06.650Z
repo_revision: "b856f07"
period: 2026-07-18
agent: orchestrator
decision_level: info
---

# Agent Health Dashboard (as of 2026-07-18)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Execution Health

| Agent | Cadence | Last Report | Last Run | Status | Age |
| --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-07-13 | 🟢 ok | 4d |
| @product | weekly | docs/research/competitor-updates-2026-W29.md | 2026-07-13 | 🟢 ok | 4d |
| @quality | daily | docs/reviews/quality-gate-planning-input-2026-07-13.md | 2026-07-13 | 🔴 overdue | 4d |
| @builder | ad-hoc | — | — | 🟢 ok | — |
| @docs | daily | docs/reviews/documentation-audit-2026-07-13.md | 2026-07-13 | 🔴 overdue | 4d |

## Data Flow Health

✅ 所有 agent-to-agent 数据流时序正常。

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 4d | ❌ breach |
| @product | 周一 00:00 UTC | 2d | 4d | ❌ breach |
| @quality | 每日 00:00 UTC | 1d | 4d | ❌ breach |
| @docs | 每日 00:00 UTC | 2d | 4d | ❌ breach |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

- [ ] **@quality**: 报告逾期 4 天 → 手动触发或检查 cron
- [ ] **@docs**: 报告逾期 4 天 → 手动触发或检查 cron

## Summary

- **健康 agent**: 3/5
- **问题 agent**: 2/5
- **数据流异常**: 0
- **生成时间**: 2026-07-18T01:11:06.653Z