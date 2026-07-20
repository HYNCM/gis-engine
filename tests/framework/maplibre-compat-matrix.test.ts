import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildPlan } from "../../scripts/gate-plan.mjs";
import {
  createConsumerFixture,
  MAPLIBRE_COMPATIBILITY_VERSIONS,
  MAPLIBRE_RELEASE_BASELINE,
} from "../../scripts/maplibre-compat-matrix.mjs";

describe("MapLibre compatibility matrix", () => {
  it("pins the release baseline and checked prerelease independently", () => {
    expect(MAPLIBRE_RELEASE_BASELINE).toBe("5.24.0");
    expect(MAPLIBRE_COMPATIBILITY_VERSIONS).toEqual(["5.24.0", "6.0.0-22"]);
  });

  it.each(MAPLIBRE_COMPATIBILITY_VERSIONS)("creates an isolated exact-version consumer for %s", (version) => {
    const fixture = createConsumerFixture(version, "/tmp/gis-engine.tgz");

    expect(fixture.packageJson.dependencies["maplibre-gl"]).toBe(version);
    expect(fixture.packageJson.dependencies["@gis-engine/engine"]).toBe("file:/tmp/gis-engine.tgz");
    expect(fixture.packageJson.private).toBe(true);
    expect(fixture.tsconfig.compilerOptions.moduleResolution).toBe("Bundler");
    expect(fixture.source).toContain('import "maplibre-gl/dist/maplibre-gl.css"');
    expect(fixture.source).toContain("new MapLibreAdapter()");
    expect(fixture.source).toContain('adapter.on("load"');
    expect(fixture.source).toContain("InteractionBridgeEvent");
    expect(fixture.source).toContain("window.__GIS_MATRIX_RESULT__");
    expect(fixture.source).not.toMatch(/^await\s/m);
    if (version === "6.0.0-22") {
      expect(fixture.source).toContain("setWorkerUrl");
      expect(fixture.workerDelivery).toBe("explicit-module-worker");
    } else {
      expect(fixture.source).not.toContain("setWorkerUrl");
      expect(fixture.workerDelivery).toBe("package-default");
    }
  });

  it("routes MapLibre adapter changes through the executable compatibility matrix", () => {
    const commands = [
      ...buildPlan(["packages/engine/src/renderer/maplibre/adapter.ts", "tests/e2e/render-pipeline.spec.ts"]).keys(),
    ];

    expect(commands).toContain("pnpm test:compat:maplibre");
    expect(commands).toContain("pnpm test:adapter");
    expect(commands).toContain("pnpm test:e2e:browser");
    expect(commands).toContain("GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual");
  });

  it("derives peer eligibility from a native install attempt before using evidence-only resolution", () => {
    const runner = readFileSync("scripts/maplibre-compat-matrix.mjs", "utf8");

    expect(runner).toContain("attemptNativePeerInstall");
    expect(runner).toContain('"--legacy-peer-deps"');
    expect(runner).not.toContain("const peerRangeSatisfied = version");
  });
});
