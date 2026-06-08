import {
  type FeatureQueryResult,
  MapLibreAdapter,
  type MapSpec,
  MockAdapter,
  type RendererAdapter,
} from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

const querySpec: MapSpec = {
  version: "0.1",
  id: "query-features",
  revision: "1",
  view: {
    mode: "map2d",
    center: [0, 0],
    zoom: 2,
  },
  sources: {
    inline: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { id: "point-a" },
            geometry: { type: "Point", coordinates: [10, 10] },
          },
          {
            type: "Feature",
            properties: { id: "point-b" },
            geometry: { type: "Point", coordinates: [20, 20] },
          },
          {
            type: "Feature",
            properties: { id: "poly-a" },
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [0, 0],
                  [5, 0],
                  [5, 5],
                  [0, 5],
                  [0, 0],
                ],
              ],
            },
          },
        ],
      },
    },
    remote: {
      type: "geojson",
      data: "./data/remote.geojson",
    },
    raster: {
      type: "raster",
      tiles: ["./tiles/{z}/{x}/{y}.png"],
    },
    tiles: {
      type: "pmtiles",
      url: "pmtiles://example.pmtiles",
    },
  },
  layers: [
    { id: "places-circle", type: "circle", source: "inline" },
    { id: "areas-fill", type: "fill", source: "inline" },
    { id: "remote-circle", type: "circle", source: "remote" },
    { id: "raster-layer", type: "raster", source: "raster" },
    { id: "pmtiles-layer", type: "circle", source: "tiles" },
  ],
};

const adapters: Array<{ name: string; create: () => RendererAdapter }> = [
  { name: "MockAdapter", create: () => new MockAdapter() },
  { name: "MapLibreAdapter", create: () => new MapLibreAdapter() },
];

describe.each(adapters)("queryFeatures MVP in $name", ({ create }) => {
  it("returns inline GeoJSON point features for point queries", async () => {
    const adapter = create();
    await adapter.load(querySpec, { container: {} as HTMLElement });

    const result = await adapter.queryFeatures({ point: [10, 10], layers: ["places-circle"] });

    expect(result.diagnostics).toEqual([]);
    expect(featureIds(result)).toEqual(["point-a"]);
  });

  it("returns bbox-able inline GeoJSON features for bbox queries", async () => {
    const adapter = create();
    await adapter.load(querySpec, { container: {} as HTMLElement });

    const result = await adapter.queryFeatures({ bbox: [4, 4, 6, 6], layers: ["areas-fill"] });

    expect(result.diagnostics).toEqual([]);
    expect(featureIds(result)).toEqual(["poly-a"]);
  });

  it("reports unsupported diagnostics for URL GeoJSON, raster, and PMTiles sources", async () => {
    const adapter = create();
    await adapter.load(querySpec, { container: {} as HTMLElement });

    const result = await adapter.queryFeatures({
      point: [0, 0],
      layers: ["remote-circle", "raster-layer", "pmtiles-layer"],
    });

    expect(result.features).toEqual([]);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/sources/remote/data",
      }),
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/sources/raster",
      }),
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/sources/tiles/url",
      }),
    ]);
  });

  it("reports one stable diagnostic for invalid query geometry", async () => {
    const adapter = create();
    await adapter.load(querySpec, { container: {} as HTMLElement });

    const invalidPoint = await adapter.queryFeatures({ point: [Number.NaN, 10], layers: ["places-circle"] });
    const reversedBbox = await adapter.queryFeatures({ bbox: [10, 10, 0, 0], layers: ["places-circle"] });

    expect(invalidPoint.features).toEqual([]);
    expect(invalidPoint.diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        code: "GEO.INVALID_COORDINATES",
        path: "/point",
      }),
    ]);
    expect(reversedBbox.features).toEqual([]);
    expect(reversedBbox.diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        code: "GEO.EMPTY_BBOX",
        path: "/bbox",
      }),
    ]);
  });
});

it("reports unsupported diagnostics for FlatGeobuf URL sources in headless query", async () => {
  const adapter = new MockAdapter();
  const spec: MapSpec = {
    version: "0.1",
    view: { center: [0, 0], zoom: 2 },
    sources: {
      flatgeobuf: {
        type: "flatgeobuf",
        url: "./data/flatgeobuf.fgb",
      },
    },
    layers: [{ id: "flatgeobuf-layer", type: "circle", source: "flatgeobuf" }],
  };
  await adapter.load(spec, { container: {} as HTMLElement });

  const result = await adapter.queryFeatures({ point: [0, 0], layers: ["flatgeobuf-layer"] });

  expect(result.features).toEqual([]);
  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      severity: "error",
      code: "CAPABILITY.UNSUPPORTED",
      path: "/sources/flatgeobuf/url",
    }),
  ]);
});

it("reports unsupported diagnostics for GeoParquet URL sources in headless query", async () => {
  const adapter = new MockAdapter();
  const spec: MapSpec = {
    version: "0.1",
    view: { center: [0, 0], zoom: 2 },
    sources: {
      geoparquet: {
        type: "geoparquet",
        url: "./data/geoparquet.parquet",
        crs: { authority: "EPSG", code: "4326" },
        encoding: "WKB",
      },
    },
    layers: [{ id: "geoparquet-layer", type: "circle", source: "geoparquet" }],
  };
  await adapter.load(spec, { container: {} as HTMLElement });

  const result = await adapter.queryFeatures({ point: [0, 0], layers: ["geoparquet-layer"] });

  expect(result.features).toEqual([]);
  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      severity: "error",
      code: "CAPABILITY.UNSUPPORTED",
      path: "/sources/geoparquet/url",
    }),
  ]);
});

function featureIds(result: FeatureQueryResult): string[] {
  return result.features
    .map((feature) => (feature as { properties?: { id?: string } }).properties?.id)
    .filter((id): id is string => typeof id === "string")
    .sort();
}
