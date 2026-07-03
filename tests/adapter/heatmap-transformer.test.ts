import { type MapSpec, transformMapSpecToMapLibreStyle } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

const baseSpec = (): MapSpec => ({
  version: "0.1",
  view: { zoom: 4 },
  sources: {
    "heat-data": {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    },
  },
  layers: [{ id: "heat", type: "heatmap", source: "heat-data" }],
});

describe("heatmap transformer", () => {
  it("transforms heatmap layer to MapLibre heatmap type", () => {
    const result = transformMapSpecToMapLibreStyle(baseSpec());

    expect(result.diagnostics).toEqual([]);
    expect(result.style?.layers[0]).toMatchObject({
      id: "heat",
      type: "heatmap",
      source: "heat-data",
    });
  });

  it("forwards heatmap paint properties to MapLibre style", () => {
    const spec = baseSpec();
    spec.layers = [
      {
        id: "heat",
        type: "heatmap",
        source: "heat-data",
        paint: {
          "heatmap-radius": 20,
          "heatmap-weight": ["get", "magnitude"],
          "heatmap-intensity": 1.5,
          "heatmap-color": ["interpolate", ["linear"], ["get", "density"], 0, "#00f", 1, "#f00"],
          "heatmap-opacity": 0.8,
        },
      },
    ];

    const result = transformMapSpecToMapLibreStyle(spec);

    expect(result.diagnostics).toEqual([]);
    expect(result.style?.layers[0]?.paint).toEqual({
      "heatmap-radius": 20,
      "heatmap-weight": ["get", "magnitude"],
      "heatmap-intensity": 1.5,
      "heatmap-color": ["interpolate", ["linear"], ["get", "density"], 0, "#00f", 1, "#f00"],
      "heatmap-opacity": 0.8,
    });
  });

  it("forwards heatmap filter and zoom range", () => {
    const spec = baseSpec();
    spec.layers = [
      {
        id: "heat",
        type: "heatmap",
        source: "heat-data",
        filter: ["==", ["get", "type"], "earthquake"],
        minzoom: 2,
        maxzoom: 14,
      },
    ];

    const result = transformMapSpecToMapLibreStyle(spec);

    expect(result.diagnostics).toEqual([]);
    expect(result.style?.layers[0]).toMatchObject({
      filter: ["==", ["get", "type"], "earthquake"],
      minzoom: 2,
      maxzoom: 14,
    });
  });

  it("transforms heatmap layer alongside other layer types", () => {
    const spec = baseSpec();
    spec.sources["fill-data"] = { type: "geojson", data: { type: "FeatureCollection", features: [] } };
    spec.layers = [
      { id: "area", type: "fill", source: "fill-data", paint: { "fill-color": "#ccc" } },
      { id: "heat", type: "heatmap", source: "heat-data" },
    ];

    const result = transformMapSpecToMapLibreStyle(spec);

    expect(result.diagnostics).toEqual([]);
    expect(result.style?.layers).toHaveLength(2);
    expect(result.style?.layers[0]?.type).toBe("fill");
    expect(result.style?.layers[1]?.type).toBe("heatmap");
  });
});
