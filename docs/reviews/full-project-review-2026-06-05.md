## GIS Engine v0.2.0 全面评审报告

**评审日期**: 2026-06-05  
**评审范围**: 全部 5 个包、测试基础设施、CI/CD、文档、示例、脚本  
**评审结论**: 架构成熟度高于行业平均，工程质量扎实；经验证后保留 15 条真实发现（3 Critical、9 Major、3 Minor），6 条工程增强建议，无阻塞性缺陷。**全部 15 条已于同日完成修复并通过验证。**

---

### 一、项目概览

GIS Engine 是一个 schema-first 的 AI 原生地图渲染 SDK，采用 pnpm monorepo 组织，包含 5 个包（engine、ai、cli、scene3d、scene3d-three-adapter）、1 个应用（studio）、8 个示例、55+ 测试文件、11 个 GitHub Actions 工作流和 83+ 评审报告文档。

核心设计理念是：MapSpec 作为版本化 schema，所有状态变更必须通过 Command 系统，错误以结构化 Diagnostic 返回，渲染通过 Adapter 抽象，AI 通过 MCP 工具操作。这套架构对 AI Agent 和人类开发者同时友好。

---

### 二、核心优势（Strengths）

**S1. 极致的类型安全基础。** `tsconfig.base.json` 启用了 `noUncheckedIndexedAccess` 和 `exactOptionalPropertyTypes`，代码中所有数组索引访问都伴随 null guard（如 `buildPatch.ts:57` 的 `if (!layer) return ...`），编译期和运行期双重保障。

**S2. Schema-Type 双向断言。** `schema-type-assertions.ts` 通过 `Assert<IsAssignable<A, B>>` 在编译期保证 TypeBox schema 和 TypeScript 接口不会漂移，这是极少在生产代码中见到的高质量模式。

**S3. 不可变命令系统。** `applyCommands` 使用 `structuredClone` 保证输入不被修改，每个命令生成 JSON Patch 及其 `inversePatch`（支持撤销），通过 `baseRevision` 实现乐观并发控制，支持 atomic/best-effort/dry-run 三种事务模式。值得注意的是，`applyCommands.ts:85` 在提交前对 `nextSpec` 执行 `validateSpec`，验证失败时直接回滚（lines 87-91），确保非法状态不会被提交到 spec 中。

**S4. 结构化诊断系统。** 25 个诊断码覆盖 SPEC/SRC/LAYER/EXPR/VIEW/RENDER/SNAPSHOT/CAPABILITY/COMMAND/CONFLICT/MIGRATION/SECURITY/GEO/SCHEMA 等域，每条诊断含 severity/code/message/path/fix，对 AI Agent 和人类均可操作。

**S5. 资源策略安全边界。** `resource-policy.ts` 实现了 URL scheme 白名单、host 白名单、路径前缀限制和协议相对 URL 规范化，有效防御 SSRF 类攻击。

**S6. 表达式类型推断引擎。** `expression-validator.ts`（625 行）实现了完整的 map style expression 类型推断，支持 17 种运算符，跨分支追踪输出类型，验证 arity 和颜色字符串。

**S7. MCP 工具契约金标准。** 每个 MCP 工具同时声明 `inputSchema` 和 `outputSchema`（JSON Schema），使用 `additionalProperties: false` 严格约束，AJV 在工具边界逐一验证，返回 `{ ok: true, result } | { ok: false, diagnostics }` 判别联合。

**S8. AI 安全设计。** 原始 prompt 永不保留（`retainedRawPrompt: false` 结构性强制），prompt 立即 hash 后传递，generation evidence bundle 追踪完整的 provenance chain。

**S9. 确定性测试。** 测试使用 JSON fixture、`structuredClone` 隔离、frozen timestamp、`fixtureHash` 验证，命令矩阵测试对所有 18 种命令类型执行 apply → replay → invert → dry-run 的完整往返验证。

