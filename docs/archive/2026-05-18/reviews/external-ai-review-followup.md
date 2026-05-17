# 外部 AI 评审跟进

## 背景

外部 AI 对当前 5 份文档提出了软件工程评审意见。总体判断是：方向正确，但工程 contract 级别细节不足，需要把 MVP、schema/codegen、命令、诊断、adapter、snapshot、CI、迁移和审计策略落到可执行标准。

本文件记录检查结果和已采纳优化。

## 检查结论

| 评审问题 | 当前状态 | 处理结果 |
| --- | --- | --- |
| 范围管理不足 | 原文有 v0/v1/v2，但 v0.1 完成条件不够可验收 | 新增 [v0.1 MVP 验收标准](../../../engineering/v0.1-mvp-acceptance.md) |
| 包拆分时机不明确 | 原文建议只公开两包，但缺少发布边界 | 在 v0.1 验收文档中固定 `engine` 与 `ai` 依赖方向 |
| schema 与类型同步策略缺失 | 原文只说同步，没有工具路线 | 在 [Contracts and Interfaces](../../../spec/contracts-and-interfaces.md) 中指定 TypeBox + Ajv |
| 命令模型细节欠缺 | 原文有 `CommandResult`，缺事务和 patch 语义 | 新增 command base、atomic/best-effort、RFC 6902 patch、baseRevision |
| 诊断与修复模型不规范 | 原文有字段，没有 code 体系 | 新增 diagnostic namespace 和 `SuggestedFix` contract |
| renderer adapter 接口模糊 | 原文只有职责描述 | 新增 `RendererAdapter` interface 和 capability report |
| snapshot 验证细节不足 | 原文只有能力描述 | 新增 snapshot options、默认像素阈值和 harness 流程 |
| expression 子集风险 | 原文列出子集，缺类型规则 | 新增 expression grammar 和 type validation rule |
| 示例与数据复现不足 | 原文有示例方向，缺 fixture 结构 | 新增 examples 和 tests fixtures 目录约定 |
| 测试与 CI 未落地 | 原文是测试计划 | 新增 [CI 与测试策略](../../../engineering/ci-test-strategy.md) |
| 迁移与版本管理未细化 | 原文只说 version | 新增 migration contract |
| engine 与 ai 边界未固化 | 原文有方向 | 新增包依赖方向和 tool contract tests |
| README 第一屏缺失 | 仓库无 README | 新增根目录 [README](../../../../README.md) |
| destroy 资源释放测试不足 | 原文提到释放 | 新增 resource release tests |
| 审计与溯源不足 | 原文提 trace/audit | 新增 command audit fields 和 trace contract |
| 二次评审要求实现级细化 | 原文已有 contract，但缺脚本位置、伪代码、baseline、policy | 新增 [implementation-playbook.md](../../../engineering/implementation-playbook.md) |

## 采纳后的工程标准

### v0.1 必须可验收

v0.1 不再只是一组愿景，而是一组 required gates：

- schema sync。
- command replay。
- diagnostics code coverage。
- adapter contract tests。
- snapshot regression。
- AI tool contract tests。
- resource release tests。
- release 前 perf smoke。

### TypeBox + Ajv 作为 schema 路线

采纳原因：

- TypeScript-first 项目里能保持开发体验。
- TypeBox schema 本身接近 JSON Schema。
- `Static<typeof Schema>` 减少类型和 schema 分叉。
- Ajv 能作为 runtime validator 和 CI validator。

schema build、schema-sync 和 fixture 校验的实施目录已在 [implementation-playbook.md](../../../engineering/implementation-playbook.md) 中固定。

### RFC 6902 JSON Patch 作为 patch 格式

采纳原因：

- 标准化。
- 易于审计。
- 适合 `changedPaths`、rollback 和 command replay。
- AI tools 可以稳定生成和解释。

新增实施级约束：

- v0.1 冲突默认 reject，不自动 retry 或 three-way merge。
- JSON Patch 工具必须生成 `inversePatch`，并稳定排序 `changedPaths`。
- snapshot 分为 health check 和 baseline diff。
- 默认 URL policy 只允许相对路径、localhost/127.0.0.1 和显式配置 host。
- `SuggestedFix` 自动应用默认关闭，必须经 `FixPolicy`。

### AI 层不能绕过公开协议

固定规则：

- `@gis-engine/engine` 不依赖 `@gis-engine/ai`。
- MCP tools 只调用 schema、validator、commands、snapshot、diagnostics。
- tool 不访问 renderer private state。

### 2D/3D 仍分阶段

外部评审强调 v0 范围风险，因此继续保持：

- v0.1 稳定 2D。
- v0.2 扩展 2.5D。
- v1 引入 SceneView3D 和 3D Tiles adapter。
- 3D 字段进入 `extensions`，不污染核心 `MapSpec`。

## 剩余待实施事项

这些不是文档问题，而是后续代码实现任务：

- 初始化 pnpm workspace。
- 创建 `packages/engine` 和 `packages/ai`。
- 引入 TypeBox 和 Ajv。
- 生成第一版 `MapSpec` schema。
- 建立 command apply 和 JSON Patch 工具。
- 建立 Playwright snapshot harness。
- 准备 GeoJSON、raster、PMTiles fixtures。
- 建立 CI。
- 实现 MapLibre adapter contract。

## 结论

外部 AI 评审指出的问题成立。已将其转化为工程 contract、MVP gate 和 CI 策略。后续实现应以这些文档为验收标准，而不是继续扩大地图功能范围。
