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
import { buildEngineCapabilityMatrix } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

function blockedSourceEntry(sourceId: string) {
  return { sourceId, type: "pmtiles", state: "blocked" } as never;
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
      readiness: [blockedSourceEntry("parcels"), { sourceId: "roads", type: "geojson", state: "supported" } as never],
    });

    expect(matrix.blocked).toContainEqual(
      expect.objectContaining({ code: "CAPABILITY.UNSUPPORTED", path: "/sources/parcels" }),
    );
    expect(matrix.available).toContain("source.geojson");
    expect(matrix.available).not.toContain("source.pmtiles");
  });

  it("never lists a capability that has no truth source behind it", () => {
    const matrix = buildEngineCapabilityMatrix();

    expect(matrix.available).toEqual([
      "mapspec.validate",
      "commands.apply",
      "export.spec",
      "snapshot.smoke-mock",
      "evidence.build",
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

  for (const entry of input.readiness ?? []) {
    if (entry.state === "supported") {
      available.add(`source.${entry.type}`);
      continue;
    }
    if (entry.state === "blocked") {
      blocked.push({
        code: DiagnosticCodes.CapabilityUnsupported,
        reason: `source "${entry.sourceId}" of type "${entry.type}" is ${entry.state} at runtime.`,
        path: `/sources/${entry.sourceId}`,
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
Expected: PASS（5 passed）

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

