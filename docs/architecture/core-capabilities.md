# 引擎核心能力规划

## 能力原则

当前核心能力必须服务一个目标：让 AI Agent 和开发者可以可靠创建、修改、验证、截图和导出地图。

二维和三维能力采用分阶段交付：v0.1 稳定 2D 基座，v0.2 已补齐泛 vector tile、表达式、MCP output schema、visual snapshot 场景、`fill-extrusion-lite` 2.5D beta mapping 和 3D 边界，v1 再引入 SceneView3D 和 3D Tiles adapter。完整维度矩阵见 [../research/competitive-analysis-ai-native-2d-3d.md](../research/competitive-analysis-ai-native-2d-3d.md)。

v0.1 的必交付能力以 [v0.1 MVP 验收标准](../engineering/v0.1-mvp-acceptance.md) 为准，测试和 CI 以 [CI 与测试策略](../engineering/ci-test-strategy.md) 为准。

能力取舍原则：

- 稳定协议优先于功能广度。
- 结构化诊断优先于静默失败。
- 可回放 command 优先于临时脚本。
- 可验证截图优先于只返回配置成功。
- adapter 可交付优先于从零重造完整地图内核。

## 当前核心能力

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| `MapSpec` schema | 已实现 | JSON Schema 和 TypeScript 类型同步维护，覆盖 vector、experimental 2.5D 和 reserved `scene3d` 边界 |
| TypeScript types | 已实现 | 使用 TypeBox schema 和 `Static<typeof Schema>` 保持同步 |
| `validateSpec` | 已实现 | 校验结构、引用、类型、版本、capability、expression、resource policy 和 unsupported boundary |
| `normalizeSpec` | 必做 | 补默认值、排序、标准化颜色和 source/layer 字段 |
| `diffSpec` / `patchSpec` | 必做 | 支持 AI 生成变更、review 和回放 |
| command apply | 已实现 | 幂等、可诊断、可回滚，覆盖 dry-run、atomic/best-effort、layer order 和 `baseRevision` |
| structured diagnostics | 已实现 | error/warning/info、路径、修复建议 |
| snapshot validation | 已实现 | smoke 检查非空白和结构化结果；visual 覆盖 GeoJSON 与本地生成 MVT |
| feature query | 已实现 | 支持 point 和 bbox 查询 contract |
| capability query | 已实现 | 查询当前 renderer/source/layer/expression/snapshot 支持矩阵，`CapabilityReportSchema` 严格校验 |
| MCP tools | 已实现 | 在 `@gis-engine/ai` 中暴露 AI 可调用接口，工具描述包含 `inputSchema` 和 `outputSchema` |
| MapLibre adapter | 已实现 MVP + experimental 2.5D beta | v0.x 默认渲染后端，覆盖 GeoJSON、raster、PMTiles、vector transformer、`fill-extrusion-lite` beta mapping 和 adapter contract |
| WebGL2 lite renderer | 实验 | 只做最小图层和数据源，验证长期路线 |

## 当前数据源

### 已实现

| 数据源 | 用途 | 说明 |
| --- | --- | --- |
| GeoJSON | 示例、AI 生成、业务轻数据 | 支持 inline data 和 URL data，首版重点优化诊断和可视化反馈 |
| Raster tiles | 底图 | 支持 XYZ URL template、tileSize、minzoom、maxzoom、attribution |
| PMTiles | 云原生和内网数据 | 转换为 MapLibre vector source URL，用于体现静态部署和单文件数据分发优势 |
| Generic vector tile URL template | MVT / TileJSON 风格数据 | 支持 `tiles[]` 或 `url`、`sourceLayer` metadata、minzoom、maxzoom、attribution，并纳入 resource policy |

### 后置

- WMS/WMTS。
- FlatGeobuf。
- CSV/GeoCSV。

### 后置到 v2

- GeoParquet。
- DuckDB WASM。
- 大规模空间过滤和列式分析。

## 当前图层

### 稳定图层

| 图层 | 最低能力 |
| --- | --- |
| `background` | 背景色、透明度 |
| `raster` | 栅格透明度、亮度、对比度的基础配置 |
| `fill` | 面填充、描边、透明度、简单数据驱动颜色 |
| `line` | 线色、线宽、透明度、dasharray 子集 |
| `circle` | 半径、颜色、描边、透明度、简单数据驱动样式 |
| `symbol-lite` | 文本字段、图标字段、基础显示开关，不承诺完整 collision 和 text shaping |

### 实验图层

| 图层 | 说明 |
| --- | --- |
| `fill-extrusion-lite` | 已实现 MapLibre beta mapping；必须显式请求 `capabilities.experimental` 和 2.5D 视图，并继续标记为 experimental |

## Expression 子集

当前不追求完整 Mapbox expression。已覆盖 AI 最常生成、业务最常用的表达式：

- `get`
- `literal`
- `case`
- `match`
- `interpolate`
- `step`
- `zoom`
- `to-number`
- `to-string`

必须提供表达式诊断：

- 类型不匹配。
- 属性不存在。
- 插值参数错误。
- 颜色格式错误。
- 表达式在目标 layer paint/layout 中不可用。

## AI/MCP 工具

`@gis-engine/ai` 提供工具层，不能反向污染 `@gis-engine/engine`。

