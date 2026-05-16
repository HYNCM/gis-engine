# 竞品分析与 AI 原生 2D/3D 架构标准

## 目标

本文件从软件工程角度分析主流地图引擎、地图可视化框架和云原生地理数据生态，明确 GIS Engine 如何同时支持二维和三维，并满足 AI 时代的开发标准。

核心判断：

- 不能把 AI 原生理解为“传统 SDK 外面包一层聊天接口”。
- 不能把 2D/3D 支持理解为“同时堆入所有 2D 和 3D 能力”。
- 应把项目设计为 schema-first、command-driven、diagnosable、snapshot-verifiable、adapter-based 的地图运行时。

最终目标是让 AI Agent 可以安全、可复现、可审计地生成和修改地图应用，同时让人类开发者能用 TypeScript 稳定接管。

## 竞品分组

| 分组 | 代表项目 | 主要价值 | 本项目竞争方式 |
| --- | --- | --- | --- |
| 2D 矢量瓦片引擎 | MapLibre GL JS、Mapbox GL JS | 高性能 WebGL 矢量地图、样式规范、图层模型 | 不在 v0 重造完整渲染栈，先用 adapter，竞争点放在 AI MapSpec、命令、诊断和快照验证 |
| 全球 3D 引擎 | CesiumJS | 地球、地形、3D Tiles、海量 3D 数据流式调度 | v1 做 SceneView 和 3D Tiles adapter，v0 保留 3D 扩展边界 |
| GIS 标准框架 | OpenLayers | 投影、OGC 格式、交互、控制器、图层源模型 | 学习 Map/View/Layer/Source/Interaction 边界，不在 v0 覆盖完整 OGC 矩阵 |
| 轻量地图 SDK | Leaflet | 易学、插件生态、移动友好 | 学习低门槛 API 和插件心智，但核心渲染采用 WebGL/adapter 路线 |
| 数据可视化地图框架 | deck.gl | 声明式图层、GPU 数据可视化、CompositeLayer | 学习图层生命周期和数据驱动图层设计，分析图层后置 |
| 企业 GIS SDK | ArcGIS Maps SDK for JavaScript | Map/MapView/SceneView、企业服务、完整 GIS 工作流 | 学习 2D/3D view 分离和产品化诊断，但不复制企业平台 |
| 2D/3D 混合引擎 | MapTalks | 2D 地图加 WebGL/3D 扩展 | 学习插件化 3D 能力，不让 3D 扩展绑死 v0 runtime |
| 3D Tiles 专用渲染 | 3DTilesRendererJS | Three.js 中加载 3D Tiles、插件、缓存和遍历 | v1 的 3D Tiles adapter 候选或参考 |
| 云原生数据格式 | PMTiles、GeoParquet、FlatGeobuf、MVT | 单文件瓦片、列式分析、流式读、标准瓦片 | v0 先做 PMTiles，v2 引入 GeoParquet/DuckDB WASM |
| AI 工具协议 | MCP、JSON Schema structured outputs | AI 工具调用、结构化输入输出、资源与工具边界 | `@gis-engine/ai` 提供 MCP tools，核心 runtime 不依赖 AI 层 |

## 软件工程维度对比

| 维度 | MapLibre / Mapbox | CesiumJS | OpenLayers | Leaflet | deck.gl | ArcGIS JS | GIS Engine 目标 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 公开协议 | Style Spec | API + 3D Tiles/terrain 生态 | API + format/source/layer | API + plugin | Layer props | Map/Layer/View API | `MapSpec` + commands + diagnostics |
| 2D 能力 | 强 | 可做 2D 模式但主要强在 3D | 强 | 中等 | 依赖底图，强在叠加层 | 强 | v0 强化 2D |
| 3D 能力 | terrain/extrusion/custom layer | 很强 | 有限 | 弱 | 3D 可视化强，地球/地形依赖集成 | 强 | v1 SceneView + adapter |
| AI 可操作性 | 配置结构清晰，但诊断和 tool contract 不是核心 | API 强但状态复杂 | API 丰富但配置分散 | 简单但缺少强 schema | props 声明式但非地图全协议 | 企业能力强但非 AI 原生开源路线 | schema-first + command-only mutation |
| 可测试性 | 样式和渲染测试成熟 | 3D 场景测试复杂 | API 稳定 | 简单 | 图层测试清楚 | 平台内工具丰富 | snapshot + contract tests 是一等能力 |
| 可观测性 | 事件和错误可接入 | 场景状态多 | 状态较透明 | 轻量 | Layer lifecycle 清楚 | 工具链强 | diagnostics、trace、capability report |
| 扩展方式 | custom layer、source/layer | primitive/entity/data source | layer/source/interaction | plugin | layer/composite layer | layer/widget/service | renderer/source/layer/AI tool adapters |
| 工程风险 | 完整渲染栈复杂 | 3D 精度/LOD/性能复杂 | API 面宽 | 性能上限 | 与底图集成 | 商业生态绑定 | 用 adapter 降低 v0 风险 |

