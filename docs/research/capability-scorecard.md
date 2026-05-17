---
agent: competitive-intel
period: 2026-W20
generated_at: 2026-05-17T16:35:00Z
repo_revision: "acdf28e"
inputs:
  - docs/research/competitor-updates-2026-W20.md
  - README.md
  - docs/spec/contracts-and-interfaces.md
  - docs/engineering/ci-test-strategy.md
decision_level: advisory
---

# Capability Scorecard

| 维度 | GIS Engine 草案分 | 当前外部标杆 | 判断 | 置信度 |
| --- | ---: | --- | --- | --- |
| AI 可操作性 | 8.1/10 | MCP structured output、OpenAI Structured Outputs、Cesium MCP 展示 | schema-first/MCP 方向领先；tool input/output schema、Diagnostic failure path 和 strict capability report 已补齐 | high |
| 2D 性能 | 5.5/10 | Mapbox v3.23/v3.24、MapLibre v5/v6、deck.gl v9.3 | 适配器路线正确，但缺少同场景性能基准证据 | medium |
| 3D readiness | 3.5/10 | CesiumJS 1.141、Three.js r184 | 3D 还应先做 MapSpec extension、camera/picking/snapshot 边界 | medium |
| 开发体验 | 6.0/10 | OpenLayers、deck.gl、Mapbox 示例生态 | schema-first 是优势；public docs、examples、migration guide 还需补齐 | medium |
| 云原生数据生态 | 5.8/10 | PMTiles、GeoParquet、FlatGeobuf、Mapbox PMTiles | PMTiles + generic vector source 已具备 schema/transformer/snapshot 证据；GeoParquet/FlatGeobuf 仍后置 | high |

## 本周 Delta

- AI 可操作性上调，因为 MCP failure path、tool output schema、strict `CapabilityReportSchema` 已进入测试证据。
- 云原生数据生态上调，因为 generic vector source 已落地到 schema、resource policy、MapLibre transformer、example 和 snapshot。
- 3D readiness 不建议通过实现加速拉分，应通过 SceneView3D boundary spec 先拉齐边界。

## 下一次更新要求

- 每个分数必须保留一条 dated evidence。
- 如果竞品信息无法当前核验，保留旧分数并标记 `confidence: low`。
- scorecard 只记录影响 roadmap 的维度，不做泛泛新闻摘要。
