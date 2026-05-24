import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import scene3dExtensionSpec from "../fixtures/specs/valid/scene3d-extension.map.json";
import { type SceneView3DExtension } from "@gis-engine/engine";
import { evaluateScene3DReleaseVisualGate } from "../../packages/scene3d/src/index.js";
import {
  buildScene3DThreeAdapterLoadPlan,
  createScene3DThreeAdapterPromotionEvidenceSummary,
  createScene3DThreeAdapterRendererEvidence,
  createScene3DThreeAdapterRuntime,
  evaluateScene3DThreeAdapterSpike,
  getScene3DThreeAdapterCapabilities,
  scene3dThreeAdapterBoundary
} from "../../packages/scene3d-three-adapter/src/index.js";

describe("SceneView3D Three.js adapter spike", () => {
  it("exposes an isolated spike boundary without enabling stable runtime support", () => {
    const capabilities = getScene3DThreeAdapterCapabilities();

    expect(scene3dThreeAdapterBoundary).toEqual(
      expect.objectContaining({
        packageName: "@gis-engine/scene3d-three-adapter",
        status: "spike",
        stableViewMode: false,
        targetRenderer: "three",
        targetTilesRenderer: "3d-tiles-renderer"
      })
    );
    expect(capabilities.renderer).toBe("scene3d-three-adapter");
    expect(capabilities.experimental).toContain("sceneview3d-three-adapter-spike");
  });

  it("turns SceneView3D sources into a deterministic Three.js adapter load plan", () => {
    const loadPlan = buildScene3DThreeAdapterLoadPlan(scene3dExtension(), {
      estimates: {
        tilesetJsonBytes: { "city-tiles": 512_000 },
        modelBytes: { "station-model": 1_048_576 },
        textureCount: { "terrain-dem": 1, "station-model": 4 },
        textureBytes: { "terrain-dem": 262_144, "station-model": 2_097_152 },
        elapsedMs: { "city-tiles": 120, "station-model": 250 },
        workerCount: 1
      }
    });

    expect(loadPlan).toEqual({
      workerCount: 1,
      resources: [
        {
          kind: "texture",
          sourceId: "terrain-dem",
          url: "./data/terrain/{z}/{x}/{y}.png",
          textureCount: 1,
          textureBytes: 262_144
        },
        {
          kind: "tileset-json",
          sourceId: "city-tiles",
          url: "./data/city/tileset.json",
          byteLength: 512_000,
          elapsedMs: 120
        },
        {
          kind: "model",
          sourceId: "station-model",
          url: "./data/models/station.glb",
          byteLength: 1_048_576,
          elapsedMs: 250
        },
        {
          kind: "texture",
          sourceId: "station-model",
          url: "./data/models/station.glb",
          textureCount: 4,
          textureBytes: 2_097_152
        }
      ]
    });
  });

  it("runs the adapter spike through the SceneResourcePolicy gate", () => {
    const report = evaluateScene3DThreeAdapterSpike(scene3dExtension(), {
      estimates: {
        tilesetJsonBytes: { "city-tiles": 512_000 },
        modelBytes: { "station-model": 1_048_576 },
        textureCount: { "terrain-dem": 1, "station-model": 4 },
        textureBytes: { "terrain-dem": 262_144, "station-model": 2_097_152 },
        workerCount: 1
      }
    });

    expect(report.kind).toBe("Scene3DThreeAdapterSpikeReport");
    expect(report.runtimeSupported).toBe(false);
    expect(report.stableViewMode).toBe(false);
    expect(report.resourceReport.valid).toBe(true);
    expect(report.resourceReport.diagnostics).toEqual([]);
    expect(report.diagnosticCounts).toEqual({ error: 0, warning: 0, info: 1 });
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "info",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/extensions/scene3d"
      })
    );
  });

  it("does not create passing renderer evidence without visual capture metrics", () => {
    const spikeReport = evaluateScene3DThreeAdapterSpike(scene3dExtension(), {
      estimates: {
        tilesetJsonBytes: { "city-tiles": 512_000 },
        modelBytes: { "station-model": 1_048_576 },
        textureCount: { "terrain-dem": 1, "station-model": 4 },
        textureBytes: { "terrain-dem": 262_144, "station-model": 2_097_152 },
        workerCount: 1
      }
    });

    const evidence = createScene3DThreeAdapterRendererEvidence(spikeReport);

    expect(evidence.passed).toBe(false);
    expect(evidence.renderer).toBe("scene3d-three-adapter");
    expect(evidence.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/rendererVisualEvidence"
      })
    );
  });

  it("creates release-gate compatible renderer evidence from a nonblank capture", () => {
    const spikeReport = evaluateScene3DThreeAdapterSpike(scene3dExtension(), {
      estimates: {
        tilesetJsonBytes: { "city-tiles": 512_000 },
        modelBytes: { "station-model": 1_048_576 },
        textureCount: { "terrain-dem": 1, "station-model": 4 },
        textureBytes: { "terrain-dem": 262_144, "station-model": 2_097_152 },
        workerCount: 1
      }
    });
    const evidence = createScene3DThreeAdapterRendererEvidence(spikeReport, {
      capture: {
        reportPath: "test-results/scene3d-three-adapter/report.json",
        width: 800,
        height: 600,
        nonTransparentPixels: 240_000,
        changedPixelsFromBackground: 120_000,
        targetLayerPixels: {
          "city-buildings": 42_000
        },
        consoleErrors: []
      }
    });
    const releaseGate = evaluateScene3DReleaseVisualGate(scene3dExtension(), {
      ciTier: "release",
      loadedSourceIds: ["terrain-dem", "city-tiles", "station-model"],
      rendererVisualEvidence: evidence
    });

    expect(evidence).toEqual({
      passed: true,
      renderer: "scene3d-three-adapter",
      reportPath: "test-results/scene3d-three-adapter/report.json",
      diagnostics: []
    });
    expect(releaseGate.decision).toBe("passed");
    expect(releaseGate.accepted).toBe(true);
  });

  it("keeps runtime load, snapshot, query, and destroy adapter-local behind the spike boundary", async () => {
    const runtime = createScene3DThreeAdapterRuntime(scene3dExtension(), {
      estimates: {
        tilesetJsonBytes: { "city-tiles": 512_000 },
        modelBytes: { "station-model": 1_048_576 },
        textureCount: { "terrain-dem": 1, "station-model": 4 },
        textureBytes: { "terrain-dem": 262_144, "station-model": 2_097_152 },
        workerCount: 1
      }
    });

    expect(runtime.stableViewMode).toBe(false);
    expect(runtime.runtimeSupported).toBe(false);
    expect(runtime.loadPlan.resources).toHaveLength(4);

    const loadReport = await runtime.load();
    expect(loadReport.loaded).toBe(true);
    expect(loadReport.resourceReport.valid).toBe(true);
    expect(loadReport.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "info",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/extensions/scene3d"
      })
    );

    const snapshot = await runtime.snapshot({
      format: "data-url",
      requireLoadedResources: true
    });
    expect(snapshot.passed).toBe(true);
    expect(snapshot.summary).toEqual(
      expect.objectContaining({
        sourceCount: 3,
        layerCount: 3,
        visibleLayerCount: 3,
        pickableLayerCount: 2,
        format: "data-url"
      })
    );
    expect(snapshot.dataUrl).toMatch(/^data:image\/png;base64,/);

    const query = await runtime.query();
    expect(query.diagnostics).toEqual([]);
    expect(query.picks).toHaveLength(2);
    expect(query.picks.map((pick) => pick.objectId)).toEqual([
      "city-tiles:city:mock",
      "station-model:station:mock"
    ]);

    const evidence = runtime.rendererEvidence({
      capture: {
        reportPath: "test-results/scene3d-three-adapter/report.json",
        width: 800,
        height: 600,
        nonTransparentPixels: 240_000,
        changedPixelsFromBackground: 120_000,
        consoleErrors: []
      }
    });
    const releaseGate = evaluateScene3DReleaseVisualGate(scene3dExtension(), {
      ciTier: "release",
      loadedSourceIds: ["terrain-dem", "city-tiles", "station-model"],
      rendererVisualEvidence: evidence
    });

    expect(evidence.passed).toBe(true);
    expect(releaseGate.accepted).toBe(true);

    const destroyReport = await runtime.destroy();
    expect(destroyReport).toEqual({
      destroyed: true,
      diagnostics: []
    });

    const destroyedSnapshot = await runtime.snapshot();
    expect(destroyedSnapshot.passed).toBe(false);
    expect(destroyedSnapshot.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "info",
        code: "RENDER.DESTROYED"
      })
    );

    const destroyedQuery = await runtime.query();
    expect(destroyedQuery.picks).toEqual([]);
    expect(destroyedQuery.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "info",
        code: "RENDER.DESTROYED"
      })
    );
  });

  it("summarizes adapter promotion evidence without allowing stable promotion", async () => {
    const runtime = createScene3DThreeAdapterRuntime(scene3dExtension(), {
      estimates: {
        tilesetJsonBytes: { "city-tiles": 512_000 },
        modelBytes: { "station-model": 1_048_576 },
        textureCount: { "terrain-dem": 1, "station-model": 4 },
        textureBytes: { "terrain-dem": 262_144, "station-model": 2_097_152 },
        workerCount: 1
      }
    });

    const missingSummary = createScene3DThreeAdapterPromotionEvidenceSummary(runtime.spikeReport);
    expect(missingSummary.decisionReady).toBe(false);
    expect(missingSummary.stablePromotionAllowed).toBe(false);
    expect(missingSummary.evidence.load.present).toBe(false);
    expect(missingSummary.evidence.snapshot.present).toBe(false);
    expect(missingSummary.evidence.query.present).toBe(false);
    expect(missingSummary.evidence.rendererVisual.present).toBe(false);
    expect(missingSummary.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/promotionEvidence/load"
      })
    );

    const loadReport = await runtime.load();
    const snapshot = await runtime.snapshot({
      format: "data-url",
      requireLoadedResources: true
    });
    const query = await runtime.query();
    const rendererVisualEvidence = runtime.rendererEvidence({
      capture: {
        reportPath: "test-results/scene3d-three-adapter/report.json",
        width: 800,
        height: 600,
        nonTransparentPixels: 240_000,
        changedPixelsFromBackground: 120_000,
        targetLayerPixels: {
          "city-buildings": 42_000
        },
        consoleErrors: []
      }
    });
    const summary = createScene3DThreeAdapterPromotionEvidenceSummary(runtime.spikeReport, {
      loadReport,
      snapshot,
      query,
      rendererVisualEvidence
    });

    expect(summary).toEqual(
      expect.objectContaining({
        kind: "Scene3DThreeAdapterPromotionEvidenceSummary",
        stableViewMode: false,
        runtimeSupported: false,
        decisionReady: true,
        stablePromotionAllowed: false
      })
    );
    expect(summary.evidence.resourcePolicy).toEqual({
      valid: true,
      resourceCount: 4,
      workerCount: 1,
      diagnostics: { error: 0, warning: 0, info: 0 }
    });
    expect(summary.evidence.load).toEqual({
      present: true,
      loaded: true,
      diagnostics: { error: 0, warning: 0, info: 1 }
    });
    expect(summary.evidence.snapshot).toEqual({
      present: true,
      passed: true,
      pendingSourceCount: 0,
      format: "data-url",
      diagnostics: { error: 0, warning: 0, info: 0 }
    });
    expect(summary.evidence.query).toEqual({
      present: true,
      pickCount: 2,
      diagnostics: { error: 0, warning: 0, info: 0 }
    });
    expect(summary.evidence.rendererVisual).toEqual({
      present: true,
      passed: true,
      reportPath: "test-results/scene3d-three-adapter/report.json",
      diagnostics: { error: 0, warning: 0, info: 0 }
    });
    expect(summary.diagnosticCounts.error).toBe(0);
  });

  it("keeps renderer evidence failed when the resource policy gate fails", () => {
    const spikeReport = evaluateScene3DThreeAdapterSpike(scene3dExtension(), {
      estimates: {
        tilesetJsonBytes: { "city-tiles": 2_000_000 },
        modelBytes: { "station-model": 1_048_576 },
        workerCount: 1
      }
    });
    const evidence = createScene3DThreeAdapterRendererEvidence(spikeReport, {
      capture: {
        reportPath: "test-results/scene3d-three-adapter/report.json",
        width: 800,
        height: 600,
        nonTransparentPixels: 240_000,
        changedPixelsFromBackground: 120_000,
        consoleErrors: []
      }
    });

    expect(evidence.passed).toBe(false);
    expect(evidence.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "SECURITY.RESOURCE_TOO_LARGE",
        path: "/extensions/scene3d/sources/city-tiles/url"
      })
    );
  });

  it("keeps renderer dependencies out of package manifests during the spike", () => {
    const enginePackage = readPackageJson("packages/engine/package.json");
    const scene3dPackage = readPackageJson("packages/scene3d/package.json");
    const threeAdapterPackage = readPackageJson("packages/scene3d-three-adapter/package.json");

    for (const dependency of scene3dThreeAdapterBoundary.requiredRuntimePeerDependencies) {
      expect(enginePackage.dependencies ?? {}).not.toHaveProperty(dependency);
      expect(scene3dPackage.dependencies ?? {}).not.toHaveProperty(dependency);
      expect(threeAdapterPackage.dependencies ?? {}).not.toHaveProperty(dependency);
      expect(threeAdapterPackage.devDependencies ?? {}).not.toHaveProperty(dependency);
      expect(threeAdapterPackage.peerDependencies ?? {}).not.toHaveProperty(dependency);
    }
  });
});

function scene3dExtension(): SceneView3DExtension {
  return structuredClone(scene3dExtensionSpec.extensions.scene3d) as SceneView3DExtension;
}

function readPackageJson(path: string) {
  return JSON.parse(readFileSync(resolve(path), "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
}