## 竞品优势拆解

### MapLibre GL JS / Mapbox GL JS

优势：

- source/layer/style/expression 把地图表达结构化，适合 AI 生成和 diff。
- Worker、tile、renderer 分层清楚。
- WebGL 矢量地图能力成熟。
- 图层顺序和样式更新模型适合 command 化。

工程风险：

- 从零实现完整 symbol placement、collision、glyph、text shaping、expression、feature-state 和 tile cache 成本极高。
- Mapbox GL JS 商业路线和许可策略不适合作为开源核心依赖的唯一基础。

吸收策略：

- `MapSpec` 借鉴 source/layer/style 结构。
- v0.1 使用 MapLibre adapter 交付。
- 自研 WebGL2 lite 后端只验证基础图层。

### CesiumJS

优势：

- 3D 地球、terrain、3D Tiles、HLOD、screen space error、海量模型流式加载能力成熟。
- Scene/Primitive/Entity/Globe 分层适合大规模 3D 场景。
- 3D Tiles 是 3D 地理数据事实标准之一。

工程风险：

- 3D 地理引擎涉及精度、深度、地形遮挡、相机、LOD、拾取和瓦片调度，复杂度与 2D 样式引擎不同。
- 若 v0 强行统一 2D style pipeline 和 3D scene graph，会导致抽象过重。

吸收策略：

- v0 在 `extensions.scene3d` 预留能力声明。
- v1 引入 `SceneView`、`TerrainSource`、`Tiles3DSource` 和 `ObjectLayer`。
- 3D 能力以 adapter 接入，不污染 v0 `MapSpec` 核心字段。

### OpenLayers

优势：

- Map/View/Layer/Source/Interaction/Control 模型清楚。
- 投影、格式、OGC 生态覆盖广。
- 适合严肃 GIS 工作流。

工程风险：

- API 面很宽，如果 v0 追求同等覆盖，会稀释 AI 原生目标。
- 完整投影和格式生态维护成本高。

吸收策略：

- `MapSpec.view` 与 `MapSpec.sources/layers` 分离。
- `interactions` 独立配置。
- 投影能力分阶段，v0 以 Web Mercator 和 WGS84 输入为主。

### Leaflet

优势：

- 上手极快。
- 插件模型简单。
- 示例和文档对开发者友好。

工程风险：

- DOM/SVG 路线和轻量架构不适合作为大规模 WebGL 2D/3D 引擎核心。

吸收策略：

- API 要短、示例要可复制。
- 插件设计保持低门槛。
- 文档第一屏直接给可运行 `MapSpec` 和 TypeScript 示例。

### deck.gl

优势：

- Layer props 声明式。
- CompositeLayer 适合封装复杂可视化。
- GPU attribute 管理和数据可视分析能力强。

工程风险：

- deck.gl 更像可视化图层框架，不是完整底图和 GIS 协议运行时。
- 如果 v0 过早加入聚合、热力、路径、3D mesh 等分析图层，会拉大测试矩阵。

吸收策略：

- 图层生命周期采用声明式 props 心智。
- v2 通过 `analysis` extension 提供可视分析图层。

### ArcGIS Maps SDK for JavaScript

优势：

- `Map`、`MapView`、`SceneView` 分离成熟。
- 企业 GIS 服务、图层、符号、分析、编辑和小部件完整。
- 2D/3D 产品体验统一。

工程风险：

- 商业生态强绑定。
- 开源项目无法用同样路径堆平台能力。

吸收策略：

- 明确 `MapDocument` 与 `MapView2D`、`SceneView3D` 分离。
- 学习 2D/3D 统一产品体验，而不是复制企业平台。

### MapTalks

优势：

