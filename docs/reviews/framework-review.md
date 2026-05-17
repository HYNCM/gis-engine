# AI 原生地图引擎框架评审

## 评审背景

本次评审对象是 AI 原生开源地图引擎框架草案。仓库处于空项目阶段，目标是在落地实现前先明确架构边界、产品价值和工程可交付范围。

后续外部 AI 评审指出了更细的工程 contract 缺口，跟进记录见 [external-ai-review-followup.md](./external-ai-review-followup.md)。

初始草案包含：

- Web TypeScript first。
- Apache-2.0。
- 2D、2.5D、3D 演进。
- `MapSpec`。
- command 系统。
- MCP tools。
- WebGL2 renderer。
- MapLibre、Cesium、OpenLayers、Leaflet、deck.gl、ArcGIS、MapTalks、3DTilesRendererJS、PMTiles、GeoParquet、FlatGeobuf 等框架和生态的设计吸收。

评审后的总体结论：

项目方向成立，但 v0 必须从“全能力地图引擎蓝图”收敛为“AI 可操作的声明式 Web 地图运行时”。

## 软件架构师评审

### 最高优先级风险

- 目标边界过宽，容易变成所有地图引擎能力的合集。
- MVP 已经接近小型 MapLibre 分支复杂度，如果再叠加 3D Tiles、terrain、WebGPU、DuckDB WASM，会提前污染模块边界。
- AI/MCP 如果进入核心生命周期，会破坏地图引擎的确定性、可测试性和可复现性。
- MapLibre 的 source/layer/style pipeline 与 Cesium 的 Scene/Primitive/HLOD/SSE 是两套世界观，不能在 v0 强行统一。

### 必须调整的框架点

- 项目第一定位改为：TypeScript-first declarative web map runtime, with AI-operable MapSpec as the stable contract。
- `MapSpec` 是最稳定的包和协议，独立于 renderer、AI、MCP。
- `@gis-engine/engine` 只负责 runtime、状态树、命令调度、事件、能力协商和 renderer adapter。
- `@gis-engine/ai` 和 MCP tools 放在核心之外。
- `terrain`、`scene`、`aiHints` 不作为 v0 核心字段，放入 `extensions`。
- 命令分成 `SpecCommand`、`ViewCommand`、`RuntimeQuery`、`AITool`。

### 可接受设计

- `MapSpec` 作为核心契约是正确方向。
- `createMap(container, spec)`、`map.apply(commands)`、`map.exportSpec()` 组成合理闭环。
- 吸收 MapLibre 的 source/layer/style/expression 子集是务实选择。
- WebGL2 作为长期自研后端方向合理，但 v0.1 不应被它阻塞。
- PMTiles 有明确差异化价值。
- snapshot validation 是 AI 原生地图引擎的重要辨识度。

### 架构结论

v0 只做 2D 和最小 2.5D，稳定 `MapSpec`、command、validation、snapshot、query 和 AI tools。3D、terrain、3D Tiles、WebGPU、GeoParquet、DuckDB WASM 全部后置为 capability-gated experimental packages。

## 产品工程师评审

### 最高优先级风险

- 愿景很大，但首个可信价值点不够尖。
- 用户可能会问：为什么不用 MapLibre、Cesium、OpenLayers 或 deck.gl 的组合。
- AI 能力如果只体现为 wrapper，会变成“地图 SDK 加一层 AI 外壳”。
- 目标用户有 AI Agent 应用开发者、GIS 前端工程师、数据可视化用户三类，MVP 不能同时服务所有人。

### MVP 应强调的价值

MVP 应收敛成一句话：

一个 AI/Agent 可以可靠生成、修改、验证和导出 Web 地图应用的 TypeScript 地图引擎。

首版产品卖点：

- `MapSpec` 是核心产品，不是附属配置。
- command 系统强约束、可验证、可回放。
- `validate()` 和 `explain_spec` 能发现图层顺序、source/layer 类型、表达式、视角、不可见样式、瓦片加载等问题。
- `snapshot()` 能判断 AI 生成地图是否空白或明显异常。
- 2.5D 只作为 `fill-extrusion-lite` 展示能力，不暗示项目已经要和 Cesium 正面对打。

