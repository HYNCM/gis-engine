# EvidenceRecord 可信层复算（子项目 A）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让一次 AI 改动产出的 `evidence.json` 能被第三方在**不装我们的包、不访问我们 CI** 的前提下独立复算（T1 未被篡改 + T2 可追溯），同时让 agent 从既有 MCP envelope 里就能发现引擎能力边界。

**Architecture:** 证据契约单一归属于 `packages/engine/src/evidence/`：`record.ts` 是 `canonicalHash()` 的唯一实现，也是 `buildEvidenceRecord()` / `verifyEvidenceRecord()` 的宿主；TypeBox schema、ai/cli/workbench 全部是消费者。零依赖单文件 verifier 由 `record.js` 的**同一份编译产物**拷贝而成，不是第二份实现。可信层只做纯数据复算，任何需要 `applyCommands` 执行的断言归深核层（本次不做）。

**Tech Stack:** TypeScript（`strict` + `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`，target ES2022 / module NodeNext）、TypeBox + Ajv、Vitest、Node `node:crypto`、Biome、pnpm workspace。

**Spec:** `docs/superpowers/specs/2026-09-26-evidence-record-design.md`（子项目 A = 第 0–3 步）。本计划实施前该 spec 已提交于 `7d36a57` + `6dcc375`。

## Global Constraints

逐条抄自 spec 与 AGENTS.md，每个 task 都隐含遵守：

1. **不新增 MCP 工具**：`GIS_ENGINE_TOOL_NAMES` 14 个名字与顺序不得变化（`tests/schema-sync/schema-sync.test.ts:190` 的 "keeps MCP tool names snake_case" 断言是硬门禁）。能力自描述只能扩现有工具的 `outputSchema`。
2. **可信层只允许纯数据复算**（spec §6 决定 4）：`verifyEvidenceRecord()` 与单文件 verifier **不得调用 `applyCommands`、不得渲染、不得联网**。
3. **`record.ts` 的 value import 只允许 `node:` 内置模块**（`import type` 不限）——这是单文件 verifier 成立的前提，由 `scripts/build-evidence-verifier` 静态守卫。
4. **`exclusions` 必须显式存在且默认非空**；被主动排除的能力（`VISUAL_CONSISTENCY`、`OFFLINE_REPLAY`）在复算结论里必须以 `status: "not-covered"` 出现，不得静默缺席。
5. **超限拒绝导出，不截断字段**（spec §5）：`MAX_EVIDENCE_RECORD_BYTES = 1_048_576`。
6. **`evidence.json` 只被引用、不被二次修改**：下游（manifest、receipt）只能追加自己的哈希绑定。
7. schema-first：公开契约用 TypeBox + Ajv；失败路径返回结构化诊断码，禁止自然语言 throw。
8. 新增公开契约 ⇒ 必须过 `pnpm build:schema`、`pnpm check`、MCP contract。**是否算 breaking change 由 @quality 判定，实现方不得自行放行**（用 `pnpm schema:diff` 出证据）。
9. **视觉快照门禁按豁免处理**，理由必须写进 PR 描述：本切片不触碰 renderer adapter、样式转换、快照代码、视觉 fixture、URL/tile/worker 资源路径。豁免仍需确定性门禁 + smoke 快照绿。
10. `scripts/**`、`package.json` scripts、`AGENTS.md` 属 coordination surface：改动必须过 `pnpm test:agent-framework`。
11. 本计划**不含** spec §8 断言 5（PMTiles 数据入链）——它属子项目 B。断言 1、2、3、4、6、7 全部在 Task 4–6 落地。
12. `apps/workbench` 只存在于 `codex/workbench-v1` 分支，main 上没有。U5 一律在 Task 9 的分支门控内做，不阻塞 A 的主干交付。

---

## 与 spec 的三处偏差（需实现前确认）

写计划时把 spec 的两处抽象和一个措辞落到了可实现形态，偏差如下，不改变 spec 的承诺边界：

| # | spec 原文 | 计划采用 | 原因 |
| --- | --- | --- | --- |
| D1 | §6 决定 1：「同一逻辑两份实现，必须有结论一致性测试」 | **一份实现**：单文件 verifier = `dist/src/evidence/record.js` 的字节拷贝 + shebang | `record.ts` 只 value-import `node:crypto`，编译产物本身就是零依赖单文件。双实现是纯粹的额外负担 |
| D2 | §5：`spec: { beforeHash, afterHash, diff }` | `spec: { beforeHash, afterHash, diffHash }`，`diffHash = canonicalHash(changedPaths 有序数组)` | 完整 diff 与 `commands[].command.patch` 是同一事实的两份副本，会各自漂移；且 `DERIVATION_CLOSED` 在可信层只能做记录内链式核对，不放 exec 语义 |
| D3 | §8 断言 1：「改动任意一个字节 ⇒ `EVIDENCE.CHAIN_BROKEN`」 | 语义字节 ⇒ `CHAIN_BROKEN`；格式字节（空白/键序）⇒ 由 `artifact-manifest.json` 的 `sha256` 兜住 | `recordId` 覆盖的是数据模型而非文件字节。只改缩进的记录在密码学上确实未被篡改，把它报成 `CHAIN_BROKEN` 是错的；字节级完整性本来就是 manifest 的职责 |

另：`blocked[]` 条目从 `{ code, reason }` 扩为 `{ code, reason, path? }`（`path` 用于指向被 block 的 JSON pointer，与 `Diagnostic.path` 同形）。

---

## File Structure

**新建（主干）**

| 文件 | 单一职责 |
| --- | --- |
| `packages/engine/src/evidence/record.ts` | `canonicalStringify` / `canonicalHash` / `EvidenceRecord` 类型与结构校验 / `buildEvidenceRecord` / `verifyEvidenceRecord` / verifier CLI 入口。**value import 只有 `node:crypto`** |
| `packages/engine/src/evidence/capability-matrix.ts` | 从两处真相源（promotion gate + source readiness）生成 `EngineCapabilityMatrix`，不新造第三份清单 |
| `packages/engine/src/evidence/schema.ts` | `EvidenceRecordSchema` / `EngineCapabilityMatrixSchema`（TypeBox，公开契约） |
| `packages/engine/src/evidence/index.ts` | evidence 面唯一导出点 |
| `packages/engine/scripts/build-evidence-verifier.ts` | 静态守卫 `record.js` 的 import 图 → 产出 `dist/evidence-verifier.mjs` |
| `tests/evidence/canonical-hash.test.ts` | 键序无关性、三份旧站点行为对齐 |
| `tests/evidence/capability-matrix.test.ts` | gate/readiness → 矩阵推导 |
| `tests/evidence/record-build.test.ts` | §8 断言 6（缺骨架字段）、体积门禁 |
| `tests/evidence/record-verify.test.ts` | §8 断言 1/2/3 破坏性实验 + `not-covered` 显式性 |
| `tests/evidence/standalone-verifier.test.ts` | §8 断言 4/7：无 `node_modules` 临时目录实跑 + import 图守卫 |
| `docs/engineering/evidence-record.md` | 对外复算说明（第三方唯一需要读的文档） |

**修改（主干）**

| 文件 | 改什么 |
| --- | --- |
| `packages/engine/src/diagnostics/codes.ts` | 6 个 `EVIDENCE.*` 码 |
| `packages/engine/src/index.ts` | 导出 evidence 面 |
| `packages/engine/scripts/build-schema.ts` | 注册 `evidence-record.v0.1.schema.json` + `engine-capabilities.v0.1.schema.json` |
| `packages/engine/package.json` | `build` / `build:schema` 追加 verifier 构建步骤 |
| `packages/engine/src/sources/pmtiles-query.ts` | 删私有 `stableStringify`，改用 `canonicalStringify`（保留其 FNV 摘要格式） |
| `packages/ai/src/tools/generationEvidence.ts` | `spatialQueryFixtureHash` 的 `JSON.stringify` → `canonicalHash`；bundle 增加 `recordId` 绑定 |
| `packages/ai/src/tools/contextSummary.ts` | `ContextSummary.capabilityMatrix` |
| `packages/ai/src/mcp/server.ts` | `get_context_summary` / `validate_spec` 的 `outputSchema` 与 handler |
| `packages/cli/src/generate.ts` | `evidence.json` 改写 `EvidenceRecord`，入 `REQUIRED_REVIEW_FILES` |
| `packages/cli/src/artifacts.ts` | 复用 manifest 做字节级完整性；新增 `verify-evidence` 入口 |
| `package.json`（根） | `test:evidence` 脚本 + 并入 `test` 链 |
| `scripts/gate-plan.mjs` | evidence 路径 → `pnpm test:evidence` |
| `scripts/first-run-acceptance.mjs` | 新增「第三方复算」步骤 |

**分支 `codex/workbench-v1`（Task 9）**：`apps/workbench/contracts/hash.ts`、`apps/workbench/server/export-service.mjs`。

---

## Task 1: engine 能力矩阵真相源 + 门禁接线（spec 第 0 步上半）

**Files:**
- Create: `packages/engine/src/evidence/capability-matrix.ts`
- Create: `packages/engine/src/evidence/index.ts`
- Create: `tests/evidence/capability-matrix.test.ts`
- Modify: `packages/engine/src/index.ts`（在 `export { MockAdapter }` 之前插入 evidence 导出块）
- Modify: `package.json:15-33`（`test:evidence`）
- Modify: `scripts/gate-plan.mjs:96-98`（`packages/ai/` 块之前）
- Modify: `tests/framework/agent-framework.test.ts:35-45`

**Interfaces:**
- Consumes: `DEFAULT_SCENE3D_PROMOTION_GATE` / `Scene3DPromotionGate`（`spec/scene3d-promotion-gate.ts`）、`Scene3DStableRuntimeBlockerCodes` + `DiagnosticCodes`（`diagnostics/codes.ts`）、`createSourceReadinessReport` / `SourceReadinessEntry`（`sources/readiness.ts`）。
- Produces:
  ```ts
  export interface EngineCapabilityBlocker { code: string; reason: string; path?: string }
  export interface EngineCapabilityMatrix {
    schemaVersion: "engine-capabilities.v0.1";
    available: string[];
    blocked: EngineCapabilityBlocker[];
  }
  export function buildEngineCapabilityMatrix(input?: {
    scene3dPromotionGate?: Scene3DPromotionGate;
    readiness?: readonly SourceReadinessEntry[];
  }): EngineCapabilityMatrix;
  ```
  Task 2 消费它填充两个 MCP envelope；Task 4 用它填 `EvidenceRecord.capabilities`。

- [ ] **Step 1: 写失败测试**

创建 `tests/evidence/capability-matrix.test.ts`：

```ts
import { buildEngineCapabilityMatrix, type SourceReadinessEntry } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

function readinessEntry(sourceId: string, type: string, state: SourceReadinessEntry["state"]): SourceReadinessEntry {
  return {
    sourceId,
    type,
    state,
    displayReady: state === "supported",
    queryReady: state === "supported",
    resourcePolicy: "passed",
    diagnostics: [],
    limitations: [],
    nextAction: "none",
  };
}

function blockedSourceEntry(sourceId: string): SourceReadinessEntry {
  return readinessEntry(sourceId, "pmtiles", "blocked");
}

describe("buildEngineCapabilityMatrix", () => {
  it("blocks the three scene3d stable runtime surfaces at the default gate", () => {
    const matrix = buildEngineCapabilityMatrix();

    expect(matrix.schemaVersion).toBe("engine-capabilities.v0.1");
    expect(matrix.blocked.map((entry) => entry.code)).toEqual([
      "SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED",
      "SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED",
      "SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED",
    ]);
  });

  it("keeps scene3d blocked-list empty only at the stable gate", () => {
    const matrix = buildEngineCapabilityMatrix({ scene3dPromotionGate: "stable" });

    expect(matrix.blocked.filter((entry) => entry.code.startsWith("SCENE3D."))).toEqual([]);
  });

  it("warns instead of blocking at the experimental gate", () => {
    const matrix = buildEngineCapabilityMatrix({ scene3dPromotionGate: "experimental" });

    expect(matrix.blocked.filter((entry) => entry.code.startsWith("SCENE3D."))).toEqual([]);
    expect(matrix.available).toContain("scene3d.experimental-gate");
  });

  it("marks a blocked source as blocked and a supported source as available", () => {
    const matrix = buildEngineCapabilityMatrix({
      scene3dPromotionGate: "stable",
      readiness: [blockedSourceEntry("parcels"), readinessEntry("roads", "geojson", "supported")],
    });

    expect(matrix.blocked).toContainEqual(
      expect.objectContaining({ code: "CAPABILITY.UNSUPPORTED", path: "/sources/parcels" }),
    );
    expect(matrix.available).toContain("source.geojson");
    expect(matrix.available).not.toContain("source.pmtiles");
  });

  it("does not list a readiness-only source in either set", () => {
    const matrix = buildEngineCapabilityMatrix({
      scene3dPromotionGate: "stable",
      readiness: [readinessEntry("tiles", "raster", "readiness-only")],
    });

    expect(matrix.available).not.toContain("source.raster");
    expect(matrix.blocked).toEqual([]);
  });

  it("orders blocked sources by source id, not by the order they were passed in", () => {
    const forward = buildEngineCapabilityMatrix({
      scene3dPromotionGate: "stable",
      readiness: [blockedSourceEntry("alpha"), blockedSourceEntry("zeta")],
    });
    const reversed = buildEngineCapabilityMatrix({
      scene3dPromotionGate: "stable",
      readiness: [blockedSourceEntry("zeta"), blockedSourceEntry("alpha")],
    });

    expect(forward.blocked.map((entry) => entry.path)).toEqual(["/sources/alpha", "/sources/zeta"]);
    expect(reversed.blocked).toEqual(forward.blocked);
  });

  it("escapes source ids in blocker paths the way diagnostics do", () => {
    const matrix = buildEngineCapabilityMatrix({
      scene3dPromotionGate: "stable",
      readiness: [blockedSourceEntry("a/b~c")],
    });

    expect(matrix.blocked[0]?.path).toBe("/sources/a~1b~0c");
  });

  it("lists only capabilities with a truth source behind them, in canonical order", () => {
    const matrix = buildEngineCapabilityMatrix();

    // Sorted order is part of the contract: EvidenceRecord.recordId hashes this array, and
    // canonical hashing preserves array order.
    expect(matrix.available).toEqual([
      "commands.apply",
      "evidence.build",
      "export.spec",
      "mapspec.validate",
      "snapshot.smoke-mock",
    ]);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run tests/evidence/capability-matrix.test.ts`
Expected: FAIL — `buildEngineCapabilityMatrix is not a function`（或 import 解析失败），因为 evidence 模块还不存在。

- [ ] **Step 3: 写最小实现**

创建 `packages/engine/src/evidence/capability-matrix.ts`：

