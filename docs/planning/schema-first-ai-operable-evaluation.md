# Schema-First + AI-Operable 范式评估与扬长避短改进方案

## Context

用户提供了一份关于 "Schema-First + AI-Operable" SDK 范式的详细优劣势分析报告，要求结合 GIS Engine 项目实际评估该报告，并研究如何扬长避短。同时用户特别指出 `view.mode: "scene3d"` 已成为演进路径上的"硬骨头"，需要找到让演进更顺利的突破口。

---

## 一、报告评估：GIS Engine 视角的逐条对照

### 报告优势论断 vs 项目实证

| 报告优势 | GIS Engine 实证 | 评估 |
|----------|----------------|------|
| AI Agent 精准调用 | 14 个 MCP 工具，100% inputSchema/outputSchema 覆盖，Ajv 四级验证管道 | **完全验证** — 项目是该优势的典型范例 |
| 人机协作单一事实来源 | MapSpec Schema 版本化 `$id`，strict `additionalProperties: false`，编译时双向类型断言 | **完全验证** — Schema 即人-AI 双重契约 |
| 前后端/AI 并行开发 | CLI 脚手架 + AI 生成管线 + 22 个独立示例 + schema-sync 测试 | **已验证** — 三条入门路径支撑并行开发 |
| 设计质量与治理 | 14 个测试套件、多层 CI gate、contract freeze、Biome 统一 lint | **行业领先** — 治理基础设施远超报告预期 |

### 报告劣势论断 vs 项目实际遭遇

| 报告劣势 | GIS Engine 实际状况 | 严重程度 |
|----------|---------------------|----------|
| Schema 与实现同步（双份维护） | `types.ts`(608行) 与 TypeBox Schema 并行维护，虽有编译时双向断言但无单向生成 | **中等** — 已有防御但仍有漂移风险 |
| 文档-实现漂移 | `mcp-server-description.md` 声明 9 工具，实际 14 工具；feature matrix 未更新 | **高** — 正是报告预言的痛点 |
| 学习曲线与前期投入 | TypeBox 的 `Static<typeof>` 降低了门槛，CLI 脚手架简化入门，但无交互式 Playground | **中等** — 有缓解措施但不够极致 |
| 语义缺失（Schema 缺业务上下文） | MCP 工具 description 以功能描述为主，缺少"适用/不适用场景"的场景化描述 | **中等** — 影响 AI 调用准确率 |
| 动态能力受限 | Command Pattern + CapabilityRequest/Report 已有基础，但无显式工作流 Schema | **中低** — 通过组合可缓解 |
| 生态碎片化 | 仅 TypeBox/JSON Schema 格式，未导出 OpenAPI/AsyncAPI | **低** — 当前 MCP 单通道足够 |

### 报告未预见但项目暴露的问题

1. **表达式引擎覆盖不足**：仅 29/87 运算符，直接限制 AI 生成地图的表现力 — 这是报告未讨论的"Schema 表达力瓶颈"
2. **SceneView3D 价值闭环未完成**：Schema/命令/诊断/MCP 上下文全部就绪，但运行时始终返回 unsupported — 典型的"Schema 先行但实现滞后"困境
3. **云原生源运行时缺失**：GeoParquet/FlatGeobuf/GeoTIFF 仅有 Schema 契约，无运行时实现

---

## 二、核心判断

GIS Engine 在 Schema-First + AI-Operable 维度上已是**行业领先级项目**（治理基础设施、MCP 集成、编译时双向断言均达到或超过业界最佳实践）。报告所列优势在项目中几乎全部得到验证，而所列劣势中有 3 个正在项目中实际发生。

**关键洞察**：项目当前的核心矛盾不是"Schema-First 范式本身的问题"，而是 **"Schema 能力建设远超运行时实现能力"** — 即 Schema 已为 SceneView3D、云原生源、完整表达式引擎做好了准备，但实现层未能跟上。这是报告中"抽象泄漏"劣势的一个变体：不是 Schema 过度设计，而是实现未能兑现 Schema 的承诺。

---

## 三、扬长避短改进方案

### Task 1: 修复文档-实现漂移（P0，1-2天）

**目标**：消除报告所列的首要实际痛点

**具体行动**：
- 更新 `docs/mcp-server-description.md`：从 9 工具扩展至 14 工具，补充 `inspect_data`、`edit_spec`、`query_features`、`style_recommend`、`transform_data` 的完整描述
- 更新 `docs/engineering/supported-feature-matrix.md`：同步 MCP 工具数和功能状态
- 在 schema-sync 测试中增加"文档工具数与实际注册工具数一致性"检查，防止再次漂移

**关键文件**：
- `docs/mcp-server-description.md`
- `docs/engineering/supported-feature-matrix.md`
- `tests/schema-sync/schema-sync.test.ts`

### Task 2: 增强 MCP 工具场景化描述（P0，1-2天）

**目标**：利用行业发现"场景化描述提升 AI 调用准确率 20-30%"

**具体行动**：
- 为 14 个 MCP 工具的 `description` 字段补充：适用场景、不应调用场景、参数示例值
- 重点优化 `apply_commands`（最高频调用）和 `generate_spec`（最易误用）
- 保持 snake_case 工具名冻结不变

**关键文件**：
- `packages/ai/src/mcp/server.ts`（工具 description 定义）
- `tests/schema-sync/schema-sync.test.ts`（锁定 description 非空检查）

### Task 3: 消除 types.ts 双轨维护风险（P1，3-5天）

**目标**：解决报告核心劣势"Schema 与代码同步"

