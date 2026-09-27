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

