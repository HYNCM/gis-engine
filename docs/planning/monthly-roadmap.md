---
agent: product-strategist
period: 2026-05
generated_at: 2026-05-29T10:20:00Z
repo_revision: "d628fd1454a44859e57d8996343413684a541c30"
inputs:
  - README.md
  - AGENTS.md
  - docs/research/competitor-updates-2026-W22.md
  - docs/research/capability-scorecard.md
  - docs/planning/feature-specs/natural-language-map-app-generation.md
  - docs/planning/feature-specs/spatial-analysis-readiness.md
  - docs/planning/sprint-2026-W23-ai-map-app-generation.md
  - docs/planning/sprint-2026-W23-generation-quality-hardening.md
  - docs/reviews/nlq-001-prompt-planner-boundary-2026-05-29.md
  - docs/reviews/nlq-002-planner-provenance-evidence-2026-05-29.md
  - docs/reviews/nlq-003-spatial-query-evidence-2026-05-29.md
  - docs/reviews/nlq-004-export-manifest-evidence-2026-05-29.md
  - docs/planning/feature-specs/cloud-native-source-readiness.md
  - docs/reviews/nlq-006-scene-browsing-blocker-visibility-2026-05-29.md
  - docs/reviews/nlq-007-serialized-quality-hardening-planning-2026-05-29.md
  - docs/planning/feature-specs/generated-app-delivery-ux.md
  - docs/archive/2026-05-30/planning/sprint-2026-W22-ai-native-next-loop.md
  - docs/archive/2026-05-30/research/competitor-updates-2026-W20.md
  - docs/archive/2026-05-30/reviews/daily-audit-2026-05-17.md
  - docs/archive/2026-05-30/reviews/quality-gate-2026-05-17.md
  - docs/spec/contracts-and-interfaces.md
  - docs/archive/2026-05-30/engineering/v0.1-release-checklist.md
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

2026-05-29 当前核验：ArcGIS Maps SDK JS 官方 AI components 文档已经把
agentic mapping applications 定义为以自然语言为主要 UI 的 web map 交互，
并提供导航、数据探索、统计/属性/空间查询和 agent orchestration。W23 因此
正式进入 natural-language map app generation 规划：GIS Engine 的差异化不是
直接复制聊天 UI，而是把每次生成落到 `MapSpec`、commands、diagnostics、
snapshot 和 export evidence 上。

2026-05-29 第二轮竞品核验和 NLA 收口后，W23 的下一阶段不再重开
NLA-001 through NLA-008，而是进入 generation quality hardening：补 typed
prompt planner/parser contract、planner quality/provenance evidence、spatial
query evidence、generated-app export manifest、cloud-native source readiness
matrix，并继续保持 SceneView3D blocker transparency。外部证据来自 ArcGIS
AI components、MapLibre/Mapbox style specs、PMTiles v3、GeoParquet 1.1、
FlatGeobuf range semantics、OpenLayers GeoZarr/GeoTIFF、MCP schema contracts
以及 structured outputs / computer-use 工具安全要求。

2026-05-29 NLQ-001 执行结果：typed prompt planner boundary 已落地为
`MapGenerationPromptPlannerInputSchema`、`MapGenerationPromptPlanSchema` 和
`planMapGenerationRequest()`。它只接受 prompt hash 加 structured intent，
输出 `MapGenerationRequest`-compatible handoff，并默认拒绝 raw prompt
retention。下一步转入 planner quality/provenance evidence。

2026-05-29 NLQ-002 执行结果：`GenerationEvidenceBundleSchema` 已新增
`plannerEvidence`，覆盖 planner confidence、prompt/trace provenance、
accepted/unsupported intent fields、source prompt hashes 和 planner
diagnostics。下一步转入 spatial query evidence。

2026-05-29 NLQ-003 执行结果：`MapGenerationCommandSkeletonSchema` 已新增
`analysisEvidence`，`GenerationEvidenceBundleSchema` 已新增
`spatialQueryEvidence`。点 / bbox readiness 现在由 deterministic query cases
提供 feature count、layer/source ids 和 diagnostic counts；buffer、overlay、
routing、aggregation、intersection 继续保持 blocked。下一步转入 generated-app
export manifest hardening。

