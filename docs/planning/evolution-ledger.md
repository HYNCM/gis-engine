---
agent: orchestrator
period: 2026-W27
generated_at: 2026-06-30T14:00:00Z
repo_revision: "3890290"
inputs:
  - AGENTS.md
  - docs/planning/evolution-framework.md
  - docs/planning/task-burndown.md
  - docs/planning/weekly-digest.md
  - docs/reviews/quality-gate-2026-06-10.md
  - docs/reviews/first-run-acceptance-2026-06-10.md
owner: "@orchestrator (evolution-guardian)"
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

## 当前基准（v1.0-stable，2026-W27 刷新）

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
| 当前阶段 | v1.0-stable |
| 阶段起始 | 2026-06-10 |
| 预期阶段分布 | engine 10%, ai 15%, adapter 20%, qa 35%, docs 20% |

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

### 2026-W24（2026-06-02 ~ 2026-06-08）

> 2026-06-05 reconciliation: the entries below are implementation-time
> ledger values from `4012f51`. They must remain tied to current gate evidence
> before sprint closure. Do not use this section alone as a quality pass.

#### D1：估算准确度

| 任务 | Complexity | Estimated | Actual | 偏差率 |
| --- | --- | --- | --- | --- |
| TASK-2026W24-RCU-001 | M | 12h | 4h | 0.67 |
| TASK-2026W24-RCU-002 | S | 4h | 2h | 0.50 |
| TASK-2026W24-RCU-003 | S | 4h | 2h | 0.50 |
| TASK-2026W24-CNS-001 | M | 12h | 3h | 0.75 |
| TASK-2026W24-CNS-002 | M | 12h | 3h | 0.75 |
| TASK-2026W24-CNS-003 | S | 4h | 2h | 0.50 |
| TASK-2026W24-VPE-001 | S | 4h | 1h | 0.75 |
| TASK-2026W24-VPE-002 | S | 4h | 1h | 0.75 |
| TASK-2026W24-VPE-003 | S | 4h | 1h | 0.75 |

> **分析**：W24 初步估算偏差率偏高（均值 0.66），表明 M 和 S 任务基准可能偏高。
> 是否下调 S/M 基准需要等当前质量门禁和返工数据落账后再决定。

#### D3：质量趋势

| 指标 | 值 |
| --- | --- |
| 门禁首次通过率 | 100% — `pnpm build:schema`, `pnpm check` (525 tests), `pnpm test:docs` all passed on first run at quality acceptance |
| 返工率 | 0 rework cycles during W24 acceptance (formal @quality PASS on first review) |
| 新增测试数 | 77+ W24-focused tests; 525 total across all suites |
| HOC-N3 验收 | `docs/reviews/w24-quality-acceptance-2026-06-05.md` — RCU-001~003, CNS-001~003, VPE-001/003 all PASS |

#### D4：知识积累

**新模式**：

| ID | 名称 | 来源 | 类别 |
| --- | --- | --- | --- |
| PAT-004 | Cloud-native metadata-only contract | TASK-2026W24-CNS-001~003 | schema-policy |
| PAT-005 | Review-console evidence-driven UI | TASK-2026W24-RCU-001 | review-contract |

**新陷阱**：

| ID | 名称 | 来源 | 频率 | 类别 |
| --- | --- | --- | --- | --- |
| PIT-004 | diagnostic code not registered | CNS implementation | 1 | diagnostics |

### 2026-W25（2026-06-09 ~ 2026-06-15）

> v1.0.0 发布周。首次发布 acceptance 通过。

#### D1：估算准确度

| 任务 | Complexity | Estimated | Actual | 偏差率 |
| --- | --- | --- | --- | --- |
| boundary-enforcement regression | M | 12h | 4h | 0.67 |

> **分析**：boundary enforcement 工作延续 W24 的趋势，M 任务偏差率持续偏高（0.67），建议后续下调 M 基准至 8h。

