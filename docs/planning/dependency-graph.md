---
agent: coordinator
period: 2026-W23
generated_at: 2026-05-29T10:20:00Z
repo_revision: "d628fd1454a44859e57d8996343413684a541c30"
inputs:
  - docs/archive/2026-05-18/planning/sprint-2026-W21.md
  - docs/planning/sprint-2026-W25-sceneview3d-v1.md
  - docs/archive/2026-05-30/reviews/quality-gate-2026-05-24.md
  - docs/archive/2026-05-30/reviews/automation-hardening-gate-2026-05-24.md
  - docs/archive/2026-05-30/reviews/sceneview3d-promotion-gate-2026-05-24.md
  - docs/archive/2026-05-30/planning/sprint-2026-W22-automation-hardening.md
  - docs/planning/feature-specs/sceneview3d-stable-renderer-contract.md
  - docs/archive/2026-05-30/reviews/sceneview3d-src-002-dependency-boundary-2026-05-29.md
  - docs/archive/2026-05-30/reviews/sceneview3d-src-005-resource-release-gate-2026-05-29.md
  - docs/reviews/sceneview3d-src-006-stable-runtime-gate-2026-05-29.md
  - docs/planning/sceneview3d-src-006-stable-runtime-decision-2026-05-29.md
  - docs/planning/feature-specs/natural-language-map-app-generation.md
  - docs/planning/feature-specs/spatial-analysis-readiness.md
  - docs/planning/sprint-2026-W23-ai-map-app-generation.md
  - docs/reviews/nla-002-generation-command-contract-2026-05-29.md
  - docs/reviews/nla-003-mcp-orchestration-evidence-2026-05-29.md
  - docs/reviews/nla-004-generation-scenarios-2026-05-29.md
  - docs/reviews/nla-005-scene-browsing-extension-boundary-2026-05-29.md
  - docs/reviews/nla-006-prompt-evidence-scenarios-2026-05-29.md
  - docs/reviews/nla-007-docs-release-wording-2026-05-29.md
  - docs/reviews/nla-008-serialized-planning-handoff-2026-05-29.md
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
owner: "@coordinator"
decision_level: advisory
---

# Dependency Graph

```mermaid
flowchart LR
  A["TASK-2026W21-001 MCP tool contract failure path"] --> C["TASK-2026W21-003 v0.2 合同边界"]
  B["TASK-2026W21-002 command schema strictness"] --> C

  C --> D["TASK-2026W21-004 expression contract"]
  D --> E["TASK-2026W21-005 expression validator"]
  E --> J["TASK-2026W23-004 MCP v0.2 contract 更新"]
  A --> J

  C --> F["TASK-2026W21-006 style diff / layer order command 设计"]
  F --> K["TASK-2026W23-005 style diff commands"]
  F --> L["TASK-2026W23-006 beforeLayerId diagnostics"]

  C --> G["TASK-2026W21-007 PMTiles/vector source schema"]
  G --> H["TASK-2026W23-001 vector schema + policy"]
  H --> I["TASK-2026W23-002 MapLibre vector transformer"]
  I --> M["TASK-2026W23-003 vector 示例 + snapshot"]
  I --> J

  C --> N["TASK-2026W21-008 v0.2 gate 模板"]
  C --> O["TASK-2026W21-009 resource/perf 缺口方案"]

  M --> P["TASK-2026W23-007 visual snapshot 场景"]
  J --> P

  C --> Q["TASK-2026W23-008 2.5D/3D boundary"]

  N --> R["TASK-2026W23-009 v0.2 checkpoint audit"]
  K --> R
  L --> R
  P --> R
```

## 当前状态

截至 `60d5d52`，图中 W21/W23 的 v0.2 checkpoint 关键链路已完成；原
W21 sprint 计划已归档，当前活跃关键路径从 W23 promotion readiness 与 W25 SceneView3D v1 DAG 继续：