```ts
import { DiagnosticCodes, Scene3DStableRuntimeBlockerCodes } from "../diagnostics/codes.js";
import type { SourceReadinessEntry } from "../sources/readiness.js";
import { escapePathSegment } from "../spec/patch/path.js";
import { DEFAULT_SCENE3D_PROMOTION_GATE, type Scene3DPromotionGate } from "../spec/scene3d-promotion-gate.js";

export const ENGINE_CAPABILITY_MATRIX_SCHEMA_VERSION = "engine-capabilities.v0.1";

export interface EngineCapabilityBlocker {
  code: string;
  reason: string;
  path?: string;
}

export interface EngineCapabilityMatrix {
  schemaVersion: typeof ENGINE_CAPABILITY_MATRIX_SCHEMA_VERSION;
  available: string[];
  blocked: EngineCapabilityBlocker[];
}

export interface BuildEngineCapabilityMatrixInput {
  scene3dPromotionGate?: Scene3DPromotionGate;
  readiness?: readonly SourceReadinessEntry[];
}

const BASE_AVAILABLE = ["mapspec.validate", "commands.apply", "export.spec", "snapshot.smoke-mock"] as const;

function compareIds(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

const SCENE3D_BLOCKERS: ReadonlyArray<{ code: string; path: string; reason: string }> = [
  {
    code: Scene3DStableRuntimeBlockerCodes.ViewMode,
    path: "/view/mode",
    reason: "scene3d view mode requires the promotion gate to reach stable.",
  },
  {
    code: Scene3DStableRuntimeBlockerCodes.Renderer,
    path: "/capabilities/renderer",
    reason: "scene3d renderer requires the promotion gate to reach stable.",
  },
  {
    code: Scene3DStableRuntimeBlockerCodes.Dimensions,
    path: "/capabilities/dimensions",
    reason: "3D dimensions require the promotion gate to reach stable.",
  },
];

export function buildEngineCapabilityMatrix(input: BuildEngineCapabilityMatrixInput = {}): EngineCapabilityMatrix {
  const gate = input.scene3dPromotionGate ?? DEFAULT_SCENE3D_PROMOTION_GATE;
  const available = new Set<string>([...BASE_AVAILABLE, "evidence.build"]);
  const blocked: EngineCapabilityBlocker[] = [];

  if (gate === "blocked") {
    blocked.push(...SCENE3D_BLOCKERS);
  } else if (gate === "experimental") {
    available.add("scene3d.experimental-gate");
  }

  // Readiness rows arrive in the spec's `sources` key order; sort them so the same blocked
  // set derives the same array however the spec is written. Task 4 hashes this array into
  // EvidenceRecord.recordId, and canonical hashing preserves array order.
  const readiness = [...(input.readiness ?? [])].sort(
    (a, b) => compareIds(a.sourceId, b.sourceId) || compareIds(a.type, b.type),
  );

  for (const entry of readiness) {
    if (entry.state === "supported") {
      available.add(`source.${entry.type}`);
      continue;
    }
    if (entry.state === "blocked") {
      blocked.push({
        code: DiagnosticCodes.CapabilityUnsupported,
        reason: `source "${entry.sourceId}" of type "${entry.type}" is ${entry.state} at runtime.`,
        path: `/sources/${escapePathSegment(entry.sourceId)}`,
      });
    }
  }

  return {
    schemaVersion: ENGINE_CAPABILITY_MATRIX_SCHEMA_VERSION,
    available: [...available].sort(),
    blocked,
  };
}
```

`snapshot.smoke-mock` 的措辞是刻意的：当前快照证据只有 mock adapter 的 smoke 级别，写成 `snapshot.ready` 就是 AGENTS.md 禁止的过度声称。

- [ ] **Step 4: 建导出面**

创建 `packages/engine/src/evidence/index.ts`：

```ts
export {
  buildEngineCapabilityMatrix,
  type BuildEngineCapabilityMatrixInput,
  type EngineCapabilityBlocker,
  ENGINE_CAPABILITY_MATRIX_SCHEMA_VERSION,
  type EngineCapabilityMatrix,
} from "./capability-matrix.js";
```

在 `packages/engine/src/index.ts` 的 `export { MockAdapter } ...` 之前插入：

```ts
export {
  buildEngineCapabilityMatrix,
  type BuildEngineCapabilityMatrixInput,
  type EngineCapabilityBlocker,
  ENGINE_CAPABILITY_MATRIX_SCHEMA_VERSION,
  type EngineCapabilityMatrix,
} from "./evidence/index.js";
```

- [ ] **Step 5: 跑测试确认通过**

Run: `pnpm vitest run tests/evidence/capability-matrix.test.ts`
Expected: PASS（8 passed）

- [ ] **Step 6: 接线 test:evidence 与 path-aware gate**

`package.json` 在 `"test:cli"` 行后新增，并把 `test:evidence` 插进 `"test"` 链的 `pnpm test:cli &&` 之后：

```json
    "test:evidence": "vitest run tests/evidence",
```

`scripts/gate-plan.mjs` 在 `packages/ai/` 判断块之前插入：

```js
  if (
    files.some((file) => /^packages\/engine\/src\/evidence\//.test(file) || /^tests\/evidence\//.test(file))
  ) {
    addGate(gates, "pnpm test:evidence", "delivery evidence contract");
  }
```

`tests/framework/agent-framework.test.ts` 在 coordination-surface 断言之后新增一条（守卫 gate 映射不被删）：

```ts
  it("requires the evidence suite for evidence contract changes", () => {
    const plan = [...buildPlan(["packages/engine/src/evidence/record.ts"]).keys()];

    expect(plan).toContain("pnpm test:evidence");
  });
```

- [ ] **Step 7: 跑门禁**

Run: `pnpm build:schema && pnpm test:evidence && pnpm test:agent-framework && pnpm test:types`
Expected: 全绿。`build:schema` 此步只重编译，无新增 schema 文件。

- [ ] **Step 8: Commit**

```bash
git add packages/engine/src/evidence packages/engine/src/index.ts tests/evidence package.json scripts/gate-plan.mjs tests/framework/agent-framework.test.ts
git commit -m "feat(engine): derive capability matrix from promotion gate and readiness"
```

---

## Task 2: 能力矩阵进 `get_context_summary` + `validate_spec`（spec 第 0 步下半）

**Files:**
- Modify: `packages/ai/src/tools/contextSummary.ts:112-149`（`ContextSummary` 接口）、`:234`（构造点）、`:459`（readiness 映射）
- Modify: `packages/ai/src/mcp/server.ts`（`ValidationReportSchema` 之后新增 `ValidateSpecToolResultSchema`、`ContextSummaryToolResultSchema`、`validate_spec` handler）
- Modify: `packages/ai/src/index.ts`（导出新 schema）
- Modify: `packages/ai/src/tools/generationEvidence.ts`（bundle 的 `validation` 改指裸 `ValidationReportSchema`，保持已发布形状不变）
- Create: `tests/ai/capability-matrix-exposure.test.ts`
- Modify: `tests/schema-sync/schema-sync.test.ts`（新 schema 进 Ajv 编译清单）
**Interfaces:**
- Consumes: Task 1 的 `buildEngineCapabilityMatrix(input?)`、`EngineCapabilityMatrix`；现成 `createSourceReadinessReport(spec).sources`。
- Produces: `ContextSummaryToolResultSchema.capabilityMatrix`（required）、`ValidateSpecToolResultSchema.capabilities`（required）、`EngineCapabilityMatrixContractSchema`（server.ts 内的 hand-written JSON Schema，供 Task 4 的 TypeBox schema 对齐用）。工具名与数量不变。

- [ ] **Step 1: 写失败测试**

创建 `tests/ai/capability-matrix-exposure.test.ts`。工具调用与 outputSchema 校验沿用 `tests/ai/mcp-contract-convergence.test.ts:179-190` 的既有做法（`callGisEngineTool` + Ajv 编译 `descriptor.outputSchema`），不新造 harness：

```ts
import { callGisEngineTool, gisEngineTools } from "@gis-engine/ai";
import { buildEngineCapabilityMatrix } from "@gis-engine/engine";
import Ajv from "ajv";
import { describe, expect, it } from "vitest";

const minimalSpec = {
  version: "0.1",
  view: { center: [0, 0], zoom: 2 },
  sources: {},
  layers: [],
};

async function structuredContentOf(name: string, args: unknown): Promise<Record<string, unknown>> {
  const descriptor = gisEngineTools.find((tool) => tool.name === name);
  if (!descriptor) throw new Error(`Missing MCP descriptor for ${name}.`);

  const result = await callGisEngineTool({ params: { name, arguments: args } });
  const validate = new Ajv({ strict: false }).compile(descriptor.outputSchema as object);

  expect(result.isError, `${name} should succeed`).toBeUndefined();
  expect(validate(result.structuredContent), `${name} structuredContent must match outputSchema`).toBe(true);

  return result.structuredContent as Record<string, unknown>;
}

describe("capability matrix exposure", () => {
  it("keeps the canonical 14-tool inventory unchanged", () => {
    expect(gisEngineTools.map((tool) => tool.name)).toEqual([
      "apply_commands",
      "validate_spec",
      "export_spec",
      "get_context_summary",
      "snapshot_spec",
      "explain_spec",
      "export_example_app",
      "diff_specs",
      "generate_spec",
      "inspect_data",
      "edit_spec",
      "query_features",
      "style_recommend",
      "transform_data",
    ]);
  });

  it("validate_spec reports exactly the matrix the engine derives", async () => {
    const content = await structuredContentOf("validate_spec", { spec: minimalSpec });

    expect(content.capabilities).toEqual(buildEngineCapabilityMatrix());
  });

  it("get_context_summary reports the matrix alongside capabilitySummary", async () => {
    const content = await structuredContentOf("get_context_summary", { spec: minimalSpec });
    const matrix = content.capabilityMatrix as ReturnType<typeof buildEngineCapabilityMatrix>;

    expect(matrix.available).toContain("evidence.build");
    // Order follows SCENE3D_BLOCKERS in capability-matrix.ts: view mode, renderer, dimensions.
    expect(matrix.blocked.map((entry) => entry.code)).toEqual([
      "SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED",
      "SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED",
      "SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED",
    ]);
  });
});
```

