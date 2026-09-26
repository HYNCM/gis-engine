---
agent: product
period: 2026-W39
generated_at: 2026-09-26T11:01:30Z
repo_revision: "ca106daef645eb52c684c9ad619b9ada91d9a8ad"
inputs:
  - https://felt.com/blog/introducing-felt-mcp-server
  - https://docs.carto.com/carto-for-agents/mcp-server.md
  - https://docs.carto.com/carto-for-agents/carto-for-agents.md
  - https://docs.mapbox.com/location-ai/mcp-servers/
  - https://maplibre.org/maplibre-gl-js/docs/
  - https://maplibre.org/maplibre-gl-js/docs/plugins/
  - https://deck.gl/docs/api-reference/json/overview
  - https://cesium.com/platform/cesiumjs
  - docs/research/capability-scorecard.md
owner: "@product"
decision_level: advisory
evidence_kind: specialist
status: ready-for-planning
---

# 竞品分析：聚焦可验证的地图工程交付

核查日期：2026-09-26。来源均为本轮访问的官方页面，未登录产品实测；下文区分官方公开能力与产品推断，不把厂商性能/安全描述当作独立验证结果。没有据此升级任何依赖或公共协议。

## 已核查事实及启示

| 对象 | 官方页面所述能力 | 对本项目的启示（推断） |
| --- | --- | --- |
| [Felt MCP](https://felt.com/blog/introducing-felt-mcp-server) | 2026-04-28 公告：托管 MCP、约 30 个工具，建图、数据接入、SQL、分析、样式与协作；交付可分享地图，声明继承工作区权限，公告面向 enterprise workspaces | “自然语言 + MCP + 地图”已经是共同能力；避免复制完整云 GIS 协作平台 |
| [CARTO MCP](https://docs.carto.com/carto-for-agents/mcp-server.md) | 当前文档覆盖 maps/workflows/data/workspace；OAuth 按角色提供地图和 workflow authoring，API token 提供较窄的读取/发现入口 | 不能沿用“只调用预制 workflow”的旧结论，也不能把审计独占性当卖点 |
| [CARTO for Agents](https://docs.carto.com/carto-for-agents/carto-for-agents.md) | MCP 是托管入口，Skills 提供操作模式，CLI 面向脚本/批处理；三者操作同一平台 | 入口应共享同一契约，避免为每个入口复制状态和管理层 |
| [Mapbox MCP](https://docs.mapbox.com/location-ai/mcp-servers/) | 四类服务器分别覆盖位置服务/Turf、开发者样式与 token/GeoJSON、文档检索、Figma 集成 | 不靠工具数量竞争；地理编码/路径/搜索通过已有服务边界接入 |
| [MapLibre](https://maplibre.org/maplibre-gl-js/docs/) / [插件](https://maplibre.org/maplibre-gl-js/docs/plugins/) | 基于 TypeScript/WebGL 和 Style Spec 的浏览器渲染；已有绘制、PMTiles、deck.gl、Three.js 等插件入口 | 保留 RendererAdapter，复用成熟渲染生态；本项目先做 2D 不代表 MapLibre 仅有 2D 能力 |
| [deck.gl JSON](https://deck.gl/docs/api-reference/json/overview) | JSONConverter、声明式图层/props 与应用提供的类型配置；该页明确错误检测仍有限 | 单有 JSON 声明并非差异化；schema 校验、机器诊断和命令语义仍值得聚焦 |
| [CesiumJS](https://cesium.com/platform/cesiumjs) | 3D globe、3D Tiles、glTF、地形影像和时态可视化，开源库与额外 ion SDK 分层 | 3D 是专门能力线；现有实验扩展保留隔离，不扩大当前产品承诺 |

CARTO 旧搜索结果路径 `/carto-mcp-server/carto-mcp-server` 本轮打开已失效，以上改用现行 `/carto-for-agents/` 文档。记录此差异，避免用缓存摘要代表当前产品。

## 定位判断

建议把当前主线收为：**面向 WebGIS 开发者、可审阅与回放的地图修改，以及用户拥有源码的可构建工程交付。** 这是一项待用户研究验证的定位假设，不表示竞品缺乏本地、审计或导出能力。

最小价值路径：本地项目 → 数据检查 → 计划/diff → 明确 apply → 诊断/恢复 → 可构建导出。保留 MapSpec、MapCommand、结构化诊断、资源政策、MCP/CLI 和快照；冻结新工具、新渲染器、云协作及无用户牵引的数据运行时扩张。现有公开能力删除必须走迁移流程。

## 建议排序

沿用优先级公式 `0.35T + 0.30A + 0.20U + 0.10D - 0.05R`。因素均 0–10，为本次规划判断，不是测试分数；T=竞品压力、A=AI 可操作收益、U=用户价值、D=技术债减少、R=交付风险。

| 建议 | T / A / U / D / R（各项理由） | 分数 | 影响 / 行动 / 置信度 |
| --- | --- | ---: | --- |
| 完成现有本地交付闭环 | 8（AI GIS 已普及）/ 9（可审阅失败恢复）/ 9（可用源码）/ 7（复用现有候选）/ 5（用户验证未知） | 7.75 | 用户价值；@builder + @quality 完成 #66/PR67 证据，@product 五人研究；高 |
| 精简治理与重复执行入口 | 6（交付速度压力）/ 6（证据更清楚）/ 7（减少维护干扰）/ 9（四套重复流水线）/ 3（无公共运行时变更） | 6.05 | 工程成本；@orchestrator 合并按需检查、压缩手册，@quality 保留门禁；高 |
| 扩大 3D/托管/新数据运行时 | 7（成熟竞品覆盖）/ 4（尚无目标任务）/ 4（当前需求未证）/ 2（增加维护）/ 9（多边界） | 4.20 | 范围与交付风险；@orchestrator 暂缓，既有能力不晋级不删契约；中 |

先做治理精简是用户本轮明确目标；交付闭环仍是后续产品最高优先级，不把加权分数当作忽略本轮指令的理由。

## HOC-N1

与本次 [scorecard](capability-scorecard.md) 一并交付 @orchestrator。消费目标为框架精简说明；研究不授权 merge/release，不替代用户 Alpha 验收或 HOC-N3 质量结论。官方来源与日期已记录；性能、售价、最新版本号未做全量比较。
