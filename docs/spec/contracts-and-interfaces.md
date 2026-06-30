# Contracts and Interfaces

## 目标

本文件把外部评审中指出的工程缺口转成可实现的接口契约。所有实现必须优先满足这些 contract，再扩展功能。

本文件定义的是 core + extensions 的协议边界，不是固定在当前 2D 路径上的产品形态。稳定 2D 只是当前落地路径，3D、scene 和行业能力必须继续通过 extension payload 和 adapter 边界进入。

## Schema 和类型同步

### 单一事实来源

v0.1 采用 TypeBox schema 作为单一事实来源：

- TypeBox schema 生成 JSON Schema。
- TypeScript 类型通过 `Static<typeof Schema>` 得到。
- Ajv 负责 runtime validation。
- 发布物包含 `dist/schema/*.json`。

不允许手写一套 JSON Schema 再手写一套 `.d.ts`。

### CI 同步规则

CI 必须运行：

```txt
pnpm build:schema
pnpm test:schema-sync
pnpm test:schema-fixtures
```

校验内容：

- 生成的 schema 与仓库提交版本一致。
- 所有 valid fixtures 通过。
- 所有 invalid fixtures 失败且返回预期 diagnostic code。
- `metadata` 和 `extensions` 允许扩展字段，其他顶层字段默认禁止 unknown field。
- `SceneView3DExtensionSchema` 是 v1 3D extension 的单一契约；它可以校验
  `extensions.scene3d`，但不代表当前 runtime 已支持 `view.mode: "scene3d"`。

## MapSpec Contract

```ts
export interface MapSpec {
  version: "0.1";
  id?: string;
  revision?: string;
  capabilities?: CapabilityRequest;
  view: ViewSpec;
  sources: Record<string, SourceSpec>;
  layers: LayerSpec[];
  interactions?: InteractionSpec;
  metadata?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
}
```

规则：

- `version` 必填。
- `sources` key 是 source id。
- `layers` 是有序数组，顺序即渲染顺序。
- layer id 必须唯一。
- layer source 必须引用已存在 source。
- 稳定 2D layer 可声明 `filter`、`minzoom`、`maxzoom`；filter 必须是
  boolean MapLibre expression 子集，zoom range 必须满足 `0 <= minzoom <=
  maxzoom <= 24`。
- `revision` 由 runtime 维护，用于并发冲突检测。
- 实验字段只能进入 `extensions`。
- `extensions.scene3d` 必须按 `SceneView3DExtensionSchema` 演进；当前
  `MapSpec` 仍将其作为 extension payload，不把 3D sources/layers 提升到稳定
  `sources` / `layers`。
- `MapSpec` 的核心字段必须保持最小、通用、可组合；不要把参考实现的
  workbench 工作流或 `validate -> apply -> snapshot -> export` 误写成唯一、
  固定的协议顺序。这里的 `validate -> apply -> snapshot -> export` 只是最小
  闭环，不是所有消费者的唯一流程。

## 核心 / 扩展矩阵

这张矩阵把 contract 的稳定核、扩展负载和 adapter 边界拆开，便于审计哪些能力可以进入核心，哪些只能通过扩展或适配层进入。

| Contract area | Core | Extension / adapter | Notes |
| --- | --- | --- | --- |
| `MapSpec` 顶层 | `version`、`id`、`revision`、`view`、`sources`、`layers`、`interactions`、`metadata` | `extensions` 中的 scene / 3D / 行业 / 实验 payload | 核心字段应保持最小和可组合 |
| Scene / 3D | `extensions.scene3d` 作为版本化 payload | `SceneView3DExtensionSchema`、loader plan、mock snapshot/query、3D adapter spike | 不能把 `view.mode: "scene3d"` 提升成稳定 core 能力 |
| AI / MCP | 已公开的 snake_case 工具契约和输入/输出 schema | 新工具的扩展 payload、AI 证据和 adapter-local diagnostics | 新 tool 必须继续遵守 schema-first 和 contract tests |
| Workflow | `validate -> apply -> snapshot -> export` 作为证据最小闭环 | 其他消费者可以重排或只用其中一段 | 不把参考实现工作流写成唯一协议顺序 |
| Renderer boundary | `RendererAdapter` contract | MapLibre、WebGL2 lite、scene adapter 的实现细节 | renderer-specific 行为必须留在 adapter 后面 |