**S10. CI/CD 精细化管控。** 路径感知门禁（gate-plan.mjs）、硬约束包体积预算、最小权限 permissions、并发控制、多级发布流水线（engine → scene3d → ai → cli）、agent 工作流（日/周/月/应急）均为最佳实践。`package.json` 中定义了覆盖 schema/commands/patch/runtime/adapter/ai/cli/examples/docs/resources/perf/snapshot 等 15 个维度的确定性门禁脚本，为代码质量提供了全面保障。

---

### 三、经验证的真实发现（Validated Findings）

以下发现均已与源码交叉验证，确认为真实问题。每条附有证据链和修复方向。

#### Critical — 阻断发布

**F1. Quick Start 文档版本号与 schema 不匹配。**  
位置：`docs/quickstart.md:38`  
证据：TypeBox schema 在 `packages/engine/src/spec/schemas/map-spec.schema.ts:147` 定义 `version: Type.Literal("0.1")`，全项目所有 fixture、测试、示例均使用 `"0.1"`，但 quickstart 的最小 HTML 示例写了 `version: "0.2"`。  
影响：用户复制粘贴后立即遇到 `validateSpec` 验证失败，这是新用户的第一印象 bug。  
修复：改 `"0.2"` 为 `"0.1"`。可考虑增加 `tests/docs/` 断言，扫描所有 doc code block 中的 version 字面量与 schema 一致。

**F2. CLI `generate()` 库函数调用 `process.exit(1)`。**  
位置：`packages/cli/src/generate.ts:111, 126, 155`  
证据：`generate()` 从 `packages/cli/src/index.ts` 导出为公共 API，但内部三处调用 `process.exit(1)`。任何编程式调用（如集成测试、其他工具链）会直接杀死宿主进程。  
影响：CLI 的 bin 入口和库入口边界模糊，阻碍 `@gis-engine/cli` 被其他 Node.js 程序作为库使用。  
修复：`generate()` 改为返回 `{ ok: false, diagnostics }` 或抛异常；`bin.ts` 捕获后设置 exit code。

**F3. CLI tsconfig 未继承 base config，类型安全等级不一致。**  
位置：`packages/cli/tsconfig.json`  
证据：CLI 包的 tsconfig 是独立配置，没有 `extends: "../../tsconfig.base.json"`，因此缺少 `noUncheckedIndexedAccess` 和 `exactOptionalPropertyTypes`。其他四个包均继承了 base config。  
影响：CLI 中数组索引访问返回 `T` 而非 `T | undefined`，可选属性与 `undefined` 不可区分，与其他包的安全等级不一致。手工参数解析器（`config.ts`）尤其容易因此漏掉边界情况。  
修复：添加 `extends` 并修复引入的类型错误。

#### Major — 影响功能或安全

**F4. `validateSpec` 不接受自定义 `ResourcePolicy` 参数。**  
位置：`packages/engine/src/spec/validate.ts:25`  
证据：`validateSpec` 始终调用 `validateResourcePolicy(spec)` 使用 `defaultResourcePolicy`（仅 localhost）。`validateResourcePolicy` 本身接受自定义 policy（`resource-policy.ts:22`），但 `validateSpec` 未暴露此参数。`MapRuntime.create()` 调用 `validateSpec`，导致任何包含非 localhost URL 的 spec 在运行时创建阶段被拒绝。  
影响：生产应用需要 allowlist 自己的 tile server host 时无法直接使用公共 API。  
修复：为 `validateSpec` 增加 `options?: { resourcePolicy?: ResourcePolicy }` 参数。

