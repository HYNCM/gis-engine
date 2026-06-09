import {
  createPMTilesQueryEvidence,
  createPMTilesRuntimeLoadPlan,
  createSourceReadinessReport,
  type MapSpec,
} from "@gis-engine/engine";
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

  it("maps PMTiles fixture query evidence into query-ready readiness without archive parser claims", () => {
    const spec: MapSpec = {
      version: "0.1",
      view: { center: [0, 0], zoom: 2 },
      sources: {
        parcels: {
          type: "pmtiles",
          url: "./tiles/parcels.pmtiles",
        },
      },
      layers: [
        {
          id: "parcels-fill",
          type: "fill",
          source: "parcels",
          metadata: { "source-layer": "parcels" },
        },
      ],
    };
    const queryEvidence = createPMTilesQueryEvidence(spec, {
      sourceId: "parcels",
      features: [{ id: "parcel-1", sourceLayer: "parcels", bbox: [0, 0, 1, 1] }],
      cases: [{ id: "point-hit", point: [0.5, 0.5], layers: ["parcels-fill"] }],
    });

    const report = createSourceReadinessReport(spec, {
      pmtilesQueryEvidence: { parcels: queryEvidence },
    });

    expect(report.status).toBe("follow-up-required");
    expect(report.summary).toMatchObject({
      sourceCount: 1,
      readinessOnlySourceCount: 1,
      blockedSourceCount: 0,
      displayReadySourceCount: 1,
      queryReadySourceCount: 1,
    });
    expect(report.sources).toEqual([
      expect.objectContaining({
        sourceId: "parcels",
        type: "pmtiles",
        state: "readiness-only",
        displayReady: true,
        queryReady: true,
        queryEvidence: expect.objectContaining({
          status: "ready",
          requirements: expect.objectContaining({
            callerSuppliedDecodedFeatures: true,
            archiveParsing: false,
            hiddenFetch: false,
            rangeRequests: false,
            worker: false,
          }),
        }),
      }),
    ]);
    expect(report.sources[0]?.limitations.join(" ")).toContain("fixture-only");
  });

  it("reports FlatGeobuf as readiness-only now that it is a public source contract", () => {
    const spec = {
      version: "0.1",
      view: { center: [0, 0], zoom: 2 },
      sources: {
        parcels: {
          type: "flatgeobuf",
          url: "./data/parcels.fgb",
        },
      },
      layers: [],
    } as unknown as MapSpec;

    const report = createSourceReadinessReport(spec);

    expect(report.status).toBe("follow-up-required");
    expect(report.summary).toMatchObject({
      sourceCount: 1,
      supportedSourceCount: 0,
      readinessOnlySourceCount: 1,
      blockedSourceCount: 0,
      displayReadySourceCount: 0,
      queryReadySourceCount: 0,
    });
    expect(report.sources).toEqual([
      expect.objectContaining({
        sourceId: "parcels",
        type: "flatgeobuf",
        state: "readiness-only",
        displayReady: false,
        queryReady: false,
        resourcePolicy: "passed",
      }),
    ]);
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "CAPABILITY.UNSUPPORTED",
        path: "/sources/parcels/runtime",
        severity: "warning",
      }),
    );
  });

  it("reports GeoParquet as readiness-only now that it is a public source contract", () => {
    const spec = {
      version: "0.1",
      view: { center: [0, 0], zoom: 2 },
      sources: {
        parcels: {
          type: "geoparquet",
          url: "./data/parcels.parquet",
          crs: { authority: "EPSG", code: "4326" },
          encoding: "WKB",
          rowCount: 42,
          bbox: [-123, 37, -122, 38],
        },
      },
      layers: [],
    } as unknown as MapSpec;

    const report = createSourceReadinessReport(spec);

    expect(report.status).toBe("follow-up-required");
    expect(report.summary).toMatchObject({
      sourceCount: 1,
      supportedSourceCount: 0,
      readinessOnlySourceCount: 1,
      blockedSourceCount: 0,
      displayReadySourceCount: 0,
      queryReadySourceCount: 0,
    });
    expect(report.sources).toEqual([
      expect.objectContaining({
        sourceId: "parcels",
        type: "geoparquet",
        state: "readiness-only",
        displayReady: false,
        queryReady: false,
        resourcePolicy: "passed",
      }),
    ]);
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "CAPABILITY.UNSUPPORTED",
        path: "/sources/parcels/runtime",
        severity: "warning",
      }),
    );
  });

  it("reports GeoTIFF as readiness-only now that it is a public source contract", () => {
    const spec = {
      version: "0.1",
      view: { center: [0, 0], zoom: 2 },
      sources: {
        orthophoto: {
          type: "geotiff",
          url: "./data/orthophoto.tif",
          crs: { authority: "EPSG", code: "4326" },
          bbox: [-123, 37, -122, 38],
          width: 1024,
          height: 512,
          bandCount: 3,
          bands: [
            { index: 1, name: "red", dataType: "uint16", noData: 0 },
            { index: 2, name: "green", dataType: "uint16", noData: 0 },
            { index: 3, name: "blue", dataType: "uint16", noData: 0 },
          ],
          fileBytes: 1_000_000,
        },
      },
      layers: [],
    } as unknown as MapSpec;

    const report = createSourceReadinessReport(spec);

    expect(report.status).toBe("follow-up-required");
    expect(report.summary).toMatchObject({
      sourceCount: 1,
      supportedSourceCount: 0,
      readinessOnlySourceCount: 1,
      blockedSourceCount: 0,
      displayReadySourceCount: 0,
      queryReadySourceCount: 0,
    });
    expect(report.sources).toEqual([
      expect.objectContaining({
        sourceId: "orthophoto",
        type: "geotiff",
        state: "readiness-only",
        displayReady: false,
        queryReady: false,
        resourcePolicy: "passed",
      }),
    ]);
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "CAPABILITY.UNSUPPORTED",
        path: "/sources/orthophoto/runtime",
        severity: "warning",
      }),
    );
  });
});
