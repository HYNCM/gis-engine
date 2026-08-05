---
generated_at: 2026-08-05T17:29:28.506Z
repo_revision: "3d0e809"
period: 2026-08-06
agent: orchestrator
inputs:
  - scripts/dashboard-generator.mjs
  - docs/planning/handoff-ledger.json
owner: "@orchestrator"
decision_level: info
evidence_run_id: planning-evidence-20260805T171819860Z
---

# Agent Health Dashboard (as of 2026-08-06)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Planning Evidence

| Issue Source | Open | Closed | Total | Required Handoffs |
| --- | ---: | ---: | ---: | --- |
| authenticated | 3 | 35 | 38 | 2/2 consumed |

## Execution Health

| Agent | Cadence | Specialist Report | Last Run | Latest Template | Status | Age |
| --- | --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-08-05 | — | 🟢 fresh | 0d |
| @product | weekly | docs/research/competitor-updates-2026-W32.md | 2026-08-05 | — | 🟢 fresh | 0d |
| @quality | daily | docs/reviews/package-size-budget-quality-decision-2026-08-05.md | 2026-08-05 | docs/reviews/quality-gate-2026-07-06.md (2026-07-06) | 🟢 fresh | 0d |
| @builder | ad-hoc | docs/reviews/package-size-budget-builder-evidence-2026-08-05.md | 2026-08-05 | — | 🟢 ok | 0d |
| @docs | daily | docs/reviews/documentation-audit-2026-08-06.md | 2026-08-05 | docs/reviews/documentation-audit-2026-07-06.md (2026-07-06) | 🟢 fresh | 0d |

## Data Flow Health

✅ 所有 agent-to-agent 数据流时序正常。

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 0d | ✅ compliant |
| @product | 周一 00:00 UTC | 2d | 0d | ✅ compliant |
| @quality | 每日 00:00 UTC | 1d | 0d | ✅ compliant |
| @docs | 每日 00:00 UTC | 2d | 0d | ✅ compliant |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

✅ 当前无待处理操作项。

## Summary

- **健康 agent**: 5/5
- **问题 agent**: 0/5
- **数据流异常**: 0
- **生成时间**: 2026-08-05T17:29:28.506Z