- 2D/3D 插件化能力较灵活。
- GroupGLLayer、VectorTileLayer、ThreeLayer 等思路有利于渐进扩展。

工程风险：

- 插件能力如果缺少统一 schema 和诊断，AI 很难稳定调用。

吸收策略：

- 所有插件必须通过 schema、capability 和 diagnostics 注册。
- 插件可扩展，但不能绕开 `MapSpec`。

### 3DTilesRendererJS

优势：

- 在 Three.js 生态里接入 3D Tiles。
- 插件、cache、traversal 机制适合小步集成。

工程风险：

- 它不是完整地图引擎，需要相机、地理坐标、地形、底图、拾取和图层系统配合。

吸收策略：

- v1 作为 `Tiles3DSource` adapter 候选。
- 不在 v0 直接绑定 Three.js 作为全局 3D 架构。

## AI 原生架构标准

GIS Engine 必须满足以下 AI 时代标准，才能和传统地图 SDK 拉开差异。

### 1. Schema-first

所有公开输入必须有 schema：

- `MapSpec`。
- `MapCommand`。
- `LayerSpec`。
- `SourceSpec`。
- `ValidationReport`。
- MCP tool input/output。

要求：

- JSON Schema 和 TypeScript 类型同步生成或同步测试。
- schema 必须带版本。
- unknown field 处理策略必须明确。
- experimental 字段必须进入 `extensions`。

### 2. Command-only mutation

AI 不能直接改 runtime 内部状态。所有修改必须通过 command：

- `addSource`
- `addLayer`
- `setPaint`
- `setLayout`
- `setView`
- `fitBounds`
- `removeLayer`
- `reorderLayer`

要求：

- 命令幂等。
- 命令可 dry-run。
- 命令返回 `CommandResult`。
- 失败有 rollback patch 或无副作用保证。

### 3. Deterministic replay

同一个 `MapSpec` 和同一组 commands，在相同版本和相同资源下必须得到相同结果。

要求：

- `exportSpec()` 结果稳定排序。
- `diffSpec()` 和 `patchSpec()` 可回放。
- 示例必须能作为 regression fixture。
- AI 生成过程中的自然语言不作为唯一事实来源。

### 4. Structured diagnostics

错误不是字符串，而是结构化诊断。

诊断必须包含：

- `severity`
- `code`
- `message`
- `path`
- `fix`
- `relatedResources`

典型诊断：

- source 不存在。
- layer id 重复。
- source/layer 类型不兼容。
- expression 类型错误。
- 图层透明或不可见。
- view 偏离数据范围。
- 数据加载失败。
- 3D tileset 坐标或 bounding volume 异常。
- snapshot 为空白。

### 5. Visual and runtime validation

AI 生成地图后必须能验证“真的渲染出来了”。

要求：

- `snapshotMap` 是一等 tool。
- 支持 fixed viewport。
- 检查 canvas 非空白。
- 检查目标图层是否产生可见像素。
- 采集 renderer warning/error。
- 对 3D 场景检查 camera、tiles loaded、bounding volume、depth range。

### 6. Capability negotiation

AI 在生成地图前必须能知道当前引擎能做什么。

要求：

- `queryCapabilities()` 返回 renderer、source、layer、expression、2D/3D、snapshot 和 query 能力。
- unsupported capability 必须变成 warning 或 error。
- 3D 相关能力必须 capability-gated。

### 7. Separation of AI and runtime

AI 层是 adapter，不是核心 runtime。

要求：

- `@gis-engine/engine` 不依赖 `@gis-engine/ai`。
- `@gis-engine/ai` 可以依赖 engine 的 schema、validator、commands、snapshot。
- MCP tools 只操作公开协议。
- 不允许 tool 直接访问 renderer 私有对象。

### 8. Provenance and audit

AI 修改地图必须可审计。

要求：

- command 可带 `author`、`reason`、`createdAt`、`sourcePromptHash`。
- runtime 可输出 `trace`。
- `exportSpec()` 可包含数据来源和许可元数据。
- destructive command 可被策略层拦截。

### 9. Local-first and reproducible examples

AI 时代的示例必须能稳定复现。

要求：

- 示例数据优先使用本地或静态资源。
- PMTiles 是 v0 的重要数据路径。
- 示例避免依赖随机远程服务。
- 每个示例都包含自然语言需求、`MapSpec`、commands、截图验证结果。

### 10. Test and eval ready

项目必须适合持续评估 AI 调用质量。

