---
generated_at: 2026-06-11T02:09:17.844Z
repo_revision: "19859c2"
period: 2026-06-11
agent: orchestrator
decision_level: info
---

# Agent Health Dashboard (as of 2026-06-11)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Execution Health

| Agent | Cadence | Last Report | Last Run | Status | Age |
| --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-06-10 | 🟢 fresh | 1d |
| @product | weekly | docs/research/competitor-updates-2026-W24.md | 2026-06-09 | 🟢 ok | 1d |
| @quality | daily | docs/reviews/quality-gate-2026-06-10.md | 2026-06-10 | 🟢 fresh | 1d |
| @builder | ad-hoc | — | — | 🟢 ok | — |
| @docs | daily | docs/reviews/documentation-audit-2026-06-10.md | 2026-06-10 | 🟢 fresh | 1d |

## Data Flow Health

✅ 所有 agent-to-agent 数据流时序正常。

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 1d | ✅ compliant |
| @product | 周一 00:00 UTC | 2d | 1d | ✅ compliant |
| @quality | 每日 00:00 UTC | 1d | 1d | ✅ compliant |
| @docs | 每日 00:00 UTC | 2d | 1d | ✅ compliant |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

✅ 当前无待处理操作项。

## Summary

- **健康 agent**: 5/5
- **问题 agent**: 0/5
- **数据流异常**: 0
- **生成时间**: 2026-06-11T02:09:17.847Z