import { describe, expect, it } from "vitest";
import invalidSpec from "../fixtures/specs/invalid/layer-source-missing.map.json";
import expectedInvalidCodes from "../fixtures/specs/invalid/layer-source-missing.diagnostics.json";
import basicGeoJson from "../fixtures/specs/valid/basic-geojson.map.json";
import vectorTileUrl from "../fixtures/specs/valid/vector-tile-url.map.json";
import fillExtrusionLite from "../fixtures/specs/valid/fill-extrusion-lite.map.json";
import { validateSpec, type MapSpec } from "@gis-engine/engine";

describe("MapSpec fixtures", () => {
  it.each([
    ["basic-geojson", basicGeoJson],
    ["vector-tile-url", vectorTileUrl],
    ["fill-extrusion-lite", fillExtrusionLite]
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

  it("gates fill-extrusion-lite behind an explicit 2.5D experimental request", () => {
    const spec = structuredClone(basicGeoJson) as MapSpec;
    spec.layers[1] = {
      ...spec.layers[1]!,
      type: "fill-extrusion-lite"
    };

    const missingGate = validateSpec(spec);
    expect(missingGate.valid).toBe(false);
    expect(missingGate.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "CAPABILITY.UNSUPPORTED",
        path: "/layers/1/type"
      })
    );

    spec.view.mode = "map2_5d";
    spec.capabilities = {
      dimensions: ["2_5d"],
      experimental: ["fill-extrusion-lite"]
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
      experimental: ["scene3d"]
    };

    const report = validateSpec(spec);
    expect(report.valid).toBe(false);
    expect(report.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "CAPABILITY.UNSUPPORTED", path: "/view/mode" }),
        expect.objectContaining({ code: "CAPABILITY.UNSUPPORTED", path: "/capabilities/renderer" }),
        expect.objectContaining({ code: "CAPABILITY.UNSUPPORTED", path: "/capabilities/dimensions" })
      ])
    );
  });
});