`available` 是自由字符串数组，`blocked[].code` 同样是自由字符串——**不要为了让某条测试失败而去收紧 `available` 成枚举**。真正防过度声称的是 Task 1 的推导逻辑（只有两处真相源能产出条目）+ Task 5 的 `EVIDENCE.CAPABILITY_DRIFT`，不是 schema 枚举。因此上面第 3 条测试只钉"矩阵内容 = 引擎推导结果"这一件事。

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run tests/ai/capability-matrix-exposure.test.ts`
Expected: FAIL — 返回体里没有 `capabilities` / `capabilityMatrix` 字段。

- [ ] **Step 3: server.ts 加 contract schema**

在 `packages/ai/src/mcp/server.ts` 的 `const ValidationReportSchema = {` 之前插入：

```ts
const EngineCapabilityBlockerContractSchema = {
  type: "object",
  properties: {
    code: { type: "string" },
    reason: { type: "string" },
    path: { type: "string" },
  },
  required: ["code", "reason"],
  additionalProperties: false,
} as const;

export const EngineCapabilityMatrixContractSchema = {
  type: "object",
  properties: {
    schemaVersion: { type: "string", const: "engine-capabilities.v0.1" },
    available: { type: "array", items: { type: "string" } },
    blocked: { type: "array", items: EngineCapabilityBlockerContractSchema },
  },
  required: ["schemaVersion", "available", "blocked"],
  additionalProperties: false,
} as const;
```

**新字段只能加在 `ValidateSpecToolResultSchema` 上，不能加在共享的 `ValidationReportSchema` 上。** `snapshot_spec` 与 `explain_spec` 的 `validation` 字段、以及 `GenerationEvidenceBundleSchema.validation` 都内嵌 `ValidationReportSchema`，而它们装的是裸 `validateSpec()` 报告（`snapshotSpec.ts:68`、`explainSpec.ts:51`、`generationEvidence.ts:628`）——引擎侧 `ValidationReport` 根本没有 `capabilities`。往共享基上加 required 字段会同时撑大四个公开契约，并让三处 `structuredContent` 立刻被 Ajv 拒（实测：`data/validation must have required property 'capabilities'`）。

在 `ValidationReportSchema` 之后新增一个组合出的工具结果 schema，并让 `validate_spec` 的 descriptor 指向它：

```ts
export const ValidateSpecToolResultSchema = {
  ...ValidationReportSchema,
  properties: {
    ...ValidationReportSchema.properties,
    capabilities: EngineCapabilityMatrixContractSchema,
  },
  required: [...ValidationReportSchema.required, "capabilities"],
} as const;
```

`generationEvidence.ts` 里嵌入 bundle 的那处必须指向裸基（`stripNestedIds(ValidationReportSchema)`），否则 bundle 的 `validation` 会被间接撑大；为此把 `ValidationReportSchema` 从 `server.ts` 具名导出，但**不要**经 `packages/ai/src/index.ts` 再导出——它是包内共享形状，不是公开面。

`ContextSummaryToolResultSchema` 同样补：`properties` 加 `capabilityMatrix: EngineCapabilityMatrixContractSchema,`，`required` 数组末尾加 `"capabilityMatrix"`。

- [ ] **Step 4: validate_spec handler 组合矩阵**

`packages/ai/src/mcp/server.ts:848-856` 的 handler 改为：

```ts
    if (name === "validate_spec") {
      const input = validateToolInput<ValidateSpecToolInput>(
        validateValidateSpecInput,
        args,
        "Invalid validate_spec tool input.",
      );
      if (!input.ok) return toolTextResult(input.diagnostics, true);
      const report = validateSpec(input.input.spec);
      const readiness = report.valid ? createSourceReadinessReport(input.input.spec as MapSpec).sources : [];

      return toolTextResult({
        ...report,
        capabilities: buildEngineCapabilityMatrix({ readiness }),
      });
    }
```

在 `packages/ai/src/mcp/server.ts` 的 `@gis-engine/engine` import 块补 `buildEngineCapabilityMatrix`、`createSourceReadinessReport`。条件必须是 `report.valid`：`createSourceReadinessReport` 只接受合法 `MapSpec`，invalid spec 下不得调用（它会走到 `escapePathSegment` 与 policy 校验路径）。

- [ ] **Step 5: contextSummary 产出矩阵**

`packages/ai/src/tools/contextSummary.ts` 的 `ContextSummary` 接口（`:149` 附近，`capabilitySummary` 之后）加：

```ts
  capabilityMatrix: EngineCapabilityMatrix;
```

构造点（`:234`，与 `capabilitySummary` 同级）加：

```ts
    capabilityMatrix: buildEngineCapabilityMatrix({ readiness: sourceReadinessEntries }),
```

其中 `sourceReadinessEntries` 复用文件里既有的 `createSourceReadinessReport(spec).sources` 结果（`:459` 已有一份，把它提成一个变量供两处消费，不要重复调用第二次）。

- [ ] **Step 6: schema-sync 收口**

`tests/schema-sync/schema-sync.test.ts` 的 Ajv 编译清单数组里加入 `EngineCapabilityMatrixContractSchema`（从 `@gis-engine/ai` 导入，并在 `packages/ai/src/index.ts` 补导出）。

Run: `pnpm build:schema && pnpm test:schema-sync && pnpm test:ai && pnpm test:evidence`
Expected: PASS。若 `pnpm schema:diff` 报 outputSchema 变化，把输出原样贴进 PR 描述交 @quality 判定，**不要自行加兼容层**。

- [ ] **Step 7: Commit**

```bash
git add packages/ai/src tests/ai tests/schema-sync
git commit -m "feat(ai): surface engine capability matrix through validate_spec and get_context_summary"
```

---

## Task 3: `canonicalHash` 唯一实现 + 三处哈希收敛（spec 第 1 步，必须同一提交）

**Files:**
- Create: `packages/engine/src/evidence/record.ts`
- Create: `tests/evidence/canonical-hash.test.ts`
- Modify: `packages/engine/src/sources/pmtiles-query.ts:750-770`
- Modify: `packages/ai/src/tools/generationEvidence.ts:1281-1296`
- Modify: `packages/engine/src/evidence/index.ts`

**Interfaces:**
- Consumes: 无（`record.ts` 不 value-import 任何 engine 模块）。
- Produces:
  ```ts
  export function canonicalStringify(value: unknown): string;
  export function canonicalHash(value: unknown): string; // "sha256:<64 hex>"
  ```
  Task 4/5 用 `canonicalHash` 算 `recordId` 与所有链式哈希；Task 6 的 verifier 就是本文件的编译产物。

- [ ] **Step 1: 先采基线**

Run: `pnpm test:schema && pnpm test:ai && pnpm test:runtime && grep -rn "fixtureHash" tests | head`
Purpose: 记录哪些测试钉住了 `fnv1a32:` 或 `sha256:` 字面量。收敛后若这些值变化，必须逐个判断是"预期变化"还是"实现写错"，不得批量改期望值。

- [ ] **Step 2: 写失败测试**

创建 `tests/evidence/canonical-hash.test.ts`：

```ts
import { canonicalHash, canonicalStringify } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

describe("canonicalStringify", () => {
  it("is independent of key insertion order", () => {
    const a = canonicalStringify({ b: 1, a: { d: 2, c: 3 } });
    const b = canonicalStringify({ a: { c: 3, d: 2 }, b: 1 });

    expect(a).toBe(b);
    expect(a).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it("keeps array order significant", () => {
    expect(canonicalStringify([1, 2])).not.toBe(canonicalStringify([2, 1]));
  });

  it("normalises undefined to null instead of dropping it silently", () => {
    expect(canonicalStringify(undefined)).toBe("null");
    expect(canonicalStringify({ a: undefined })).toBe('{"a":null}');
  });

  it("hashes equal-content objects identically regardless of key order", () => {
    expect(canonicalHash({ x: 1, y: "a" })).toBe(canonicalHash({ y: "a", x: 1 }));
    expect(canonicalHash({ x: 1 })).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});
```

- [ ] **Step 3: 跑测试确认失败**

Run: `pnpm vitest run tests/evidence/canonical-hash.test.ts`
Expected: FAIL — `canonicalHash is not a function`。

- [ ] **Step 4: 写实现**

创建 `packages/engine/src/evidence/record.ts`：

```ts
import { createHash } from "node:crypto";

export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalStringify(entry)).join(",")}]`;

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalStringify(record[key])}`)
    .join(",")}}`;
}

export function canonicalHash(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalStringify(value)).digest("hex")}`;
}
```

`packages/engine/src/evidence/index.ts` 追加：

```ts
export { canonicalHash, canonicalStringify } from "./record.js";
```

- [ ] **Step 5: 收敛站点 1 —— `pmtiles-query.ts`**

删除 `packages/engine/src/sources/pmtiles-query.ts:762-770` 的私有 `stableStringify`，把 `digestStableValue` 改为消费共享字符串化、保留其 FNV 摘要格式（它产出短 id 而非防篡改哈希，两种摘要用途不同，不能合并）：

```ts
function digestStableValue(value: unknown): string {
  const input = canonicalStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
```

文件顶部加 `import { canonicalStringify } from "../evidence/record.js";`。

> 行为差异必须核对：旧私有实现用 `JSON.stringify(value)` 且**没有** `?? "null"` 兜底，`undefined` 会被序列化成 JS 的 `undefined` 字面量拼进字符串。若某条 fixture 的输入含 `undefined`，其 `fnv1a32` 值会变。Step 6 若出现此类 diff，逐个确认输入是否真含 `undefined`；真含则更新期望值并在 PR 里说明，不含则说明改动越界了。

- [ ] **Step 6: 收敛站点 2 —— ai `spatialQueryFixtureHash`**

`packages/ai/src/tools/generationEvidence.ts:1296`：

```ts
  return canonicalHash(fixture);
```

顶部从 `@gis-engine/engine` 补 `canonicalHash`，删掉因此不再使用的 `createHash` import（`sha256:` 前缀格式不变）。

- [ ] **Step 7: 跑测试 + 钉死收敛**

在 `tests/evidence/canonical-hash.test.ts` 追加一条承重断言（防止将来有人重新引入本地 stringify）：

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("hash convergence", () => {
  it("leaves no second canonical-stringify implementation in engine or ai", () => {
    const sources = [
      "packages/engine/src/sources/pmtiles-query.ts",
      "packages/ai/src/tools/generationEvidence.ts",
    ];

    for (const path of sources) {
      const text = readFileSync(resolve(process.cwd(), path), "utf-8");
      expect(text).not.toMatch(/function stableStringify/);
      expect(text).not.toMatch(/createHash\("sha256"\)\.update\(JSON\.stringify/);
    }
  });
});
```

Run: `pnpm vitest run tests/evidence/canonical-hash.test.ts && pnpm test:schema && pnpm test:ai && pnpm test:runtime && pnpm test:resources`
Expected: PASS（Step 1 基线里记录的 diff 全部有结论后才算过）

- [ ] **Step 8: Commit（本 task 的产物必须同属一个提交）**

```bash
git add packages/engine/src/evidence packages/engine/src/sources/pmtiles-query.ts packages/ai/src/tools/generationEvidence.ts tests/evidence
git commit -m "refactor(evidence): converge canonical hashing into one implementation"
```

---

## Task 4: `EvidenceRecord` schema + `buildEvidenceRecord`（spec 第 2 步上半）

**Files:**
- Modify: `packages/engine/src/evidence/record.ts`
- Create: `packages/engine/src/evidence/schema.ts`
- Create: `tests/evidence/record-build.test.ts`
- Modify: `packages/engine/src/evidence/index.ts`、`packages/engine/src/index.ts`
- Modify: `packages/engine/src/spec/schemas/generation.schema.ts:177`（给 `stripNestedIds` 加 `export`）
- Modify: `packages/engine/scripts/build-schema.ts`
- Modify: `tests/schema-sync/schema-sync.test.ts`

**Interfaces:**
- Consumes: `canonicalHash`（Task 3）、`MapCommandSchema` / `DiagnosticSchema`（`spec/schemas/`）、`stripNestedIds`（`spec/schemas/generation.schema.ts`）、`EngineCapabilityMatrix`（Task 1）。
- Produces（`@gis-engine/engine` 公开面）:
  ```ts
  export const EVIDENCE_RECORD_SCHEMA_VERSION = "evidence-record.v0.1";
  export const MAX_EVIDENCE_RECORD_BYTES = 1_048_576;
  export interface EvidenceRecord { /* 全量字段见 Step 3 */ }
  export interface EvidenceRecordInput { /* 全量字段见 Step 3 */ }
  export interface EvidenceRecordArtifact { /* 全量字段见 Step 3 */ }
  export interface EvidenceRecordCommand { /* 全量字段见 Step 3 */ }
  export interface EvidenceRecordCapabilities { /* 全量字段见 Step 3 */ }
  export type BuildEvidenceRecordResult = { ok: true; record: EvidenceRecord } | { ok: false; diagnostics: Diagnostic[] };
  export function buildEvidenceRecord(input: EvidenceRecordInput): BuildEvidenceRecordResult;
  export const EvidenceRecordSchema: TObject;     // TypeBox，见 Step 5b
  export const EngineCapabilityMatrixSchema: TObject; // TypeBox，见 Step 5b
  export type EvidenceRecordFromSchema = Static<typeof EvidenceRecordSchema>;
  ```
  `EvidenceAssertionStatus` / `verifyEvidenceRecord` 属 Task 5，不在本 task 产出内。

- [ ] **Step 1: 写失败测试（spec §8 断言 6 + 体积门禁）**

创建 `tests/evidence/record-build.test.ts`：

```ts
import {
  EVIDENCE_RECORD_SCHEMA_VERSION,
  MAX_EVIDENCE_RECORD_BYTES,
  type EvidenceRecordInput,
  EvidenceRecordSchema,
  buildEngineCapabilityMatrix,
  buildEvidenceRecord,
  canonicalHash,
} from "@gis-engine/engine";
import Ajv from "ajv";
import { describe, expect, it } from "vitest";

const ajv = new Ajv({ strict: false });
const validate = ajv.compile(EvidenceRecordSchema);

const baseInput: EvidenceRecordInput = {
  project: { id: "proj-a", baseRevision: "r0", revision: "r1" },
  origin: { actor: "agent:codex", providerKind: "mcp", promptHash: "sha256:" + "a".repeat(64) },
  commands: [
    {
      command: { id: "cmd-1", version: "0.1", type: "removeLayer", layerId: "layer-a" },
      outcome: "applied",
      diagnostics: [],
      inversePatchHash: canonicalHash([]),
      baseRevision: "r0",
      nextRevision: "r1",
    },
  ],
  spec: { beforeHash: canonicalHash({ view: {} }), afterHash: canonicalHash({ view: { zoom: 3 } }), diffHash: canonicalHash(["/view/zoom"]) },
  artifacts: [{ path: "map.json", role: "mapspec", bytes: 128, sha256: canonicalHash("map") }],
  capabilities: { schemaVersion: "engine-capabilities.v0.1", available: ["mapspec.validate"], blocked: [] },
  toolchain: { engineVersion: "1.5.0", nodeMajor: "22", pnpmVersion: "11.9.0" },
  issuer: "gis-engine-cli",
};

describe("buildEvidenceRecord", () => {
  it("derives recordId from the canonical body and validates against the public schema", () => {
    const result = buildEvidenceRecord(baseInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { record } = result;
    expect(record.schemaVersion).toBe(EVIDENCE_RECORD_SCHEMA_VERSION);
    expect(record.recordId).toBe(canonicalHash({ ...record, recordId: undefined }));
    expect(validate(record)).toBe(true);
  });

  it("is stable under key reordering of the same input", () => {
    const first = buildEvidenceRecord(JSON.parse(JSON.stringify(baseInput)));
    const second = buildEvidenceRecord({ ...baseInput, origin: reverseKeys(baseInput.origin) });

    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.record.recordId).toBe(second.record.recordId);
  });

  it("records exclusions by default and never leaves them absent", () => {
    const result = buildEvidenceRecord(baseInput);

    expect(result.ok && result.record.exclusions).toEqual(["OFFLINE_REPLAY", "VISUAL_CONSISTENCY"]);
  });

  it("rejects instead of truncating when the record exceeds the size budget", () => {
    const huge: EvidenceRecordInput = {
      ...baseInput,
      artifacts: [{ path: "x".repeat(MAX_EVIDENCE_RECORD_BYTES), role: "data", bytes: 1, sha256: canonicalHash("x") }],
    };

    const result = buildEvidenceRecord(huge);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: "EVIDENCE.RECORD_INVALID" }));
  });

  for (const field of ["project", "commands", "spec", "artifacts", "capabilities", "toolchain"] as const) {
    it(`refuses to build a record missing the ${field} skeleton field`, () => {
      const stripped = { ...baseInput } as Record<string, unknown>;
      delete stripped[field];

      const result = buildEvidenceRecord(stripped as EvidenceRecordInput);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.diagnostics.some((d) => d.code === "EVIDENCE.RECORD_INVALID")).toBe(true);
    });
  }

  it("accepts the capability matrix the engine derives, unchanged", () => {
    // Task 1's producer must be assignable to Task 4's published contract.
    const matrix = buildEngineCapabilityMatrix();
    const result = buildEvidenceRecord({ ...baseInput, capabilities: matrix });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(validate(result.record)).toBe(true);
    expect(result.record.capabilities).toEqual(matrix);
  });
});

function reverseKeys<T extends object>(value: T): T {
  const entries = Object.entries(value).reverse();
  return Object.fromEntries(entries.map(([key, entry]) => [key, reorder(entry)])) as T;
}

function reorder(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reorder);
  if (value && typeof value === "object") return reverseKeys(value as Record<string, unknown>);
  return value;
}
```

> `command` 用的是 `MapCommandSchema` 里字段最少的真实变体 `removeLayer`（`command.schema.ts:64`：`{ type: "removeLayer", layerId }` + `CommandBaseSchema` 的 `id` / `version: "0.1"`）。变体都是 `additionalProperties: false`，所以 `baseRevision` / `nextRevision` **只能挂在 `EvidenceRecordCommand` 包装层上，不能塞进 `command`**——塞进去 Ajv 立刻拒。若 Step 1 因 schema 报错，按 `command.schema.ts` 补齐 fixture，不要改 schema 迁就 fixture。

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run tests/evidence/record-build.test.ts`
Expected: FAIL — 导入符号不存在。

- [ ] **Step 3: `record.ts` 加类型与构造函数**

在 `packages/engine/src/evidence/record.ts` 追加（**只允许 `import type`，value import 仍只有 `node:crypto`**）：

```ts
import type { Diagnostic, MapCommand } from "../types.js";

export const EVIDENCE_RECORD_SCHEMA_VERSION = "evidence-record.v0.1";
export const MAX_EVIDENCE_RECORD_BYTES = 1_048_576;

export const EvidenceAssertionId = {
  ChainClosed: "CHAIN_CLOSED",
  ArtifactsMatch: "ARTIFACTS_MATCH",
  DerivationClosed: "DERIVATION_CLOSED",
  ToolchainRecorded: "TOOLCHAIN_RECORDED",
  VisualConsistency: "VISUAL_CONSISTENCY",
  OfflineReplay: "OFFLINE_REPLAY",
} as const;
export type EvidenceAssertionId = (typeof EvidenceAssertionId)[keyof typeof EvidenceAssertionId];

export const EvidenceExclusionId = {
  VisualConsistency: "VISUAL_CONSISTENCY",
  OfflineReplay: "OFFLINE_REPLAY",
} as const;
export type EvidenceExclusionId = (typeof EvidenceExclusionId)[keyof typeof EvidenceExclusionId];

// Duplicated string literals of DiagnosticCodes' EVIDENCE.* entries are intentional:
// record.ts must stay import-free besides node:crypto so its compiled output is the
// standalone verifier. tests/evidence/standalone-verifier.test.ts pins the two in sync.
export const EvidenceIssueCode = {
  RecordInvalid: "EVIDENCE.RECORD_INVALID",
  ChainBroken: "EVIDENCE.CHAIN_BROKEN",
  ArtifactMismatch: "EVIDENCE.ARTIFACT_MISMATCH",
  DerivationFailed: "EVIDENCE.DERIVATION_FAILED",
  SchemaVersionUnsupported: "EVIDENCE.SCHEMA_VERSION_UNSUPPORTED",
  CapabilityDrift: "EVIDENCE.CAPABILITY_DRIFT",
} as const;
export type EvidenceIssueCode = (typeof EvidenceIssueCode)[keyof typeof EvidenceIssueCode];

export interface EvidenceRecordArtifact {
  path: string;
  role: string;
  bytes: number;
  sha256: string;
}

export interface EvidenceRecordCommand {
  command: MapCommand;
  outcome: "applied" | "skipped" | "failed";
  diagnostics: Diagnostic[];
  inversePatchHash: string;
  baseRevision?: string;
  nextRevision?: string;
}

export interface EvidenceRecordCapabilities {
  schemaVersion: string;
  available: string[];
  blocked: Array<{ code: string; reason: string; path?: string }>;
}

export interface EvidenceRecord {
  schemaVersion: string;
  recordId: string;
  project: { id: string; baseRevision: string; revision: string };
  origin: { actor: string; providerKind: string; promptHash?: string; planHash?: string };
  commands: EvidenceRecordCommand[];
  spec: { beforeHash: string; afterHash: string; diffHash: string };
  artifacts: EvidenceRecordArtifact[];
  capabilities: EvidenceRecordCapabilities;
  toolchain: { engineVersion: string; nodeMajor: string; pnpmVersion: string };
  issuedAt: string;
  issuer: string;
  exclusions: EvidenceExclusionId[];
}

export interface EvidenceRecordInput {
  project: EvidenceRecord["project"];
  origin: EvidenceRecord["origin"];
  commands: EvidenceRecordCommand[];
  spec: EvidenceRecord["spec"];
  artifacts: EvidenceRecordArtifact[];
  capabilities: EvidenceRecordCapabilities;
  toolchain: EvidenceRecord["toolchain"];
  issuer: string;
  issuedAt?: string;
  exclusions?: EvidenceExclusionId[];
}

export type BuildEvidenceRecordResult =
  | { ok: true; record: EvidenceRecord }
  | { ok: false; diagnostics: Diagnostic[] };

const DEFAULT_EXCLUSIONS: EvidenceExclusionId[] = [EvidenceExclusionId.OfflineReplay, EvidenceExclusionId.VisualConsistency];

export function buildEvidenceRecord(input: EvidenceRecordInput): BuildEvidenceRecordResult {
  const diagnostics = structuralIssues(input);
  if (diagnostics.length > 0) return { ok: false, diagnostics };

  const record: EvidenceRecord = {
    schemaVersion: EVIDENCE_RECORD_SCHEMA_VERSION,
    recordId: "sha256:" + "0".repeat(64),
    project: input.project,
    origin: input.origin,
    commands: input.commands,
    spec: input.spec,
    artifacts: input.artifacts,
    capabilities: input.capabilities,
    toolchain: input.toolchain,
    issuedAt: input.issuedAt ?? new Date().toISOString(),
    issuer: input.issuer,
    exclusions: input.exclusions ?? [...DEFAULT_EXCLUSIONS],
  };

  record.recordId = canonicalHash({ ...record, recordId: undefined });

  if (Buffer.byteLength(canonicalStringify(record), "utf8") > MAX_EVIDENCE_RECORD_BYTES) {
    return {
      ok: false,
      diagnostics: [
        {
          severity: "error",
          code: EvidenceIssueCode.RecordInvalid,
          message: `Evidence record exceeds the ${MAX_EVIDENCE_RECORD_BYTES} byte budget; refusing to export rather than truncating evidence fields.`,
          path: "/commands",
        },
      ],
    };
  }

  return { ok: true, record };
}
```

**`recordId` 的自指处理**：先把 `recordId` 置为占位、再对 `{ ...record, recordId: undefined }` 求哈希。`canonicalStringify` 会把 `undefined` 归一化为 `null`，因此任何实现者改写键序或删除该键都不会改变哈希输入。verify 侧必须用**同一个**表达式重算。

- [ ] **Step 4: 写结构校验（零依赖，不用 Ajv）**

同文件追加。它只查骨架与格式，不做语义推导（语义在 Task 5）：

```ts
const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;

function issue(message: string, path: string): Diagnostic {
  return { severity: "error", code: EvidenceIssueCode.RecordInvalid, message, path };
}

function structuralIssues(input: EvidenceRecordInput): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const requireObject = (value: unknown, path: string): value is Record<string, unknown> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      diagnostics.push(issue(`${path} is required and must be an object.`, path));
      return false;
    }
    return true;
  };

  if (requireObject(input.project, "/project")) {
    for (const key of ["id", "baseRevision", "revision"] as const) {
      if (typeof input.project[key] !== "string" || input.project[key].length === 0) {
        diagnostics.push(issue(`/project/${key} must be a non-empty string.`, `/project/${key}`));
      }
    }
  }
  if (requireObject(input.origin, "/origin")) {
    if (typeof input.origin.actor !== "string" || input.origin.actor.length === 0) {
      diagnostics.push(issue("/origin/actor must be a non-empty string.", "/origin/actor"));
    }
    if (typeof input.origin.providerKind !== "string" || input.origin.providerKind.length === 0) {
      diagnostics.push(issue("/origin/providerKind must be a non-empty string.", "/origin/providerKind"));
    }
    for (const key of ["promptHash", "planHash"] as const) {
      const value = input.origin[key];
      if (value !== undefined && !SHA256_PATTERN.test(value)) {
        diagnostics.push(issue(`/origin/${key} must match sha256:<hex64>.`, `/origin/${key}`));
      }
    }
  }
  if (!Array.isArray(input.commands) || input.commands.length === 0) {
    diagnostics.push(issue("/commands must be a non-empty array.", "/commands"));
  } else {
    input.commands.forEach((entry, index) => {
      const path = `/commands/${index}`;
      if (!entry || typeof entry !== "object") {
        diagnostics.push(issue(`${path} is required.`, path));
        return;
      }
      if (!entry.command || typeof entry.command !== "object") diagnostics.push(issue(`${path}/command is required.`, `${path}/command`));
      if (!["applied", "skipped", "failed"].includes(entry.outcome)) diagnostics.push(issue(`${path}/outcome is invalid.`, `${path}/outcome`));
      if (!Array.isArray(entry.diagnostics)) diagnostics.push(issue(`${path}/diagnostics must be an array.`, `${path}/diagnostics`));
      if (typeof entry.inversePatchHash !== "string" || !SHA256_PATTERN.test(entry.inversePatchHash)) {
        diagnostics.push(issue(`${path}/inversePatchHash must match sha256:<hex64>.`, `${path}/inversePatchHash`));
      }
    });
  }
  if (requireObject(input.spec, "/spec")) {
    for (const key of ["beforeHash", "afterHash", "diffHash"] as const) {
      if (typeof input.spec[key] !== "string" || !SHA256_PATTERN.test(input.spec[key])) {
        diagnostics.push(issue(`/spec/${key} must match sha256:<hex64>.`, `/spec/${key}`));
      }
    }
  }
  if (!Array.isArray(input.artifacts) || input.artifacts.length === 0) {
    diagnostics.push(issue("/artifacts must be a non-empty array.", "/artifacts"));
  } else {
    input.artifacts.forEach((entry, index) => {
      const path = `/artifacts/${index}`;
      if (typeof entry?.path !== "string" || entry.path.length === 0) diagnostics.push(issue(`${path}/path is required.`, `${path}/path`));
      if (typeof entry?.role !== "string" || entry.role.length === 0) diagnostics.push(issue(`${path}/role is required.`, `${path}/role`));
      if (!Number.isInteger(entry?.bytes) || entry.bytes < 0) diagnostics.push(issue(`${path}/bytes must be a non-negative integer.`, `${path}/bytes`));
      if (typeof entry?.sha256 !== "string" || !SHA256_PATTERN.test(entry.sha256)) {
        diagnostics.push(issue(`${path}/sha256 must match sha256:<hex64>.`, `${path}/sha256`));
      }
    });
  }
  if (requireObject(input.capabilities, "/capabilities")) {
    if (!Array.isArray(input.capabilities.available)) diagnostics.push(issue("/capabilities/available must be an array.", "/capabilities/available"));
    if (!Array.isArray(input.capabilities.blocked)) diagnostics.push(issue("/capabilities/blocked must be an array.", "/capabilities/blocked"));
    if (typeof input.capabilities.schemaVersion !== "string" || input.capabilities.schemaVersion.length === 0) {
      diagnostics.push(issue("/capabilities/schemaVersion is required.", "/capabilities/schemaVersion"));
    }
  }
  if (requireObject(input.toolchain, "/toolchain")) {
    for (const key of ["engineVersion", "nodeMajor", "pnpmVersion"] as const) {
      if (typeof input.toolchain[key] !== "string" || input.toolchain[key].length === 0) {
        diagnostics.push(issue(`/toolchain/${key} must be a non-empty string.`, `/toolchain/${key}`));
      }
    }
  }
  if (typeof input.issuer !== "string" || input.issuer.length === 0) {
    diagnostics.push(issue("/issuer must be a non-empty string.", "/issuer"));
  }

  return diagnostics;
}
```

`exactOptionalPropertyTypes: true` 下不得写 `{ issuedAt: undefined }`——所有可选字段一律用 `?? ` 或条件展开，代码里已按此写法。

- [ ] **Step 5: TypeBox 公开契约**

创建 `packages/engine/src/evidence/schema.ts`：

> **嵌套 `$id` 是本仓库已修过的坑，必须照抄现有做法。** `DiagnosticSchema`（`diagnostics.schema.ts:57`）与 `MapCommandSchema`（`command.schema.ts:207`）自带 `$id`，直接嵌进另一个带 `$id` 的 schema 会让 Ajv 把它当作独立注册项解析（轻则 `$ref` 解析失败，重则 `schema with key or id already exists`）。仓库的既有约定是 `stripNestedIds()`：`packages/engine/src/spec/schemas/generation.schema.ts:14-16` 就是这样嵌 `DiagnosticSchema` / `MapCommandSchema` 的。该 helper 目前是私有的 ⇒ Step 5a 把它改成命名导出（**不扩大公开 API**：`src/spec/schemas/index.ts` 用显式具名再导出而非 `export *`，`src/index.ts:171` 只能看到 barrel 里列出的东西）。`EngineCapabilityMatrixSchema` 自己带 `$id` 且要单独注册成文件，所以嵌进 `EvidenceRecordSchema` 时同样要 strip。

- [ ] **Step 5a: 导出 `stripNestedIds`**

`packages/engine/src/spec/schemas/generation.schema.ts:177`：

```ts
export function stripNestedIds<T>(value: T): T {
```

只加 `export` 关键字，函数体一字不动；`src/spec/schemas/index.ts` 不追加再导出。

- [ ] **Step 5b: 写 `evidence/schema.ts`**

```ts
import { type Static, Type } from "@sinclair/typebox";
import { DiagnosticSchema } from "../spec/schemas/diagnostics.schema.js";
import { MapCommandSchema } from "../spec/schemas/index.js";
import { stripNestedIds } from "../spec/schemas/generation.schema.js";

const NestedDiagnosticSchema = stripNestedIds(DiagnosticSchema);
const NestedMapCommandSchema = stripNestedIds(MapCommandSchema);

const Sha256 = Type.String({ pattern: "^sha256:[a-f0-9]{64}$" });
// 本仓库没有 ajv-formats（`grep -rn "ajv-formats" packages` 为空），所以这里不写
// `format: "date-time"`——Ajv 会静默忽略它，留下一个看着像校验其实没校验的字段。
const Iso8601Utc = Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,3})?Z$" });

