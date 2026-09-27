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
import { DiagnosticCodes } from "@gis-engine/engine";
import { canonicalHash, EvidenceIssueCode, verifyEvidenceRecord } from "@gis-engine/engine/evidence";
import { describe, expect, it } from "vitest";
import { MAP_JSON, buildFixture, sha256Of, validRecord } from "./fixtures/record.js";

const DIST_VERIFIER = resolve("packages/engine/dist/evidence-verifier.mjs");
const BUNDLE_MODULES = [
  resolve("packages/engine/dist/src/evidence/canonical-stringify.js"),
  resolve("packages/engine/dist/src/evidence/record.js"),
];

describe("standalone evidence verifier", () => {
  it("emits a single file whose only runtime imports are node builtins", () => {
    const source = readFileSync(DIST_VERIFIER, "utf-8");
    // Same scanner the build script uses: a `from "…"`-only regex is bypassed by `await import("…")`,
    // which is exactly how Task 3's reachability guard was shown to be leaky.
    const specifiers = [
      ...source.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)"([^"]+)"/g),
    ].map((match) => match[1]!);

    expect(specifiers.length).toBeGreaterThan(0);
    for (const specifier of specifiers) {
      expect(specifier.startsWith("node:")).toBe(true);
    }
  });

  it("ships the compiled engine hashing modules verbatim inside the standalone file", () => {
    const verifier = readFileSync(DIST_VERIFIER, "utf-8");

    for (const module of BUNDLE_MODULES) {
      // 构建脚本只剥掉「引用闭包内模块的那几行 import」，其余逐字内嵌；这里用同一套剥除规则复算。
      // 复算必须与 build-evidence-verifier.ts 的剥除逻辑同构（同一 specifier 判定），否则这条
      // 「逐字内嵌」锁会和构建脚本各说各话。
      const inlined = readFileSync(module, "utf-8")
        .split("\n")
        .filter(
          (line) =>
            ![...line.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)"([^"]+)"/g)]
              .map((match) => match[1]!)
              .some((specifier) => !specifier.startsWith("node:") && specifier.startsWith("./")),
        )
        .join("\n");
      expect(verifier).toContain(inlined.trimEnd());
    }
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

**必须补的 containment 守卫（Task 6 预检发现；spec §6 决定 4 的威胁模型要求）：**
Step 3 草图里 `readArtifact` 那一行只是把 `root` 和记录里的路径首尾拼接。一条不受信任的
`evidence.json` 只要把 `artifacts[].path` 写成 `../../etc/passwd`、绝对路径，或 Windows 盘符/反斜杠
形态，就能把「审计员在自己机器上跑的复算器」变成读任意文件的 oracle（它会把读到的字节哈希回报）。
所以 CLI 侧必须拒绝 root 之外的路径——这是数据面守卫，不改变 `verifyEvidenceRecord` 的纯度：

```ts
/**
 * A record is untrusted input and this CLI is run by the party auditing it, so an artifact path that
 * walks outside `--root` is a finding, not a file to open. Pure string work on purpose: constraint 3
 * keeps `record.js`'s value imports at `node:` builtins, and `node:path`'s judgement about platform
 * separators is exactly what a cross-machine evidence file must not depend on.
 */
function isInsideRoot(root: string, path: string): boolean {
  const normalised = path.replace(/\\/g, "/");
  if (normalised.startsWith("/") || /^\s*[A-Za-z]:/.test(normalised) || normalised.includes("\0")) return false;
  if (normalised.split("/").includes("..")) return false;
  // The root is supplied by the operator, but a `..` in it would defeat the check trivially.
  return !root.replace(/\\/g, "/").split("/").includes("..");
}
```

`readArtifact` 先过这道判断：不在 root 内时**不去读**，直接按该 artifact 失败处理
（`ARTIFACT_MISMATCH` 诊断 + `ARTIFACTS_MATCH` `failed` ⇒ 退出码 2），诊断文案点名越界路径但绝不回传
文件内容或大小。落地方式是把 Step 3 草图那一行换成先判断再读，越界时由注入的 reader 抛出带路径的
错误，让 verifier 已有的 catch 分支收敛成诊断——约束 7 禁止的是 verifier 自己抛，注入边界的失败本来
就走 `ARTIFACT_MISMATCH`，不要为此再改 verifier 的签名或断言形状：

```ts
readArtifact: (path) => {
  if (!isInsideRoot(root, path)) {
    throw new Error(`artifact path escapes --root: ${path}`);
  }
  return deps.readFile(`${root}${path}`);
},
```

Step 1 的测试面相应加四条：`"../secret"`、绝对 `"/etc/passwd"`、Windows 形态 `"C:\shares\x"`
三种都必须 `ok:false`，并且用一个记录调用次数的 spy 断言 `readFile` 对这些路径**一次都没被调用**；
最后一条是合法的两级相对路径 `data/nested/map.json` 必须照常通过——防止守卫被写成「见斜杠就拒」。

