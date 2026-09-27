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