export const EngineCapabilityBlockerSchema = Type.Object(
  { code: Type.String(), reason: Type.String(), path: Type.Optional(Type.String()) },
  { additionalProperties: false },
);

export const EngineCapabilityMatrixSchema = Type.Object(
  {
    schemaVersion: Type.Literal("engine-capabilities.v0.1"),
    available: Type.Array(Type.String()),
    blocked: Type.Array(EngineCapabilityBlockerSchema),
  },
  { $id: "https://gis-engine.dev/schemas/engine-capabilities.v0.1.schema.json", additionalProperties: false },
);

const NestedEngineCapabilityMatrixSchema = stripNestedIds(EngineCapabilityMatrixSchema);

export const EvidenceRecordSchema = Type.Object(
  {
    schemaVersion: Type.Literal("evidence-record.v0.1"),
    recordId: Sha256,
    project: Type.Object(
      { id: Type.String({ minLength: 1 }), baseRevision: Type.String({ minLength: 1 }), revision: Type.String({ minLength: 1 }) },
      { additionalProperties: false },
    ),
    origin: Type.Object(
      {
        actor: Type.String({ minLength: 1 }),
        providerKind: Type.String({ minLength: 1 }),
        promptHash: Type.Optional(Sha256),
        planHash: Type.Optional(Sha256),
      },
      { additionalProperties: false },
    ),
    commands: Type.Array(
      Type.Object(
        {
          command: NestedMapCommandSchema,
          outcome: Type.Union([Type.Literal("applied"), Type.Literal("skipped"), Type.Literal("failed")]),
          diagnostics: Type.Array(NestedDiagnosticSchema),
          inversePatchHash: Sha256,
          baseRevision: Type.Optional(Type.String()),
          nextRevision: Type.Optional(Type.String()),
        },
        { additionalProperties: false },
      ),
      { minItems: 1 },
    ),
    spec: Type.Object(
      { beforeHash: Sha256, afterHash: Sha256, diffHash: Sha256 },
      { additionalProperties: false },
    ),
    artifacts: Type.Array(
      Type.Object(
        { path: Type.String({ minLength: 1 }), role: Type.String({ minLength: 1 }), bytes: Type.Integer({ minimum: 0 }), sha256: Sha256 },
        { additionalProperties: false },
      ),
      { minItems: 1 },
    ),
    capabilities: NestedEngineCapabilityMatrixSchema,
    toolchain: Type.Object(
      {
        engineVersion: Type.String({ minLength: 1 }),
        nodeMajor: Type.String({ minLength: 1 }),
        pnpmVersion: Type.String({ minLength: 1 }),
      },
      { additionalProperties: false },
    ),
    issuedAt: Iso8601Utc,
    issuer: Type.String({ minLength: 1 }),
    exclusions: Type.Array(Type.Union([Type.Literal("VISUAL_CONSISTENCY"), Type.Literal("OFFLINE_REPLAY")]), {
      minItems: 1,
    }),
  },
  { $id: "https://gis-engine.dev/schemas/evidence-record.v0.1.schema.json", additionalProperties: false },
);

export type EvidenceRecordFromSchema = Static<typeof EvidenceRecordSchema>;
export type EngineCapabilityMatrixFromSchema = Static<typeof EngineCapabilityMatrixSchema>;
```

- [ ] **Step 6: 注册进 build:schema 与导出面**

`packages/engine/scripts/build-schema.ts` 的 import 块加 `EvidenceRecordSchema`、`EngineCapabilityMatrixSchema`（从 `../src/evidence/index.js`），`schemas` 数组加两项：

```ts
  ["evidence-record.v0.1.schema.json", EvidenceRecordSchema],
  ["engine-capabilities.v0.1.schema.json", EngineCapabilityMatrixSchema],
```

`evidence/index.ts` 追加：

```ts
export {
  buildEvidenceRecord,
  type BuildEvidenceRecordResult,
  type EvidenceRecord,
  type EvidenceRecordArtifact,
  type EvidenceRecordCapabilities,
  type EvidenceRecordCommand,
  type EvidenceRecordInput,
  type EvidenceExclusionId,
  EvidenceExclusionId,
  type EvidenceAssertionId,
  EvidenceAssertionId,
  type EvidenceIssueCode,
  EvidenceIssueCode,
  EVIDENCE_RECORD_SCHEMA_VERSION,
  MAX_EVIDENCE_RECORD_BYTES,
} from "./record.js";
export {
  EngineCapabilityBlockerSchema,
  EngineCapabilityMatrixSchema,
  EvidenceRecordSchema,
  type EvidenceRecordFromSchema,
  type EngineCapabilityMatrixFromSchema,
} from "./schema.js";
```

（防漂移的那条一致性测试在 Step 1 的 `accepts the capability matrix the engine derives` 用例里，它把 Task 1 的 `buildEngineCapabilityMatrix()` 直接喂进记录并过 Ajv。）

Run: `pnpm build:schema && pnpm vitest run tests/evidence/record-build.test.ts`
Expected: PASS（含 Ajv `validate(record) === true` 与各 skeleton 负向）

- [ ] **Step 7: schema-sync 收口 + 嵌套 `$id` 守卫**

`tests/schema-sync/schema-sync.test.ts` 的 engine 导入块加 `EvidenceRecordSchema`、`EngineCapabilityMatrixSchema`，并加入 Ajv 编译清单。

再加一条守卫测试，把 Step 5 引言里的坑变成可执行的锁（放在同一文件）：

```ts
it("publishes evidence schemas without nested $id", () => {
  for (const [name, schema] of [
    ["evidence-record.v0.1.schema.json", EvidenceRecordSchema],
    ["engine-capabilities.v0.1.schema.json", EngineCapabilityMatrixSchema],
  ] as const) {
    const serialized = JSON.stringify(schema);
    const idCount = serialized.match(/"\$id":/g)?.length ?? 0;
    expect(idCount, name).toBe(1);
  }
});
```

`EngineCapabilityMatrixSchema` 单独注册时自身带 1 个 `$id`；`EvidenceRecordSchema` 内嵌的是 stripped 副本，因此整棵树也只应剩根节点这 1 个。若有人把 `capabilities` 换回 `EngineCapabilityMatrixSchema` 或漏掉 `stripNestedIds`，这条测试立刻红。

Run: `pnpm test:schema-sync && pnpm test:types && pnpm test:evidence`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add packages/engine/src/evidence packages/engine/scripts/build-schema.ts tests/evidence tests/schema-sync
git commit -m "feat(evidence): add EvidenceRecord contract and hash-chained builder"
```

