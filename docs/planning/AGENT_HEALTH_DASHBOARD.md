---
generated_at: 2026-06-10T01:57:52.433Z
repo_revision: "0bfcb2e"
period: 2026-06-10
agent: orchestrator
decision_level: info
---

# Agent Health Dashboard (as of 2026-06-10)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Execution Health

| Agent | Cadence | Last Report | Last Run | Status | Age |
| --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-06-09 | 🟢 fresh | 0d |
| @product | weekly | docs/research/competitor-updates-2026-W24.md | 2026-06-09 | 🟢 fresh | 0d |
| @quality | daily | docs/reviews/quality-gate-2026-06-04.md | 2026-06-04 | 🔴 overdue | 6d |
| @builder | ad-hoc | — | — | 🟢 ok | — |
| @docs | daily | docs/reviews/documentation-audit-2026-06-04.md | 2026-06-04 | 🔴 overdue | 6d |

## Data Flow Health

| Flow | Issue | Severity |
| --- | --- | --- |
| quality → orchestrator<br/>*gate pass/block and release readiness (HOC-N3)* | orchestrator report does not cite docs/reviews/quality-gate-2026-06-04.md | 🔴 error |

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 0d | ✅ compliant |
| @product | 周一 00:00 UTC | 2d | 0d | ✅ compliant |
| @quality | 每日 00:00 UTC | 1d | 6d | ❌ breach |
| @docs | 每日 00:00 UTC | 2d | 6d | ❌ breach |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

- [ ] **@quality**: 报告逾期 6 天 → 手动触发或检查 cron
- [ ] **@docs**: 报告逾期 6 天 → 手动触发或检查 cron
- [ ] **quality → orchestrator**: orchestrator report does not cite docs/reviews/quality-gate-2026-06-04.md → 检查 handoff 时序

## Summary

- **健康 agent**: 3/5
- **问题 agent**: 2/5
- **数据流异常**: 1
- **生成时间**: 2026-06-10T01:57:52.437Z