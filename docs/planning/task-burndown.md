---
agent: coordinator
period: 2026-W22
generated_at: 2026-05-29T10:20:00Z
repo_revision: "d628fd1454a44859e57d8996343413684a541c30"
inputs:
  - docs/archive/2026-05-30/planning/sprint-2026-W22-competitive-signal-response.md
  - docs/research/competitor-updates-2026-W22.md
  - docs/research/capability-scorecard.md
  - docs/planning/feature-specs/natural-language-map-app-generation.md
  - docs/planning/feature-specs/spatial-analysis-readiness.md
  - docs/planning/sprint-2026-W23-ai-map-app-generation.md
  - docs/planning/sprint-2026-W23-generation-quality-hardening.md
  - docs/engineering/maplibre-version-drift-audit.md
  - docs/archive/2026-05-30/reviews/sceneview3d-lifecycle-diagnostics-2026-05-25.md
  - docs/reviews/sceneview3d-src-evidence-decision-2026-05-25.md
  - docs/archive/2026-05-30/reviews/sceneview3d-src-002-dependency-boundary-2026-05-29.md
  - docs/archive/2026-05-30/reviews/sceneview3d-src-005-resource-release-gate-2026-05-29.md
  - docs/reviews/sceneview3d-src-006-stable-runtime-gate-2026-05-29.md
  - docs/planning/sceneview3d-src-006-stable-runtime-decision-2026-05-29.md
  - docs/archive/2026-05-18/planning/sprint-2026-W21.md
  - docs/planning/sprint-2026-W25-sceneview3d-v1.md
  - docs/archive/2026-05-30/reviews/quality-gate-2026-05-24.md
  - docs/archive/2026-05-30/reviews/automation-hardening-gate-2026-05-24.md
  - docs/archive/2026-05-30/reviews/sceneview3d-promotion-gate-2026-05-24.md
  - docs/archive/2026-05-30/planning/sprint-2026-W22-automation-hardening.md
  - docs/planning/feature-specs/sceneview3d-stable-renderer-contract.md
  - docs/reviews/nla-002-generation-command-contract-2026-05-29.md
  - docs/reviews/nla-003-mcp-orchestration-evidence-2026-05-29.md
  - docs/reviews/nla-004-generation-scenarios-2026-05-29.md
  - docs/reviews/nla-005-scene-browsing-extension-boundary-2026-05-29.md
  - docs/reviews/nla-006-prompt-evidence-scenarios-2026-05-29.md
  - docs/reviews/nla-007-docs-release-wording-2026-05-29.md
  - docs/reviews/nla-008-serialized-planning-handoff-2026-05-29.md
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

# Task Burndown

## 当前结论

原 W21/W23 计划中的 v0.2 checkpoint 关键任务已经提前完成，原 sprint
计划已移入 `docs/archive/2026-05-18/planning/sprint-2026-W21.md`。SceneView3D
v1 RFC 已拆成 W25/W28 专项 sprint，且 W25 的 schema、fixtures、scene
commands、resource load plan gate、package boundary、mock snapshot/query 和 MCP 3D context 已提前完成。下面的 W21/W23 理想燃尽表仅保留
为计划基线；真实状态以“2026-05-17 执行快照”和“2026-05-18 follow-up”为准。

## 2026-05-25 W22 competitive signal response

W22 竞品核验已转为执行 sprint（已归档至 [archive/2026-05-30/planning/sprint-2026-W22-competitive-signal-response.md](../archive/2026-05-30/planning/sprint-2026-W22-competitive-signal-response.md)）。
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
由 [sprint-2026-W22-automation-hardening.md](../archive/2026-05-30/planning/sprint-2026-W22-automation-hardening.md)
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
[sprint-2026-W23-scene3d-stable-renderer-contract.md](../archive/2026-05-30/planning/sprint-2026-W23-scene3d-stable-renderer-contract.md)。

共享规划状态由 `@coordinator` 单写。下面的状态表示当前已接受的前置证据和
SRC-006 No-go 决策；stable runtime 仍保持 blocked，除非 future
quality-guardian gate 和 coordinator decision 明确批准新的 promotion task。

