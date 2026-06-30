# AI 原生地图引擎核心框架

## 定位

GIS Engine 是一个 Web TypeScript first 的 AI 原生地图运行时。它的核心资产不是另一个大而全的地图 SDK，而是一个稳定、可验证、可回放、可由 AI 操作的声明式地图协议。

2D/3D 架构边界、竞品软件工程对比和 AI 原生标准见 [Capability Scorecard](../research/capability-scorecard.md)。

当前稳定路径优先落在 2D，但协议本身应保持 core + extensions 的通用形态；不要把示例工作流或 2D 术语写成协议上限。设计边界说明见 [design-limits-and-generalization-boundaries.md](../design/design-limits-and-generalization-boundaries.md)。

v0.1 的可验收范围见 [core-capabilities.md](./core-capabilities.md)，具体接口契约见 [../spec/contracts-and-interfaces.md](../spec/contracts-and-interfaces.md)。

首版目标：

- 支持 AI Agent 可靠创建、修改、验证和导出 Web 地图应用。
- 用 `MapSpec` 统一 AI、代码、测试、文档和示例。
- 用 command 系统约束所有增量修改。
- 用 validation、diagnostics 和 snapshot 降低 AI 生成空白地图或错误地图的概率。
- 用 MapLibre adapter 先交付可用渲染能力，同时保留轻量自研 WebGL2 后端实验空间。
- 把 workbench 视为参考实现，把 `validate -> apply -> snapshot -> export` 视为最小闭环而不是唯一工作流。

非目标：

- v0 不替代 Cesium。
- v0 不自研完整 MapLibre 级别渲染内核。
- v0 不承诺完整 3D、完整 expression、完整文字碰撞和排版。
- v0 不把 AI/MCP 放进渲染核心生命周期。

## 核心 / 扩展矩阵

这张矩阵把稳定 core、扩展命名空间和 adapter 边界放在同一层看，避免把某个 demo 流程误写成协议上限。

| 区域 | Core 保留什么 | 扩展 / adapter 承担什么 | 备注 |
| --- | --- | --- | --- |
| `MapSpec` 核心字段 | `version`、`view`、`sources`、`layers`、`interactions`、`metadata` | 行业域、scene、3D、实验能力放入 `extensions` | 核心字段保持最小、通用、可组合 |
| `extensions.*` | 只保留版本化扩展入口 | `scene3d`、`aiHints`、terrain、vertical payload、第三方插件字段 | 3D / scene / 行业能力走扩展命名空间 |
| `RendererAdapter` | 只定义稳定渲染契约 | MapLibre、WebGL2 lite、scene adapter 的实现细节 | 具体渲染器行为必须留在 adapter 后面 |
| 参考实现 | 提供可运行 proof-of-concept | 不定义产品形态，也不替代主协议 | `examples/ai-map-workbench` 只做 Phase 1 参考实现 |
| 工作流 | `validate -> apply -> snapshot -> export` 作为最小闭环 | 其他消费者可按需要重组顺序 | 该闭环是证据最小闭环，不是唯一流程 |

### MapSpec Field-Level Core / Extension Boundary

| Field Path | Tier | Schema | Notes |
|---|---|---|---|
| `version` | **Core** | `MapSpecSchema` | Required, locked literal `"0.1"` |
| `id` | **Core** | `MapSpecSchema` | Optional project identifier |
| `revision` | **Core** | `MapSpecSchema` | Optional, runtime-managed conflict detection |
| `capabilities` | **Core** | `CapabilityRequestSchema` | Optional, declares required renderer/source/layer/snapshot/query capabilities |
| `view` | **Core** | `ViewSpecSchema` | Required, 2D/2.5D view state (center, zoom, bearing, pitch, bounds) |
| `view.mode` | **Core** | `ViewSpecSchema` | Optional; value `"scene3d"` is reserved but does **not** imply stable runtime |
| `sources` | **Core** | `SourceSpecSchema` | Required, 7 source types (geojson, raster, pmtiles, vector, flatgeobuf, geoparquet, geotiff) |
| `layers` | **Core** | `LayerSpecSchema` | Required, 7 layer types (background, raster, fill, line, circle, symbol-lite, fill-extrusion-lite) |
| `interactions` | **Core** | `InteractionSpecSchema` | Optional, 6 interaction toggles (pan, zoom, hover, click, select, popup) |
| `metadata` | **Core** | open record | Optional, non-runtime provenance info |
| `extensions` | **Extension** | open record | Optional, versioned extension entry point |
| `extensions.scene3d` | **Extension** | `SceneView3DExtensionSchema` | 3D scene extension with independent schema validation; camera, lights, terrain, scene sources/layers |
| `extensions.*` (other) | **Extension** | none | Third-party, domain, or experimental payloads |