要求：

- AI tool contract tests。
- golden `MapSpec` fixtures。
- command replay tests。
- screenshot regression tests。
- performance smoke tests。
- 2D/3D capability compatibility matrix。

## 2D/3D 支持策略

本项目必须从第一天支持 2D/3D 架构边界，但不等于 v0 同时实现完整 3D。

### 核心抽象

```ts
type ViewMode = "map2d" | "map2_5d" | "scene3d";

interface ViewSpec {
  mode: ViewMode;
  center?: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  camera?: Camera3DSpec;
  bounds?: [number, number, number, number];
}

interface CapabilityRequest {
  dimensions?: Array<"2d" | "2_5d" | "3d">;
  renderer?: "maplibre" | "webgl2-lite" | "scene3d";
  experimental?: string[];
}
```

### 图层分类

| 分类 | 适用维度 | 示例 | 说明 |
| --- | --- | --- | --- |
| `ScreenLayer` | 2D/3D | marker、label、popup | 屏幕空间或覆盖层 |
| `DrapedLayer` | 2D/2.5D/3D | raster、fill、line | 可贴附在平面或地形上 |
| `VectorLayer` | 2D/2.5D | fill、line、circle、symbol-lite | v0 主力 |
| `ExtrusionLayer` | 2.5D | fill-extrusion-lite | v0 experimental |
| `TerrainLayer` | 3D | terrain mesh | v1 |
| `ObjectLayer` | 3D | glTF、model instances | v1 |
| `Tiles3DLayer` | 3D | 3D Tiles | v1 |
| `AnalysisLayer` | 2D/3D | heatmap、aggregation、flow line | v2 |

### Source 分类

| Source | 2D | 3D | 阶段 |
| --- | --- | --- | --- |
| GeoJSON | 是 | 可 drape 或转 object | v0.1 |
| Raster tiles | 是 | 可 drape | v0.1 |
| PMTiles | 是 | 可 drape | v0.1 |
| Vector tiles | 是 | 可 drape | v0.2 |
| Terrain | 否 | 是 | v1 |
| glTF | 否 | 是 | v1 |
| 3D Tiles | 否 | 是 | v1 |
| GeoParquet | 是 | 可分析后投影 | v2 |

### View 分离

必须区分：

- `MapDocument`：声明地图内容，长期稳定。
- `MapView2D`：二维视图 runtime。
- `MapView2_5D`：pitch、bearing、extrusion 和 draped layers。
- `SceneView3D`：terrain、3D Tiles、model、camera、light、depth。

`MapSpec` 表达意图，具体 View 根据 capability 选择 renderer。AI 修改 `MapSpec` 时不需要知道 renderer 私有对象。

### 3D 进入条件

以下条件满足后，`scene3d` 才能从 experimental 进入稳定：

- `Camera3DSpec` schema 稳定。
- terrain source 和 tileset source 有结构化诊断。
- snapshot 能验证 3D 场景非空白、相机未在地下、tileset 已进入视锥。
- picking/query 能在 2D/3D 中返回统一 `FeatureQueryResult`。
- 资源释放、tileset cache、GPU memory 有测试。
- 至少有 3 个稳定示例：terrain、glTF、3D Tiles。

## 目标能力矩阵

| 能力 | v0.1 | v0.2 | v1 | v2 |
| --- | --- | --- | --- | --- |
| MapSpec schema | 稳定 | 稳定 | 迁移兼容 | 迁移兼容 |
| Command system | 稳定 | 扩展 | 2D/3D 统一 | 分析命令扩展 |
| 2D MapView | 稳定 | 稳定 | 稳定 | 稳定 |
| 2.5D extrusion | experimental | beta | 稳定 | 稳定 |
| SceneView3D | 无 | experimental schema | beta | 稳定 |
| MapLibre adapter | 稳定 | 稳定 | 稳定 | 可选 |
| WebGL2 lite renderer | experimental | beta | 稳定子集 | 稳定 |
| WebGPU renderer | 无 | 无 | experimental | beta |
| GeoJSON | 稳定 | 稳定 | 稳定 | 稳定 |
| Raster tiles | 稳定 | 稳定 | 稳定 | 稳定 |
| PMTiles | 稳定 | 稳定 | 稳定 | 稳定 |
| Vector tiles | 无或 experimental | beta | 稳定 | 稳定 |
| Terrain | 无 | 无 | beta | 稳定 |
| glTF | 无 | 无 | beta | 稳定 |
| 3D Tiles | 无 | experimental | beta | 稳定 |
| GeoParquet | 无 | 无 | 无 | beta |
| MCP tools | 稳定最小集 | 扩展 | 2D/3D tools | eval tools |
| Snapshot validation | 2D 稳定 | 2D 稳定 | 3D beta | 2D/3D 稳定 |

