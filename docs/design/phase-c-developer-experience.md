## Phase C: Developer Experience — Module Design

### 1. Goal

让一个新用户在 5 分钟内完成 "发现 → 安装 → 看到第一张地图 → 理解下一步" 的完整旅程。

Phase A（SDK 硬化）和 Phase B（Provider HTTP 层）已让 `npx create-gis-map` 端到端可用。但当前开发者体验存在显著缺口：文档站 50% 侧边栏链接 404、根 README 像内部状态报告、5/7 示例是无文档的 fixture、没有版本迁移指南、没有可交互的 playground。Phase C 的目标是把这些缺口全部关闭到 "GOOD" 级别。

### 2. 当前状态评估

| 领域 | 评级 | 核心问题 |
|------|------|---------|
| 根 README | NEEDS_WORK | 像内部状态报告，无连贯 onboarding 流程，broken self-anchor |
| engine README | NEEDS_WORK | 只有 install + minimal usage，无 API ref 链接，无 peerDependency 说明 |
| ai README | NEEDS_WORK | 过于密集的内部设计文档，无 IDE 配置示例，无 API ref 链接 |
| cli README | GOOD | 完整端到端 walkthrough，全参数表，provider 配置 |
| examples/ | NEEDS_WORK | 5/7 示例无文档 fixture，无 getting-started 示例 |
| VitePress 文档站 | NEEDS_WORK | 11/22 侧边栏链接 404，playground 链接指向空 URL |
| 版本迁移指南 | MISSING | 无 v0.2→v0.3 迁移指南（hashPrompt 是 public breaking change） |
| 性能基准 | NEEDS_WORK | 有预算但无实测数据发布 |
| 在线 Playground | MISSING | 导航链接存在但无实际部署 |
| npm 包发现 | NEEDS_WORK | CLI README 自足，engine/ai README 过于单薄 |

### 3. Scope

**In scope**: 根 README 重写、包 README 增强、VitePress 侧边栏修复、getting-started 示例、v0.2→v0.3 迁移指南、性能数据发布、bare fixture 示例补描述、playground 链接处理。

**Out of scope**: 完整在线 playground 开发（需要前端工程 + 部署基础设施，推迟到 v0.4）、MapLibre 迁移指南更新（已有，且 v6 升级当前 No-go）、国际化文档。

### 4. 子任务拆分

#### C-1: 根 README 重写 — P0

**目标**: 根 README 从 "内部状态报告" 变成 "新用户 onboarding 入口"。

**变更**:
1. **重写顶部 30 行** — 用 "What is GIS Engine?" → "Quick Start" → "5-minute Tutorial" → "Learn More" 结构替换当前密集的项目状态段落。内部状态移到 `## Project Status` 子节。
2. **修复 broken anchor** — `#quick-start` 链接指向不存在的 heading。添加 `## Quick Start` heading。
3. **增加 package relationship 图** — 用 ASCII 或 Mermaid 说明 `@gis-engine/engine`（核心）、`@gis-engine/ai`（AI 工具）、`@gis-engine/cli`（CLI 入口）的关系。
4. **增加 CLI prominence** — 在 Quick Start 区域突出 `npx create-gis-map` 作为推荐入口。
5. **移除或下移内部规划引用** — SceneView3D promotion readiness、W23 sprint references 等移到 Project Status 节或链接到内部文档。

**文件**: `README.md` (root)

#### C-2: 包 README 增强 — P0

**目标**: 每个包 README 都能让 npm 用户独立 onboarding。

**engine README 变更**:
1. 添加 MapLibre peerDependency 安装说明：`npm install maplibre-gl`
2. 添加 CDN 使用选项
3. 添加 API reference 链接（指向 VitePress 站 `/api/engine`）
4. 添加 "Next Steps" 小节链接到 CLI 和 examples
5. 补充 `map.validate()`, `map.snapshot()`, `map.exportSpec()` 的使用示例

