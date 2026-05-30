---
agent: coordinator
period: 2026-W22
generated_at: 2026-05-30T00:00:00Z
repo_revision: "unknown"
inputs:
  - docs/planning/evolution-framework.md
owner: "@coordinator (evolution-guardian)"
decision_level: advisory
---

# Evolution Ledger

GIS Engine 多智能体系统的自我进化记录。每周追加度量快照，每月生成趋势分析和
规则调整建议，每产品阶段记录职责重分配。

> **写入规则**：本文件由 `@coordinator`（evolution-guardian 职责）单写。
> 周条目由 `scripts/evolution-collector.mjs` 自动生成模板，coordinator 审核后
> 追加。月趋势和阶段记录由 coordinator 手动编写。
> `scripts/agent-runner.mjs evolution-guardian` 只生成独立审查草稿，不直接覆盖
> 本账本。

---

## 当前基准（v0.2-beta，2026-W22 确立）

### 估算基准

| Complexity | 默认小时 | 校准状态 |
| --- | --- | --- |
| S | 4 | 未校准（样本不足） |
| M | 12 | 未校准（样本不足） |
| L | 24 | 未校准（样本不足） |
| XL | 40 | 未校准（样本不足） |

### 决策权重

| 系数 | 值 | 校准状态 |
| --- | --- | --- |
| w1 (competitor_threat) | 0.35 | 基准 |
| w2 (ai_operability_gain) | 0.30 | 基准 |
| w3 (user_value) | 0.20 | 基准 |
| w4 (technical_debt_reduction) | 0.10 | 基准 |
| w5 (delivery_risk) | 0.05 | 基准 |

### 门禁阈值

| 门禁 | 当前阈值 | 校准状态 |
| --- | --- | --- |
| schema-sync 首次通过率 | > 80% | 基准 |
| visual-snapshot 首次通过率 | > 70% | 基准 |
| 返工率上限 | < 2 次/任务 | 基准 |
| 诊断码覆盖率 | > 80% | 基准 |

### 产品阶段

| 属性 | 值 |
| --- | --- |
| 当前阶段 | v0.2-beta |
| 阶段起始 | 2026-05-18 |
| 预期阶段分布 | engine 25%, ai 30%, adapter 20%, qa 15%, docs 10% |

---

## 周度量快照

### 2026-W22（2026-05-25 ~ 2026-05-31）

> ⚠️ 初始周，样本量有限。后续周的度量将与本基准对比。

#### D1：估算准确度

| 任务 | Complexity | Estimated | Actual | 偏差率 |
| --- | --- | --- | --- | --- |
| TASK-2026W22-CSI-001 | S | 4h | ? | ? |
| TASK-2026W22-CSI-002 | S | 4h | ? | ? |
| TASK-2026W22-CSI-003 | M | 12h | ? | ? |
| TASK-2026W22-CSI-004 | S | 4h | ? | ? |
| TASK-2026W22-CSI-005 | S | 4h | ? | ? |
| TASK-2026W22-CSI-006 | S | 4h | ? | ? |
| TASK-2026W22-AH-001 | S | 4h | ? | ? |
| TASK-2026W22-AH-002 | S | 4h | ? | ? |
| TASK-2026W22-AH-003 | S | 4h | ? | ? |
| TASK-2026W22-AH-004 | S | 4h | ? | ? |
| TASK-2026W22-AH-005 | S | 4h | ? | ? |

> **注**：W22 任务在初始框架建立前已完成，暂无实际工时数据。从 W23 开始收集。

#### D2：瓶颈检测

尚无足够数据。依赖等待时间从 W23 开始追踪。

#### D3：质量趋势

待第一个完整 sprint 数据后填充。

#### D4：知识积累

**新模式**（初始提取）：

| ID | 名称 | 来源 | 类别 |
| --- | --- | --- | --- |
| PAT-001 | MapGenerationCommandSkeleton | TASK-2026W23-NLA-002 | command-schema |
| PAT-002 | SceneView3D adapter-local evidence | TASK-2026W22-CSI-003 | adapter-evidence |
| PAT-003 | MCP orchestration composition | TASK-2026W23-NLA-003 | mcp-contract |

**新陷阱**（初始提取）：

| ID | 名称 | 来源 | 频率 | 类别 |
| --- | --- | --- | --- | --- |
| PIT-001 | schema-sync drift | W22 经验 | 3+ | schema |
| PIT-002 | stable runtime premature promotion | SRC-006 No-go | 2 | product-decision |
| PIT-003 | missing resource-policy check | SRC-005 | 1 | security |

#### D5：动态职责分布

W23 实际分布（来自 sprint-2026-W23-ai-map-app-generation）：

| Agent | 任务数 | 实际占比 | v0.2 预期 | 偏差 |
| --- | --- | --- | --- | --- |
| coordinator | 1 | 12.5% | — | — |
| engine-agent | 2 | 25.0% | 25% | 0 |
| ai-agent | 2 | 25.0% | 30% | -5% |
| adapter-agent | 1 | 12.5% | 20% | -7.5% |
| qa-agent | 1 | 12.5% | 15% | -2.5% |
| docs-agent | 1 | 12.5% | 10% | +2.5% |

> **分析**：adapter-agent 负载偏低（W23 聚焦 AI 生成而非 3D），符合预期。
> 无需调整。

