---
agent: product-strategist
period: 2026-05
generated_at: 2026-05-25T01:57:26Z
repo_revision: "d3c0137"
inputs:
  - README.md
  - AGENTS.md
  - docs/research/competitor-updates-2026-W22.md
  - docs/research/capability-scorecard.md
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

当前 v0.1 已具备 `MapSpec`、commands、diagnostics、snapshot 和 MapLibre adapter 闭环；2026-05-17 v0.2 checkpoint 已完成 generic vector tile、MCP output schema、strict capability report、expression 扩展、style/layer order 稳定化、visual MVT 场景和 2.5D/3D 边界。2026-05-18 已补齐 package dry-run、resource/perf deterministic evidence、command audit trace 产品化、`fill-extrusion-lite` MapLibre beta mapping、3-scene release-capable strict visual runner evidence、1k/10k/100k nightly perf harness、`extensions.scene3d` 边界 fixture、独立 v1 SceneView3D RFC、W25/W28 sprint DAG、`SceneView3DExtensionSchema`、scene source URL policy、invalid fixtures、`@gis-engine/scene3d` package boundary、scene command deterministic patch contract、loader-level resource load plan gate、mock 3D snapshot/query、MCP 3D context、release-runner 3D visual gate、adapter feasibility、alpha gate audit 和 `@gis-engine/scene3d-three-adapter` spike。当前 W21/W23 规划项已完成，W25-001/002/003/004/005/006、W27-001/002/003/004/005 与 W28-001 已提前关闭；W23 的 promotion readiness package 和 final gate 已完成，promotion evidence summaries 继续留在 extension-only context，不进入 public MCP context，stable `view.mode: "scene3d"` 仍保持 blocked。

2026-05-25 W22 竞品核验显示：Mapbox 已把 PMTiles vector source 写入官方 GL JS 示例，MapLibre v5/v6 release drift 需要升级前兼容性审计，CesiumJS/Three.js/3DTilesRendererJS 继续强化 3D 生态预期，MCP tool spec 的 output schema 与本仓库 AI 契约方向一致。路线因此不改成“大跳 3D runtime”，而是进入 W22 competitive signal response：保护 PMTiles/vector source 证据、补 MapLibre version-drift audit，并继续在 adapter-local 边界内推进 SceneView3D lifecycle/snapshot/query/release evidence。

本轮已执行的第一块切片是 `TASK-2026W22-CSI-003`：SceneView3D Three adapter pre-load/post-destroy lifecycle diagnostics 现在有稳定路径，便于 AI 工具和质量门禁解释失败状态。后续工作应只围绕明确 promotion step，不得直接进入 core renderer。

2026-05-27 目标校准：最终产品目标是让使用者通过自然语言调用 AI
生成地图应用，覆盖地理信息要素展示、空间分析和场景浏览。当前路线因此新增
AI-facing 能力摘要：`get_context_summary` / `explain_spec` 输出
`capabilitySummary`，按 `feature-display`、`spatial-analysis` 和
`scene-browsing` 暴露 supported / experimental / blocked 边界、可调用 MCP
工具和证据字段。Scene browsing 仍只作为 `extensions.scene3d`
extension-only 规划证据；stable `view.mode: "scene3d"` 继续 blocked。

2026-05-29 计划收口：SceneView3D stable renderer contract 的 `SRC-001`
through `SRC-005` 已有 prerequisite evidence，覆盖 adapter contract、
dependency boundary、lifecycle、snapshot/query、resource policy 和 release
gate alignment；`SRC-006` 已由 `quality-guardian` 和 `coordinator` 记录为
No-go。stable runtime 继续 blocked，下一轮优先级切回自然语言生成地图应用的
竞品分析、产品设计和任务规划。

## 2026-W22 Iteration Path