**ai README 变更**:
1. 添加 Claude Desktop / Cursor MCP 配置示例（已有内容在 VitePress 站 `/api/ai.md`，搬到 README）
2. 添加最小 `callGisEngineTool()` 编程示例
3. 添加 API reference 链接（指向 `/api/ai`）
4. 在开头添加 "Quick Start" 小节，然后再进入 evidence bundle 详解

**文件**: `packages/engine/README.md`, `packages/ai/README.md`

#### C-3: VitePress 侧边栏修复 — P0

**目标**: 消除文档站所有 404 链接。

**变更**:

**方案**: 为 11 个 phantom page 分三类处理：

| 页面 | 处理 | 理由 |
|------|------|------|
| `/guide/generation-evidence` | **创建** | 核心功能，Phase B 已实现，需要用户文档 |
| `/guide/resource-policy` | **创建** | engine 已有 `validateResourcePolicy()` API，需要说明 |
| `/guide/performance` | **创建** | C-7 会发布实测数据，需要页面承载 |
| `/guide/custom-adapters` | **创建** | `registerAdapter()` 是 public API，需要教程 |
| `/mcp/validate-spec` | **创建** | 7 个 MCP 工具需要独立参考页 |
| `/mcp/apply-commands` | **创建** | 同上 |
| `/mcp/export-spec` | **创建** | 同上 |
| `/mcp/get-context-summary` | **创建** | 同上 |
| `/mcp/snapshot-spec` | **创建** | 同上 |
| `/mcp/explain-spec` | **创建** | 同上 |
| `/mcp/export-example-app` | **创建** | 同上 |

**Playground 链接**: 从导航栏移除，替换为 "Examples" 链接指向 `examples/` 目录。未来 playground 实现后恢复。

**文件**: `docs/website/` 下 11 个新 `.md` 文件 + `.vitepress/config.mjs` 修改

#### C-4: Getting-Started 示例 — P0

**目标**: 提供一个完整的、自包含的新用户示例，5 分钟可运行。

**结构**:
```
examples/getting-started/
├── README.md           # Step-by-step walkthrough
├── package.json        # deps: @gis-engine/engine, maplibre-gl, vite
├── index.html          # 最小 HTML 页面，渲染一个带 GeoJSON 的地图
├── src/
│   └── main.ts         # TypeScript 入口：createMap → apply → validate → snapshot
├── data/
│   └── points.geojson  # 10 个示例 GeoJSON 点（世界主要城市）
└── vite.config.ts      # Vite 配置（可选）
```

**README.md 内容**:
1. `npm install` → `npm run dev` → 打开浏览器看到地图
2. 解释 MapSpec JSON 结构（sources + layers + view）
3. 演示如何用 `applyCommands` 添加新图层
4. 演示如何用 `validateSpec` 检查 spec 合法性
5. 演示如何用 `snapshot` 生成地图截图
6. "Next Steps" 链接到 CLI、MCP、更多 examples

**文件**: `examples/getting-started/` 下 7 个新文件

#### C-5: 版本迁移指南 — P1

**目标**: 为每个 minor version 的 breaking change 提供迁移指导。

**结构**:
```
docs/migration/
├── v0.1-to-v0.2.md     # 已有 MapLibre 迁移，需补充 v0.2 变更
└── v0.2-to-v0.3.md     # 新文件
```

**v0.2→v0.3 内容**:
1. `hashPrompt()` 格式变更：16-char hex → `sha256:<32-hex>`
2. 新增 `--api-key` 和 `--timeout` CLI 参数
3. Generate pipeline 从硬编码 intent 变为动态 provider 输出
4. 新增 `provider-http.ts` 模块导出
5. 新增 `resolveProviderProfile()` 和 `readProviderApiKey()` 工具函数

**文件**: `docs/migration/v0.2-to-v0.3.md` (新文件)

#### C-6: Bare Fixture 示例补描述 — P2

