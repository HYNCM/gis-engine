## Task 2: 能力矩阵进 `get_context_summary` + `validate_spec`（spec 第 0 步下半）

**Files:**
- Modify: `packages/ai/src/tools/contextSummary.ts:112-149`（`ContextSummary` 接口）、`:234`（构造点）、`:459`（readiness 映射）
- Modify: `packages/ai/src/mcp/server.ts:128-145`（`ValidationReportSchema`）、`:410-459`（`ContextSummaryToolResultSchema`）、`:848-856`（`validate_spec` handler）
- Modify: `packages/ai/src/index.ts`（导出新 schema）
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

`ValidationReportSchema` 补字段（`properties` 与 `required` 各一处）：

```ts
    capabilities: EngineCapabilityMatrixContractSchema,
```

```ts
  required: ["valid", "diagnostics", "stats", "capabilities"],
```

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

