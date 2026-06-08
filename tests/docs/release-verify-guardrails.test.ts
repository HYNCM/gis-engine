import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(repoRoot, path), "utf8")) as Record<string, unknown>;
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
});