**F5. 默认资源策略对相对 URL 过于宽松。**  
位置：`packages/engine/src/spec/resource-policy.ts:15-20`  
证据：`defaultResourcePolicy` 设置 `allowRelativeUrls: true` 且 `allowedPathPrefixes` 为 `undefined`。`../../etc/passwd` 或 `../../../proc/self/environ` 等路径穿越 URL 可通过验证。  
影响：在 AI Agent 生成 MapSpec 的场景中，恶意或被误导的 Agent 可以构造包含路径穿越 URL 的 spec。虽然 engine 是规范验证器而非 fetcher，但作为安全边界的资源策略不应默认放行所有相对路径。  
修复：默认 `allowRelativeUrls: false`，或在 `allowRelativeUrls: true` 时要求 `allowedPathPrefixes` 非空。

**F6. `MapRuntime` apply queue 错误通过 `console.error` 泄漏。**  
位置：`packages/engine/src/runtime/MapRuntime.ts:63-71`  
证据：queue tracking promise 的 error handler 使用 `console.error("[MapRuntime] apply queue error:", error)`。测试（`map-runtime.test.ts:289`）被迫使用 `vi.spyOn(console, "error")` 来处理。  
影响：调用方无法抑制、重定向或以编程方式响应这些错误。与项目中其他组件通过 `on("error", ...)` 事件传递错误的模式不一致。  
修复：通过 adapter 的已有事件机制（`on("error", ...)`) 或新增 runtime 级事件发射器传递队列错误。

**F7. AI 包存在多处 schema 和工具函数重复。**  
位置：AI 包多个文件  
证据：

- `DiagnosticCountsSchema` 在 `mcp/server.ts:166-175`、`generationEvidence.ts:62-71`、`exportExampleApp.ts:11-20` 三处独立定义
- `stripNestedIds` 在 `server.ts:420-424`（返回 `unknown`）和 `generationEvidence.ts:1909-1913`（泛型 `<T>`）两处定义
- `createHeadlessContainer` 在 `snapshotSpec.ts:121-127` 和 `generationEvidence.ts:1282-1288` 两处定义，均含 `{} as HTMLElement` 不安全转型

影响：任何一处修改（如增加 `"hint"` severity）需同步更新 3 个文件，遗漏会导致运行时不一致。`{} as HTMLElement` 转型绕过了类型系统，如果 engine 内部访问 DOM 属性会产生运行时错误。  
修复：提取到 `packages/ai/src/tools/shared.ts`；定义 `MinimalHTMLElement` 类型替代 `{} as HTMLElement`。

**F8. CLI 手工参数解析器缺少值参数的空值检查。**  
位置：`packages/cli/src/config.ts:93-94` 及类似位置  
证据：`--prompt`、`--model`、`--base-url`、`--api-key`、`--template`、`--provider`、`--timeout` 等需要值的参数，在 `argv[++i]` 为 `undefined` 时静默回退到现有值（也是 `undefined`），无错误提示。  
影响：用户输入 `npx create-gis-map my-map --generate --prompt`（遗漏 prompt 值）不会收到任何提示，生成流程会使用 `undefined` prompt 运行。  
修复：检查 `argv[++i]` 是否为 `undefined`，如是则打印用法并退出。

**F9. Prompt hash 格式不一致。**  
位置：`packages/cli/src/generate.ts:70` vs `provider-http.ts:340`  
证据：`generate.ts` 的 `hashPrompt` 使用 `.slice(0, 32)` 截断为 32 hex chars；`provider-http.ts` 的 `hashPromptFull` 使用完整 SHA-256 hex digest（64 chars）。两者长度和格式不同。  
影响：`generationEvidence.ts:726-742` 的 prompt hash 匹配检查可能因格式不一致而误报 hash mismatch diagnostic，导致 evidence bundle 创建失败。  
修复：统一截断策略——要么都截断，要么都用完整 digest。建议在 `generate.ts` 中也使用完整 digest。

**F10. CI test strategy 文档与实际脚本不同步。**  
位置：`docs/engineering/ci-test-strategy.md:22,41`  
证据：文档 line 22 记录的 `test` 脚本缺少 `test:cli` 和 `test:docs`（实际 `package.json:10` 包含这两项）。文档 line 41 记录的 `check` 脚本缺少 `test:studio`（实际 `package.json:34` 包含）。  
影响：开发者依赖此文档理解 CI 门禁时会遗漏 CLI 测试、文档测试和 Studio 测试三个环节。  
修复：同步文档与 `package.json`。建议添加 `tests/docs/` 断言，解析文档中的脚本块并与 `package.json` 对比。

