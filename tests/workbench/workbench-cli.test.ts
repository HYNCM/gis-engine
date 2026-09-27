import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("gis-engine-workbench launcher", () => {
  it("is exposed as a package binary while create-gis-map remains unchanged", () => {
    const workbenchPackage = JSON.parse(readFileSync(join(root, "apps/workbench/package.json"), "utf8"));
    const cliPackage = JSON.parse(readFileSync(join(root, "packages/cli/package.json"), "utf8"));
    const rootPackage = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

    expect(workbenchPackage.bin).toEqual({ "gis-engine-workbench": "./bin/gis-engine-workbench.mjs" });
    expect(cliPackage.bin).toEqual({ "create-gis-map": "./dist/bin.js" });
    expect(rootPackage.scripts["test:workbench:e2e"]).toContain("pnpm --filter @gis-engine/cli build");
  });

  it("documents the optional project directory without starting the server", () => {
    const launcher = readFileSync(join(root, "apps/workbench/bin/gis-engine-workbench.mjs"), "utf8");
    expect(launcher).not.toMatch(/^import .*server\/index\.mjs/m);
    expect(launcher).toContain('await import("../server/index.mjs")');

    const output = execFileSync(process.execPath, ["apps/workbench/bin/gis-engine-workbench.mjs", "--help"], {
      cwd: root,
      encoding: "utf8",
    });

    expect(output).toContain("gis-engine-workbench [project-directory]");
    expect(output).toContain("127.0.0.1");
  });
});
