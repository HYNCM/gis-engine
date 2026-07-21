# GIS Engine 竞品分析与产品改进计划

## Context

GIS Engine v1.4.0 已完成"从 Schema 到屏幕"的渲染里程碑，但 AI 原生地图 SDK 赛道正被大厂快速占位。Google 的 Agentic UI Toolkit、SuperMap AgentX 2026 分别从消费端和桌面端定义了"AI + GIS"的新交互范式。GIS Engine 的 Schema-First + AI-Operable + Open Source 组合优势仍在，但需要快速补齐端到端 Agentic 流程、运行时数据源和开发者体验缺口，否则将失去"AI-native"这一核心叙事。

本计划基于 2026-07-04 竞品信号，制定 v1.5.0-v1.7.0 三阶段（3 个 Sprint，共 8 周）改进路线。

---

## 一、竞争态势

### 当前能力评分卡（v1.4.0）

| 维度 | 得分 | 主要瓶颈 |
|------|------|---------|
| AI operability | 9.6/10 | 缺少 intent-to-render 端到端 Agentic 流程 |
| 2D performance | 6.6/10 | 表达式覆盖不足（29/87），MapLibre v6 未升级 |
| 3D readiness | 5.4/10 | SceneView3D 仍 blocked，无真实渲染证据 |
| Developer experience | 8.2/10 | 无 Playground、无交互式文档 |
| Ecosystem | 7.2/10 | 云原生源全部 schema-only，无插件系统 |

### 关键竞争对手威胁

| 竞争对手 | 核心威胁 | 威胁等级 |
|---------|---------|---------|
| **Google Maps Agentic UI Toolkit** | LLM 系统指令→地图 UI 组件，直接定义了 AI 地图交互范式 | **高** |
| **SuperMap AgentX 2026** | 智能体原生 + 百级 MCP 工具 + A2A 协议，从桌面端定义 AI+GIS | **高** |
| **ArcGIS Maps SDK 5.x + AI Components** | 完整 2D/3D + NL 交互 + 企业级数据生态 | **中**（不同赛道） |
| **Mapbox GL JS 3.25** | ESM tree-shaking、Vulkan 渲染、Data Workbench | **中** |
| **CARTO AI 2026** | 数据仓库原生空间 AI + Skill Hub 100+ 场景 | **低**（不同定位） |

### GIS Engine 唯一护城河

**Schema-First + AI-Operable + Open Source Apache-2.0**——这是所有竞争对手中唯一同时满足声明式 MapSpec、命令式可审计变更、结构化诊断、MCP 工具集成、开源许可的组合。

---

## 二、优先级评分任务

评分公式：`priority = CT*0.35 + AO*0.30 + UV*0.20 + TD*0.10 - DR*0.05`

| # | 任务 | CT | AO | UV | TD | DR | Priority |
|---|------|---:|---:|---:|---:|---:|--------:|
| T-01 | Agentic UI 桥梁层（MCP→Render） | 10 | 9 | 9 | 3 | 5 | **8.80** |
| T-02 | PMTiles 运行时加载器 | 8 | 7 | 9 | 7 | 4 | **7.85** |
| T-03 | 表达式引擎扩展至 47+ 运算符 | 7 | 8 | 7 | 6 | 2 | **7.35** |
| T-04 | 新增 MCP 工具（query_features, style_recommend, transform_data） | 8 | 9 | 7 | 3 | 4 | **7.40** |
| T-05 | MapLibre v6 适配审计 | 7 | 4 | 6 | 8 | 3 | **6.30** |
| T-06 | 在线 Playground + 交互式文档 | 6 | 5 | 9 | 2 | 3 | **6.05** |
| T-07 | 性能趋势 CI 持续采集 | 5 | 4 | 5 | 7 | 2 | **5.15** |
| T-08 | SceneView3D 真实渲染证据 | 6 | 5 | 6 | 5 | 7 | **5.05** |
| T-09 | GeoParquet WASM 解析桩 | 6 | 6 | 7 | 5 | 7 | **5.40** |
| T-10 | 社区模板/插件框架 | 5 | 5 | 7 | 4 | 4 | **5.05** |
| T-11 | A2A 协议桩 | 7 | 7 | 4 | 3 | 5 | **5.60** |
| T-12 | CLI lint 命令 | 4 | 5 | 7 | 3 | 2 | **4.95** |

---

## 三、三阶段交付计划

### Sprint 1：v1.5.0 "Agentic Bridge"（2 周）

**目标**：打通 MCP 输出到浏览器渲染的端到端 Agentic 流程，补齐高优先级表达式。

| Task | 交付物 | 关键文件 | 验证 |
|------|-------|---------|------|
| T-01a Agentic 渲染桥 | `renderIntent()` 函数，接受 MCP 输出→生成渲染指令 | `packages/ai/src/tools/renderIntent.ts`（新增） | `pnpm test:ai` |
| T-01b Studio Agentic 模式 | Studio 支持 Agent 模式，实时渲染 MCP 工具调用流 | `apps/studio/src/components/`, `apps/studio/server/index.mjs` | `pnpm test:studio` |
| T-03a +10 表达式 | `abs, ceil, floor, round, min, max, sqrt, typeof, to-boolean, to-color` | `packages/engine/src/spec/expression-validator.ts` | `pnpm test:schema` |
| T-04a `query_features` MCP 工具 | point/bbox 空间查询，结构化返回 | `packages/ai/src/tools/queryFeatures.ts`（新增）, `packages/ai/src/mcp/server.ts` | `pnpm test:ai` |
| T-12a CLI `lint` | `gis-engine lint <spec.json>` 验证+诊断 | `packages/cli/src/lint.ts`（新增） | `pnpm test:cli` |

