---
generated_at: 2026-07-27T02:28:44.637Z
repo_revision: "3aac74b"
period: 2026-07-27
agent: orchestrator
decision_level: info
evidence_run_id: planning-evidence-20260727T022844637Z
---

# Agent Health Dashboard (as of 2026-07-27)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Planning Evidence

| Issue Source | Open | Closed | Total | Required Handoffs |
| --- | ---: | ---: | ---: | --- |
| authenticated | 4 | 25 | 29 | 2/2 consumed |

## Execution Health

| Agent | Cadence | Last Report | Last Run | Status | Age |
| --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-07-21 | 🟢 ok | 5d |
| @product | weekly | docs/research/competitor-updates-2026-W29.md | 2026-07-13 | 🔴 overdue | 13d |
| @quality | daily | docs/reviews/maplibre-v5-v6-compatibility-quality-decision-2026-07-21.md | 2026-07-20 | 🔴 overdue | 6d |
| @builder | ad-hoc | docs/reviews/maplibre-v5-v6-compatibility-builder-evidence-2026-07-21.md | 2026-07-20 | 🟢 ok | 6d |
| @docs | daily | docs/reviews/documentation-audit-2026-07-21.md | 2026-07-20 | 🔴 overdue | 6d |

## Data Flow Health

✅ 所有 agent-to-agent 数据流时序正常。

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 5d | ❌ breach |
| @product | 周一 00:00 UTC | 2d | 13d | ❌ breach |
| @quality | 每日 00:00 UTC | 1d | 6d | ❌ breach |
| @docs | 每日 00:00 UTC | 2d | 6d | ❌ breach |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

- [ ] **@product**: 报告逾期 13 天 → 手动触发或检查 cron
- [ ] **@quality**: 报告逾期 6 天 → 手动触发或检查 cron
- [ ] **@docs**: 报告逾期 6 天 → 手动触发或检查 cron

## Summary

- **健康 agent**: 2/5
- **问题 agent**: 3/5
- **数据流异常**: 0
- **生成时间**: 2026-07-27T02:28:44.637Z