#### D6：决策权重

基准周，无调整。

---

## 月度趋势报告

> 第一个月度报告将在 2026-06 月末生成（需 4+ 周数据）。

---

## 规则变更日志

> 尚无变更。初始基准代表 v0.2-beta 的默认规则集。

---

## 模式库

### Verified Patterns（复用 ≥ 3 次）

> 暂无。模式需要积累复用次数。

### Candidate Patterns（复用 1-2 次）

#### PAT-001：MapGenerationCommandSkeleton

```yaml
pattern_id: PAT-001
name: "MapGenerationCommandSkeleton"
extracted_from: TASK-2026W23-NLA-002
date: 2026-05-29
category: command-schema
reuse_count: 0
verified: false
description: >
  生成类 MapCommand 的 TypeBox schema 骨架：request/result 双 schema +
  dry-run/replay/rollback 三态支持。适用于任何将自然语言输入转换为
  MapSpec 变更的命令设计。
applies_when: "需要新增 MapCommand 类型来处理 AI 生成的 spec 变更时"
template_hint: >
  1. 定义 GenerationRequest = Type.Object({ prompt, context? })
  2. 定义 GenerationResult = Type.Object({ commands, diagnostics })
  3. 在 MapCommand 联合类型中注册
  4. 实现 applyCommands 中的 dry-run 路径
pitfalls:
  - "PIT-001: 修改 schema 后运行 pnpm build:schema"
  - "确保 dry-run 和 execute 使用相同的 result schema 结构"
```

#### PAT-002：SceneView3D adapter-local evidence

```yaml
pattern_id: PAT-002
name: "SceneView3D adapter-local evidence"
extracted_from: TASK-2026W22-CSI-003
date: 2026-05-25
category: adapter-evidence
reuse_count: 1
verified: false
description: >
  渲染器适配器的能力证据通过 adapter-local API 暴露（load/snapshot/query），
  不将 Three.js 依赖泄漏到 core 包。适用于任何新增渲染器后端的证据收集。
applies_when: "新增渲染器适配器或扩展现有适配器的能力证明"
pitfalls:
  - "PIT-002: 不要在证据不足时声称 stable runtime"
  - "PIT-003: 任何外部资源加载需经过 resource-policy 检查"
```

#### PAT-003：MCP orchestration composition

```yaml
pattern_id: PAT-003
name: "MCP orchestration composition"
extracted_from: TASK-2026W23-NLA-003
date: 2026-05-29
category: mcp-contract
reuse_count: 0
verified: false
description: >
  通过组合现有 MCP 工具（validate_spec + apply_commands + export_spec +
  snapshot_spec）实现复杂 AI 工作流，而不是为每个新能力注册独立 tool alias。
  保持 inputSchema 和 outputSchema 的向后兼容。
applies_when: "需要为 AI 暴露新的组合能力但不希望增加 MCP tool 数量"
pitfalls:
  - "不要发明新的 tool name，始终复用现有 7 个"
  - "每个 tool 的输出 schema 必须 TypeBox 可序列化"
```

---

## 陷阱库

#### PIT-001：schema-sync drift

```yaml
pitfall_id: PIT-001
name: "schema-sync drift"
observed_in: W22 automation hardening
frequency: 3
category: schema
severity: blocking
description: >
  TypeBox schema 更新后忘记运行 pnpm build:schema，导致 JSON Schema 与
  TypeScript 类型定义不同步。CI 中的 schema-sync 测试可检测此问题，但
  开发者常在本地提交前遗漏。
prevention: "pre-commit hook 运行 pnpm build:schema && pnpm test:schema-sync"
detection: "pnpm test:schema-sync 返回非零"
fix: "运行 pnpm build:schema，检查生成的 JSON Schema diff 是否符合预期"
```

#### PIT-002：stable runtime premature promotion

```yaml
pitfall_id: PIT-002
name: "stable runtime premature promotion"
observed_in: SRC-006 No-go decision
frequency: 2
category: product-decision
severity: blocking
description: >
  在证据不足（只有 adapter-local test、无真实渲染器 visual snapshot、
  无 resource-policy 全量检查）时试图将功能从 alpha 提升为 stable。
prevention: "参考 SceneView3D renderer evidence rules 中的升级条件清单"
detection: "quality-guardian 的 stable runtime gate 检查"
fix: "完成 SRC-001 ~ SRC-006 证据链后再申请升级"
```

#### PIT-003：missing resource-policy check

```yaml
pitfall_id: PIT-003
name: "missing resource-policy check"
observed_in: SRC-005 resource release gate
frequency: 1
category: security
severity: blocking
description: >
  添加新的 URL、tile、worker、或外部资源引用时，忘记更新 resource-policy
  测试和文档。
prevention: "在 task 的 finish gates 中显式列出 resource-policy 检查"
detection: "code-reviewer 的 security 清单 + pnpm test:resources"
fix: "更新 packages/engine/src/spec/resource-policy.ts 和对应测试"
```

---

## 版本历史

| 版本 | 日期 | 变更 |
| --- | --- | --- |
| v1.0 | 2026-05-30 | 初始账本：W22 基准、初始模式库（3 patterns）、初始陷阱库（3 pitfalls） |