#### D3：质量趋势

| 指标 | 值 |
| --- | --- |
| 门禁首次通过率 | 100% — pnpm build:schema, pnpm check (525+ tests) all passed |
| 返工率 | 0 rework cycles |
| 新增测试数 | 3 (canonical-boundary-regression + workbench-boundary) |
| HOC-N3 验收 | quality-gate-2026-06-10.md PASS |

#### D4：知识积累

**新模式**：

| ID | 名称 | 来源 | 类别 |
| --- | --- | --- | --- |
| PAT-006 | Canonical boundary regression test | W25 boundary enforcement | docs-governance |

**新陷阱**：

| ID | 名称 | 来源 | 频率 | 类别 |
| --- | --- | --- | --- | --- |
| PIT-005 | governance doc staleness post-release | W25-W27 gap | 1 | process |

### 2026-W26（2026-06-16 ~ 2026-06-22）

> 静默周，无主动 agent 运行。changeset 积压持续。

#### D1-D6

无新数据。

### 2026-W27（2026-06-23 ~ 2026-06-29）

> 治理刷新周。消费 19 个 changeset，发布 v1.1.0。

#### D3：质量趋势

| 指标 | 值 |
| --- | --- |
| 门禁首次通过率 | 待 v1.1.0 发布确认 |
| 返工率 | 待确认 |

#### D4：知识积累

**新陷阱**：

| ID | 名称 | 来源 | 频率 | 类别 |
| --- | --- | --- | --- | --- |
| PIT-005 | governance doc staleness post-release | W25-W27 20天gap | 1 | process |

---

## 月度趋势报告

### 2026-06（W22-W27）

> 首个月度报告。覆盖从 v0.2-beta 到 v1.0-stable 再到 v1.1.0 的完整发布周期。

**D1 估算准确度趋势**：
- W22：初始基准，无实际数据
- W24：均值偏差率 0.66（偏高），M/S 任务基准可能过高
- W25：M 任务偏差率 0.67，延续趋势
- **建议**：下调 S 基准至 3h，M 基准至 8h（需 coordinator 审批）

**D3 质量趋势**：
- 门禁首次通过率：W24 100%，W25 100%
- 返工率：W24 0 次，W25 0 次
- 总测试数：525+ → 528+
- **评估**：质量门禁稳定，无返工循环

**D4 知识积累**：
- 新增模式：PAT-004 ~ PAT-006（3 个）
- 新增陷阱：PIT-004 ~ PIT-005（2 个）
- 累计：6 个 candidate patterns，5 个 pitfalls
- **评估**：知识积累正常，需更多实战验证

**D5 职责分布**：
- v1.0 阶段预期：engine 10%, ai 15%, adapter 20%, qa 35%, docs 20%
- W25 实际：以 docs/governance 工作为主，符合 v1.0 阶段特征
- **评估**：符合预期

**D6 决策权重**：
- 无调整。基准权重保持。

---

## 规则变更日志

| 日期 | 变更 | 审批者 | 原因 |
| --- | --- | --- | --- |
| 2026-06-30 | 产品阶段 v0.2-beta → v1.0-stable | orchestrator | v1.0.0 于 2026-06-10 发布 |

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

## 方法论参考：进化维度与自校准规则

> 本节摘自 `evolution-framework.md`，用于让账本读者快速看到 D1-D6 的自校准规则。完整框架说明见 `AGENTS.md` Evolution Ecosystem 章节和 [evolution-framework.md](./evolution-framework.md)。

### D1：估算准确度

| 指标 | 计算方式 | 周期 |
| --- | --- | --- |
| 偏差率 | `abs(estimated_hours - actual_hours) / estimated_hours` | 每任务 |
| 按复杂度分组的平均偏差 | `avg(deviation_ratio) GROUP BY complexity` | 每月 |
| 趋势方向 | 最近 4 周偏差率移动平均斜率 | 每周 |