2026-05-27 serialized evidence update: `@adapter-agent`, `@qa-agent`, and
`@ai-agent` landed bounded evidence slices. `SRC-001`, `SRC-003`, and
`SRC-004` are now accepted as adapter/QA contract handoff evidence only; they
do not enable stable runtime. The AI-facing `capabilitySummary` now exposes the
natural-language planning boundary for feature display, spatial analysis, and
scene browsing. Stable `view.mode: "scene3d"` remains blocked under `SRC-006`.

2026-05-29 serialized evidence update: the `@engine-agent` and
`@quality-guardian` evidence reports accept `SRC-002` and `SRC-005` as
prerequisite evidence for dependency-boundary, resource-policy, and release-gate
alignment. This closes `SRC-001` through `SRC-005` as prerequisite evidence
only. At that point stable `view.mode: "scene3d"` remained blocked pending a
separate quality-guardian and coordinator SRC-006 decision.

2026-05-29 SRC-006 decision update: `@quality-guardian` and `@coordinator`
closed `SRC-006` as a No-go decision. The stable renderer contract sequence now
has accepted prerequisite evidence plus an explicit promotion decision; stable
`view.mode: "scene3d"` remains blocked, and the next iteration moves to
competitor analysis, product design, and task planning.

2026-05-29 natural-language generation update: `@competitive-intel`,
`@product-strategist`, and `@task-distributor` opened the next W23 loop around
verifiable AI map app generation. The first task closes the product boundary;
implementation tasks remain todo until owner reports and gate evidence exist.

| id | title | priority | owner | status | evidence target | acceptance | finish gates |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-2026W23-SRC-001 | Define stable renderer adapter contract | P0 | `@adapter-agent` | done | `docs/archive/2026-05-30/reviews/sceneview3d-adapter-lifecycle-semantics-2026-05-26.md`; focused adapter contract tests | load/render/resize/camera/snapshot/query/destroy/diagnostics obligations are specified without changing stable `view.mode` | `pnpm test:adapter -- tests/adapter/scene3d-three-adapter.test.ts`; `pnpm --filter @gis-engine/scene3d-three-adapter build`; adapter boundary evidence |
| TASK-2026W23-SRC-002 | Freeze Three.js and 3DTilesRendererJS dependency boundary | P0 | `@adapter-agent`, `@engine-agent` | done | `docs/archive/2026-05-30/reviews/sceneview3d-src-002-dependency-boundary-2026-05-29.md`; `auditScene3DThreeAdapterDependencyBoundary()`; focused adapter tests | renderer dependencies remain adapter-local and core packages keep dependency-isolation checks | `pnpm --filter @gis-engine/scene3d-three-adapter build`; dependency isolation check or audit evidence; `pnpm check` when package metadata/imports change |
| TASK-2026W23-SRC-003 | Specify lifecycle and failure-state semantics | P1 | `@adapter-agent`, `@qa-agent` | done | `getScene3DThreeAdapterLifecycleSemantics()`; `docs/archive/2026-05-30/reviews/sceneview3d-adapter-lifecycle-semantics-2026-05-26.md` | load/reload/resize/cancel/destroy/failure transitions are deterministic and structured | adapter lifecycle contract tests; `pnpm check` when runtime behavior or diagnostics change |
| TASK-2026W23-SRC-004 | Specify stable snapshot and query semantics | P1 | `@qa-agent`, `@adapter-agent` | done | `docs/archive/2026-05-30/reviews/sceneview3d-src-004-qa-evidence-2026-05-27.md`; browser runner `promotionMatrix.snapshotQueryEvidence` | snapshot/query semantics, fixture identity, pick identity, hidden/missing-layer behavior, and diagnostic counts are defined; strict visual evidence is still required before beta/stable renderer claims | deterministic smoke/release tests; release-capable `pnpm test:release:scene3d` and `pnpm test:snapshot:visual` still required for visual evidence acceptance |
| TASK-2026W23-SRC-005 | Align SceneView3D resource policy and release gates | P1 | `@engine-agent`, `@quality-guardian`, `@docs-agent` | done | `docs/archive/2026-05-30/reviews/sceneview3d-src-005-resource-release-gate-2026-05-29.md`; resource-policy tests; `docs/engineering/ci-test-strategy.md` | resource-policy tests/docs and release gates name exact PR, beta, and stable renderer checks | `pnpm test:resources`; `pnpm test:schema -- tests/schema/resource-policy.test.ts` when schema policy changes; `pnpm test:release:scene3d`; visual snapshot gate or coordinator waiver for non-rendering changes |
| TASK-2026W23-SRC-006 | Issue stable runtime promotion readiness decision | P0 | `@quality-guardian`, `@coordinator` | done / no-go | `docs/reviews/sceneview3d-src-006-stable-runtime-gate-2026-05-29.md`; `docs/planning/sceneview3d-src-006-stable-runtime-decision-2026-05-29.md` | stable `view.mode: "scene3d"` remains blocked with explicit blocker codes and future Go prerequisites | `pnpm build:schema`; `pnpm check`; `pnpm test:release:scene3d`; `pnpm test:snapshot:visual`; coordinator records No-go decision |

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

