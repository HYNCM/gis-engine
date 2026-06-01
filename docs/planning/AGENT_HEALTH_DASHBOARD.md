---
generated_at: 2026-06-01T16:40:56.179Z
repo_revision: "caf94e1"
period: 2026-06-01
agent: coordinator
decision_level: info
---

# Agent Health Dashboard (as of 2026-06-01)

> ⚠️ 本 Dashboard 由 `scripts/dashboard-generator.mjs` 自动生成。
> 状态为自动化推断，需 coordinator 审查后确认。

## Execution Health

| Agent | Cadence | Last Report | Last Run | Status | Age |
| --- | --- | --- | --- | --- | --- |
| @coordinator | weekly | weekly-digest.md | 2026-05-29 | 🟢 ok | 3d |
| @competitive-intel | weekly | competitor-updates-2026-W23.md | 2026-06-01 | 🟢 fresh | 1d |
| @code-reviewer | daily | daily-audit-2026-06-01.md | 2026-06-01 | 🟢 fresh | 1d |
| @product-strategist | monthly | monthly-roadmap.md | 2026-05-29 | 🟢 ok | 3d |
| @task-distributor | weekly | task-burndown.md | 2026-05-29 | 🟢 ok | 3d |
| @quality-guardian | daily | quality-gate-2026-06-01.md | 2026-06-01 | 🟢 fresh | 1d |
| @docs-agent | weekly | documentation-audit-2026-06-01.md | 2026-06-01 | 🟢 fresh | 1d |
| @adapter-agent | ad-hoc | — | — | 🟢 ok | — |
| @qa-agent | ad-hoc | — | — | 🟢 ok | — |
| @ai-agent | ad-hoc | — | — | 🟢 ok | — |
| @engine-agent | ad-hoc | — | — | 🟢 ok | — |

## Data Flow Health

| Flow | Issue | Severity |
| --- | --- | --- |
| competitive-intel → coordinator<br/>*竞品报告 → 周报摘要* | 下游报告早于上游 (coordinator: 2026-05-29 < competitive-intel: 2026-06-01) | 🔴 error |
| quality-guardian → coordinator<br/>*门禁决策 → 发布就绪判定* | 下游报告早于上游 (coordinator: 2026-05-29 < quality-guardian: 2026-06-01) | 🔴 error |

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @coordinator | 周一 00:00 UTC | 8d | 3d | ✅ compliant |
| @competitive-intel | 周一 00:00 UTC | 8d | 1d | ✅ compliant |
| @code-reviewer | 每日 00:00 UTC | 2d | 1d | ✅ compliant |
| @product-strategist | 每月 1 日 00:00 UTC | 35d | 3d | ✅ compliant |
| @task-distributor | 周一 00:00 UTC | 8d | 3d | ✅ compliant |
| @quality-guardian | 每日 00:00 UTC | 2d | 1d | ✅ compliant |
| @docs-agent | 周一 00:00 UTC | 8d | 1d | ✅ compliant |

> ℹ️ ad-hoc agent (adapter-agent, qa-agent, ai-agent, engine-agent) 无固定 SLA。

## Action Items

- [ ] **competitive-intel → coordinator**: 下游报告早于上游 (coordinator: 2026-05-29 < competitive-intel: 2026-06-01) → 检查 handoff 时序
- [ ] **quality-guardian → coordinator**: 下游报告早于上游 (coordinator: 2026-05-29 < quality-guardian: 2026-06-01) → 检查 handoff 时序

## Summary

- **健康 agent**: 11/11
- **问题 agent**: 0/11
- **数据流异常**: 2
- **生成时间**: 2026-06-01T16:40:56.190Z