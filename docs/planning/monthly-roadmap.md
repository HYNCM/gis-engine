---
agent: product-strategist
period: 2026-05
generated_at: 2026-05-17T16:35:00Z
repo_revision: "acdf28e"
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

当前 v0.1 已具备 `MapSpec`、commands、diagnostics、snapshot 和 MapLibre adapter 闭环；2026-05-17 v0.2 checkpoint 已完成 generic vector tile、MCP output schema、strict capability report、expression 扩展、style/layer order 稳定化、visual MVT 场景和 2.5D/3D 边界。2026-05-18 已补齐 package dry-run、resource/perf deterministic evidence、command audit trace 产品化和 `fill-extrusion-lite` MapLibre beta mapping。下一阶段不应继续扩大 runtime 骨架，而应聚焦正式 runner 发布证据和 3D 边界深化。

## 路线总览

| 阶段 | 产品目标 | 核心能力 | 退出条件 |
| --- | --- | --- | --- |
| v0.1 final | 发布基线封板 | release notes、publish dry-run、package review、strict visual evidence | v0.1 可作为 v0.2 稳定基座 |
| v0.2 checkpoint | 2D 可操作性增强 | command schema strictness、MCP diagnostics/output schema、expression 子集、style diff/layer order、vector tile URL template | 已完成，AI 生成的 2D 地图可稳定回放、可验证、可解释 |
| v0.2.x | 协作安全 + 2.5D beta | command audit trace、resource/perf evidence、fill-extrusion-lite beta adapter | 已具备可回放审计和实验 2.5D 映射，后续补 release visual evidence |
| v1.0 | 3D 平台 | SceneView3D、terrain、glTF、3D Tiles adapter、3D snapshot/query | 3D 边界先于实现收敛，3D 成为 capability-gated 维度 |

## 优先级排序

| 排名 | 事项 | 得分 | 证据 | 行动 | 置信度 |
| --- | ---: | ---: | --- | --- | --- |
| 1 | Formal release runner evidence | 8.00 | release checklist；checkpoint 已过工程门禁 | 在正式 runner 归档 strict visual 输出 | high |
| 2 | SceneView3D 边界深化 | 5.30 | Cesium/Three.js signal、framework review | 继续细化 scene3d/camera/source/layer/snapshot 边界 spec | medium |
| 3 | 大数据 perf/nightly evidence | 4.80 | resource/perf gap plan | 将 1k/10k/100k 场景放入 nightly/release runner | medium |

已完成并保留回归证据：

| 事项 | Evidence |
| --- | --- |
| MCP tool contract hardening | `outputSchema`、Diagnostic failure path、MCP integration tests |
| Command schema strictness | strict command schema、unknown field 回归测试 |
| 表达式合同收敛与扩展 | `expression-v0.2.md`、expression validator tests、MCP vector/expression test |
| style diff 与 layer order 稳定化 | command matrix、buildPatch、runtime/adapter tests |
| PMTiles/vector tile URL template | vector source schema、resource policy、MapLibre transformer、examples、snapshot smoke/visual |
| Package dry-run and file review | package metadata, public access, package READMEs, dry-run evidence |
| Deterministic resource/perf evidence | snapshot/query lifecycle tests and create/query/snapshot/destroy smoke budgets |
| Command conflict/replay/audit productization | `collectTrace` API、MCP trace output、conflict audit fixtures、AI map edit audit example |
| fill-extrusion-lite beta adapter | MapLibre `fill-extrusion` mapping、capability report、schema/example fixture、snapshot smoke |

## 本月行动

1. 关闭正式 runner strict visual snapshot 证据。
2. 继续保持 3D 为 extension/capability-gated，不提前进入核心 renderer 承诺。
3. 将大数据 perf/nightly evidence 放入正式 runner 规划。

## Feature Spec 建议

| 建议文件 | 阶段 | 关键内容 |
| --- | --- | --- |
| `docs/planning/feature-specs/expression-v0.2.md` | done | 支持矩阵、类型推导、诊断、fixtures |
| `docs/planning/feature-specs/style-diff-layer-order.md` | done | reorder、patch、exportSpec 一致性、视觉预期 |
| `docs/planning/feature-specs/vector-tile-url-template.md` | done | vector tile source、PMTiles parity、安全策略 |
| `docs/planning/feature-specs/fill-extrusion-lite-beta.md` | beta done / visual release evidence pending | experimental gate、MapLibre beta mapping、snapshot smoke、fallback diagnostics |
| `docs/planning/feature-specs/scene3d-boundary.md` | boundary done / v1 pending | SceneView3D、terrain、glTF、3D Tiles 边界与 snapshot 规则 |
| `docs/planning/feature-specs/command-conflict-replay-audit.md` | done | `baseRevision`、`traceId`、`author`、`reason`、`sourcePromptHash`、`SuggestedFix` |
