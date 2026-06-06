import { MapRuntime, type MapSpec, MockAdapter } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

/**
 * VPE-001: 3-scene strict visual maintenance
 * Verifies that GeoJSON, MVT-equivalent, and fill-extrusion-lite scenes
 * remain release-capable through the snapshot pipeline.
 */
describe("strict visual maintenance: 3-scene smoke", () => {
  it("GeoJSON scene: snapshot passes with inline data", async () => {
    const runtime = await MapRuntime.create(geojsonScene, {
      adapter: new MockAdapter(),
      container: {} as HTMLElement,
    });

    const snapshot = await runtime.snapshot({ targetLayers: ["places-circle"] });
    expect(snapshot.passed).toBe(true);
    expect(snapshot.dataUrl).toBeTruthy();

    await runtime.destroy();
  });

  it("MVT-equivalent scene: vector source with tile URL passes validation", async () => {
    const runtime = await MapRuntime.create(mvtScene, {
      adapter: new MockAdapter(),
      container: {} as HTMLElement,
    });

    const validation = runtime.validate();
    expect(validation.valid).toBe(true);

    await runtime.destroy();
  });

  it("fill-extrusion-lite scene: snapshot passes with extrusion layer", async () => {
    const runtime = await MapRuntime.create(extrusionScene, {
      adapter: new MockAdapter(),
      container: {} as HTMLElement,
    });

    const snapshot = await runtime.snapshot({ targetLayers: ["buildings-extrusion"] });
    expect(snapshot.passed).toBe(true);

    await runtime.destroy();
  });

  it("all 3 scenes produce clean resource reports on destroy", async () => {
    const scenes = [geojsonScene, mvtScene, extrusionScene];

    for (const scene of scenes) {
      const runtime = await MapRuntime.create(scene, {
        adapter: new MockAdapter(),
        container: {} as HTMLElement,
      });
      const report = await runtime.destroy();
      expect(report.destroyed).toBe(true);
      expect(report.resources).toBeDefined();
      expect(report.resources?.verifiable).toBe(true);
    }
  });
});

const geojsonScene: MapSpec = {
  version: "0.1",
  id: "vpe-geojson-scene",
  revision: "1",
  view: { mode: "map2d", center: [120.15, 30.28], zoom: 11 },
  sources: {
    places: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { name: "West Lake" },
            geometry: { type: "Point", coordinates: [120.15, 30.25] },
          },
          { type: "Feature", properties: { name: "Canal" }, geometry: { type: "Point", coordinates: [120.14, 30.32] } },
        ],
      },
    },
  },
  layers: [
    { id: "places-circle", type: "circle", source: "places", paint: { "circle-color": "#2563eb", "circle-radius": 6 } },
  ],
};

const mvtScene: MapSpec = {
  version: "0.1",
  id: "vpe-mvt-scene",
  revision: "1",
  view: { mode: "map2d", center: [120.15, 30.28], zoom: 10 },
  sources: {
    districts: {
      type: "vector",
      tiles: ["http://localhost:8080/tiles/{z}/{x}/{y}.pbf"],
    },
  },
  layers: [
    {
      id: "districts-fill",
      type: "fill",
      source: "districts",
      metadata: { "source-layer": "districts" },
      paint: { "fill-color": "#22c55e", "fill-opacity": 0.4 },
    },
  ],
};

const extrusionScene: MapSpec = {
  version: "0.1",
  id: "vpe-extrusion-scene",
  revision: "1",
  capabilities: {
    dimensions: ["2_5d"],
    experimental: ["fill-extrusion-lite"],
  },
  view: { mode: "map2_5d", center: [120.15, 30.28], zoom: 15 },
  sources: {
    buildings: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { height: 50, name: "Tower A" },
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [120.15, 30.28],
                  [120.151, 30.28],
                  [120.151, 30.281],
                  [120.15, 30.281],
                  [120.15, 30.28],
                ],
              ],
            },
          },
        ],
      },
    },
  },
  layers: [
    {
      id: "buildings-extrusion",
      type: "fill-extrusion-lite",
      source: "buildings",
      paint: {
        "fill-extrusion-color": "#6366f1",
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-opacity": 0.8,
      },
    },
  ],
};
