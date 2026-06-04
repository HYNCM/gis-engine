# Agent Report Templates — 智能体报告标准模板
#
# 每个智能体在生成报告时使用此目录下的对应模板。
# 模板变量使用 {{VARIABLE}} 格式，由 agent-runner 在运行时替换。

## 模板变量

所有模板通用的变量：

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| {{AGENT_NAME}} | 智能体名称 | quality |
| {{AGENT_ROLE}} | 智能体角色描述 | unified design reviewer and deterministic gate keeper |
| {{PERIOD}} | 报告周期 | 2026-05-24, 2026-W22 |
| {{GENERATED_AT}} | 生成时间 ISO 8601 | 2026-05-24T08:00:00Z |
| {{REPO_REVISION}} | 仓库版本 | cef340d |
| {{DECISION_LEVEL}} | 决策级别；agent-runner 自动生成的模板默认为 info，只有记录了失败的 blocking 机器门禁时才可标为 blocking | info, blocking |
| {{MODEL_POLICY_TIER}} | 推荐模型层级；用于调度，不作为证据 | frontier-quality |
| {{REASONING_EFFORT}} | 推荐推理强度；用于调度，不作为证据 | high |
| {{MODEL_POLICY_NOTE}} | 模型路由说明；解释为什么该任务需要对应强度 | Use for blocking merge/release gate decisions |
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

agent-runner 生成的文件是 automation-generated evidence/template，不等同于已完成的 specialist review。报告必须由对应智能体或人工补充实质分析、影响、行动项和置信度后，才能作为 advisory、blocking、merge 或 release 决策依据。`model_policy` 只说明调度时推荐的模型层级和推理强度；它不能替代 dated evidence、测试输出、来源链接或质量门禁。

### 1. 质量报告 (quality)

用途：判定 PR/Release 是否满足 AI 原生标准，并记录 daily gate evidence。

必需章节：
- ## 执行摘要
- ## 检查清单
- ## 发现项（按优先级排序 P0/P1/P2）
- ## 验证结果（门禁输出）
- ## PR Gate / Release Gate
- ## 阻断项列表
- ## SceneView3D 状态
- ## 最终判定 (pass/block/conditional)
- ## Handoff (HOC-N3)

### 2. 产品报告 (product)

用途：每周竞品动向、capability scorecard delta，以及月度路线图输入。

必需章节：
- ## 执行摘要（附 dated evidence）
- ## 新版本发布与源链接
- ## API/Spec 变更威胁分析
- ## Capability Scorecard Delta
- ## 推荐跟进任务
- ## Handoff (HOC-N1)

### 3. 编码证据报告 (builder)

用途：实现完成后的 focus-area evidence，供 quality 审查。

必需章节：
- ## Focus Area
- ## Changed Surface
- ## Test Evidence
- ## Resource / MCP / Docs Impact
- ## Known Limits
- ## Handoff (HOC-N2)

### 4. 编排报告 (orchestrator)

用途：消费 product/quality handoff，生成规划快照、Issue snapshot 和最终优先级。

必需章节：
- ## 当前结论
- ## Inputs Consumed
- ## Handoff Decisions
- ## GitHub Issues Snapshot
- ## Planning Updates
- ## Follow-up Owners

### 5. 文档报告 (docs)

用途：文档一致性和完整性检查。

必需章节：
- ## 结论
- ## 已协调项
- ## 当前状态
- ## 待观察项
- ## 交叉引用完整性

### 6. 机器辅助产物

用途：辅助 agent 判断，不可单独作为 advisory/blocking 决策。

产物：
- `docs/planning/handoff-ledger.json`
- `docs/planning/AGENT_HEALTH_DASHBOARD.md`
- `docs/planning/issues-snapshot.md`
- PR `Path-aware Gate Plan` summary
