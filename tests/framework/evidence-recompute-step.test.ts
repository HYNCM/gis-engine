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
