---
generated_at: 2026-07-23T01:21:55.054Z
repo_revision: "db1ded8"
period: 2026-07-23
agent: orchestrator
decision_level: info
---

# Agent Health Dashboard (as of 2026-07-23)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Execution Health

| Agent | Cadence | Last Report | Last Run | Status | Age |
| --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-07-21 | 🟢 ok | 1d |
| @product | weekly | docs/research/competitor-updates-2026-W29.md | 2026-07-13 | 🔴 overdue | 9d |
| @quality | daily | docs/reviews/maplibre-v5-v6-compatibility-quality-decision-2026-07-21.md | 2026-07-20 | 🔴 overdue | 2d |
| @builder | ad-hoc | docs/reviews/maplibre-v5-v6-compatibility-builder-evidence-2026-07-21.md | 2026-07-20 | 🟢 ok | 2d |
| @docs | daily | docs/reviews/documentation-audit-2026-07-21.md | 2026-07-20 | 🔴 overdue | 2d |

## Data Flow Health

✅ 所有 agent-to-agent 数据流时序正常。

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 1d | ✅ compliant |
| @product | 周一 00:00 UTC | 2d | 9d | ❌ breach |
| @quality | 每日 00:00 UTC | 1d | 2d | ❌ breach |
| @docs | 每日 00:00 UTC | 2d | 2d | ✅ compliant |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

- [ ] **@product**: 报告逾期 9 天 → 手动触发或检查 cron
- [ ] **@quality**: 报告逾期 2 天 → 手动触发或检查 cron
- [ ] **@docs**: 报告逾期 2 天 → 手动触发或检查 cron

## Summary

- **健康 agent**: 2/5
- **问题 agent**: 3/5
- **数据流异常**: 0
- **生成时间**: 2026-07-23T01:21:55.054Z