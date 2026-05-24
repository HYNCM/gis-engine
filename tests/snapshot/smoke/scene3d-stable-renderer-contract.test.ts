import { describe, expect, it } from "vitest";
import scene3dExtensionSpec from "../../fixtures/specs/valid/scene3d-extension.map.json";
import {
  DiagnosticCodes,
  Scene3DStableRuntimeBlockerCodes,
  validateSpec,
  type Diagnostic,
  type MapSpec,
  type SceneView3DExtension
} from "@gis-engine/engine";
import {
  evaluateScene3DReleaseVisualGate,
  queryScene3DMock,
  snapshotScene3DMock,
  type Scene3DRendererVisualEvidence
} from "../../../packages/scene3d/src/index.js";
import {
  createScene3DThreeAdapterPromotionEvidenceSummary,
  createScene3DThreeAdapterRendererEvidence,
  createScene3DThreeAdapterRuntime,
  evaluateScene3DThreeAdapterSpike,
  type Scene3DThreeAdapterRuntime
} from "../../../packages/scene3d-three-adapter/src/index.js";

const loadedSourceIds = ["terrain-dem", "city-tiles", "station-model"];
const deterministicSnapshotOptions = {
  width: 320,
  height: 180,
  format: "data-url" as const,
  requireLoadedResources: true,
  loadedSourceIds
};
const adapterEstimates = {
  tilesetJsonBytes: { "city-tiles": 512_000 },
  modelBytes: { "station-model": 1_048_576 },
  textureCount: { "terrain-dem": 1, "station-model": 4 },
  textureBytes: { "terrain-dem": 262_144, "station-model": 2_097_152 },
  workerCount: 1
};

