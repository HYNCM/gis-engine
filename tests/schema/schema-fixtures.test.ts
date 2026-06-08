import { type MapSpec, Scene3DStableRuntimeBlockerCodes, validateSpec } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import expectedInvalidCodes from "../fixtures/specs/invalid/layer-source-missing.diagnostics.json";
import invalidSpec from "../fixtures/specs/invalid/layer-source-missing.map.json";
import expectedScene3dBlockedUrlDiagnostics from "../fixtures/specs/invalid/scene3d-extension-blocked-url.diagnostics.json";
import invalidScene3dBlockedUrl from "../fixtures/specs/invalid/scene3d-extension-blocked-url.map.json";
import expectedScene3dUnknownFieldDiagnostics from "../fixtures/specs/invalid/scene3d-extension-unknown-field.diagnostics.json";
import invalidScene3dUnknownField from "../fixtures/specs/invalid/scene3d-extension-unknown-field.map.json";
import basicGeoJson from "../fixtures/specs/valid/basic-geojson.map.json";
import fillExtrusionLite from "../fixtures/specs/valid/fill-extrusion-lite.map.json";
import scene3dExtension from "../fixtures/specs/valid/scene3d-extension.map.json";
import vectorTileUrl from "../fixtures/specs/valid/vector-tile-url.map.json";

describe("MapSpec fixtures", () => {
  it.each([
    ["basic-geojson", basicGeoJson],
    ["vector-tile-url", vectorTileUrl],
    ["fill-extrusion-lite", fillExtrusionLite],
    ["scene3d-extension", scene3dExtension],
  ])("accepts valid fixture %s", (_name, spec) => {
    const report = validateSpec(spec);
    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
  });

  it("reports expected diagnostics for invalid fixtures", () => {
    const report = validateSpec(invalidSpec);
    expect(report.valid).toBe(false);
    expect(report.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(expectedInvalidCodes);
  });

  it.each([
    ["scene3d-extension-blocked-url", invalidScene3dBlockedUrl, expectedScene3dBlockedUrlDiagnostics],
    ["scene3d-extension-unknown-field", invalidScene3dUnknownField, expectedScene3dUnknownFieldDiagnostics],
  ])("reports expected diagnostics for invalid fixture %s", (_name, spec, expectedDiagnostics) => {
    const report = validateSpec(spec);

    expect(report.valid).toBe(false);
    for (const expected of expectedDiagnostics) {
      expect(report.diagnostics).toContainEqual(expect.objectContaining(expected));
    }
  });

  it("gates fill-extrusion-lite behind an explicit 2.5D experimental request", () => {
    const spec = structuredClone(basicGeoJson) as MapSpec;
    spec.layers[1] = {
      ...layerAt(spec, 1),
      type: "fill-extrusion-lite",
    };

    const missingGate = validateSpec(spec);
    expect(missingGate.valid).toBe(false);
    expect(missingGate.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "CAPABILITY.UNSUPPORTED",
        path: "/layers/1/type",
      }),
    );

    spec.view.mode = "map2_5d";
    spec.capabilities = {
      dimensions: ["2_5d"],
      experimental: ["fill-extrusion-lite"],
    };

    const withGate = validateSpec(spec);
    expect(withGate.valid).toBe(true);
    expect(withGate.diagnostics).toEqual([]);
  });

  it("keeps SceneView3D as a structured unsupported boundary", () => {
    const spec = structuredClone(basicGeoJson) as MapSpec;
    spec.view.mode = "scene3d";
    spec.capabilities = {
      renderer: "scene3d",
      dimensions: ["3d"],
      experimental: ["scene3d"],
    };

    const report = validateSpec(spec);
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
});

function layerAt(spec: MapSpec, index: number): MapSpec["layers"][number] {
  const layer = spec.layers[index];
  if (!layer) throw new Error(`Expected layer fixture at index ${index}.`);
  return layer;
}
