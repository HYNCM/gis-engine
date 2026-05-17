---
agent: product-strategist
period: 2026-05
generated_at: 2026-05-17T16:35:00Z
repo_revision: "acdf28e"
inputs:
  - README.md
  - AGENTS.md
  - docs/reviews/daily-audit-2026-05-17.md
  - docs/reviews/quality-gate-2026-05-17.md
  - docs/engineering/v0.1-release-checklist.md
  - docs/engineering/ci-test-strategy.md
decision_level: advisory
---

# Technical Debt Report: 2026-05

## 总体判断

当前债务已经从“合同漂移”收敛为“v1 能力规划”。两个 P1 合同缺口已关闭，v0.2 checkpoint 已完成；package 发布检查、deterministic resource/perf 证据、command audit trace 产品化、`fill-extrusion-lite` beta adapter、3-scene release-capable strict visual evidence、1k/10k/100k nightly perf harness 和 SceneView3D boundary fixture 已补齐。

## 债务优先级

| 排名 | 债务 | 得分 | 证据 | 建议修复 | 置信度 |
| --- | ---: | ---: | --- | --- | --- |
| 1 | SceneView3D 实现尚未进入 v1 RFC | 4.10 | scene3d-boundary spec、`extensions.scene3d` fixture | 新周期中先写 schema/resource/snapshot/query RFC，再实现 renderer | medium |

## 修复顺序

1. 将 SceneView3D 实现移入独立 v1 RFC，不作为当前 v0.2 欠债处理。

## 结论

如果只做一件事，优先做“发布证据闭环”而不是继续加功能。v0.2 checkpoint 的价值已经从功能层证明出来，下一步要让 package、runner、测试证据和路线图也看到同一套稳定协议。
