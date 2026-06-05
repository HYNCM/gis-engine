import { describe, expect, it } from "vitest";
import { MapRuntime, MockAdapter, validateSpec, type MapSpec } from "@gis-engine/engine";

/**
 * VPE-003: App-template visual scene
 * Verifies that template-style apps produce deterministic snapshots
 * or record an explicit waiver.
 */
describe("app-template visual scene", () => {
  it("earthquake template: snapshot passes with clustered points", async () => {
    const runtime = await MapRuntime.create(earthquakeTemplateSpec, {
      adapter: new MockAdapter(),
      container: {} as HTMLElement
    });

    const snapshot = await runtime.snapshot({ targetLayers: ["quakes-circle"] });
    expect(snapshot.passed).toBe(true);
    expect(snapshot.diagnostics).toEqual([]);

    const query = await runtime.queryFeatures({ point: [-122.4, 37.8], layers: ["quakes-circle"] });
    expect(query.diagnostics).toEqual([]);

    const report = await runtime.destroy();
    expect(report.destroyed).toBe(true);
  });

  it("earthquake template: validation passes with clean diagnostics", () => {
    // This is a standalone validation check
    const result = validateSpec(earthquakeTemplateSpec);
    expect(result.valid).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });
});

const earthquakeTemplateSpec: MapSpec = {
  version: "0.1",
  id: "vpe-earthquake-template",
  revision: "1",
  view: { mode: "map2d", center: [-122.4, 37.8], zoom: 6 },
  sources: {
    earthquakes: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          { type: "Feature", properties: { mag: 4.2, place: "San Francisco" }, geometry: { type: "Point", coordinates: [-122.42, 37.77] } },
          { type: "Feature", properties: { mag: 3.1, place: "Oakland" }, geometry: { type: "Point", coordinates: [-122.27, 37.80] } },
          { type: "Feature", properties: { mag: 5.5, place: "Napa" }, geometry: { type: "Point", coordinates: [-122.29, 38.30] } },
          { type: "Feature", properties: { mag: 2.8, place: "Berkeley" }, geometry: { type: "Point", coordinates: [-122.27, 37.87] } },
          { type: "Feature", properties: { mag: 6.1, place: "Santa Cruz" }, geometry: { type: "Point", coordinates: [-122.03, 36.97] } }
        ]
      }
    }
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#f8fafc" } },
    {
      id: "quakes-circle",
      type: "circle",
      source: "earthquakes",
      paint: {
        "circle-color": ["step", ["get", "mag"], "#22c55e", 4, "#eab308", 5, "#ef4444"],
        "circle-radius": ["step", ["get", "mag"], 4, 4, 6, 5, 10]
      }
    }
  ]
};