**Capabilities that must enter through `extensions`** (never core):
terrain, scene, aiHints, globe, analysis — require `extensions` + capability gate.

**Minimum closed loop** (composable, not mandatory global order):
`validate → apply → snapshot → export`
Each step is independently callable; the loop is evidence-gathering, not a prescribed workflow.

## v0 包结构

首版包拆分必须克制。`scene3d` 已作为 v1 3D contract scaffold 独立成包，但仍不包含生产 3D renderer。成熟后的 `analysis`、`devtools`、`tiles`、`sources`、`layers` 暂时都作为内部目录或后续包处理。

```txt
packages/
  engine/
    src/
      spec/           # TypeBox schemas, validation, resource policy, expression validator, JSON Patch
      commands/       # applyCommands, buildPatch
      diagnostics/    # DiagnosticCodes, Scene3DStableRuntimeBlockerCodes
      generation/     # MapGenerationCommandSkeleton, planMapGenerationRequest (prompt→command handoff)
      sources/        # SourceLoader contract (v0.3+ architecture hardening)
      renderer/       # RendererAdapter contract, registry, MockAdapter, MapLibre adapter & transformer
      runtime/        # createMap, MapRuntime (lifecycle, command dispatch, adapter sync)
      index.ts
      types.ts
  ai/
    src/
      tools/          # applyCommands, contextSummary, explainSpec, exportExampleApp, generationEvidence, schemaDiagnostics, snapshotSpec
      mcp/            # MCP server entry point
      index.ts
  scene3d/
    src/
      index.ts        # package boundary scaffold, mock snapshot/query, resource load plan
  scene3d-three-adapter/
    src/
      index.ts        # adapter spike: deterministic load plan, resource policy evidence, runtime shim
examples/
docs/
```

> **注意**: v0.1 架构文档中曾规划的 `sources/`、`layers/`、`interactions/`、
> `snapshot/` 子目录正在逐步落地。`sources/` 已于 2026-05-31 引入
> `SourceLoader` 契约接口，定义 engine-level source 验证和能力内省，但不
> 替代 renderer adapter 的实际数据加载。`layers/`、`interactions/`、
> `snapshot/` 的独立 contract 留待 v0.3+。SourceSpec/LayerSpec 的定义归入
> `spec/schemas/`；snapshot logic 分布于 adapter contract 和 smoke/visual
> test harness 中。


公开包：

- `@gis-engine/engine`：地图运行时、`MapSpec` 类型、schema、validator、command apply、snapshot、query、MapLibre adapter、实验 WebGL2 lite renderer。
- `@gis-engine/ai`：MCP tools、AI 友好命令 schema、诊断解释、导出示例应用。
- `@gis-engine/scene3d`：SceneView3D v1 包边界脚手架、capability report、未实现 renderer 的结构化诊断和 3D 依赖隔离守卫；不承诺 `view.mode: "scene3d"` 稳定运行。
- `@gis-engine/scene3d-three-adapter`：W28 Three.js adapter spike 包边界；当前只生成 deterministic load plan 并验证 resource policy，不导入 Three.js/3DTilesRendererJS，不承诺稳定 3D runtime。
- `examples`：可运行样例，不作为 npm 包发布。
- `docs`：架构、指南、研究和评审文档。

暂缓独立发布：

- `@gis-engine/analysis`
- `@gis-engine/devtools`
- `@gis-engine/tiles`
- `@gis-engine/sources`
- `@gis-engine/layers`

这些边界在 v0.1/v0.2 先以内部模块存在，等 API 和使用场景稳定后再拆包。

## 架构分层

