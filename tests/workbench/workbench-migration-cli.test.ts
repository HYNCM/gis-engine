import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("Workbench legacy migration export", () => {
  it("documents the explicit source and output paths without touching a database", () => {
    const result = spawnSync(process.execPath, ["scripts/workbench-legacy-export.mjs", "--help"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("<legacy.sqlite> <output.json>");
    expect(result.stderr).toBe("");
  });
});
