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

当前 v0.1 已具备 `MapSpec`、commands、diagnostics、snapshot 和 MapLibre adapter 闭环；2026-05-17 v0.2 checkpoint 已完成 generic vector tile、MCP output schema、strict capability report、expression 扩展、style/layer order 稳定化、visual MVT 场景和 2.5D/3D 边界。2026-05-18 已补齐 package dry-run、resource/perf deterministic evidence、command audit trace 产品化、`fill-extrusion-lite` MapLibre beta mapping、3-scene release-capable strict visual runner evidence、1k/10k/100k nightly perf harness、`extensions.scene3d` 边界 fixture、独立 v1 SceneView3D RFC、W25/W28 sprint DAG、`SceneView3DExtensionSchema`、scene source URL policy、invalid fixtures 和 `@gis-engine/scene3d` package boundary。当前 W21/W23 规划项已完成，W25-001/002/003/006 已提前关闭；3D 后续实现应继续执行 scene commands、loader-level resource enforcement 和 snapshot/query。

## 路线总览

| 阶段 | 产品目标 | 核心能力 | 退出条件 |
| --- | --- | --- | --- |
| v0.1 final | 发布基线封板 | release notes、publish dry-run、package review、strict visual evidence | v0.1 可作为 v0.2 稳定基座 |
| v0.2 checkpoint | 2D 可操作性增强 | command schema strictness、MCP diagnostics/output schema、expression 子集、style diff/layer order、vector tile URL template | 已完成，AI 生成的 2D 地图可稳定回放、可验证、可解释 |
| v0.2.x | 协作安全 + 2.5D beta | command audit trace、resource/perf evidence、fill-extrusion-lite beta adapter | 已具备可回放审计、实验 2.5D 映射和 release visual evidence |
| v1.0 | 3D 平台 | SceneView3D、terrain、glTF、3D Tiles adapter、3D snapshot/query | 3D 边界先于实现收敛，3D 成为 capability-gated 维度 |

## 优先级排序

| 排名 | 事项 | 得分 | 证据 | 行动 | 置信度 |
| --- | ---: | ---: | --- | --- | --- |
| 1 | SceneView3D v1 scene commands + loader enforcement | future | `SceneView3DExtensionSchema`、scene source URL policy、invalid fixtures 和 package boundary 已落地并通过 checks | 继续执行 `TASK-2026W25-005` 和 `TASK-2026W25-004` 剩余 loader-level enforcement | medium |

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
| Release-capable strict visual evidence | `pnpm -s test:release:strict` passed outside the default macOS sandbox with GeoJSON, generated local MVT, and gated `fill-extrusion-lite` visual scenes |
| Large-data perf/nightly evidence | `pnpm -s test:perf:nightly` covers 1k/10k/100k inline GeoJSON create/query/snapshot/destroy |
| SceneView3D boundary deepening | `extensions.scene3d` fixture、reserved enum unsupported diagnostics、v1 entry criteria |
| SceneView3D v1 RFC | camera/source/layer/snapshot/query/resource policy contract draft |
| SceneView3D v1 sprint split | W25/W28 DAG、task ownership、dependencies、finish gates |
| SceneView3D v1 schema foundation | `SceneView3DExtensionSchema`、public type assertions、schema-sync fixture validation |
| SceneView3D scene source URL policy | blocked URL / allowlisted host diagnostics under `/extensions/scene3d/sources/*/url` |

## 本月行动

1. W21/W23 当前规划项全部完成。
2. SceneView3D v1 RFC 已拆成 [sprint-2026-W25-sceneview3d-v1.md](./sprint-2026-W25-sceneview3d-v1.md)，且 `TASK-2026W25-001/002` 已完成；后续 3D 工作必须按该 DAG 继续执行，不得直接进入 core renderer。

## Feature Spec 建议

| 建议文件 | 阶段 | 关键内容 |
| --- | --- | --- |
| `docs/planning/feature-specs/expression-v0.2.md` | done | 支持矩阵、类型推导、诊断、fixtures |
| `docs/planning/feature-specs/style-diff-layer-order.md` | done | reorder、patch、exportSpec 一致性、视觉预期 |
| `docs/planning/feature-specs/vector-tile-url-template.md` | done | vector tile source、PMTiles parity、安全策略 |
| `docs/planning/feature-specs/fill-extrusion-lite-beta.md` | beta done / visual evidence done | experimental gate、MapLibre beta mapping、snapshot smoke、fallback diagnostics |
| `docs/planning/feature-specs/scene3d-boundary.md` | boundary deepening done | SceneView3D、terrain、glTF、3D Tiles 边界与 snapshot 规则 |
| `docs/planning/feature-specs/sceneview3d-v1-rfc.md` | RFC drafted / sprint split done | camera、sources、layers、resource policy、snapshot、query、commands |
| `docs/planning/feature-specs/command-conflict-replay-audit.md` | done | `baseRevision`、`traceId`、`author`、`reason`、`sourcePromptHash`、`SuggestedFix` |
