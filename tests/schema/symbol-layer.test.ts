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
  layers: [{ id: "labels", type: "symbol", source: "my-data" }],
});

describe("symbol layer schema validation", () => {
  it("accepts minimal symbol layer", () => {
    const result = validateSpec(minimalSpec());
    expect(result.diagnostics).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it("accepts symbol with text-field layout", () => {
    const spec = minimalSpec();
    spec.layers = [
      {
        id: "labels",
        type: "symbol",
        source: "my-data",
        layout: {
          "text-field": "{name}",
          "text-size": 14,
          "text-anchor": "center",
        },
      },
    ];
    const result = validateSpec(spec);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it("accepts symbol with icon layout", () => {
    const spec = minimalSpec();
    spec.layers = [
      {
        id: "icons",
        type: "symbol",
        source: "my-data",
        layout: {
          "icon-image": "marker",
          "icon-size": 0.5,
          "icon-anchor": "bottom",
        },
      },
    ];
    const result = validateSpec(spec);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it("accepts symbol with paint properties", () => {
    const spec = minimalSpec();
    spec.layers = [
      {
        id: "labels",
        type: "symbol",
        source: "my-data",
        layout: { "text-field": "{name}" },
        paint: {
          "text-color": "#333",
          "text-halo-color": "#fff",
          "text-halo-width": 2,
          "text-opacity": 0.9,
        },
      },
    ];
    const result = validateSpec(spec);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it("accepts symbol with expression-based text-field", () => {
    const spec = minimalSpec();
    spec.layers = [
      {
        id: "labels",
        type: "symbol",
        source: "my-data",
        layout: {
          "text-field": ["get", "name"],
        },
      },
    ];
    const result = validateSpec(spec);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it("accepts symbol with data-driven text-size", () => {
    const spec = minimalSpec();
    spec.layers = [
      {
        id: "labels",
        type: "symbol",
        source: "my-data",
        layout: {
          "text-field": "{name}",
          "text-size": ["interpolate", ["linear"], ["zoom"], 0, 10, 22, 24],
        },
      },
    ];
    const result = validateSpec(spec);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it("accepts symbol with filter", () => {
    const spec = minimalSpec();
    spec.layers = [
      {
        id: "labels",
        type: "symbol",
        source: "my-data",
        layout: { "text-field": "{name}" },
        filter: ["==", ["get", "type"], "city"],
      },
    ];
    const result = validateSpec(spec);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it("still validates symbol-lite separately", () => {
    const spec: MapSpec = {
      version: "0.1",
      view: { zoom: 4 },
      sources: {
        "my-data": {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        },
      },
      layers: [
        {
          id: "lite-labels",
          type: "symbol-lite",
          source: "my-data",
          layout: { "text-field": "{name}" },
        },
      ],
    };
    const result = validateSpec(spec);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it("rejects symbol without source", () => {
    const spec = minimalSpec();
    spec.layers = [{ id: "labels", type: "symbol" }];
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.code === "LAYER.SOURCE_MISSING")).toBe(true);
  });

  it("rejects symbol referencing missing source", () => {
    const spec = minimalSpec();
    spec.layers = [{ id: "labels", type: "symbol", source: "nonexistent" }];
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.code === "SRC.NOT_FOUND")).toBe(true);
  });

  it("reports symbol layer in stats", () => {
    const result = validateSpec(minimalSpec());
    expect(result.stats.layerCount).toBe(1);
  });
});
