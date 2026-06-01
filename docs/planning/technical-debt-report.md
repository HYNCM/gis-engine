---
agent: product-strategist
period: 2026-05
generated_at: 2026-05-29T10:20:00Z
repo_revision: "d628fd1454a44859e57d8996343413684a541c30"
inputs:
  - README.md
  - AGENTS.md
  - docs/archive/2026-05-30/reviews/daily-audit-2026-05-17.md
  - docs/archive/2026-05-30/reviews/quality-gate-2026-05-17.md
  - docs/archive/2026-05-30/engineering/v0.1-release-checklist.md
  - docs/engineering/ci-test-strategy.md
  - docs/research/competitor-updates-2026-W22.md
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
decision_level: advisory
---

# Technical Debt Report: 2026-05

## 总体判断

当前债务已经从“真实 renderer visual evidence 尚未实现”收敛为“stable runtime promotion 的决策包已经完成，但 stable runtime 仍被有意阻断”。两个 P1 合同缺口已关闭，v0.2 checkpoint 已完成；package 发布检查、deterministic resource/perf 证据、command audit trace 产品化、`fill-extrusion-lite` beta adapter、3-scene release-capable strict visual evidence、1k/10k/100k nightly perf harness、SceneView3D boundary fixture、v1 RFC、v1 sprint DAG、`SceneView3DExtensionSchema`、scene source URL policy、invalid fixtures、`@gis-engine/scene3d` package boundary、scene commands、loader-level resource load plan gate、mock 3D snapshot/query、MCP 3D context、release-runner 3D visual gate、adapter feasibility、alpha gate audit、`@gis-engine/scene3d-three-adapter` spike、renderer evidence handoff、adapter runtime shim、browser visual runner 和 beta readiness gate 已补齐；W23 的 promotion readiness package 和 final gate 已完成，promotion evidence summaries 继续留在 public MCP context 之外。

2026-05-29 update: SRC-006 已正式记录为 No-go decision，stable runtime
promotion 保持 blocked。该债务不再是“缺少当前决策”，而是“未来若重新开启
stable runtime，必须创建新的 promotion task 并补齐真实 renderer 与 strict
visual evidence”。

2026-05-29 generation-quality update: NLA-001 through NLA-008 已完成后，新的
主要产品债务转为“typed prompt planner/parser contract 尚未公开”和
“cloud-native source readiness 仍停留在规划层”。这两项不阻塞当前 evidence-first
生成骨架，但会阻塞自然语言生成地图应用从结构化 handoff 走向更完整的用户体验。

2026-05-29 NLQ-001 update: typed prompt planner/parser contract 已公开为
schema-tested 边界；剩余债务转为 planner quality/provenance evidence 与
cloud-native source readiness。

2026-05-29 NLQ-002 update: planner quality/provenance evidence 已接入
`GenerationEvidenceBundleSchema`；剩余最高优先级债务转为 spatial query
evidence。

2026-05-29 NLQ-003 update: spatial query evidence 已接入
`MapGenerationCommandSkeletonSchema` 和 `GenerationEvidenceBundleSchema`；
剩余最高优先级债务转为 generated-app export manifest 与 cloud-native source
readiness matrix。

2026-05-29 NLQ-004 update: generated-app export manifest summary 已接入
`export_example_app` 和 `createGenerationEvidenceBundle()`；剩余最高优先级债务
转为 cloud-native source readiness matrix。

2026-05-29 NLQ-005 update: cloud-native source readiness matrix 已记录当前
support states、resource-policy paths、query readiness 和 blocked diagnostics；
剩余最高优先级债务转为 scene browsing blocker visibility。

2026-05-29 NLQ-006 update: generated-app manifest evidence 已新增 compact
`sceneBrowsing` summary，保留 extension-only context、mock evidence counts 和
stable-runtime blocker codes；剩余最高优先级债务转为 serialized planning closure。

2026-05-29 NLQ-007 update: generation quality hardening 已完成序列化封账；
剩余债务转为下一轮规划输入，而不是继续在 NLQ batch 内追加实现。

2026-05-29 next-loop update: generated-app delivery UX 与 AI-native next loop
已立项；最高优先级债务转为用户可检查的交付/确认状态，而不是继续补 evidence
spine。

2026-05-30 AIN-001/002 update: generated-app delivery acceptance states 已接入
`generationEvidence.delivery`；剩余最高优先级债务转为 source 与
spatial-analysis promotion criteria。

2026-05-30 AIN-003/004 update: source 与 spatial-analysis promotion criteria
已拆成未来实现门禁；剩余最高优先级债务转为 SceneView3D delivery copy/evidence
follow-through，以及 point/bbox hardening 的后续 fixture/capability gate。

2026-05-30 AIN-005 and GIR planning update: SceneView3D delivery copy/evidence
follow-through 已收口为 extension-only。`GIR-002` 与 `GIR-003` 已完成后，剩余
最高优先级债务转为 Generated App Review Console 的 spatial-analysis review
cards。

2026-05-30 SQH-002 update: explicit query capability gate 已接入
`GenerationEvidenceBundleSchema.spatialQueryEvidence.capabilityGate`，并覆盖
`passed`、`blocked`、`waived` 三态。剩余最高优先级债务转为 invalid
point/bbox/source diagnostics。