### Schema-to-Field Mapping

| TypeBox Schema | Tier | MapSpec Fields | Validation Path |
|---|---|---|---|
| `MapSpecSchema` | Core | `version`, `id`, `revision`, `view`, `sources`, `layers`, `interactions`, `metadata`, `capabilities` | `validateSpec()` → Ajv compiled |
| `ViewSpecSchema` | Core | `view.*` | nested in `MapSpecSchema` |
| `SourceSpecSchema` (7 types) | Core | `sources.*` | nested + semantic checks |
| `LayerSpecSchema` (7 types) | Core | `layers[*]` | nested + source reference checks |
| `InteractionSpecSchema` | Core | `interactions` | nested |
| `CapabilityRequestSchema` | Core | `capabilities` | nested |
| `SceneView3DExtensionSchema` | Extension | `extensions.scene3d.*` | `validateSceneView3DExtension()` |
| `SceneCameraSchema` | Extension | `extensions.scene3d.camera` | nested in extension schema |
| `SceneSourceSchema` (3 types) | Extension | `extensions.scene3d.sources.*` | nested in extension schema |
| `SceneLayerSchema` (3 types) | Extension | `extensions.scene3d.layers[*]` | nested in extension schema |

**Single source of truth**: TypeBox schemas in `packages/engine/src/spec/schemas/` are the canonical definitions. This table is a documentation convenience and must stay synchronized.

## Command Contract

### 命令基础字段

```ts
export interface MapCommandBase {
  id: string;
  version: "0.1";
  type: string;
  baseRevision?: string;
  author?: {
    type: "human" | "agent" | "system";
    id?: string;
    name?: string;
  };
  reason?: string;
  createdAt?: string;
  sourcePromptHash?: string;
  dryRun?: boolean;
}
```

### v0.1 命令集合

```ts
export type MapCommand =
  | AddSourceCommand
  | RemoveSourceCommand
  | AddLayerCommand
  | RemoveLayerCommand
  | SetPaintCommand
  | SetLayoutCommand
  | SetFilterCommand
  | SetLayerZoomRangeCommand
  | ReorderLayerCommand
  | SetViewCommand
  | FitBoundsCommand
  | SetSceneCameraCommand
  | AddSceneSourceCommand
  | RemoveSceneSourceCommand
  | AddSceneLayerCommand
  | RemoveSceneLayerCommand
  | SetSceneLayerVisibilityCommand;
```

SceneView3D commands are v1 preparation commands. They only mutate
`extensions.scene3d`, must produce deterministic JSON Patch and inverse patch,
and must not make `view.mode: "scene3d"` stable.

## SceneView3D Resource Load Contract

`@gis-engine/scene3d` exposes `validateSceneResourceLoadPlan` as the current
loader-level resource gate. Renderer loaders must submit a deterministic load
plan before fetching or partially rendering 3D resources.

The gate validates:

- 3D Tiles tileset JSON byte budget.
- glTF/model byte budget.
- Texture count and texture byte budget.
- Worker count cap.
- Request timeout.
- Missing scene source ids.
- Unsupported asset/load kinds.

It returns a structured report with `valid`, normalized policy, aggregate
totals, and `Diagnostic[]`. It does not fetch network resources and does not
make `view.mode: "scene3d"` stable.

## SceneView3D Three Adapter Spike Boundary

`@gis-engine/scene3d-three-adapter` is the current isolated adapter spike for a
future Three.js and 3DTilesRendererJS renderer. It may translate
`extensions.scene3d` sources into a deterministic `SceneResourceLoadPlan` and
run that plan through `validateSceneResourceLoadPlan`.

The spike exposes:

- `scene3dThreeAdapterBoundary`, with `status: "spike"` and
  `stableViewMode: false`.
- `getScene3DThreeAdapterCapabilities`, returning an experimental capability
  report for the adapter boundary.
- `buildScene3DThreeAdapterLoadPlan`, producing deterministic entries for
  terrain textures, glTF/model resources, and 3D Tiles tileset JSON.
- `evaluateScene3DThreeAdapterSpike`, returning resource-policy evidence plus
  an explicit `CAPABILITY.UNSUPPORTED` diagnostic for stable runtime rendering.
- `createScene3DThreeAdapterRuntime`, exposing adapter-local `load`,
  `snapshot`, `query`, `destroy`, and `rendererEvidence` methods while
  reusing mock SceneView3D snapshot/query contracts.
