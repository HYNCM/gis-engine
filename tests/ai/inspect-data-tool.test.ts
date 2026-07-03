import { inspectDataTool } from "@gis-engine/ai";
import { describe, expect, it } from "vitest";

describe("inspect_data MCP tool", () => {
  const makeGeoJSON = (features: unknown[]) => ({
    type: "FeatureCollection",
    features,
  });

  const pointFeature = (lon: number, lat: number, properties: Record<string, unknown> = {}) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [lon, lat] },
    properties,
  });

  const polygonFeature = (properties: Record<string, unknown> = {}) => ({
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ],
      ],
    },
    properties,
  });

  it("returns ok with valid GeoJSON input", () => {
    const result = inspectDataTool({
      geojson: makeGeoJSON([pointFeature(10, 20, { name: "A" })]),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.featureCount).toBe(1);
      expect(result.result.geometryTypes).toContain("Point");
    }
  });

  it("counts features correctly", () => {
    const result = inspectDataTool({
      geojson: makeGeoJSON([pointFeature(1, 2), pointFeature(3, 4), pointFeature(5, 6)]),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.featureCount).toBe(3);
    }
  });

  it("detects property types", () => {
    const result = inspectDataTool({
      geojson: makeGeoJSON([
        pointFeature(1, 2, { name: "Alice", age: 30, active: true }),
        pointFeature(3, 4, { name: "Bob", age: 25, active: false }),
      ]),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const schema = result.result.propertySchema;
      const nameProp = schema.find((p) => p.name === "name");
      const ageProp = schema.find((p) => p.name === "age");
      const activeProp = schema.find((p) => p.name === "active");

      expect(nameProp?.types).toContain("string");
      expect(ageProp?.types).toContain("number");
      expect(activeProp?.types).toContain("boolean");
    }
  });

  it("collects geometry types", () => {
    const result = inspectDataTool({
      geojson: makeGeoJSON([pointFeature(1, 2), polygonFeature()]),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.geometryTypes).toContain("Point");
      expect(result.result.geometryTypes).toContain("Polygon");
    }
  });

  it("calculates bounds", () => {
    const result = inspectDataTool({
      geojson: makeGeoJSON([pointFeature(-10, -20), pointFeature(30, 40)]),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.bounds).toEqual([-10, -20, 30, 40]);
    }
  });

  it("returns sample features", () => {
    const features = Array.from({ length: 10 }, (_, i) => pointFeature(i, i, { index: i }));
    const result = inspectDataTool({
      geojson: makeGeoJSON(features),
      sampleSize: 3,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.sample).toHaveLength(3);
    }
  });

  it("generates visualization suggestions for numeric data", () => {
    const result = inspectDataTool({
      geojson: makeGeoJSON([pointFeature(1, 2, { population: 1000 })]),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.suggestions).toContain("Consider choropleth or graduated-circle visualization");
    }
  });

  it("generates heatmap suggestion for many points", () => {
    const features = Array.from({ length: 150 }, (_, i) => pointFeature(i * 0.01, i * 0.01));
    const result = inspectDataTool({
      geojson: makeGeoJSON(features),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.suggestions).toContain("Consider heatmap for density visualization");
    }
  });

  it("rejects missing both url and geojson", () => {
    const result = inspectDataTool({});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics[0]?.message).toContain("Either 'url' or 'geojson' must be provided");
    }
  });

  it("handles empty FeatureCollection", () => {
    const result = inspectDataTool({
      geojson: makeGeoJSON([]),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.featureCount).toBe(0);
      expect(result.result.bounds).toEqual([0, 0, 0, 0]);
    }
  });

  it("returns error for url-only input", () => {
    const result = inspectDataTool({ url: "https://example.com/data.geojson" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics[0]?.message).toContain("URL fetching is not available");
    }
  });

  it("generates fill suggestion for polygon data", () => {
    const result = inspectDataTool({
      geojson: makeGeoJSON([polygonFeature({ area: 100 })]),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.suggestions).toContain("Consider fill or fill-extrusion-lite visualization");
    }
  });

  it("generates categorical suggestion for string data", () => {
    const result = inspectDataTool({
      geojson: makeGeoJSON([pointFeature(1, 2, { category: "park" })]),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.suggestions).toContain("Consider symbol labels or categorical styling");
    }
  });
});