| Chain | Status | Evidence |
| --- | --- | --- |
| MCP / command schema P1 修复 -> v0.2 合同边界 | done | strict command schema、Diagnostic failure path、MCP output schema |
| expression contract -> validator -> MCP v0.2 coverage | done | `expression-v0.2.md`、schema tests、MCP vector/expression tests |
| vector source schema -> transformer -> example/snapshot -> MCP coverage | done | vector source schema、MapLibre transformer、`examples/vector-tile-url`、snapshot smoke/visual |
| style diff/layer order -> diagnostics -> checkpoint audit | done | command tests、missing `beforeLayerId` diagnostic、checkpoint audit |
| command conflict/replay/audit | done | `collectTrace` API、MCP trace output、conflict audit fixture、AI edit audit example |
| 2.5D/3D boundary | done as boundary | `fill-extrusion-lite` gate、`scene3d` unsupported diagnostics、`extensions.scene3d` fixture |
| fill-extrusion-lite beta adapter | done | MapLibre `fill-extrusion` mapping、capability report、example/schema fixture、snapshot smoke |
| release strict visual runner | done | `pnpm -s test:release:strict` passed in release-capable local runner with 3 visual scenes |
| large-data perf/nightly evidence | done | `pnpm -s test:perf:nightly` covers 1k/10k/100k inline GeoJSON lifecycle |
| v1 SceneView3D RFC | drafted | camera/source/layer/snapshot/query/resource policy contract |
| v1 SceneView3D sprint split | done | `sprint-2026-W25-sceneview3d-v1.md` defines schema/resource/snapshot/MCP/package DAG |
| v1 SceneView3D schema foundation | done | `SceneView3DExtensionSchema`, generated schema, public type assertions, schema-sync validation |
| v1 SceneView3D resource gate | done | scene URL policy plus `validateSceneResourceLoadPlan` for 3D Tiles JSON/model/texture/worker/timeout diagnostics |
| v1 SceneView3D scene commands | done | command schemas, deterministic JSON Patch, inverse patch, dry-run, replay, rollback, and target diagnostics |
| v1 SceneView3D mock snapshot/query | done | `snapshotScene3DMock` and `queryScene3DMock` cover pending resources, blank scenes, missing layers, hidden layers, and deterministic picks |
| v1 SceneView3D MCP context | done | `get_context_summary` and `explain_spec` output schemas include extension-only 3D source/layer/resource/snapshot/query summaries |
| v1 SceneView3D release visual gate | done | `evaluateScene3DReleaseVisualGate` defines release-mode renderer evidence, coordinator waiver, and deterministic no-bypass rules |
| v1 SceneView3D adapter feasibility | done | official CesiumJS / Three.js / 3DTilesRendererJS evidence recommends a narrow Three.js adapter spike while keeping CesiumJS as high-fidelity reference |
| v1 SceneView3D alpha audit | done | conditional alpha pass for contract/resource/command/snapshot/query/MCP/release-gate readiness; stable runtime remains blocked |
| v1 SceneView3D Three.js adapter spike | done | `@gis-engine/scene3d-three-adapter` generates deterministic load-plan/resource-policy evidence without real renderer dependencies |
| SceneView3D renderer evidence handoff | done | `createScene3DThreeAdapterRendererEvidence` converts future nonblank browser capture metrics into `Scene3DRendererVisualEvidence` and keeps missing/blank/resource-policy-failing captures blocked |
| SceneView3D adapter runtime shim | done | `createScene3DThreeAdapterRuntime` keeps load, snapshot, query, and destroy adapter-local while reusing mock SceneView3D evidence |
| SceneView3D browser visual runner | done | `runScene3DThreeAdapterBrowserRunner` renders a local fixture in Chromium, records frame metrics, and produces release-capable renderer evidence |
| SceneView3D MCP evidence summary decision | done | renderer evidence summaries stay out of MCP for now; `scene3d` context remains extension-only |
| SceneView3D beta readiness gate | done | `pnpm test:release:scene3d` now exercises the browser runner and accepts release visual evidence |
| SceneView3D promotion readiness | done | W23 rubric, browser matrix evidence, adapter promotion report, guardrail diagnostics, MCP decision, docs alignment, and go/no-go review completed; package accepted, stable runtime still blocked |
| automation hardening | done | 2026-05-24 quality gate required report `decision_level` alignment, serialized scheduled commits, local/CI daily cadence alignment, and emergency interpolation fix before scheduled agent evidence is trusted |
| AI natural-language orchestration summary | done | `capabilitySummary` in `get_context_summary` / `explain_spec` names feature-display, spatial-analysis, and scene-browsing tool/evidence boundaries without adding tool aliases |
| SceneView3D stable renderer contract | done / stable no-go | `SRC-001` through `SRC-005` have accepted prerequisite evidence; `SRC-006` has a quality-guardian/coordinator No-go decision, so stable `view.mode: "scene3d"` remains blocked |
| AI natural-language map app generation planning | done / handoff-ready | W23 product spec, spatial-analysis readiness spec, and sprint DAG define prompt -> capabilitySummary -> MapGenerationCommandSkeleton -> commands -> diagnostics -> snapshot/export evidence |
| NLA-002 generation command contract | done | `docs/reviews/nla-002-generation-command-contract-2026-05-29.md`; `MapGenerationRequestSchema`, `MapGenerationCommandSkeletonSchema`, `setCapabilities`, `setInteractions`, and command skeleton tests keep generation schema-first and command-only |
| NLA-003 MCP orchestration evidence | done | `docs/reviews/nla-003-mcp-orchestration-evidence-2026-05-29.md`; `GenerationEvidenceBundleSchema` composes the existing seven MCP tool contracts without adding `generate_map_app` or other aliases |
| NLA-004 generation scenarios | done | `docs/reviews/nla-004-generation-scenarios-2026-05-29.md`; feature-display and spatial-analysis scenarios cover style edits, query readiness, dry-run/replay/rollback, and blocked analysis diagnostics |
| NLA-005 scene browsing boundary | done | `docs/reviews/nla-005-scene-browsing-extension-boundary-2026-05-29.md`; generation evidence keeps scene browsing under `extensions.scene3d`, stable 3D runtime blocked, and renderer dependencies adapter-local |
| NLA-006 prompt evidence scenarios | done | `docs/reviews/nla-006-prompt-evidence-scenarios-2026-05-29.md`; QA matrix covers prompt-to-command/snapshot/export evidence for feature display, spatial-analysis readiness, scene browsing extension-only, and stable scene3d blocked prompts |
| NLA-007 docs and release wording | done | `docs/reviews/nla-007-docs-release-wording-2026-05-29.md`; README, AI package docs, contracts, feature matrix, changelog, and ai-map-edit example docs describe evidence-first generation without stable 3D overclaim |
| NLA-008 serialized planning handoff | done | `docs/reviews/nla-008-serialized-planning-handoff-2026-05-29.md`; sprint, burndown, and dependency graph now agree that the W23 NLA slice is complete and ready for the next planning cycle |
| Generation quality hardening | done | `docs/reviews/nlq-007-serialized-quality-hardening-planning-2026-05-29.md`; NLQ-001 through NLQ-007 are serialized as a closed W23 batch |
| AI-native next loop | done | `TASK-2026W22-AIN-001` through `TASK-2026W22-AIN-005` are done via `docs/reviews/ain-001-002-generated-app-delivery-acceptance-2026-05-30.md`, `docs/reviews/ain-003-004-promotion-criteria-2026-05-30.md`, and `docs/reviews/ain-005-scene-browsing-delivery-copy-2026-05-30.md`; next loop should refresh competitive/product/task planning |
| NLQ-001 typed prompt planner boundary | done | `docs/reviews/nlq-001-prompt-planner-boundary-2026-05-29.md`; `planMapGenerationRequest()` accepts prompt hash plus structured intent, emits `MapGenerationRequest`-compatible handoff data, and rejects raw prompt retention by default |
| NLQ-002 planner provenance evidence | done | `docs/reviews/nlq-002-planner-provenance-evidence-2026-05-29.md`; `GenerationEvidenceBundleSchema` now exposes planner confidence, trace provenance, source prompt hashes, unsupported intent fields, and planner diagnostics |
| NLQ-003 spatial query evidence | done | `docs/reviews/nlq-003-spatial-query-evidence-2026-05-29.md`; `analysisEvidence` and `spatialQueryEvidence` expose deterministic point/bbox query readiness while keeping geoprocessing operations blocked |
| NLQ-004 export manifest evidence | done | `docs/reviews/nlq-004-export-manifest-evidence-2026-05-29.md`; `export_example_app` can carry compact generation evidence summaries without side-effect file writes |
| NLQ-005 cloud-native source readiness | done | `docs/planning/feature-specs/cloud-native-source-readiness.md`; support states and blocked diagnostics are documented before PMTiles, GeoParquet, FlatGeobuf, GeoTIFF, or GeoZarr implementation claims |
| NLQ-006 scene browsing blocker visibility | done | `docs/reviews/nlq-006-scene-browsing-blocker-visibility-2026-05-29.md`; generated-app manifests expose extension-only scene browsing metadata and stable-runtime blocker codes without enabling `snapshot.renderer: "scene3d"` |
| NLQ-007 serialized quality-hardening planning | done | `docs/reviews/nlq-007-serialized-quality-hardening-planning-2026-05-29.md`; sprint, burndown, dependency graph, roadmap, digest, and debt ledger now agree that the W23 generation quality hardening batch is closed |