describe("SceneView3D stable renderer contract QA slice", () => {
  it("records deterministic lifecycle, failure, cancellation, and cleanup semantics without promoting stable runtime", async () => {
    const contract = stableLifecycleSemanticContract();
    expect(contract.map((entry) => entry.operation)).toEqual([
      "load",
      "reload",
      "resize",
      "destroy",
      "failure",
      "cancellation",
      "resource cleanup"
    ]);
    expect(contract.every((entry) => entry.deterministic)).toBe(true);
    expect(contract.every((entry) => entry.requiredDiagnostics.length > 0)).toBe(true);

    const runtime = createStableContractRuntime();
    expect(runtime.stableViewMode).toBe(false);
    expect(runtime.runtimeSupported).toBe(false);

    const preLoadSnapshot = await runtime.snapshot(deterministicSnapshotOptions);
    expect(preLoadSnapshot.passed).toBe(false);
    expectStructuredDiagnostics(preLoadSnapshot.diagnostics, [DiagnosticCodes.RenderAdapterError]);

    const preLoadQuery = await runtime.query();
    expect(preLoadQuery.picks).toEqual([]);
    expectStructuredDiagnostics(preLoadQuery.diagnostics, [DiagnosticCodes.RenderAdapterError]);

    const loadReport = await runtime.load();
    const reloadReport = await runtime.load();
    expect(loadReport.loaded).toBe(true);
    expect(reloadReport.loaded).toBe(true);
    expect(reloadReport.diagnostics).toEqual(loadReport.diagnostics);
    expectStructuredDiagnostics(loadReport.diagnostics, [DiagnosticCodes.CapabilityUnsupported]);

    const snapshot = await runtime.snapshot(deterministicSnapshotOptions);
    const repeatedSnapshot = await runtime.snapshot(deterministicSnapshotOptions);
    expect(snapshot.passed).toBe(true);
    expect(snapshot.summary).toEqual({
      sourceCount: 3,
      layerCount: 3,
      visibleLayerCount: 3,
      pickableLayerCount: 2,
      width: 320,
      height: 180,
      format: "data-url"
    });
    expect(repeatedSnapshot.summary).toEqual(snapshot.summary);
    expect(repeatedSnapshot.dataUrl).toBe(snapshot.dataUrl);

    const resizedSnapshot = await runtime.snapshot({
      ...deterministicSnapshotOptions,
      width: 640,
      height: 360
    });
    expect(resizedSnapshot.summary).toEqual(
      expect.objectContaining({
        width: 640,
        height: 360,
        sourceCount: snapshot.summary.sourceCount,
        layerCount: snapshot.summary.layerCount
      })
    );

    const query = await runtime.query({ layers: ["city", "station"] });
    const repeatedQuery = await runtime.query({ layers: ["city", "station"] });
    expect(repeatedQuery).toEqual(query);

    const failingRuntime = createScene3DThreeAdapterRuntime(scene3dExtension(), {
      estimates: {
        ...adapterEstimates,
        tilesetJsonBytes: { "city-tiles": 2_000_000 }
      }
    });
    const failureLoadReport = await failingRuntime.load();
    expect(failureLoadReport.resourceReport.valid).toBe(false);
    expectStructuredDiagnostics(failureLoadReport.diagnostics, [DiagnosticCodes.SecurityResourceTooLarge]);

    const destroyReport = await runtime.destroy();
    const repeatedDestroyReport = await runtime.destroy();
    expect(destroyReport).toEqual({ destroyed: true, diagnostics: [] });
    expect(repeatedDestroyReport.destroyed).toBe(true);
    expectStructuredDiagnostics(repeatedDestroyReport.diagnostics, [DiagnosticCodes.RenderDestroyed]);

    const afterDestroyLoad = await runtime.load();
    const afterDestroySnapshot = await runtime.snapshot(deterministicSnapshotOptions);
    const afterDestroyQuery = await runtime.query();
    expect(afterDestroyLoad.loaded).toBe(false);
    expect(afterDestroySnapshot.passed).toBe(false);
    expect(afterDestroyQuery.picks).toEqual([]);
    expectStructuredDiagnostics(afterDestroyLoad.diagnostics, [DiagnosticCodes.RenderDestroyed]);
    expectStructuredDiagnostics(afterDestroySnapshot.diagnostics, [DiagnosticCodes.RenderDestroyed]);
    expectStructuredDiagnostics(afterDestroyQuery.diagnostics, [DiagnosticCodes.RenderDestroyed]);

    const cancelledBeforeLoadRuntime = createStableContractRuntime();
    await cancelledBeforeLoadRuntime.destroy();
    const cancelledLoad = await cancelledBeforeLoadRuntime.load();
    const cancelledQuery = await cancelledBeforeLoadRuntime.query();
    expect(cancelledLoad.loaded).toBe(false);
    expect(cancelledQuery.picks).toEqual([]);
    expectStructuredDiagnostics(cancelledLoad.diagnostics, [DiagnosticCodes.RenderDestroyed]);
    expectStructuredDiagnostics(cancelledQuery.diagnostics, [DiagnosticCodes.RenderDestroyed]);
  });

  it("defines stable snapshot and query semantics for metrics, camera, picks, no-hit, hidden, and missing-layer states", () => {
    const extension = scene3dExtension();
    const snapshot = snapshotScene3DMock(extension, deterministicSnapshotOptions);
    const repeatedSnapshot = snapshotScene3DMock(extension, deterministicSnapshotOptions);

    expect(snapshot.passed).toBe(true);
    expect(snapshot.pendingSourceIds).toEqual([]);
    expect(snapshot.summary).toEqual(repeatedSnapshot.summary);
    expect(snapshot.dataUrl).toBe(repeatedSnapshot.dataUrl);

    const spikeReport = evaluateScene3DThreeAdapterSpike(extension, { estimates: adapterEstimates });
    const blankEvidence = createScene3DThreeAdapterRendererEvidence(spikeReport, {
      capture: {
        reportPath: "test-results/scene3d-three-adapter/blank-report.json",
        width: 320,
        height: 180,
        nonTransparentPixels: 0,
        changedPixelsFromBackground: 0,
        consoleErrors: []
      }
    });
    expect(blankEvidence.passed).toBe(false);
    expectStructuredDiagnostics(blankEvidence.diagnostics ?? [], [DiagnosticCodes.SnapshotBlankCanvas]);

    const nonblankEvidence = createScene3DThreeAdapterRendererEvidence(spikeReport, {
      capture: {
        reportPath: "test-results/scene3d-three-adapter/nonblank-report.json",
        width: 320,
        height: 180,
        nonTransparentPixels: 57_600,
        changedPixelsFromBackground: 24_000,
        targetLayerPixels: {
          terrain: 16_640,
          city: 4_032,
          station: 1_024
        },
        consoleErrors: []
      }
    });
    expect(nonblankEvidence.passed).toBe(true);
    expect(nonblankEvidence.diagnostics).toEqual([]);

    const query = queryScene3DMock(extension);
    const repeatedQuery = queryScene3DMock(extension);
    expect(repeatedQuery).toEqual(query);
    expect(query.picks.map((pick) => pick.objectId)).toEqual([
      "city-tiles:city:mock",
      "station-model:station:mock"
    ]);
    expect(query.picks.every((pick) => pick.position === extension.camera.target || vectorEquals(pick.position, extension.camera.target))).toBe(
      true
    );

    const noHit = queryScene3DMock(extension, { layers: ["terrain"] });
    expect(noHit.picks).toEqual([]);
    expect(noHit.diagnostics).toEqual([]);

    const hiddenExtension = scene3dExtension();
    const hiddenCity = hiddenExtension.layers?.find((layer) => layer.id === "city");
    if (hiddenCity) hiddenCity.visible = false;
    const hiddenDefault = queryScene3DMock(hiddenExtension);
    const hiddenIncluded = queryScene3DMock(hiddenExtension, { includeHidden: true });
    expect(hiddenDefault.picks.map((pick) => pick.layerId)).toEqual(["station"]);
    expect(hiddenIncluded.picks.map((pick) => pick.layerId)).toEqual(["city", "station"]);

    const missingLayer = queryScene3DMock(extension, { layers: ["missing-layer"] });
    expect(missingLayer.picks).toEqual([]);
    expectStructuredDiagnostics(missingLayer.diagnostics, [DiagnosticCodes.LayerNotFound]);

    const missingSourceExtension = scene3dExtension();
    const stationLayer = missingSourceExtension.layers?.find((layer) => layer.id === "station");
    if (stationLayer) stationLayer.source = "missing-source";
    const missingSourceQuery = queryScene3DMock(missingSourceExtension, { layers: ["station"] });
    const missingSourceSnapshot = snapshotScene3DMock(missingSourceExtension, deterministicSnapshotOptions);
    expect(missingSourceQuery.picks).toEqual([]);
    expectStructuredDiagnostics(missingSourceQuery.diagnostics, [DiagnosticCodes.SourceNotFound]);
    expect(missingSourceSnapshot.passed).toBe(false);
    expectStructuredDiagnostics(missingSourceSnapshot.diagnostics, [DiagnosticCodes.SourceNotFound]);
  });

  it("blocks stable view mode and rejects mock or spike-local evidence as stable renderer evidence", async () => {
    const promotedSpec = scene3dMapSpec();
    promotedSpec.view.mode = "scene3d";
    promotedSpec.capabilities = {
      renderer: "scene3d",
      dimensions: ["3d"]
    };

    const validation = validateSpec(promotedSpec);
    expect(validation.valid).toBe(false);
    expect(validation.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: DiagnosticCodes.CapabilityUnsupported,
          blockerCode: Scene3DStableRuntimeBlockerCodes.ViewMode,
          path: "/view/mode"
        }),
        expect.objectContaining({
          code: DiagnosticCodes.CapabilityUnsupported,
          blockerCode: Scene3DStableRuntimeBlockerCodes.Renderer,
          path: "/capabilities/renderer"
        }),
        expect.objectContaining({
          code: DiagnosticCodes.CapabilityUnsupported,
          blockerCode: Scene3DStableRuntimeBlockerCodes.Dimensions,
          path: "/capabilities/dimensions"
        })
      ])
    );

    const runtime = createStableContractRuntime();
    const loadReport = await runtime.load();
    const snapshot = await runtime.snapshot(deterministicSnapshotOptions);
    const query = await runtime.query();
    const rendererEvidence = runtime.rendererEvidence({
      capture: {
        reportPath: "test-results/scene3d-three-adapter/nonblank-report.json",
        width: 320,
        height: 180,
        nonTransparentPixels: 57_600,
        changedPixelsFromBackground: 24_000,
        consoleErrors: []
      }
    });
    const promotionSummary = createScene3DThreeAdapterPromotionEvidenceSummary(runtime.spikeReport, {
      loadReport,
      snapshot,
      query,
      rendererVisualEvidence: rendererEvidence
    });
    const releaseGate = evaluateScene3DReleaseVisualGate(scene3dExtension(), {
      ciTier: "release",
      loadedSourceIds,
      rendererVisualEvidence: rendererEvidence
    });

    expect(promotionSummary.decisionReady).toBe(true);
    expect(promotionSummary.stablePromotionAllowed).toBe(false);
    expect(promotionSummary.stableViewMode).toBe(false);
    expect(promotionSummary.runtimeSupported).toBe(false);
    expect(releaseGate.accepted).toBe(true);
    expect(releaseGate.runtime.stableViewMode).toBe(false);

    const mockEvidence: Scene3DRendererVisualEvidence = {
      passed: true,
      renderer: "scene3d-mock",
      reportPath: "test-results/scene3d-mock/report.json",
      diagnostics: []
    };
    expect(
      assessStableRendererEvidence(mockEvidence, {
        stableViewMode: true,
        runtimeSupported: true
      }).diagnostics
    ).toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.CapabilityUnsupported,
        blockerCode: Scene3DStableRuntimeBlockerCodes.Renderer,
        path: "/rendererVisualEvidence/renderer"
      })
    );
    expect(assessStableRendererEvidence(rendererEvidence).diagnostics).toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.CapabilityUnsupported,
        blockerCode: Scene3DStableRuntimeBlockerCodes.Renderer,
        path: "/rendererVisualEvidence/stableViewMode"
      })
    );
  });
});