## 工程实施要求

### API 版本策略

- `MapSpec.version` 必填。
- command schema 独立版本化。
- renderer adapter capability 独立版本化。
- breaking change 必须提供 migration。

### 测试矩阵

| 测试类型 | 覆盖目标 |
| --- | --- |
| schema tests | `MapSpec`、commands、tools input/output |
| command replay tests | 幂等、回滚、导出一致性 |
| renderer adapter tests | MapLibre adapter 与 WebGL2 lite 行为一致子集 |
| snapshot tests | 2D/2.5D/3D 非空白和目标图层可见 |
| compatibility tests | Chrome、Safari、Firefox |
| performance tests | GeoJSON 规模、tile load、query latency、3D tiles cache |
| AI evals | 自然语言到 `MapSpec`、修复建议准确性、工具调用成功率 |

### 可观测性

runtime 必须输出：

- `ValidationReport`
- `CapabilityReport`
- `RenderStats`
- `TileStats`
- `SnapshotReport`
- `CommandTrace`
- `ResourceReport`

这些报告用于开发调试、AI 诊断和 CI 评估。

### 安全边界

- `MapSpec` 不允许执行任意 JavaScript。
- expression 子集必须纯函数化。
- URL source 需要可配置 allowlist。
- AI tool 不直接写文件，导出应用时返回文件清单或受控目标目录。
- destructive command 需要策略层确认。

## 结论

GIS Engine 的竞争策略不是和现有引擎拼功能总量，而是建立 AI 时代更适合调用、验证、回放和协作的地图软件工程标准。

必须坚持：

- `MapSpec` 是主协议。
- command 是唯一修改入口。
- diagnostics 是一等输出。
- snapshot 是一等验证。
- AI/MCP 是外部 adapter。
- 2D v0 稳定，3D v1 进入，架构从第一天预留 3D。
- adapter 先交付，自研渲染后端渐进验证。

这样项目既能吸收 MapLibre、Cesium、OpenLayers、Leaflet、deck.gl、ArcGIS、MapTalks、3DTilesRendererJS 的成熟优点，又不会在首版被它们各自最复杂的工程问题拖垮。

## 参考来源

- [MapLibre GL JS Docs](https://maplibre.org/maplibre-gl-js/docs/)
- [MapLibre Style Spec](https://maplibre.org/maplibre-style-spec/)
- [MapLibre Native](https://maplibre.org/maplibre-native/docs/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [CesiumJS Scene](https://cesium.com/learn/cesiumjs/ref-doc/Scene.html)
- [CesiumJS Cesium3DTileset](https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileset.html)
- [OGC 3D Tiles](https://www.ogc.org/standards/3DTiles/)
- [OpenLayers Concepts](https://openlayers.org/doc/tutorials/concepts.html)
- [OpenLayers API](https://openlayers.org/en/latest/apidoc/)
- [Leaflet API Reference](https://leafletjs.com/reference.html)
- [deck.gl Layer Lifecycle](https://deck.gl/docs/developer-guide/custom-layers/layer-lifecycle)
- [deck.gl Geo Layers](https://deck.gl/docs/api-reference/geo-layers)
- [ArcGIS Maps SDK for JavaScript Map](https://developers.arcgis.com/javascript/latest/api-reference/esri-Map.html)
- [ArcGIS Maps SDK for JavaScript Views](https://developers.arcgis.com/javascript/latest/api-reference/esri-views-MapView.html)
- [MapTalks](https://maptalks.org/)
- [3DTilesRendererJS](https://github.com/NASA-AMMOS/3DTilesRendererJS)
- [PMTiles](https://docs.protomaps.com/pmtiles/)
- [GeoParquet](https://geoparquet.org/)
- [FlatGeobuf](https://flatgeobuf.org/)
- [Mapbox Vector Tile Specification](https://github.com/mapbox/vector-tile-spec)
- [Model Context Protocol Tools](https://modelcontextprotocol.io/docs/concepts/tools)
