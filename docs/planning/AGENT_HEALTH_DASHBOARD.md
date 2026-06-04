---
generated_at: 2026-06-04T02:13:37.959Z
repo_revision: "6d49960"
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
| @orchestrator | weekly | weekly-digest.md | 2026-05-29 | 🟢 ok | 6d |
| @product | weekly | competitor-updates-2026-W23.md | 2026-06-01 | 🟢 ok | 2d |
| @quality | daily | quality-gate-2026-06-04.md | 2026-06-03 | 🟢 fresh | 0d |
| @builder | ad-hoc | — | — | 🟢 ok | — |
| @docs | weekly | documentation-audit-2026-06-03.md | 2026-06-03 | 🟢 fresh | 1d |

## Data Flow Health

| Flow | Issue | Severity |
| --- | --- | --- |
| product → orchestrator<br/>*竞品报告 + 优先级 → 周报规划 (HOC-N1)* | 下游报告早于上游 (orchestrator: 2026-05-29 < product: 2026-06-01) | 🔴 error |
| quality → orchestrator<br/>*门禁通过/阻断 → 发布就绪 (HOC-N3)* | 下游报告早于上游 (orchestrator: 2026-05-29 < quality: 2026-06-03) | 🔴 error |

## SLA Compliance

| Agent | SLA | Max Latency | Current | Status |
| --- | --- | --- | --- | --- |
| @orchestrator | 周一 00:00 UTC | 8d | 6d | ✅ compliant |
| @product | 周一 00:00 UTC | 8d | 2d | ✅ compliant |
| @quality | 每日 00:00 UTC | 2d | 0d | ✅ compliant |
| @docs | 周一 00:00 UTC | 8d | 1d | ✅ compliant |

> ℹ️ ad-hoc agent (builder) 无固定 SLA。

## Action Items

- [ ] **product → orchestrator**: 下游报告早于上游 (orchestrator: 2026-05-29 < product: 2026-06-01) → 检查 handoff 时序
- [ ] **quality → orchestrator**: 下游报告早于上游 (orchestrator: 2026-05-29 < quality: 2026-06-03) → 检查 handoff 时序

## Summary

- **健康 agent**: 5/5
- **问题 agent**: 0/5
- **数据流异常**: 2
- **生成时间**: 2026-06-04T02:13:37.970Z