## 关键路径

1. Natural-language app generation -> AI capability summary -> `MapGenerationCommandSkeleton` -> command-only edits -> snapshot/export evidence. This is the completed W23 product spine for feature display, spatial analysis readiness, and scene browsing boundaries.
2. Generation quality hardening -> typed prompt planner boundary -> planner provenance evidence -> spatial query evidence -> export manifest -> cloud-native readiness -> SceneView3D blocker transparency -> serialized closure -> generated-app delivery UX -> acceptance and confirmation states -> source promotion split -> spatial-analysis promotion criteria -> scene browsing extension-only delivery copy. NLQ-001 through NLQ-007 and AIN-001 through AIN-005 are done; future work should start from a fresh competitive/product/task-planning loop.
3. v1 SceneView3D RFC -> W25/W28 sprint DAG -> TypeBox schema -> fixtures + URL resource policy + loader resource gate + package boundary + scene commands -> mock snapshot/query contracts -> MCP context -> release visual gate -> alpha audit + adapter feasibility -> Three.js adapter spike -> renderer evidence handoff -> adapter runtime shim -> browser visual runner -> beta readiness gate -> promotion readiness -> stable renderer contract handoff -> stable runtime decision; W23 promotion-readiness package is Go, SRC-001 through SRC-005 prerequisite evidence is done, and SRC-006 records a No-go decision that keeps stable runtime blocked.
4. 2026-05-24 automation hardening blocks scheduled agent evidence from being used as advisory/blocking input: generated report semantics -> serialized scheduled commits -> local/CI daily cadence + emergency interpolation -> automation hardening gate -> scheduled evidence may feed future coordinator/quality-guardian decisions.

