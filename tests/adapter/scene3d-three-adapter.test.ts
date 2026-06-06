import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  type MapSpec,
  Scene3DStableRuntimeBlockerCodes,
  type SceneView3DExtension,
  validateSpec,
} from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import { evaluateScene3DReleaseVisualGate } from "../../packages/scene3d/src/index.js";
import {
  auditScene3DThreeAdapterDependencyBoundary,
  buildScene3DThreeAdapterLoadPlan,
  createScene3DThreeAdapterPromotionEvidenceSummary,
  createScene3DThreeAdapterRendererEvidence,
  createScene3DThreeAdapterRuntime,
  evaluateScene3DThreeAdapterSpike,
  getScene3DThreeAdapterCapabilities,
  getScene3DThreeAdapterLifecycleSemantics,
  getScene3DThreeAdapterStableRendererContract,
  scene3dThreeAdapterBoundary,
} from "../../packages/scene3d-three-adapter/src/index.js";
import scene3dExtensionSpec from "../fixtures/specs/valid/scene3d-extension.map.json";

describe("SceneView3D Three.js adapter spike", () => {
  it("exposes an isolated spike boundary without enabling stable runtime support", () => {
    const capabilities = getScene3DThreeAdapterCapabilities();

    expect(scene3dThreeAdapterBoundary).toEqual(
      expect.objectContaining({
        packageName: "@gis-engine/scene3d-three-adapter",
        status: "spike",
        stableViewMode: false,
        targetRenderer: "three",
        targetTilesRenderer: "3d-tiles-renderer",
      }),
    );
    expect(capabilities.renderer).toBe("scene3d-three-adapter");
    expect(capabilities.experimental).toContain("sceneview3d-three-adapter-spike");
  });

  it("exports a machine-readable stable renderer handoff contract while keeping stable runtime blocked", () => {
    const contract = getScene3DThreeAdapterStableRendererContract();

    expect(contract).toEqual(
      expect.objectContaining({
        kind: "Scene3DThreeAdapterStableRendererContractSummary",
        status: "adapter-contract-defined",
        stableViewMode: false,
        runtimeSupported: false,
        stableRuntimeBlocked: true,
        promotionDecisionTask: "TASK-2026W23-SRC-006",
      }),
    );
    expect(contract.guardrails).toEqual({
      schemaFirst: true,
      commandOnlyMutation: true,
      structuredDiagnostics: true,
      snapshotVerification: true,
      resourcePolicyRequired: true,
      adapterBoundaryRequired: true,
    });
    expect(contract.obligations.map((obligation) => obligation.id)).toEqual([
      "load",
      "render",
      "resize",
      "camera",
      "snapshot",
      "query",
      "destroy",
      "diagnostics",
      "resourceCleanup",
    ]);
    expect(contract.obligations.every((obligation) => obligation.required)).toBe(true);
    expect(contract.obligations.find((obligation) => obligation.id === "snapshot")).toEqual(
      expect.objectContaining({
        requiredEvidence: expect.arrayContaining(["Scene3DMockSnapshotResult", "visual snapshot report"]),
      }),
    );
    expect(contract.obligations.find((obligation) => obligation.id === "query")).toEqual(
      expect.objectContaining({
        requiredEvidence: expect.arrayContaining(["Scene3DQueryResult", "pick coverage report"]),
      }),
    );
    expect(contract.lifecycleSemantics.map((semantic) => semantic.operation)).toEqual([
      "load",
      "reload",
      "resize",
      "snapshot",
      "query",
      "failure",
      "cancel",
      "destroy",
      "resourceCleanup",
    ]);
    expect(contract.lifecycleSemantics.find((semantic) => semantic.operation === "failure")).toEqual(
      expect.objectContaining({
        to: "failed",
        diagnosticPaths: expect.arrayContaining(["/runtime/failed/load", "/extensions/scene3d/sources"]),
      }),
    );
    expect(contract.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "error",
          code: "CAPABILITY.UNSUPPORTED",
          blockerCode: Scene3DStableRuntimeBlockerCodes.ViewMode,
          path: "/view/mode",
        }),
        expect.objectContaining({
          severity: "error",
          code: "CAPABILITY.UNSUPPORTED",
          blockerCode: Scene3DStableRuntimeBlockerCodes.Renderer,
          path: "/capabilities/renderer",
        }),
        expect.objectContaining({
          severity: "error",
          code: "CAPABILITY.UNSUPPORTED",
          blockerCode: Scene3DStableRuntimeBlockerCodes.Dimensions,
          path: "/capabilities/dimensions",
        }),
      ]),
    );
  });

  it("exports lifecycle and failure-state semantics as adapter-local contract evidence", () => {
    const report = getScene3DThreeAdapterLifecycleSemantics();

    expect(report).toEqual(
      expect.objectContaining({
        kind: "Scene3DThreeAdapterLifecycleSemanticsReport",
        stableViewMode: false,
        runtimeSupported: false,
        stableRuntimeBlocked: true,
      }),
    );
    expect(report.semantics.every((semantic) => semantic.deterministic)).toBe(true);
    expect(report.semantics.find((semantic) => semantic.operation === "resize")).toEqual(
      expect.objectContaining({
        diagnosticCodes: expect.arrayContaining(["RENDER.ADAPTER_ERROR"]),
        diagnosticPaths: ["/renderer/resize/width", "/renderer/resize/height"],
      }),
    );
    expect(report.semantics.find((semantic) => semantic.operation === "cancel")).toEqual(
      expect.objectContaining({
        to: "destroyed",
        idempotent: true,
        diagnosticPaths: expect.arrayContaining(["/runtime/destroy", "/runtime/destroyed/load"]),
      }),
    );
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/capabilities/renderer",
      }),
    );
  });

  it("keeps stable scene3d view mode blocked even with the adapter contract present", () => {
    const spec = structuredClone(scene3dExtensionSpec) as MapSpec;
    spec.view.mode = "scene3d";
    spec.capabilities = {
      renderer: "scene3d",
      dimensions: ["3d"],
      experimental: ["sceneview3d-v1"],
    };

    const report = validateSpec(spec);

    expect(getScene3DThreeAdapterStableRendererContract().stableRuntimeBlocked).toBe(true);
    expect(report.valid).toBe(false);
    expect(report.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "CAPABILITY.UNSUPPORTED",
          blockerCode: Scene3DStableRuntimeBlockerCodes.ViewMode,
          path: "/view/mode",
        }),
        expect.objectContaining({
          code: "CAPABILITY.UNSUPPORTED",
          blockerCode: Scene3DStableRuntimeBlockerCodes.Renderer,
          path: "/capabilities/renderer",
        }),
        expect.objectContaining({
          code: "CAPABILITY.UNSUPPORTED",
          blockerCode: Scene3DStableRuntimeBlockerCodes.Dimensions,
          path: "/capabilities/dimensions",
        }),
      ]),
    );
  });

  it("turns SceneView3D sources into a deterministic Three.js adapter load plan", () => {
    const loadPlan = buildScene3DThreeAdapterLoadPlan(scene3dExtension(), {
      estimates: {
        tilesetJsonBytes: { "city-tiles": 512_000 },
        modelBytes: { "station-model": 1_048_576 },
        textureCount: { "terrain-dem": 1, "station-model": 4 },
        textureBytes: { "terrain-dem": 262_144, "station-model": 2_097_152 },
        elapsedMs: { "city-tiles": 120, "station-model": 250 },
        workerCount: 1,
      },
    });

    expect(loadPlan).toEqual({
      workerCount: 1,
      resources: [
        {
          kind: "texture",
          sourceId: "terrain-dem",
          url: "./data/terrain/{z}/{x}/{y}.png",
          textureCount: 1,
          textureBytes: 262_144,
        },
        {
          kind: "tileset-json",
          sourceId: "city-tiles",
          url: "./data/city/tileset.json",
          byteLength: 512_000,
          elapsedMs: 120,
        },
        {
          kind: "model",
          sourceId: "station-model",
          url: "./data/models/station.glb",
          byteLength: 1_048_576,
          elapsedMs: 250,
        },
        {
          kind: "texture",
          sourceId: "station-model",
          url: "./data/models/station.glb",
          textureCount: 4,
          textureBytes: 2_097_152,
        },
      ],
    });
  });

  it("runs the adapter spike through the SceneResourcePolicy gate", () => {
    const report = evaluateScene3DThreeAdapterSpike(scene3dExtension(), {
      estimates: {
        tilesetJsonBytes: { "city-tiles": 512_000 },
        modelBytes: { "station-model": 1_048_576 },
        textureCount: { "terrain-dem": 1, "station-model": 4 },
        textureBytes: { "terrain-dem": 262_144, "station-model": 2_097_152 },
        workerCount: 1,
      },
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
        path: "/extensions/scene3d",
      }),
    );
  });

  it("does not create passing renderer evidence without visual capture metrics", () => {
    const spikeReport = evaluateScene3DThreeAdapterSpike(scene3dExtension(), {
      estimates: {
        tilesetJsonBytes: { "city-tiles": 512_000 },
        modelBytes: { "station-model": 1_048_576 },
        textureCount: { "terrain-dem": 1, "station-model": 4 },
        textureBytes: { "terrain-dem": 262_144, "station-model": 2_097_152 },
        workerCount: 1,
      },
    });

    const evidence = createScene3DThreeAdapterRendererEvidence(spikeReport);

    expect(evidence.passed).toBe(false);
    expect(evidence.renderer).toBe("scene3d-three-adapter");
    expect(evidence.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/rendererVisualEvidence",
      }),
    );
  });

  it("creates release-gate compatible renderer evidence from a nonblank capture", () => {
    const spikeReport = evaluateScene3DThreeAdapterSpike(scene3dExtension(), {
      estimates: {
        tilesetJsonBytes: { "city-tiles": 512_000 },
        modelBytes: { "station-model": 1_048_576 },
        textureCount: { "terrain-dem": 1, "station-model": 4 },
        textureBytes: { "terrain-dem": 262_144, "station-model": 2_097_152 },
        workerCount: 1,
      },
    });
    const evidence = createScene3DThreeAdapterRendererEvidence(spikeReport, {
      capture: {
        reportPath: "test-results/scene3d-three-adapter/report.json",
        width: 800,
        height: 600,
        nonTransparentPixels: 240_000,
        changedPixelsFromBackground: 120_000,
        targetLayerPixels: {
          "city-buildings": 42_000,
        },
        consoleErrors: [],
      },
    });
    const releaseGate = evaluateScene3DReleaseVisualGate(scene3dExtension(), {
      ciTier: "release",
      loadedSourceIds: ["terrain-dem", "city-tiles", "station-model"],
      rendererVisualEvidence: evidence,
    });

    expect(evidence).toEqual({
      passed: true,
      renderer: "scene3d-three-adapter",
      reportPath: "test-results/scene3d-three-adapter/report.json",
      diagnostics: [],
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
        workerCount: 1,
      },
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
        path: "/extensions/scene3d",
      }),
    );

    const snapshot = await runtime.snapshot({
      format: "data-url",
      requireLoadedResources: true,
    });
    expect(snapshot.passed).toBe(true);
    expect(snapshot.summary).toEqual(
      expect.objectContaining({
        sourceCount: 3,
        layerCount: 3,
        visibleLayerCount: 3,
        pickableLayerCount: 2,
        format: "data-url",
      }),
    );
    expect(snapshot.dataUrl).toMatch(/^data:image\/png;base64,/);

    const query = await runtime.query();
    expect(query.diagnostics).toEqual([]);
    expect(query.picks).toHaveLength(2);
    expect(query.picks.map((pick) => pick.objectId)).toEqual(["city-tiles:city:mock", "station-model:station:mock"]);

    const evidence = runtime.rendererEvidence({
      capture: {
        reportPath: "test-results/scene3d-three-adapter/report.json",
        width: 800,
        height: 600,
        nonTransparentPixels: 240_000,
        changedPixelsFromBackground: 120_000,
        consoleErrors: [],
      },
    });
    const releaseGate = evaluateScene3DReleaseVisualGate(scene3dExtension(), {
      ciTier: "release",
      loadedSourceIds: ["terrain-dem", "city-tiles", "station-model"],
      rendererVisualEvidence: evidence,
    });

    expect(evidence.passed).toBe(true);
    expect(releaseGate.accepted).toBe(true);

    const destroyReport = await runtime.destroy();
    expect(destroyReport).toEqual(
      expect.objectContaining({
        destroyed: true,
        diagnostics: [],
        resources: expect.objectContaining({
          adapter: "@gis-engine/scene3d-three-adapter",
          stableRuntimeBlocked: true,
          verifiable: false,
          loadedBeforeDestroy: true,
          failedBeforeDestroy: false,
          plannedResourceCount: 4,
          plannedWorkerCount: 1,
        }),
      }),
    );

    const destroyedSnapshot = await runtime.snapshot();
    expect(destroyedSnapshot.passed).toBe(false);
    expect(destroyedSnapshot.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "info",
        code: "RENDER.DESTROYED",
        path: "/runtime/destroyed/snapshot",
      }),
    );

    const destroyedQuery = await runtime.query();
    expect(destroyedQuery.picks).toEqual([]);
    expect(destroyedQuery.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "info",
        code: "RENDER.DESTROYED",
        path: "/runtime/destroyed/query",
      }),
    );
  });

  it("keeps failed loads unloaded and reports stable failed-state diagnostics", async () => {
    const runtime = createScene3DThreeAdapterRuntime(scene3dExtension(), {
      estimates: {
        tilesetJsonBytes: { "city-tiles": 2_000_000 },
        modelBytes: { "station-model": 1_048_576 },
        workerCount: 1,
      },
    });

    const loadReport = await runtime.load();
    expect(loadReport.loaded).toBe(false);
    expect(loadReport.resourceReport.valid).toBe(false);
    expect(loadReport.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "error",
          code: "SECURITY.RESOURCE_TOO_LARGE",
          path: "/extensions/scene3d/sources/city-tiles/url",
        }),
        expect.objectContaining({
          severity: "error",
          code: "RENDER.ADAPTER_ERROR",
          path: "/runtime/failed/load",
        }),
      ]),
    );

    const snapshot = await runtime.snapshot({ format: "data-url" });
    expect(snapshot.passed).toBe(false);
    expect(snapshot.dataUrl).toBeUndefined();
    expect(snapshot.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "RENDER.ADAPTER_ERROR",
        path: "/runtime/failed/snapshot",
      }),
    );

    const query = await runtime.query();
    expect(query.picks).toEqual([]);
    expect(query.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "RENDER.ADAPTER_ERROR",
        path: "/runtime/failed/query",
      }),
    );

    const destroyReport = await runtime.destroy();
    expect(destroyReport.resources).toEqual(
      expect.objectContaining({
        loadedBeforeDestroy: false,
        failedBeforeDestroy: true,
        alreadyDestroyed: false,
      }),
    );
  });

  it("reports invalid resize dimensions with stable renderer paths", async () => {
    const runtime = createScene3DThreeAdapterRuntime(scene3dExtension(), {
      estimates: {
        tilesetJsonBytes: { "city-tiles": 512_000 },
        modelBytes: { "station-model": 1_048_576 },
        textureCount: { "terrain-dem": 1, "station-model": 4 },
        textureBytes: { "terrain-dem": 262_144, "station-model": 2_097_152 },
        workerCount: 1,
      },
    });
    await runtime.load();

    const snapshot = await runtime.snapshot({
      width: 0,
      height: Number.NaN,
      format: "data-url",
    });

    expect(snapshot.passed).toBe(false);
    expect(snapshot.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "error",
          code: "RENDER.ADAPTER_ERROR",
          path: "/renderer/resize/width",
        }),
        expect.objectContaining({
          severity: "error",
          code: "RENDER.ADAPTER_ERROR",
          path: "/renderer/resize/height",
        }),
      ]),
    );
  });

  it("summarizes adapter promotion evidence without allowing stable promotion", async () => {
    const runtime = createScene3DThreeAdapterRuntime(scene3dExtension(), {
      estimates: {
        tilesetJsonBytes: { "city-tiles": 512_000 },
        modelBytes: { "station-model": 1_048_576 },
        textureCount: { "terrain-dem": 1, "station-model": 4 },
        textureBytes: { "terrain-dem": 262_144, "station-model": 2_097_152 },
        workerCount: 1,
      },
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
        path: "/promotionEvidence/load",
      }),
    );

    const loadReport = await runtime.load();
    const snapshot = await runtime.snapshot({
      format: "data-url",
      requireLoadedResources: true,
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
          "city-buildings": 42_000,
        },
        consoleErrors: [],
      },
    });
    const summary = createScene3DThreeAdapterPromotionEvidenceSummary(runtime.spikeReport, {
      loadReport,
      snapshot,
      query,
      rendererVisualEvidence,
    });

    expect(summary).toEqual(
      expect.objectContaining({
        kind: "Scene3DThreeAdapterPromotionEvidenceSummary",
        stableViewMode: false,
        runtimeSupported: false,
        decisionReady: true,
        stablePromotionAllowed: false,
      }),
    );
    expect(summary.evidence.resourcePolicy).toEqual({
      valid: true,
      resourceCount: 4,
      workerCount: 1,
      diagnostics: { error: 0, warning: 0, info: 0 },
    });
    expect(summary.evidence.load).toEqual({
      present: true,
      loaded: true,
      diagnostics: { error: 0, warning: 0, info: 1 },
    });
    expect(summary.evidence.snapshot).toEqual({
      present: true,
      passed: true,
      pendingSourceCount: 0,
      format: "data-url",
      diagnostics: { error: 0, warning: 0, info: 0 },
    });
    expect(summary.evidence.query).toEqual({
      present: true,
      pickCount: 2,
      diagnostics: { error: 0, warning: 0, info: 0 },
    });
    expect(summary.evidence.rendererVisual).toEqual({
      present: true,
      passed: true,
      reportPath: "test-results/scene3d-three-adapter/report.json",
      diagnostics: { error: 0, warning: 0, info: 0 },
    });
    expect(summary.diagnosticCounts.error).toBe(0);
  });

  it("keeps renderer evidence failed when the resource policy gate fails", () => {
    const spikeReport = evaluateScene3DThreeAdapterSpike(scene3dExtension(), {
      estimates: {
        tilesetJsonBytes: { "city-tiles": 2_000_000 },
        modelBytes: { "station-model": 1_048_576 },
        workerCount: 1,
      },
    });
    const evidence = createScene3DThreeAdapterRendererEvidence(spikeReport, {
      capture: {
        reportPath: "test-results/scene3d-three-adapter/report.json",
        width: 800,
        height: 600,
        nonTransparentPixels: 240_000,
        changedPixelsFromBackground: 120_000,
        consoleErrors: [],
      },
    });

    expect(evidence.passed).toBe(false);
    expect(evidence.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "SECURITY.RESOURCE_TOO_LARGE",
        path: "/extensions/scene3d/sources/city-tiles/url",
      }),
    );
  });

  it("keeps renderer dependencies out of package manifests during the spike", () => {
    const contract = getScene3DThreeAdapterStableRendererContract();
    const enginePackage = readPackageJson("packages/engine/package.json");
    const scene3dPackage = readPackageJson("packages/scene3d/package.json");
    const aiPackage = readPackageJson("packages/ai/package.json");
    const threeAdapterPackage = readPackageJson("packages/scene3d-three-adapter/package.json");
    const sourceImportRoots = [
      packageSourceImports("@gis-engine/engine", "packages/engine/src"),
      packageSourceImports("@gis-engine/scene3d", "packages/scene3d/src"),
      packageSourceImports("@gis-engine/ai", "packages/ai/src"),
    ];
    const audit = auditScene3DThreeAdapterDependencyBoundary({
      manifests: [enginePackage, scene3dPackage, aiPackage, threeAdapterPackage],
      sourceImports: sourceImportRoots,
    });

    expect(contract.dependencyBoundary).toEqual(
      expect.objectContaining({
        adapterLocalOnly: true,
        allowedRendererPackage: "@gis-engine/scene3d-three-adapter",
        runtimePackages: ["three", "3d-tiles-renderer"],
        corePackagesMustRemainRendererFree: ["@gis-engine/engine", "@gis-engine/scene3d", "@gis-engine/ai"],
        currentPackageManifestStatus: "not-declared-during-spike",
      }),
    );
    expect(audit).toEqual(
      expect.objectContaining({
        kind: "Scene3DThreeAdapterDependencyBoundaryAudit",
        stableViewMode: false,
        runtimeSupported: false,
        valid: true,
        diagnostics: [],
        diagnosticCounts: { error: 0, warning: 0, info: 0 },
      }),
    );
    expect(audit.audit).toEqual({
      adapterOwnedPackages: ["@gis-engine/scene3d-three-adapter"],
      rendererFreePackages: ["@gis-engine/engine", "@gis-engine/scene3d", "@gis-engine/ai"],
      rendererPackages: [
        "cesium",
        "three",
        "@loaders.gl/3d-tiles",
        "@loaders.gl/gltf",
        "three-stdlib",
        "3d-tiles-renderer",
        "@loaders.gl/core",
      ],
      dependencyFields: ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"],
      manifestCount: 4,
      sourceImportRootCount: 3,
    });

    for (const dependency of scene3dThreeAdapterBoundary.requiredRuntimePeerDependencies) {
      expect(enginePackage.dependencies ?? {}).not.toHaveProperty(dependency);
      expect(scene3dPackage.dependencies ?? {}).not.toHaveProperty(dependency);
      expect(aiPackage.dependencies ?? {}).not.toHaveProperty(dependency);
      expect(threeAdapterPackage.dependencies ?? {}).not.toHaveProperty(dependency);
      expect(threeAdapterPackage.devDependencies ?? {}).not.toHaveProperty(dependency);
      expect(threeAdapterPackage.peerDependencies ?? {}).not.toHaveProperty(dependency);
    }

    for (const sourceImportRoot of sourceImportRoots) {
      expect(sourceImportRoot.imports).not.toContain("@gis-engine/scene3d-three-adapter");
      expect(
        sourceImportRoot.imports.some((specifier) => specifier.startsWith("@gis-engine/scene3d-three-adapter/")),
      ).toBe(false);
    }
  });

  it("returns structured diagnostics when renderer dependencies leak across the boundary", () => {
    const audit = auditScene3DThreeAdapterDependencyBoundary({
      manifests: [
        {
          packageName: "@gis-engine/engine",
          path: "packages/engine/package.json",
          dependencies: {
            three: "^0.180.0",
          },
        },
        {
          packageName: "@gis-engine/scene3d",
          path: "packages/scene3d/package.json",
          dependencies: {},
        },
        {
          packageName: "@gis-engine/ai",
          path: "packages/ai/package.json",
          dependencies: {},
        },
        {
          packageName: "@gis-engine/scene3d-three-adapter",
          path: "packages/scene3d-three-adapter/package.json",
          peerDependencies: {
            "3d-tiles-renderer": "^0.4.0",
          },
        },
      ],
      sourceImports: [
        {
          packageName: "@gis-engine/engine",
          root: "packages/engine/src",
          imports: ["3d-tiles-renderer/core"],
        },
        {
          packageName: "@gis-engine/scene3d",
          root: "packages/scene3d/src",
          imports: [],
        },
        {
          packageName: "@gis-engine/ai",
          root: "packages/ai/src",
          imports: [],
        },
      ],
    });

    expect(audit.valid).toBe(false);
    expect(audit.diagnosticCounts).toEqual({ error: 3, warning: 0, info: 0 });
    expect(audit.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "error",
          code: "CAPABILITY.UNSUPPORTED",
          path: "/dependencyBoundary/manifests/@gis-engine~1engine/dependencies/three",
        }),
        expect.objectContaining({
          severity: "error",
          code: "CAPABILITY.UNSUPPORTED",
          path: "/dependencyBoundary/imports/@gis-engine~1engine/3d-tiles-renderer~1core",
        }),
        expect.objectContaining({
          severity: "error",
          code: "CAPABILITY.UNSUPPORTED",
          path: "/dependencyBoundary/manifests/@gis-engine~1scene3d-three-adapter/peerDependencies/3d-tiles-renderer",
        }),
      ]),
    );
  });

  it("documents the adapter handoff contract and non-goals in the README", () => {
    const readme = readFileSync(resolve("packages/scene3d-three-adapter/README.md"), "utf8");
    const normalizedReadme = readme.replace(/\s+/g, " ");

    expect(readme).toContain("Stable Renderer Handoff Contract");
    expect(readme).toContain("load");
    expect(readme).toContain("render");
    expect(readme).toContain("resize");
    expect(readme).toContain("camera");
    expect(readme).toContain("snapshot");
    expect(readme).toContain("query");
    expect(readme).toContain("destroy");
    expect(readme).toContain("diagnostics");
    expect(readme).toContain("resource cleanup");
    expect(normalizedReadme).toContain('stable `view.mode: "scene3d"` remains blocked');
    expect(normalizedReadme).toContain("Three.js and 3DTilesRendererJS are adapter-local renderer dependencies");
    expect(readme).toContain("Non-goals");
  });
});

