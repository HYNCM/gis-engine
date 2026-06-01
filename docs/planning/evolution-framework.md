---
agent: coordinator
period: 2026-W22
generated_at: 2026-05-30T00:00:00Z
repo_revision: "unknown"
inputs:
  - AGENTS.md
  - docs/planning/task-burndown.md
  - docs/planning/dependency-graph.md
  - docs/planning/sprint-2026-W23-ai-map-app-generation.md
  - docs/planning/sprint-2026-W23-generation-quality-hardening.md
  - scripts/agent-runner.mjs
owner: "@coordinator"
decision_level: advisory
---

# Evolution Framework: Self-Evolving Agent Ecosystem

GIS Engine 的多智能体系统不仅管理产品迭代，其自身也是一个需要持续进化的产品。
本框架定义智能体系统如何通过反馈循环、度量收集、规则自校准和知识积累实现
自我进化。

## 核心原则

1. **系统即产品**：多智能体协作框架本身是可度量、可优化、可版本化的产品。
2. **数据驱动进化**：每个 sprint 的执行数据反馈到系统中，驱动规则、权重、
   职责的调整。
3. **渐进式自校准**：不追求一次性完美，而是通过每周小步调整逼近最优。
4. **可回滚变更**：每次规则调整记录在进化账本中，支持回滚和 A/B 对比。
5. **人机协作决策**：度量收集和模式识别自动化，但结构性变更保留人工审批。

---

## 进化维度

系统从六个维度持续度量自身并自我改进。

### D1：估算准确度

| 指标 | 计算方式 | 周期 |
| --- | --- | --- |
| 偏差率 | `abs(estimated_hours - actual_hours) / estimated_hours` | 每任务 |
| 按复杂度分组的平均偏差 | `avg(deviation_ratio) GROUP BY complexity` | 每月 |
| 按 owner 分组的平均偏差 | `avg(deviation_ratio) GROUP BY owner` | 每月 |
| 趋势方向 | 最近 4 周偏差率的移动平均斜率 | 每周 |

**自校准规则**：

- 若某 owner 的 S 任务连续 3 次偏差率 > 0.5，上调其 S 估算基准 1.5×。
- 若某 complexity 级别的偏差率连续 4 周下降，锁定当前估算基准为"已校准"。
- 首次出现的 complexity + owner 组合使用全局均值作为先验。

### D2：瓶颈检测

| 指标 | 计算方式 | 周期 |
| --- | --- | --- |
| 依赖等待时间 | `downstream.start - upstream.end`（仅关键路径） | 每任务 |
| 瓶颈复发率 | 同一依赖链路上连续 2+ sprint 出现等待 > 24h | 每月 |
| 关键路径占比 | `critical_path_tasks / total_tasks` | 每 sprint |

**自校准规则**：

- 若某依赖链路的等待时间连续 2 个 sprint > 48h，自动发出
  "pre-freeze 上游" 建议（将 schema/contract 任务提前一个 sprint）。
- 若某 agent 成为 3+ 个任务的单一阻塞点，建议拆分该 agent 的职责或增加
  并行度。
- 关键路径占比 > 60% 时触发风险告警，建议减少串行依赖。

### D3：质量趋势

| 指标 | 计算方式 | 周期 |
| --- | --- | --- |
| 门禁首次通过率 | `passes_on_first_run / total_gate_runs` | 每 sprint |
| 按门禁类别分组的失败率 | `failures GROUP BY gate_category` | 每月 |
| 返工率 | 同一任务经历 review → rework 循环的次数 | 每任务 |
| 诊断码覆盖率 | `diagnostic_code_count / error_path_count` | 每月 |

**自校准规则**：

- 若某门禁类别（如 schema-sync）失败率 > 30%，自动建议添加 pre-commit hook。
- 若返工率连续上升 3 周，触发 process review：检查 review 标准是否清晰。
- 诊断码覆盖率 < 80% 时阻止 release。

### D4：知识积累

| 指标 | 计算方式 | 周期 |
| --- | --- | --- |
| 模式复用次数 | 同一 design_pattern 被引用次数 | 累计 |
| 陷阱避免次数 | pitfall 条目被标记 "avoided" 的次数 | 累计 |
| 模式库增长率 | 新增模式 / sprint | 每月 |

**自校准规则**：

- 被复用 3+ 次的模式自动提升为 "verified pattern"，在任务模板中预填。
- 6 个月未复用的模式标记为 "deprecated"，但仍保留供参考。
- 每个 sprint 至少提取 1 个新模式或陷阱。

### D5：动态职责分配

| 指标 | 计算方式 | 周期 |
| --- | --- | --- |
| 各 agent 任务负载占比 | `agent_tasks / total_tasks` | 每 sprint |
| 产品阶段对应的负载分布 | 对比实际分布 vs 阶段预期分布 | 每阶段转换 |
| 跨 agent 协作密度 | agent A 和 B 出现在同一任务依赖链中的频率 | 每月 |