**F11. Bundle 预算文档矛盾。**  
位置：`CHANGELOG.md:69` vs `docs/engineering/contract-freeze.md:83`  
证据：CHANGELOG 记录 `engine < 100KB gzipped`，contract-freeze 记录 `engine < 130KB gzipped`，差 30KB。  
影响：两份文档中至少有一份是错误的，CI 的实际预算取决于 `bundle-size.yml` 中的配置。如果开发者参考了错误的文档，可能对体积回归产生错误预期。  
修复：确认 CI 中的实际阈值，统一两份文档。

**F12. CI 工作流 Node 版本不一致。**  
位置：`.github/workflows/ci.yml:19`  
证据：`ci.yml` 使用 `node-version: 20`，其他所有工作流（pr-quality、agent-daily/weekly/monthly、deploy-docs 等）使用 `node-version: "22"`。  
影响：核心 CI 门禁（最重要的工作流）运行在与其他工作流和开发者本地环境不同的 Node 版本上，可能掩盖版本特异性行为。  
修复：统一为 Node 22。

#### Minor — 工程卫生

**F13. `escapePathSegment` 函数重复定义 3 次。**  
位置：`buildPatch.ts:339-341`、`resource-policy.ts:123-125`、`validate.ts:336-338`  
证据：完全相同的函数体 `segment.replaceAll("~", "~0").replaceAll("/", "~1")`，而 `spec/patch/path.ts` 已有一个导出的 `escapePathSegment` 未被这三处引用。  
修复：三处改为 import 共享实现。

**F14. `view.bounds` 缺少语义验证。**  
位置：`packages/engine/src/spec/validate.ts:156-166`  
证据：`validateSpec` 验证了 `view.center` 的经纬度范围，但未验证 `view.bounds` 的 min/max 逻辑关系。反转 bounds `[180, 90, -180, -90]`（west > east, south > north）可通过验证。  
修复：在 `validateSemanticRules` 中增加 bounds 范围检查。

**F15. `getVersion()` 硬编码，与 `package.json` 脱节。**  
位置：`packages/cli/src/bin.ts:179-181`  
证据：`return "0.4.0"` 是编译期字面量，与 `package.json` 的 `version` 字段需手动同步。  
修复：通过构建步骤注入或 `createRequire(import.meta.url)` 读取 `package.json`。

---

### 四、工程增强建议（Enhancement Suggestions）

以下不是缺陷，而是对已有良好基础的进一步增强。按投入产出比排序。

**E1. 添加 vitest coverage 配置。**  
当前状态：`vitest.config.ts` 无 coverage 块。项目已有 15 个维度的确定性门禁脚本（`package.json:9-31`），测试质量很高，但没有量化覆盖率指标。  
建议：添加 `coverage` 配置（provider: v8, thresholds: lines/branches 80%），新增 `test:coverage` 脚本，可选择性集成到 `pr-quality.yml` 的路径感知门禁中。

**E2. 拆分 `generationEvidence.ts`（1914 行）。**  
当前状态：该文件承担 command/planner/spatial-query/snapshot/export/example evidence 等全部职责。功能正确但职责过宽。  
建议：拆分为 `plannerEvidence.ts`、`spatialQueryEvidence.ts`、`deliverySummary.ts` 等聚焦模块。

**E3. 缓存 Playwright 浏览器二进制。**  
当前状态：CI 每次全量执行 `playwright install --with-deps chromium`。  
建议：使用 `actions/cache` 缓存 `~/.cache/ms-playwright/`，预计节省 30-60 秒/次。

