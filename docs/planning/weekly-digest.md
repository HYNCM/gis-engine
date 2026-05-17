---
agent: coordinator
period: 2026-W20
generated_at: 2026-05-17T14:10:00Z
repo_revision: "bab1327"
inputs:
  - AGENTS.md
  - README.md
  - docs/engineering/v0.1-release-checklist.md
  - docs/engineering/ci-test-strategy.md
  - docs/spec/contracts-and-interfaces.md
  - docs/research/competitor-updates-2026-W20.md
  - docs/research/capability-scorecard.md
  - docs/reviews/daily-audit-2026-05-17.md
  - docs/reviews/quality-gate-2026-05-17.md
decision_level: advisory
---

# Weekly Digest: 2026-W20

## 周期结论

本轮已启动 6 个专职智能体并完成即时分析：coordinator、competitive-intel、code-reviewer、product-strategist、task-distributor、quality-guardian 均已返回材料。

当前仓库位于 `bab1327`，主线已经围绕 `MapSpec`、commands、diagnostics、snapshot 和 MCP tools 成型。质量门禁显示 PR gate 可放行；代码审计发现 2 个 P1 质量缺口，需要在 v0.2 任务启动前优先修复或排入 sprint。

## 本周关键信号

| 来源 | 结论 | 影响 | 置信度 |
| --- | --- | --- | --- |
| competitive-intel | Mapbox GL JS 已把 PMTiles 推向核心数据能力，MapLibre v6 预发布持续推进 | v0.2 应提升 PMTiles/vector tile source 规划优先级 | high |
| competitive-intel | MCP structured output 和 Cesium MCP 展示强化了 AI 工具契约趋势 | GIS Engine 的 MCP contract tests 必须成为硬门禁 | high |
| code-reviewer | 命令 schema 仍接受未知字段 | 破坏 schema-first 输入边界，P1 | high |
| code-reviewer | MCP 工具失败路径没有统一结构化 diagnostics | AI 工具可信度和可审计性不足，P1 | high |
| quality-guardian | `pnpm build:schema`、`pnpm check`、默认 visual snapshot 均通过 | 当前代码可通过 PR gate | high |
| quality-guardian | strict visual snapshot 在沙箱内受 Chromium 权限限制，提权后通过 | release runner 必须具备浏览器/WebGL 权限 | high |
| product-strategist | v0.2 应聚焦 2D AI 可操作性、协作安全、受控 2.5D/3D 边界 | 避免继续扩 runtime 骨架 | high |
| task-distributor | 已拆出 W21-W24 两个 sprint 草案 | 可进入执行排期 | medium |

## P0 / P1 状态

| 优先级 | 项 | 依据 | 动作 |
| --- | --- | --- | --- |
| P0 | 当前代码阻断项 | quality gate 未发现源码级阻断项 | 无需立即阻断 merge |
| P1 | 命令 schema unknown field | `packages/engine/src/spec/schemas/command.schema.ts` | 收紧 command schemas，补拒绝未知字段测试 |
| P1 | MCP tool input/error contract | `packages/ai/src/mcp/server.ts` | 所有 tool 入口走 schema validation，失败返回 Diagnostic |
| P1 | PMTiles/vector tile source RFC | Mapbox v3.21/v3.23 PMTiles 变更 | 进入 v0.2 数据源规划 |
| P1 | release runner visual snapshot 权限 | strict visual gate 环境风险 | 固化 CI/release runner 权限 |

## 本周决策

1. v0.2 不直接扩 3D 实现，先写 2.5D/3D extension 边界。
2. v0.2 的首要工程项不是新图层，而是合同对齐：command schema、MCP diagnostics、expression matrix、style diff/layer order。
3. PMTiles/vector tile source 从 backlog 升为 P1 规划项。
4. 每个 sprint 继续保留 20% 到 30% 给 contract cleanup、test reliability 和 release evidence。

## 下游交接

- `code-reviewer -> task-distributor`: 将两个 P1 审计缺口加入 W21 P0/P1 任务队列。
- `competitive-intel -> product-strategist`: 将 PMTiles、MCP、3D MapSpec extension 纳入月度 roadmap。
- `quality-guardian -> coordinator`: PR gate 可放行；release gate 需要正式 runner 再跑 strict visual snapshot。
- `product-strategist -> task-distributor`: 按表达式合同、命令协作、style diff/layer order、vector tile source 组织 v0.2。
