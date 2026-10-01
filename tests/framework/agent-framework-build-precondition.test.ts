import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * `tests/framework/visual-pixel-baseline.test.ts` asks Playwright to collect each visual entry
 * point, and collecting a spec means importing it. Those specs reach the engine and the scene3d
 * package through their published entry points, so on a clean checkout the loader stops with
 * `Cannot find module .../@gis-engine/scene3d/dist/index.js`, reports `Total: 0 tests in 0 files`,
 * and the suite only passes on a machine that happens to hold build output.
 */
describe("agent framework suite build precondition", () => {
  const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts as Record<string, string>;

  it("builds the workspace entry points before collecting the framework suite", () => {
    expect(scripts["test:agent-framework"]).toBe("pnpm build:schema && vitest run tests/framework");
  });

  it("keeps the path-aware gate plan on that script instead of a bare vitest invocation", () => {
    const gatePlan = readFileSync("scripts/gate-plan.mjs", "utf8");
    expect(gatePlan).toContain("pnpm test:agent-framework");
    expect(gatePlan).not.toMatch(/command:\s*"vitest run tests\/framework/);
  });
});