2026-05-29 NLQ-004 执行结果：`export_example_app` 已支持 compact
`generationEvidence` manifest summary，`createGenerationEvidenceBundle()` 会把
planner、spatial query、snapshot、export 和 diagnostic summary 自动带入
example manifest；仍不写文件、不返回文件内容、不新增 MCP 工具名。下一步转入
cloud-native source readiness matrix。

2026-05-29 NLQ-005 执行结果：`docs/planning/feature-specs/cloud-native-source-readiness.md`
已记录 GeoJSON、raster、vector tile、PMTiles、GeoParquet、FlatGeobuf、
GeoTIFF、GeoZarr 的 supported / readiness-only / blocked 状态、resource
policy 路径、query readiness 和后续契约要求。下一步转入 SceneView3D blocker
visibility。

2026-05-29 NLQ-006 执行结果：`export_example_app` 的 compact
`generationEvidence` manifest summary 已新增 `sceneBrowsing`，显式保留
extension-only 状态、`stableViewMode: false`、`runtimeSupported: false`、source
/ layer counts 和 `SCENE3D.STABLE_RUNTIME_*` blocker codes；仍不支持
`snapshot.renderer: "scene3d"`。下一步转入 serialized planning closure。

2026-05-29 NLQ-007 执行结果：generation quality hardening batch 已序列化封账；
NLQ-001 through NLQ-007 均有 owner evidence / contract artifact，下一步进入新一轮
competitive-intel、product-strategist、coordinator 和 task-distributor 规划循环。

2026-05-29 下一轮规划：`docs/planning/feature-specs/generated-app-delivery-ux.md`
和 `docs/archive/2026-05-30/planning/sprint-2026-W22-ai-native-next-loop.md` 已把新批次聚焦到
generated-app delivery UX、acceptance/confirmation states、cloud-native source
promotion candidates、spatial-analysis promotion criteria 和 extension-only
scene browsing copy。

2026-05-30 AIN-001/002 执行结果：generated-app delivery UX 和
acceptance/confirmation states 已落为 `generationEvidence.delivery` 合同。
compact manifest 与 full `GenerationEvidenceBundle` 现在公开
`ready`、`blocked`、`needs-confirmation`、`follow-up-required` 状态、
confirmation boundaries、source readiness 和 follow-up tasks；未新增 MCP tool
name，`export_example_app` 仍不写文件。

2026-05-30 AIN-003/004 执行结果：cloud-native source promotion candidates 和
spatial-analysis promotion criteria 已拆成未来实现前置门禁；PMTiles、
GeoParquet、FlatGeobuf、GeoTIFF、GeoZarr 以及 buffer、intersection、overlay、
routing、aggregation 仍保持 blocked 或 readiness-only，直到 schema、
resource-policy、diagnostic、fixture、query/export 和 MCP exposure gates 落地。

2026-05-30 AIN-005 执行结果：scene browsing delivery copy/evidence 已收口为
extension-only；`sceneBrowsing.state`、`stableRuntimeBlocked`、stable blocker
codes 和 README/AI docs 均保持 stable `view.mode: "scene3d"` blocked。AIN batch
已完成，下一轮应从竞品分析、产品设计和任务规划启动。

