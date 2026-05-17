import { describe, expect, it } from "vitest";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import { transformMapSpecToMapLibreStyle, type MapSpec } from "@gis-engine/engine";

describe("MapSpecToMapLibreStyleTransformer", () => {
  it("transforms a supported MapSpec into a MapLibre style", () => {
    const result = transformMapSpecToMapLibreStyle(before as MapSpec);

    expect(result.diagnostics).toEqual([]);
    expect(result.style?.version).toBe(8);
    expect(result.style?.sources.districts?.type).toBe("geojson");
    expect(result.style?.layers[0]).toMatchObject({
      id: "district-fill",
      type: "fill",
      source: "districts"
    });
  });

  it("returns diagnostics for invalid expressions", () => {
    const spec = structuredClone(before) as MapSpec;
    spec.layers[0] = {
      ...spec.layers[0]!,
      paint: {
        "fill-color": ["coalesce", ["get", "kind"], "#fff"]
      }
    };

    const result = transformMapSpecToMapLibreStyle(spec);

    expect(result.style).toBeUndefined();
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "EXPR.UNKNOWN_OPERATOR")).toBe(true);
  });

  it("returns capability-only diagnostics for schema-valid unsupported layers", () => {
    const spec = structuredClone(before) as MapSpec;
    spec.layers[0] = {
      ...spec.layers[0]!,
      type: "fill-extrusion-lite"
    };

    const result = transformMapSpecToMapLibreStyle(spec);

    expect(result.style).toBeUndefined();
    expect(result.diagnostics.filter((diagnostic) => diagnostic.severity === "error")).toEqual([
      expect.objectContaining({
        code: "CAPABILITY.UNSUPPORTED",
        path: "/layers/0/type"
      })
    ]);
  });
});
