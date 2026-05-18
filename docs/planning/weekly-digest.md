---
agent: coordinator
period: 2026-W20
generated_at: 2026-05-17T16:35:00Z
repo_revision: "acdf28e"
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

当前仓库位于 `acdf28e` 时，主线已经从 v0.1 闭环推进到 v0.2 checkpoint：generic vector tile source、MCP output schema、strict capability report、expression 扩展、deterministic layer order、visual MVT 场景和 2.5D/3D 边界均已完成。质量门禁显示 PR gate 可放行；初始审计发现的 2 个 P1 已关闭。

2026-05-18 follow-up：package dry-run、resource/perf deterministic evidence、command audit trace 产品化、`fill-extrusion-lite` MapLibre beta mapping、3-scene release-capable strict visual evidence、1k/10k/100k perf nightly evidence、SceneView3D boundary deepening、v1 SceneView3D RFC、W25/W28 DAG、`SceneView3DExtensionSchema`、invalid fixtures、scene commands、loader resource gate、mock snapshot/query、MCP 3D context、release-runner 3D visual gate、adapter feasibility、alpha gate audit 和 package boundary 已补齐；W21/W23 当前规划项已完成，W25-001/002/003/004/005/006 与 W27-001/002/003/004/005 已提前关闭。

## 本周关键信号

| 来源 | 结论 | 影响 | 置信度 |
| --- | --- | --- | --- |
| competitive-intel | Mapbox GL JS 已把 PMTiles 推向核心数据能力，MapLibre v6 预发布持续推进 | v0.2 应提升 PMTiles/vector tile source 规划优先级 | high |
| competitive-intel | MCP structured output 和 Cesium MCP 展示强化了 AI 工具契约趋势 | GIS Engine 的 MCP contract tests 必须成为硬门禁 | high |
| code-reviewer | 命令 schema unknown field P1 已关闭 | schema-first 输入边界恢复一致 | high |
| code-reviewer | MCP 工具失败路径和 output schema P1 已关闭 | AI 工具可信度和可审计性提升 | high |
| quality-guardian | `pnpm build:schema`、`pnpm check`、默认 visual snapshot 均通过 | 当前代码可通过 PR gate | high |
| quality-guardian | strict visual snapshot 在默认沙箱内受 Chromium 权限限制，release-capable runner 已通过 | release runner 必须具备浏览器/WebGL 权限 | high |
| product-strategist | v0.2 checkpoint 已完成核心 planned tasks；2026-05-18 已补齐 package/resource/perf/command audit/2.5D beta follow-up，并将 SceneView3D RFC 拆成 W25/W28 DAG；schema foundation、fixtures、loader resource gate、scene commands、mock snapshot/query、MCP 3D context、release visual gate、adapter feasibility、alpha audit 和 package boundary 已完成 | 下一阶段规划独立 Three.js adapter spike | high |
| task-distributor | W21/W23 planned tasks 已形成执行快照 | 依赖图需要从阻断模式更新为完成证据模式 | high |

## P0 / P1 状态

| 优先级 | 项 | 依据 | 动作 |
| --- | --- | --- | --- |
| P0 | 当前代码阻断项 | quality gate 未发现源码级阻断项 | 无需立即阻断 merge |
| P1 | 命令 schema unknown field | `packages/engine/src/spec/schemas/command.schema.ts` | 已关闭，保留回归测试 |
| P1 | MCP tool input/error/output contract | `packages/ai/src/mcp/server.ts` | 已关闭，tool descriptor 暴露 `outputSchema` |
| P1 | PMTiles/vector tile source RFC | Mapbox v3.21/v3.23 PMTiles 变更 | 已实现 generic vector source contract、transformer、fixtures、snapshot |
| P1 | release runner visual snapshot 权限 | strict visual gate 环境风险 | 固化 CI/release runner 权限 |

## 本周决策

1. v0.2 不直接扩 3D 实现，先写 2.5D/3D extension 边界。
2. v0.2 的首要工程项已按合同对齐执行：command schema、MCP diagnostics/output schema、expression matrix、style diff/layer order。
3. PMTiles/vector tile source 已从 backlog 升级并完成当前 checkpoint。
4. 下一轮 sprint 不再从零拆分 SceneView3D；W25 已完成 schema、fixtures、loader resource gate、scene commands 和 package boundary，W27-001/002/003/004/005 已完成，后续应沿既有 DAG 规划独立 Three.js adapter spike 和真实 renderer visual evidence。

## 下游交接

- `code-reviewer -> task-distributor`: 两个 P1 审计缺口已关闭，P2 resource/perf 已补 deterministic 与 nightly evidence。
- `competitive-intel -> product-strategist`: PMTiles/vector tile、MCP structured contract、3D boundary 已纳入并完成 checkpoint。
- `quality-guardian -> coordinator`: PR gate 可放行；release gate 需要正式 runner 再跑 strict visual snapshot。
- `product-strategist -> task-distributor`: W21/W23 当前规划项完成；3D 工作已进入 W25/W28 SceneView3D DAG，下一批应聚焦 W28 adapter spike，不直接接入 core runtime。