**自校准**：若某 owner 的 S 任务连续 3 次偏差率 > 0.5，上调基准 1.5×；若连续 4 周下降，锁定为"已校准"。

### D2：瓶颈检测

| 指标 | 计算方式 | 周期 |
| --- | --- | --- |
| 依赖等待时间 | `downstream.start - upstream.end`（仅关键路径） | 每任务 |
| 瓶颈复发率 | 同一依赖链路连续 2+ sprint 等待 > 24h | 每月 |

**自校准**：若某依赖链路等待 > 48h 连续 2 sprint，建议 pre-freeze 上游；若某 agent 成为 3+ 任务的单一阻塞点，建议拆分职责。

### D3：质量趋势

| 指标 | 计算方式 | 周期 |
| --- | --- | --- |
| 门禁首次通过率 | `passes_on_first_run / total_gate_runs` | 每 sprint |
| 返工率 | review → rework 循环次数 | 每任务 |
| 诊断码覆盖率 | `diagnostic_code_count / error_path_count` | 每月 |

**自校准**：某门禁失败率 > 30% 时建议添加 pre-commit hook；返工率连续上升 3 周触发 process review；覆盖率 < 80% 时阻止 release。

### D4：知识积累

**自校准**：复用 3+ 次的模式提升为 "verified pattern"；6 个月未复用的标记为 "deprecated"；每个 sprint 至少提取 1 个新模式或陷阱。

### D5：动态职责分布

产品阶段预期负载：

| 阶段 | engine-agent | ai-agent | adapter-agent | qa-agent | docs-agent |
| --- | --- | --- | --- | --- | --- |
| v0.1 alpha | 35% | 25% | 15% | 10% | 15% |
| v0.2 beta | 25% | 30% | 20% | 15% | 10% |
| v0.3-v0.9 | 15% | 20% | 30% | 25% | 10% |
| v1.0 | 10% | 15% | 20% | 35% | 20% |

**自校准**：实际负载偏离预期 > 20% 时 coordinator 评估。

### D6：决策权重自校准

```txt
priority = competitor_threat * w1 + ai_operability_gain * w2 + user_value * w3 + technical_debt_reduction * w4 - delivery_risk * w5
```

**自校准**：每月回顾预测准确率；某维度准确率 < 50% 时下调 0.05，> 80% 时上调 0.05；单次调整 ≤ 0.10；需 coordinator 审批。

### 变更权限与安全边界

| 变更类型 | 审批者 | 回滚 |
| --- | --- | --- |
| 估算基准微调 (< 2×) | 自动 | 4 周不改善自动回滚 |
| 门禁阈值调整 | coordinator | 手动 |
| 权重微调 (< 0.05) | coordinator | 手动 |
| 职责重分配 | coordinator + product-strategist | 手动 |
| Agent 创建/合并/删除 | coordinator + product-strategist | Git revert |

**安全边界（不可自动修改）**：Repository Rules、门禁核心语义、MCP 工具名和契约、resource-policy 安全边界、产品阶段晋升决策。

---

## 版本历史

| 版本 | 日期 | 变更 |
| --- | --- | --- |
| v1.0 | 2026-05-30 | 初始账本：W22 基准、初始模式库（3 patterns）、初始陷阱库（3 pitfalls） |
| v1.1 | 2026-05-30 | 追加方法论参考（D1-D6 自校准规则），合并自 evolution-framework.md |
| v1.2 | 2026-06-05 | W24 quality acceptance: D3 updated with formal gate results (100% first-pass, 0 rework); HOC-N3 report at `docs/reviews/w24-quality-acceptance-2026-06-05.md` |
| v1.3 | 2026-06-30 | W25/W26/W27 周快照追加；产品阶段 v0.2-beta → v1.0-stable；首个月度趋势报告（2026-06）；规则变更日志初始化；PIT-005 governance staleness 记录 |