```mermaid
flowchart LR
  A["TASK-2026W23-NLA-001 product boundary"] --> B["TASK-2026W23-NLA-002 MapSpec and command contract"]
  A --> C["TASK-2026W23-NLA-003 MCP orchestration"]
  B --> C
  B --> D["TASK-2026W23-NLA-004 display and analysis scenarios"]
  C --> D
  A --> E["TASK-2026W23-NLA-005 scene browsing extension-only"]
  D --> F["TASK-2026W23-NLA-006 prompt evidence scenarios"]
  E --> F
  F --> G["TASK-2026W23-NLA-007 docs and examples"]
  G --> H["TASK-2026W23-NLA-008 serialized planning handoff"]
  H --> I["TASK-2026W23-NLQ-001 typed prompt planner"]
```

```mermaid
flowchart LR
  A["TASK-2026W23-NLQ-001 typed prompt planner boundary"] --> B["TASK-2026W23-NLQ-002 planner quality evidence"]
  A --> C["TASK-2026W23-NLQ-003 spatial query evidence"]
  B --> D["TASK-2026W23-NLQ-004 export manifest hardening"]
  A --> E["TASK-2026W23-NLQ-005 cloud-native source readiness"]
  B --> F["TASK-2026W23-NLQ-006 scene browsing blocker visibility"]
  C --> G["TASK-2026W23-NLQ-007 serialized status"]
  D --> G
  E --> G
  F --> G
```

