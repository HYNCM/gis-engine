# 主流地图引擎研究与设计吸收

## 研究目标

本文件用于沉淀 AI 原生地图引擎的外部框架研究。目标不是复制任何一个成熟引擎的完整能力，而是识别它们最稳定的架构边界、最值得复用的设计理念，以及不适合在 v0 阶段承担的复杂度。

更完整的软件工程竞品矩阵、2D/3D 支持策略和 AI 原生标准见 [competitive-analysis-ai-native-2d-3d.md](../../../research/competitive-analysis-ai-native-2d-3d.md)。

本项目的首版定位是：

- Web TypeScript first。
- Apache-2.0 开源。
- 以 `MapSpec` 作为 AI、开发者、测试、文档之间的稳定协议。
- 首先证明 `MapSpec -> render -> command modify -> validate -> snapshot -> export` 闭环。

## 研究对象总览

| 框架或生态 | 核心模型 | 核心优势 | 本项目吸收点 | v0 避免点 |
| --- | --- | --- | --- | --- |
| MapLibre GL JS / Mapbox GL JS | source / layer / style / expression / worker / tile / renderer | Web 矢量地图事实标准之一，样式模型成熟，瓦片和渲染流水线清晰 | 采用 source/layer/style 的声明式思路，学习 worker/tile/render 分离，v0 使用 MapLibre adapter 降低交付风险 | 不在 v0 从零实现完整 symbol placement、collision、text shaping、完整 expression |
| CesiumJS | Viewer / Scene / Globe / Primitive / Entity / 3D Tiles | 全球级 3D、地形、3D Tiles、LOD 与大场景管理成熟 | 学习 Scene/Primitive/HLOD/SSE 思路，v1 后引入 SceneView 与 3D Tiles adapter | 不把 terrain、glTF、3D Tiles 放进 v0 核心 schema |
| OpenLayers | Map / View / Layer / Source / Interaction / Control | GIS 标准覆盖广，投影、OGC 格式、交互体系完整 | 学习 Map/View 分离、Layer/Source 边界、Interaction/Control 可插拔设计 | 不在 v0 扩展到完整 OGC 协议和复杂投影矩阵 |
| Leaflet | Map / Layer / Control / Plugin | API 轻量、插件生态清晰、移动端友好 | 学习低门槛 API、插件优先、示例驱动和渐进增强 | 不采用 DOM/SVG 为主的渲染路线作为核心性能路径 |
| deck.gl | Layer / CompositeLayer / View / AttributeManager | 声明式可视分析图层、生命周期清楚、GPU 数据可视化能力强 | 学习 Layer 生命周期、CompositeLayer 思路、数据驱动可视分析扩展方式 | v0 不做复杂分析图层和大规模 GPU 聚合 |
| ArcGIS Maps SDK for JavaScript | Map / MapView / SceneView / Layer / Renderer | 企业 GIS 工作流完整，2D/3D view 分离清楚 | 学习 Map 容器与 View 实例分离，以及后续 MapView/SceneView 演进方向 | v0 不做完整企业 GIS 平台能力 |
| MapTalks | Map / Layer / GroupGLLayer / 3D extension | 2D/3D 插件化和 WebGL 扩展灵活 | 学习 2D 地图与 3D 插件的松耦合方式 | v0 不把 3D 插件作为核心依赖 |
| 3DTilesRendererJS | TilesRenderer / plugin / cache / traversal | Three.js 场景里的 3D Tiles 加载和插件机制清晰 | v1 可作为 3D Tiles adapter 的候选实现或参考 | v0 不承诺 3D Tiles |
| PMTiles | 单文件瓦片归档 / range request | 静态部署友好，适合云原生和内网数据分发 | v0 优先支持，体现低运维地图数据能力 | 不在 v0 同时铺开所有瓦片协议 |
| GeoParquet / FlatGeobuf | 列式或流式地理数据格式 | 面向分析、云存储、分块读取和空间过滤 | v2 作为大规模分析与流式数据方向 | v0 不引入 DuckDB WASM 和复杂查询引擎 |
| Model Context Protocol | tools / resources / prompts / schemas | 为 AI Agent 提供明确、结构化、可调用接口 | 将 `validate_spec`、`apply_commands`、`explain_spec`、`snapshot_spec` 等 snake_case tools 暴露为 MCP tools，并提供 input/output schemas | MCP 不进入渲染核心生命周期 |

## 可吸收的核心设计理念

### 1. Source/Layer/Style 是 AI 友好的地图表达方式

MapLibre 和 Mapbox 的最大价值不是某一个渲染细节，而是把地图拆成稳定的 `sources`、`layers`、`paint/layout` 和 `expressions`。这类结构天然适合 AI 生成、审查、diff、回放和修复。

本项目应吸收：

- `sources` 定义数据输入和访问方式。
- `layers` 定义可视化类型、图层顺序和样式。
- `paint` 与 `layout` 分离，便于 AI 精准修改样式而不破坏结构。
- expression 子集优先覆盖常见数据驱动样式。

