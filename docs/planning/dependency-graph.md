---
agent: task-distributor
period: 2026-W21
generated_at: 2026-05-17T14:10:00Z
repo_revision: "bab1327"
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

## 关键路径

1. MCP / command schema P1 修复 -> v0.2 合同边界 -> expression / command / vector source spec。
2. vector source schema -> MapLibre transformer -> vector 示例与 snapshot -> MCP v0.2 contract。
3. style diff/layer order command 设计 -> command 实现 -> diagnostics -> checkpoint audit。

## 阻断规则

- `TASK-2026W21-001` 和 `TASK-2026W21-002` 未完成前，不允许新增 public AI tool 或 public command surface。
- `TASK-2026W21-003` 未完成前，不允许合入 v0.2 public schema 扩展。
- `TASK-2026W21-004` 未完成前，不允许把新 expression operator 标记为 supported。
- `TASK-2026W23-004` 未完成前，不允许宣称 MCP 支持 v0.2 新能力。
- `TASK-2026W23-007` 未完成或明确 waiver 前，不允许进入 v0.2 release candidate。
