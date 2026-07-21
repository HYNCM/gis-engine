---
generated_at: 2026-07-20T17:14:39.730Z
repo_revision: "282c4a3"
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
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-07-20 | 🟢 fresh | 0d |
| @product | weekly | docs/research/competitor-updates-2026-W29.md | 2026-07-13 | 🟢 ok | 7d |
| @quality | daily | docs/reviews/maplibre-v5-v6-compatibility-quality-decision-2026-07-21.md | 2026-07-20 | 🟢 fresh | 0d |
| @builder | ad-hoc | docs/reviews/maplibre-v5-v6-compatibility-builder-evidence-2026-07-21.md | 2026-07-20 | 🟢 ok | 0d |
| @docs | daily | docs/reviews/documentation-audit-2026-07-21.md | 2026-07-20 | 🟢 fresh | 0d |

## Data Flow Health

✅ 所有 agent-to-agent 数据流时序正常。

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 0d | ✅ compliant |
| @product | 周一 00:00 UTC | 2d | 7d | ❌ breach |
| @quality | 每日 00:00 UTC | 1d | 0d | ✅ compliant |
| @docs | 每日 00:00 UTC | 2d | 0d | ✅ compliant |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

✅ 当前无待处理操作项。

## Summary

- **健康 agent**: 5/5
- **问题 agent**: 0/5
- **数据流异常**: 0
- **生成时间**: 2026-07-20T17:14:39.730Z