本项目不应在 v0 承担：

- 完整 Mapbox expression 兼容。
- 完整文字排版、碰撞检测、复杂 symbol placement。
- 自研完整矢量瓦片渲染内核作为首个交付目标。

### 2. Map/View 分离能避免 2D/3D 过早耦合

OpenLayers 和 ArcGIS 都把地图内容容器与视图表达拆开。这个边界对本项目非常重要，因为 AI 需要操作的是稳定的地图意图，而不是某个渲染后端的临时状态。

本项目采用：

- `MapSpec` 表示地图内容、数据源、图层、交互和扩展能力。
- `ViewState` 表示 center、zoom、bearing、pitch、bounds 等视图状态。
- v0 只稳定 2D 和最小 2.5D。
- v1 再引入 `SceneView`，不要让 3D 需求污染 v0 schema。

### 3. Scene/Primitive/HLOD 适合放到 v1 的 3D 扩展层

Cesium 的 Scene、Primitive、Globe、3D Tiles、screen space error 等能力非常适合大规模 3D 地理场景，但它们属于另一套复杂世界观。v0 若强行统一 2D 瓦片样式和 3D 场景图，会造成抽象过大、实现过薄。

本项目采用：

- v0 `extensions` 字段预留 terrain、scene、aiHints。
- v1 `@gis-engine/scene3d` 作为 capability-gated experimental package。
- 3D Tiles、glTF、terrain 都通过 adapter 接入，不进入 v0 核心。

### 4. 声明式 Layer 生命周期比命令式绘制更适合 AI

deck.gl 的 Layer 生命周期说明，复杂可视化不应散落在业务代码中，而应封装成稳定的声明式图层对象。AI 更容易添加、删除、替换一个图层，而不是改写一段临时绘制逻辑。

本项目采用：

- v0 图层类型有限，但每类图层都要有明确 schema、默认值、诊断规则和示例。
- 复杂能力先通过 experimental layer 暴露，例如 `fill-extrusion-lite`。
- 后续分析图层通过 plugin 或 extension 注册。

### 5. 云原生数据格式是开源传播的差异点

PMTiles 的价值在于静态部署、range request 和低运维门槛。对 AI Agent 来说，一个单文件地图数据源也更容易在示例、测试和内网环境里复现。

本项目采用：

- v0.1 优先支持 GeoJSON、raster tiles、PMTiles。
- v0.2 checkpoint 已补齐 generic vector tile URL template，用于 MVT / TileJSON 风格数据入口。
- GeoParquet、FlatGeobuf、DuckDB WASM 放入 v2 大规模分析方向。

### 6. AI 原生不是 wrapper，而是可验证协议

如果 AI 只是在传统 SDK 外包一层自然语言接口，价值会很弱。本项目的差异化应落在以下能力：

- `MapSpec` 可被 JSON Schema 和 TypeScript 类型同时约束。
- 所有修改通过幂等 command 执行。
- command 返回结构化结果：成功、失败、警告、影响范围、修复建议。
- `validate()` 能发现 source/layer 不匹配、图层顺序、不可见样式、视角异常、瓦片加载失败。
- `snapshot()` 能辅助判断地图是否空白、图层是否渲染。
- MCP tools 暴露稳定的 AI 调用边界。

## v0 设计结论

v0 应学习成熟地图引擎的边界划分，而不是复刻成熟引擎的能力全集。

首版必须收敛到：

- `MapSpec` 作为最稳定的公开契约。
- `@gis-engine/engine` 提供运行时、命令系统、验证、快照和适配渲染。
- `@gis-engine/ai` 提供 MCP tools、AI 友好诊断和导出能力。
- MapLibre adapter 作为 v0.1 可交付渲染后端。
- `renderer-webgl2-lite` 作为实验后端，验证长期自研能力。

明确后置：

- 完整 3D Tiles。
- terrain。
- glTF 场景。
- WebGPU。
- GeoParquet/DuckDB WASM。
- 完整 Mapbox expression。
- 完整 symbol collision/text shaping。

## 参考来源

- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [MapLibre Style Spec](https://maplibre.org/maplibre-style-spec/)
- [Cesium Scene](https://cesium.com/learn/cesiumjs/ref-doc/Scene.html)
- [Cesium3DTileset](https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileset.html)
- [OpenLayers Concepts](https://openlayers.org/doc/tutorials/concepts.html)
- [Leaflet API Reference](https://leafletjs.com/reference.html)
- [deck.gl Layer Lifecycle](https://deck.gl/docs/developer-guide/custom-layers/layer-lifecycle)
- [ArcGIS Map API](https://developers.arcgis.com/javascript/latest/api-reference/esri-Map.html)
- [3DTilesRendererJS](https://github.com/NASA-AMMOS/3DTilesRendererJS)
- [PMTiles](https://docs.protomaps.com/pmtiles/)
- [GeoParquet](https://geoparquet.org/)
- [Model Context Protocol Tools](https://modelcontextprotocol.io/docs/concepts/tools)