### 文档和示例建议

文档首页要先回答：

- 它解决什么问题。
- 为什么 AI Agent 更容易使用它。
- 30 秒能生成什么地图。
- 和 MapLibre、Cesium、deck.gl 是什么关系。
- 当前不做什么。

首批示例：

- 一句话生成城市 POI 地图。
- 行政区按指标着色。
- 加载 PMTiles 离线或静态底图。
- AI 修改地图样式。
- AI 验证地图是否空白。
- 最小 2.5D 建筑拉伸预览。

### 产品结论

早期不要与成熟引擎比功能广度。项目应在 AI 调用体验、可验证地图生成、TypeScript 类型安全、示例可复制性上建立差异化。

## 开发工程师评审

### 最高优先级风险

- MVP 范围过大，首版不可交付风险高。
- 多包拆分过早会增加构建、版本、循环依赖、测试矩阵和 API 边界成本。
- AI 原生必须落到 schema、错误模型、可修复诊断、diff/apply、幂等命令和可解释 validate。
- 从零实现 WebGL2 地图渲染会立即遇到矢量瓦片解析、symbol placement、collision、text shaping、expression、tile cache、worker、拾取、透明排序等问题。
- Expression 系统是隐藏大坑，必须先做子集。
- 性能风险集中在 worker/tile/render 边界，必须早测。

### 建议首版目录

```txt
packages/
  engine/
    src/
      core/
      spec/
      commands/
      diagnostics/
      renderer/
      sources/
      layers/
      interactions/
      snapshot/
  ai/
    src/
      tools/
      mcp/
      prompts/
  examples/
  docs/
```

首版只公开少量包：

- `@gis-engine/engine`
- `@gis-engine/ai`

其他能力先以内部分层存在，不急于独立发布。

### 关键测试

- Schema tests：合法/非法 spec、未知字段、重复 id、source/layer 引用、版本迁移。
- Command tests：幂等性、失败回滚、错误诊断、导出后 spec 一致性。
- Snapshot tests：固定 viewport，检查非空白、关键图层可见和基础样式正确。
- Performance smoke tests：GeoJSON 规模、pan/zoom、tile load、query latency、资源释放。
- AI tool contract tests：schema 合法、命令可应用、错误可解释、导出 spec 可再次加载。

### 工程结论

最关键工程决策是：v0.1 先基于 MapLibre adapter 交付，还是从零自研渲染内核。

最终采纳：

- v0.1 默认 MapLibre adapter。
- 自研 WebGL2 lite renderer 同步实验，但不阻塞发布。
- 差异化集中在 `MapSpec`、commands、diagnostics、snapshot 和 MCP tools。

## 评审后采纳的框架调整

| 原草案倾向 | 评审后调整 |
| --- | --- |
| 多包完整 monorepo | v0 仅公开 `@gis-engine/engine` 和 `@gis-engine/ai` |
| 2D/3D 一起进入核心设计 | v0 只稳定 2D 和最小 2.5D，3D 后置 |
| AI/MCP 接近 runtime | AI/MCP 作为外部 adapter，不进入核心生命周期 |
| WebGL2 自研为主 | v0.1 使用 MapLibre adapter 交付，自研 WebGL2 lite 实验 |
| `terrain`、`scene`、`aiHints` 核心字段 | 放入 `extensions`，通过 capability gate 控制 |
| 完整 expression 兼容 | v0 只实现常见 expression 子集 |
| 数据格式广覆盖 | v0.1 只做 GeoJSON、raster、PMTiles |

## 最终评审结论

框架可以进入实施，但必须守住 v0 范围：

- 稳定 `MapSpec v0.1`。
- 稳定 command 系统。
- 稳定 validation、diagnostics、snapshot。
- 提供 MapLibre adapter。
- 提供 MCP tools。
- 示例围绕 AI 创建、修改、验证和导出地图。

只有这个闭环跑顺后，才进入 terrain、3D Tiles、WebGPU、GeoParquet、DuckDB WASM 和大规模分析。