function scene3dExtension(): SceneView3DExtension {
  return structuredClone(scene3dExtensionSpec.extensions.scene3d) as SceneView3DExtension;
}

function readPackageJson(path: string) {
  const packageJson = JSON.parse(readFileSync(resolve(path), "utf8")) as {
    name: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
  };

  return {
    packageName: packageJson.name,
    path,
    dependencies: packageJson.dependencies,
    devDependencies: packageJson.devDependencies,
    peerDependencies: packageJson.peerDependencies,
    optionalDependencies: packageJson.optionalDependencies,
  };
}

function packageSourceImports(packageName: string, root: string) {
  return {
    packageName,
    root,
    imports: sourceFiles(root).flatMap((sourcePath) => importSpecifiers(readFileSync(sourcePath, "utf8"))),
  };
}

function sourceFiles(root: string): string[] {
  const files: string[] = [];
  const rootPath = resolve(root);

  for (const entry of readdirSync(rootPath)) {
    const entryPath = resolve(rootPath, entry);
    const stats = statSync(entryPath);
    if (stats.isDirectory()) {
      files.push(...sourceFiles(entryPath));
    } else if (/\.[cm]?tsx?$/.test(entryPath)) {
      files.push(entryPath);
    }
  }

  return files;
}

function importSpecifiers(source: string): string[] {
  const imports: string[] = [];
  const patterns = [
    /\bfrom\s+["']([^"']+)["']/g,
    /\bimport\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const importSpecifier = match[1];
      if (importSpecifier) imports.push(importSpecifier);
    }
  }

  return imports;
}