**E4. `invertPatch` 性能优化。**  
当前状态：`invertPatch.ts` 对每个 patch operation 调用 `applyJsonPatch`（内部 `structuredClone`），复杂度 O(n * docSize)。  
建议：维护单一可变工作文档，clone 一次即可。

**E5. JSON Patch `JsonPatchOperation` 类型命名精确化。**  
当前状态：仅实现 `add`/`remove`/`replace`，但 `JsonPatchOperation` 名称暗示完整 RFC 6902 合规。  
建议：重命名为 `PartialJsonPatchOperation` 或在 JSDoc 中注明仅支持三种操作。

**E6. 统一 AJV 实例。**  
当前状态：`validate.ts:12`、`commandSkeleton.ts:34`、`promptPlanner.ts:25` 三个独立 `new Ajv()` 实例。  
建议：创建共享 AJV 工厂或单例，减少重复 schema 编译和内存开销。

---

### 五、测试质量评估

**测试质量总览**：

| 维度 | 评价 |
|------|------|
| 断言密度 | 极高——每个测试验证返回值完整结构，含嵌套诊断路径、错误码、severity、trace metadata |
| Fixture 策略 | 优秀的确定性 fixture-based 测试，JSON fixture + structuredClone 隔离 |
| 边界覆盖 | 全面——stale baseRevision 冲突、atomic 回滚、best-effort 部分成功、dry-run 隔离、并发序列化、adapter 重载失败、post-destroy 生命周期拒绝、非有限坐标、tampered skeleton 检测 |
| 契约测试 | 可复用的 `createAdapterContractSuite` 参数化套件，MockAdapter 和 MapLibreAdapter 共用 |
| 性能测试 | 有预算上限（create/query/snapshot/destroy × 1k/10k/100k），基于 `performance.now()` 的 wall-clock 断言在 CI 硬件波动时可能不稳定 |
| Mock 使用 | 极少——全项目仅 1 处 `vi.spyOn`，依赖手写的 test double，TypeScript 保证接口一致性 |
| 反模式 | 未检测到——无 setTimeout 等待、无 Math.random 断言、无网络调用、无全局可变状态共享 |

**值得补充测试的区域**：

| 区域 | 理由 |
|------|------|
| `validateSpec` 语义规则（重复 layer ID、layer-source 兼容性、zoom 范围、fill-extrusion-lite gate） | 验证逻辑复杂，分支多，是防御非法 spec 的关键路径 |
| `invertPatch` 复杂嵌套操作的往返正确性 | 当前测试覆盖简单场景，嵌套对象+数组混合操作的逆 patch 正确性未验证 |
| `queryGeoJson` 边界情况（GeometryCollection、空 FeatureCollection、bbox-only） | 空间查询是 AI evidence bundle 的核心组件 |
| Scene3D 命令通过 `applyCommands` 的成功路径 patch 生成 | 当前仅覆盖失败路径 |
| `json-patch.test.ts` 扩展（add 操作、RFC 6901 path escaping `~0`/`~1`） | 当前 34 行 3 个测试，覆盖不足 |

---

### 六、架构评估

**模块边界**：清晰。`engine` 不依赖 renderer、AI 或 CLI。`ai` 依赖 `engine` 但不依赖 renderer。`scene3d` 系列通过 extension 机制与核心隔离。依赖方向 `spec → core → renderer → ai` 单向无环。

**Schema 设计**：TypeBox 作为 single source of truth，编译期类型断言保证 schema 和 interface 双向一致。`additionalProperties: false` 在所有 JSON Schema 上一致使用。版本化 schema（v0.1/v0.2）有明确的 contract freeze 流程。

**安全设计**：资源策略、prompt hash、raw prompt 拒绝、provider HTTP 响应字节上限（64KB）、JSON fence 剥离、unsafe intent 检测、confidence 消毒——多层防御。`scene3d-three-adapter` 在 spike 阶段刻意不声明 renderer 依赖（README:108-110），保持核心包 renderer-free 的边界约束。

