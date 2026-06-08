import { type MapSpec, transformMapSpecToMapLibreStyle } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import fillExtrusionLite from "../fixtures/specs/valid/fill-extrusion-lite.map.json";
import pmtilesVector from "../fixtures/specs/valid/pmtiles-vector.map.json";

describe("MapSpecToMapLibreStyleTransformer", () => {
  it("transforms a supported MapSpec into a MapLibre style", () => {
    const result = transformMapSpecToMapLibreStyle(before as MapSpec);

    expect(result.diagnostics).toEqual([]);
    expect(result.style?.version).toBe(8);
    expect(result.style?.sources.districts?.type).toBe("geojson");
    expect(result.style?.layers[0]).toMatchObject({
      id: "district-fill",
      type: "fill",
      source: "districts",
    });
  });

  it("returns diagnostics for invalid expressions", () => {
    const spec = structuredClone(before) as MapSpec;
    spec.layers[0] = {
      ...firstLayer(spec),
      paint: {
        "fill-color": ["coalesce", ["get", "kind"], "#fff"],
      },
    };

    const result = transformMapSpecToMapLibreStyle(spec);

    expect(result.style).toBeUndefined();
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "EXPR.UNKNOWN_OPERATOR")).toBe(true);
  });

  it("transforms generic vector tile sources with source-layer metadata", () => {
    const spec = structuredClone(before) as MapSpec;
    spec.sources = {
      districts: {
        type: "vector",
        tiles: ["./tiles/{z}/{x}/{y}.pbf"],
        minzoom: 0,
        maxzoom: 12,
        attribution: "Local test tiles",
      },
    };
    spec.layers[0] = {
      ...firstLayer(spec),
      metadata: { "source-layer": "districts" },
    };

    const result = transformMapSpecToMapLibreStyle(spec);

    expect(result.diagnostics).toEqual([]);
    expect(result.style?.sources.districts).toEqual({
      type: "vector",
      tiles: ["./tiles/{z}/{x}/{y}.pbf"],
      minzoom: 0,
      maxzoom: 12,
      attribution: "Local test tiles",
    });
    expect(result.style?.layers[0]?.["source-layer"]).toBe("districts");
  });

  it("maps PMTiles vector sources to MapLibre URL-compatible display style without parser claims", () => {
    const result = transformMapSpecToMapLibreStyle(pmtilesVector as MapSpec);

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        severity: "warning",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/sources/local-parcels",
      }),
    ]);
    expect(result.style?.sources["local-parcels"]).toEqual({
      type: "vector",
      url: "./tiles/parcels.pmtiles",
    });
    expect(result.style?.layers.map((layer) => layer["source-layer"])).toEqual(["parcels", "parcels"]);
  });

  it("rejects GeoParquet sources at the MapLibre transform boundary", () => {
    const spec = structuredClone(before) as MapSpec;
    spec.sources = {
      districts: {
        type: "geoparquet",
        url: "./data/districts.parquet",
      },
    };

    const result = transformMapSpecToMapLibreStyle(spec);

    expect(result.style).toBeUndefined();
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/sources/districts/url",
      }),
    );
  });

  it("forwards layer filters and zoom ranges to MapLibre style layers", () => {
    const spec = structuredClone(before) as MapSpec;
    spec.layers[0] = {
      ...firstLayer(spec),
      filter: ["==", ["get", "category"], "landmark"],
      minzoom: 9,
      maxzoom: 17,
    };

    const result = transformMapSpecToMapLibreStyle(spec);

    expect(result.diagnostics).toEqual([]);
    expect(result.style?.layers[0]).toMatchObject({
      filter: ["==", ["get", "category"], "landmark"],
      minzoom: 9,
      maxzoom: 17,
    });
  });

  it("returns capability-only diagnostics for schema-valid unsupported layers", () => {
    const spec = structuredClone(before) as MapSpec;
    spec.layers[0] = {
      ...firstLayer(spec),
      type: "fill-extrusion-lite",
    };

    const result = transformMapSpecToMapLibreStyle(spec);

    expect(result.style).toBeUndefined();
    expect(result.diagnostics.filter((diagnostic) => diagnostic.severity === "error")).toEqual([
      expect.objectContaining({
        code: "CAPABILITY.UNSUPPORTED",
        path: "/layers/0/type",
      }),
    ]);
  });

  it("maps gated fill-extrusion-lite layers to MapLibre fill-extrusion", () => {
    const result = transformMapSpecToMapLibreStyle(fillExtrusionLite as MapSpec);

    expect(result.diagnostics).toEqual([]);
    expect(result.style?.pitch).toBe(50);
    expect(result.style?.layers[0]).toMatchObject({
      id: "district-extrusion",
      type: "fill-extrusion",
      source: "districts",
      paint: {
        "fill-extrusion-color": "#38bdf8",
        "fill-extrusion-height": ["to-number", ["get", "height"], 0],
        "fill-extrusion-base": 0,
        "fill-extrusion-opacity": 0.75,
      },
    });
  });
});

function firstLayer(spec: MapSpec): MapSpec["layers"][number] {
  const layer = spec.layers[0];
  if (!layer) throw new Error("Expected first layer fixture.");
  return layer;
}
