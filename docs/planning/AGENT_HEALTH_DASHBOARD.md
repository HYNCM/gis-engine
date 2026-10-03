---
generated_at: 2026-10-03T02:27:48.081Z
repo_revision: "44b024c"
period: 2026-10-03
agent: orchestrator
inputs:
  - scripts/dashboard-generator.mjs
  - docs/planning/handoff-ledger.json
owner: "@orchestrator"
decision_level: info
---

# Agent Health Dashboard (as of 2026-10-03)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Execution Health

| Agent | Cadence | Specialist Report | Last Run | Latest Template | Status | Age |
| --- | --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-10-01 | — | 🟢 fresh | 1d |
| @product | weekly | docs/research/competitor-updates-2026-W40.md | 2026-10-01 | — | 🟢 fresh | 2d |
| @quality | daily | docs/reviews/quality-gate-release-2026-10-01.md | 2026-10-01 | docs/reviews/quality-gate-2026-07-06.md (2026-07-06) | 🔴 overdue | 2d |
| @builder | ad-hoc | docs/reviews/review-fixes-builder-evidence-2026-10-01.md | 2026-10-01 | — | 🟢 ok | 2d |
| @docs | daily | docs/reviews/documentation-audit-2026-10-01.md | 2026-10-01 | docs/reviews/documentation-audit-2026-07-06.md (2026-07-06) | 🟢 fresh | 2d |

## Data Flow Health

| Flow | Issue | Severity |
| --- | --- | --- |
| builder → quality<br/>*implementation evidence and test results (HOC-N2)* | quality specialist evidence is 36.4h old (SLA: 24h) | 🟡 warning |
| quality → orchestrator<br/>*gate pass/block and release readiness (HOC-N3)* | quality specialist evidence is 36.4h old (SLA: 24h) | 🔴 error |

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 1d | ✅ compliant |
| @product | 周一 00:00 UTC | 2d | 2d | ✅ compliant |
| @quality | 每日 00:00 UTC | 1d | 2d | ❌ breach |
| @docs | 每日 00:00 UTC | 2d | 2d | ✅ compliant |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

- [ ] **@quality**: 报告逾期 2 天 → 手动触发或检查 cron
- [ ] **builder → quality**: quality specialist evidence is 36.4h old (SLA: 24h) → 检查 handoff 时序
- [ ] **quality → orchestrator**: quality specialist evidence is 36.4h old (SLA: 24h) → 检查 handoff 时序

## Summary

- **健康 agent**: 4/5
- **问题 agent**: 1/5
- **数据流异常**: 2
- **生成时间**: 2026-10-03T02:27:48.081Z