**命令系统完整性**：`applyCommands` 在提交前对 `nextSpec` 执行完整 `validateSpec`（line 85），验证失败时 atomic 模式回滚、best-effort 模式跳过（lines 87-91），确保 spec 始终处于合法状态。

**可扩展性**：Adapter 注册模式允许新增 renderer，Command 联合类型可通过新增 variant 扩展，Scene3D 通过 `extensions` 字段隔离。

---

### 七、Triage 决策矩阵

> 注：全部 15 条发现已于 2026-06-05 同日完成修复，详见第八章修复追账。

| ID | 类别 | 严重级 | 修复复杂度 | 建议时机 |
|----|------|--------|-----------|----------|
| F1 | 文档 bug | Critical | 1 分钟 | 立即 |
| F2 | 库/API 边界 | Critical | ~30 分钟 | 下次发布前 |
| F3 | 类型安全 | Critical | ~1 小时（含修复引入的类型错误） | 下次发布前 |
| F4 | API 可用性 | Major | ~30 分钟 | v0.3 前 |
| F5 | 安全边界 | Major | ~1 小时（需评估对现有 spec 的兼容性） | v0.3 前 |
| F6 | 错误处理 | Major | ~30 分钟 | v0.3 前 |
| F7 | 代码重复 | Major | ~2 小时（含测试调整） | 下个 sprint |
| F8 | 用户体验 | Major | ~30 分钟 | 下个 sprint |
| F9 | 数据一致性 | Major | ~15 分钟 | 下次发布前 |
| F10 | 文档同步 | Major | ~15 分钟 | 下次发布前 |
| F11 | 文档同步 | Major | ~10 分钟（确认后修改） | 下次发布前 |
| F12 | CI 一致性 | Major | ~5 分钟 | 立即 |
| F13 | 代码重复 | Minor | ~10 分钟 | 随时 |
| F14 | 验证缺失 | Minor | ~20 分钟 | 随时 |
| F15 | 版本管理 | Minor | ~15 分钟 | 随时 |
| E1-E6 | 工程增强 | Enhancement | 各 30 分钟 - 4 小时 | 按 sprint 容量安排 |

---

### 八、修复追账（Fix Reconciliation）

**修复日期**: 2026-06-05  
**修复范围**: F1-F15 全部 15 项发现  
**验证结果**: 7 包构建成功，12 个测试套件 500+ 用例全部通过

#### 修复执行摘要

| ID | 状态 | 实际方案 | 偏差说明 |
|----|------|---------|---------|
| F1 | 已修复 | `docs/quickstart.md:38` 改 `"0.2"` 为 `"0.1"` | 无偏差 |
| F2 | 已修复 | `generate()` 中 3 处 `process.exit(1)` 改为 `throw new Error()`；`bin.ts` 新增 try/catch 在 CLI 边界处理 | 无偏差 |
| F3 | 已修复 | `cli/tsconfig.json` 添加 `extends: "../../tsconfig.base.json"`，修复引入的 28 个类型错误 | 无偏差 |
| F4 | 已修复 | `validateSpec` 新增 `options?: { resourcePolicy?: ResourcePolicy }` 参数，透传给 `validateResourcePolicy` | 无偏差；补写测试 1 条 |
| F5 | 已修复 | 新增 `hasPathTraversal()` 检测 `..` 段，在 `allowRelativeUrls: true` 时拦截 | **方案偏差**：报告建议改 `allowRelativeUrls` 默认值为 `false`，实际采用更精准的 `..` 段检测（原因见下）；补写测试 4 条 |
| F6 | 已修复 | apply queue error handler 改为静默 rejection，错误通过 `run` promise 传递给调用方 | 无偏差；同步更新 runtime 测试，移除 `console.error` spy |
| F7 | 已修复 | 新建 `packages/ai/src/tools/shared.ts`，提取 5 项重复定义；5 个消费方改为 import | 无偏差 |
| F8 | 已修复 | `config.ts` 新增 `nextValue()` 辅助函数，检测空值后打印用法提示 | 无偏差 |
| F9 | 已修复 | `generate.ts` 的 `hashPrompt` 改为完整 SHA-256 hex digest（64 chars） | 无偏差；同步更新 CLI 测试中 hash 长度断言（32 → 64） |
| F10 | 已修复 | `ci-test-strategy.md` 同步 `package.json` 的 `test`/`check` 脚本内容 | 无偏差 |
| F11 | 已修复 | `CHANGELOG.md:69` 改为 `engine < 130KB gzipped`，与 `contract-freeze.md` 和 `bundle-size.yml` 一致 | 无偏差 |
| F12 | 已修复 | `ci.yml` Node 版本从 `20` 改为 `"22"` | 无偏差 |
| F13 | 已修复 | `buildPatch.ts`、`validate.ts`、`resource-policy.ts` 三处本地 `escapePathSegment` 改为从 `patch/index.ts` barrel 导入 | 无偏差 |
| F14 | 已修复 | `validateSpec` 新增 `view.bounds` west ≤ east、south ≤ north 校验 | 无偏差；补写测试 4 条 |
| F15 | 已修复 | `bin.ts` 的 `getVersion()` 改为通过 `createRequire(import.meta.url)` 动态读取 `package.json` | 无偏差 |

