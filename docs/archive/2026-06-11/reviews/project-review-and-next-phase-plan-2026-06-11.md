# GIS Engine v1.0 — 全面项目评审与下一阶段任务规划

> 评审日期：2026-06-11 | 评审范围：v0.1.0 → v1.0.0 全量代码、架构、测试、文档、CI/CD

---

## 一、项目总览

GIS Engine 是一个 **AI-native、Schema-first、TypeScript-first** 的地图渲染 SDK，于 2026-06-10 正式发布 v1.0.0。其核心理念是：AI Agent 需要比传统地图 SDK 更严格的契约——通过版本化的 MapSpec 声明式 Schema、Command-only 状态变更、结构化诊断码和快照验证，为 AI 提供可操作的地图协议层。

项目采用 **pnpm monorepo** 结构，包含 5 个库包、1 个 Studio 应用和 1 个 VitePress 文档站，总计约 19,456 行 TypeScript 源码和 18,907 行测试代码。

### 综合评分

| 维度 | 评分 | 说明 |
|:-----|:-----|:-----|
| **类型安全** | A | 零 `any`、零 `@ts-ignore`、零 `as any`，仅 1 处 `as unknown as`（模板代码） |
| **错误处理** | A- | 结构化 Diagnostic 体系是架构亮点；Patch 模块可改进 |
| **代码复杂度** | B+ | `generationEvidence.ts` (2226 行) 是主要重构目标 |
| **API 设计** | A | 命名一致、无 default export、无废弃导出、子路径导出模式前瞻 |
| **测试覆盖** | B+ | 55 个测试文件 637+ 用例；`json-patch.test.ts` 边界覆盖不足 |
| **依赖健康** | A- | 无冲突；MCP SDK 是唯一存在规范波动风险的依赖 |
| **构建分发** | A | TypeScript project references + NPM publish + CDN ESM 包 |
| **文档质量** | A | 42 份评审文档 + 14 份特性规格 + VitePress 站，极其完善 |
| **CI/CD** | A | 11 条 GitHub Actions workflow，含路径感知门控和 bundle size 监控 |
| **技术债务** | A | 全源码零 TODO/FIXME/HACK/XXX 标记 |

### 架构总览

```
@gis-engine/cli ──→ @gis-engine/engine (core)
     │                    ↑
     └→ @gis-engine/ai ───┘  (MCP tools, AI orchestration)
                          ↑
@gis-engine/scene3d ──────┘  (3D contract scaffold, experimental)
     ↑
@gis-engine/scene3d-three-adapter  (Three.js spike, experimental)
```

架构评分 **8.7/10**（来源：架构评审 2026-05-31），包依赖图无环，schema-first / command-only / structured diagnostics 三大原则被一致执行。

---

## 二、核心优势

1. **Schema-first 设计哲学**：MapSpec 声明式 Schema 作为唯一真相源，所有状态变更通过类型化 MapCommand，天然适合 AI Agent 操作，这是 GIS SDK 领域的真正创新。

2. **极致的类型安全纪律**：在最严格的 TypeScript 配置下（`noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`），全项目零类型逃逸，这在同等规模项目中极为罕见。

3. **MCP 协议层**：7 个 MCP 工具直接操作公开 Schema 而非渲染器内部状态，为 AI 可操作的地图 SDK 设立了行业标准。

4. **测试工程成熟度**：契约测试套件（`createAdapterContractSuite`）跨 Mock/MapLibre/Scene3D 复用、Fixture 驱动、场景化测试、Playwright 视觉快照、性能趋势账本——测试策略全面且专业。

5. **文档治理体系**：42 份评审文档 + 14 份特性规格 + 归档规则 + 措辞护栏，文档质量和治理水准在开源项目中属于顶尖水平。

6. **迭代速度**：从 0.1.0 到 1.0.0 仅用约一个月，每个版本在增加大量功能的同时保持了质量和测试覆盖。

---

## 三、发现的问题与改进空间

### P0 — 高优先级（阻塞性问题）

**问题 1：架构文档与代码实际结构不一致**

`docs/architecture/core-framework.md` 描述了 `sources/`、`layers/`、`interactions/`、`snapshot/` 等子目录，但实际代码结构为 `commands/`、`diagnostics/`、`generation/`、`renderer/`、`runtime/`、`spec/`。新用户和贡献者会被误导。

**问题 2：`generationEvidence.ts` 单文件 2226 行**

这是整个 AI 包最大的文件，混合了 Schema 定义、空间查询处理、生成规划证据、示例应用交叉引用、诊断计数和 Ajv 验证逻辑。违反单一职责原则，是可维护性的主要风险点。

### P1 — 中优先级（影响可扩展性）

**问题 3：SourceLoader 仅有契约接口，无运行时实现**