interface LifecycleSemanticContractEntry {
  operation: "load" | "reload" | "resize" | "destroy" | "failure" | "cancellation" | "resource cleanup";
  deterministic: true;
  requiredDiagnostics: Diagnostic["code"][];
  currentEvidence: string;
}

function stableLifecycleSemanticContract(): LifecycleSemanticContractEntry[] {
  return [
    {
      operation: "load",
      deterministic: true,
      requiredDiagnostics: [DiagnosticCodes.CapabilityUnsupported, DiagnosticCodes.RenderAdapterError],
      currentEvidence: "runtime.load reports stableViewMode=false and structured unsupported-runtime diagnostics"
    },
    {
      operation: "reload",
      deterministic: true,
      requiredDiagnostics: [DiagnosticCodes.CapabilityUnsupported],
      currentEvidence: "repeated runtime.load calls return the same adapter-local load diagnostics"
    },
    {
      operation: "resize",
      deterministic: true,
      requiredDiagnostics: [DiagnosticCodes.RenderAdapterError],
      currentEvidence: "snapshot width and height are deterministic, but a stable renderer still needs an explicit resize contract"
    },
    {
      operation: "destroy",
      deterministic: true,
      requiredDiagnostics: [DiagnosticCodes.RenderDestroyed],
      currentEvidence: "runtime.destroy is idempotent and post-destroy operations return RENDER.DESTROYED diagnostics"
    },
    {
      operation: "failure",
      deterministic: true,
      requiredDiagnostics: [DiagnosticCodes.SecurityResourceTooLarge, DiagnosticCodes.RenderAdapterError],
      currentEvidence: "resource-policy failures are structured and keep promotion evidence from becoming stable"
    },
    {
      operation: "cancellation",
      deterministic: true,
      requiredDiagnostics: [DiagnosticCodes.RenderDestroyed, DiagnosticCodes.CapabilityUnsupported],
      currentEvidence: "destroy-before-load is deterministic cleanup evidence; stable renderer cancellation remains an explicit blocker"
    },
    {
      operation: "resource cleanup",
      deterministic: true,
      requiredDiagnostics: [DiagnosticCodes.RenderDestroyed],
      currentEvidence: "destroy clears loaded state and later load/snapshot/query calls do not revive resources"
    }
  ];
}