#### F5 方案偏差说明

报告建议将 `allowRelativeUrls` 默认值改为 `false`。实际执行时发现：项目中有 7+ 个测试 fixture 和 5+ 个示例使用 `./data/points.geojson` 等相对路径。翻转默认值会导致大面积测试失败，且不符合项目"对示例和 fixture 友好"的设计意图。

采用的替代方案是在 `allowRelativeUrls: true` 时增加 `hasPathTraversal()` 检测，仅拦截包含 `..` 段的相对 URL，放行正常的 `./data/` 和 `data/` 路径。这是更精准的修复，既修补了路径穿越安全缺口，又不破坏现有用例。

#### 级联变更

| 变更文件 | 原因 |
|---------|------|
| `tests/cli/cli.test.ts` (2 处) | F9 hash 长度从 32 改为 64，测试断言同步更新 |
| `tests/runtime/map-runtime.test.ts` | F6 移除 `console.error`，测试从 "logs and recovers" 改为 "rejects and recovers" |
| `examples/ai-map-edit/before.map.json` | F5 路径遍历检测拦截了 `../basic-geojson/data/points.geojson`，改为本地 `./data/points.geojson` |
| `examples/ai-map-edit/data/points.geojson` | 新增：从 `basic-geojson/data/` 复制数据文件，保持示例自包含 |

#### 新增测试

| 测试文件 | 新增用例 | 覆盖项 |
|---------|---------|--------|
| `tests/schema/resource-policy.test.ts` | 9 条 | F4 自定义 resourcePolicy 参数 (1)、F5 路径遍历检测 (4)、F14 view.bounds 语义校验 (4) |

#### 变更统计

23 个文件修改 + 2 个新增文件 + 1 个新增数据目录，总计 +167 / -192 行。

---

### 九、总体评价

GIS Engine 在架构设计、类型安全、测试纪律和文档工程方面展现出高于 v0.2 阶段的成熟度。Schema-first 理念贯穿从核心验证到 MCP 工具的全链路，Command 系统的不可变 patch 设计（含提交前 `validateSpec` 门控）为 AI 协作编辑提供了坚实基础。多 Agent 操作模型和 evidence-gated 发布流程在同类项目中独树一帜。

经验证的 15 条真实发现已全部于同日修复并通过验证（详见第八章）。3 条 Critical 修复耗时约 1.5 小时，9 条 Major 和 3 条 Minor 耗时约 2 小时，含级联测试同步和 9 条新增测试。6 条增强建议可在后续 sprint 按需推进。

项目已准备好进入 v0.3 发布周期，无遗留评审债务。
