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

**从 Task 6 结转、必须由本 task 闭合的三项（评审裁定的前置条件，不是可选项）：**

1. **读侧字节上限。** `buildEvidenceRecord` 有 `MAX_EVIDENCE_RECORD_BYTES`，但
   `runEvidenceVerifierCli` 会对任意大的不受信任 `evidence.json` 直接 `JSON.parse`。约束 5 的
   reject-not-truncate 在**生产侧**，审计侧的入口同样是攻击面：读到盘的字节数超过
   `MAX_EVIDENCE_RECORD_BYTES` 时必须拒绝（退出码 1，文案点名实际字节数与上限），不得截断、不得解析。
   加一条测试：写入一份超限的 `evidence.json` ⇒ CLI 失败且不产出任何断言结论。
2. **`BUNDLE` / `BUNDLE_MODULES` 两处清单互相指认。** 构建脚本的 `BUNDLE` 与
   `tests/evidence/standalone-verifier.test.ts` 的 `BUNDLE_MODULES` 必须同序同集，否则「逐字内嵌」锁的
   覆盖面会在闭包增长时静默缩小。两边的注释各点名对方一次。
3. **spec §6 决定 4 的残余面要写进文档。** `isInsideRoot` 是纯字符串判断，root 内一个指向外部的
   **符号链接**照样会被 `readFile` 跟随。这是刻意选择的代价（引入 `node:fs` 的 `realpath` 判断会破坏
   零依赖闭包），必须在 `docs/engineering/evidence-record.md` 的威胁模型里写明白：`--root` 由审计方自己
   提供，root 内的符号链接属于审计方自己的信任域。

**实测体积（供 Step 5 判定，`canonical-dist-gzip-v1` / complete-dist，`99a902a` 干净构建）：**
engine 现状 236,057 B，预算 204,800 B（blocking），基线 193,984 B @ `4465943`（2026-08-05 实测 194,509 B 通过）。
逐件归因：`dist/src/evidence/**` 23,384 B、`dist/schema/evidence-record*.json` 5,239 B、
`dist/evidence-verifier.mjs` 9,898 B ⇒ 证据子系统合计 **+38,703 B**，扣掉后为 197,354 B（仍在新预算之下）。
也就是说：**超预算完全由本 spec 引入，且删掉 verifier 单文件也回不到预算内（226,159 B）。**
本 task 的 Step 5 因此按既有约定更新预算与基线，并把上面这组数字与理由写进 PR——不得静默调高，
也不得以「缩小证据面」为名绕开门禁。另外 `pnpm check` 不含 `size:check`，`bundle-size.yml` 只在
`packages/**` 变更时跑：本分支是第一例会真正触发它的分支，这个盲区一并记进 PR。

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
import { EvidenceRecordSchema, verifyEvidenceRecord } from "@gis-engine/engine/evidence";
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

      // 消费者契约见 Task 5 Step 4：绿与否只看 `result.ok`（断言全绿 **且** 无 error 诊断）。
      expect(result.ok).toBe(true);
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
    return createRequire(import.meta.url).resolve("@gis-engine/engine/evidence-verifier.mjs");
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

并在该文件顶部 import 块补 `import { canonicalHash } from "@gis-engine/engine/evidence";`。`specOf` 不必新造：`map.json` 落盘时已含完整 spec（`generate.ts:591` 用 `JSON.stringify(applied.spec, null, 2)`），而 `canonicalStringify` 与键序无关，所以 `JSON.parse(mapBytes)` 直接可用作输入：

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