---

## Task 5: `verifyEvidenceRecord` 纯数据复算 + `EVIDENCE.*` 诊断码（spec 第 2 步下半）

**Files:**
- Modify: `packages/engine/src/evidence/record.ts`
- Modify: `packages/engine/src/diagnostics/codes.ts:41`（`SchemaInvalid` 之后）
- Create: `tests/evidence/record-verify.test.ts`
- Modify: `tests/schema-sync/schema-sync.test.ts`（诊断码同步锁）

**Interfaces:**
- Consumes: Task 4 的 `EvidenceRecord`、`canonicalHash`、`EvidenceAssertionId`、`EvidenceIssueCode`。
- Produces:
  ```ts
  export type EvidenceAssertionStatus = "passed" | "failed" | "not-covered";
  export interface EvidenceAssertion { id: EvidenceAssertionId; status: EvidenceAssertionStatus; detail: string }
  export interface EvidenceVerificationResult { ok: boolean; assertions: EvidenceAssertion[]; diagnostics: Diagnostic[] }
  export interface VerifyEvidenceRecordOptions {
    readArtifact: (path: string) => Promise<Uint8Array>;
    expectedCapabilities?: EvidenceRecordCapabilities;
  }
  export function verifyEvidenceRecord(
    record: EvidenceRecord,
    options: VerifyEvidenceRecordOptions,
  ): Promise<EvidenceVerificationResult>;
  ```
  Task 6/7/8 与第三方复算都只消费这一个函数。

- [ ] **Step 1: 加诊断码**

`packages/engine/src/diagnostics/codes.ts` 在 `SchemaInvalid: "SCHEMA.INVALID",` 之后插入：

```ts
  EvidenceRecordInvalid: "EVIDENCE.RECORD_INVALID",
  EvidenceChainBroken: "EVIDENCE.CHAIN_BROKEN",
  EvidenceArtifactMismatch: "EVIDENCE.ARTIFACT_MISMATCH",
  EvidenceDerivationFailed: "EVIDENCE.DERIVATION_FAILED",
  EvidenceSchemaVersionUnsupported: "EVIDENCE.SCHEMA_VERSION_UNSUPPORTED",
  EvidenceCapabilityDrift: "EVIDENCE.CAPABILITY_DRIFT",
```

`DiagnosticCodeSchema` 由 `Object.values(DiagnosticCodes)` 自动扩展 ⇒ `pnpm build:schema` 会重生成 `diagnostics.v0.1.schema.json`。`EvidenceIssueCode` 与 `DiagnosticCodes` 的 6 条字面量在 Task 6 Step 1 被测试钉住。

- [ ] **Step 2: 写失败测试（spec §8 断言 1/2/3）**

创建 `tests/evidence/record-verify.test.ts`：

```ts
import { readFileSync } from "node:fs";
import { type EvidenceRecord, verifyEvidenceRecord } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import { MAP_JSON, buildFixture, validRecord } from "./fixtures/record.js";

const artifacts = new Map<string, Uint8Array>([["map.json", new TextEncoder().encode(`{"view":{}}\n`)]]);
const readArtifact = async (path: string) => {
  const bytes = artifacts.get(path);
  if (!bytes) throw new Error(`missing artifact ${path}`);
  return bytes;
};

describe("verifyEvidenceRecord", () => {
  it("passes every trust-tier assertion and keeps excluded claims explicitly not-covered", async () => {
    const result = await verifyEvidenceRecord(validRecord, { readArtifact });

    expect(result.ok).toBe(true);
    expect(result.assertions).toEqual([
      { id: "ARTIFACTS_MATCH", status: "passed", detail: "1 of 1 artifacts matched" },
      { id: "CHAIN_CLOSED", status: "passed", detail: "recordId matches the canonical body" },
      { id: "DERIVATION_CLOSED", status: "passed", detail: "revision lineage closed" },
      { id: "OFFLINE_REPLAY", status: "not-covered", detail: "excluded: requires referenced replay outside the trust tier" },
      { id: "TOOLCHAIN_RECORDED", status: "passed", detail: "engine 1.5.0 / node 22 / pnpm 11.9.0" },
      { id: "VISUAL_CONSISTENCY", status: "not-covered", detail: "excluded: visual consistency is deferred" },
    ]);
  });

  it("reports EVIDENCE.CHAIN_BROKEN when a data-bearing byte of the record changes", async () => {
    const tampered: EvidenceRecord = { ...validRecord, issuer: "someone-else" };

    const result = await verifyEvidenceRecord(tampered, { readArtifact });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: "EVIDENCE.CHAIN_BROKEN" }));
  });

  it("reports EVIDENCE.ARTIFACT_MISMATCH naming the replaced file", async () => {
    artifacts.set("map.json", new TextEncoder().encode(`{"view":{"zoom":99}}\n`));

    const result = await verifyEvidenceRecord(validRecord, { readArtifact });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "EVIDENCE.ARTIFACT_MISMATCH", path: "/artifacts/0" }),
    );
    artifacts.set("map.json", new TextEncoder().encode(`{"view":{}}\n`));
  });

  it("reports EVIDENCE.DERIVATION_FAILED on a broken revision lineage", async () => {
    // Rebuilt through the fixture so recordId stays valid and only lineage fails.
    const broken = buildFixture({
      commands: [{ ...validRecord.commands[0]!, nextRevision: "r9" }],
    });

    const result = await verifyEvidenceRecord(broken, { readArtifact });

    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: "EVIDENCE.DERIVATION_FAILED" }));
    expect(result.diagnostics.some((entry) => entry.code === "EVIDENCE.CHAIN_BROKEN")).toBe(false);
  });

  it("never executes commands: the verifier module stays replay-free", () => {
    // Path style follows tests/ai/mcp-contract-convergence.test.ts:94.
    const text = readFileSync(new URL("../../packages/engine/src/evidence/record.ts", import.meta.url), "utf8");

    expect(text).not.toMatch(/applyCommands/);
    // Only node: builtins may be value imports; everything else must be `import type`.
    expect(text).not.toMatch(/^import\s+(?!type)[^\n]*from\s+"(?!node:)/m);
  });

  it("reports EVIDENCE.CAPABILITY_DRIFT when the live gate has moved past the record", async () => {
    const result = await verifyEvidenceRecord(validRecord, {
      readArtifact,
      expectedCapabilities: { schemaVersion: "engine-capabilities.v0.1", available: ["mapspec.validate"], blocked: [] },
    });

    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: "EVIDENCE.CAPABILITY_DRIFT" }));
  });
});
```

创建 `tests/evidence/fixtures/record.ts`（供本文件与 Task 6 复用）：

```ts
import {
  buildEvidenceRecord,
  canonicalHash,
  type EvidenceRecord,
  type EvidenceRecordInput,
} from "@gis-engine/engine";
import { createHash } from "node:crypto";

export function sha256Of(value: string | Uint8Array): string {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

export const MAP_JSON = `{"view":{}}\n`;

const SCENE3D_BLOCKERS = [
  { code: "SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED", reason: "gate is blocked", path: "/view/mode" },
  { code: "SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED", reason: "gate is blocked", path: "/capabilities/renderer" },
  { code: "SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED", reason: "gate is blocked", path: "/capabilities/dimensions" },
];

/** One builder for every evidence test, so a fixture can never drift from the contract. */
export function buildFixture(overrides: Partial<EvidenceRecordInput> = {}): EvidenceRecord {
  const built = buildEvidenceRecord({
    project: { id: "proj-a", baseRevision: "r0", revision: "r1" },
    origin: { actor: "agent:codex", providerKind: "mcp", promptHash: canonicalHash("prompt") },
    commands: [
      {
        command: { id: "cmd-1", version: "0.1", type: "removeLayer", layerId: "layer-a" },
        outcome: "applied",
        diagnostics: [],
        inversePatchHash: canonicalHash([]),
        baseRevision: "r0",
        nextRevision: "r1",
      },
    ],
    spec: { beforeHash: canonicalHash({}), afterHash: canonicalHash({}), diffHash: canonicalHash([]) },
    artifacts: [{ path: "map.json", role: "mapspec", bytes: MAP_JSON.length, sha256: sha256Of(MAP_JSON) }],
    capabilities: { schemaVersion: "engine-capabilities.v0.1", available: ["mapspec.validate"], blocked: SCENE3D_BLOCKERS },
    toolchain: { engineVersion: "1.5.0", nodeMajor: "22", pnpmVersion: "11.9.0" },
    issuer: "gis-engine-cli",
    issuedAt: "2026-09-26T00:00:00.000Z",
    ...overrides,
  });

  if (!built.ok) throw new Error(`evidence fixture is invalid: ${JSON.stringify(built.diagnostics)}`);
  return built.record;
}

export const validRecord: EvidenceRecord = buildFixture();
```

- [ ] **Step 3: 跑测试确认失败**

Run: `pnpm vitest run tests/evidence/record-verify.test.ts`
Expected: FAIL — `verifyEvidenceRecord is not a function`。

- [ ] **Step 4: 实现 verify**

`record.ts` 追加（保持"value import 只有 `node:crypto`"）：

```ts
export type EvidenceAssertionStatus = "passed" | "failed" | "not-covered";

export interface EvidenceAssertion {
  id: EvidenceAssertionId;
  status: EvidenceAssertionStatus;
  detail: string;
}

export interface EvidenceVerificationResult {
  ok: boolean;
  assertions: EvidenceAssertion[];
  diagnostics: Diagnostic[];
}

export interface VerifyEvidenceRecordOptions {
  readArtifact: (path: string) => Promise<Uint8Array>;
  expectedCapabilities?: EvidenceRecordCapabilities;
}

const UNSUPPORTED_VERSION_MESSAGE = "Evidence record schemaVersion is newer than this verifier supports.";

export async function verifyEvidenceRecord(
  record: EvidenceRecord,
  options: VerifyEvidenceRecordOptions,
): Promise<EvidenceVerificationResult> {
  const diagnostics: Diagnostic[] = [];

  if (record.schemaVersion !== EVIDENCE_RECORD_SCHEMA_VERSION) {
    diagnostics.push({
      severity: "error",
      code: EvidenceIssueCode.SchemaVersionUnsupported,
      message: `${UNSUPPORTED_VERSION_MESSAGE} Found ${record.schemaVersion}.`,
      path: "/schemaVersion",
    });
  }

  const chainExpected = canonicalHash({ ...record, recordId: undefined });
  const chainClosed = typeof record.recordId === "string" && record.recordId === chainExpected;
  if (!chainClosed) {
    diagnostics.push({
      severity: "error",
      code: EvidenceIssueCode.ChainBroken,
      message: "recordId does not match the recomputed canonical hash of the record body.",
      path: "/recordId",
    });
  }

  const artifactIssues: Diagnostic[] = [];
  let matched = 0;
  for (const [index, artifact] of record.artifacts.entries()) {
    const path = `/artifacts/${index}`;
    let bytes: Uint8Array;
    try {
      bytes = await options.readArtifact(artifact.path);
    } catch (error) {
      artifactIssues.push({
        severity: "error",
        code: EvidenceIssueCode.ArtifactMismatch,
        message: `Artifact "${artifact.path}" could not be read: ${error instanceof Error ? error.message : String(error)}`,
        path,
      });
      continue;
    }
    const actual = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
    if (actual === artifact.sha256 && bytes.byteLength === artifact.bytes) {
      matched += 1;
      continue;
    }
    artifactIssues.push({
      severity: "error",
      code: EvidenceIssueCode.ArtifactMismatch,
      message: `Artifact "${artifact.path}" hash or size does not match the evidence record.`,
      path,
      relatedResources: [{ kind: "source", path: artifact.path }],
    });
  }
  diagnostics.push(...artifactIssues);

  const lineageIssue = checkLineage(record);
  if (lineageIssue) diagnostics.push(lineageIssue);

  const inverseIssue = checkInversePatchHashes(record);
  if (inverseIssue) diagnostics.push(inverseIssue);

  if (options.expectedCapabilities) {
    const driftIssue = checkCapabilityDrift(record.capabilities, options.expectedCapabilities);
    if (driftIssue) diagnostics.push(driftIssue);
  }

  const toolchainRecorded = ["engineVersion", "nodeMajor", "pnpmVersion"].every(
    (key) => typeof record.toolchain[key as keyof EvidenceRecord["toolchain"]] === "string" &&
      record.toolchain[key as keyof EvidenceRecord["toolchain"]].length > 0,
  );

  const assertions: EvidenceAssertion[] = [
    {
      id: EvidenceAssertionId.ArtifactsMatch,
      status: artifactIssues.length === 0 ? "passed" : "failed",
      detail: `${matched} of ${record.artifacts.length} artifacts matched`,
    },
    {
      id: EvidenceAssertionId.ChainClosed,
      status: chainClosed ? "passed" : "failed",
      detail: chainClosed ? "recordId matches the canonical body" : "recordId does not match the canonical body",
    },
    {
      id: EvidenceAssertionId.DerivationClosed,
      status: lineageIssue || inverseIssue ? "failed" : "passed",
      detail: lineageIssue ? lineageIssue.message : inverseIssue ? inverseIssue.message : "revision lineage closed",
    },
    {
      id: EvidenceAssertionId.OfflineReplay,
      status: "not-covered",
      detail: "excluded: requires referenced replay outside the trust tier",
    },
    {
      id: EvidenceAssertionId.ToolchainRecorded,
      status: toolchainRecorded ? "passed" : "failed",
      detail: `engine ${record.toolchain.engineVersion} / node ${record.toolchain.nodeMajor} / pnpm ${record.toolchain.pnpmVersion}`,
    },
    {
      id: EvidenceAssertionId.VisualConsistency,
      status: "not-covered",
      detail: "excluded: visual consistency is deferred",
    },
  ].sort((left, right) => left.id.localeCompare(right.id));

  return {
    ok: assertions.every((entry) => entry.status !== "failed"),
    assertions,
    diagnostics,
  };
}
```

追加三个纯数据核对函数（**不做任何 patch 执行**，这是 spec §6 决定 4 的落点）：

```ts
function checkLineage(record: EvidenceRecord): Diagnostic | undefined {
  const path = "/commands";
  const failed = (message: string): Diagnostic => ({
    severity: "error",
    code: EvidenceIssueCode.DerivationFailed,
    message,
    path,
  });

  for (const [index, entry] of record.commands.entries()) {
    if (typeof entry.baseRevision === "string" && entry.baseRevision !== (index === 0 ? record.project.baseRevision : previousRevision(record, index))) {
      return failed(`commands[${index}].baseRevision does not continue the revision lineage.`);
    }
  }
  const last = record.commands[record.commands.length - 1];
  if (!last) return failed("Evidence records must carry at least one command.");
  if (typeof last.nextRevision === "string" && last.nextRevision !== record.project.revision) {
    return failed("The final command revision does not match project.revision.");
  }
  return undefined;
}

function previousRevision(record: EvidenceRecord, index: number): string | undefined {
  return record.commands[index - 1]?.nextRevision;
}

function checkInversePatchHashes(record: EvidenceRecord): Diagnostic | undefined {
  for (const [index, entry] of record.commands.entries()) {
    const patch = (entry.command as { inversePatch?: unknown }).inversePatch;
    if (patch === undefined) continue;
    if (canonicalHash(patch) !== entry.inversePatchHash) {
      return {
        severity: "error",
        code: EvidenceIssueCode.DerivationFailed,
        message: `commands[${index}].inversePatchHash does not match the canonical hash of its inverse patch.`,
        path: `/commands/${index}/inversePatchHash`,
      };
    }
  }
  return undefined;
}

function checkCapabilityDrift(
  recorded: EvidenceRecordCapabilities,
  expected: EvidenceRecordCapabilities,
): Diagnostic | undefined {
  const recordedCodes = recorded.blocked.map((entry) => entry.code).sort();
  const expectedCodes = expected.blocked.map((entry) => entry.code).sort();
  if (recordedCodes.length === expectedCodes.length && recordedCodes.every((code, index) => code === expectedCodes[index])) {
    return undefined;
  }
  return {
    severity: "error",
    code: EvidenceIssueCode.CapabilityDrift,
    message: "Recorded capability blockers differ from the engine's current blockers.",
    path: "/capabilities/blocked",
  };
}
```

