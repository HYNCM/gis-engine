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

**状态更新（Task 4 已提前落）**：这六个 `EVIDENCE.*` 码已由 Task 4 按本文件逐字插入 `packages/engine/src/diagnostics/codes.ts`（Task 4 的 `issue(): Diagnostic` 在 `strict` 下必须它们存在才能编译）。本步改为**核对存在且值一致**，不要再插一遍——重复键是 TS1117 编译错误。

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
import { type EvidenceRecord, verifyEvidenceRecord } from "@gis-engine/engine/evidence";
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
} from "@gis-engine/engine/evidence";
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

`record.ts` 追加（保持"value import 只有 `node:crypto`"）。同一 commit 里必须把
`buildEvidenceRecord` 现有的
`const payload = JSON.parse(JSON.stringify({ ...record, recordId: undefined }));` 换成
`const payload = normaliseEvidencePayload({ ...record, recordId: undefined });`，并在
`payload === undefined` 时 `return { ok: false, diagnostics: [issue(<约束 7 文案>, "/")] }`——
builder 与 verifier 只能共用这一个归一化表达式：

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

/**
 * The one normalisation expression both builder and verifier hash: a JSON round trip reproduces
 * exactly what the transport does with `undefined`-valued keys (Task 4 review I-4). `buildEvidenceRecord`
 * must call this too — two spellings of the same hash contract is how honest records start
 * reporting CHAIN_BROKEN. Unserialisable input (cyclic graph, BigInt leaf) yields `undefined`
 * instead of throwing: constraint 7 requires failures to be structured diagnostics, and Task 4's
 * round-2 ruling totalises it here once rather than in two try/catch sites.
 */
export function normaliseEvidencePayload<T>(value: T): T | undefined {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return undefined;
  }
}

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

  const chainPayload = normaliseEvidencePayload({ ...record, recordId: undefined });
  const chainClosed =
    chainPayload !== undefined &&
    typeof record.recordId === "string" &&
    record.recordId === canonicalHash(chainPayload);
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