- `createScene3DThreeAdapterRendererEvidence`, converting future browser/WebGL
  capture metrics into `Scene3DRendererVisualEvidence` for
  `evaluateScene3DReleaseVisualGate`.
- `createScene3DThreeAdapterPromotionEvidenceSummary`, consolidating
  load-plan, resource, runtime, snapshot, query, and renderer visual evidence
  for W23 promotion readiness review while keeping `stablePromotionAllowed:
  false`.

The spike must not import or declare Three.js, 3DTilesRendererJS, CesiumJS,
glTF loaders, workers, or remote loading dependencies until real renderer
snapshot/query/visual evidence is added and accepted. It does not make
`view.mode: "scene3d"` stable.

Renderer evidence is accepted only when resource-policy diagnostics are clean
and the visual capture proves positive frame dimensions, nontransparent pixels,
pixels changed from the background, and no browser console errors. Missing or
blank captures must fail closed.

Promotion summaries are decision evidence only. They may report
`decisionReady: true` when every adapter evidence component is present and
error-free, but they still must not authorize stable `view.mode: "scene3d"`.

## SceneView3D Mock Snapshot And Query Contract

`@gis-engine/scene3d` exposes two mock-level contracts before any production 3D
renderer is introduced:

- `snapshotScene3DMock` returns a `SnapshotResult`-compatible report plus scene
  summary and pending source ids.
- `queryScene3DMock` returns deterministic `ScenePickResult[]` for visible,
  pickable scene layers.

These contracts read only `extensions.scene3d`. They can report blank scenes,
pending strict snapshot resources, missing scene layers, missing scene sources,
and deterministic mock picks, but they do not enable stable 3D view mode or
fetch external assets.

## SceneView3D Release Visual Gate Contract

`evaluateScene3DReleaseVisualGate` defines the release-runner gate for 3D visual
readiness before a production renderer exists. The gate combines:

- strict `snapshotScene3DMock` evidence with required scene sources marked
  loaded;
- deterministic `queryScene3DMock` evidence for pickable scene layers;
- optional future renderer visual evidence;
- optional coordinator waiver with `id`, `reason`, and `followUpTaskId`.

In release mode, missing renderer visual evidence fails unless a
coordinator-approved waiver is present. The waiver path cannot bypass pending
resources, blank-scene diagnostics, missing layer/source diagnostics, or missing
query evidence.

## SceneView3D MCP Context Contract

`get_context_summary` and `explain_spec` include a `scene3d` block when
`extensions.scene3d` is present and shaped like a SceneView3D extension. The
block is explicitly extension-only:

- `status: "extension-only"`
- `stableViewMode: false`
- `runtimeSupported: false`

It may expose source/layer counts, resource policy caps, mock snapshot summary,
mock query summary, and SceneView3D capability metadata. It must not imply that
`view.mode: "scene3d"` is supported by the current runtime. It must not expose
renderer or promotion evidence summaries; those stay in release-gate,
visual-runner, and adapter promotion artifacts until a future public AI use
case is approved.

## AI Orchestration Capability Summary

`get_context_summary` and `explain_spec` must include a `capabilitySummary`
block for natural-language planning. The block groups current public capability
boundaries by domain:

- `feature-display`: supported MapSpec source/layer display, command-only
  mutation tools, snapshot evidence, and any experimental display gates such as
  `fill-extrusion-lite`.
- `spatial-analysis`: read-only point/bbox query readiness when declared by
  adapter capabilities, plus explicit blockers for analysis workflows that do
  not have public MCP tools yet.
- `scene-browsing`: extension-only SceneView3D planning evidence, mock
  snapshot/query readiness, and an explicit stable runtime blocker for
  `view.mode: "scene3d"`.

The summary is discovery metadata only. It must reference existing snake_case
tool names and evidence fields; it must not introduce alias tool names or claim
that a natural-language model can execute unsupported geoprocessing or stable
SceneView3D runtime browsing.

## Natural-Language Generation Evidence Contract

Natural-language app generation is an orchestration contract rather than a new
runtime mutation path.

- Public generation requests are described by `MapGenerationRequestSchema`.
- Prompt planner inputs/results are described by
  `MapGenerationPromptPlannerInputSchema` and
  `MapGenerationPromptPlanSchema`. `planMapGenerationRequest()` accepts prompt
  hashes plus structured intent and sets `retainedRawPrompt: false`; raw prompt
  text is not retained by default.