function createStableContractRuntime(): Scene3DThreeAdapterRuntime {
  return createScene3DThreeAdapterRuntime(scene3dExtension(), { estimates: adapterEstimates });
}

function scene3dExtension(): SceneView3DExtension {
  return structuredClone(scene3dExtensionSpec.extensions.scene3d) as SceneView3DExtension;
}

function scene3dMapSpec(): MapSpec {
  return structuredClone(scene3dExtensionSpec) as MapSpec;
}

function expectStructuredDiagnostics(diagnostics: Diagnostic[], expectedCodes: Diagnostic["code"][]): void {
  expect(diagnostics.length).toBeGreaterThan(0);
  for (const diagnostic of diagnostics) {
    expect(diagnostic.severity).toMatch(/^(error|warning|info)$/);
    expect(diagnostic.code.length).toBeGreaterThan(0);
    expect(diagnostic.message.length).toBeGreaterThan(0);
  }
  for (const code of expectedCodes) {
    expect(diagnostics).toContainEqual(expect.objectContaining({ code }));
  }
}

function vectorEquals(left: [number, number, number], right: [number, number, number]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function assessStableRendererEvidence(
  evidence: Scene3DRendererVisualEvidence,
  options: { stableViewMode?: boolean; runtimeSupported?: boolean } = {}
): { accepted: boolean; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  if (evidence.renderer.includes("mock")) {
    diagnostics.push(stableRendererBlocked("/rendererVisualEvidence/renderer", "Mock SceneView3D evidence is not stable renderer evidence."));
  }
  if (options.stableViewMode !== true || options.runtimeSupported !== true) {
    diagnostics.push(
      stableRendererBlocked(
        "/rendererVisualEvidence/stableViewMode",
        "SceneView3D adapter evidence remains spike-local until the stable renderer contract is implemented."
      )
    );
  }
  if (evidence.passed !== true) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.RenderAdapterError,
      message: "Stable renderer evidence must be passing before promotion.",
      path: "/rendererVisualEvidence/passed"
    });
  }
  return {
    accepted: diagnostics.length === 0,
    diagnostics
  };
}

function stableRendererBlocked(path: string, message: string): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.CapabilityUnsupported,
    blockerCode: Scene3DStableRuntimeBlockerCodes.Renderer,
    message,
    path,
    fix: {
      kind: "manual",
      confidence: "high",
      message: "Keep stable view.mode=\"scene3d\" disabled until real renderer lifecycle, snapshot, and query evidence passes."
    }
  };
}