```mermaid
flowchart LR
  A["SceneView3D v1 RFC"] --> B["TASK-2026W25-001 contract slices"]
  B --> C["TASK-2026W25-002 TypeBox schema"]
  C --> D["TASK-2026W25-003 fixtures"]
  C --> E["TASK-2026W25-004 resource policy"]
  C --> F["TASK-2026W25-005 scene commands"]
  B --> G["TASK-2026W25-006 scene3d package boundary"]
  D --> H["TASK-2026W27-001 snapshot/query"]
  E --> H
  G --> H
  H --> I["TASK-2026W27-002 MCP 3D context"]
  H --> J["TASK-2026W27-003 visual gate"]
  G --> L["TASK-2026W27-004 adapter feasibility"]
  I --> K["TASK-2026W27-005 alpha audit"]
  J --> K
  K --> M["TASK-2026W28-001 Three.js adapter spike"]
  L --> M
  M --> N["renderer evidence handoff"]
  N --> O["adapter runtime shim"]
  O --> P["browser visual runner"]
  P --> Q["beta readiness gate"]
  Q --> R["promotion readiness"]
  R --> S["stable renderer contract handoff"]
  S --> T["stable runtime decision"]
```

```mermaid
flowchart LR
  A["2026-05-24 quality gate required follow-up"] --> B["TASK-2026W22-AH-001 report decision_level semantics"]
  B --> C["TASK-2026W22-AH-002 serialized scheduled commits"]
  B --> D["TASK-2026W22-AH-003 local/CI daily cadence"]
  B --> E["TASK-2026W22-AH-004 emergency interpolation"]
  C --> F["TASK-2026W22-AH-005 automation hardening quality gate"]
  D --> F
  E --> F
  F --> G["scheduled agent evidence can support advisory/blocking review"]
  G --> H["future coordinator weekly digest"]
  G --> I["future quality-guardian release gate"]
```

```mermaid
flowchart LR
  A["W23 promotion-readiness package: Go"] --> B["TASK-2026W23-SRC-001 stable renderer contract"]
  B --> B1["adapter contract tests + adapter build"]
  B --> C["TASK-2026W23-SRC-002 Three.js / 3DTilesRendererJS adapter-local boundary"]
  B --> D["TASK-2026W23-SRC-003 lifecycle semantics"]
  C --> C1["resource policy / dependency isolation checks"]
  D --> D1["lifecycle diagnostics tests"]
  D --> E["TASK-2026W23-SRC-004 snapshot/query semantics"]
  E --> E1["pnpm test:release:scene3d + visual snapshots"]
  C --> F["TASK-2026W23-SRC-005 resource policy + release gates"]
  E --> F
  F --> F1["build:schema/check triggers documented"]
  F --> G["TASK-2026W23-SRC-006 future stable runtime decision"]
  G -. "No-go / parked for future revisit" .-> H["stable view.mode: scene3d"]
```

