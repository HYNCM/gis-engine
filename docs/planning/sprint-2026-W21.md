---
agent: task-distributor
period: 2026-W21
generated_at: 2026-05-17T16:35:00Z
repo_revision: "acdf28e"
inputs:
  - docs/planning/monthly-roadmap.md
  - docs/planning/technical-debt-report.md
  - docs/reviews/daily-audit-2026-05-17.md
  - docs/research/competitor-updates-2026-W20.md
decision_level: advisory
---

# Sprint Plan: 2026-W21 / W23

## 基线判断

当前 v0.1 已具备 `MapSpec -> validate -> render -> command modify -> snapshot -> export` 闭环。2026-05-17 v0.2 checkpoint 已提前完成核心计划项，两个 P1 审计缺口已关闭。下表保留原计划，用于追溯任务分配；真实完成情况见“执行快照”。

## Sprint 1: 2026-W21~W22

周期：2026-05-18 至 2026-05-29

| id | title | priority | complexity | owner | deps | hours |
| --- | --- | --- | --- | --- | --- | ---: |
| TASK-2026W21-001 | 修复 MCP tool contract failure path | P0 | M | @ai-agent | - | 20 |
| TASK-2026W21-002 | 收紧 command schema unknown field 策略 | P0 | M | @engine-agent | - | 16 |
| TASK-2026W21-003 | 冻结 v0.2 合同边界和迁移策略 | P0 | S | @product-strategist | 001,002 | 8 |
| TASK-2026W21-004 | 设计 v0.2 expression 子集 contract | P1 | M | @schema-agent | 003 | 18 |
| TASK-2026W21-005 | 实现 expression validator 与诊断覆盖 | P1 | L | @engine-agent | 004 | 30 |
| TASK-2026W21-006 | 设计 style diff 与 layer order command 扩展 | P1 | M | @engine-agent | 003 | 16 |
| TASK-2026W21-007 | 设计 PMTiles/vector tile source schema | P1 | M | @schema-agent | 003 | 16 |
| TASK-2026W21-008 | 搭建 v0.2 gate 清单与 schema/check 证据模板 | P2 | S | @quality-guardian | 003 | 10 |
| TASK-2026W21-009 | 补 resource-release 和 perf smoke 缺口方案 | P2 | M | @qa-agent | 003 | 18 |

## Sprint 2: 2026-W23~W24

周期：2026-06-01 至 2026-06-12

| id | title | priority | complexity | owner | deps | hours |
| --- | --- | --- | --- | --- | --- | ---: |
| TASK-2026W23-001 | 实现 PMTiles/vector tile schema、类型、resource policy 验证 | P1 | L | @engine-agent | W21-007 | 28 |
| TASK-2026W23-002 | 实现 MapLibre vector tile transformer 与 adapter contract | P1 | M | @adapter-agent | W23-001 | 20 |
| TASK-2026W23-003 | 增加 vector tile 示例、fixtures 与 snapshot smoke | P1 | M | @qa-agent | W23-002 | 18 |
| TASK-2026W23-004 | 更新 MCP contract 以覆盖 v0.2 新能力 | P1 | M | @ai-agent | W21-001,W21-005,W23-002 | 20 |
| TASK-2026W23-005 | 实现 style diff 命令扩展 | P1 | L | @engine-agent | W21-006 | 28 |
| TASK-2026W23-006 | 实现 beforeLayerId 缺失的结构化诊断 | P1 | M | @engine-agent | W21-006 | 18 |
| TASK-2026W23-007 | 扩展 visual snapshot 发布验收场景 | P1 | M | @qa-agent | W23-003,W23-004 | 16 |
| TASK-2026W23-008 | 定义 fill-extrusion-lite / SceneView3D boundary | P2 | L | @adapter-agent | W21-003 | 32 |
| TASK-2026W23-009 | v0.2 checkpoint 审计与 release note 草案 | P1 | S | @quality-guardian | W21-008,W23-005,W23-006,W23-007 | 12 |

## 通用验收门禁

- Schema first：先更新 TypeBox schema、类型同步和 fixtures。
- Command driven：所有状态修改通过 `MapCommand` / `applyCommands`。
- Diagnostics：失败路径必须有稳定 diagnostic code、path、fix 建议。
- Snapshot：渲染或 adapter 行为变化必须覆盖 smoke；发布候选补 visual。
- MCP contract：AI 工具只暴露 snake_case tool，并补输入输出 schema/test。
- Finish gates：相关任务至少运行 `pnpm build:schema` 与 `pnpm check`。

## 执行快照：2026-05-17

| id | status | evidence |
| --- | --- | --- |
| TASK-2026W21-001 | done | MCP failure path 返回结构化 Diagnostic；tool descriptor 带 `outputSchema` |
| TASK-2026W21-002 | done | command schema unknown fields 被拒绝，并有回归测试 |
| TASK-2026W21-003 | done | `v0.2-contract-boundary.md`、gate checklist |
| TASK-2026W21-004 | done | `expression-v0.2.md` |
| TASK-2026W21-005 | done | expression validator tests、MCP vector/expression tests |
| TASK-2026W21-006 | done | `style-diff-layer-order.md`、command tests |
| TASK-2026W21-007 | done | `vector-tile-url-template.md`、schema/resource policy/transformer |
| TASK-2026W21-008 | done | `v0.2-gate-checklist.md` |
| TASK-2026W21-009 | done | `resource-perf-gap-plan.md` plus deterministic snapshot/query lifecycle and create/query/snapshot/destroy perf smoke tests |
| TASK-2026W23-001~009 | checkpoint done | vector example/fixtures/snapshot, MCP v0.2 coverage, 2.5D/3D boundary, checkpoint audit, release note draft |
| POST-2026W21-010 | done | command conflict/replay/audit productization: `collectTrace`, MCP trace output, conflict audit fixture, audited AI edit example |
