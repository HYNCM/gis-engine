import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(repoRoot, path), "utf8")) as Record<string, unknown>;
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
});