```mermaid
flowchart TD
  User["Developer or AI Agent"] --> Spec["MapSpec v0.1"]
  User --> Commands["Commands"]
  Spec --> Validator["Schema and Validator"]
  Commands --> Runtime["Engine Runtime"]
  Validator --> Runtime
  Runtime --> Diagnostics["Diagnostics"]
  Runtime --> Snapshot["Snapshot"]
  Runtime --> Query["Feature Query"]
  Runtime --> RendererAdapter["Renderer Adapter"]
  RendererAdapter --> MapLibre["MapLibre Adapter"]
  RendererAdapter --> WebGL2Lite["WebGL2 Lite Experimental"]
  Generation["Generation (prompt planner + command skeleton)"] --> Validator
  Generation --> Commands
  AI["@gis-engine/ai"] --> Validator
  AI --> Commands
  AI --> Diagnostics
  AI --> Snapshot
  AI --> Generation
  Scene3D["@gis-engine/scene3d scaffold"] --> Spec
  Scene3D --> Diagnostics
  Scene3DThree["@gis-engine/scene3d-three-adapter spike"] --> Scene3D
  Scene3DThree --> Diagnostics
  Scene3DThree --> RendererAdapter
```

分层原则：

- `spec` 是最稳定的层，独立于 renderer、AI 和 MCP。
- `core` 管理生命周期、状态树、命令调度、事件系统、插件注册和能力协商。
- `generation` 是 AI 自然语言 → 命令骨架的编排层，消费 spec schema 和 command
  契约，但不拥有 runtime 状态。它是 engine 和 ai 之间的桥梁：由 engine 提供
  类型安全的 handoff 接口，由 ai 消费并暴露给 MCP。
- `renderer` 只负责把规范化后的 source/layer/view 渲染出来，不拥有 `MapSpec` 业务规则。
- `ai` 是 adapter 和工具层，可调用 validator、command、snapshot、diagnostics，但不是 runtime 的必选依赖。
- source loading 和 layer rendering 当前委托给 renderer adapter（MapLibre）；独立的 engine-level source/layer contract 留待 v0.3+ 架构加固。

## 核心 API

```ts
import { createMap } from "@gis-engine/engine";

const map = await createMap(container, spec, {
  renderer: "maplibre",
});

await map.apply([
  {
    id: "cmd-style-districts",
    version: "0.1",
    type: "setPaint",
    baseRevision: spec.revision,
    layerId: "district-fill",
    paint: {
      "fill-color": ["interpolate", ["linear"], ["get", "score"], 0, "#dbeafe", 100, "#1d4ed8"],
    },
  },
]);

const exported = map.exportSpec();
const report = await map.validate();
const features = await map.queryFeatures({ point: [120, 30], layers: ["district-fill"] });
const snapshot = await map.snapshot({ format: "png" });

map.destroy();
```

API 定义：

```ts
export function createMap(
  container: HTMLElement,
  spec: MapSpec,
  options?: CreateMapOptions,
): Promise<GisMap>;

export interface GisMap {
  apply(commands: MapCommand | MapCommand[]): Promise<CommandResult[]>;
  exportSpec(): MapSpec;
  validate(options?: ValidateOptions): Promise<ValidationReport>;
  queryFeatures(options: QueryFeaturesOptions): Promise<FeatureQueryResult>;
  snapshot(options?: SnapshotOptions): Promise<SnapshotResult>;
  destroy(): void;
}
```

## MapSpec v0.1

`MapSpec` 是稳定协议。它必须能被 AI 生成、被开发者手写、被 JSON Schema 校验、被 TypeScript 类型提示、被测试回放。

```ts
export interface MapSpec {
  version: "0.1";
  capabilities?: CapabilityRequest;
  view: ViewSpec;
  sources: Record<string, SourceSpec>;
  layers: LayerSpec[];
  interactions?: InteractionSpec;
  metadata?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
}
```

固定字段：

- `version`：schema 版本，v0.1 必填。
- `capabilities`：声明需要的 renderer、source、layer、snapshot、query 能力。
- `view`：center、zoom、bearing、pitch、bounds、constraints。
- `sources`：GeoJSON、raster、PMTiles 等数据源定义。
- `layers`：有序图层列表，图层顺序即渲染顺序。
- `interactions`：pan、zoom、hover、click、select、popup 等交互配置。
- `metadata`：项目、作者、数据出处、示例说明等非运行时信息。
- `extensions`：terrain、scene、aiHints、实验字段和第三方插件字段。

不进入 v0 核心字段：

- `terrain`
- `scene`
- `aiHints`
- `globe`
- `analysis`

这些能力必须通过 `extensions` 和 capability gate 进入，避免早期 schema 被未来 3D 或分析能力锁死。

## 命令系统

命令系统是 AI 能可靠修改地图的关键。所有命令必须幂等、可校验、可回放，并返回结构化结果。

### 命令分类

