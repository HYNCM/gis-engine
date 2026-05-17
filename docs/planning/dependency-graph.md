---
agent: task-distributor
period: 2026-W21
generated_at: 2026-05-17T16:35:00Z
repo_revision: "acdf28e"
inputs:
  - docs/planning/sprint-2026-W21.md
decision_level: advisory
---

# Dependency Graph

```mermaid
flowchart LR
  A["TASK-2026W21-001 MCP tool contract failure path"] --> C["TASK-2026W21-003 v0.2 合同边界"]
  B["TASK-2026W21-002 command schema strictness"] --> C

  C --> D["TASK-2026W21-004 expression contract"]
  D --> E["TASK-2026W21-005 expression validator"]
  E --> J["TASK-2026W23-004 MCP v0.2 contract 更新"]
  A --> J

  C --> F["TASK-2026W21-006 style diff / layer order command 设计"]
  F --> K["TASK-2026W23-005 style diff commands"]
  F --> L["TASK-2026W23-006 beforeLayerId diagnostics"]

  C --> G["TASK-2026W21-007 PMTiles/vector source schema"]
  G --> H["TASK-2026W23-001 vector schema + policy"]
  H --> I["TASK-2026W23-002 MapLibre vector transformer"]
  I --> M["TASK-2026W23-003 vector 示例 + snapshot"]
  I --> J

  C --> N["TASK-2026W21-008 v0.2 gate 模板"]
  C --> O["TASK-2026W21-009 resource/perf 缺口方案"]

  M --> P["TASK-2026W23-007 visual snapshot 场景"]
  J --> P

  C --> Q["TASK-2026W23-008 2.5D/3D boundary"]

  N --> R["TASK-2026W23-009 v0.2 checkpoint audit"]
  K --> R
  L --> R
  P --> R
```

## 当前状态

截至 `acdf28e`，图中 W21/W23 的 v0.2 checkpoint 关键链路已完成：

| Chain | Status | Evidence |
| --- | --- | --- |
| MCP / command schema P1 修复 -> v0.2 合同边界 | done | strict command schema、Diagnostic failure path、MCP output schema |
| expression contract -> validator -> MCP v0.2 coverage | done | `expression-v0.2.md`、schema tests、MCP vector/expression tests |
| vector source schema -> transformer -> example/snapshot -> MCP coverage | done | vector source schema、MapLibre transformer、`examples/vector-tile-url`、snapshot smoke/visual |
| style diff/layer order -> diagnostics -> checkpoint audit | done | command tests、missing `beforeLayerId` diagnostic、checkpoint audit |
| 2.5D/3D boundary | done as boundary | `fill-extrusion-lite` gate、`scene3d` unsupported diagnostics |

## 关键路径

1. Formal release runner evidence -> `pnpm test:release:strict` -> release evidence archive。
2. Resource/perf deterministic evidence -> create/query/snapshot/destroy tests -> CI 策略更新。
3. Command conflict/replay/audit product spec -> fixtures/examples -> coordinator monthly planning。

## 阻断规则

- public AI tool 或 public command surface 变更仍必须先通过 schema-sync、MCP contract tests 和 command replay tests。
- release candidate 必须在正式 runner 执行 strict visual snapshot，或由 coordinator 明确 waiver 并创建 follow-up。
- resource/perf 文档中声明的 PR 阻断项必须有 deterministic Node-level evidence；nightly/release 大场景不得默认为 PR blocker。
- `fill-extrusion-lite` 不得声明为 MapLibre MVP 支持，除非 adapter capability report 明确包含该 experimental 能力并补 visual evidence。
