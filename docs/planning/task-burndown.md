---
agent: coordinator
period: 2026-W22
generated_at: 2026-05-25T01:57:26Z
repo_revision: "d3c0137"
inputs:
  - docs/planning/sprint-2026-W22-competitive-signal-response.md
  - docs/research/competitor-updates-2026-W22.md
  - docs/research/capability-scorecard.md
  - docs/engineering/maplibre-version-drift-audit.md
  - docs/reviews/sceneview3d-lifecycle-diagnostics-2026-05-25.md
  - docs/reviews/sceneview3d-src-evidence-decision-2026-05-25.md
  - docs/archive/2026-05-18/planning/sprint-2026-W21.md
  - docs/planning/sprint-2026-W25-sceneview3d-v1.md
  - docs/reviews/quality-gate-2026-05-24.md
  - docs/reviews/automation-hardening-gate-2026-05-24.md
  - docs/reviews/sceneview3d-promotion-gate-2026-05-24.md
  - docs/planning/sprint-2026-W22-automation-hardening.md
  - docs/planning/feature-specs/sceneview3d-stable-renderer-contract.md
owner: "@coordinator"
decision_level: advisory
---

# Task Burndown

## 当前结论

原 W21/W23 计划中的 v0.2 checkpoint 关键任务已经提前完成，原 sprint
计划已移入 `docs/archive/2026-05-18/planning/sprint-2026-W21.md`。SceneView3D
v1 RFC 已拆成 W25/W28 专项 sprint，且 W25 的 schema、fixtures、scene
commands、resource load plan gate、package boundary、mock snapshot/query 和 MCP 3D context 已提前完成。下面的 W21/W23 理想燃尽表仅保留
为计划基线；真实状态以“2026-05-17 执行快照”和“2026-05-18 follow-up”为准。

## 2026-05-25 W22 competitive signal response

W22 竞品核验已转为执行 sprint：
[sprint-2026-W22-competitive-signal-response.md](./sprint-2026-W22-competitive-signal-response.md)。
本轮已完成竞品报告、scorecard、路线图校准、adapter lifecycle diagnostics
执行切片、MapLibre version-drift 升级前清单，以及 SRC 证据接受/No-go 决策。
后续仍保持 stable `view.mode: "scene3d"` blocked。

| id | title | priority | owner | status | acceptance | finish gates |
| --- | --- | --- | --- | --- | --- | --- |
| TASK-2026W22-CSI-001 | Publish W22 competitor signal report | P1 | `@competitive-intel` | done | dated official-source report exists | report source URLs recorded |
| TASK-2026W22-CSI-002 | Refresh capability scorecard | P1 | `@product-strategist` | done | W22 score deltas recorded without stable 3D overclaim | scorecard updated |
| TASK-2026W22-CSI-003 | Add path-stable SceneView3D lifecycle diagnostics | P1 | `@adapter-agent` | done | pre-load and post-destroy diagnostics include stable paths | adapter tests; smoke lifecycle test; adapter build; lifecycle diagnostics review |
| TASK-2026W22-CSI-004 | Record W22 coordinator digest and roadmap adjustment | P1 | `@coordinator` | done | digest and roadmap name plan and execution evidence | docs updated |
| TASK-2026W22-CSI-005 | Add MapLibre version-drift audit checklist | P1 | `@engine-agent`, `@docs-agent` | done | checklist covers transformer, source URL, resource policy, smoke/visual snapshot, release runner, dependency boundary, rollback decision | docs review; relevant tests when implemented |
| TASK-2026W22-CSI-006 | Decide whether SRC evidence can close planning status | P1 | `@quality-guardian`, `@coordinator` | done | accepted prerequisite SRC evidence is recorded without promoting stable runtime | `pnpm check`; release gates as required |

## 2026-05-24 automation hardening follow-up

2026-05-24 quality gate 对 current HEAD 条件通过，但 scheduled agent evidence
在作为 advisory/blocking 输入前必须完成 automation-hardening。该 follow-up
由 [sprint-2026-W22-automation-hardening.md](./sprint-2026-W22-automation-hardening.md)
承接，不修改 runtime/source/workflow 的当前文档账本状态。