| 分类 | 责任 | 示例 |
| --- | --- | --- |
| `SpecCommand` | 修改声明式地图状态 | `addSource`、`addLayer`、`setPaint`、`setLayout`、`removeLayer`、`reorderLayer` |
| `ViewCommand` | 修改视图和交互状态 | `setView`、`fitBounds`、`setPitch`、`setBearing` |
| `RuntimeQuery` | 查询运行时状态，不改变 spec | `queryFeatures`、`snapshot`、`inspectLayers` |
| `AITool` | AI 编排和开发工具能力 | `validate_spec`、`apply_commands`、`explain_spec`、`snapshot_spec`、`export_example_app` |

### 命令结果

完整命令 contract 使用 RFC 6902 JSON Patch，见 [../spec/contracts-and-interfaces.md](../spec/contracts-and-interfaces.md)。

```ts
export interface CommandResult {
  commandId: string;
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

结果必须回答：

- 是否应用成功。
- 为什么失败或跳过。
- 修改了哪些 `MapSpec` 路径。
- 当启用 `collectTrace` 时，谁发起命令、为什么发起、源 prompt hash 是什么，以及冲突诊断如何进入 audit trace。
- 是否产生 warning。
- AI 可以如何修复。

## 诊断模型

诊断是 AI 原生能力的核心，不只是错误文本。

```ts
export interface Diagnostic {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  path?: string;
  fix?: SuggestedFix;
}
```

诊断 code 必须使用命名空间，例如 `SPEC.UNKNOWN_FIELD`、`SRC.NOT_FOUND`、`LAYER.DUPLICATE_ID`、`EXPR.TYPE_MISMATCH`、`SNAPSHOT.BLANK_CANVAS`。机器可执行修复必须使用 `SuggestedFix`，禁止只返回自然语言修复建议。

v0 必须覆盖：

- source id 不存在。
- layer id 重复。
- source/layer 类型不匹配。
- paint/layout 类型错误。
- 图层不可见。
- 图层顺序异常。
- view 不在数据范围附近。
- 瓦片或数据加载失败。
- snapshot 检测到空白画布。

## 渲染策略

### v0.1 默认：MapLibre adapter

默认后端使用 MapLibre adapter，原因：

- 快速获得稳定 2D 地图能力。
- 避免 v0 从零实现矢量瓦片、symbol、collision、expression 和 tile cache。
- 把首版差异化集中在 `MapSpec`、commands、diagnostics、snapshot 和 AI tools。

MapLibre adapter 责任：

- 将 `MapSpec` 子集转换成 MapLibre style。
- 接收 command 后进行最小增量更新。
- 把 MapLibre 的事件、错误和图层状态转成本项目诊断模型。
- 支持 snapshot 和 feature query。

### 同步实验：renderer-webgl2-lite

实验后端用于验证长期自研方向，不阻塞 v0.1 发布。

覆盖范围：

- GeoJSON source。
- raster source。
- background、raster、fill、line、circle。
- 基础 pan/zoom。
- 基础 picking。

不覆盖：

- 完整 vector tile。
- symbol collision。
- 高级 expression。
- terrain。
- 3D Tiles。

## 数据流

```txt
MapSpec
  -> validateSpec
  -> normalizeSpec
  -> capability negotiation
  -> renderer adapter
  -> source loading
  -> layer compilation
  -> render
  -> diagnostics + snapshot + query
```

命令流：

```txt
Command
  -> command schema validation
  -> dry-run against current MapSpec
  -> apply patch
  -> renderer incremental update
  -> collect diagnostics
  -> return CommandResult
```

## 扩展策略

扩展必须遵守三条规则：

- 不污染 v0 核心 schema。
- 通过 `capabilities` 声明需求。
- 通过 `extensions` 携带实验配置。

示例：

```json
{
  "version": "0.1",
  "capabilities": {
    "renderer": "maplibre",
    "experimental": ["fill-extrusion-lite"]
  },
  "extensions": {
    "scene3d": {
      "enabled": false
    }
  }
}
```

## 架构决策

- `MapSpec` 是主协议，不把 AI prompt 作为主协议。
- `@gis-engine/ai` 依赖 `@gis-engine/engine`，`@gis-engine/engine` 不依赖 `@gis-engine/ai`。
- v0.1 以 adapter 交付，v0.x 逐步验证自研 WebGL2 lite。
- 3D、terrain、3D Tiles、GeoParquet、WebGPU 均后置。
- 示例必须同时展示自然语言目标、`MapSpec`、TypeScript 代码和 command 修改流程。