**目标**: 为 5 个无文档 fixture 添加最小描述。

**变更**: 为每个 fixture 目录添加 `README.md`，包含：
- 一句话描述该 fixture 演示什么
- `map.json` 的关键特征（source 类型、layer 类型、view 设置）
- 如何在测试或自己的项目中使用

**文件**: `examples/basic-geojson/README.md`, `examples/raster-basemap/README.md`, `examples/pmtiles-local/README.md`, `examples/vector-tile-url/README.md`, `examples/fill-extrusion-lite/README.md` (5 个新文件)

#### C-7: 性能数据发布 — P2

**目标**: 运行 benchmark 并发布实测数据到 VitePress 站。

**变更**:
1. 运行 `pnpm test:perf:smoke` 和 `pnpm test:perf:nightly`，捕获输出
2. 整理为表格：操作 / 预算 / 实测 / 环境（Node version, OS, hardware）
3. 写入 `docs/website/guide/performance.md`（C-3 已创建骨架）
4. 添加 "How to run benchmarks yourself" 小节

**文件**: `docs/website/guide/performance.md` (更新)

#### C-8: Playground 链接处理 — P2

**目标**: 消除 dead link，不承诺不存在的功能。

**变更**: 
- 从 VitePress nav 中移除 Playground 链接
- 替换为 Examples 链接，指向 `https://github.com/HYNCM/gis-engine/tree/main/examples`
- 在 C-3 中一并完成

### 5. 实现优先级和工期

| 子任务 | 优先级 | 前置依赖 | 预估 |
|--------|--------|---------|------|
| C-1: 根 README 重写 | P0 | 无 | 0.5d |
| C-2: 包 README 增强 | P0 | 无 | 0.5d |
| C-3: VitePress 侧边栏修复 | P0 | 无 | 1.5d（11 页内容） |
| C-4: Getting-Started 示例 | P0 | 无 | 1d |
| C-5: v0.2→v0.3 迁移指南 | P1 | C-1 | 0.5d |
| C-6: Bare fixture 补描述 | P2 | 无 | 0.5d |
| C-7: 性能数据发布 | P2 | C-3 | 0.5d |
| C-8: Playground 链接处理 | P2 | 与 C-3 合并 | 0d |
| **总计** | | | **5d** |

C-1/C-2/C-4/C-6 无依赖可并行。C-3 工作量最大（11 页），是关键路径。C-5/C-7 依赖前序任务。

### 6. 验证门

| 验证项 | 通过条件 |
|--------|---------|
| VitePress build | `pnpm --filter docs-website build` 无 warning |
| 侧边栏链接 | 所有 sidebar 链接在 `dist/` 中有对应 HTML（0 个 404） |
| Getting-Started 示例 | `cd examples/getting-started && npm install && npm run dev` 成功启动 |
| 根 README 检查 | 不包含 "W23 sprint"、"promotion readiness"、"SceneView3D evidence" 等内部术语在 Quick Start 区域 |
| 迁移指南 | v0.2→v0.3 文档覆盖所有 CHANGELOG 中的 breaking change |
| npm 包发现 | 三个包 README 均包含 install 命令、最小示例、API reference 链接 |
| Playground 链接 | nav 中不存在指向未部署资源的链接 |

### 7. 风险

| 风险 | 可能性 | 影响 | 缓解 |
|------|-------|------|------|
| VitePress 11 页内容质量不高 | Medium | Medium | 用实际 API 代码和运行结果填充，不写空洞的 placeholder |
| Getting-Started 示例依赖 maplibre-gl 安装失败 | Low | Low | package.json 锁定 maplibre-gl 版本范围，README 提供 CDN fallback |
| 性能数据在不同环境差异大 | Medium | Low | 明确标注硬件/OS/Node 版本，说明 "budget 是上限，不是典型值" |
| 根 README 重写影响内部规划引用 | Low | Low | 内部状态不删除，只是移到独立的 Project Status 节 |
