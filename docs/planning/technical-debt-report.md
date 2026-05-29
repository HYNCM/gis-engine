---
agent: product-strategist
period: 2026-05
generated_at: 2026-05-29T08:20:23Z
repo_revision: "b0ccfd9342d8d737fdde676399dc5059f8c13293"
inputs:
  - README.md
  - AGENTS.md
  - docs/reviews/daily-audit-2026-05-17.md
  - docs/reviews/quality-gate-2026-05-17.md
  - docs/engineering/v0.1-release-checklist.md
  - docs/engineering/ci-test-strategy.md
  - docs/research/competitor-updates-2026-W22.md
  - docs/planning/sprint-2026-W23-generation-quality-hardening.md
  - docs/reviews/nlq-001-prompt-planner-boundary-2026-05-29.md
  - docs/reviews/nlq-002-planner-provenance-evidence-2026-05-29.md
  - docs/reviews/nlq-003-spatial-query-evidence-2026-05-29.md
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

## 债务优先级

| 排名 | 债务 | 得分 | 证据 | 建议修复 | 置信度 |
| --- | ---: | ---: | --- | --- | --- |
| 1 | Generated-app export manifest evidence missing | 0.64 | generation evidence now includes planner and spatial query evidence, but `export_example_app` does not yet summarize those readiness fields | execute `TASK-2026W23-NLQ-004` before claiming generated app handoff completeness | high |
| 2 | Cloud-native source readiness matrix missing | 0.61 | PMTiles/GeoParquet/FlatGeobuf/OpenLayers signals are now planning inputs, but support states and diagnostics are not yet consolidated | execute `TASK-2026W23-NLQ-005` before adding implementation claims | high |
| 3 | SceneView3D stable runtime promotion parked after SRC-006 No-go | 0.42 | W23 gate and SRC-006 decision keep stable runtime blocked while browser matrix / adapter summary / docs alignment are in place | keep the blocker codes and require a new explicit stable-runtime approval task before reopening | medium |

## 修复顺序

1. 先执行 `TASK-2026W23-NLQ-004`：generated-app export manifest 必须能承接 planner、spatial query、snapshot/export/example evidence。
2. Cloud-native source readiness 要先落支持状态和 blocked diagnostics，再讨论 PMTiles/GeoParquet/FlatGeobuf/GeoZarr 实现。
3. 下一步若要推进 stable runtime promotion，必须先形成明确的 promotion rubric、browser matrix evidence 和 guardrail diagnostics，不得直接把 `view.mode: "scene3d"` 视为稳定。
4. 后续真实 renderer loader 接入时，必须先调用 `validateSceneResourceLoadPlan`，不得绕过 byte、texture、worker、timeout diagnostics。
5. W23 promotion readiness sprint 已完成并记录 no-go verdict；stable runtime promotion 仍然 blocked until a future approval.

## 结论

如果只做一件事，下一步优先让 generated-app export manifest 承接 planner 和 spatial query evidence，让自然语言生成地图应用从“可解释分析准备”继续走向“可交付应用包 handoff”。SceneView3D stable runtime 仍保持 blocker state，直到新的 explicit approval arrives；下一步不能绕过 blocker code 直接打开 stable `view.mode: "scene3d"`。