| id | title | priority | owner | status | acceptance | finish gates |
| --- | --- | --- | --- | --- | --- | --- |
| TASK-2026W22-AH-001 | Align generated report decision levels | P1 | `@engine-agent`, `@docs-agent` | done | generated template reports stay `decision_level: info` unless a real blocking gate failure is recorded | `node --check scripts/agent-runner.mjs`; `rg -n "decision_level: info\\|automation-generated" scripts .github docs` |
| TASK-2026W22-AH-002 | Serialize scheduled artifact commits | P1 | `@coordinator`, `@task-distributor` | done | scheduled planning/review artifacts are committed by one serialized writer or left as uploaded artifacts for coordinator handoff | workflow syntax review; `rg -n "git-auto-commit-action\\|upload-artifact\\|download-artifact" .github/workflows/agent-*.yml` |
| TASK-2026W22-AH-003 | Align local and CI daily cadence | P2 | `@docs-agent` | done | local `pnpm agent:daily` and CI daily cadence match, or their docs explicitly define the difference | `node scripts/agent-runner.mjs all --daily --dry-run`; cadence `rg` check |
| TASK-2026W22-AH-004 | Fix emergency alert variable interpolation | P2 | `@coordinator` | done | emergency front matter and body expand trusted local timestamps while preserving safe GitHub input handling | workflow syntax review; heredoc/interpolation `rg` check |
| TASK-2026W22-AH-005 | Re-run automation hardening quality gate | P1 | `@quality-guardian` | done | quality gate states whether scheduled agent evidence can support advisory/blocking decisions | `pnpm -s build:schema`; `pnpm -s check`; `node --check scripts/agent-runner.mjs`; `node --check scripts/doc-generator.mjs` |

## SceneView3D stable renderer contract planning

W23 promotion-readiness package 已被 quality-guardian 接受为 Go；stable
`view.mode: "scene3d"` runtime promotion 仍为 No-go。下一阶段不是启用 stable
runtime，而是先冻结真实 renderer contract、Three.js/3DTilesRendererJS 依赖边界、
lifecycle、snapshot/query 语义、resource policy 和 release gate。规划规格见
[sceneview3d-stable-renderer-contract.md](./feature-specs/sceneview3d-stable-renderer-contract.md)，
2026-05-25 handoff 见
[sprint-2026-W23-scene3d-stable-renderer-contract.md](./sprint-2026-W23-scene3d-stable-renderer-contract.md)。

共享规划状态由 `@coordinator` 单写。下面的状态只表示执行 handoff 已可用；
除 `TASK-2026W23-SRC-006` 按依赖保持 blocked 外，不声称任何 SRC 执行任务已经完成。

| id | title | priority | owner | status | evidence target | acceptance | finish gates |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-2026W23-SRC-001 | Define stable renderer adapter contract | P0 | `@adapter-agent` | todo | adapter contract delta report plus focused adapter contract tests | load/render/resize/camera/snapshot/query/destroy/diagnostics obligations are specified without changing stable `view.mode` | `pnpm test:adapter -- tests/adapter/scene3d-three-adapter.test.ts`; `pnpm --filter @gis-engine/scene3d-three-adapter build`; code-reviewer boundary audit |
| TASK-2026W23-SRC-002 | Freeze Three.js and 3DTilesRendererJS dependency boundary | P0 | `@adapter-agent`, `@engine-agent` | todo | dependency-boundary audit naming allowed package locations and import/package checks | renderer dependencies remain adapter-local and core packages keep dependency-isolation checks | `pnpm --filter @gis-engine/scene3d-three-adapter build`; dependency isolation check or audit evidence; `pnpm check` when package metadata/imports change |
| TASK-2026W23-SRC-003 | Specify lifecycle and failure-state semantics | P1 | `@adapter-agent`, `@qa-agent` | todo | lifecycle matrix report with structured diagnostic outcomes | load/reload/resize/cancel/destroy/failure transitions are deterministic and structured | adapter lifecycle contract tests; `pnpm check` when runtime behavior or diagnostics change |
| TASK-2026W23-SRC-004 | Specify stable snapshot and query semantics | P1 | `@qa-agent`, `@adapter-agent` | todo | snapshot/query report with browser metrics, fixture names, pick cases, and diagnostics | nonblank metrics, camera/dimension determinism, pick identity, no-hit, and hidden/missing layer behavior are defined | `pnpm test:release:scene3d`; `pnpm test:snapshot:visual`; strict visual snapshot before beta/stable renderer claim |
| TASK-2026W23-SRC-005 | Align SceneView3D resource policy and release gates | P1 | `@engine-agent`, `@quality-guardian`, `@docs-agent` | todo | resource-policy test output, release-gate matrix, and docs alignment note | resource-policy tests/docs and release gates name exact PR, beta, and stable renderer checks | `pnpm test:resources`; `pnpm test:schema -- tests/schema/resource-policy.test.ts` when schema policy changes; `pnpm test:release:scene3d`; visual snapshot gate or coordinator waiver for non-rendering changes |
| TASK-2026W23-SRC-006 | Issue stable runtime promotion readiness decision | P0 | `@quality-guardian`, `@coordinator` | blocked | quality-guardian gate report and coordinator decision note | future gate accepts the real renderer contract package or keeps stable `view.mode: "scene3d"` blocked with explicit blocker codes | `pnpm build:schema` if public schema/tool contracts changed; `pnpm check`; `pnpm test:release:scene3d`; strict visual snapshot evidence or release waiver; coordinator records Go/No-go decision |

