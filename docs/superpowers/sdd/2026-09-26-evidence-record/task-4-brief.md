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
- Consumes: `canonicalHash`（Task 3，从 `@gis-engine/engine/evidence` 取）、`MapCommandSchema` / `DiagnosticSchema`（`spec/schemas/`）、`stripNestedIds`（`spec/schemas/generation.schema.ts`）、`EngineCapabilityMatrix`（Task 1）。
- Produces（`@gis-engine/engine/evidence` 公开面；根 barrel 只放类型与 schema 等无 `node:` 依赖的符号）:
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
} from "@gis-engine/engine/evidence";
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
    expect(record.recordId).toBe(
      canonicalHash(JSON.parse(JSON.stringify({ ...record, recordId: undefined }))),
    );
    // The record must survive the transport it is actually delivered over, byte for byte.
    expect(canonicalHash(JSON.parse(JSON.stringify({ ...JSON.parse(JSON.stringify(record)), recordId: undefined })))).toBe(
      record.recordId,
    );
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

在 `packages/engine/src/evidence/record.ts` 追加（**只允许 `import type`；value import 仍只有 `node:crypto` 与闭包内的 `./canonical-stringify.js`**）：

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
    // Sorted + de-duplicated: canonical hashing preserves array order, so a caller passing the same
    // exclusion set in a different order must not get a different recordId (same ruling as Task 1).
    exclusions: [...new Set(input.exclusions ?? DEFAULT_EXCLUSIONS)].sort(),
  };

  // Hash the exact bytes a consumer will re-parse, not the in-memory object: JSON.stringify drops
  // undefined-valued keys while canonicalStringify renders them as null.
  const payload = JSON.parse(JSON.stringify({ ...record, recordId: undefined }));
  record.recordId = canonicalHash(payload);

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

**`recordId` 的自指处理**：先把 `recordId` 置为占位，再对 **`JSON.parse(JSON.stringify(...))` 归一化后的**对象求哈希。归一化这一步是契约的一部分，不是风格问题：`canonicalStringify` 把 `undefined` 值渲染成 `null`，而 `JSON.stringify` 会直接丢掉值为 `undefined` 的键——两侧口径不同，落盘再读回的诚实记录必然 `CHAIN_BROKEN`（Task 4 评审 I-4，已用 `{a: undefined}` 反证）。键序无关性由 `canonicalHash` 自己保证。verify 侧（Task 5）必须用**同一个**归一化表达式重算。

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
    if (input.capabilities.schemaVersion !== ENGINE_CAPABILITY_MATRIX_SCHEMA_VERSION) {
      diagnostics.push(
        issue(`/capabilities/schemaVersion must be "${ENGINE_CAPABILITY_MATRIX_SCHEMA_VERSION}".`, "/capabilities/schemaVersion"),
      );
    }
    if (Array.isArray(input.capabilities.available)) {
      input.capabilities.available.forEach((entry, index) => {
        if (typeof entry !== "string" || entry.length === 0) {
          diagnostics.push(issue(`/capabilities/available/${index} must be a non-empty string.`, `/capabilities/available/${index}`));
        }
      });
    } else {
      diagnostics.push(issue("/capabilities/available must be an array.", "/capabilities/available"));
    }
    if (Array.isArray(input.capabilities.blocked)) {
      input.capabilities.blocked.forEach((entry, index) => {
        const path = `/capabilities/blocked/${index}`;
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
          diagnostics.push(issue(`${path} must be an object.`, path));
          return;
        }
        for (const key of ["code", "reason"] as const) {
          if (typeof entry[key] !== "string" || entry[key].length === 0) {
            diagnostics.push(issue(`${path}/${key} must be a non-empty string.`, `${path}/${key}`));
          }
        }
        if (entry.path !== undefined && typeof entry.path !== "string") {
          diagnostics.push(issue(`${path}/path must be a string when present.`, `${path}/path`));
        }
      });
    } else {
      diagnostics.push(issue("/capabilities/blocked must be an array.", "/capabilities/blocked"));
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
  // Task 5 reads exclusions to decide "not-covered" rows, so an out-of-vocabulary or absent member
  // would silently delete an assertion from the verdict instead of failing the record.
  if (!Array.isArray(input.exclusions) || input.exclusions.length === 0) {
    diagnostics.push(issue("/exclusions must be a non-empty array.", "/exclusions"));
  } else {
    input.exclusions.forEach((entry, index) => {
      if (!Object.values(EvidenceExclusionId).includes(entry)) {
        diagnostics.push(issue(`/exclusions/${index} is not a known exclusion id.`, `/exclusions/${index}`));
      }
    });
  }
  if (typeof input.issuedAt !== "string" || !ISO8601_UTC_PATTERN.test(input.issuedAt)) {
    diagnostics.push(issue("/issuedAt must be an ISO-8601 UTC timestamp.", "/issuedAt"));
  }

  return diagnostics;
}
```

`exactOptionalPropertyTypes: true` 下不得写 `{ issuedAt: undefined }`——所有可选字段一律用 `?? ` 或条件展开，代码里已按此写法。

`ISO8601_UTC_PATTERN` 必须与 Step 5b 的 TypeBox 常量同源（本仓库不引 `ajv-formats`，时间戳就是正则）：
`/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/`，即 `schema.ts` 的 `Iso8601Utc`；两侧各自硬抄
同一串字面量是本 task 允许的**唯一**重复，因为 `record.ts` 不得 value-import TypeBox。exclusion 词汇表同理：
结构校验用 `Object.values(EvidenceExclusionId)`，TypeBox 用 `Type.Union([Type.Literal…])`，两者由 Step 7 的
双向违规表钉在一起。

> **评审 I-1/I-2 裁定（覆盖面的边界，必须照做）：** 零依赖结构校验器**不负责**复刻 `MapCommandSchema` /
> `MapSpec` 的深层形状——那是 Ajv 侧的公开契约，重抄一份只会制造第二真相源。它的职责边界是：**凡 Task 5
> 的复算结论会直接读到的字段，必须在这里被钉住**（`recordId`、`exclusions`、`capabilities.*`、`issuedAt`、
> `artifacts[].sha256/bytes`、`commands[].inversePatchHash/outcome`）。因此：
> 1. `buildEvidenceRecord` 的入口先做 nullish 守卫：`if (!input || typeof input !== "object") return { ok: false, diagnostics: [issue("/ must be an object.", "/")] }`（`strict` 下禁止抛 `TypeError`，见约束 7）。
> 2. Step 7 的 schema-sync 锁必须**双向**：违规表里每一行同时断言 `!ajvValid(record)` **且** `structuralIssues` 非空——只锁一个方向等于没锁（Task 4 评审原文："Only one direction is locked"）。
> 3. 评审探针里那批「Ajv 拒、结构校验放」的用例必须逐条进违规表：`exclusions: []`、`exclusions` 含未知成员、`capabilities.schemaVersion` 改成 `…v0.2`、`capabilities.available` 含非字符串、`capabilities.blocked` 成员形状非法、`issuedAt` 非 ISO。

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

