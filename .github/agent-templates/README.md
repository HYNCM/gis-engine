# Agent Report Templates — 智能体报告标准模板
#
# 每个智能体在生成报告时使用此目录下的对应模板。
# 模板变量使用 {{VARIABLE}} 格式，由 agent-runner 在运行时替换。

## 模板变量

所有模板通用的变量：

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| {{AGENT_NAME}} | 智能体名称 | code-reviewer |
| {{AGENT_ROLE}} | 智能体角色描述 | daily diff and PR auditor |
| {{PERIOD}} | 报告周期 | 2026-05-24, 2026-W22 |
| {{GENERATED_AT}} | 生成时间 ISO 8601 | 2026-05-24T08:00:00Z |
| {{REPO_REVISION}} | 仓库版本 | cef340d |
| {{DECISION_LEVEL}} | 决策级别 | info, advisory, blocking, emergency |
| {{GATE_RESULTS}} | 门禁运行结果 | 见下方格式 |
| {{TIMESTAMP}} | Unix 时间戳 | 1716537600 |

## 门禁结果格式

```
| gate | status | output |
| --- | --- | --- |
| pnpm build:schema | passed | ... |
| pnpm check | failed | ... |
```

## 报告类型

### 1. 每日审计报告 (code-reviewer)

用途：审查最近 24 小时代码变更。

必需章节：
- ## 执行摘要
- ## 检查清单
- ## 发现项（按优先级排序 P0/P1/P2）
- ## 验证结果（门禁输出）
- ## 下游交接

### 2. 质量门禁报告 (quality-guardian)

用途：判定 PR/Release 是否满足 AI 原生标准。

必需章节：
- ## 门禁结果表
- ## PR Gate / Release Gate
- ## 阻断项列表
- ## SceneView3D 状态
- ## 最终判定 (pass/block/conditional)

### 3. 竞品情报报告 (competitive-intel)

用途：每周竞品动向和 scorecard 更新。

必需章节：
- ## 执行摘要（附 dated evidence）
- ## 新版本发布与源链接
- ## API/Spec 变更威胁分析
- ## Capability Scorecard Delta
- ## 推荐跟进任务

### 4. 产品路线图 (product-strategist)

用途：月度优先级排序。

必需章节：
- ## 结论
- ## 路线总览表
- ## 优先级排序（附评分公式计算）
- ## 本月行动
- ## Feature Spec 建议

### 5. 任务燃尽图 (task-distributor)

用途：Sprint 任务分解和依赖图。

必需章节：
- ## 当前结论
- ## Sprint 容量表
- ## 任务表（附 YAML 模板）
- ## 燃尽曲线
- ## 风险控制
- ## 执行快照

### 6. 文档审计报告 (docs-agent)

用途：文档一致性和完整性检查。

必需章节：
- ## 结论
- ## 已协调项
- ## 当前状态
- ## 待观察项
- ## 交叉引用完整性
