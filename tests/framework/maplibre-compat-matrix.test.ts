import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildPlan } from "../../scripts/gate-plan.mjs";
import {
  adapterQueryStageStatus,
  buildPerformanceDelta,
  createConsumerFixture,
  MAPLIBRE_COMPATIBILITY_VERSIONS,
  MAPLIBRE_RELEASE_BASELINE,
  requireNativePeerInstall,
} from "../../scripts/maplibre-compat-matrix.mjs";

describe("MapLibre compatibility matrix", () => {
  it("pins the release baseline and checked prerelease independently", () => {
    expect(MAPLIBRE_RELEASE_BASELINE).toBe("5.24.0");
    expect(MAPLIBRE_COMPATIBILITY_VERSIONS).toEqual(["5.24.0", "6.1.0"]);
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
    expect(fixture.source).toContain('rawMap.on("styleimagemissing"');
    expect(fixture.source).toContain("queryRenderedFeatures");
    expect(fixture.source).toContain("overscaledQueryPassed");
    expect(fixture.source).toContain("window.location.origin}/tiles/{z}/{x}/{y}.pbf");
    expect(fixture.source).not.toContain('tiles: ["/tiles/{z}/{x}/{y}.pbf"]');
    expect(fixture.source).toContain("renderDurationMs");
    expect(fixture.source).toContain("queryDurationMs");
    expect(fixture.source).toContain("adapterQueryPassed");
    expect(fixture.source).toContain("adapterQueryDiagnostics");
    expect(fixture.source).toContain("adapterQueryFeatureIdentity");
    expect(fixture.source).toContain('name: "matrix"');
    expect(fixture.source).toContain('id: "matrix-point"');
    expect(fixture.source).toContain('source: "points"');
    expect(fixture.html).toContain("script-src 'self' 'unsafe-eval'");
    expect(fixture.cspScriptSource).toBe("'self' 'unsafe-eval'");
    if (version === "6.1.0") {
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

  it("fails closed when an exact stable entry cannot resolve its peer dependency natively", () => {
    const runner = readFileSync("scripts/maplibre-compat-matrix.mjs", "utf8");

    expect(runner).toContain("attemptNativePeerInstall");
    expect(runner).not.toContain('"--legacy-peer-deps"');
    expect(runner).toContain("MAPLIBRE_NATIVE_INSTALL_REJECTED");
    expect(runner).not.toContain("const peerRangeSatisfied = version");
    expect(() =>
      requireNativePeerInstall("6.1.0", { status: "rejected", error: "npm error code ERESOLVE" }),
    ).toThrowError(/\[MAPLIBRE_NATIVE_INSTALL_REJECTED\].*6\.1\.0.*ERESOLVE/);
    expect(requireNativePeerInstall("6.1.0", { status: "passed", error: null })).toMatchObject({
      peerRangeSatisfied: true,
      peerResolution: "native",
    });
  });

  it("records exact package, browser, CSP, behavior, and timing evidence", () => {
    const runner = readFileSync("scripts/maplibre-compat-matrix.mjs", "utf8");
    const browserGate = readFileSync("tests/compatibility/maplibre-compatibility.spec.ts", "utf8");

    expect(runner).toContain("importForm");
    expect(runner).toContain("browserEngine");
    expect(runner).toContain("workerPath");
    expect(runner).toContain("cspWorkerSource");
    expect(runner).toContain("cspScriptSource");
    expect(runner).toContain("missingStyleImageHandled");
    expect(runner).toContain("overscaledQueryPassed");
    expect(runner).toContain("queryRenderedFeaturesCount");
    expect(runner).toContain("renderDurationMs");
    expect(runner).toContain("queryDurationMs");
    expect(runner).toContain("browserEvidence.adapterQueryPassed");
    expect(browserGate).toContain("Boolean(window.__GIS_MATRIX_RESULT__)");
    expect(browserGate).not.toContain('() => window.__GIS_MATRIX_RESULT__?.status !== "loading"');
    expect(browserGate).toContain("expect(browserState.rawMap).toMatchObject");
    expect(browserGate).toContain("browserState.rawMap?.overscaledSourcePresent");
    expect(browserGate).toContain("browserState.rawMap?.overscaledSourceLoaded");
    expect(browserGate).toContain("browserState.rawMap?.overscaledSourceFeatureCount");
    expect(browserGate).toContain("requestedPaths.add(requestPath)");
    expect(browserGate).toContain('requestedPaths.has("/tiles/0/0/0.pbf")');
    expect(browserGate).toContain('requestedPaths.has("/maplibre-gl-worker.mjs")');
    expect(browserGate).toContain('requestedPaths.has("/maplibre-gl-shared.mjs")');
    expect(browserGate).toContain("serverRequestedPaths");
    expect(browserGate).toContain("result?.adapterQueryPassed");
    expect(browserGate).toContain("result?.adapterQueryDiagnostics");
    expect(browserGate).toContain("result?.adapterQueryFeatureIdentity");
  });

  it("does not accept an adapter query from feature count alone", () => {
    expect(adapterQueryStageStatus({ adapterQueryPassed: false, adapterQueryFeaturesCount: 1 })).toBe("failed");
    expect(adapterQueryStageStatus({ adapterQueryPassed: true, adapterQueryFeaturesCount: 1 })).toBe("passed");
    expect(adapterQueryStageStatus({ adapterQueryFeaturesCount: 1 })).toBe("failed");
  });

  it("runs the exact stable-v6 matrix in CI without changing the release baseline", () => {
    const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
    const enginePackage = JSON.parse(readFileSync("packages/engine/package.json", "utf8"));

    expect(workflow).toContain('maplibre-version: ["5.24.0", "6.1.0"]');
    expect(workflow).not.toContain("6.0.0-22");
    expect(enginePackage.peerDependencies["maplibre-gl"]).toBe("^5.0.0 || ^6.0.0");
  });

  it("compares stable-v6 render and query timings with the release baseline", () => {
    const delta = buildPerformanceDelta([
      { version: "5.24.0", renderDurationMs: 100, queryDurationMs: 4 },
      { version: "6.1.0", renderDurationMs: 80, queryDurationMs: 5 },
    ]);

    expect(delta).toEqual({
      baselineVersion: "5.24.0",
      candidateVersion: "6.1.0",
      renderDurationMs: { baseline: 100, candidate: 80, delta: -20, deltaPercent: -20 },
      queryDurationMs: { baseline: 4, candidate: 5, delta: 1, deltaPercent: 25 },
    });
  });
});
