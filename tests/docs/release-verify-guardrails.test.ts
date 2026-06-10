import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(repoRoot, path), "utf8")) as Record<string, unknown>;
}

function readText(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("release verify guardrails", () => {
  it("chains the release operator checks in the expected order", () => {
    const packageJson = readJson("package.json");
    const scripts = packageJson.scripts as Record<string, string>;
    const releaseVerify = scripts["release:verify"];

    expect(releaseVerify).toContain("pnpm release:preflight");
    expect(releaseVerify).toContain("pnpm smoke:cli-install");
    expect(releaseVerify).toContain("pnpm build:cdn -- --dry-run");
    expect(releaseVerify).toContain("pnpm publish:dry");
    expect(releaseVerify).toContain("pnpm docs:links");
    expect(releaseVerify).not.toContain("-r publish");
    expect(releaseVerify).not.toContain("@gis-engine/scene3d-three-adapter publish");

    expect(releaseVerify.indexOf("pnpm release:preflight")).toBeLessThan(
      releaseVerify.indexOf("pnpm smoke:cli-install"),
    );
    expect(releaseVerify.indexOf("pnpm smoke:cli-install")).toBeLessThan(
      releaseVerify.indexOf("pnpm build:cdn -- --dry-run"),
    );
    expect(releaseVerify.indexOf("pnpm build:cdn -- --dry-run")).toBeLessThan(
      releaseVerify.indexOf("pnpm publish:dry"),
    );
    expect(releaseVerify.indexOf("pnpm publish:dry")).toBeLessThan(releaseVerify.indexOf("pnpm docs:links"));
  });

  it("keeps the CLI install smoke as a generated-artifact acceptance loop", () => {
    const smokeScript = readText("scripts/cli-install-smoke.mjs");

    expect(smokeScript).toContain("--generate");
    expect(smokeScript).toContain("--provider");
    expect(smokeScript).toContain("mock");
    expect(smokeScript).toContain("--preflight");
    expect(smokeScript).toContain("--verify-artifacts");
    expect(smokeScript).toContain("assertRequiredReviewFiles");
    expect(smokeScript).toContain("assertNoRawPromptRetention");
  });

  it("keeps first-run acceptance tied to the CLI install smoke", () => {
    const packageJson = readJson("package.json");
    const scripts = packageJson.scripts as Record<string, string>;
    const firstRunScript = readText("scripts/first-run-acceptance.mjs");

    expect(scripts["smoke:first-run"]).toBe("node scripts/first-run-acceptance.mjs");
    expect(firstRunScript).toContain("scripts/cli-install-smoke.mjs");
    expect(firstRunScript).toContain("maxMinutes: 30");
    expect(firstRunScript).toContain("First-run acceptance");
    expect(firstRunScript).toContain("asserts raw prompt text is not retained");
  });
});
