---
agent: task-distributor
period: 2026-W21
generated_at: 2026-05-17T16:35:00Z
repo_revision: "acdf28e"
inputs:
  - docs/archive/2026-05-18/planning/sprint-2026-W21.md
  - docs/planning/sprint-2026-W25-sceneview3d-v1.md
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

截至 `acdf28e`，图中 W21/W23 的 v0.2 checkpoint 关键链路已完成；原
W21 sprint 计划已归档，当前活跃关键路径从 W25 SceneView3D v1 DAG 继续：

| Chain | Status | Evidence |
| --- | --- | --- |
| MCP / command schema P1 修复 -> v0.2 合同边界 | done | strict command schema、Diagnostic failure path、MCP output schema |
| expression contract -> validator -> MCP v0.2 coverage | done | `expression-v0.2.md`、schema tests、MCP vector/expression tests |
| vector source schema -> transformer -> example/snapshot -> MCP coverage | done | vector source schema、MapLibre transformer、`examples/vector-tile-url`、snapshot smoke/visual |
| style diff/layer order -> diagnostics -> checkpoint audit | done | command tests、missing `beforeLayerId` diagnostic、checkpoint audit |
| command conflict/replay/audit | done | `collectTrace` API、MCP trace output、conflict audit fixture、AI edit audit example |
| 2.5D/3D boundary | done as boundary | `fill-extrusion-lite` gate、`scene3d` unsupported diagnostics、`extensions.scene3d` fixture |
| fill-extrusion-lite beta adapter | done | MapLibre `fill-extrusion` mapping、capability report、example/schema fixture、snapshot smoke |
| release strict visual runner | done | `pnpm -s test:release:strict` passed in release-capable local runner with 3 visual scenes |
| large-data perf/nightly evidence | done | `pnpm -s test:perf:nightly` covers 1k/10k/100k inline GeoJSON lifecycle |
| v1 SceneView3D RFC | drafted | camera/source/layer/snapshot/query/resource policy contract |
| v1 SceneView3D sprint split | done | `sprint-2026-W25-sceneview3d-v1.md` defines schema/resource/snapshot/MCP/package DAG |
| v1 SceneView3D schema foundation | done | `SceneView3DExtensionSchema`, generated schema, public type assertions, schema-sync validation |
| v1 SceneView3D resource gate | done | scene URL policy plus `validateSceneResourceLoadPlan` for 3D Tiles JSON/model/texture/worker/timeout diagnostics |
| v1 SceneView3D scene commands | done | command schemas, deterministic JSON Patch, inverse patch, dry-run, replay, rollback, and target diagnostics |
| v1 SceneView3D mock snapshot/query | done | `snapshotScene3DMock` and `queryScene3DMock` cover pending resources, blank scenes, missing layers, hidden layers, and deterministic picks |
| v1 SceneView3D MCP context | done | `get_context_summary` and `explain_spec` output schemas include extension-only 3D source/layer/resource/snapshot/query summaries |
| v1 SceneView3D release visual gate | done | `evaluateScene3DReleaseVisualGate` defines release-mode renderer evidence, coordinator waiver, and deterministic no-bypass rules |
| v1 SceneView3D adapter feasibility | done | official CesiumJS / Three.js / 3DTilesRendererJS evidence recommends a narrow Three.js adapter spike while keeping CesiumJS as high-fidelity reference |
| v1 SceneView3D alpha audit | done | conditional alpha pass for contract/resource/command/snapshot/query/MCP/release-gate readiness; stable runtime remains blocked |
| v1 SceneView3D Three.js adapter spike | done | `@gis-engine/scene3d-three-adapter` generates deterministic load-plan/resource-policy evidence without real renderer dependencies |
| SceneView3D renderer evidence handoff | done | `createScene3DThreeAdapterRendererEvidence` converts future nonblank browser capture metrics into `Scene3DRendererVisualEvidence` and keeps missing/blank/resource-policy-failing captures blocked |
| SceneView3D adapter runtime shim | done | `createScene3DThreeAdapterRuntime` keeps load, snapshot, query, and destroy adapter-local while reusing mock SceneView3D evidence |
| SceneView3D browser visual runner | done | `runScene3DThreeAdapterBrowserRunner` renders a local fixture in Chromium, records frame metrics, and produces release-capable renderer evidence |
| SceneView3D MCP evidence summary decision | done | renderer evidence summaries stay out of MCP for now; `scene3d` context remains extension-only |
| SceneView3D beta readiness gate | done | `pnpm test:release:scene3d` now exercises the browser runner and accepts release visual evidence |

## 关键路径

1. v1 SceneView3D RFC -> W25/W28 sprint DAG -> TypeBox schema -> fixtures + URL resource policy + loader resource gate + package boundary + scene commands -> mock snapshot/query contracts -> MCP context -> release visual gate -> alpha audit + adapter feasibility -> Three.js adapter spike -> renderer evidence handoff -> adapter runtime shim -> browser visual runner -> beta readiness gate; stable runtime promotion remains blocked.

```mermaid
flowchart LR
  A["SceneView3D v1 RFC"] --> B["TASK-2026W25-001 contract slices"]
  B --> C["TASK-2026W25-002 TypeBox schema"]
  C --> D["TASK-2026W25-003 fixtures"]
  C --> E["TASK-2026W25-004 resource policy"]
  C --> F["TASK-2026W25-005 scene commands"]
  B --> G["TASK-2026W25-006 scene3d package boundary"]
  D --> H["TASK-2026W27-001 snapshot/query"]
  E --> H
  G --> H
  H --> I["TASK-2026W27-002 MCP 3D context"]
  H --> J["TASK-2026W27-003 visual gate"]
  G --> L["TASK-2026W27-004 adapter feasibility"]
  I --> K["TASK-2026W27-005 alpha audit"]
  J --> K
  K --> M["TASK-2026W28-001 Three.js adapter spike"]
  L --> M
  M --> N["renderer evidence handoff"]
  N --> O["adapter runtime shim"]
  O --> P["browser visual runner"]
  P --> Q["beta readiness gate"]
```

## 阻断规则

- public AI tool 或 public command surface 变更仍必须先通过 schema-sync、MCP contract tests 和 command replay tests。
- release candidate 必须在正式 runner 执行 strict visual snapshot，或由 coordinator 明确 waiver 并创建 follow-up。
- resource/perf 文档中声明的 PR 阻断项已有 deterministic Node-level evidence；nightly/release 大场景不得默认为 PR blocker。
- `fill-extrusion-lite` 只作为 experimental beta 暴露；即使已有 release visual evidence，也不得绕过 explicit capability gate 升格为稳定图层。