> 默认 `--root` 为空字符串时 `readFile(recordPath)` 即按 cwd 解析，与 Step 1 测试里 `cwd: directory` 的用法一致；传 `--root` 时统一以 `/` 结尾拼接，避免 `join`/`path` 再引入 `node:path`。

同一批导出里补进 `evidence/index.ts`：`type EvidenceVerifierCliDependencies`、`runEvidenceVerifierCli`（Task 7/8 的集成测试直接调它，不重复实现 CLI 装配）。**不要**加进根 barrel `packages/engine/src/index.ts`——`record.ts` 带 `node:crypto`，会被 `tests/evidence/canonical-hash.test.ts` 的浏览器面守卫挡红。

- [ ] **Step 4: 写构建脚本（守卫 + 尾注入口）**

单文件 = `shebang` + **编译产物逐字内嵌（依赖闭包）** + 一段读盘尾注。闭包就是 Task 3 拆出来的两个文件：`canonical-stringify.js`（零 import）在前、`record.js` 在后，内嵌时剥掉 `record.js` 指向 `canonical-stringify.js` 的那条 import 行。ESM 的 `import` 声明可以出现在模块顶层任意位置（会被提升），因此尾注里再写一条 `import` 合法，且 `runEvidenceVerifierCli` 已在同一文件内，无需再 import 自己。这样"两份实现"彻底不存在，Task 6 Step 1 的"逐字内嵌"断言就是防漂移的那道锁。

出现闭包外的非 `node:` 依赖时**必须失败**，不允许静默剥除——否则以后 `record.ts` 引入 `diagnostics/codes.js` 这类运行期依赖时，会悄悄产出打不开的包。

创建 `packages/engine/scripts/build-evidence-verifier.ts`：

```ts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Dependency order: callees first. Append new closure members in this order.
const BUNDLE = ["dist/src/evidence/canonical-stringify.js", "dist/src/evidence/record.js"].map(resolve);
const target = resolve("dist/evidence-verifier.mjs");
// Every syntax that can pull in another module at runtime. Task 3's reachability guard learned the
// hard way that a `from "…"`-only scan is bypassed by `await import("…")`; a scanner that misses one
// here emits a bundle that breaks on the auditor's machine instead of failing the build.
const MODULE_SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)"([^"]+)"/g;

function specifiersIn(code: string): string[] {
  return [...code.matchAll(MODULE_SPECIFIER)].map((match) => match[1] as string);
}

const sources = BUNDLE.map((source) => {
  const compiled = readFileSync(source, "utf-8");
  const offenders = [...new Set(specifiersIn(compiled))]
    .filter((specifier) => !specifier.startsWith("node:"))
    .map((specifier) => resolve(dirname(source), specifier))
    .filter((dependency) => !BUNDLE.includes(dependency));

  if (offenders.length > 0) {
    console.error(
      `evidence-verifier must stay dependency-free. Offending imports in ${source}:\n${offenders
        .map((offender) => `  ${offender}`)
        .join("\n")}`,
    );
    process.exitCode = 1;
    return "";
  }

  // Strip only lines carrying an intra-bundle specifier; node: builtins stay and the guard test
  // asserts nothing else survives. tsc/Biome emit single-line import statements, so a line filter
  // cannot leave a fragment behind — and if that invariant ever breaks, the standalone CLI test
  // *executes* this file, so a parse error fails the gate instead of shipping.
  return compiled
    .split("\n")
    .filter((line) => !specifiersIn(line).some((specifier) => BUNDLE.includes(resolve(dirname(source), specifier))))
    .join("\n");
});

if (process.exitCode !== 1) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(
    target,
    `#!/usr/bin/env node
${sources.join("\n")}
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

**这条守卫必须被证明承重**（Task 3 的教训：能绕过的守卫等于没有守卫）。变异证明两步，写进 Step 6
的执行记录：① 临时在 `record.ts` 顶部加一条 `import { manualFix } from "../internal/shared.js";`
并在任一函数里真的用它（否则 tsc 会先报未使用），确认 `pnpm --filter @gis-engine/engine build`
以 exit 1 失败且报错点名该文件；② 换成 `await import("../internal/shared.js")`，确认同一个守卫照样
`exit 1`（这一步就是老 `ANY_IMPORT` 正则漏掉的形态）。两步做完必须还原，并确认 `git status` 干净。

- [ ] **Step 5: 接进构建**

`packages/engine/package.json`：

```json
    "build": "tsc -p tsconfig.json && node dist/scripts/build-evidence-verifier.js",
    "build:schema": "tsc -p tsconfig.json && node dist/scripts/build-schema.js && node dist/scripts/build-evidence-verifier.js"
```

同一文件再加两条 `exports`。Task 7/8 的消费方用 `createRequire(...).resolve("@gis-engine/engine/…")` 取 verifier 与 package.json，而包一旦声明了 `exports`，未列出的深路径会直接 `ERR_PACKAGE_PATH_NOT_EXPORTED`：

```json
    "./evidence-verifier.mjs": "./dist/evidence-verifier.mjs",
    "./package.json": "./package.json"
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

