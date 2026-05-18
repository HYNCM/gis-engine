---
agent: task-distributor
period: 2026-W21
generated_at: 2026-05-17T16:35:00Z
repo_revision: "acdf28e"
inputs:
  - docs/archive/2026-05-18/planning/sprint-2026-W21.md
  - docs/planning/sprint-2026-W25-sceneview3d-v1.md
decision_level: advisory
---

# Task Burndown

## 当前结论

原 W21/W23 计划中的 v0.2 checkpoint 关键任务已经提前完成，原 sprint
计划已移入 `docs/archive/2026-05-18/planning/sprint-2026-W21.md`。SceneView3D
v1 RFC 已拆成 W25/W28 专项 sprint，且 W25 的 schema、fixtures、scene
commands、resource load plan gate、package boundary、mock snapshot/query 和 MCP 3D context 已提前完成。下面的 W21/W23 理想燃尽表仅保留
为计划基线；真实状态以“2026-05-17 执行快照”和“2026-05-18 follow-up”为准。

## 初始容量

| Sprint | 日期 | Planned hours | P0/P1 hours | P2 hours |
| --- | --- | ---: | ---: | ---: |
| W21-W22 | 2026-05-18 ~ 2026-05-29 | 152 | 124 | 28 |
| W23-W24 | 2026-06-01 ~ 2026-06-12 | 192 | 160 | 32 |

## Sprint W21-W22 理想燃尽

| 日期 | 计划剩余工时 | 关键交付 |
| --- | ---: | --- |
| 2026-05-18 | 152 | MCP / command schema P1 修复启动 |
| 2026-05-19 | 128 | MCP failure path 方案冻结 |
| 2026-05-20 | 106 | command schema strictness 实现进入 review |
| 2026-05-21 | 86 | v0.2 合同边界启动 |
| 2026-05-22 | 66 | expression contract 初稿 |
| 2026-05-25 | 48 | expression validator 与 command 扩展设计联调 |
| 2026-05-26 | 32 | PMTiles/vector tile source schema 初稿 |
| 2026-05-27 | 18 | resource/perf 缺口方案 |
| 2026-05-28 | 8 | `pnpm build:schema`、`pnpm check` 收口 |
| 2026-05-29 | 0 | sprint review 与 W23 交接 |

## Sprint W23-W24 理想燃尽

| 日期 | 计划剩余工时 | 关键交付 |
| --- | ---: | --- |
| 2026-06-01 | 192 | vector schema/resource policy 实现启动 |
| 2026-06-02 | 164 | MapLibre transformer 初稿 |
| 2026-06-03 | 140 | vector fixtures、snapshot smoke 初稿 |
| 2026-06-04 | 112 | MCP v0.2 contract tests |
| 2026-06-05 | 86 | style diff commands 实现进入 review |
| 2026-06-08 | 58 | beforeLayerId diagnostics 收口 |
| 2026-06-09 | 40 | visual snapshot 场景补齐 |
| 2026-06-10 | 24 | 2.5D/3D boundary 文档化 |
| 2026-06-11 | 8 | `pnpm build:schema`、`pnpm check`、snapshot gate |
| 2026-06-12 | 0 | v0.2 checkpoint audit |

## 风险控制

- W21 两个 P1 已完成；后续 public capability 变更仍必须跑 schema-sync、MCP contract 和 command replay gates。
- vector tile adapter 当前承诺 schema/transformer/diagnostics、snapshot smoke 和本地生成 MVT visual 场景；不承诺解析生产远程 MVT 数据作为默认 PR gate。
- 如果 visual snapshot 环境不可用，PR 可记录 skipped report；release 或 strict gate 不允许跳过。
- fill-extrusion-lite 已作为 experimental beta adapter 落地并补齐 release visual evidence；SceneView3D 后续实现已转入 W25/W28 v1 专项 sprint，不阻塞 v0.2 2D 主线。

## 2026-05-17 执行快照

| Planned task | Status | Evidence |
| --- | --- | --- |
| TASK-2026W23-003 | done | `examples/vector-tile-url/map.json`, schema fixture, snapshot smoke, visual MVT scene |
| TASK-2026W23-004 | done | MCP output schemas, strict capability schema, v0.2 vector/expression tool tests |
| TASK-2026W23-005 | done | deterministic `setPaint` / `setLayout` / `reorderLayer` command coverage |
| TASK-2026W23-006 | done | missing `beforeLayerId` returns `LAYER.NOT_FOUND` at `/beforeLayerId` |
| TASK-2026W23-007 | done | `pnpm test:snapshot:visual` includes GeoJSON and generated vector tile scenes |
| TASK-2026W23-008 | done | `fill-extrusion-lite-beta.md`, `scene3d-boundary.md`, validation boundary diagnostics |
| TASK-2026W23-009 | done | checkpoint audit, release note draft, `pnpm build:schema`, `pnpm check`, strict visual gate evidence |
| POST-2026W21-011 | done | `fill-extrusion-lite` MapLibre beta mapping, capability report, example/schema fixture, snapshot smoke |
| POST-2026W21-013 | done | `pnpm test:perf:nightly` synthetic 1k/10k/100k lifecycle evidence |
| POST-2026W21-016 | done | SceneView3D v1 RFC split into `sprint-2026-W25-sceneview3d-v1.md` task DAG |
| TASK-2026W25-001/002 | done | SceneView3D contract slices and `SceneView3DExtensionSchema` landed ahead of W25 |
| TASK-2026W25-003/004/005/006 | done | SceneView3D invalid fixtures, loader-level resource load plan diagnostics, scene command deterministic patch contract, and `@gis-engine/scene3d` package boundary |
| TASK-2026W27-001 | done | SceneView3D mock snapshot/query contracts with pending resource diagnostics, blank scene diagnostics, and deterministic pick results |
| TASK-2026W27-002 | done | SceneView3D MCP context in `get_context_summary` / `explain_spec` output schemas with extension-only runtime status |
| TASK-2026W27-003 | done | SceneView3D release visual gate evaluates mock snapshot/query evidence, optional renderer visual evidence, and coordinator waiver rules via `pnpm test:release:scene3d` |
| TASK-2026W27-005 | done | SceneView3D v1 alpha gate audit grants conditional contract alpha pass while keeping stable 3D runtime blocked |