- `createMapGenerationCommandSkeleton()` converts request data into
  `MapCommand[]`, `baseSpec`, replayed `spec`, target domains,
  `analysisEvidence`, and structured diagnostics. `analysisEvidence` records
  requested operations, accepted point/bbox query readiness operations, blocked
  operations, and diagnostic paths.
- All accepted mutations must replay through `apply_commands` /
  `applyCommands`; generated code must not edit `MapSpec` directly.
- `createGenerationEvidenceBundle()` composes the existing public tool
  contracts for handoff evidence: `get_context_summary`, `validate_spec`,
  `apply_commands`, `snapshot_spec`, `export_spec`, and
  `export_example_app`.
- `plannerEvidence` records planner id, prompt hash, trace id, command trace
  id, raw prompt retention state, confidence, accepted/unsupported intent
  fields, command source prompt hashes, and diagnostic counts.
- `spatialQueryEvidence` records whether spatial analysis was requested,
  accepted point/bbox readiness operations, blocked geoprocessing operations,
  adapter query capability metadata, visible inline-GeoJSON queryable
  layer/source ids, and deterministic query case counts. It must not expose full
  feature payloads.
- `export_example_app` may carry a compact `generationEvidence` summary on the
  returned manifest. The summary can include status, tool sequence, diagnostic
  counts, command/planner/spatial-query/scene-browsing/snapshot/export status,
  and file-count metadata. Scene browsing manifest evidence may include
  extension-only source/layer ids, mock snapshot/query counts, and
  `SCENE3D.STABLE_RUNTIME_*` blocker codes, but it must not write files,
  include raw prompts, include full feature payloads, include camera/resource
  payloads, or include snapshot data URLs.
- Cloud-native data source readiness is documented before implementation:
  `geojson`, `raster`, `pmtiles`, `vector`, `geoparquet`, `flatgeobuf`, and
  `geotiff` are public `SourceSpec` types. GeoParquet, FlatGeobuf, and GeoTIFF
  have schema/policy contracts and public `MapSpec` wiring, but runtime loading
  and query remain blocked until promotion gates add read-only fixtures,
  structured diagnostics, adapter boundaries, and tests. GeoTIFF display and
  sampling are also blocked until raster evidence and snapshots land. GeoZarr
  remains a blocked planning item until its own TypeBox schema, resource-policy
  paths, structured diagnostics, adapter boundaries, and tests are added.
- The bundle may return `status: "blocked"` even when the underlying `MapSpec`
  is schema-valid. Generation boundary diagnostics, capability blockers, failed
  planner evidence, failed command replay, failed spatial query evidence, or
  failed snapshot evidence decide readiness.
- No `generate_map_app`, renderer-specific shortcut, camelCase alias, or
  private adapter evidence is part of the public MCP contract.
- Scene browsing generation may use `extensions.scene3d` camera/source/layer
  evidence. Stable `view.mode: "scene3d"`, `capabilities.renderer:
  "scene3d"`, and `capabilities.dimensions: ["3d"]` generation remain blocked
  until a future quality gate and coordinator decision record a Go.

### 事务语义

```ts
export interface ApplyOptions {
  dryRun?: boolean;
  transaction?: "atomic" | "best-effort";
  collectTrace?: boolean;
  traceId?: string;
}
```

规则：

- 默认 `transaction` 是 `atomic`。
- `atomic` 模式下任一命令失败，整批命令不改变 runtime state。
- `best-effort` 模式下成功命令保留，失败命令返回 `failed`。
- `dryRun` 不改变 runtime state，但必须返回将要产生的 patch、diagnostics 和 capability warnings。
- `baseRevision` 不匹配时返回 `CONFLICT.BASE_REVISION`。
- v0.1 默认不做自动合并；冲突只返回诊断和可选中等置信度 `SuggestedFix`，three-way merge 后置到 v0.2。

### Patch 格式

v0.1 使用 RFC 6902 JSON Patch。

```ts
export interface CommandResult {
  commandId: string;
  sequenceId: number;
  status: "applied" | "skipped" | "failed";
  baseRevision?: string;
  nextRevision?: string;
  changedPaths: string[];
  patch?: JsonPatchOperation[];
  inversePatch?: JsonPatchOperation[];
  diagnostics: Diagnostic[];
  traceId?: string;
}
```