## 2026-W23 AI natural-language map app generation

W23 moves from SceneView3D evidence closure into the product spine for
natural-language app generation. The approved boundary is:

```txt
prompt -> capabilitySummary -> MapGenerationCommandSkeleton -> apply_commands -> diagnostics -> snapshot/export evidence
```

Sprint handoff:
[sprint-2026-W23-ai-map-app-generation.md](./sprint-2026-W23-ai-map-app-generation.md).
Product specs:
[natural-language-map-app-generation.md](./feature-specs/natural-language-map-app-generation.md)
and [spatial-analysis-readiness.md](./feature-specs/spatial-analysis-readiness.md).

Stable `view.mode: "scene3d"` remains blocked after the SRC-006 No-go. Scene
browsing may appear only as `extensions.scene3d` planning/evidence.

| id | title | priority | owner | status | evidence target | acceptance | finish gates |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-2026W23-NLA-001 | Freeze natural-language map app product boundary | P0 | `@coordinator`, `@product-strategist` | done | feature spec and competitor refresh | product flow and capability boundaries are documented without stable 3D overclaim | scorecard and planning docs updated |
| TASK-2026W23-NLA-002 | Define generation `MapSpec` and command skeleton contract | P0 | `@engine-agent` | done | `docs/reviews/nla-002-generation-command-contract-2026-05-29.md` | generation request/result schemas and command skeleton keep TypeBox/Ajv, `MapCommand`, and `applyCommands` on the path; stable 3D requests return blocker diagnostics | `pnpm build:schema`; `pnpm test:commands`; `pnpm test:schema-sync`; `pnpm check` |
| TASK-2026W23-NLA-003 | Design MCP orchestration without new tool aliases | P0 | `@ai-agent` | done | `docs/reviews/nla-003-mcp-orchestration-evidence-2026-05-29.md` | generation evidence bundle uses only documented snake_case tools and keeps input/output schemas Ajv-compiled without adding an MCP alias | `pnpm test:ai`; `pnpm test:schema-sync`; `pnpm build:schema`; `pnpm check` |
| TASK-2026W23-NLA-004 | Define feature-display and spatial-analysis minimum generated scenarios | P1 | `@engine-agent`, `@ai-agent` | done | `docs/reviews/nla-004-generation-scenarios-2026-05-29.md` | source/layer/style edits, query readiness, dry-run/replay/rollback, and blocked analysis diagnostics are covered | `pnpm test:commands`; `pnpm test:ai`; `pnpm build:schema`; `pnpm test:schema-sync`; `pnpm check` |
| TASK-2026W23-NLA-005 | Keep scene browsing extension-only in generation flow | P1 | `@adapter-agent` | done | `docs/reviews/nla-005-scene-browsing-extension-boundary-2026-05-29.md` | `extensions.scene3d` evidence stays adapter-local; stable runtime remains blocked; renderer dependencies stay out of core/AI | `pnpm test:ai`; `pnpm --filter @gis-engine/scene3d-three-adapter build`; `pnpm test:adapter`; `pnpm test:release:scene3d`; `pnpm check` |
| TASK-2026W23-NLA-006 | Add end-to-end prompt evidence scenarios | P1 | `@qa-agent` | done | `docs/reviews/nla-006-prompt-evidence-scenarios-2026-05-29.md` | prompt-to-MapSpec/commands/snapshot/export covers display, analysis readiness, and scene browsing boundary | `pnpm test:ai`; `pnpm check` |
| TASK-2026W23-NLA-007 | Align docs, examples, and release wording | P2 | `@docs-agent` | done | `docs/reviews/nla-007-docs-release-wording-2026-05-29.md` | docs explain flow, boundaries, diagnostics, and export evidence without stable 3D promotion | docs audit; `pnpm test:examples`; `pnpm check` |
| TASK-2026W23-NLA-008 | Serialize planning status and next handoff | P1 | `@task-distributor` | done | `docs/reviews/nla-008-serialized-planning-handoff-2026-05-29.md` | burndown and dependency graph update only after evidence exists | planning diff review; `pnpm check`; `git diff --check` |

