import { DiagnosticCodes, type SceneView3DExtension } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import { snapshotScene3DMock } from "../../../packages/scene3d/src/index.js";
import scene3dExtensionSpec from "../../fixtures/specs/valid/scene3d-extension.map.json";

describe("SceneView3D mock snapshot contract", () => {
  it("returns a deterministic data-url snapshot summary without a GPU", () => {
    const extension = scene3dExtension();
    const snapshot = snapshotScene3DMock(extension, {
      width: 320,
      height: 180,
      format: "data-url",
      requireLoadedResources: true,
      loadedSourceIds: ["terrain-dem", "city-tiles", "station-model"],
    });

    expect(snapshot.passed).toBe(true);
    expect(snapshot.diagnostics).toEqual([]);
    expect(snapshot.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(snapshot.summary).toEqual({
      sourceCount: 3,
      layerCount: 3,
      visibleLayerCount: 3,
      pickableLayerCount: 2,
      width: 320,
      height: 180,
      format: "data-url",
    });
    expect(snapshot.pendingSourceIds).toEqual([]);
  });

  it("fails strict snapshots when required scene sources are pending", () => {
    const snapshot = snapshotScene3DMock(scene3dExtension(), {
      requireLoadedResources: true,
      loadedSourceIds: ["terrain-dem"],
    });

    expect(snapshot.passed).toBe(false);
    expect(snapshot.pendingSourceIds).toEqual(["city-tiles", "station-model"]);
    expect(snapshot.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: DiagnosticCodes.SnapshotResourcePending,
          path: "/extensions/scene3d/sources/city-tiles",
        }),
        expect.objectContaining({
          code: DiagnosticCodes.SnapshotResourcePending,
          path: "/extensions/scene3d/sources/station-model",
        }),
      ]),
    );
  });

  it("reports blank scene diagnostics when no scene layers are visible", () => {
    const extension = scene3dExtension();
    extension.layers = extension.layers?.map((layer) => ({ ...layer, visible: false }));

    const snapshot = snapshotScene3DMock(extension);

    expect(snapshot.passed).toBe(false);
    expect(snapshot.diagnostics).toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.SnapshotBlankCanvas,
        path: "/extensions/scene3d/layers",
      }),
    );
  });
});

function scene3dExtension(): SceneView3DExtension {
  return structuredClone(scene3dExtensionSpec.extensions.scene3d) as SceneView3DExtension;
}
