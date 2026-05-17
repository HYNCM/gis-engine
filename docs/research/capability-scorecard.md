---
agent: competitive-intel
period: 2026-W20
generated_at: 2026-05-17T14:04:15Z
repo_revision: "bab1327"
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
| AI 可操作性 | 7.5/10 | MCP structured output、OpenAI Structured Outputs、Cesium MCP 展示 | schema-first/MCP 方向领先，但 MCP contract tests 和 failure diagnostics 仍需硬化 | high |
| 2D 性能 | 5.5/10 | Mapbox v3.23/v3.24、MapLibre v5/v6、deck.gl v9.3 | 适配器路线正确，但缺少同场景性能基准证据 | medium |
| 3D readiness | 3.5/10 | CesiumJS 1.141、Three.js r184 | 3D 还应先做 MapSpec extension、camera/picking/snapshot 边界 | medium |
| 开发体验 | 6.0/10 | OpenLayers、deck.gl、Mapbox 示例生态 | schema-first 是优势；public docs、examples、migration guide 还需补齐 | medium |
| 云原生数据生态 | 4.5/10 | PMTiles、GeoParquet、FlatGeobuf、Mapbox PMTiles | 明显短板；PMTiles/vector tile source 应进入 v0.2 | high |

## 本周 Delta

- AI 可操作性维持正向，但 code-reviewer 发现 MCP failure path 未完全结构化，短期不能再加分。
- 云原生数据生态优先级上调，主要由 Mapbox PMTiles 支持推动。
- 3D readiness 不建议通过实现加速拉分，应通过 SceneView3D boundary spec 先拉齐边界。

## 下一次更新要求

- 每个分数必须保留一条 dated evidence。
- 如果竞品信息无法当前核验，保留旧分数并标记 `confidence: low`。
- scorecard 只记录影响 roadmap 的维度，不做泛泛新闻摘要。