| Tool | 输入 | 输出 | 责任 |
| --- | --- | --- | --- |
| `validate_spec` | `MapSpec` | `ValidateSpecToolResult` | 校验结构和运行时可行性 |
| `apply_commands` | `MapSpec`、commands | `ApplyCommandsToolResult` | 幂等修改和诊断 |
| `explain_spec` | `MapSpec` | 结构化摘要和诊断 | 帮助 AI 与用户理解地图 |
| `snapshot_spec` | `MapSpec`、viewport | `SnapshotSpecToolResult` | 渲染并检查是否空白或异常 |
| `export_spec` | `MapSpec`、commands? | `MapSpec` | 导出可复现状态 |
| `get_context_summary` | `MapSpec`、capabilities? | `ContextSummaryToolResult` | 给 AI 读取当前地图上下文 |
| `export_example_app` | example id | 文件清单 | 生成最小 TypeScript 示例应用 |

工具描述必须同时包含 `inputSchema` 和 `outputSchema`。工具返回必须结构化，避免只返回自然语言。

## Validation Report

```ts
export interface ValidationReport {
  valid: boolean;
  diagnostics: Diagnostic[];
  capabilities: CapabilityReport;
  stats: {
    sourceCount: number;
    layerCount: number;
    visibleLayerCount: number;
  };
}
```

诊断最少覆盖：

- schema 错误。
- source/layer 引用错误。
- layer id 重复。
- source 类型和 layer 类型不兼容。
- paint/layout 类型错误。
- expression 类型错误。
- layer 顺序问题。
- view 与数据范围严重偏离。
- 图层不可见或完全透明。
- 数据加载失败。
- snapshot 空白。

## Snapshot 能力

Snapshot 是 AI 原生地图引擎的差异化能力。它不只是截图导出，而是验证闭环的一部分。

v0.1 必须支持：

- 固定 viewport 渲染。
- 返回 PNG 或 data URL。
- 检查 canvas 是否为空白。
- 检查目标图层是否至少产生可见像素。
- 采集 renderer error/warning。
- 给出失败诊断和修复建议。

## 测试计划

### Schema tests

- 合法 spec。
- 非法 version。
- 未知字段。
- 重复 layer id。
- layer 引用不存在的 source。
- source/layer 类型不匹配。
- paint/layout 类型错误。
- 版本迁移。
- schema artifacts 与 TypeScript 类型同步。

### Command tests

- `addSource` 幂等。
- `addLayer` 顺序稳定。
- `setPaint` 只修改目标 paint 路径。
- `setView` 不破坏 source/layer。
- `removeLayer` 处理不存在 id。
- `reorderLayer` 保持确定性。
- 失败时返回诊断和 rollback patch。
- `apply -> exportSpec -> reload` 一致。

### Snapshot tests

- GeoJSON 点线面基础渲染非空白。
- raster tile 底图非空白。
- PMTiles 示例非空白。
- 隐藏图层不误判为可见。
- view 偏离数据范围时给出 warning。
- 默认像素阈值和目标图层像素统计符合 contract。

### AI tool contract tests

- `validate_spec` 输入输出稳定。
- `apply_commands` 可回放。
- `explain_spec` 不依赖 renderer 内部对象。
- `snapshot_spec` 能把渲染失败转成诊断。
- `export_example_app` 生成的示例能重新加载同一份 `MapSpec`。
- 所有 MCP tool descriptor 都暴露 `outputSchema`，并可被 Ajv 编译。

### Performance smoke tests

- 1k / 10k / 100k GeoJSON features 加载时间。
- pan/zoom FPS。
- tile load latency。
- queryFeatures latency。
- WebGL buffer update count。
- main thread long task。
- `destroy()` 后 event listener、worker、requestAnimationFrame 和 WebGL resource 释放。

### Adapter contract tests

- `getCapabilities()` 返回 renderer/source/layer/expression/snapshot 能力。
- `load -> snapshot -> destroy` 成功。
- `applyPatch` 后 renderer state 与 `exportSpec()` 一致。
- unsupported capability 返回 `CAPABILITY.UNSUPPORTED`。
- adapter error 转成 `RENDER.ADAPTER_ERROR`。

## 路线图

### v0.1

- `MapSpec v0.1`。
- `@gis-engine/engine`。
- `@gis-engine/ai`。
- MapLibre adapter。
- GeoJSON、raster tiles、PMTiles。
- background、raster、fill、line、circle、symbol-lite。
- validate、commands、diagnostics、snapshot、query。
- MCP tools 最小集。

### v0.2

- Generic vector tile URL template 已完成。
- 更完整 expression 子集已完成当前 v0.2 checkpoint 覆盖。
- 更完善 layer order 和 style diff 已完成当前 command/test 覆盖。
- MCP output schema 和严格 capability report 已完成。
- vector tile 示例、fixtures、snapshot smoke、visual MVT 场景已完成。
- 示例站点和文档站点。
- WebGL2 lite renderer 覆盖更多基础图层。

### v1

- `SceneView` experimental。
- terrain。
- glTF。
- 3D Tiles adapter。
- `fill-extrusion-lite` 转稳定或替换为正式 2.5D/3D 能力。

### v2

- WebGPU renderer。
- GeoParquet。
- DuckDB WASM。
- 大规模流式分析图层。
- 服务端或 headless snapshot pipeline。

## v0.1 完成定义

v0.1 只有在以下条件满足时才算完成：

- `MapSpec` 可独立校验。
- `createMap -> exportSpec` 闭环稳定。
- commands 可回放且失败可诊断。
- AI tools 不依赖非结构化文本。
- 至少 5 个示例可运行：GeoJSON、raster、PMTiles、AI map edit、vector tile URL。
- Playwright snapshot 验证通过，当前覆盖 GeoJSON 和生成式本地 MVT 场景。
- README 第一屏能说明 AI 原生差异点、安装方式、最小代码和当前非目标。