```ts
export interface ApplyCommandsResult {
  spec: MapSpec;
  results: CommandResult[];
  transaction: "atomic" | "best-effort";
  dryRun: boolean;
  committed: boolean;
  rolledBack: boolean;
  traceId: string;
  traces?: CommandTrace[];
}
```

规则：

- `patch` 表示实际变更。
- runtime-managed `revision` 更新必须进入 patch，确保 adapter state 可通过 patch 与 `exportSpec()` 对齐。
- `inversePatch` 用于 rollback。
- `changedPaths` 必须稳定排序。
- `skipped` 用于幂等命令，例如重复添加完全相同的 source。
- `failed` 必须包含至少一个 error diagnostic。
- `traces` 只在 `collectTrace: true` 时返回，用于审计，不进入 `MapSpec`。
- patch path 必须是规范 JSON Pointer；`remove` 和 `replace` 必须记录旧值以生成 `inversePatch`。
- v0.1 只声明并实现 `add`、`remove`、`replace`。`move`、`copy`、`test` 后置，避免类型承诺超过实现能力。

## Diagnostic Contract

```ts
export interface Diagnostic {
  severity: "error" | "warning" | "info";
  code: DiagnosticCode;
  message: string;
  path?: string;
  relatedResources?: RelatedResource[];
  fix?: SuggestedFix;
}
```

### Code 命名空间

| 命名空间 | 示例 | 含义 |
| --- | --- | --- |
| `SPEC` | `SPEC.UNKNOWN_FIELD` | MapSpec 结构错误 |
| `SRC` | `SRC.NOT_FOUND` | source 错误 |
| `LAYER` | `LAYER.DUPLICATE_ID` | layer 错误 |
| `EXPR` | `EXPR.TYPE_MISMATCH` | expression 错误 |
| `VIEW` | `VIEW.OUT_OF_DATA_BOUNDS` | 视图错误 |
| `RENDER` | `RENDER.ADAPTER_ERROR` | 渲染错误 |
| `SNAPSHOT` | `SNAPSHOT.BLANK_CANVAS`, `SNAPSHOT.RESOURCE_PENDING` | 截图验证错误 |
| `CAPABILITY` | `CAPABILITY.UNSUPPORTED` | 能力协商错误 |
| `COMMAND` | `COMMAND.INVALID_PATCH` | 命令错误 |
| `CONFLICT` | `CONFLICT.BASE_REVISION` | 并发冲突 |
| `MIGRATION` | `MIGRATION.UNSUPPORTED_VERSION` | 迁移错误 |
| `SECURITY` | `SECURITY.URL_BLOCKED`, `SECURITY.RESOURCE_TOO_LARGE`, `SECURITY.RESOURCE_TIMEOUT`, `SECURITY.UNSUPPORTED_ASSET_TYPE` | 安全和资源策略错误 |

### SuggestedFix

```ts
export interface SuggestedFix {
  kind: "json-patch" | "command" | "manual";
  confidence: "high" | "medium" | "low";
  message: string;
  patch?: JsonPatchOperation[];
  command?: MapCommand;
}
```

规则：

- `high` confidence fix 必须可由机器执行，但不等于自动执行。
- `manual` fix 只能给人类或 AI 解释，不能自动执行。
- 一个 diagnostic 最多给一个首选 fix，避免 AI 选择歧义。
- 自动应用必须经过 `FixPolicy`，默认需要 human confirmation 或 system migration 权限。

## Renderer Adapter Contract

```ts
export interface RendererAdapter {
  readonly id: string;
  readonly version: string;

  getCapabilities(): Promise<CapabilityReport>;
  load(spec: NormalizedMapSpec, context: RenderContext): Promise<void>;
  applyPatch(patch: JsonPatchOperation[], context: RenderContext): Promise<AdapterApplyResult>;
  queryFeatures(options: QueryFeaturesOptions): Promise<FeatureQueryResult>;
  snapshot(options: SnapshotOptions): Promise<SnapshotResult>;
  resize(size: { width: number; height: number }): void;
  destroy(): Promise<ResourceReport>;

  on(event: "error" | "warning" | "stats", listener: AdapterEventListener): Unsubscribe;
}
```

