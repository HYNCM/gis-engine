import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function readText(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("ai-map-workbench boundary copy", () => {
  it("keeps scene browsing framed as extension-only evidence in the reference app", () => {
    const readme = readText("examples/ai-map-workbench/README.md");

    expect(readme).toContain("reference app");
    expect(readme).toContain("extension-only evidence");
    expect(readme).toMatch(/do not promote a stable\s+`view\.mode: "scene3d"`/i);
  });
});
