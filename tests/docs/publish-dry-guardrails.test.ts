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

describe("publish dry-run guardrails", () => {
  it("dry-runs only GA publish packages", () => {
    const packageJson = readJson("package.json");
    const scripts = packageJson.scripts as Record<string, string>;
    const publishDry = scripts["publish:dry"];

    expect(publishDry).toContain("--filter @gis-engine/engine publish --dry-run --no-git-checks");
    expect(publishDry).toContain("--filter @gis-engine/scene3d publish --dry-run --no-git-checks");
    expect(publishDry).toContain("--filter @gis-engine/ai publish --dry-run --no-git-checks");
    expect(publishDry).toContain("--filter @gis-engine/cli publish --dry-run --no-git-checks");
    expect(publishDry).not.toContain("-r publish");
    expect(publishDry).not.toContain("@gis-engine/scene3d-three-adapter publish");
  });

  it("keeps Release workflow on the GA publish script with scene3d tagged next", () => {
    const packageJson = readJson("package.json");
    const scripts = packageJson.scripts as Record<string, string>;
    const publishScript = readText("scripts/publish-ga-packages.mjs");
    const releaseWorkflow = readText(".github/workflows/release.yml");

    expect(scripts["release:publish"]).toBe("node scripts/publish-ga-packages.mjs");
    expect(scripts["release:publish:dry"]).toBe("node scripts/publish-ga-packages.mjs --dry-run");
    expect(releaseWorkflow).toContain("Detect pending changesets");
    expect(releaseWorkflow).toContain("Create Version Packages Pull Request");
    expect(releaseWorkflow).toContain("steps.changesets.outputs.pending == 'true'");
    expect(releaseWorkflow).toContain("Publish GA packages to npm");
    expect(releaseWorkflow).toContain("steps.changesets.outputs.pending == 'false'");
    expect(releaseWorkflow).toContain("run: pnpm release:publish");
    expect(releaseWorkflow).not.toContain("publish: pnpm changeset publish");

    const engineIndex = publishScript.indexOf('name: "@gis-engine/engine"');
    const scene3dIndex = publishScript.indexOf('name: "@gis-engine/scene3d"');
    const aiIndex = publishScript.indexOf('name: "@gis-engine/ai"');
    const cliIndex = publishScript.indexOf('name: "@gis-engine/cli"');

    expect(engineIndex).toBeGreaterThan(-1);
    expect(scene3dIndex).toBeGreaterThan(engineIndex);
    expect(aiIndex).toBeGreaterThan(scene3dIndex);
    expect(cliIndex).toBeGreaterThan(aiIndex);
    expect(publishScript).toContain('tag: "next"');
    expect(publishScript).not.toContain("@gis-engine/scene3d-three-adapter");
  });
});
