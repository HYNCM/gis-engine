---
generated_at: 2026-06-07T02:03:59.005Z
repo_revision: "002fa7b"
period: 2026-06-07
agent: orchestrator
decision_level: info
---

# Agent Health Dashboard (as of 2026-06-07)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Execution Health

| Agent | Cadence | Last Report | Last Run | Status | Age |
| --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-06-05 | 🟢 ok | 1d |
| @product | weekly | docs/research/competitor-updates-2026-W24.md | 2026-06-05 | 🟢 ok | 2d |
| @quality | daily | docs/reviews/quality-gate-2026-06-04.md | 2026-06-04 | 🔴 overdue | 3d |
| @builder | ad-hoc | — | — | 🟢 ok | — |
| @docs | daily | docs/reviews/documentation-audit-2026-06-04.md | 2026-06-04 | 🔴 overdue | 3d |

## Data Flow Health

✅ 所有 agent-to-agent 数据流时序正常。

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 1d | ✅ compliant |
| @product | 周一 00:00 UTC | 2d | 2d | ✅ compliant |
| @quality | 每日 00:00 UTC | 1d | 3d | ❌ breach |
| @docs | 每日 00:00 UTC | 2d | 3d | ❌ breach |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

- [ ] **@quality**: 报告逾期 3 天 → 手动触发或检查 cron
- [ ] **@docs**: 报告逾期 3 天 → 手动触发或检查 cron

## Summary

- **健康 agent**: 3/5
- **问题 agent**: 2/5
- **数据流异常**: 0
- **生成时间**: 2026-06-07T02:03:59.007Z