## SceneView3D SRC Gate Matrix

| Task | Depends On | Evidence Target | Required Finish Gate | Status Rule |
| --- | --- | --- | --- | --- |
| TASK-2026W23-SRC-001 | W23 promotion-readiness package Go | adapter contract delta report and focused adapter contract tests | `pnpm test:adapter -- tests/adapter/scene3d-three-adapter.test.ts`; `pnpm --filter @gis-engine/scene3d-three-adapter build` | done as contract evidence only |
| TASK-2026W23-SRC-002 | SRC-001 | dependency-boundary audit for Three.js and 3DTilesRendererJS | adapter build; dependency isolation check or audit; `pnpm check` when package metadata/imports change | done as dependency-boundary prerequisite evidence |
| TASK-2026W23-SRC-003 | SRC-001 | lifecycle matrix with structured diagnostics | adapter lifecycle contract tests; `pnpm check` when runtime behavior or diagnostics change | done as lifecycle/failure semantics evidence |
| TASK-2026W23-SRC-004 | SRC-001, SRC-003 | snapshot/query evidence report with browser metrics and pick cases | `pnpm test:release:scene3d`; `pnpm test:snapshot:visual`; strict visual snapshot before beta/stable renderer claim | done as deterministic snapshot/query semantics; visual evidence acceptance still requires release-capable browser rerun |
| TASK-2026W23-SRC-005 | SRC-002, SRC-004 | resource-policy test output, release-gate matrix, docs alignment note | `pnpm test:resources`; resource-policy schema tests when policy schemas change; `pnpm test:release:scene3d`; visual snapshot or coordinator waiver for non-rendering changes | done as resource-policy/release-gate prerequisite evidence |
| TASK-2026W23-SRC-006 | SRC-001 through SRC-005 | quality-guardian gate report and coordinator decision note | `pnpm build:schema`; `pnpm check`; `pnpm test:release:scene3d`; visual snapshot evidence; strict visual snapshot before future beta/stable claims | done as No-go stable runtime decision |

## Generated App Review Console DAG

2026-05-30 planning update: the AIN batch is closed and the Generated App
Review Console sprint is complete. `GIR-001` through `GIR-006` are done; the
orchestrator should return to planning state for the next competitor/product
task loop.

```mermaid
flowchart LR
  A["AIN-001 through AIN-005 done"] --> B["TASK-2026W22-GIR-001 review console PRD"]
  B --> C["TASK-2026W22-GIR-002 delivery acceptance fixtures"]
  B --> D["TASK-2026W22-GIR-003 source readiness review sections"]
  B --> E["TASK-2026W22-GIR-004 spatial-analysis review sections"]
  C --> F["TASK-2026W22-GIR-005 prompt-to-delivery QA scenarios"]
  D --> F
  E --> F
  F --> G["TASK-2026W22-GIR-006 wording and release guardrails"]
```

| Task | Depends On | Evidence Target | Required Finish Gate | Status Rule |
| --- | --- | --- | --- | --- |
| TASK-2026W22-GIR-001 | AIN-005 | product feature spec and sprint DAG | docs review; `pnpm check`; `git diff --check` | done as PRD/planning evidence |
| TASK-2026W22-GIR-002 | GIR-001 | delivery review acceptance fixtures | `pnpm vitest run tests/ai/generation-evidence.test.ts`; `pnpm check`; `pnpm test:schema-sync` | done |
| TASK-2026W22-GIR-003 | GIR-001 | source readiness review mapping | docs audit; `pnpm check`; `git diff --check` | done |
| TASK-2026W22-GIR-004 | GIR-001 | spatial-analysis review mapping | `pnpm test:commands`; `pnpm test:ai`; `pnpm build:schema` when schemas change; `pnpm check` | done |
| TASK-2026W22-GIR-005 | GIR-002, GIR-003, GIR-004 | prompt-to-delivery QA matrix | `pnpm test:ai`; `pnpm test:examples`; `pnpm check`; visual gate only for rendering changes | done |
| TASK-2026W22-GIR-006 | GIR-002, GIR-005 | docs and release wording audit | docs audit; `pnpm test:docs`; `pnpm check`; `pnpm test:release:scene3d` only if scene evidence changes | done |