2026-05-30 planning loop update: 当前队列已清空，系统切换到迭代规划态。基于
ArcGIS AI components、Mapbox/MapLibre source/runtime drift、Cesium/Three/
3DTilesRendererJS evidence pressure 以及 PMTiles/cloud-native data signals，
下一轮产品主题定为 Generated App Review Console。目标不是扩展新的 MCP 工具或
runtime 能力，而是把已存在的 `generationEvidence.delivery`、diagnostics、
command trace、snapshot/export evidence、source readiness、spatial readiness
和 extension-only scene browsing 转成可审查、可验收的交付面。
2026-05-30 execution update: `GIR-002`、`GIR-003`、`GIR-004`、`GIR-005` 与
`GIR-006` 已完成，Generated App Review Console batch 已关闭，下一步切回
planning state，刷新竞品、产品设计和下一批任务 DAG。
2026-05-30 post-GIR planning update: 新一轮 planning 已完成，下一批任务为
Spatial Query Evidence Hardening。`SQH-001` 边界冻结已完成，当前最高优先级
执行任务是 `TASK-2026W23-SQH-002`。
2026-05-30 SQH-002 execution update: explicit query capability gate 已接入
`GenerationEvidenceBundleSchema.spatialQueryEvidence.capabilityGate`，下一步
最高优先级执行任务是 `TASK-2026W23-SQH-003`。
2026-05-30 SQH-003 execution update: invalid point/bbox/source diagnostics 已
接入 case-local evidence，下一步最高优先级执行任务是
`TASK-2026W23-SQH-004`。
2026-05-30 SQH-004 execution update: result caps and deterministic fixture
hashes 已接入 spatial query case evidence，下一步最高优先级执行任务是
`TASK-2026W23-SQH-005`。
2026-05-31 SQH-005 execution update: hardened query evidence 已映射进
`generationEvidence.delivery.spatialQueryReadiness` 与 `data-and-analysis`
section，下一步最高优先级执行任务是 `TASK-2026W23-SQH-006`。
2026-05-31 SQH-006 execution update: quality gate 已通过并序列化 closure。
Spatial Query Evidence Hardening sprint 已关闭，下一步回到 planning state 刷新
竞品、产品设计和任务 DAG。
2026-05-31 planning refresh: MapLibre/Mapbox package evidence 仍显示 source
drift 压力。下一批任务打开为 MapLibre Source Drift Audit；`MLD-001` 已冻结
边界和 sprint DAG。
2026-06-01 MLD closure update: `MLD-002` 已由
`docs/reviews/mld-002-maplibre-drift-audit-2026-05-31.md` 接受为
adapter/source compatibility evidence；`MLD-003` 关闭 resource/delivery
evidence；`MLD-004` 记录本批次 MapLibre package movement No-go。`SourceLoader`
已作为 contract-only surface 存在，但 runtime source loading 仍不在本批次范围。
2026-06-01 W23 planning refresh: 当前竞品/package evidence 已刷新到
`docs/research/competitor-updates-2026-W23.md`。下一批任务打开为 AI Map
Workbench Product Boundary；`AMW-006` 已冻结产品边界和 sprint DAG，`AMW-007`
已由 `docs/planning/feature-specs/ai-map-workbench-provider-administration.md`
与 `docs/reviews/amw-007-provider-resource-admin-2026-06-01.md` 收口 provider
credential/resource administration design，`AMW-008` 已由
`docs/planning/feature-specs/ai-map-workbench-durable-audit.md` 与
`docs/reviews/amw-008-durable-audit-retention-export-2026-06-01.md` 收口
durable audit retention/export design。当前下一步执行 `TASK-2026W23-AMW-009`，
设计 command-safe review actions；不得直接把 `examples/ai-map-workbench` 推成
product app 或 hosted system。

## 2026-W22 Iteration Path

| Priority | Track | Plan | Exit Condition |
| --- | --- | --- | --- |
| P0 | Generated App Review Console | Turn generated-app delivery evidence into an inspectable acceptance handoff | `GIR-001` through `GIR-006` are done; next work starts from a fresh planning loop |
| P0 | Spatial Query Evidence Hardening | Make point/bbox query evidence explicit, bounded, and delivery-mappable | `SQH-001` through `SQH-006` are done; next work starts from a fresh planning loop |
| P0 | MapLibre Source Drift Audit | Audit MapLibre/Mapbox source and renderer drift before package movement | `MLD-001` through `MLD-004` are done; package movement remains no-go until a future task refreshes official evidence and strict visual gates |
| P0 | AI Map Workbench product boundary | Define the gates before the provider-gated example can become a product review surface | `AMW-006` through `AMW-008` are done; `AMW-009` designs command-safe review actions next |
| P0 | SceneView3D governance | Keep stable `view.mode: "scene3d"` blocked after SRC-006 No-go | future stable runtime work starts only from a new accepted promotion task |
| P0 | AI natural-language app generation | Make feature display, spatial analysis, and scene browsing capability boundaries machine-readable | `get_context_summary` and `explain_spec` expose `capabilitySummary` with schema-tested MCP output |
| P0 | W23 planning refresh | Refresh competitor evidence, product design, and task DAG for the next bounded workstream | done through `AMW-008`; active execution starts at `AMW-009` |
| P0 | Multi-agent execution efficiency | Route agent work by model tier and reasoning effort while preserving evidence-first gates | `AGENTS.md` and `scripts/agent-runner.mjs` expose `model_policy` guidance for scheduled and human/Codex orchestration |
| P1 | SceneView3D lifecycle evidence | Close path-stable lifecycle diagnostics and keep adapter-local runtime semantics deterministic | adapter tests and smoke lifecycle contract pass |
| P1 | MapLibre/vector compatibility | Add a version-drift audit checklist before changing `maplibre-gl` | checklist names transformer, resource-policy, smoke/visual snapshot, and release-runner implications |
| P1 | Cloud-native examples | Keep PMTiles/vector source examples release-gated | schema fixtures, examples, resource policy, smoke snapshots, and visual snapshots remain aligned |
| P2 | Public docs/DX | Convert gate state into concise user-facing upgrade and capability notes | docs reflect extension-only 3D status and 2D source support without overclaiming |

