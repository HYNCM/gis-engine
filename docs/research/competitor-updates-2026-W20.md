---
agent: competitive-intel
period: 2026-W20
generated_at: 2026-05-17T14:04:15Z
repo_revision: "bab1327"
inputs:
  - https://github.com/mapbox/mapbox-gl-js/releases
  - https://github.com/maplibre/maplibre-gl-js/releases
  - https://github.com/CesiumGS/cesium/releases
  - https://github.com/mrdoob/three.js/releases
  - https://github.com/visgl/deck.gl/releases
  - https://github.com/openlayers/openlayers/releases
  - https://docs.protomaps.com/pmtiles/
  - https://geoparquet.org/releases/v1.1.0/
  - https://modelcontextprotocol.io/specification/2025-11-25
decision_level: advisory
---

# Competitor Updates: 2026-W20

## 摘要

本轮只记录会影响 GIS Engine 路线的外部信号。结论是：云原生数据源、结构化 AI 工具契约、3D 边界定义是近期最值得转入产品规划的方向。

## 重点更新

| 方向 | 更新 | 对 GIS Engine 的影响 |
| --- | --- | --- |
| Mapbox GL JS | v3.21.0 加入 PMTiles vector source protocol；v3.23.0 加入 raster/raster-dem PMTiles TileProvider；v3.24.0 已进入 RC | PMTiles 不能继续只作为边缘格式，应进入 v0.2 source/resource policy 规划 |
| MapLibre GL JS | v5.24.0 为稳定线，v6.0.0-pre.9 持续推进 | `RendererAdapter` 不能绑定单一 MapLibre 版本假设 |
| CesiumJS | 1.141 发布；官方博客展示 Cesium MCP server、3D Gaussian Splats LOD 与 3D Tiles 结合 | 3D 规划需要先定义 MapSpec extension、camera command、diagnostics、snapshot 策略 |
| Three.js | r184 发布，继续作为 WebGPU/3D adapter 生态底座 | v1.0 3D adapter 可把 Three.js 作为候选底座，但不应提前污染 v0 核心 |
| deck.gl | v9.3.3 发布，持续强化声明式大数据可视化和 picking/WebGPU 相关能力 | GIS Engine 需要用 AI 可声明、可诊断、可回放作为差异化 |
| OpenLayers | v10.9.0 覆盖 GeoTIFF/GeoZarr、WebGL 精度/性能、交互修复 | 专业 GIS 交互和数据诊断需要进入 diagnostics backlog |
| PMTiles / GeoParquet / FlatGeobuf | PMTiles 文档稳定推进；GeoParquet v1.1.0 为稳定规范；OGC GeoParquet repo 面向 2.0 演进 | 先做 PMTiles/vector tile；GeoParquet/FlatGeobuf 先做 RFC 和 worker/streaming 边界 |
| MCP / Structured Outputs | MCP 2025-11-25 规范包含 structured tool output；OpenAI Structured Outputs 强调 JSON Schema 严格输出 | MCP tool input/output schema 与 Diagnostic failure path 必须成为硬门禁 |

## 来源

- Mapbox GL JS v3.21.0, 2026-04-02: https://github.com/mapbox/mapbox-gl-js/releases/tag/v3.21.0
- Mapbox GL JS v3.23.0, 2026-04-29: https://github.com/mapbox/mapbox-gl-js/releases/tag/v3.23.0
- Mapbox GL JS v3.23.1, 2026-05-04: https://github.com/mapbox/mapbox-gl-js/releases/tag/v3.23.1
- Mapbox GL JS v3.24.0-rc.1, 2026-05-06: https://github.com/mapbox/mapbox-gl-js/releases/tag/v3.24.0-rc.1
- MapLibre GL JS v5.24.0, 2026-04-23: https://github.com/maplibre/maplibre-gl-js/releases/tag/v5.24.0
- MapLibre GL JS v6.0.0-pre.9, 2026-05-08: https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.0.0-pre.9
- CesiumJS 1.141, 2026-05-01: https://github.com/CesiumGS/cesium/releases/tag/1.141
- Cesium at GEOINT, 2026-04-20: https://cesium.com/blog/2026/04/20/cesium-at-geoint-2026/
- 3D Gaussian Splats LOD, 2026-04-27: https://cesium.com/blog/2026/04/27/3d-gaussian-splats-lod/
- three.js r184, 2026-04-16: https://github.com/mrdoob/three.js/releases/tag/r184
- deck.gl v9.3.3, 2026-05-14: https://github.com/visgl/deck.gl/releases/tag/v9.3.3
- OpenLayers v10.9.0, 2026-04-15: https://github.com/openlayers/openlayers/releases/tag/v10.9.0
- PMTiles docs, retrieved 2026-05-17: https://docs.protomaps.com/pmtiles/
- GeoParquet v1.1.0: https://geoparquet.org/releases/v1.1.0/
- FlatGeobuf repo, retrieved 2026-05-17: https://github.com/flatgeobuf/flatgeobuf
- MCP spec 2025-11-25: https://modelcontextprotocol.io/specification/2025-11-25
- MCP tools structured content: https://modelcontextprotocol.io/specification/2025-11-25/server/tools
- OpenAI Structured Outputs, retrieved 2026-05-17: https://platform.openai.com/docs/guides/structured-outputs

## 建议

| 优先级 | 建议 | 理由 |
| --- | --- | --- |
| P0 | 把 AI tool contract gate 做成不可绕过项 | MCP/structured output 已是行业默认预期 |
| P1 | 启动 PMTiles/vector tile source RFC | Mapbox 已把 PMTiles 推入核心数据能力 |
| P1 | 建立 2D renderer adapter 性能基准 | MapLibre/Mapbox/deck.gl 的渲染与图层生态成熟 |
| P1 | 先写 3D MapSpec extension | Cesium 3D 能力和 AI 场景操作都在推进，GIS Engine 需要安全边界 |
| P2 | 补专业 GIS 交互与数据诊断清单 | OpenLayers 的传统 GIS 能力仍是专业用户的预期 |