## 2026-W23 generation quality hardening

The NLA generation skeleton is complete. The generation quality hardening batch
is closed through
[sprint-2026-W23-generation-quality-hardening.md](./sprint-2026-W23-generation-quality-hardening.md)
and covers planner quality, provenance, query evidence, export packaging,
cloud-native source readiness, SceneView3D blocker transparency, and serialized
planning closure.

Stable `view.mode: "scene3d"` remains blocked. No task in this batch may add a
new MCP tool alias or mutate runtime state outside `MapCommand` /
`applyCommands`.

| id | title | priority | owner | status | evidence target | acceptance | finish gates |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-2026W23-NLQ-001 | Define typed prompt planner boundary | P0 | `@product-strategist`, `@ai-agent`, `@engine-agent` | done | `docs/reviews/nlq-001-prompt-planner-boundary-2026-05-29.md`; planner schemas and command tests | planner output is `MapGenerationRequest`-compatible and carries diagnostics, prompt hash, and trace metadata without raw prompt retention by default | `pnpm build:schema`; `pnpm test:commands`; `pnpm test:schema-sync`; `pnpm --filter @gis-engine/engine build` |
| TASK-2026W23-NLQ-002 | Add planner quality and provenance evidence | P0 | `@ai-agent`, `@qa-agent` | done | `docs/reviews/nlq-002-planner-provenance-evidence-2026-05-29.md`; AI evidence report and prompt QA scenarios | generation evidence exposes planner confidence, unsupported-intent diagnostics, and command trace provenance | `pnpm --filter @gis-engine/engine build`; `pnpm --filter @gis-engine/ai build`; `pnpm test:commands`; `pnpm test:ai`; final `pnpm check` |
| TASK-2026W23-NLQ-003 | Design spatial query evidence bundle | P0 | `@engine-agent`, `@ai-agent` | done | `docs/reviews/nlq-003-spatial-query-evidence-2026-05-29.md`; skeleton `analysisEvidence`; AI `spatialQueryEvidence` query cases | point/bbox query readiness is explicit and deterministic; buffer, overlay, routing, aggregation, and intersection remain blocked | `pnpm --filter @gis-engine/engine build`; `pnpm --filter @gis-engine/ai build`; `pnpm test:commands`; `pnpm test:ai`; `pnpm build:schema` |
| TASK-2026W23-NLQ-004 | Harden generated-app export manifest | P1 | `@ai-agent`, `@docs-agent`, `@qa-agent` | done | `docs/reviews/nlq-004-export-manifest-evidence-2026-05-29.md`; compact `generationEvidence` manifest summary | `export_example_app` surfaces generation evidence, diagnostics, spatial query, snapshot/export status, and resource notes without side-effect file writes | `pnpm --filter @gis-engine/ai build`; `pnpm test:ai`; `pnpm test:schema-sync`; `pnpm check` |
| TASK-2026W23-NLQ-005 | Create cloud-native source readiness matrix | P1 | `@engine-agent`, `@docs-agent` | done | `docs/planning/feature-specs/cloud-native-source-readiness.md`; source readiness matrix | support states and blocked diagnostics are documented before implementation claims | resource-policy doc audit; `pnpm check`; `git diff --check` |
| TASK-2026W23-NLQ-006 | Keep scene browsing blockers visible in generated apps | P1 | `@adapter-agent`, `@qa-agent` | done | `docs/reviews/nlq-006-scene-browsing-blocker-visibility-2026-05-29.md`; generated-app `sceneBrowsing` manifest summary | generated evidence preserves `extensions.scene3d` context and stable-runtime blocker codes; no `snapshot.renderer: "scene3d"` support | `pnpm --filter @gis-engine/ai build`; `pnpm test:ai`; `pnpm test:adapter`; `pnpm test:release:scene3d`; `pnpm check`; `git diff --check` |
| TASK-2026W23-NLQ-007 | Serialize quality-hardening planning status | P1 | `@task-distributor` | done | `docs/reviews/nlq-007-serialized-quality-hardening-planning-2026-05-29.md`; accepted owner evidence and planning diff | burndown and dependency graph update only after owner evidence or gate reports exist | planning diff review; `pnpm check`; `git diff --check` |

