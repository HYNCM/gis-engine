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

function githubExpression(expression: string): string {
  return `$${`{{ ${expression} }}`}`;
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
    expect(releaseWorkflow).toContain(`GIS_ENGINE_ALL: ${githubExpression("secrets.GIS_ENGINE_ALL")}`);
    expect(releaseWorkflow).toContain(`NPM_TOKEN: ${githubExpression("secrets.NPM_TOKEN")}`);
    expect(releaseWorkflow).toContain(
      `NODE_AUTH_TOKEN: ${githubExpression("secrets.GIS_ENGINE_ALL || secrets.NPM_TOKEN")}`,
    );
    expect(releaseWorkflow).not.toContain("publish: pnpm changeset publish");
    expect(publishScript).toContain(
      "process.env.NODE_AUTH_TOKEN || process.env.GIS_ENGINE_ALL || process.env.NPM_TOKEN",
    );

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

  it("gates the main-push release workflow on the same-SHA release verification before publish", () => {
    const releaseWorkflow = readText(".github/workflows/release.yml");

    const gateIndex = releaseWorkflow.indexOf("run: pnpm release:verify");
    const publishIndex = releaseWorkflow.indexOf("run: pnpm release:publish");
    expect(gateIndex, "release.yml must run the release quality gates").toBeGreaterThan(-1);
    expect(publishIndex).toBeGreaterThan(-1);
    expect(gateIndex, "publish must not run before the quality gate on the same SHA").toBeLessThan(publishIndex);

    // The gate needs a real browser for the strict visual suite.
    const browserIndex = releaseWorkflow.indexOf("playwright install --with-deps chromium");
    expect(browserIndex).toBeGreaterThan(-1);
    expect(browserIndex).toBeLessThan(gateIndex);

    // Gate and publish only apply to the no-pending-changesets branch.
    const gateBranch = releaseWorkflow.slice(0, gateIndex);
    expect(gateBranch).toContain("steps.changesets.outputs.pending == 'false'");
    const gateIfCount = (releaseWorkflow.match(/if: steps\.changesets\.outputs\.pending == 'false'/g) ?? []).length;
    expect(gateIfCount).toBeGreaterThanOrEqual(3);
  });

  it("provides a canonical Ubuntu runner job to generate pixel baselines explicitly", () => {
    const baselineWorkflow = readText(".github/workflows/visual-baselines.yml");

    expect(baselineWorkflow).toContain("workflow_dispatch");
    expect(baselineWorkflow).toContain("ubuntu-latest");
    expect(baselineWorkflow).toContain("playwright install --with-deps chromium");
    expect(baselineWorkflow).toContain(
      "SNAPSHOT_UPDATE=1 GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual",
    );
    expect(baselineWorkflow).toContain("upload-artifact");
  });

  it("keeps legacy NPM Publish workflow delegated to the GA publish script and shared token fallback", () => {
    const legacyWorkflow = readText(".github/workflows/npm-publish.yml");

    expect(legacyWorkflow).toContain("run: pnpm release:publish");
    expect(legacyWorkflow).toContain(`GIS_ENGINE_ALL: ${githubExpression("secrets.GIS_ENGINE_ALL")}`);
    expect(legacyWorkflow).toContain(`NPM_TOKEN: ${githubExpression("secrets.NPM_TOKEN")}`);
    expect(legacyWorkflow).toContain(
      `NODE_AUTH_TOKEN: ${githubExpression("secrets.GIS_ENGINE_ALL || secrets.NPM_TOKEN")}`,
    );
    expect(legacyWorkflow).not.toContain("pnpm publish --no-git-checks");
    expect(legacyWorkflow).not.toContain("npm version");
  });
});