**产品阶段与预期负载分布**：

| 阶段 | engine-agent | ai-agent | adapter-agent | qa-agent | docs-agent |
| --- | --- | --- | --- | --- | --- |
| v0.1 alpha（合同奠基） | 35% | 25% | 15% | 10% | 15% |
| v0.2 beta（能力扩展） | 25% | 30% | 20% | 15% | 10% |
| v0.3-v0.9（场景完善） | 15% | 20% | 30% | 25% | 10% |
| v1.0（稳定发布） | 10% | 15% | 20% | 35% | 20% |

**自校准规则**：

- 每次 product-strategist 确认阶段晋升后，自动触发职责重分配审查。
- 若实际负载偏离预期 > 20%，coordinator 评估是否需要调整阶段定义或
  手工干预。
- 新出现的跨 agent 协作模式（高频共现）可建议合并或新建 agent。

### D6：决策权重自校准

产品优先级公式的权重系数随历史结果反馈而调整：

```txt
priority =
  competitor_threat * w1 +
  ai_operability_gain * w2 +
  user_value * w3 +
  technical_debt_reduction * w4 -
  delivery_risk * w5
```

**当前权重**（v0.2 基准）：

| 系数 | 值 | 含义 |
| --- | --- | --- |
| w1 | 0.35 | 竞争者威胁 |
| w2 | 0.30 | AI 可操作性增益 |
| w3 | 0.20 | 用户价值 |
| w4 | 0.10 | 技术债削减 |
| w5 | 0.05 | 交付风险惩罚 |

**自校准规则**：

- 每月回顾：对比被高优先级执行的任务的实际影响 vs 预期影响。
- 若某维度的预测准确率 < 50%（预期高影响但实际低影响），下调该权重 0.05。
- 若某维度的预测准确率 > 80%，上调该权重 0.05（上限为总和约束）。
- 权重调整需 coordinator 审批，记录在进化账本中。
- 禁止单次调整幅度 > 0.10。

---

## 反馈循环

系统通过三层反馈循环实现持续进化：

### L1：周级反馈（操作层）

```
Sprint 执行 → 度量收集（evolution-collector）→ 进化账本追加 → 异常告警
     ↑                                                          |
     └──────────── 下周 sprint 规划参考 ───────────────────────┘
```

- 自动运行，不需要人工干预。
- 产出：`docs/planning/evolution-ledger.md` 的周条目。
- 仅当检测到异常（偏差率突增、瓶颈复发）时触发告警。

### L2：月级反馈（策略层）

```
月度度量聚合 → 趋势分析 → 规则调整建议 → coordinator 审批 → 应用新规则
      ↑                                                          |
      └────────── 下月 sprint 使用校准后的规则 ──────────────────┘
```

- 半自动：自动生成调整建议，coordinator 审批后应用。
- 产出：进化账本中的月度趋势报告 + 规则变更记录。
- 涉及：估算基准调整、权重微调、门禁阈值调整。

### L3：阶段反馈（结构层）

```
产品阶段晋升 → 职责分布审查 → 框架结构建议 → coordinator + product-strategist 联合审批
      ↑                                                                    |
      └────────── 新阶段 agent 职责 + 执行策略 ───────────────────────────┘
```

- 人工触发 + 自动分析。
- 产出：进化账本中的阶段转换记录 + AGENTS.md 更新建议。
- 涉及：agent 职责重分配、新 agent 创建/合并、协作模式变更。

---

## 进化治理

### 角色：evolution-guardian

`evolution-guardian` 不是新增的独立 agent，而是 `coordinator` 的进化职责子集。
Coordinator 在周规划之外，每月执行一次进化审查。

**进化审查清单**：

1. 收集过去 4 周的 D1-D6 度量。
2. 生成趋势报告和调整建议。
3. 对比本月与上月的关键指标。
4. 标记需人工决策的结构性变更。
5. 更新进化账本。

### 变更权限

| 变更类型 | 自动/人工 | 审批者 | 回滚方式 |
| --- | --- | --- | --- |
| 估算基准微调（< 2×） | 自动 | 无需审批 | 自动回滚（连续 4 周不改善） |
| 门禁阈值调整 | 自动建议 | coordinator | 手动回滚 |
| 权重微调（< 0.05） | 自动建议 | coordinator | 手动回滚 |
| 职责重分配 | 自动建议 | coordinator + product-strategist | 手动回滚 |
| Agent 创建/合并/删除 | 人工提案 | coordinator + product-strategist | Git revert |
| AGENTS.md 结构性修改 | 人工提案 | coordinator | Git revert |

### 安全边界

以下内容**不可自动修改**：

