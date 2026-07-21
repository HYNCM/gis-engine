---
generated_at: 2026-07-21T01:16:12.507Z
repo_revision: "af812da"
period: 2026-07-21
agent: orchestrator
decision_level: info
---

# Agent Health Dashboard (as of 2026-07-21)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Execution Health

| Agent | Cadence | Last Report | Last Run | Status | Age |
| --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-07-13 | 🟢 ok | 7d |
| @product | weekly | docs/research/competitor-updates-2026-W29.md | 2026-07-13 | 🟢 ok | 7d |
| @quality | daily | docs/reviews/quality-gate-planning-input-2026-07-13.md | 2026-07-13 | 🔴 overdue | 7d |
| @builder | ad-hoc | — | — | 🟢 ok | — |
| @docs | daily | docs/reviews/documentation-audit-2026-07-13.md | 2026-07-13 | 🔴 overdue | 7d |

## Data Flow Health

✅ 所有 agent-to-agent 数据流时序正常。

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 7d | ❌ breach |
| @product | 周一 00:00 UTC | 2d | 7d | ❌ breach |
| @quality | 每日 00:00 UTC | 1d | 7d | ❌ breach |
| @docs | 每日 00:00 UTC | 2d | 7d | ❌ breach |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

- [ ] **@quality**: 报告逾期 7 天 → 手动触发或检查 cron
- [ ] **@docs**: 报告逾期 7 天 → 手动触发或检查 cron

## Summary

- **健康 agent**: 3/5
- **问题 agent**: 2/5
- **数据流异常**: 0
- **生成时间**: 2026-07-21T01:16:12.509Z