---
generated_at: 2026-10-01T14:20:36.561Z
repo_revision: "dd96530"
period: 2026-10-01
agent: orchestrator
inputs:
  - scripts/dashboard-generator.mjs
  - docs/planning/handoff-ledger.json
owner: "@orchestrator"
decision_level: info
evidence_run_id: planning-evidence-20261001T142036561Z
---

# Agent Health Dashboard (as of 2026-10-01)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Planning Evidence

| Issue Source | Open | Closed | Total | Required Handoffs |
| --- | ---: | ---: | ---: | --- |
| authenticated | 46 | 54 | 100 | 1/2 consumed |

## Execution Health

| Agent | Cadence | Specialist Report | Last Run | Latest Template | Status | Age |
| --- | --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-10-01 | — | 🟢 fresh | 0d |
| @product | weekly | docs/research/competitor-updates-2026-W40.md | 2026-10-01 | — | 🟢 fresh | 0d |
| @quality | daily | docs/reviews/quality-gate-release-2026-10-01.md | 2026-10-01 | docs/reviews/quality-gate-2026-07-06.md (2026-07-06) | 🟢 fresh | 0d |
| @builder | ad-hoc | docs/reviews/review-fixes-builder-evidence-2026-10-01.md | 2026-10-01 | — | 🟢 ok | 0d |
| @docs | daily | docs/reviews/documentation-audit-2026-10-01.md | 2026-10-01 | docs/reviews/documentation-audit-2026-07-06.md (2026-07-06) | 🟢 fresh | 0d |

## Data Flow Health

| Flow | Issue | Severity |
| --- | --- | --- |
| quality → orchestrator<br/>*gate pass/block and release readiness (HOC-N3)* | orchestrator report is older than quality report | 🔴 error |

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 0d | ✅ compliant |
| @product | 周一 00:00 UTC | 2d | 0d | ✅ compliant |
| @quality | 每日 00:00 UTC | 1d | 0d | ✅ compliant |
| @docs | 每日 00:00 UTC | 2d | 0d | ✅ compliant |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

- [ ] **quality → orchestrator**: orchestrator report is older than quality report → 检查 handoff 时序

## Summary

- **健康 agent**: 5/5
- **问题 agent**: 0/5
- **数据流异常**: 1
- **生成时间**: 2026-10-01T14:20:36.561Z