| Priority | Track | Plan | Exit Condition |
| --- | --- | --- | --- |
| P0 | SceneView3D governance | Keep stable `view.mode: "scene3d"` blocked after SRC-006 No-go | future stable runtime work starts only from a new accepted promotion task |
| P0 | AI natural-language app generation | Make feature display, spatial analysis, and scene browsing capability boundaries machine-readable | `get_context_summary` and `explain_spec` expose `capabilitySummary` with schema-tested MCP output |
| P0 | Next planning loop | Refresh competitor evidence, product design, and task DAG for natural-language map app generation | competitive-intel, product-strategist, coordinator, and task-distributor produce the next iteration plan |
| P0 | Multi-agent execution efficiency | Route agent work by model tier and reasoning effort while preserving evidence-first gates | `AGENTS.md` and `scripts/agent-runner.mjs` expose `model_policy` guidance for scheduled and human/Codex orchestration |
| P1 | SceneView3D lifecycle evidence | Close path-stable lifecycle diagnostics and keep adapter-local runtime semantics deterministic | adapter tests and smoke lifecycle contract pass |
| P1 | MapLibre/vector compatibility | Add a version-drift audit checklist before changing `maplibre-gl` | checklist names transformer, resource-policy, smoke/visual snapshot, and release-runner implications |
| P1 | Cloud-native examples | Keep PMTiles/vector source examples release-gated | schema fixtures, examples, resource policy, smoke snapshots, and visual snapshots remain aligned |
| P2 | Public docs/DX | Convert gate state into concise user-facing upgrade and capability notes | docs reflect extension-only 3D status and 2D source support without overclaiming |

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
| 1 | SceneView3D promotion readiness | next | W22 evidence and beta gate are complete; W23 promotion-readiness package and gate are complete, but stable runtime remains blocked | execute the next explicit promotion step only after a future stable-runtime approval | medium |

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
| SceneView3D scene commands | `setSceneCamera`、scene source/layer commands、visibility command、schema strictness、patch replay/dry-run/rollback |
| SceneView3D loader resource gate | `validateSceneResourceLoadPlan` covers 3D Tiles JSON/model/texture/worker/timeout/missing-source/unsupported-asset diagnostics |
| SceneView3D mock snapshot/query | `snapshotScene3DMock`、`queryScene3DMock`、pending resource diagnostics、blank-scene diagnostics、deterministic pick results |
| SceneView3D MCP 3D context | `get_context_summary` / `explain_spec` output schema exposes extension-only source/layer/resource/snapshot/query summaries |
| SceneView3D MCP promotion evidence decision | W23 keeps promotion evidence summaries out of public MCP context; `scene3d` stays extension-only |
| SceneView3D release visual gate | `evaluateScene3DReleaseVisualGate`、`pnpm test:release:scene3d`、coordinator waiver and no-bypass deterministic evidence rules |
| SceneView3D adapter feasibility | Official CesiumJS / Three.js / 3D Tiles evidence recommends a narrow Three.js + 3DTilesRendererJS adapter spike |
| SceneView3D alpha gate audit | `sceneview3d-alpha-gate-audit-2026-05-18.md` conditional alpha pass; stable 3D runtime remains blocked |
| SceneView3D Three.js adapter spike | `@gis-engine/scene3d-three-adapter` package, deterministic load plan, resource policy integration, dependency isolation tests |
| SceneView3D renderer evidence handoff | `createScene3DThreeAdapterRendererEvidence` turns future browser/WebGL capture metrics into release-gate compatible renderer evidence while keeping missing, blank, or resource-policy-failing evidence blocked |
| AI orchestration capability summary | `get_context_summary` / `explain_spec` expose `feature-display`, `spatial-analysis`, and `scene-browsing` domains with tool names, evidence, and blocked boundaries |
| SceneView3D stable renderer decision | `SRC-001` through `SRC-005` accepted as prerequisite evidence; `SRC-006` closed as No-go and stable `view.mode: "scene3d"` remains blocked |
| Agent model routing policy | `AGENTS.md` and `scripts/agent-runner.mjs` record model tier and reasoning effort guidance without treating routing metadata as evidence |

## 本月行动

1. W21/W23 当前规划项全部完成。
2. SceneView3D v1 RFC 已拆成 [sprint-2026-W25-sceneview3d-v1.md](./sprint-2026-W25-sceneview3d-v1.md)，且 `TASK-2026W25-001/002/003/004/005/006`、`TASK-2026W27-001/002/003/004/005` 与 `TASK-2026W28-001` 已完成；后续 3D 工作必须按该 DAG 继续执行，不得直接进入 core renderer。
3. SceneView3D renderer evidence 已拆成 [sprint-2026-W22-scene3d-renderer-evidence.md](./sprint-2026-W22-scene3d-renderer-evidence.md)；`TASK-2026W22-001/002/003/004/005` 已完成，beta readiness gate 也已跑通。
4. W23 已创建 [sprint-2026-W23-scene3d-promotion-readiness.md](./sprint-2026-W23-scene3d-promotion-readiness.md)，其 promotion readiness package 和 final gate 已完成，但 stable runtime 仍保持 blocked。
5. W23 stable renderer contract 的 SRC-001 through SRC-006 已完成为 No-go
   决策包；后续不得把该状态表述为 stable runtime Go，除非未来新任务提供真实
   renderer、strict visual evidence 或 release waiver 以及 coordinator Go。
6. 下一轮进入面向自然语言生成地图应用的竞品分析、产品设计和 sprint DAG。

## Feature Spec 建议

| 建议文件 | 阶段 | 关键内容 |
| --- | --- | --- |
| `docs/planning/feature-specs/expression-v0.2.md` | done | 支持矩阵、类型推导、诊断、fixtures |
| `docs/planning/feature-specs/style-diff-layer-order.md` | done | reorder、patch、exportSpec 一致性、视觉预期 |
| `docs/planning/feature-specs/vector-tile-url-template.md` | done | vector tile source、PMTiles parity、安全策略 |
| `docs/planning/feature-specs/fill-extrusion-lite-beta.md` | beta done / visual evidence done | experimental gate、MapLibre beta mapping、snapshot smoke、fallback diagnostics |
| `docs/planning/feature-specs/scene3d-boundary.md` | boundary deepening done | SceneView3D、terrain、glTF、3D Tiles 边界与 snapshot 规则 |
| `docs/planning/feature-specs/sceneview3d-v1-rfc.md` | RFC drafted / sprint split done | camera、sources、layers、resource policy、snapshot、query、commands |
| `docs/planning/feature-specs/sceneview3d-promotion-readiness.md` | active rubric | W23 promotion evidence matrix、owner split、blockers、readiness states |
| `docs/planning/feature-specs/command-conflict-replay-audit.md` | done | `baseRevision`、`traceId`、`author`、`reason`、`sourcePromptHash`、`SuggestedFix` |
