import { describe, expect, it } from "vitest";
import scene3dExtensionSpec from "../../fixtures/specs/valid/scene3d-extension.map.json";
import { DiagnosticCodes, type SceneView3DExtension } from "@gis-engine/engine";
import { evaluateScene3DReleaseVisualGate } from "../../../packages/scene3d/src/index.js";

describe("SceneView3D release visual gate", () => {
  it("allows the extension-only release gate only with a coordinator waiver", () => {
    const report = evaluateScene3DReleaseVisualGate(scene3dExtension(), {
      ciTier: "release",
      loadedSourceIds: ["terrain-dem", "city-tiles", "station-model"],
      waiver: {
        id: "SCENE3D-VISUAL-WAIVER-2026W27",
        approvedBy: "coordinator",
        reason: "SceneView3D has no stable renderer before the v1 adapter gate.",
        followUpTaskId: "TASK-2026W27-005"
      }
    });

    expect(report.kind).toBe("Scene3DReleaseVisualGateReport");
    expect(report.gate).toBe("scene3d.release.visual");
    expect(report.decision).toBe("waived");
    expect(report.accepted).toBe(true);
    expect(report.runtime).toEqual({
      status: "extension-only",
      stableViewMode: false,
      rendererVisualRequired: true
    });
    expect(report.waiver?.accepted).toBe(true);
    expect(report.evidence.snapshot.passed).toBe(true);
    expect(report.evidence.snapshot.pendingSourceIds).toEqual([]);
    expect(report.evidence.query.pickCount).toBe(2);
    expect(report.diagnostics).toEqual([]);
  });

  it("blocks release mode when renderer visual evidence lacks a waiver", () => {
    const report = evaluateScene3DReleaseVisualGate(scene3dExtension(), {
      ciTier: "release",
      loadedSourceIds: ["terrain-dem", "city-tiles", "station-model"]
    });

    expect(report.decision).toBe("failed");
    expect(report.accepted).toBe(false);
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.CapabilityUnsupported,
        path: "/extensions/scene3d"
      })
    );
  });

  it("does not let a waiver bypass pending scene resources", () => {
    const report = evaluateScene3DReleaseVisualGate(scene3dExtension(), {
      ciTier: "release",
      loadedSourceIds: ["terrain-dem"],
      waiver: {
        id: "SCENE3D-VISUAL-WAIVER-2026W27",
        approvedBy: "coordinator",
        reason: "SceneView3D has no stable renderer before the v1 adapter gate.",
        followUpTaskId: "TASK-2026W27-005"
      }
    });

    expect(report.decision).toBe("failed");
    expect(report.accepted).toBe(false);
    expect(report.waiver?.accepted).toBe(false);
    expect(report.evidence.snapshot.pendingSourceIds).toEqual(["city-tiles", "station-model"]);
    expect(report.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: DiagnosticCodes.SnapshotResourcePending,
          path: "/extensions/scene3d/sources/city-tiles"
        }),
        expect.objectContaining({
          code: DiagnosticCodes.SnapshotResourcePending,
          path: "/extensions/scene3d/sources/station-model"
        })
      ])
    );
  });

  it("passes release mode when renderer visual evidence is available", () => {
    const report = evaluateScene3DReleaseVisualGate(scene3dExtension(), {
      ciTier: "release",
      loadedSourceIds: ["terrain-dem", "city-tiles", "station-model"],
      rendererVisualEvidence: {
        passed: true,
        renderer: "scene3d-browser-runner",
        reportPath: "test-results/scene3d/visual-report.json"
      }
    });

    expect(report.decision).toBe("passed");
    expect(report.accepted).toBe(true);
    expect(report.evidence.rendererVisual).toEqual({
      passed: true,
      renderer: "scene3d-browser-runner",
      reportPath: "test-results/scene3d/visual-report.json"
    });
  });
});

function scene3dExtension(): SceneView3DExtension {
  return structuredClone(scene3dExtensionSpec.extensions.scene3d) as SceneView3DExtension;
}
