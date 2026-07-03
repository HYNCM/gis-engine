import { type MapSpec, validateSpec } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

const minimalSpec = (): MapSpec => ({
  version: "0.1",
  view: { zoom: 4 },
  sources: {
    "my-data": {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    },
  },
  layers: [{ id: "heat", type: "heatmap", source: "my-data" }],
});

describe("heatmap layer schema validation", () => {
  it("accepts minimal heatmap layer", () => {
    const result = validateSpec(minimalSpec());
    expect(result.diagnostics).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it("accepts heatmap with paint properties", () => {
    const spec = minimalSpec();
    spec.sources = {
      pts: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
    };
    spec.layers = [
      {
        id: "heat",
        type: "heatmap",
        source: "pts",
        paint: {
          "heatmap-radius": 20,
          "heatmap-weight": ["get", "magnitude"],
          "heatmap-intensity": 1.5,
          "heatmap-color": ["interpolate", ["linear"], ["get", "density"], 0, "#00f", 1, "#f00"],
          "heatmap-opacity": 0.8,
        },
      },
    ];
    const result = validateSpec(spec);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it("accepts heatmap with exponential interpolate weight", () => {
    const spec = minimalSpec();
    spec.layers = [
      {
        id: "heat",
        type: "heatmap",
        source: "my-data",
        paint: {
          "heatmap-weight": ["interpolate", ["exponential", 1.5], ["get", "magnitude"], 0, 0, 10, 1],
        },
      },
    ];
    const result = validateSpec(spec);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it("rejects heatmap without source", () => {
    const spec = minimalSpec();
    spec.layers = [{ id: "heat", type: "heatmap" }];
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.code === "LAYER.SOURCE_MISSING")).toBe(true);
  });

  it("rejects heatmap referencing missing source", () => {
    const spec = minimalSpec();
    spec.layers = [{ id: "heat", type: "heatmap", source: "nonexistent" }];
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.code === "SRC.NOT_FOUND")).toBe(true);
  });

  it("reports heatmap layer in stats", () => {
    const result = validateSpec(minimalSpec());
    expect(result.stats.layerCount).toBe(1);
  });
});