`packages/engine/src/sources/contract.ts` 导出了 `SourceLoader` 接口，但不包含运行时的 fetch/decode/worker/archive/query 行为。每个新的渲染器适配器都必须自行实现源加载，存在重复建设风险。

**问题 4：`json-patch.test.ts` 仅 5 条断言**

`applyPatch.ts` 有 10+ 条错误路径（越界、不支持操作、路径不存在等），但测试仅覆盖了 happy path 和一个错误场景。Patch 系统是整个 Command 机制的基础设施，测试深度不足。

**问题 5：`scene3d-three-adapter/src/index.ts` 单文件 1380 行**

整个 Three.js 适配器（契约、生命周期、审计、运行时）全部在一个文件中。作为 spike/experimental 阶段尚可接受，但如果要推进到 stable，必须先拆分。

**问题 6：`docs/archive/` 积压过期的 W21/W22 计划文档**

归档目录包含多个过期快照（2026-05-18、05-30、06-02、06-06、06-07、06-10），需要定期清理和索引。

### P2 — 低优先级（长期改进）

**问题 7：缺少引擎级空间索引**

`queryFeatures()` 完全委托给渲染器适配器，无法在无渲染器情况下做确定性空间查询。可评估 flatbush / geokdbush。

**问题 8：Extension Registry 非正式**

扩展目前是 `Record<string, unknown>`，缺少对扩展名称、Schema、能力需求、诊断码的集中注册机制。

**问题 9：6 项工程增强建议（E1-E6）未纳入排期**

包括：vitest 覆盖率配置、`invertPatch` 性能优化、CI Playwright 浏览器缓存、Ajv 实例统一等。这些都是有价值但不阻塞的改进。

---

## 四、下一阶段高价值任务规划

基于以上评审发现，结合项目当前 roadmap 和已关闭的 W25 队列，以下是建议的下一阶段任务优先级排序：

### Tier 1：立即执行（W26 上半周，预计 2-3 天）

#### 任务 1：拆分 `generationEvidence.ts` 为模块化结构
**价值**：消除最大可维护性风险，为后续 AI 层功能扩展铺路
**预估工作量**：1 天
**具体方案**：
- 提取 `schema-definitions.ts`（Schema 定义，~100 行）
- 提取 `spatial-query-processor.ts`（空间查询 case 处理）
- 提取 `planner-evidence.ts`（生成规划证据）
- 提取 `example-app-resolver.ts`（示例应用交叉引用）
- 保留 `generationEvidence.ts` 作为组合层 barrel export
- 确保所有现有测试通过，无公共 API 变更

#### 任务 2：同步架构文档与实际代码结构
**价值**：消除 UP-002 P0 技术债务，降低新贡献者入门门槛
**预估工作量**：0.5 天
**具体方案**：
- 重写 `docs/architecture/core-framework.md`，反映实际的 `commands/diagnostics/generation/renderer/runtime/spec/` 结构
- 补充各子模块的职责描述和关键文件引用
- 确保 VitePress 站的架构页面同步更新

#### 任务 3：补充 `json-patch.test.ts` 边界测试
**价值**：加固 Command 系统基础设施的测试深度，防御回归
**预估工作量**：0.5 天
**具体方案**：
- 为 `applyPatch.ts` 的每条 throw 路径编写至少 1 个测试用例
- 覆盖：空路径、路径不存在、不支持的操作类型、越界索引、类型不匹配
- 为 `invertPatch.ts` 和 `normalizePatch.ts` 增加边界用例
- 目标断言数：从 5 条提升到 20+ 条

### Tier 2：短期推进（W26 下半周 ~ W27，预计 3-5 天）

#### 任务 4：实现 Issue #14 — PMTiles 运行时查询加载器契约
**价值**：解决当前唯一的 P1 open issue，推进云原生数据源能力
**预估工作量**：2 天
**具体方案**：
- 基于 `packages/engine/src/sources/pmtiles-query.ts` 和 `contract.ts` 设计加载器契约
- 实现负向 fixture（source-not-found、invalid-archive、schema-mismatch）
- 编写 `source-loader.test.ts` 覆盖正向和负向路径
- 更新 `source-readiness-report` 反映新的能力边界

#### 任务 5：SourceLoader 运行时行为补齐
**价值**：解决架构评估中的 P1 gap，使新适配器不必重复实现源加载
**预估工作量**：2 天
**具体方案**：
- 基于现有 `SourceLoader` 契约，实现通用 fetch/decode 流水线
- 支持 GeoJSON 和 PMTiles 两种核心源类型的运行时加载
- 在 MockAdapter 中验证契约完整性
- 编写集成测试，确保 MapLibre adapter 可逐步迁移到共享实现