**具体行动**：
- 将 `packages/engine/src/types.ts` 中的公开类型全部改为从 TypeBox Schema 的 `Static<typeof>` 派生
- 保留 `types.ts` 作为 re-export 层（向后兼容），但消除手写重复定义
- 在 schema-sync 测试中增加"types.ts 导出类型与 Schema 推导类型一致性"的编译时断言

**关键文件**：
- `packages/engine/src/types.ts`
- `packages/engine/src/spec/schemas/*.schema.ts`
- `tests/schema-sync/schema-sync.test.ts`

### Task 4: SceneView3D 解锁路径（P1，分阶段）

**目标**：解决用户特别指出的"硬骨头"，让演进路径畅通

**诊断**：SceneView3D 的阻塞不是 Schema 问题（Schema 已就绪），而是 **运行时证据链缺失**。当前有 3 个 blocker code 阻止 `view.mode: "scene3d"` 被接受。

**分阶段行动**：

**Phase 4a: 证据链闭环（1-2周）**
- 在 `packages/scene3d-three-adapter/` 中完成最小可渲染场景的端到端验证
- 通过 resource-policy 检查（`@quality` gate 前置条件）
- 生成真实 renderer snapshot/visual evidence
- 关键文件：`packages/scene3d-three-adapter/src/`、`tests/adapter/`

**Phase 4b: Blocker 逐步解除（2-3周）**
- 针对 3 个 Scene3D blocker code 逐一提供解决方案
- 每个 blocker 解除需通过 `@quality` gate（schema + deterministic + visual snapshot）
- 关键文件：`packages/engine/src/diagnostics/codes.ts`（Scene3DStableRuntimeBlockerCodes）

**Phase 4c: MCP 层实验性 3D 工具（可选，1周）**
- 在 MCP 中增加实验性 `scene3d_preview` 工具（不违反7工具冻结，因为是实验性工具）
- 允许 AI Agent 预览 3D 场景并获取结构化反馈

### Task 5: 表达式引擎扩展（P1，按 sprint 推进）

**目标**：解除 AI 生成地图表现力的主要瓶颈

**具体行动**：
- 按 `competitive-analysis-improvement-plan.md` T-03 优先级，Sprint 1 扩展至 47+ 运算符
- 每个新运算符需要：Schema 定义 + 语义验证 + 适配器映射 + 测试覆盖
- 优先实现 AI 生成场景最常使用的运算符（基于 `generate_spec` 调用数据）

**关键文件**：
- `packages/engine/src/spec/`（表达式 Schema）
- `tests/schema/expression-validator.test.ts`

### Task 6: Schema 变更自动 Diff 报告（P1，2-3天）

**目标**：利用行业最佳实践进一步加固 Schema 治理

**具体行动**：
- 在 CI 的 `pr-quality.yml` 中增加 Schema Diff 步骤
- 当 `packages/engine/src/spec/schemas/` 变更时，自动生成 Schema 变更摘要并评论到 PR
- 标记 Breaking Change vs Non-Breaking Change（与 contract-freeze.md 规则对齐）

**关键文件**：
- `.github/workflows/pr-quality.yml`
- 新增 `scripts/schema-diff.mjs`

### Task 7: 开发者体验 — 交互式 Playground（P2，1-2周）

**目标**：缓解报告提到的"学习曲线"劣势

**具体行动**：
- 基于现有 `apps/studio/` 扩展在线 MapSpec Playground
- 三栏布局：Schema 编辑 + 实时预览 + AI 对话（利用 MCP 工具）
- 支持从示例模板快速启动，降低新用户认知负担

**关键文件**：
- `apps/studio/src/`
- `packages/ai/src/mcp/`

### Task 8: 工具调用准确率基准测试（P2，1周）

**目标**：建立 AI 体验质量的可量化追踪机制

**具体行动**：
- 建立包含 50+ 典型场景的 MCP 工具调用基准测试集
- 覆盖：正确工具选择、参数合规、输出格式验证
- 在 CI 中运行（非阻塞，仅报告趋势）
- 目标：首次建立基线后，持续追踪优化效果

**关键文件**：
- 新增 `tests/ai/tool-calling-benchmark.test.ts`
- `packages/ai/src/tools/`

---

## 四、优先级与时间线

```
Week 1:   Task 1 (文档修复) + Task 2 (场景化描述) + Task 6 (Schema Diff)
Week 2-3: Task 4a (Scene3D 证据链) + Task 3 (类型单源)
Week 3-4: Task 4b (Blocker 解除) + Task 5 (表达式扩展开始)
Week 4-5: Task 7 (Playground) + Task 8 (基准测试)
```

---

## 五、验证策略

| 验证项 | 方法 | 通过标准 |
|--------|------|----------|
| 文档一致性 | schema-sync 测试 | 文档工具数 = 注册工具数 |
| AI 调用准确率 | 基准测试集 | 工具选择准确率 ≥ 90% |
| Schema-代码同步 | 编译时双向断言 + CI | 零漂移，`pnpm check` 全绿 |
| SceneView3D 解锁 | `@quality` gate | 真实渲染 visual evidence 通过 |
| 开发者体验 | Playground 可用性 | 新用户 5 分钟内完成首个 MapSpec |

---

## 六、风险与注意事项

1. **SceneView3D 的 Three.js 依赖风险**：Three.js 版本更新可能影响适配器稳定性，需锁定兼容版本
2. **表达式扩展的向后兼容**：新运算符不能改变现有表达式的求值语义
3. **MCP 协议演进**：MCP 已捐赠给 Linux 基金会，2026 新增了 Streamable HTTP/OAuth 等能力，需评估是否升级 SDK 版本
4. **工具数量与上下文质量的反比**：Anthropic 实践表明保持工具精简更重要，当前 14 工具已接近上限，新增需审慎评估
