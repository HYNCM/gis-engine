import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const scene3dVisualSpec = readFileSync("tests/snapshot/visual/scene3d-three-adapter.spec.ts", "utf8");
const maplibreVisualSpec = readFileSync("tests/snapshot/visual/maplibre-visual.spec.ts", "utf8");
const visualScripts = JSON.parse(readFileSync("package.json", "utf8")).scripts as Record<string, string>;

describe("visual pixel baseline", () => {
  it("roots baselines under the suite and keys them per platform", () => {
    const config = readFileSync("playwright.config.ts", "utf8");
    expect(config).toContain('testDir: "./tests"');
    expect(config).toContain('"{testDir}/__snapshots__/{testFilePath}/{arg}{-platform}{ext}"');
  });

  it("keeps every playwright entry discovering its own specs", () => {
    const entries = [
      "tests/snapshot/visual/maplibre-visual.spec.ts",
      "tests/snapshot/visual/scene3d-three-adapter.spec.ts",
      "tests/e2e/render-pipeline.spec.ts",
      "tests/workbench/workbench-e2e.spec.ts",
      "tests/compatibility/maplibre-compatibility.spec.ts",
    ];
    for (const spec of entries) {
      const listed = spawnSync("node_modules/.bin/playwright", ["test", spec, "--list"], { encoding: "utf8" });
      expect(listed.stdout, spec).not.toContain("No tests found");
      expect(listed.status, `${spec} must stay discoverable: ${listed.stdout}`).toBe(0);
    }
  });

  it("keeps one pixel tolerance source instead of per-assertion copies", () => {
    const config = readFileSync("playwright.config.ts", "utf8");
    expect(config).toMatch(/toMatchSnapshot:\s*\{/);
    expect(config).toMatch(/maxDiffPixelRatio:\s*[\d.]+/);
    expect(config).toMatch(/threshold:\s*0,/);
  });

  it("compares the captured scene3d frame against a pixel baseline", () => {
    expect(scene3dVisualSpec).toContain("toMatchSnapshot(");
  });

  it("gates each 2d maplibre scene against its own named baseline", () => {
    for (const scene of [
      "maplibre-geojson",
      "maplibre-vector-tile",
      "maplibre-fill-extrusion",
      "maplibre-data-driven",
    ]) {
      expect(maplibreVisualSpec, scene).toContain(`toMatchSnapshot("${scene}.png")`);
    }
  });

  it("keeps the synthetic frame provenance asserted beside the pixel gate", () => {
    expect(scene3dVisualSpec).toContain('frameProvenance).toBe("synthetic-canvas2d")');
  });

  it("routes the documented baseline update command to playwright's writer", () => {
    const config = readFileSync("playwright.config.ts", "utf8");
    expect(visualScripts["test:snapshot:update"]).toContain("SNAPSHOT_UPDATE=1");
    expect(config).toMatch(/SNAPSHOT_UPDATE === "1"\s*\?\s*"all"/);
  });

  it("leaves no writer mode for ordinary comparison runs", () => {
    const config = readFileSync("playwright.config.ts", "utf8");
    expect(config).toMatch(/SNAPSHOT_UPDATE === "1"\s*\?\s*"all"\s*:\s*"none"/);
  });

  it("rejects a missing baseline without writing a reference frame, and writes only on explicit update", () => {
    const dir = mkdtempSync(join(tmpdir(), "gis-baseline-policy-"));
    const png1x1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/xcAAgMBgN4nS3QAAAAASUVORK5CYII=",
      "base64",
    );
    writeFileSync(
      join(dir, "probe.spec.ts"),
      `import { expect, test } from "@playwright/test";\n` +
        `test("probe", () => {\n` +
        `  expect(Buffer.from(${JSON.stringify(png1x1.toString("base64"))}, "base64")).toMatchSnapshot("probe.png");\n` +
        `});\n`,
    );
    const configPath = join(dir, "playwright.config.mjs");
    writeFileSync(
      configPath,
      `export default {\n` +
        `  testDir: ${JSON.stringify(dir)},\n` +
        `  snapshotPathTemplate: "{testDir}/__snapshots__/{arg}{-platform}{ext}",\n` +
        `  updateSnapshots: process.env.SNAPSHOT_UPDATE === "1" ? "all" : "none",\n` +
        `};\n`,
    );

    const run = (env: Record<string, string> = {}) =>
      spawnSync("node_modules/.bin/playwright", ["test", "--config", configPath, "--reporter=list"], {
        encoding: "utf8",
        env: { ...process.env, CI: "1", ...env },
        timeout: 120_000,
      });

    const snapshotDir = join(dir, "__snapshots__");
    const writtenFrames = () =>
      existsSync(snapshotDir) ? readdirSync(snapshotDir).filter((f) => f.endsWith(".png")) : [];

    const first = run();
    expect(first.status, first.stdout + first.stderr).toBe(1);
    expect(writtenFrames(), "a plain comparison run must not create reference frames").toEqual([]);

    // The historical defect: "missing" mode passed on the second run by self-writing the baseline.
    const second = run();
    expect(second.status, second.stdout + second.stderr).toBe(1);
    expect(writtenFrames(), "a repeated comparison run must still refuse to write").toEqual([]);

    const update = run({ SNAPSHOT_UPDATE: "1" });
    expect(update.status, update.stdout + update.stderr).toBe(0);
    expect(writtenFrames().length).toBe(1);
  });
});
