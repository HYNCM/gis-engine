import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { preflightMapSpec } from "@gis-engine/cli";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(fileURLToPath(new URL("../../", import.meta.url)));
const exampleRoot = resolve(repoRoot, "examples/consumer-handoff-minimal");

describe("consumer-handoff-minimal example", () => {
  it("documents a real consumer CI handoff flow", () => {
    const readme = readFileSync(join(exampleRoot, "README.md"), "utf8");
    const workflow = readFileSync(join(exampleRoot, ".github/workflows/consumer-review-handoff.yml"), "utf8");

    expect(readme).toContain("npm run handoff");
    expect(readme).toContain("handoff/preflight.json");
    expect(readme).toContain("handoff/consumer-review.md");
    expect(workflow).toContain('node-version: "22"');
    expect(workflow).toContain("npm run build");
    expect(workflow).toContain("npm run handoff");
    expect(workflow).toContain("actions/upload-artifact@v4");
  });

  it("renders a consumer handoff markdown report from preflight output", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "gis-engine-consumer-handoff-"));
    const preflightPath = join(tempDir, "preflight.json");
    const outputPath = join(tempDir, "consumer-review.md");

    try {
      const preflight = preflightMapSpec({ filePath: join(exampleRoot, "map.json") });
      expect(preflight.ok).toBe(true);
      execFileSync(
        process.execPath,
        [
          join(exampleRoot, "ci-handoff.mjs"),
          "--preflight",
          writeJson(preflightPath, preflight),
          "--output",
          outputPath,
        ],
        { cwd: exampleRoot, stdio: "pipe" },
      );

      const report = readFileSync(outputPath, "utf8");
      expect(report).toContain("# Consumer Review Handoff");
      expect(report).toContain("MapSpec");
      expect(report).toContain("Preflight");
      expect(report).toContain("npm run handoff");
      expect(report).toContain("hand-authored consumer repo");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

function writeJson(path: string, value: unknown): string {
  require("node:fs").writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return path;
}