#### 任务 6：归档清理与文档索引
**价值**：降低文档噪音，提升信息检索效率
**预估工作量**：0.5 天
**具体方案**：
- 为 `docs/archive/` 创建索引文件，标注每个归档的时间范围和内容摘要
- 移除明显过期的 W21/W22 计划文档（保留至少 6 个月内的归档）
- 在 `CONTRIBUTING.md` 中补充归档规则说明

### Tier 3：中期规划（W28 ~ W30，预计 5-8 天）

#### 任务 7：拆分 `scene3d-three-adapter` 为多文件结构
**价值**：为 SceneView3D 从 spike 推进到 stable 做必要准备
**预估工作量**：1.5 天
**具体方案**：
- 拆分为 `contract.ts`（接口定义）、`lifecycle.ts`（生命周期管理）、`audit.ts`（依赖边界审计）、`runtime.ts`（运行时实现）
- 保持公共 API 不变，`index.ts` 转为 barrel export
- 补充模块化后的单元测试

#### 任务 8：实现 Engine 级空间索引
**价值**：解除 `queryFeatures()` 对渲染器的依赖，支持 headless 空间查询
**预估工作量**：2-3 天
**具体方案**：
- 评估 flatbush vs geokdbush 的性能和包大小影响
- 在 engine 层实现确定性空间索引（不依赖渲染器）
- 保持与现有 MapLibre adapter `queryFeatures()` 的向后兼容
- 编写性能基准测试，确保不引入 bundle size 超限（当前预算 < 130KB gzip）

#### 任务 9：Extension Registry 正式化
**价值**：为未来的插件生态和第三方扩展奠定基础
**预估工作量**：1.5 天
**具体方案**：
- 设计 `ExtensionRegistry` 接口，包含 name、schema、capabilities、diagnostics 注册
- 将当前 `Record<string, unknown>` 迁移到类型安全的注册机制
- 为 SceneView3D 扩展编写注册示例
- 文档化扩展开发指南

#### 任务 10：Patch 系统结构化错误
**价值**：提升 Patch 操作的错误可调试性，与项目整体 Diagnostic 风格一致
**预估工作量**：0.5 天
**具体方案**：
- 创建 `PatchError` 类（继承 Error），携带 operation、path、context 信息
- 将 `applyPatch.ts` 中的 10 处 `throw new Error` 迁移到 `PatchError`
- 在 `buildPatch.ts` 中增加结构化错误转换
- 更新测试以验证错误结构

### Tier 4：长期探索（Q3 2026）

#### 任务 11：Issue #15 — Workbench 产品化路线 Go/No-Go 评审
#### 任务 12：工程增强 E1-E6 逐步落地
#### 任务 13：国际化支持（架构文档中英双语）
#### 任务 14：MapLibre v6 升级兼容性验证

---

## 五、任务依赖关系

```
任务 1 (拆分 generationEvidence) ── 无依赖，可立即执行
任务 2 (同步架构文档) ────────── 无依赖，可立即执行
任务 3 (补充 patch 测试) ──────── 无依赖，可立即执行
          │
          ▼
任务 4 (PMTiles 加载器) ──────── 可并行启动，与任务 5 有协同
任务 5 (SourceLoader 运行时) ──── 建议在任务 4 之后或并行
任务 6 (归档清理) ─────────────── 无依赖
          │
          ▼
任务 7 (拆分 scene3d adapter) ─── 独立，可在任何时候执行
任务 8 (空间索引) ─────────────── 建议参考 SourceLoader 设计
任务 9 (Extension Registry) ──── 建议在 scene3d 拆分后执行
任务 10 (Patch 错误结构化) ────── 建议与任务 3 同步执行
```

### 建议的执行顺序

**第一周（W26）**：任务 1 + 2 + 3 + 10 → 消除最大技术债务，加固测试基础
**第二周（W27）**：任务 4 + 5 → 推进核心功能，解决 open issues
**第三周（W28）**：任务 6 + 7 → 清理文档，准备 scene3d 稳定化
**第四周起（W29+）**：任务 8 + 9 → 架构增强，为长期扩展奠基

---

## 六、风险与护栏提醒

1. **不可突破的护栏**（来自项目现有规划）：
   - 不添加 MCP 工具名称或别名
   - 不提升 `view.mode: "scene3d"` 为 stable
   - 不声称 PMTiles 存档解析、隐藏 range IO、worker 或 feature query 能力
   - Studio / AI Map Workbench 保持 reference/example 定位

2. **Bundle Size 预算**：engine < 130KB gzip, CLI < 55KB gzip。任何新增依赖需评估包大小影响。

3. **MCP SDK 版本风险**：`@modelcontextprotocol/sdk` ^1.29.0 是 pre-v2，规范仍在演进。建议锁定测试覆盖 MCP 工具注册和调用的关键路径。

---

*报告生成时间：2026-06-11 | 评审工具：QoderWork*
