---
generated_at: 2026-08-19T15:31:16.729Z
repo_revision: "5be1b14"
period: 2026-08-19
agent: orchestrator
inputs:
  - scripts/dashboard-generator.mjs
  - docs/planning/handoff-ledger.json
owner: "@orchestrator"
decision_level: info
---

# Agent Health Dashboard (as of 2026-08-19)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Execution Health

| Agent | Cadence | Specialist Report | Last Run | Latest Template | Status | Age |
| --- | --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-08-19 | — | 🟢 fresh | 0d |
| @product | weekly | docs/research/competitor-updates-2026-W32.md | 2026-08-05 | — | 🔴 overdue | 14d |
| @quality | daily | docs/reviews/workbench-v1-quality-decision-2026-08-19.md | 2026-08-19 | docs/reviews/quality-gate-2026-07-06.md (2026-07-06) | 🟢 fresh | 0d |
| @builder | ad-hoc | docs/reviews/workbench-v1-builder-evidence-2026-08-19.md | 2026-08-19 | — | 🟢 ok | 0d |
| @docs | daily | docs/reviews/documentation-audit-2026-08-06.md | 2026-08-05 | docs/reviews/documentation-audit-2026-07-06.md (2026-07-06) | 🔴 overdue | 14d |

## Data Flow Health

| Flow | Issue | Severity |
| --- | --- | --- |
| product → orchestrator<br/>*competitor signals and priority recommendations (HOC-N1)* | product specialist evidence is 335.3h old (SLA: 48h) | 🔴 error |

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 0d | ✅ compliant |
| @product | 周一 00:00 UTC | 2d | 14d | ❌ breach |
| @quality | 每日 00:00 UTC | 1d | 0d | ✅ compliant |
| @docs | 每日 00:00 UTC | 2d | 14d | ❌ breach |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

- [ ] **@product**: 报告逾期 14 天 → 手动触发或检查 cron
- [ ] **@docs**: 报告逾期 14 天 → 手动触发或检查 cron
- [ ] **product → orchestrator**: product specialist evidence is 335.3h old (SLA: 48h) → 检查 handoff 时序

## Summary

- **健康 agent**: 3/5
- **问题 agent**: 2/5
- **数据流异常**: 1
- **生成时间**: 2026-08-19T15:31:16.729Z