## 2026-W23 Natural-Language App Generation Path

| Priority | Track | Plan | Exit Condition |
| --- | --- | --- | --- |
| P0 | Product boundary | Freeze prompt -> capabilitySummary -> MapSpec -> commands -> diagnostics -> snapshot/export evidence as the generation spine | done; feature spec and sprint DAG accepted; no stable SceneView3D overclaim |
| P0 | Engine contract | Define the generation `MapSpec` / command skeleton and diagnostics | done; schema/command contract tests and `pnpm build:schema` passed |
| P0 | AI orchestration | Use existing MCP tool names to plan, validate, mutate, snapshot, and export | done; MCP `inputSchema` / `outputSchema` coverage stays complete |
| P1 | Spatial analysis readiness | Keep analysis as point/bbox query readiness and blocked-operation diagnostics first | done as readiness; unsupported buffer/intersection/overlay/routing/aggregation are machine-readable |
| P1 | QA evidence | Add end-to-end prompt evidence scenarios | done; generated app evidence bundle includes validation, trace, snapshot, export, and example evidence |
| P2 | Docs and examples | Explain the flow and limits without presenting natural language as source of truth | done; public docs and examples match gate state |

## 2026-W23 Generation Quality Hardening Path

| Priority | Track | Plan | Exit Condition |
| --- | --- | --- | --- |
| P0 | Prompt planner contract | Define typed prompt planner/parser boundaries without retaining raw prompt text by default | done; planner output is `MapGenerationRequest`-compatible and schema-tested; no MCP alias |
| P0 | Planner evidence | Add quality, provenance, unsupported-intent diagnostics, and trace evidence to the generation bundle | done; prompt evidence exposes confidence/trace without bypassing command-only mutation |
| P0 | Spatial query evidence | Turn point/bbox readiness into explicit evidence while keeping geoprocessing blocked | stable diagnostics for blocked buffer/overlay/routing/aggregation; query evidence tests pass |
| P1 | Export package DX | Harden generated-app export manifest and example evidence | export/example output carries diagnostics, snapshot/export status, and resource notes without side-effect writes |
| P1 | Cloud-native source readiness | Document PMTiles, GeoParquet, FlatGeobuf, GeoTIFF/GeoZarr support states before implementation | source readiness matrix names validation, resource policy, CRS/bbox, and blocked diagnostics |
| P1 | Scene browsing transparency | Keep extension-only SceneView3D context and stable-runtime blocker codes visible | generated-app evidence cannot request `snapshot.renderer: "scene3d"` or stable runtime |

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
| 1 | Generated App Review Console | done | delivery sections, source readiness, spatial readiness, prompt-to-delivery QA, and release wording guardrails are complete through `GIR-006` | consumed by later SQH, MLD, and AMW planning loops | high |
| 2 | Spatial Query Evidence Hardening | done | `SQH-006` records a quality-gate pass and closure after `SQH-005` mapped query states into delivery | consumed by MLD closure and AMW-006 planning refresh | high |
| 3 | MapLibre Source Drift Audit | done / package movement no-go | `MLD-002` adapter/source audit, `MLD-003` resource/delivery evidence, and `MLD-004` Go-No-go gate are recorded | open a new package-movement task only after refreshed official evidence, example loading compatibility, and strict visual gates are available | high |
| 4 | AI Map Workbench product boundary | active | `AMW-006` freezes the product boundary, `AMW-007` records provider credential/resource administration design, and `AMW-008` records durable audit retention/export design | execute `TASK-2026W23-AMW-009` next | high |
| 5 | SceneView3D promotion readiness | parked / no-go | W22 evidence and beta gate are complete; W23 promotion-readiness package and gate are complete, and SRC-006 records No-go | future promotion requires a new stable-runtime task and Go decision | high |

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
3. SceneView3D renderer evidence 已拆成 [sprint-2026-W22-scene3d-renderer-evidence.md](../archive/2026-05-30/planning/sprint-2026-W22-scene3d-renderer-evidence.md)；`TASK-2026W22-001/002/003/004/005` 已完成，beta readiness gate 也已跑通。
4. W23 已创建 [sprint-2026-W23-scene3d-promotion-readiness.md](../archive/2026-05-30/planning/sprint-2026-W23-scene3d-promotion-readiness.md)，其 promotion readiness package 和 final gate 已完成，但 stable runtime 仍保持 blocked。
5. W23 stable renderer contract 的 SRC-001 through SRC-006 已完成为 No-go
   决策包；后续不得把该状态表述为 stable runtime Go，除非未来新任务提供真实
   renderer、strict visual evidence 或 release waiver 以及 coordinator Go。