> `command` 上取 `inversePatch` 用 `as { inversePatch?: unknown }` 而不是 import `MapCommand` 的判别联合——`MapCommand` 各变体的 patch 字段位置不同，这里只做记录内一致性，形状取窄即可，schema 层已由 `MapCommandSchema` 兜住。

- [ ] **Step 4b: 导出 verify 面**

`packages/engine/src/evidence/index.ts` 追加（`record.js` 那一批导出里补进以下符号，`packages/engine/src/index.ts` 的 evidence 块同样补齐）：

```ts
  type EvidenceAssertion,
  type EvidenceAssertionStatus,
  type EvidenceVerificationResult,
  type VerifyEvidenceRecordOptions,
  verifyEvidenceRecord,
```

Task 6/7/8 全部通过 `@gis-engine/engine` 消费 `verifyEvidenceRecord`，所以这一步不做完，Task 6 的第一个 import 就编译不过。

- [ ] **Step 5: 跑测试**

Run: `pnpm build:schema && pnpm vitest run tests/evidence/record-verify.test.ts`
Expected: PASS

- [ ] **Step 6: 让测试承重（spec §9 负向层要求）**

逐条证明负向测试真的依赖实现，而不是恒真：

1. 把 `checkLineage` 的函数体首行改成 `return undefined;`（其余代码暂时不删），跑 `pnpm vitest run tests/evidence/record-verify.test.ts`。
   Expected: `reports EVIDENCE.DERIVATION_FAILED on a broken revision lineage` **失败**。若仍通过，说明该测试是装饰性的，必须先修测试。
2. 恢复 `checkLineage`，再把 `chainClosed` 的计算改成 `const chainClosed = typeof record.recordId === "string";`，跑同一条命令。
   Expected: `reports EVIDENCE.CHAIN_BROKEN when a data-bearing byte of the record changes` **失败**。
3. 两次都确认失败后 `git diff` 必须为空（实现回到原样），再跑一次全绿才允许提交。**这两步的失败输出要贴进 PR 描述**，否则无法证明负向覆盖承重。

- [ ] **Step 7: 诊断码同步锁 + 提交**

`tests/schema-sync/schema-sync.test.ts` 已有 "pins every DiagnosticCodes entry into the schema" 循环（`:176`），新码自动覆盖；追加一条锁定 verifier 侧字面量不漂移：

```ts
  it("locks EvidenceIssueCode literals into DiagnosticCodes", async () => {
    const { EvidenceIssueCode } = await import("@gis-engine/engine");

    for (const code of Object.values(EvidenceIssueCode)) {
      expect(Object.values(DiagnosticCodes)).toContain(code);
    }
  });
```

```bash
git add packages/engine/src/evidence packages/engine/src/diagnostics/codes.ts tests/evidence tests/schema-sync
git commit -m "feat(evidence): verify trust-tier assertions without replay"
```

---

## Task 6: 零依赖单文件 verifier + 断言 7 守卫（spec 第 2 步收尾）

**Files:**
- Create: `packages/engine/scripts/build-evidence-verifier.ts`
- Modify: `packages/engine/package.json`（`build` / `build:schema`）
- Create: `tests/evidence/standalone-verifier.test.ts`
- Modify: `packages/engine/src/evidence/record.ts`（CLI 入口）
- Modify: `.gitignore`（若 `packages/engine/dist` 未忽略则跳过）

**Interfaces:**
- Consumes: `record.ts` 编译产物 `packages/engine/dist/src/evidence/record.js`。
- Produces: `packages/engine/dist/evidence-verifier.mjs`（单文件、只依赖 `node:crypto`），CLI 契约：
  ```
  node evidence-verifier.mjs <evidence.json> [--root <dir>] [--json]
  exit 0 = ok:true；exit 2 = 至少一条 failed；exit 1 = 用法/IO 错误
  ```

- [ ] **Step 1: 写失败测试（§8 断言 4 + 断言 7）**

创建 `tests/evidence/standalone-verifier.test.ts`：

```ts
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { canonicalHash, DiagnosticCodes, EvidenceIssueCode, verifyEvidenceRecord } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import { MAP_JSON, buildFixture, sha256Of, validRecord } from "./fixtures/record.js";

const DIST_VERIFIER = resolve("packages/engine/dist/evidence-verifier.mjs");
const RECORD_MODULE = resolve("packages/engine/dist/src/evidence/record.js");

describe("standalone evidence verifier", () => {
  it("emits a single file whose only runtime imports are node builtins", () => {
    const source = readFileSync(DIST_VERIFIER, "utf-8");
    const imports = [...source.matchAll(/^import[^\n]*from\s+"([^"]+)"/gm)].map((match) => match[1]!);

    for (const specifier of imports) {
      expect(specifier.startsWith("node:")).toBe(true);
    }
  });

  it("ships the compiled engine record module verbatim inside the standalone file", () => {
    const verifier = readFileSync(DIST_VERIFIER, "utf-8");
    const compiledModule = readFileSync(RECORD_MODULE, "utf-8");

    expect(verifier).toContain(compiledModule);
  });

  it("agrees with the engine implementation on the same fixture", async () => {
    const directory = mkdtempSync(join(tmpdir(), "evidence-verifier-"));
    try {
      writeFileSync(join(directory, "evidence.json"), `${JSON.stringify(validRecord, null, 2)}\n`);
      writeFileSync(join(directory, "map.json"), MAP_JSON);

      const standalone = JSON.parse(
        execFileSync("node", [DIST_VERIFIER, join(directory, "evidence.json"), "--root", directory, "--json"], {
          encoding: "utf-8",
        }),
      );
      const engine = await verifyEvidenceRecord(validRecord, {
        readArtifact: async (path) => new TextEncoder().encode(readFileSync(join(directory, path), "utf-8")),
      });

      expect(standalone).toEqual({
        ok: engine.ok,
        assertions: engine.assertions,
        diagnostics: engine.diagnostics,
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("runs with no node_modules on the resolution path and still detects tampering", () => {
    const directory = mkdtempSync(join(tmpdir(), "evidence-isolated-"));
    try {
      const tampered = { ...validRecord, issuer: "attacker" };
      writeFileSync(join(directory, "evidence.json"), `${JSON.stringify(tampered)}\n`);
      writeFileSync(join(directory, "map.json"), MAP_JSON);
      writeFileSync(join(directory, "evidence-verifier.mjs"), readFileSync(DIST_VERIFIER, "utf-8"));

      let exitCode = 0;
      let stdout = "";
      try {
        stdout = execFileSync("node", ["evidence-verifier.mjs", "evidence.json", "--json"], {
          cwd: directory,
          encoding: "utf-8",
          env: { ...process.env, NODE_PATH: "" },
        });
      } catch (error) {
        exitCode = (error as { status?: number }).status ?? 0;
        stdout = String((error as { stdout?: string }).stdout ?? "");
      }

      expect(exitCode).toBe(2);
      expect(JSON.parse(stdout).diagnostics).toContainEqual(expect.objectContaining({ code: "EVIDENCE.CHAIN_BROKEN" }));
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("hashes raw bytes, not a decode/re-encode round-trip", async () => {
    // A CRLF + non-ASCII file is the cheapest way to prove the verifier reads bytes.
    const directory = mkdtempSync(join(tmpdir(), "evidence-bytes-"));
    try {
      const bytes = new Uint8Array(Buffer.from(`{"title":"公园"}\r\n`, "utf-8"));
      writeFileSync(join(directory, "label.json"), bytes);
      const record = buildFixture({
        artifacts: [{ path: "label.json", role: "data", bytes: bytes.byteLength, sha256: sha256Of(bytes) }],
      });
      writeFileSync(join(directory, "evidence.json"), JSON.stringify(record));

      const verdict = JSON.parse(
        execFileSync("node", [DIST_VERIFIER, join(directory, "evidence.json"), "--root", `${directory}/`, "--json"], {
          encoding: "utf-8",
        }),
      );

      expect(verdict.assertions.find((entry: { id: string }) => entry.id === "ARTIFACTS_MATCH").status).toBe("passed");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("keeps EvidenceIssueCode and DiagnosticCodes in sync", () => {
    for (const code of Object.values(EvidenceIssueCode)) {
      expect(Object.values(DiagnosticCodes)).toContain(code);
    }
    expect(canonicalHash({ a: 1 })).toBe(canonicalHash({ a: 1 }));
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm build && pnpm vitest run tests/evidence/standalone-verifier.test.ts`
Expected: FAIL — `ENOENT ... dist/evidence-verifier.mjs`。

- [ ] **Step 3: 加可注入的 CLI 函数（record.ts 内不碰 fs）**

`record.ts` 末尾追加。依赖全部注入，使 `record.js` 的 value import 仍只有 `node:crypto`；真正的 `fs` 由 Step 4 生成的 footer 提供：

```ts
export interface EvidenceVerifierCliDependencies {
  /** Must return raw bytes: the record hashes are over file bytes, so decoding to a
   *  JS string and re-encoding would break on any non-UTF8-clean artifact. */
  readFile: (path: string) => Promise<Uint8Array>;
  log: (line: string) => void;
}

export async function runEvidenceVerifierCli(
  argv: string[],
  deps: EvidenceVerifierCliDependencies,
): Promise<number> {
  const [recordPath, ...flags] = argv;
  if (!recordPath) {
    deps.log("usage: evidence-verifier <evidence.json> [--root <dir>] [--json]");
    return 1;
  }

  const rootIndex = flags.indexOf("--root");
  if (rootIndex >= 0 && !flags[rootIndex + 1]) {
    deps.log("--root requires a directory.");
    return 1;
  }
  const rawRoot = rootIndex >= 0 ? (flags[rootIndex + 1] as string) : "";
  const root = rawRoot.endsWith("/") || rawRoot === "" ? rawRoot : `${rawRoot}/`;

  let record: EvidenceRecord;
  try {
    const bytes = await deps.readFile(`${root}${recordPath}`);
    record = JSON.parse(new TextDecoder().decode(bytes)) as EvidenceRecord;
  } catch (error) {
    deps.log(`Could not read ${root}${recordPath}: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }

  const result = await verifyEvidenceRecord(record, {
    readArtifact: (path) => deps.readFile(`${root}${path}`),
  });

  deps.log(result.ok && !flags.includes("--json") ? JSON.stringify({ ok: true, assertions: result.assertions }) : JSON.stringify(result, null, 2));
  return result.ok ? 0 : 2;
}
```

> 默认 `--root` 为空字符串时 `readFile(recordPath)` 即按 cwd 解析，与 Step 1 测试里 `cwd: directory` 的用法一致；传 `--root` 时统一以 `/` 结尾拼接，避免 `join`/`path` 再引入 `node:path`。

同一批导出里补进 `evidence/index.ts` 与 `packages/engine/src/index.ts`：`type EvidenceVerifierCliDependencies`、`runEvidenceVerifierCli`（Task 7/8 的集成测试直接调它，不重复实现 CLI 装配）。

- [ ] **Step 4: 写构建脚本（守卫 + 尾注入口）**

单文件 = `shebang` + **编译产物逐字内嵌** + 一段读盘尾注。ESM 的 `import` 声明可以出现在模块顶层任意位置（会被提升），因此尾注里再写一条 `import` 合法，且 `runEvidenceVerifierCli` 已在同一文件内，无需再 import 自己。这样"两份实现"彻底不存在，Task 6 Step 1 的"逐字内嵌"断言就是防漂移的那道锁。

创建 `packages/engine/scripts/build-evidence-verifier.ts`：

```ts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const source = resolve("dist/src/evidence/record.js");
const target = resolve("dist/evidence-verifier.mjs");
const compiled = readFileSync(source, "utf-8");

const offenders = [...compiled.matchAll(/^import[^\n]*from\s+"([^"]+)"/gm)]
  .map((match) => match[1] as string)
  .filter((specifier) => !specifier.startsWith("node:"));

if (offenders.length > 0) {
  console.error(
    `evidence-verifier must stay dependency-free. Offending imports in ${source}:\n${offenders
      .map((offender) => `  ${offender}`)
      .join("\n")}`,
  );
  process.exitCode = 1;
} else {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(
    target,
    `#!/usr/bin/env node
${compiled}
import { readFile } from "node:fs/promises";

process.exitCode = await runEvidenceVerifierCli(process.argv.slice(2), {
  // No encoding option on purpose: readFile returns a Buffer, i.e. the raw bytes
  // the record's sha256 values were computed over.
  readFile: (path) => readFile(path),
  log: (line) => {
    process.stdout.write(line + "\\n");
  },
});
`,
    { mode: 0o755 },
  );
  console.log(`built ${target}`);
}
```

守卫失败即 `exit 1`，`pnpm build` 随之失败——不允许"先出包、以后再清依赖"。

- [ ] **Step 5: 接进构建**

`packages/engine/package.json`：

```json
    "build": "tsc -p tsconfig.json && node dist/scripts/build-evidence-verifier.js",
    "build:schema": "tsc -p tsconfig.json && node dist/scripts/build-schema.js && node dist/scripts/build-evidence-verifier.js"