## 2026-W22 AI-native next loop

The next active planning batch starts from
[sprint-2026-W22-ai-native-next-loop.md](../archive/2026-05-30/planning/sprint-2026-W22-ai-native-next-loop.md).
It does not reopen the closed NLA/NLQ work; it plans product delivery and
promotion criteria for future implementation batches.

| id | title | priority | owner | status | evidence target | acceptance | finish gates |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-2026W22-AIN-001 | Design generated-app delivery UX contract | P0 | `@product-strategist`, `@ai-agent`, `@docs-agent` | done | `docs/reviews/ain-001-002-generated-app-delivery-acceptance-2026-05-30.md`; `generationEvidence.delivery.sections` | manifest sections map to evidence fields and blocker diagnostics | docs review; `pnpm test:ai`; `pnpm check` |
| TASK-2026W22-AIN-002 | Define generated-app acceptance and confirmation states | P0 | `@ai-agent`, `@qa-agent` | done | `ExampleAppDeliverySummarySchema`; `GenerationEvidenceBundle.delivery` | readiness, blocked, needs-confirmation, and follow-up-required states are schema-testable without MCP aliases | AI contract tests; schema-sync; `pnpm check` |
| TASK-2026W22-AIN-003 | Split cloud-native source promotion candidates | P1 | `@engine-agent`, `@docs-agent` | done | `docs/planning/feature-specs/cloud-native-source-promotion-candidates.md`; `docs/reviews/ain-003-004-promotion-criteria-2026-05-30.md` | schema/resource-policy/query/export gates are separated before implementation | resource-policy doc audit; `pnpm check` |
| TASK-2026W22-AIN-004 | Draft spatial-analysis promotion criteria | P1 | `@engine-agent`, `@ai-agent`, `@qa-agent` | done | `docs/planning/feature-specs/spatial-analysis-promotion-criteria.md`; `docs/reviews/ain-003-004-promotion-criteria-2026-05-30.md` | each future operation names schema, command semantics, diagnostics, fixtures, and MCP exposure assessment | planning diff review; `pnpm check` |
| TASK-2026W22-AIN-005 | Keep scene browsing copy extension-only | P1 | `@adapter-agent`, `@qa-agent`, `@docs-agent` | done | `docs/reviews/ain-005-scene-browsing-delivery-copy-2026-05-30.md` | user-facing copy preserves extension-only context and blocker codes without stable renderer claims | `pnpm test:ai`; `pnpm test:release:scene3d`; docs review; `pnpm check` |