6. 面向自然语言生成地图应用的竞品分析、产品设计和 sprint DAG 已开启：
   [natural-language-map-app-generation.md](./feature-specs/natural-language-map-app-generation.md)、
   [spatial-analysis-readiness.md](./feature-specs/spatial-analysis-readiness.md)
   和 [sprint-2026-W23-ai-map-app-generation.md](./sprint-2026-W23-ai-map-app-generation.md)。
7. W23 NLA-001 through NLA-008 已完成；下一批任务改由
   [sprint-2026-W23-generation-quality-hardening.md](./sprint-2026-W23-generation-quality-hardening.md)
   承接，不重开已完成的生成骨架任务。
8. AIN-001 through AIN-005 已完成；下一批任务已由
   [sprint-2026-W22-generated-app-review-console.md](../archive/2026-05-30/planning/sprint-2026-W22-generated-app-review-console.md)
   承接，并且 `GIR-001` through `GIR-006` 已完成。当前不再追加实现任务，先回到
   planning state 刷新竞品、产品设计和任务 DAG。
9. Post-GIR planning 已打开
   [sprint-2026-W23-spatial-query-hardening.md](./sprint-2026-W23-spatial-query-hardening.md)。
   `TASK-2026W23-SQH-001`、`TASK-2026W23-SQH-002` 与
   `TASK-2026W23-SQH-003`、`TASK-2026W23-SQH-004` 与
   `TASK-2026W23-SQH-005` 与 `TASK-2026W23-SQH-006` 已完成。当前应回到
   planning state 刷新竞品、产品设计和任务 DAG。
10. MapLibre Source Drift Audit 已打开：
   [maplibre-source-drift-audit.md](./feature-specs/maplibre-source-drift-audit.md)
   与 [sprint-2026-W22-maplibre-source-drift-audit.md](./sprint-2026-W22-maplibre-source-drift-audit.md)。
   `TASK-2026W22-MLD-002` through `TASK-2026W22-MLD-004` 已关闭；package
   movement 当前为 No-go，下一步应回到 planning state。
11. W23 planning refresh 已打开 AI Map Workbench Product Boundary：
   [ai-map-workbench-product-boundary.md](./feature-specs/ai-map-workbench-product-boundary.md)
   与 [sprint-2026-W23-ai-map-workbench-product-boundary.md](./sprint-2026-W23-ai-map-workbench-product-boundary.md)。
   `TASK-2026W23-AMW-006` through `TASK-2026W23-AMW-008` 已关闭，当前最高优先级执行任务是
   `TASK-2026W23-AMW-009`。

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
| `docs/planning/feature-specs/natural-language-map-app-generation.md` | W23 active | prompt、capabilitySummary、MapSpec、commands、diagnostics、snapshot/export evidence |
| `docs/planning/feature-specs/ai-map-workbench-product-boundary.md` | W23 active | provider administration、durable audit、review actions、visual evidence、product promotion gate |
| `docs/planning/feature-specs/ai-map-workbench-provider-administration.md` | W23 active | provider lifecycle、browser-safe metadata、base URL policy、timeout/size diagnostics、leak hardening |
| `docs/planning/feature-specs/ai-map-workbench-durable-audit.md` | W23 active | retention、privacy、access control、export shape、payload caps、deletion behavior |
| `docs/planning/feature-specs/spatial-analysis-readiness.md` | W23 active | point/bbox query readiness、blocked analysis operations、future contract gates |
| `docs/planning/feature-specs/generated-app-review-console.md` | W22 active | delivery review sections、acceptance states、source/spatial readiness cards、scene browsing blockers |