Next quality-gate triggers:

- Adapter contract tests are required when SRC-001, SRC-003, SRC-004, adapter
  lifecycle, snapshot/query, or renderer evidence handoff changes.
- Resource policy tests are required when SRC-002, SRC-005, URL/tile/worker,
  model/texture, timeout, example asset, or package-boundary behavior changes.
- `pnpm test:release:scene3d` is required for SRC-004, SRC-005, SRC-006, and
  any beta/stable renderer evidence claim.
- `pnpm test:snapshot:visual` is required for rendering, fixture, style,
  browser-runner, visual-evidence, or adapter-output changes; strict
  `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual` is required
  before beta/stable renderer claims unless coordinator records a release
  waiver.
- `pnpm build:schema` is required when public TypeBox schemas, generated schema
  artifacts, diagnostics, MCP schemas, command contracts, or public resource
  policy contracts change.
- `pnpm check` is required for final handoff, SRC-006, package metadata/import
  boundary changes, and quality-guardian acceptance.

## W23 promotion readiness 计划快照

W23 将现有 SceneView3D 证据整理成 promotion-ready 决策包，不启用 stable
`view.mode: "scene3d"`，不把 renderer 依赖带进 core runtime。以下任务由
task-distributor 按 owner registry 分配。

| Sprint | 日期 | Planned hours | P0/P1 hours | P2 hours |
| --- | --- | ---: | ---: | ---: |
| W23-W24 | 2026-06-01 ~ 2026-06-12 | 84 | 68 | 16 |

| id | title | priority | owner | status | acceptance |
| --- | --- | --- | --- | --- | --- |
| TASK-2026W23-001 | Publish SceneView3D promotion readiness rubric | P0 | `@product-strategist` | done | `docs/planning/feature-specs/sceneview3d-promotion-readiness.md` defines evidence matrix, owners, blockers, states, and thresholds |
| TASK-2026W23-002 | Expand browser runner with promotion matrix evidence | P1 | `@qa-agent` | done | runner records frame, console, renderer diagnostics, and promotion matrix readiness evidence |
| TASK-2026W23-003 | Add adapter-side promotion evidence summary report | P1 | `@adapter-agent` | done | `createScene3DThreeAdapterPromotionEvidenceSummary` consolidates load-plan, resource-report, runtime, snapshot, query, and release evidence without enabling stable runtime |
| TASK-2026W23-004 | Define stable-runtime guardrail diagnostics and blocker codes | P1 | `@engine-agent` | done | `CAPABILITY.UNSUPPORTED` diagnostics now carry SceneView3D stable-runtime blocker codes for view mode, renderer, and dimensions |
| TASK-2026W23-005 | Decide whether promotion evidence summaries enter MCP context | P2 | `@ai-agent` | done | `docs/reviews/sceneview3d-mcp-promotion-evidence-decision-2026-05-23.md` keeps promotion summaries out of MCP context for W23 |
| TASK-2026W23-006 | Update roadmap, debt report, and release checklist with the promotion decision | P2 | `@docs-agent` | done | public docs reflect the decision and residual risk; promotion evidence summaries stay out of public MCP context |
| TASK-2026W23-007 | Run promotion gate review and issue go/no-go decision | P1 | `@quality-guardian` | done | gate report at `docs/reviews/sceneview3d-promotion-gate-2026-05-24.md` issues no-go for stable runtime while accepting the promotion-readiness package |

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
| TASK-2026W27-004 | done | CesiumJS vs Three.js / 3DTilesRendererJS adapter feasibility recommends a narrow Three.js spike and keeps CesiumJS as high-fidelity reference |
| TASK-2026W27-005 | done | SceneView3D v1 alpha gate audit grants conditional contract alpha pass while keeping stable 3D runtime blocked |
| TASK-2026W28-001 | done | `@gis-engine/scene3d-three-adapter` spike package creates deterministic load plans and resource-policy evidence without real renderer dependencies |
| TASK-2026W22-001 | done | `createScene3DThreeAdapterRendererEvidence` converts future browser/WebGL capture metrics into release-gate compatible renderer evidence and fails closed on missing, blank, or resource-policy-failing evidence |
| TASK-2026W22-003 | done | `createScene3DThreeAdapterRuntime` keeps load, snapshot, query, and destroy adapter-local behind the spike boundary while reusing mock snapshot/query evidence |
| TASK-2026W22-002 | done | `runScene3DThreeAdapterBrowserRunner` renders a local fixture through the adapter package, records frame metrics, and feeds real renderer evidence to `pnpm test:release:scene3d` |
| TASK-2026W22-004 | done | MCP evidence summaries stay out of the public `scene3d` context for now; the decision keeps the context extension-only |
| TASK-2026W22-005 | done | SceneView3D beta readiness gate now records resource, adapter, smoke, release scene3d, and visual evidence commands with passing browser evidence |
