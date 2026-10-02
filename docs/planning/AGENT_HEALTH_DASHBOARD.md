---
generated_at: 2026-10-02T02:41:14.823Z
repo_revision: "63b21c2"
period: 2026-10-02
agent: orchestrator
inputs:
  - scripts/dashboard-generator.mjs
  - docs/planning/handoff-ledger.json
owner: "@orchestrator"
decision_level: info
---

# Agent Health Dashboard (as of 2026-10-02)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 orchestrator 审查后确认。

## Execution Health

| Agent | Cadence | Specialist Report | Last Run | Latest Template | Status | Age |
| --- | --- | --- | --- | --- | --- | --- |
| @orchestrator | weekly | docs/planning/weekly-digest.md | 2026-10-01 | — | 🟢 fresh | 0d |
| @product | weekly | docs/research/competitor-updates-2026-W40.md | 2026-10-01 | — | 🟢 fresh | 1d |
| @quality | daily | docs/reviews/quality-gate-release-2026-10-01.md | 2026-10-01 | docs/reviews/quality-gate-2026-07-06.md (2026-07-06) | 🟢 fresh | 1d |
| @builder | ad-hoc | docs/reviews/review-fixes-builder-evidence-2026-10-01.md | 2026-10-01 | — | 🟢 ok | 1d |
| @docs | daily | docs/reviews/documentation-audit-2026-10-01.md | 2026-10-01 | docs/reviews/documentation-audit-2026-07-06.md (2026-07-06) | 🟢 fresh | 1d |

## Data Flow Health

✅ 所有 agent-to-agent 数据流时序正常。

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 2d | 0d | ✅ compliant |
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
- **生成时间**: 2026-10-02T02:41:14.823Z