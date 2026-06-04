---
generated_at: 2026-06-04T04:07:16.542Z
repo_revision: "1494e3a"
period: 2026-06-04
agent: orchestrator
decision_level: info
---

# Agent Health Dashboard (as of 2026-06-04)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Execution Health

| Agent | Cadence | Last Report | Last Run | Status | Age |
| --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-05-29 | 🟢 ok | 6d |
| @product | weekly | docs/research/competitor-updates-2026-W23.md | 2026-06-01 | 🟢 ok | 3d |
| @quality | daily | docs/reviews/quality-gate-2026-06-04.md | 2026-06-04 | 🟢 fresh | 0d |
| @builder | ad-hoc | — | — | 🟢 ok | — |
| @docs | daily | docs/reviews/documentation-audit-2026-06-04.md | 2026-06-04 | 🟢 fresh | 0d |

## Data Flow Health

| Flow | Issue | Severity |
| --- | --- | --- |
| product → orchestrator<br/>*competitor signals and priority recommendations (HOC-N1)* | orchestrator report is older than product report | 🔴 error |
| quality → orchestrator<br/>*gate pass/block and release readiness (HOC-N3)* | orchestrator report is older than quality report | 🔴 error |

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 6d | ❌ breach |
| @product | 周一 00:00 UTC | 2d | 3d | ❌ breach |
| @quality | 每日 00:00 UTC | 1d | 0d | ✅ compliant |
| @docs | 每日 00:00 UTC | 2d | 0d | ✅ compliant |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

- [ ] **product → orchestrator**: orchestrator report is older than product report → 检查 handoff 时序
- [ ] **quality → orchestrator**: orchestrator report is older than quality report → 检查 handoff 时序

## Summary

- **健康 agent**: 5/5
- **问题 agent**: 0/5
- **数据流异常**: 2
- **生成时间**: 2026-06-04T04:07:16.548Z