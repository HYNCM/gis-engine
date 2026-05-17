---
agent: product-strategist
period: 2026-05
generated_at: 2026-05-17T14:04:50Z
repo_revision: "bab1327133589b9d5c6b8740ee41686af9ba1553"
inputs:
  - README.md
  - AGENTS.md
  - docs/research/competitor-updates-2026-W20.md
  - docs/reviews/daily-audit-2026-05-17.md
  - docs/reviews/quality-gate-2026-05-17.md
  - docs/spec/contracts-and-interfaces.md
  - docs/engineering/v0.1-release-checklist.md
  - docs/engineering/ci-test-strategy.md
decision_level: advisory
---

# Monthly Roadmap: 2026-05

## 结论

当前 v0.1 已具备 `MapSpec`、commands、diagnostics、snapshot 和 MapLibre adapter 闭环。下一阶段不应继续扩大 runtime 骨架，而应聚焦三件事：更完整且一致的 2D AI 可操作性、多 agent 协作的命令安全、以及受控进入 2.5D/3D 的分期边界。

## 路线总览

| 阶段 | 产品目标 | 核心能力 | 退出条件 |
| --- | --- | --- | --- |
| v0.1 final | 发布基线封板 | release notes、publish dry-run、package review、strict visual evidence | v0.1 可作为 v0.2 稳定基座 |
| v0.2 | 2D 可操作性增强 | command schema strictness、MCP diagnostics、expression 子集、style diff/layer order、vector tile URL template | AI 生成的 2D 地图可稳定回放、可验证、可解释 |
| v0.2.x | 协作安全 + 2.5D beta | command 冲突语义、trace/replay/audit、fill-extrusion-lite experimental | 多 agent 编辑不破坏回放一致性，2.5D 不污染核心 schema |
| v1.0 | 3D 平台 | SceneView3D、terrain、glTF、3D Tiles adapter、3D snapshot/query | 3D 边界先于实现收敛，3D 成为 capability-gated 维度 |

## 优先级排序

| 排名 | 事项 | 得分 | 证据 | 行动 | 置信度 |
| --- | ---: | ---: | --- | --- | --- |
| 1 | MCP tool contract hardening | 8.10 | code-reviewer P1；MCP/Structured Outputs 外部趋势 | 统一 schema validation 和 Diagnostic failure path | high |
| 2 | Command schema strictness | 7.90 | code-reviewer P1；schema-first repo rule | 拒绝 unknown command fields，补回归测试 | high |
| 3 | 表达式合同收敛与扩展 | 7.55 | `expression-validator.ts`、adapter capability、docs | 冻结 v0.2 expression matrix | high |
| 4 | 命令冲突 / 回放 / 审计合同 | 7.05 | contracts、implementation playbook、types | 写 command-conflict/replay/audit spec 和 fixtures | high |
| 5 | style diff 与 layer order 稳定化 | 6.90 | buildPatch tests、command semantics | 规格化 reorder/diff/exportSpec 一致性 | high |
| 6 | PMTiles/vector tile URL template | 6.75 | Mapbox PMTiles releases、competitor updates | 定义 source contract 和 resource policy | high |
| 7 | fill-extrusion-lite beta | 5.85 | core capabilities、3D roadmap | 仅在 `extensions` 和 capability gate 中定义 experimental 路径 | medium |
| 8 | SceneView3D 边界规格 | 5.30 | Cesium/Three.js signal、framework review | 先写 scene3d/camera/source/layer/snapshot 边界 spec | medium |

## 本月行动

1. 关闭 v0.1 发布尾巴：release notes、npm publish dry-run、package file review、正式 runner strict visual snapshot。
2. 在 W21 优先处理两个 P1 审计缺口：command schema strictness、MCP diagnostic failure path。
3. 完成 v0.2 三个核心 spec：expression、command conflict/replay/audit、style diff/layer order。
4. 将 PMTiles/vector tile source RFC 提升为 v0.2 数据入口工作。
5. 将 2.5D/3D 继续作为 extension/capability-gated 规划，不提前进入核心 schema。

## Feature Spec 建议

| 建议文件 | 阶段 | 关键内容 |
| --- | --- | --- |
| `docs/planning/feature-specs/mcp-tool-contract-hardening.md` | v0.2 | tool input/output schema、Diagnostic failure path、contract tests |
| `docs/planning/feature-specs/command-schema-strictness.md` | v0.2 | strict object schema、unknown field rejection、fixture coverage |
| `docs/planning/feature-specs/expression-v0.2.md` | v0.2 | 支持矩阵、类型推导、诊断、fixtures |
| `docs/planning/feature-specs/command-conflict-replay-audit.md` | v0.2.x | `baseRevision`、`traceId`、`author`、`reason`、`sourcePromptHash`、`SuggestedFix` |
| `docs/planning/feature-specs/style-diff-layer-order.md` | v0.2 | reorder、patch、exportSpec 一致性、视觉预期 |
| `docs/planning/feature-specs/vector-tile-url-template.md` | v0.2 | vector tile source、PMTiles parity、安全策略 |
| `docs/planning/feature-specs/fill-extrusion-lite-beta.md` | v0.2.x | experimental gate、snapshot contract、fallback diagnostics |
| `docs/planning/feature-specs/scene3d-boundary.md` | v1.0 | SceneView3D、terrain、glTF、3D Tiles 边界与 snapshot 规则 |