```

- [ ] **Step 6: 跑门禁**

Run: `pnpm build && pnpm vitest run tests/evidence/standalone-verifier.test.ts`
Expected: PASS（6 passed）

再手动确认无 `node_modules` 可跑：

```bash
tmp=$(mktemp -d) && cp packages/engine/dist/evidence-verifier.mjs "$tmp/" && cd "$tmp" && node evidence-verifier.mjs 2>&1 | head -2
```
Expected: 打印 `usage: evidence-verifier <evidence.json> ...`，不是解析依赖失败。

- [ ] **Step 7: Commit**

```bash
git add packages/engine/scripts/build-evidence-verifier.ts packages/engine/package.json packages/engine/src/evidence/record.ts tests/evidence/standalone-verifier.test.ts
git commit -m "feat(evidence): ship a standalone zero-dependency evidence verifier"
```

---

## Task 7: CLI 导出包落盘 `evidence.json` + manifest 角色（spec 第 3 步 U4）

**Files:**
- Modify: `packages/cli/src/generate.ts:214`（`REQUIRED_REVIEW_FILES`）、`:216-224`（角色分类）、`:615-621`（evidence 写入块搬到 manifest 前）、`:654-664`（manifest 构造，顺序参照）
- Modify: `packages/cli/src/artifacts.ts:61-131`（复用 manifest 做字节级完整性）
- Create: `tests/cli/evidence-export.test.ts`
- Modify: `tests/cli/generate.test.ts:92`、`:208`、`:518-545`（见 Step 4b）
- Modify: `packages/ai/src/tools/generationEvidence.ts:599-614`、`:266`（bundle 加 `recordId`）
- Create: `docs/engineering/evidence-record.md`
- Modify: `skills/gis-engine-generation-pipeline/SKILL.md:105`、`:310`
- Modify: `README.md` / `CHANGELOG.md`（公开契约新增）
- Conditional: `config/package-size-budgets.json`（仅当 Step 5 实测超预算，理由写进 PR）

**Interfaces:**
- Consumes: `buildEvidenceRecord`、`verifyEvidenceRecord`、`canonicalHash`、Task 2 的 capability matrix、`applied.results`、`applied.spec`、`skeleton.baseSpec`、`skeleton.commands`、`promptHash`、`traceId`、`files`。
- Produces: 导出包内的 `evidence.json`（= `EvidenceRecord`）与 `evidence-verifier.mjs`；`artifact-manifest.json` 的 `role: "evidence"` 条目。

**这一步改的是已发布产物的内容，必须显式交出证据（不得自证放行）**

`evidence.json` 现在装的是 `GenerationEvidenceBundle`（`generate.ts:615-621` 直接 `writeFileSync(evidencePath, JSON.stringify(evidenceResult.result))`），本 task 让它装 `EvidenceRecord`。这是 AGENTS.md 意义上的公开契约变化，判定权在 @quality：

- 跑 `pnpm schema:diff`，把输出**原样**贴进 PR 描述；实现方不得加兼容层、不得同时写两份 `evidence.json`。
- 评审面不受损：`delivery-summary.json` 已经承载了 review 需要的 delivery 摘要（`CHANGELOG.md:63` 明确写了"reviewers can inspect delivery status without parsing the full `evidence.json`"），所以 bundle 从磁盘退场不会让 reviewer 少看到东西。
- `createGenerationEvidenceBundle` 本身保留为 ai 侧工具契约（`packages/ai/src/index.ts` 导出、MCP 路径仍在用），只是不再是 `evidence.json` 的宿主格式。

因此本 task 必须一并更新下列既有消费点（Step 4b），否则 `pnpm test:cli` 会红：

| 消费点 | 现在断言什么 | 改成 |
| --- | --- | --- |
| `tests/cli/generate.test.ts:92` 起的 `evidence` 变量 | 从 `evidence.json` 读 bundle 字段 | 读 `EvidenceRecord`，见 Step 4b 表 |
| `tests/cli/generate.test.ts:208` 同上 | 同上 | 同上 |
| `tests/cli/generate.test.ts:518-545`（`cli-generate-evidence-structure`） | `toHaveProperty("delivery")`、`promptHash` | `recordId` / `schemaVersion` / `origin.promptHash` / 不含原始 prompt |
| `skills/gis-engine-generation-pipeline/SKILL.md:105`、`:310` | 描述 bundle 结构 | 描述 `EvidenceRecord` + 复算命令 |

- [ ] **Step 1: 写失败测试**

`tests/cli/generate.test.ts:308-328` 已确立驱动方式：直接调用 `main()` 并 `process.chdir` 到临时目录。据此创建 `tests/cli/evidence-export.test.ts`：

```ts
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EvidenceRecordSchema, verifyEvidenceRecord } from "@gis-engine/engine";
import { main, verifyArtifacts } from "@gis-engine/cli";
import Ajv from "ajv";
import { describe, expect, it, vi } from "vitest";

const ajv = new Ajv({ strict: false });

async function generateInto(projectName: string): Promise<{ dir: string; projectDir: string }> {
  const dir = mkdtempSync(join(tmpdir(), `gis-${projectName}-`));
  const cwd = process.cwd();
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  process.chdir(dir);
  try {
    await main([projectName, "--generate", "--provider", "mock", "--prompt", "Show parks in NYC", "--yes"]);
    return { dir, projectDir: join(dir, projectName) };
  } finally {
    process.chdir(cwd);
    logSpy.mockRestore();
    errorSpy.mockRestore();
    vi.restoreAllMocks();
  }
}