2026-05-30 AIN execution update: `@ai-agent` landed the delivery acceptance
contract for `AIN-001` and `AIN-002`. Compact generated-app manifests now carry
`delivery.status`, `delivery.acceptance`, per-section readiness, confirmation
boundaries, source readiness, follow-up tasks, and extension-only scene
browsing state without adding MCP tool names or file-write side effects.

2026-05-30 AIN promotion-planning update: `@task-distributor` accepted
`AIN-003` and `AIN-004` as docs-only promotion-gate splits. Source candidates
and spatial-analysis operations are now separated into schema, resource-policy,
diagnostic, fixture, query/export, MCP exposure, and finish-gate tasks before
implementation.

2026-05-30 AIN scene browsing update: `@docs-agent` closed `AIN-005` as
extension-only delivery copy/evidence alignment. `sceneBrowsing.state`,
`stableRuntimeBlocked`, stable blocker codes, and public docs keep stable
`view.mode: "scene3d"` blocked. The AIN batch is closed.

## 2026-W22 Generated App Review Console

The AIN batch is closed, so the orchestrator switched to a new planning loop on
2026-05-30. The refreshed competitive/product evidence opens a new Generated
App Review Console sprint:
[sprint-2026-W22-generated-app-review-console.md](../archive/2026-05-30/planning/sprint-2026-W22-generated-app-review-console.md).
`GIR-001` is complete as a docs-only PRD/spec slice; implementation and QA
tasks remain queued.

| id | title | priority | owner | status | evidence target | acceptance | finish gates |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-2026W22-GIR-001 | Freeze generated-app review console PRD | P0 | `@product-strategist`, `@docs-agent` | done | `docs/planning/feature-specs/generated-app-review-console.md` | review sections map to delivery evidence, diagnostics, source readiness, spatial readiness, and scene browsing blockers | docs review; `pnpm check`; `git diff --check` |
| TASK-2026W22-GIR-002 | Add delivery-review acceptance fixtures | P0 | `@ai-agent`, `@qa-agent` | done | AI contract tests and delivery review scenarios | ready, blocked, needs-confirmation, and follow-up-required are schema-testable without MCP aliases | `pnpm vitest run tests/ai/generation-evidence.test.ts`; `pnpm check`; `pnpm test:schema-sync` |
| TASK-2026W22-GIR-003 | Map source readiness into review sections | P1 | `@engine-agent`, `@docs-agent` | done | source readiness cards and diagnostics mapping | PMTiles and future source candidates keep readiness/promotion boundaries before runtime implementation | docs audit; `pnpm check`; `git diff --check` |
| TASK-2026W22-GIR-004 | Map spatial-analysis readiness into review sections | P1 | `@engine-agent`, `@ai-agent`, `@qa-agent` | done | `docs/reviews/gir-004-spatial-analysis-review-section-mapping-2026-05-30.md`; spatial-analysis review cards | point/bbox remain read-only; blocked operations keep stable diagnostic codes and paths | `pnpm test:commands`; `pnpm test:ai`; `pnpm build:schema` when schemas change; `pnpm check` |
| TASK-2026W22-GIR-005 | Add prompt-to-delivery QA scenarios | P1 | `@qa-agent` | done | `docs/reviews/gir-005-prompt-to-delivery-qa-scenarios-2026-05-30.md`; prompt-to-delivery fixtures | successful 2D app, external resource confirmation, spatial blocked, and scene3d extension-only scenarios are covered | `pnpm test:ai`; `pnpm test:examples`; `pnpm check`; visual gate only for rendering changes |
| TASK-2026W22-GIR-006 | Audit public wording and release guardrails | P2 | `@docs-agent`, `@quality-guardian` | done | `docs/reviews/gir-006-public-wording-release-guardrails-2026-05-30.md`; `docs/engineering/release-wording-guardrails.md`; `tests/docs/release-wording-guardrails.test.ts` | public docs avoid stable scene3d, side-effect export, unsupported source, or advanced spatial-analysis claims | docs audit; `pnpm test:docs`; `pnpm check`; scene3d release gate only if scene evidence changes |

