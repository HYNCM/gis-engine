import { describe, expect, it } from "vitest";
import scene3dExtensionSpec from "../fixtures/specs/valid/scene3d-extension.map.json";
import { DiagnosticCodes, type SceneView3DExtension } from "@gis-engine/engine";
import { queryScene3DMock } from "../../packages/scene3d/src/index.js";

describe("SceneView3D mock query contract", () => {
  it("returns deterministic pick results for visible pickable scene layers", () => {
    const result = queryScene3DMock(scene3dExtension());

    expect(result.diagnostics).toEqual([]);
    expect(result.picks).toEqual([
      {
        objectId: "city-tiles:city:mock",
        layerId: "city",
        sourceId: "city-tiles",
        position: [120.15, 30.28, 0],
        properties: {
          mock: true,
          layerType: "tileset3d",
          sourceType: "3d-tiles"
        }
      },
      {
        objectId: "station-model:station:mock",
        layerId: "station",
        sourceId: "station-model",
        position: [120.15, 30.28, 0],
        properties: {
          mock: true,
          layerType: "model",
          sourceType: "gltf"
        }
      }
    ]);
  });

  it("honors layer filters and reports missing scene layers", () => {
    const result = queryScene3DMock(scene3dExtension(), { layers: ["station", "missing-layer"] });

    expect(result.picks.map((pick) => pick.layerId)).toEqual(["station"]);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.LayerNotFound,
        path: "/extensions/scene3d/layers"
      })
    );
  });

  it("skips hidden or non-pickable scene layers unless they are explicitly included", () => {
    const extension = scene3dExtension();
    const city = extension.layers?.find((layer) => layer.id === "city");
    const station = extension.layers?.find((layer) => layer.id === "station");
    if (city?.type === "tileset3d") city.pickable = false;
    if (station) station.visible = false;

    const visible = queryScene3DMock(extension);
    const includeHidden = queryScene3DMock(extension, { includeHidden: true });

    expect(visible.picks).toEqual([]);
    expect(includeHidden.picks.map((pick) => pick.layerId)).toEqual(["station"]);
  });
});

function scene3dExtension(): SceneView3DExtension {
  return structuredClone(scene3dExtensionSpec.extensions.scene3d) as SceneView3DExtension;
}