describe("CLI evidence export", () => {
  it("writes a schema-valid EvidenceRecord and links it into the manifest", async () => {
    const { dir, projectDir } = await generateInto("evidence-valid");
    try {
      const record = JSON.parse(readFileSync(join(projectDir, "evidence.json"), "utf-8"));
      const manifest = JSON.parse(readFileSync(join(projectDir, "artifact-manifest.json"), "utf-8"));

      expect(ajv.compile(EvidenceRecordSchema)(record)).toBe(true);
      expect(manifest.files).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "evidence.json", role: "evidence", required: true }),
          expect.objectContaining({ path: "evidence-verifier.mjs", role: "evidence" }),
        ]),
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("produces a package the trust-tier verifier recomputes clean", async () => {
    const { dir, projectDir } = await generateInto("evidence-verify");
    try {
      const record = JSON.parse(readFileSync(join(projectDir, "evidence.json"), "utf-8"));

      const result = await verifyEvidenceRecord(record, {
        readArtifact: async (path) => new Uint8Array(readFileSync(join(projectDir, path))),
      });

      expect(result.assertions.filter((entry) => entry.status === "failed")).toEqual([]);
      expect(result.assertions.map((entry) => entry.status)).toContain("not-covered");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("catches a byte-level swap of evidence.json through the manifest", async () => {
    const { dir, projectDir } = await generateInto("evidence-tamper");
    try {
      // Same tamper pattern tests/cli/generate.test.ts:282 already uses for map.json.
      expect(verifyArtifacts({ projectDir }).ok).toBe(true);

      const record = JSON.parse(readFileSync(join(projectDir, "evidence.json"), "utf-8"));
      writeFileSync(join(projectDir, "evidence.json"), `${JSON.stringify({ ...record, issuer: "attacker" })}\n`);

      const tampered = verifyArtifacts({ projectDir });
      expect(tampered.ok).toBe(false);
      expect(tampered.summary.hashMismatchCount + tampered.summary.byteMismatchCount).toBeGreaterThan(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
```

第 3 条正是 §8 断言 3 与「偏差 D3」的落点：`recordId` 覆盖数据模型，格式与内容级字节篡改由 `artifact-manifest.json` 的 `sha256` 兜住。

拒绝路径（记录超限 ⇒ 不写 `evidence.json` 且 `process.exitCode === 1`）在 Task 4 Step 1 已有 `{ ok: false }` 单测，本 task 只需在 Step 3 实现后用一条 `vi.mock("@gis-engine/engine", ...)` 的部分 mock 断言 CLI 分支；**不得为了让包能导出而放宽 `MAX_EVIDENCE_RECORD_BYTES`，也不得用截断字段来避免超限。**

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm build && pnpm vitest run tests/cli/evidence-export.test.ts`
Expected: FAIL — 现有 `evidence.json` 是 `GenerationEvidenceBundle`，不过 `EvidenceRecordSchema`。

- [ ] **Step 3: generate.ts 构造并写入 EvidenceRecord**

先在 `packages/cli/src/generate.ts` 顶部补导入（`@gis-engine/engine` 已有 import 块，往里面加）：

```ts
  buildEngineCapabilityMatrix,
  buildEvidenceRecord,
  canonicalHash,
  createSourceReadinessReport,
  type EvidenceRecordCommand,
```

再加两个本地 helper（放在 `hashFileSha256` 旁边，`:226` 附近）：

```ts
function readEngineVersion(): string {
  try {
    const pkg = createRequire(import.meta.url).resolve("@gis-engine/engine/package.json");
    return (JSON.parse(readFileSync(pkg, "utf-8")) as { version: string }).version;
  } catch {
    return "unknown";
  }
}

function readPackageManagerVersion(): string {
  // pnpm sets npm_config_user_agent="pnpm/11.9.0 npm/? node/..."; spawning pnpm here
  // would add a process per generate run for a string we already have.
  const agent = process.env.npm_config_user_agent ?? "";
  return agent.match(/^pnpm\/([\d.]+)/)?.[1] ?? "unknown";
}
```

**写入顺序是这一步的重点**：记录里的 `artifacts[]` 不能自指，所以 `evidence.json` 必须在其它所有产物（含模板文件与 `evidence-verifier.mjs`）落盘之后、`artifact-manifest.json` 之前生成。把现有 `:615-621` 的 evidence 写入块从模板块前面**移到模板块之后、manifest 块（`:654-664`）之前**，并替换为：

```ts
    // evidence-verifier.mjs ships beside the record so a third party needs nothing else.
    const verifierTarget = join(outDir, "evidence-verifier.mjs");
    copyFileSync(resolveVerifierPath(), verifierTarget);
    files.push("evidence-verifier.mjs");

    const commandById = new Map(skeleton.commands.map((command) => [command.id, command]));
    const evidenceCommands: EvidenceRecordCommand[] = applied.results.map((result) => {
      const command = commandById.get(result.commandId);
      if (!command) throw new Error(`Command ${result.commandId} missing from generation skeleton.`);

      return {
        command,
        outcome: result.status,
        diagnostics: result.diagnostics,
        inversePatchHash: canonicalHash(result.inversePatch ?? []),
        ...(result.baseRevision ? { baseRevision: result.baseRevision } : {}),
        ...(result.nextRevision ? { nextRevision: result.nextRevision } : {}),
      };
    });

    const evidenceRecord = buildEvidenceRecord({
      project: {
        id: opts.projectName,
        baseRevision: applied.results[0]?.baseRevision ?? "initial",
        revision: applied.results[applied.results.length - 1]?.nextRevision ?? "initial",
      },
      origin: {
        actor: `provider:${opts.provider}`,
        providerKind: "cli-generate",
        promptHash,
      },
      commands: evidenceCommands,
      spec: {
        beforeHash: canonicalHash(skeleton.baseSpec),
        afterHash: canonicalHash(applied.spec),
        diffHash: canonicalHash(applied.results.flatMap((result) => result.changedPaths)),
      },
      artifacts: files.map((path) => ({
        path,
        role: classifyGeneratedArtifact(path),
        bytes: statSync(join(outDir, path)).size,
        sha256: hashFileSha256(join(outDir, path)),
      })),
      capabilities: buildEngineCapabilityMatrix({ readiness: createSourceReadinessReport(applied.spec).sources }),
      toolchain: {
        engineVersion: readEngineVersion(),
        nodeMajor: process.versions.node.split(".")[0] ?? "unknown",
        pnpmVersion: readPackageManagerVersion(),
      },
      issuer: "gis-engine-cli",
      issuedAt: new Date().toISOString(),
    });

    if (!evidenceRecord.ok) {
      rmSync(outDir, { recursive: true, force: true });
      console.error(`Evidence record rejected:\n${JSON.stringify(evidenceRecord.diagnostics, null, 2)}`);
      process.exitCode = 1;
      return;
    }

    const evidencePath = join(outDir, "evidence.json");
    writeFileSync(evidencePath, `${JSON.stringify(evidenceRecord.record, null, 2)}\n`, "utf-8");
    files.push("evidence.json");
```

`resolveVerifierPath()` 集中"monorepo 源码树 vs 已安装包"的路径差异，放在同文件：

```ts
function resolveVerifierPath(): string {
  try {
    return createRequire(import.meta.url).resolve("@gis-engine/engine/dist/evidence-verifier.mjs");
  } catch {
    // Workspace runs resolve through the source tree before the package is packed.
    return fileURLToPath(new URL("../../engine/dist/evidence-verifier.mjs", import.meta.url));
  }
}
```

需要的 node 导入补 `copyFileSync`、`rmSync`（`node:fs` 那行现状是 `mkdirSync, readFileSync, statSync, writeFileSync`，位于 `:14`）。`createRequire`（`:15`）、`join` / `resolve`（`:16`）、`fileURLToPath`（`:17`）已在文件里，别重复 import。`@gis-engine/engine` 的 import 行在 `:22`，Step 3 开头那五个符号加进那一处。

`REQUIRED_REVIEW_FILES`（`:214`）加 `"evidence.json"`；`classifyGeneratedArtifact`（`:216`）加一行：

```ts
  if (path === "evidence-verifier.mjs") return "evidence";
```

`evidence.json` 的角色已是 `"evidence"`（`:221` 现有分类已覆盖）。

- [ ] **Step 4: `GenerationEvidenceBundle` 收敛为视图（不并列第二套契约）**

`packages/ai/src/tools/generationEvidence.ts:599-614` 的接口新增：

```ts
  /** Canonical EvidenceRecord this bundle is the tool-facing view of. */
  recordId?: string;
```

并在 `:266` 的手写 JSON Schema 里加同名可选属性（`pattern: "^sha256:[a-f0-9]{64}$"`）。CLI/Workbench 在拿到 `EvidenceRecord` 后把 `recordId` 回填进 bundle。**本切片不重写 bundle 其余字段**——它是 ai 侧视图，不是对外契约，全面替换超出子项目 A 边界（记录在 PR 描述里，并建一条后续 issue）。

- [ ] **Step 4b: 更新既有消费点（不更新则 `pnpm test:cli` 必红）**

`tests/cli/generate.test.ts` 现有三处按 bundle 形状读 `evidence.json`，逐处改为按 `EvidenceRecord` 读：

0. 因为 `evidence.json` 进了 `REQUIRED_REVIEW_FILES`，`:123-128` 与 `:239-244` 两处 `manifest.requiredReviewFiles` 的**精确数组**断言各多一项，两处都改为：

```ts
      expect(manifest.requiredReviewFiles).toEqual([
        "map.json",
        "preflight.json",
        "delivery-summary.json",
        "REVIEW.md",
        "evidence.json",
      ]);
```

`:140-144` 与 `:257` 的 `required: false` 随之改成 `required: true`。REVIEW.md 的 "Review Files" 清单由 `requiredReviewFiles` 渲染（`:255-258` 的循环已自动覆盖），不必单独改。

1. `:92` 的 `reviewable-map` 用例：`evidence` 变量此后只被 `:140-144` 的 manifest 角色断言消费（角色不变），因此只需在该处补一条记录形状断言：

```ts
      expect(evidence).toMatchObject({
        schemaVersion: "evidence-record.v0.1",
        issuer: "gis-engine-cli",
        origin: { providerKind: "cli-generate", promptHash: summary.promptHash },
      });
      expect(evidence.recordId).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(JSON.stringify(evidence)).not.toContain("private customer locations");
```

2. `:208` 的 `auditable-map` 用例：`:243-244` 现在有

```ts
      expect(summary.delivery.sections).toEqual(evidence.delivery.sections);
      expect(summary.delivery.spatialQueryReadiness).toEqual(evidence.delivery.spatialQueryReadiness);
```

这两行把 `delivery-summary.json` 与**已发布**的 bundle 对拉，是它唯一的一致性锚点。bundle 不再上磁盘后该锚点消失，改成对拉记录内的事实：

```ts
      const recordFiles = new Set(
        (evidence.artifacts as Array<{ path: string }>).map((artifact) => artifact.path),
      );
      expect(recordFiles.has("delivery-summary.json")).toBe(true);
      expect(recordFiles.has("map.json")).toBe(true);
      expect(canonicalHash(specOf(mapBytes))).toBe(evidence.spec.afterHash);
```

并在该文件顶部 import 块补 `import { canonicalHash } from "@gis-engine/engine";`。`specOf` 不必新造：`map.json` 落盘时已含完整 spec（`generate.ts:591` 用 `JSON.stringify(applied.spec, null, 2)`），而 `canonicalStringify` 与键序无关，所以 `JSON.parse(mapBytes)` 直接可用作输入：

```ts
function specOf(mapBytes: Buffer): unknown {
  return JSON.parse(mapBytes.toString("utf-8")) as unknown;
}
```

**已知代价（必须写进 PR 描述，不许藏）**：`summary.delivery.sections` 与 bundle 的等值交叉检查随之退役；`delivery-summary.json` 的 delivery 结构改由 Task 4 的 schema 层 + 该用例内已有的 `summary` 形状断言覆盖。这是一次真实的一致性覆盖减弱，不是等价替换——由 @quality 判定是否接受，或要求把 delivery 摘要并入 `EvidenceRecord` 的后续切片。

3. `:518-545` 的 `cli-generate-evidence-structure` 用例：

```ts
        expect(evidence).toHaveProperty("recordId");
        expect(evidence).toHaveProperty("commands");
        expect(evidence.origin.promptHash).toMatch(/^sha256:/);
        expect(evidence.assertions).toBeUndefined();
        expect(JSON.stringify(evidence)).not.toContain("Test evidence structure");
```

`assertions` 属于 verify 的输出而非记录字段，所以这条断言是防有人把复算结果误写进 `evidence.json`。

4. `skills/gis-engine-generation-pipeline/SKILL.md:105` 的文件表与 `:310` 的结构说明改为描述 `EvidenceRecord` 字段，并补上 Step 6 文档里的复算命令。该文件是 skill 文档不是 coordination surface，但内容失真同样不可接受。

- [ ] **Step 5: 跑门禁**

Run: `pnpm build && pnpm test:cli && pnpm test:evidence && pnpm test:schema-sync && pnpm size:check`
Expected: PASS。`size:check` 若因新增 `evidence-verifier.mjs` 与 `evidence.json` 超预算而失败：按 `config/package-size-budgets.json` 的 `advisoryRegressionPercent` 判定，超预算必须**更新预算文件并在 PR 里给出实测数字与理由**，不能静默调高。

- [ ] **Step 6: 文档**

创建 `docs/engineering/evidence-record.md`，只写第三方需要知道的三件事：

```markdown
# EvidenceRecord 对外复算

一次 AI 改动导出的包里有 `evidence.json` 与 `evidence-verifier.mjs`。复算不需要本项目源码、
不需要 npm 依赖、不需要网络：

    node evidence-verifier.mjs evidence.json --root . --json

结论形态固定为 `{ ok, assertions[], diagnostics[] }`。`assertions[].status` 取
`passed | failed | not-covered`；`VISUAL_CONSISTENCY` 与 `OFFLINE_REPLAY` 在当前范围下恒为
`not-covered`——这两项是被主动推迟的，不是实现遗漏。

断言语义：

| id | 复算了什么 |
| --- | --- |
| `CHAIN_CLOSED` | `recordId` 等于正文的规范化 SHA-256，改一个数据字节即失败 |
| `ARTIFACTS_MATCH` | 每个文件的 sha256 与字节数与记录一致 |
| `DERIVATION_CLOSED` | 命令序列的 revision 链与逆补丁哈希在记录内自洽（不执行命令） |
| `TOOLCHAIN_RECORDED` | 引擎 / Node / pnpm 版本已入记录 |

字节级（含格式）完整性由 `artifact-manifest.json` 兜住：`pnpm --filter @gis-engine/cli verify <dir>`。
```

更新 `docs/README.md` 索引与 `CHANGELOG.md`；Run: `node scripts/doc-generator.mjs links` → Expected: `✅ 所有活动文档交叉引用完整`。

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src docs/engineering/evidence-record.md docs/README.md CHANGELOG.md config/package-size-budgets.json tests/cli
git commit -m "feat(cli): write verifiable EvidenceRecord into export packages"
```

---

## Task 8: 外部彩排——第三方复算进 smoke 步骤（spec §9 外部彩排行）

**Files:**
- Modify: `scripts/cli-install-smoke.mjs:118-131`（"Generated app verification" 步骤之后插入新步骤）
- Modify: `scripts/first-run-acceptance.mjs:183-186`（Required Review Files 清单）、`:190`（报告表行）
- Modify: `tests/framework/smoke-report-contract.test.ts:10-40`
- Create: `tests/framework/evidence-recompute-step.test.ts`

**Interfaces:**
- Consumes: Task 6 的 verifier CLI 契约（exit 0/1/2）、Task 7 的导出包（含 `evidence.json` 与 `evidence-verifier.mjs`）。`cli-install-smoke` 已经把本地包 pack 成 tarball 装进一个**全新 consumer 目录**（`:42-53`），那正是"第三方只拿到包"的现实形态——复算步骤挂在这里比挂在别处都更有说服力。
- Produces: `result.steps` 里一条 `{ name: "Third-party evidence recompute", status, evidence }`，自动出现在 `first-run-acceptance` 报告的 "CLI Install Smoke Breakdown" 表里。

- [ ] **Step 1: 写失败测试**

创建 `tests/framework/evidence-recompute-step.test.ts`：

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("third-party evidence recompute rehearsal", () => {
  it("runs the shipped verifier against the generated package inside the smoke", () => {
    const smoke = readFileSync(new URL("../../scripts/cli-install-smoke.mjs", import.meta.url), "utf8");

    expect(smoke).toContain("Third-party evidence recompute");
    expect(smoke).toMatch(/evidence-verifier\.mjs/);
    expect(smoke).toMatch(/--json/);
  });

  it("lists evidence.json among the required review files in the report", () => {
    const acceptance = readFileSync(new URL("../../scripts/first-run-acceptance.mjs", import.meta.url), "utf8");

    expect(acceptance).toContain("- `evidence.json`");
  });
});
```

Run: `pnpm vitest run tests/framework/evidence-recompute-step.test.ts` → Expected: FAIL。

- [ ] **Step 2: 加复算步骤**

`scripts/cli-install-smoke.mjs` 在 "Prompt safety" 那个 `runStep(...)` 之前插入（沿用 `runStep(result, name, evidence, action)` 与 `execFileSync`/`assertSmokeResult`，不新造形状）：

```js
    runStep(
      result,
      "Third-party evidence recompute",
      "Recomputed the shipped EvidenceRecord with the packaged zero-dependency verifier and detected a tampered record.",
      () => {
        const verdict = runJson(
          "node",
          ["evidence-verifier.mjs", "evidence.json", "--json"],
          generatedProjectDir,
        );
        assertSmokeResult(verdict.ok === true, "Standalone evidence recompute did not pass.");
        assertSmokeResult(
          verdict.assertions.every((entry) => entry.status !== "failed"),
          "Standalone evidence recompute reported a failed assertion.",
        );
        assertSmokeResult(
          verdict.assertions.some(
            (entry) => entry.status === "not-covered" && entry.id === "VISUAL_CONSISTENCY",
          ),
          "Recompute must state visual consistency is not covered rather than staying silent.",
        );

        const tamperedPath = join(generatedProjectDir, "evidence.json");
        const original = readFileSync(tamperedPath, "utf-8");
        writeFileSync(tamperedPath, original.replace(/"issuer":\s*"[^"]*"/, '"issuer": "tampered-by-rehearsal"'));
        try {
          execFileSync("node", ["evidence-verifier.mjs", "evidence.json", "--json"], {
            cwd: generatedProjectDir,
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "inherit"],
          });
          assertSmokeResult(false, "Tampered EvidenceRecord did not fail the recompute.");
        } catch (error) {
          const code = error?.status ?? 0;
          assertSmokeResult(
            code === 2,
            `Tampered EvidenceRecord exited with ${code}; expected the verifier's blocked code 2.`,
          );
        } finally {
          writeFileSync(tamperedPath, original);
        }
      },
    );
```

顶部 `import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";`——按现状补齐缺的 `readFileSync` / `writeFileSync`。`runJson(command, args, cwd)` 已在该文件内（"Generated app verification" 步骤在用），沿用它的 cwd 语义：在 `generatedProjectDir` 内以裸 `node` 跑包内的 `evidence-verifier.mjs`，`node_modules` 只含装进来的 tarball，不指向仓库。

- [ ] **Step 3: 报告侧对齐**

`scripts/first-run-acceptance.mjs` 的 "Required Review Files" 列表（`:183-188`）加一行 `- \`evidence.json\``。报告表格不必改——新步骤会自动出现在 `renderSmokeBreakdown` 生成的步骤表里（`first-run-acceptance.mjs:218-236`）。

`tests/framework/smoke-report-contract.test.ts` 的 "renders a smoke breakdown" 用例（`:10`）在其 fixture steps 里加一条同形条目，并断言渲染出的表格里含该名字：

```ts
      { name: "Third-party evidence recompute", status: "passed", evidence: "Recomputed with the shipped verifier." },
```

```ts
    expect(report).toContain("| Third-party evidence recompute | passed |");
```

- [ ] **Step 4: 跑验收**

Run: `pnpm vitest run tests/framework/evidence-recompute-step.test.ts tests/framework/smoke-report-contract.test.ts`
Expected: PASS。

Run: `node scripts/first-run-acceptance.mjs --max-minutes 30`
Expected: 报告 `Status: **passed**`，"CLI Install Smoke Breakdown" 表含 `Third-party evidence recompute | passed`。这一步会真跑 pack + install，耗时最长；若超预算，先确认超时来自 pack 而非复算本身，再决定是否单独调预算——**不得为了让彩排通过而删步骤**。

Run: `pnpm test:agent-framework && pnpm test:docs`
Expected: PASS（`scripts/**` 属 coordination surface）。

- [ ] **Step 5: Commit**

```bash
git add scripts/cli-install-smoke.mjs scripts/first-run-acceptance.mjs tests/framework
git commit -m "test(acceptance): rehearse third-party evidence recomputation end to end"
```

---

## Task 9:（分支门控）Workbench 哈希收敛 + receipt 绑定 `recordId`（spec 第 3 步 U5）

**前置条件（未满足则整条 task 阻塞并上报 @orchestrator，不自行推进）：** `codex/workbench-v1` 与 PR #112 的合并顺序已由人决定。**本 task 不做在 main 上**——`apps/workbench` 在 main 不存在。

**Files（分支上）:**
- Modify: `apps/workbench/contracts/hash.ts:18-20`
- Modify: `apps/workbench/contracts/schemas.ts`（`WorkbenchExportReceiptSchema` 加 `recordId`）
- Modify: `apps/workbench/server/export-service.mjs:178-193`（receipt 构造）、`:288`（`fileRole`）
- Modify: `tests/workbench/workbench-contracts.test.ts`、`tests/workbench/workbench-export.test.ts`

**Interfaces:**
- Consumes: `canonicalHash`（engine，Task 3）、Task 7 产出的包内 `evidence.json`。分支上 `commitWorkbenchExport(projectRoot, preview, confirmation, options)` 是唯一 receipt 出口。
- Produces: receipt 内的 `recordId`；Workbench 不再有第二份 canonical hash 实现。

- [ ] **Step 1: 写失败测试**

追加到 `tests/workbench/workbench-contracts.test.ts`（该文件已有 Workbench contract 层用例，沿用它的 import 风格）：

```ts
import { canonicalHash } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import { createWorkbenchCanonicalHash } from "../../apps/workbench/contracts/hash.ts";

describe("workbench canonical hash convergence", () => {
  it("delegates canonical hashing to the single engine implementation", () => {
    const value = { z: 1, a: { y: 2, x: [3, { b: 1, a: 2 }] } };

    expect(createWorkbenchCanonicalHash(value)).toBe(canonicalHash(value));
  });
});
```

追加到 `tests/workbench/workbench-export.test.ts`。该文件顶部已有 `import { verifyArtifacts } from "@gis-engine/cli";`、`import { commitWorkbenchExport, previewWorkbenchExport } from "../../apps/workbench/server/export-service.mjs";`、`const roots: string[]`、`const now = () => "2026-08-19T01:00:00.000Z"` 和 `async function projectRoot()`（`:1-27`）——直接复用，不要重新声明。把它放在文件末尾的 `describe("workbench export", ...)` 内：

```ts
  it("binds the export receipt to the evidence record id", async () => {
    const root = await projectRoot();
    const recordId = `sha256:${"b".repeat(64)}`;
    const preview = await previewWorkbenchExport(root, { targetRelativePath: "exports/delivery-map" }, { now });
    if (!preview.ok) throw new Error("preview failed");

    const committed = await commitWorkbenchExport(
      root,
      preview.result,
      { previewHash: preview.result.previewHash, recordId },
      { now },
    );

    expect(committed).toMatchObject({ ok: true, result: { recordId } });
  });

  it("rejects a malformed record id on the export confirmation", async () => {
    const root = await projectRoot();
    const preview = await previewWorkbenchExport(root, { targetRelativePath: "exports/delivery-map" }, { now });
    if (!preview.ok) throw new Error("preview failed");

    expect(
      await commitWorkbenchExport(
        root,
        preview.result,
        { previewHash: preview.result.previewHash, recordId: "not-a-hash" },
        { now },
      ),
    ).toMatchObject({ ok: false, diagnostics: [{ code: "WORKBENCH.EXPORT_RECEIPT_INVALID" }] });
  });
```

`{ targetRelativePath: "exports/delivery-map" }` 是该文件既有用例的入参字面量（`workbench-export.test.ts:69`），照抄而来，不是新造。

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run tests/workbench/workbench-contracts.test.ts tests/workbench/workbench-export.test.ts`
Expected: FAIL（receipt 无 `recordId`；两处哈希实现在 undefined 键序上已可分叉）。

- [ ] **Step 3: 收敛 + 绑定**

`apps/workbench/contracts/hash.ts` 把实现改为委托：

```ts
import { canonicalHash } from "@gis-engine/engine";

export function createWorkbenchCanonicalHash(value: unknown): string {
  return canonicalHash(value);
}
```

删掉本地 `stableStringify` 与 `sha256`。`createWorkbenchPromptHash` / `createWorkbenchPlanHash` 保持导出名不变（它们只是字段选择器）。**两者语义与 engine 完全相同（同为 `sha256(stableStringify)`），所以这一步不改变任何已存哈希值**——若 workbench 测试出现哈希 diff，说明改动越界了。

`apps/workbench/server/export-service.mjs`：

1. `commitWorkbenchExport` 在构造 receipt 前核对入参（`preview` 已在 `:138` 校验过 `specHash`，同一风格）：

```js
    const recordId = typeof confirmation.recordId === "string" ? confirmation.recordId : "";
    if (recordId && !/^sha256:[a-f0-9]{64}$/.test(recordId)) {
      return failure(WorkbenchDiagnosticCodes.ExportReceiptInvalid, "Export receipt recordId is malformed.", "/recordId");
    }
```

2. receipt 对象（`:178-186`）内加：

```js
      ...(recordId ? { recordId } : {}),
```

3. `WorkbenchExportReceiptSchema` 的 `properties` 加 `recordId: { type: "string", pattern: "^sha256:[a-f0-9]{64}$" }`，保持可选（不进 `required`），这样旧 receipt 仍可回放。

4. `fileRole`（`:288`）加 `evidence.json` 与 `evidence-verifier.mjs` → `"evidence"`。

`evidence.json` 的内容由 Workbench 调 Task 4 的 `buildEvidenceRecord` 生成，**字段一律来自 engine 契约，Workbench 不自行定义证据字段**（spec §4 U5 行）。Workbench 侧的构造点在导出 staging 写文件处（`previewWorkbenchExport` 生成 `stagedFiles` 之前），与 Task 7 Step 3 的形态一致。

- [ ] **Step 4: 跑门禁 + 提交**

Run: `pnpm test:workbench && pnpm build:schema && pnpm test:schema-sync`
Expected: PASS。视觉快照按 Global Constraints 第 9 条豁免，理由写进 PR。

```bash
git add apps/workbench tests/workbench
git commit -m "refactor(workbench): reuse engine canonical hash and bind evidence record"
```

---

## 完成判定

子项目 A 完成的唯一标准：

1. `pnpm build:schema && pnpm check && pnpm test:evidence` 全绿。
2. spec §8 断言 1、2、3、4、6、7 有对应测试，且 Task 5 Step 6 证明它们是承重的。
3. 一个全新 clone 之外的人，只拿到导出包，跑 `node evidence-verifier.mjs evidence.json --root .` 得到 `ok: true`，且结论里 `VISUAL_CONSISTENCY` / `OFFLINE_REPLAY` 显式为 `not-covered`。
4. MCP 工具名与数量不变（14 个，顺序一致）；`pnpm schema:diff` 的输出已附进 PR，由 @quality 判定 `outputSchema` 变化是否构成 breaking change。
5. `evidence.json` 内容格式变更（bundle → `EvidenceRecord`）的 `pnpm schema:diff` 证据 + Step 4b 的「已知代价」（delivery 交叉检查退役）已一并交 @quality 判定，不由实现方自行放行。
6. PR 描述含视觉快照豁免理由 + `GenerationEvidenceBundle` 全面替换的后续 issue 链接。

断言 5（PMTiles 数据入链）属子项目 B，不在本计划验收内。