2026-05-30 GIR-002 execution update: the delivery-review acceptance fixtures
landed in `tests/ai/generation-evidence.test.ts` and the P0 queue advances to
`GIR-003` and `GIR-004`.

2026-05-30 GIR-003 execution update: source readiness review-card mappings
landed in `docs/planning/feature-specs/generated-app-review-console.md` and
`docs/planning/feature-specs/cloud-native-source-readiness.md`. The next
queued task is `GIR-005`.

2026-05-30 GIR-004 execution update: spatial-analysis review-section mapping
is covered by `docs/reviews/gir-004-spatial-analysis-review-section-mapping-2026-05-30.md`,
so the next queued task is `GIR-005`.

2026-05-30 GIR-005 execution update: prompt-to-delivery QA scenarios are
covered by `docs/reviews/gir-005-prompt-to-delivery-qa-scenarios-2026-05-30.md`,
so the next queued task is `GIR-006`.

2026-05-30 GIR-006 execution update: public wording and release guardrails are
covered by `docs/reviews/gir-006-public-wording-release-guardrails-2026-05-30.md`,
`docs/engineering/release-wording-guardrails.md`, and
`tests/docs/release-wording-guardrails.test.ts`. The Generated App Review
Console batch is complete; the orchestrator returns to planning state.

## 2026-05-30 Spatial Query Evidence Hardening

Post-GIR planning refreshed competitor/package evidence and opened the
[Spatial Query Evidence Hardening](./sprint-2026-W23-spatial-query-hardening.md)
sprint. This batch hardens point/bbox evidence only; it does not add a public
`spatial_query` MCP tool, geoprocessing execution, new source loaders, hidden
IO, or stable SceneView3D runtime support.

| id | title | priority | owner | status | evidence target | acceptance | finish gates |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-2026W23-SQH-001 | Freeze spatial query hardening boundary | P0 | `@product-strategist`, `@task-distributor` | done | `docs/planning/feature-specs/spatial-query-evidence-hardening.md`; `docs/planning/sprint-2026-W23-spatial-query-hardening.md`; `docs/reviews/sqh-001-spatial-query-hardening-boundary-2026-05-30.md` | point/bbox only; no MCP alias; no geoprocessing; no new source loader; no stable SceneView3D promotion | planning review; `pnpm test:docs`; `pnpm check`; `git diff --check` |
| TASK-2026W23-SQH-002 | Add explicit query capability gate | P0 | `@engine-agent`, `@ai-agent` | done | `docs/reviews/sqh-002-query-capability-gate-2026-05-30.md`; `GenerationEvidenceBundleSchema.spatialQueryEvidence.capabilityGate`; AI regression tests | ready state requires adapter query capability or explicit waiver | `pnpm build:schema`; `pnpm test:schema-sync`; `pnpm test:commands`; `pnpm test:ai`; `pnpm check`; `git diff --check` |
| TASK-2026W23-SQH-003 | Harden invalid point/bbox/source diagnostics | P1 | `@engine-agent`, `@qa-agent` | done | `docs/reviews/sqh-003-invalid-source-diagnostics-2026-05-30.md`; AI and adapter query diagnostic matrix | non-finite point, reversed bbox, missing/hidden layer/source, URL GeoJSON, PMTiles/vector unsupported source, and empty result cases have stable codes and paths | `pnpm test:commands`; `pnpm test:ai`; `pnpm test:adapter`; `pnpm check`; `git diff --check` |
| TASK-2026W23-SQH-004 | Add result caps and deterministic fixture evidence | P1 | `@qa-agent` | done | `docs/reviews/sqh-004-result-caps-fixtures-2026-05-30.md`; capped query fixture regression | result cap, feature count, layer/source ids, fixture hash, and diagnostic counts are recorded without unbounded payloads | `pnpm build:schema`; `pnpm test:schema-sync`; `pnpm test:ai`; `pnpm test:commands`; `pnpm check`; `git diff --check` |
| TASK-2026W23-SQH-005 | Map hardened query evidence into generated-app delivery | P1 | `@ai-agent`, `@docs-agent` | todo | delivery `data-and-analysis` mapping | query ready/follow-up/blocked states are visible without prose parsing or MCP aliases | `pnpm test:ai`; `pnpm test:docs`; `pnpm check` |
| TASK-2026W23-SQH-006 | Run quality gate and serialized planning closure | P1 | `@quality-guardian`, `@coordinator` | todo | gate report and planning closure | schema-first, command-only mutation, structured diagnostics, adapter boundary, resource policy, and frozen MCP tool names remain intact | `pnpm build:schema`; `pnpm check`; visual gate waived only with non-rendering rationale |