**Scorecard 影响**：AI 9.6→9.7 | DX 8.2→8.4

---

### Sprint 2：v1.6.0 "Data Runtime"（3 周）

**目标**：PMTiles 运行时加载落地，样式推荐工具，性能基线。

| Task | 交付物 | 关键文件 | 验证 |
|------|-------|---------|------|
| T-02a PMTiles 运行时 v1 | runtime archive load/query remain No-go; keep `queryReady: false` and track caller-supplied fixture evidence separately | `packages/engine/src/sources/pmtiles-loader.ts`, `readiness.ts` | `pnpm test:schema` + `pnpm test:resources` |
| T-03b +8 表达式 | `length, slice, indexOf, rgb, rgba, to-rgba, string, number-format` | `packages/engine/src/spec/expression-validator.ts` | `pnpm test:schema` |
| T-04b `style_recommend` MCP 工具 | 基于数据特征推荐图层样式 | `packages/ai/src/tools/styleRecommend.ts`（新增）, `server.ts` | `pnpm test:ai` |
| T-05a MapLibre v6 审计 | v6 breaking changes 审计+决策报告 | `packages/engine/src/renderer/maplibre/`, `docs/engineering/maplibre-version-drift-audit.md` | 报告 |
| T-07a 性能趋势 CI | 升级 perf-trend 为 CI 持续采集 | `tests/perf/perf-trend-ledger.test.ts`, `scripts/perf-trend.mjs` | `pnpm test:perf:trend` |

**Scorecard 影响**：2D 6.6→7.0 | AI 9.7→9.8 | DX 8.4→8.7 | Ecosystem 7.2→7.6

---

### Sprint 3：v1.7.0 "Ecosystem Opening"（3 周）

**目标**：3D 证据突破，生态框架开放，A2A 互操作桩。

| Task | 交付物 | 关键文件 | 验证 |
|------|-------|---------|------|
| T-08a SceneView3D 视觉证据 | Three.js 适配器产出真实浏览器渲染截图 | `packages/scene3d-three-adapter/src/`, `tests/snapshot/scene3d-browser-runner.ts` | `pnpm test:release:scene3d` |
| T-10a 社区模板框架 | CLI 支持 `--template community:<name>` | `packages/cli/src/templates/`, `packages/cli/src/config.ts` | `pnpm test:cli` |
| T-09a GeoParquet WASM 桩 | 最小可行解析，schema→feature 路径证明 | `packages/engine/src/sources/geoparquet-loader.ts`（新增） | `pnpm test:resources` |
| T-11a A2A 协议桩 | AgentCard JSON + task 路由接口 | `packages/ai/src/a2a/`（新增）, `packages/ai/src/index.ts` | `pnpm test:ai` |
| T-04c `transform_data` MCP 工具 | GeoJSON 属性聚合/过滤/字段映射 | `packages/ai/src/tools/transformData.ts`（新增）, `server.ts` | `pnpm test:ai` |

**Scorecard 影响**：3D 5.4→6.2 | DX 8.7→9.0 | Ecosystem 7.6→8.0

---

## 四、Scorecard 总影响预测

| 维度 | v1.4.0 | v1.5.0 | v1.6.0 | v1.7.0 | Δ |
|------|-------:|-------:|-------:|-------:|--:|
| AI operability | 9.6 | 9.7 | 9.8 | 9.8 | +0.2 |
| 2D performance | 6.6 | 6.6 | 7.0 | 7.0 | +0.4 |
| 3D readiness | 5.4 | 5.4 | 5.4 | 6.2 | +0.8 |
| Developer experience | 8.2 | 8.4 | 8.7 | 9.0 | +0.8 |
| Ecosystem | 7.2 | 7.2 | 7.6 | 8.0 | +0.8 |

---

## 五、风险缓解

| 风险 | 等级 | 缓解 |
|------|------|------|
| Agentic UI 范围蔓延 | 高 | 严格限定为 MCP-output-to-render 桥接层，不做完整 UI 框架 |
| PMTiles 引入外部依赖 | 中 | 保持 `peerDependencies` 模式，动态 import |
| MapLibre v6 破坏性变更 | 中 | 先审计再升级；`peerDependencies` 已声明 `^5.0.0 \|\| ^6.0.0` |
| SceneView3D 证据不足 | 中 | Sprint 3 目标是"证据采集"而非"稳定支持"，保持 experimental |
| 表达式扩展类型推断错误 | 低 | 每个运算符需通过 expression-validator.test.ts fixture 门禁 |

---

## 六、验证方式

每个 Sprint 完成后执行：
```bash
pnpm build:schema    # Schema 构建
pnpm check           # 全量构建+测试
pnpm lint            # Biome 代码检查
pnpm test:schema     # 表达式验证
pnpm test:ai         # MCP 工具测试
pnpm test:cli        # CLI 测试
pnpm test:studio     # Studio 测试（Sprint 1+）
pnpm test:release:scene3d  # Scene3D 门禁（Sprint 3）
```

每个 Sprint 需更新 `docs/engineering/supported-feature-matrix.md` 和 `docs/research/capability-scorecard.md`。