- Repository Rules（schema-first, command-only mutation 等）
- 门禁的核心语义（不能把 snapshot 门禁降级为 advisory）
- MCP 工具名称和契约
- Resource policy 的安全边界
- 产品阶段晋升决策（Go/No-go 仍需 quality-guardian + coordinator 人工判定）

---

## SLA 与降级规则

### SLA 定义

- 周期性 agent 的自动化机生成报告应在触发后 4 小时内完成，并在 24 小时内可用于人工补全。
- 关键 gate 或 coordinator 收敛工作失败时，应在 30 分钟内自动重试一次。
- 任何 `quality-guardian` 或 `code-reviewer` 的 blocking gate 失败都必须被保留为阻断事件，不得自动降级。
- `evolution-guardian` 和 `task-distributor` 的度量/规划 artifact 应在 weekly workflow 执行后发生一次单写入者提交。

### 降级规则

- `snapshot:visual` 可在 CI 环境中检测到浏览器、GPU 或 WebGL 不可用时降级为 skipped，并记录降级原因。
- 文档审计、竞争情报、技术债务报告和依赖图等可生成 placeholder template 继续流水线，但必须显式标记为 automation-generated template。
- 非阻断任务的失败应触发告警与 artifact 归档，而不是直接阻断整个 workflow。

### 自动故障恢复

- 工作流关键命令应支持有限重试，针对网络、依赖安装、浏览器下载等短暂失败自动回退一次。
- 进化收集或一个 agent 步骤失败时，workflow 应保留可用 artifact 并通过 warning 注释告知后续人工复核。
- `agent-runner` 全局运行锁出现 stale lock 时应自动清理，并将该故障视为可恢复的调度问题。

---

## 知识积累系统

### 模式库

从已完成的任务中提取可复用的设计模式，存储在进化账本的模式库章节。

**模式模板**：

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
  dry-run/replay/rollback 三态支持。
applies_when: "需要新增 MapCommand 类型时"
pitfalls:
  - "不要忘记在 MapCommand 联合类型中注册新命令"
  - "dry-run 必须返回与 execute 相同的 result schema 结构"
```

### 陷阱库

从返工和门禁失败中提取常见陷阱：

```yaml
pitfall_id: PIT-001
name: "schema-sync drift"
observed_in: TASK-2026W22-AH-001
frequency: 3
category: schema
description: >
  TypeBox schema 更新后忘记运行 pnpm build:schema，导致 JSON Schema 与
  TypeScript 类型不同步。
prevention: "pre-commit hook 或 CI 中强制运行 build:schema"
detection: "pnpm test:schema-sync 失败"
```

### 应用方式

- 新任务创建时，task-distributor 自动推荐匹配的模式和陷阱。
- Code-reviewer 审查时检查是否忽略了已知陷阱。
- 模式被复用 3 次后自动标记为 verified。

---

## 与现有框架的关系

本进化框架是现有 AGENTS.md 多智能体系统的**元层**，不替代任何现有 agent 的职责：

```
┌─────────────────────────────────────────────────────┐
│              Evolution Ecosystem (Meta)              │
│  D1-D6 度量 · 反馈循环 · 自校准 · 知识积累         │
└──────────────────────┬──────────────────────────────┘
                       │ 度量收集 & 规则调整
                       ▼
┌─────────────────────────────────────────────────────┐
│        Governance Layer (现有，不变)                 │
│  coordinator · competitive-intel · code-reviewer    │
│  product-strategist · task-distributor · quality-guardian │
└──────────────────────┬──────────────────────────────┘
                       │ 任务分配 & 门禁
                       ▼
┌─────────────────────────────────────────────────────┐
│        Execution Layer (现有，不变)                  │
│  engine-agent · ai-agent · adapter-agent            │
│  qa-agent · docs-agent                              │
└─────────────────────────────────────────────────────┘
```

进化框架通过**度量 → 分析 → 建议 → 调整**循环，驱动治理层和执行层的持续优化，
但不直接干预它们的日常运行。

---

## 启动清单

- [x] `docs/planning/evolution-framework.md` — 本框架文档
- [x] `docs/planning/evolution-ledger.md` — 进化账本
- [x] `scripts/evolution-collector.mjs` — 度量收集脚本
- [x] `scripts/agent-runner.mjs` — 注册 evolution-guardian 审查草稿输出
- [x] `AGENTS.md` — 新增 Evolution Ecosystem 章节
- [x] `.github/workflows/agent-weekly.yml` — 新增 evolution 收集 job
- [x] `docs/planning/task-burndown.md` — 新增 evolution 跟踪字段

---

## 版本历史

| 版本 | 日期 | 变更 |
| --- | --- | --- |
| v1.0 | 2026-05-30 | 初始框架：D1-D6 维度、L1-L3 反馈循环、进化治理、知识积累系统 |