2026-05-30 SQH-001 execution update: the spatial query hardening boundary is
frozen by `docs/reviews/sqh-001-spatial-query-hardening-boundary-2026-05-30.md`.
The next queued task is `SQH-002`.

2026-05-30 SQH-002 execution update: explicit query capability gates are
implemented in generation evidence and covered by
`docs/reviews/sqh-002-query-capability-gate-2026-05-30.md`. The next queued
task is `SQH-003`.

2026-05-30 SQH-003 execution update: invalid point/bbox/source diagnostics are
covered by `docs/reviews/sqh-003-invalid-source-diagnostics-2026-05-30.md`.
The next queued task is `SQH-004`.

2026-05-30 SQH-004 execution update: result caps and deterministic fixture
evidence are covered by
`docs/reviews/sqh-004-result-caps-fixtures-2026-05-30.md`. The next queued task
is `SQH-005`.

---

## Evolution Tracking

> 本节由 `@coordinator`（evolution-guardian 职责）在每次进化审查时更新。
> 周度量快照由 `scripts/evolution-collector.mjs` 自动生成。

### 当前进化状态

| 维度 | 指标 | 当前值 | 趋势 | 上次更新 |
| --- | --- | --- | --- | --- |
| D1 估算准确度 | 平均偏差率 | 待收集 | — | 2026-05-30 |
| D2 瓶颈检测 | 关键路径占比 | 待收集 | — | 2026-05-30 |
| D3 质量趋势 | 门禁首次通过率 | 待收集 | — | 2026-05-30 |
| D4 知识积累 | 已验证模式数 | 0 | — | 2026-05-30 |
| D5 职责分布 | 偏差（>20% 告警） | 待收集 | — | 2026-05-30 |
| D6 决策权重 | 校准状态 | 基准（未校准） | — | 2026-05-30 |

### 任务复盘模板

每个 sprint 完成后，每个完成的 P0/P1 任务应追加以下字段：

```yaml
retrospective:
  estimated_hours: 0
  actual_hours: 0
  deviation_ratio: 0.0
  quality_surprises: "无 / 描述"
  reusable_patterns:
    - PAT-XXX: "模式描述"
  pitfalls_encountered:
    - PIT-XXX: "陷阱描述"
  improvement_suggestions: "下轮建议"
```

详细进化记录见 [evolution-ledger.md](./evolution-ledger.md)，进化框架见
[evolution-framework.md](./evolution-framework.md)。

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
| TASK-2026W23-005 | Decide whether promotion evidence summaries enter MCP context | P2 | `@ai-agent` | done | `docs/archive/2026-05-30/reviews/sceneview3d-mcp-promotion-evidence-decision-2026-05-23.md` keeps promotion summaries out of MCP context for W23 |
| TASK-2026W23-006 | Update roadmap, debt report, and release checklist with the promotion decision | P2 | `@docs-agent` | done | public docs reflect the decision and residual risk; promotion evidence summaries stay out of public MCP context |
| TASK-2026W23-007 | Run promotion gate review and issue go/no-go decision | P1 | `@quality-guardian` | done | gate report at `docs/archive/2026-05-30/reviews/sceneview3d-promotion-gate-2026-05-24.md` issues no-go for stable runtime while accepting the promotion-readiness package |

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
