import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflowPath = ".github/workflows/release-verify.yml";

function workflow(): string {
  return readFileSync(workflowPath, "utf8");
}

/**
 * `pnpm release:verify` is the only gate that consumes the Ubuntu pixel baselines, and the
 * push-triggered Release job skips it whenever a changeset is pending. Without a manual entry
 * point the strict visual stage is unrunnable in CI, so a release decision would rest on
 * evidence no runner ever produced.
 */
describe("release verify workflow", () => {
  it("is manual-only so it cannot publish on its own", () => {
    const triggerBlock = workflow().split(/^on:/m)[1].split("\njobs:")[0];
    expect(triggerBlock).toContain("workflow_dispatch");
    for (const autoTrigger of ["push", "pull_request", "schedule", "workflow_run", "release"]) {
      expect(triggerBlock).not.toMatch(new RegExp(`^\\s+${autoTrigger}:`, "m"));
    }
  });

  it("keeps read-only permissions", () => {
    const permissionsBlock = workflow()
      .split(/^permissions:/m)[1]
      .split("\n", 4)
      .join("\n");
    expect(permissionsBlock).toContain("contents: read");
    expect(permissionsBlock).not.toContain("write");
  });

  it("verifies on the baseline platform at the preflight Node major", () => {
    expect(workflow()).toContain("runs-on: ubuntu-latest");
    expect(workflow()).toMatch(/node-version:\s*["']22["']/);
    expect(workflow()).toContain("pnpm exec playwright install --with-deps chromium");
  });

  it("runs the full verify chain including the strict visual stage", () => {
    expect(workflow()).toContain("pnpm release:verify");
    expect(workflow()).not.toContain("--skip-browser");
  });

  it("never authors baselines and never publishes", () => {
    for (const forbidden of [
      "SNAPSHOT_UPDATE=1",
      "release:publish",
      "pnpm publish",
      "npm publish",
      "changesets/action",
    ]) {
      expect(workflow(), forbidden).not.toContain(forbidden);
    }
  });
});
