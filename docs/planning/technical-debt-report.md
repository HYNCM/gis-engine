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

当前债务已经从“合同漂移”转为“发布证据和长期能力边界”。两个 P1 合同缺口已关闭，v0.2 checkpoint 已完成；剩余风险主要集中在资源/性能证据、正式 release runner、package 发布检查和 3D 后续边界。

## 债务优先级

| 排名 | 债务 | 得分 | 证据 | 建议修复 | 置信度 |
| --- | ---: | ---: | --- | --- | --- |
| 1 | 正式 release runner 证据未固化 | 7.80 | strict visual 在默认 macOS 沙箱受 Chromium Mach port 权限限制 | 在正式 runner 记录 `test:release:strict` 输出 | high |
| 2 | 资源释放测试覆盖仍窄 | 6.10 | resource-release tests 与 CI strategy 不一致 | 补 destroy 后 snapshot/query/lifecycle tests | medium |
| 3 | perf smoke 与长期性能目标仍有距离 | 5.90 | perf test 是小样本 command replay guard | 补 deterministic create/render/query/snapshot/destroy 基线，较大数据放 nightly/release | medium |
| 4 | 命令冲突 / 回放 / 审计语义未完全产品化 | 5.70 | contracts、types、playbook | 写 spec、fixtures、examples | high |
| 5 | fill-extrusion-lite 仍只有 boundary | 5.20 | feature spec、schema gate | 未来 beta adapter 明确 capability 后再实现渲染与 visual evidence | medium |
| 6 | SceneView3D 仍为 reserved boundary | 4.90 | scene3d-boundary spec | v1 前继续细化 camera/source/layer/snapshot 规则 | medium |

## 修复顺序

1. 先关闭正式 release runner strict visual 证据。
2. 补资源释放和 perf smoke deterministic evidence。
3. 将 command replay/audit 语义整理成产品化文档和 fixtures。
4. 继续推进 fill-extrusion-lite beta adapter 和 SceneView3D v1 边界。

## 结论

如果只做一件事，优先做“发布证据闭环”而不是继续加功能。v0.2 checkpoint 的价值已经从功能层证明出来，下一步要让 package、runner、测试证据和路线图也看到同一套稳定协议。
