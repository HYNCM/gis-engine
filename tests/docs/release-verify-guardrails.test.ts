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
    const releaseVerifyScript = readText("scripts/release-verify.mjs");

    expect(releaseVerify).toBe("node scripts/release-verify.mjs");
    expect(releaseVerifyScript).toContain('name: "release-preflight"');
    expect(releaseVerifyScript).toContain('args: ["release:preflight"');
    expect(releaseVerifyScript).toContain('name: "lint"');
    expect(releaseVerifyScript).toContain('args: ["lint"]');
    expect(releaseVerifyScript).toContain('name: "build-schema"');
    expect(releaseVerifyScript).toContain('args: ["build:schema"]');
    expect(releaseVerifyScript).toContain('name: "check"');
    expect(releaseVerifyScript).toContain('args: ["check"]');
    expect(releaseVerifyScript).toContain('name: "smoke-cli-install"');
    expect(releaseVerifyScript).toContain('args: ["smoke:cli-install"]');
    expect(releaseVerifyScript).toContain('name: "build-cdn-dry-run"');
    expect(releaseVerifyScript).toContain('args: ["build:cdn", "--", "--dry-run"]');
    expect(releaseVerifyScript).toContain('name: "publish-dry-run"');
    expect(releaseVerifyScript).toContain('args: ["publish:dry"]');
    expect(releaseVerifyScript).toContain('name: "docs-links"');
    expect(releaseVerifyScript).toContain('args: ["docs:links"]');
    expect(releaseVerify).not.toContain("-r publish");
    expect(releaseVerifyScript).not.toContain("@gis-engine/scene3d-three-adapter publish");
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
    expect(firstRunScript).toContain("scripts/release-preflight.mjs");
    expect(firstRunScript).toContain("--skip-browser");
    expect(firstRunScript).toContain("--require-release-env");
    expect(firstRunScript).toContain("scripts/cli-install-smoke.mjs");
    expect(firstRunScript).toContain("maxMinutes: 30");
    expect(firstRunScript).toContain("First-run acceptance");
    expect(firstRunScript).toContain("asserts raw prompt text is not retained");
  });

  it("keeps the OpenAI-compatible provider smoke local and leak-safe", () => {
    const packageJson = readJson("package.json");
    const scripts = packageJson.scripts as Record<string, string>;
    const providerSmoke = readText("scripts/provider-smoke.mjs");

    expect(scripts["smoke:provider"]).toBe("node scripts/provider-smoke.mjs");
    expect(providerSmoke).toContain("127.0.0.1");
    expect(providerSmoke).toContain("/success/v1/chat/completions");
    expect(providerSmoke).toContain("/malformed/v1/chat/completions");
    expect(providerSmoke).toContain("/http-error/v1/chat/completions");
    expect(providerSmoke).toContain("/timeout/v1/chat/completions");
    expect(providerSmoke).toContain("--base-url");
    expect(providerSmoke).toContain("--api-key");
    expect(providerSmoke).toContain("--timeout");
    expect(providerSmoke).toContain("--verify-artifacts");
    expect(providerSmoke).toContain("assertNoSensitiveRetention");
  });
});
