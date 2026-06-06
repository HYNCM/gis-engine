import { createPMTilesRuntimeLoadPlan, createSourceReadinessReport, type MapSpec } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

describe("source readiness report", () => {
  it("summarizes supported, readiness-only, and blocked source states without IO", () => {
    const spec: MapSpec = {
      version: "0.1",
      view: { center: [0, 0], zoom: 2 },
      sources: {
        inline: {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        },
        remote: {
          type: "geojson",
          data: "./data/points.geojson",
        },
        parcels: {
          type: "pmtiles",
          url: "pmtiles://local/parcels.pmtiles",
        },
      },
      layers: [
        { id: "inline-circle", type: "circle", source: "inline" },
        { id: "remote-circle", type: "circle", source: "remote" },
        {
          id: "parcels-fill",
          type: "fill",
          source: "parcels",
          metadata: { "source-layer": "parcels" },
        },
      ],
    };

    const pmtilesLoadPlan = createPMTilesRuntimeLoadPlan(spec);
    const report = createSourceReadinessReport(spec, { pmtilesLoadPlan });

    expect(report.status).toBe("follow-up-required");
    expect(report.summary).toMatchObject({
      sourceCount: 3,
      supportedSourceCount: 1,
      readinessOnlySourceCount: 2,
      blockedSourceCount: 0,
      displayReadySourceCount: 3,
      queryReadySourceCount: 1,
    });
    expect(report.sources).toContainEqual(
      expect.objectContaining({
        sourceId: "inline",
        type: "geojson",
        state: "supported",
        queryReady: true,
        resourcePolicy: "not-applicable",
      }),
    );
    expect(report.sources).toContainEqual(
      expect.objectContaining({
        sourceId: "remote",
        type: "geojson",
        state: "readiness-only",
        queryReady: false,
        resourcePolicy: "passed",
      }),
    );
    expect(report.sources).toContainEqual(
      expect.objectContaining({
        sourceId: "parcels",
        type: "pmtiles",
        state: "readiness-only",
        displayReady: true,
        queryReady: false,
        resourcePolicy: "passed",
        runtimeLoadPlan: expect.objectContaining({ status: "ready", sourceLayerIds: ["parcels"] }),
      }),
    );
  });

  it("blocks unknown source types instead of promoting blocked cloud-native formats", () => {
    const spec = {
      version: "0.1",
      view: { center: [0, 0], zoom: 2 },
      sources: {
        parquet: {
          type: "geoparquet",
          url: "./data/parcels.parquet",
        },
      },
      layers: [],
    } as unknown as MapSpec;

    const report = createSourceReadinessReport(spec);

    expect(report.status).toBe("blocked");
    expect(report.sources).toEqual([
      expect.objectContaining({
        sourceId: "parquet",
        type: "geoparquet",
        state: "blocked",
        displayReady: false,
        queryReady: false,
        resourcePolicy: "not-applicable",
      }),
    ]);
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "CAPABILITY.UNSUPPORTED",
        path: "/sources/parquet/type",
      }),
    );
  });
});