2026-05-30 SQH-003 update: invalid point/bbox/source diagnostics 已接入
case-local evidence，覆盖 non-finite point、reversed bbox、missing/hidden
layer/source、URL GeoJSON、PMTiles/vector unsupported source 和 empty result。
剩余最高优先级债务转为 result caps and deterministic fixture evidence。

2026-05-30 SQH-004 update: result caps and deterministic fixture hashes 已接入
`GenerationSpatialQueryCaseEvidence`。剩余最高优先级债务转为 generated-app
delivery mapping。

2026-05-31 SQH-005 update: generated-app delivery mapping 已接入
`delivery.spatialQueryReadiness`，覆盖 query ready、capability-waiver
follow-up 和 blocked capability states。剩余最高优先级债务转为 quality gate and
serialized planning closure。

2026-05-31 SQH-006 update: quality gate and serialized planning closure 已通过
`docs/reviews/sqh-006-quality-gate-closure-2026-05-31.md` 关闭。SQH 当前批次不再
保留实现债务；下一步回到 planning state。

2026-05-31 planning refresh: MapLibre Source Drift Audit 已打开，`MLD-001`
完成边界和 sprint DAG。MapLibre/Mapbox drift 债务转入 `MLD-002` execution。

2026-06-01 MLD closure update: `MLD-002` adapter/source drift evidence,
`MLD-003` resource/delivery evidence, and `MLD-004` package movement No-go 已
完成序列化。MapLibre drift 债务不再是“执行 MLD-002”，而是“任何未来包移动必须
先创建新任务并刷新官方 package/changelog evidence、example loading compatibility
和 strict visual gates”。

2026-06-01 W23 planning refresh: W23 competitor/package evidence 已刷新，AI
Map Workbench Product Boundary 已打开并完成 `AMW-006`；`AMW-007` 已完成
provider credential/resource administration 设计收口；`AMW-008` 已完成 durable
audit retention/export 设计收口；`AMW-009` 已完成 command-safe review actions
设计收口；`AMW-010` 已完成 product-promotion No-go gate。当前债务转为
promotion blocker implementation：在 product app 或 hosted use 前，必须先实现
provider resource enforcement、durable authorized audit、review-action runtime
和 release-grade visual evidence。

2026-06-02 AWP-001 update: AI Map Workbench Product Implementation fresh
planning loop 已打开。`AWP-001` 把 AMW-010 blockers 拆成新的实现 DAG，当前最高
优先级债务转为 `AWP-002` provider resource enforcement：在任何 hosted 或 product
claim 之前，先补 server-side base URL policy、timeout/abort、response byte cap、
stable diagnostics 和 provider leak regressions。

2026-06-02 AWP-002 update: provider resource enforcement 已落地。当前最高优先级
债务转为 `AWP-003` product app ownership and project model：在 durable audit
和 review-action runtime 之前，必须先定义 product owner、route/module boundary、
project identity model 和 non-go 语言，避免把 example 误移动成 hosted/product
surface。

## 债务优先级

| 排名 | 债务 | 得分 | 证据 | 建议修复 | 置信度 |
| --- | ---: | ---: | --- | --- | --- |
| 1 | AWP product ownership boundary | 0.16 | `AWP-002` closes provider resource enforcement; `AWP-003` must define product owner, route/module boundary, project identity model, and non-go language before file movement or hosted claims | execute `TASK-2026W23-AWP-003` before durable audit or review-action runtime | high |
| 2 | Future MapLibre package movement gate | 0.12 | `MLD-004` blocks package movement in this batch; current code remains on the existing `maplibre-gl` range | create a new package-movement task only after official source refresh and strict visual evidence are available | high |

## 修复顺序

1. 执行 `TASK-2026W23-AWP-003`：定义 product app ownership、route/module boundary、project identity model 和 non-go language，不移动 product app、不加 hosted deployment、不新增 MCP tool name。
2. 后续若要移动 MapLibre package，先开新任务并刷新官方 package/changelog evidence、example loading compatibility 和 strict visual gates。
3. 下一步若要推进 stable runtime promotion，必须先形成明确的 promotion
   rubric、browser matrix evidence 和 guardrail diagnostics，不得直接把
   `view.mode: "scene3d"` 视为稳定。
4. 后续真实 renderer loader 接入时，必须先调用
   `validateSceneResourceLoadPlan`，不得绕过 byte、texture、worker、timeout
   diagnostics。
5. W23 promotion readiness sprint 已完成并记录 no-go verdict；stable runtime
   promotion 仍然 blocked until a future approval.

## 结论

如果只做一件事，下一步优先执行 `TASK-2026W23-AWP-003`。Generated-app delivery
review fixtures、source readiness review cards、spatial-analysis review cards、
prompt-to-delivery QA scenarios、docs/release wording guardrails、SQH boundary
planning、explicit query capability gate 和 invalid/source diagnostics 已完成。
Result caps and deterministic fixture hashes 以及 generated-app delivery query
mapping、quality gate and closure 也已完成。MapLibre Source Drift Audit 已通过
MLD-004 收口为 package movement No-go。AI Map Workbench Product Boundary 已
打开并完成 provider credential/resource administration、durable audit
retention/export、review actions 和 AMW-010 No-go gate；AWP-001 已打开新的产品
实现批次，且 AWP-002 provider resource enforcement 已落地。SceneView3D stable
runtime 仍保持 blocker state，直到新的 explicit approval arrives。