### Mutation and preflight boundary

规则：

- `applyPatch` 是 mutating API。调用成功后，adapter 必须把内部 renderer state、`exportSpec()` 和可导出的 renderer style 推进到 patch 后状态。
- `applyPatch` 返回 error diagnostic 或抛错时不得部分提交；adapter 必须保留上一次已提交的 spec/style。
- `dryRun` 和 preflight 不通过 `RendererAdapter.applyPatch` 表达，也不要求给 `applyPatch` 增加 `dryRun` 参数。
- Runtime 处理 `ApplyOptions.dryRun` 时必须停在 command/preflight 层，不穿透到 adapter mutation 路径。
- MapLibre v0.1 preflight 只允许执行 schema validation、supported feature matrix/capability 检查，以及 `MapSpec -> MapLibre style` transformer 检查。
- MapLibre preflight 不得调用真实 renderer mutation、snapshot、query、worker/tile/network/canvas 流程，也不得修改 adapter 的 committed `exportSpec()` 或 `exportStyle()`。

### CapabilityReport

```ts
export interface CapabilityReport {
  renderer: string;
  dimensions: Array<"2d" | "2_5d" | "3d">;
  sources: string[];
  layers: string[];
  expressions: string[];
  queries: string[];
  snapshot: {
    supported: boolean;
    formats: Array<"png" | "jpeg" | "data-url">;
  };
  experimental: string[];
}
```

规则：

- `CapabilityReportSchema` 是能力报告的单一外部契约，MCP context/explain 工具必须按此 schema 校验输入。
- `renderer`、`sources`、`layers`、`expressions`、`queries`、`snapshot` 和 `experimental` 都必须显式给出，不允许任意 capability 对象绕过 schema。
- `sources` 当前可声明 `geojson`、`raster`、`pmtiles`、`vector`；`layers` 当前可声明 `background`、`raster`、`fill`、`line`、`circle`、`symbol-lite` 和 experimental `fill-extrusion-lite`。
- experimental 能力只能通过 `experimental` 暴露；MapLibre adapter 当前用该字段声明 beta `fill-extrusion-lite`。

Adapter contract tests 必须验证：

- `load -> snapshot -> destroy` 成功。
- `applyPatch` 后 `exportSpec()` 和 renderer state 一致。
- unsupported layer 返回 `CAPABILITY.UNSUPPORTED`。
- gated `fill-extrusion-lite` 映射到 MapLibre `fill-extrusion`。
- unsupported feature 的 preflight/apply failure 不改变 adapter 上一次已提交的 `exportSpec()` 或 renderer style。
- runtime-level `dryRun` 不调用 adapter mutation 路径。
- adapter error 转成 `RENDER.ADAPTER_ERROR`。
- `destroy()` 返回资源释放报告。
- contract harness 必须使用本地静态服务、固定 fixtures、无公网依赖。

## Snapshot Contract

```ts
export interface SnapshotOptions {
  width?: number;
  height?: number;
  pixelRatio?: number;
  format?: "png" | "jpeg" | "data-url";
  targetLayers?: string[];
  validation?: SnapshotValidationOptions;
}

export interface SnapshotValidationOptions {
  minNonTransparentPixels?: number;
  minChangedPixelsFromBackground?: number;
  minTargetLayerPixels?: number;
  maxRendererErrors?: number;
}
```

默认阈值：

- `minNonTransparentPixels`: `100`
- `minChangedPixelsFromBackground`: `100`
- `minTargetLayerPixels`: `20`
- `maxRendererErrors`: `0`

Baseline diff 策略：

- health check 必须通过。
- 有 baseline 时允许默认 `0.5%` 像素差。
- 单像素颜色 delta 默认阈值为 `10`。
- 没有 baseline 时生成 warning 和 actual image，不直接失败。
- 更新 baseline 必须显式运行 snapshot update 命令。

算法要求：

- 固定 viewport 和 pixel ratio。
- 等待 renderer idle 或超时。
- 读取 canvas pixels。
- 统计 alpha 大于 0 的像素。
- 统计与背景色不同的像素。
- 如果 adapter 支持 layer mask，统计目标图层可见像素。
- 无法统计目标图层时返回 warning，不伪造通过。

## MCP Tool Contract

当前 MCP public tool names 是 snake_case，camelCase 不作为别名暴露：

