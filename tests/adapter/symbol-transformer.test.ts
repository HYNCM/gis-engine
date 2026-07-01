import { type MapSpec, transformMapSpecToMapLibreStyle } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

const baseSpec = (): MapSpec => ({
  version: "0.1",
  view: { zoom: 4 },
  sources: {
    "label-data": {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    },
  },
  layers: [{ id: "labels", type: "symbol", source: "label-data" }],
});

describe("symbol transformer", () => {
  it("transforms symbol layer to MapLibre symbol type", () => {
    const result = transformMapSpecToMapLibreStyle(baseSpec());

    expect(result.diagnostics).toEqual([]);
    expect(result.style?.layers[0]).toMatchObject({
      id: "labels",
      type: "symbol",
      source: "label-data",
    });
  });

  it("forwards symbol layout properties to MapLibre style", () => {
    const spec = baseSpec();
    spec.layers = [
      {
        id: "labels",
        type: "symbol",
        source: "label-data",
        layout: {
          "text-field": "{name}",
          "text-size": 14,
          "text-anchor": "center",
          "symbol-placement": "point",
          "icon-image": "marker",
          "icon-size": 0.5,
        },
      },
    ];

    const result = transformMapSpecToMapLibreStyle(spec);

    expect(result.diagnostics).toEqual([]);
    expect(result.style?.layers[0]?.layout).toEqual({
      "text-field": "{name}",
      "text-size": 14,
      "text-anchor": "center",
      "symbol-placement": "point",
      "icon-image": "marker",
      "icon-size": 0.5,
    });
  });

  it("forwards symbol paint properties to MapLibre style", () => {
    const spec = baseSpec();
    spec.layers = [
      {
        id: "labels",
        type: "symbol",
        source: "label-data",
        layout: { "text-field": "{name}" },
        paint: {
          "text-color": "#333",
          "text-halo-color": "#fff",
          "text-halo-width": 2,
          "text-opacity": 0.9,
        },
      },
    ];

    const result = transformMapSpecToMapLibreStyle(spec);

    expect(result.diagnostics).toEqual([]);
    expect(result.style?.layers[0]?.paint).toEqual({
      "text-color": "#333",
      "text-halo-color": "#fff",
      "text-halo-width": 2,
      "text-opacity": 0.9,
    });
  });

  it("forwards symbol filter and zoom range", () => {
    const spec = baseSpec();
    spec.layers = [
      {
        id: "labels",
        type: "symbol",
        source: "label-data",
        layout: { "text-field": "{name}" },
        filter: ["==", ["get", "type"], "city"],
        minzoom: 2,
        maxzoom: 14,
      },
    ];

    const result = transformMapSpecToMapLibreStyle(spec);

    expect(result.diagnostics).toEqual([]);
    expect(result.style?.layers[0]).toMatchObject({
      filter: ["==", ["get", "type"], "city"],
      minzoom: 2,
      maxzoom: 14,
    });
  });

  it("transforms symbol layer alongside other layer types", () => {
    const spec = baseSpec();
    spec.sources["fill-data"] = { type: "geojson", data: { type: "FeatureCollection", features: [] } };
    spec.layers = [
      { id: "area", type: "fill", source: "fill-data", paint: { "fill-color": "#ccc" } },
      { id: "labels", type: "symbol", source: "label-data", layout: { "text-field": "{name}" } },
    ];

    const result = transformMapSpecToMapLibreStyle(spec);

    expect(result.diagnostics).toEqual([]);
    expect(result.style?.layers).toHaveLength(2);
    expect(result.style?.layers[0]?.type).toBe("fill");
    expect(result.style?.layers[1]?.type).toBe("symbol");
  });

  it("transforms symbol and symbol-lite layers independently", () => {
    const spec = baseSpec();
    spec.layers = [
      { id: "full-sym", type: "symbol", source: "label-data", layout: { "text-field": "{name}" } },
      { id: "lite-sym", type: "symbol-lite", source: "label-data", layout: { "text-field": "{code}" } },
    ];

    const result = transformMapSpecToMapLibreStyle(spec);

    expect(result.diagnostics).toEqual([]);
    expect(result.style?.layers).toHaveLength(2);
    expect(result.style?.layers[0]?.type).toBe("symbol");
    expect(result.style?.layers[1]?.type).toBe("symbol");
  });

  it("forwards expression-based text-size to MapLibre style", () => {
    const spec = baseSpec();
    spec.layers = [
      {
        id: "labels",
        type: "symbol",
        source: "label-data",
        layout: {
          "text-field": "{name}",
          "text-size": ["interpolate", ["linear"], ["zoom"], 0, 10, 22, 24],
        },
      },
    ];

    const result = transformMapSpecToMapLibreStyle(spec);

    expect(result.diagnostics).toEqual([]);
    expect(result.style?.layers[0]?.layout?.["text-size"]).toEqual([
      "interpolate",
      ["linear"],
      ["zoom"],
      0,
      10,
      22,
      24,
    ]);
  });
});
