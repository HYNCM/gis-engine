---
generated_at: 2026-08-02T01:21:56.876Z
repo_revision: "f7b72ad"
period: 2026-08-02
agent: orchestrator
decision_level: info
---

# Agent Health Dashboard (as of 2026-08-02)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Execution Health

| Agent | Cadence | Last Report | Last Run | Status | Age |
| --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-07-21 | 🔴 overdue | 11d |
| @product | weekly | docs/research/competitor-updates-2026-W29.md | 2026-07-13 | 🔴 overdue | 19d |
| @quality | daily | docs/reviews/maplibre-v5-v6-compatibility-quality-decision-2026-07-21.md | 2026-07-20 | 🔴 overdue | 12d |
| @builder | ad-hoc | docs/reviews/maplibre-v5-v6-compatibility-builder-evidence-2026-07-21.md | 2026-07-20 | 🟢 ok | 12d |
| @docs | daily | docs/reviews/documentation-audit-2026-07-21.md | 2026-07-20 | 🔴 overdue | 12d |

## Data Flow Health

✅ 所有 agent-to-agent 数据流时序正常。

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 11d | ❌ breach |
| @product | 周一 00:00 UTC | 2d | 19d | ❌ breach |
| @quality | 每日 00:00 UTC | 1d | 12d | ❌ breach |
| @docs | 每日 00:00 UTC | 2d | 12d | ❌ breach |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

- [ ] **@orchestrator**: 报告逾期 11 天 → 手动触发或检查 cron
- [ ] **@product**: 报告逾期 19 天 → 手动触发或检查 cron
- [ ] **@quality**: 报告逾期 12 天 → 手动触发或检查 cron
- [ ] **@docs**: 报告逾期 12 天 → 手动触发或检查 cron

## Summary

- **健康 agent**: 1/5
- **问题 agent**: 4/5
- **数据流异常**: 0
- **生成时间**: 2026-08-02T01:21:56.876Z