## Spatial Query Evidence Hardening DAG

2026-05-30 planning update: after the Generated App Review Console batch
closed, the orchestrator opened the Spatial Query Evidence Hardening sprint.
`SQH-001` is complete as a boundary/spec task; `SQH-002` is complete as the
explicit capability gate; `SQH-003` is complete as the invalid/source
diagnostic matrix; `SQH-004` is complete as result-cap fixture evidence;
`SQH-005` is the next queued execution task.

```mermaid
flowchart LR
  A["TASK-2026W23-SQH-001 boundary spec"]
  A --> B["TASK-2026W23-SQH-002 query capability gate"]
  B --> C["TASK-2026W23-SQH-003 invalid/source diagnostics"]
  C --> D["TASK-2026W23-SQH-004 result caps and fixtures"]
  D --> E["TASK-2026W23-SQH-005 delivery mapping"]
  E --> F["TASK-2026W23-SQH-006 quality gate and closure"]
```

| Task | Depends On | Evidence Target | Required Finish Gate | Status Rule |
| --- | --- | --- | --- | --- |
| TASK-2026W23-SQH-001 | GIR-006 | boundary spec and sprint DAG | planning review; `pnpm test:docs`; `pnpm check`; `git diff --check` | done |
| TASK-2026W23-SQH-002 | SQH-001 | query capability gate | `pnpm build:schema`; `pnpm test:schema-sync`; `pnpm test:commands`; `pnpm test:ai`; `pnpm check`; `git diff --check` | done |
| TASK-2026W23-SQH-003 | SQH-002 | invalid/source diagnostics | `pnpm test:commands`; `pnpm test:ai`; `pnpm test:adapter`; `pnpm check`; `git diff --check` | done |
| TASK-2026W23-SQH-004 | SQH-003 | result caps and fixtures | `pnpm build:schema`; `pnpm test:schema-sync`; `pnpm test:ai`; `pnpm test:commands`; `pnpm check`; `git diff --check` | done |
| TASK-2026W23-SQH-005 | SQH-004 | generated-app delivery mapping | `pnpm test:ai`; `pnpm test:docs`; `pnpm check` | queued P1 |
| TASK-2026W23-SQH-006 | SQH-005 | quality gate and closure | `pnpm build:schema`; `pnpm check`; visual waiver rationale if non-rendering | todo |

## 阻断规则

- public AI tool 或 public command surface 变更仍必须先通过 schema-sync、MCP contract tests 和 command replay tests。
- release candidate 必须在正式 runner 执行 strict visual snapshot，或由 coordinator 明确 waiver 并创建 follow-up。
- resource/perf 文档中声明的 PR 阻断项已有 deterministic Node-level evidence；nightly/release 大场景不得默认为 PR blocker。
- `fill-extrusion-lite` 只作为 experimental beta 暴露；即使已有 release visual evidence，也不得绕过 explicit capability gate 升格为稳定图层。
- scheduled agent evidence 在 `TASK-2026W22-AH-005` 通过前不得作为 advisory/blocking 决策输入；只能作为 machine-generated `info` evidence/template。
- stable `view.mode: "scene3d"` 在 `TASK-2026W23-SRC-006` No-go 后仍保持 blocked；promotion-readiness package Go 不等于 stable runtime Go。
- SRC execution owners must not write shared planning markdown directly. They
  hand off code, tests, reports, or review findings; `@coordinator` serializes
  accepted status updates into this graph and the burndown.