```txt
validate_spec
apply_commands
export_spec
get_context_summary
snapshot_spec
explain_spec
export_example_app
```

规则：

- 每个 tool descriptor 必须包含 `inputSchema` 和 `outputSchema`。
- 所有 `inputSchema` / `outputSchema` 必须可被 Ajv 编译，并由 `pnpm test:schema-sync` 覆盖。
- 工具失败必须返回包含 `Diagnostic` 的结构化结果，不允许只返回 `{ message }` 或纯自然语言。
- `export_spec` 即使没有 commands，也必须先校验输入 spec。
- `get_context_summary` 和 `explain_spec` 接收的 `capabilities` 必须符合 `CapabilityReportSchema`。
- MCP tools 只能调用 engine 的公开 schema、validator、commands、snapshot 和 example export API，不访问 renderer 私有对象。

## Expression 子集

当前支持 JSON-array expression 子集：

```txt
Expression =
  ["get", propertyName]
  ["literal", value]
  ["case", condition, trueValue, falseValue]
  ["match", input, label, output, ..., fallback]
  ["interpolate", ["linear"], input, stopInput, stopOutput, ...,]
  ["step", input, defaultOutput, stopInput, stopOutput, ...]
  ["zoom"]
  ["to-number", input]
  ["to-string", input]
```

类型规则：

- paint property 声明 expected type。
- expression validator 必须推导 output type。
- output type 不匹配时返回 `EXPR.TYPE_MISMATCH`。
- 属性不存在时返回 warning `EXPR.PROPERTY_UNKNOWN`，不直接失败。
- 颜色字符串必须通过 color validator。
- `get` 在没有 sample feature schema 时输出 `unknown`。
- `interpolate` 输出只能是 number 或 color。
- `case`、`match`、`step` 的输出分支必须类型兼容。

## Migration Contract

```ts
export interface Migration {
  from: string;
  to: string;
  migrate(spec: unknown): MigrationResult;
}

export interface MigrationResult {
  spec?: MapSpec;
  diagnostics: Diagnostic[];
  appliedPatches: JsonPatchOperation[];
}
```

规则：

- 每个 breaking schema change 必须提供 migration。
- migration 必须可 dry-run。
- migration 输出必须通过目标版本 schema。
- 不支持版本返回 `MIGRATION.UNSUPPORTED_VERSION`。

## Audit 和 Trace

```ts
export interface CommandTrace {
  traceId: string;
  commandId: string;
  sequenceId: number;
  status: "applied" | "skipped" | "failed";
  startedAt: string;
  endedAt: string;
  baseRevision?: string;
  nextRevision?: string;
  author?: MapCommandBase["author"];
  reason?: string;
  sourcePromptHash?: string;
  diagnostics: Diagnostic[];
  changedPaths: string[];
}
```

规则：

- `applyCommands` 默认不返回 trace；调用方需要传 `collectTrace: true`。
- MCP `apply_commands` 可传 `collectTrace: true` 返回同样的 trace。
- `exportSpec()` 不默认包含 trace。
- `startedAt` 和 `endedAt` 由 `createdAt` 和 `sequenceId` 派生，保持 replay 证据确定性。
- `sourcePromptHash` 只保存 hash，不保存原始 prompt。
- destructive command 可被 policy layer 拦截。

## Concurrency Contract

v0.1 使用 optimistic concurrency。

- `revision` 由 runtime 维护。
- command 可携带 `baseRevision`。
- 不匹配时拒绝并返回 `CONFLICT.BASE_REVISION`。
- 不做自动 retry。
- 不做 three-way merge。
- 若命令可安全重放，可以返回 confidence 为 `medium` 的 `SuggestedFix`。
- 当调用方启用 `collectTrace` 时，所有冲突必须写入 trace，且 trace status 为 `failed`。

## Security Contract

- `MapSpec` 不允许执行任意 JavaScript。
- expression 必须纯函数化。
- URL source 必须经过 allowlist 或 policy check。
- 默认只允许相对 URL、`localhost`、`127.0.0.1` 和显式配置的 `https` host。
- 默认禁止任意 `file:` 和未配置公网 host。
- 远程资源必须有 timeout 和 size limit。
- `export_example_app` 只能写入受控目标目录，或返回文件清单。
- MCP tools 不得读取 renderer 私有对象。
- 远程资源失败必须返回 diagnostic，不能静默降级。
