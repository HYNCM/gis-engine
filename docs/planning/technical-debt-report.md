---
agent: product-strategist
period: 2026-05
generated_at: 2026-05-17T14:04:50Z
repo_revision: "bab1327133589b9d5c6b8740ee41686af9ba1553"
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

当前债务不是“代码不能跑”，而是“合同、证据和路线图开始出现漂移”。最危险的不是新功能太少，而是支持矩阵、schema 严格性、MCP 失败契约和测试证据不完全一致。

## 债务优先级

| 排名 | 债务 | 得分 | 证据 | 建议修复 | 置信度 |
| --- | ---: | ---: | --- | --- | --- |
| 1 | MCP failure path 未完全结构化 | 8.10 | `packages/ai/src/mcp/server.ts` | 所有 tool 入口 schema validation，失败返回 Diagnostic | high |
| 2 | Command schema unknown field 未拒绝 | 7.90 | `packages/engine/src/spec/schemas/command.schema.ts` | strict object schema + 回归测试 | high |
| 3 | 表达式矩阵漂移 | 7.75 | docs、validator、adapter capability | 以 v0.2 expression spec 为单一事实源 | high |
| 4 | 命令冲突 / 回放 / 审计语义未完全产品化 | 7.20 | contracts、types、playbook | 写 spec、fixtures、examples | high |
| 5 | 泛 vector tile URL template 仍停留在 backlog | 6.55 | v0.1 MVP、竞品 PMTiles 信号 | 定义 source contract 和安全策略 | high |
| 6 | 资源释放测试覆盖不足 | 6.10 | resource-release tests 与 CI strategy 不一致 | 补 destroy 后 snapshot/query/lifecycle tests | medium |
| 7 | perf smoke 与文档目标不一致 | 5.90 | perf test 仅覆盖 50 个 setView | 收敛文档或补 create/render/query/snapshot/destroy 基线 | medium |
| 8 | 2.5D / 3D 边界未正式收口 | 5.85 | architecture/research docs | 先写 scene3d/fill-extrusion-lite extension spec | medium |
| 9 | v0.1 发布收口未完全关闭 | 4.50 | release checklist | release notes、publish dry-run、package review | high |

## 修复顺序

1. 先修两个 P1：MCP Diagnostic failure path、Command schema strictness。
2. 收敛表达式矩阵和 command replay/audit 语义。
3. 补 vector tile source contract。
4. 补资源释放和 perf smoke 证据。
5. 写 2.5D/3D extension 边界。
6. 关闭 v0.1 发布尾巴。

## 结论

如果只做一件事，优先做“合同对齐”而不是“功能加法”。v0.2 的价值不在于再多几个图层类型，而在于让 AI、开发者、测试和路线图看到同一套稳定协议。
