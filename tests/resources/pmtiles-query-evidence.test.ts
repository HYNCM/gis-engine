import { createPMTilesQueryEvidence, DiagnosticCodes, type MapSpec } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

describe("PMTiles fixture query evidence", () => {
  it("records deterministic point/bbox source-layer evidence without archive IO or feature payloads", () => {
    const spec = createPMTilesSpec();
    const evidence = createPMTilesQueryEvidence(spec, {
      sourceId: "parcels",
      resultLimit: 1,
      features: [
        {
          id: "alpha",
          sourceLayer: "parcels",
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: { privateName: "hidden payload" },
        },
        {
          id: "beta",
          sourceLayer: "parcels",
          bbox: [0.5, 0.5, 2, 2],
          properties: { privateName: "second hidden payload" },
        },
      ],
      cases: [
        { id: "point-hit", point: [0, 0], layers: ["parcel-fill"] },
        { id: "bbox-hit", bbox: [-1, -1, 3, 3], layers: ["parcel-outline"] },
      ],
    });

    expect(evidence.status).toBe("ready");
    expect(evidence.sourceLayerIds).toEqual(["parcels"]);
    expect(evidence.layerIds).toEqual(["parcel-fill", "parcel-outline"]);
    expect(evidence.requirements).toMatchObject({
      callerSuppliedDecodedFeatures: true,
      archiveParsing: false,
      hiddenFetch: false,
      rangeRequests: false,
      worker: false,
      featurePayloadReturned: false,
    });
    expect(evidence.loaderContract).toMatchObject({
      resourceAccess: "caller-owned",
      cancellation: "caller-owned",
      timeoutMs: 30_000,
      byteBudgetBytes: 1_048_576,
    });
    expect(evidence.summary).toMatchObject({
      caseCount: 2,
      readyCaseCount: 2,
      emptyCaseCount: 0,
      blockedCaseCount: 0,
      matchedFeatureCount: 3,
      returnedFeatureCount: 2,
      resultTruncated: true,
    });
    expect(evidence.cases).toEqual([
      expect.objectContaining({
        id: "point-hit",
        operation: "point",
        matchCount: 1,
        returnedFeatureCount: 1,
        resultTruncated: false,
      }),
      expect.objectContaining({
        id: "bbox-hit",
        operation: "bbox",
        matchCount: 2,
        returnedFeatureCount: 1,
        resultTruncated: true,
      }),
    ]);
    expect(JSON.stringify(evidence)).not.toContain("hidden payload");
  });

  it("keeps empty-result semantics explicit and non-blocking", () => {
    const evidence = createPMTilesQueryEvidence(createPMTilesSpec(), {
      sourceId: "parcels",
      features: [{ id: "alpha", sourceLayer: "parcels", bbox: [0, 0, 1, 1] }],
      cases: [{ id: "empty-bbox", bbox: [10, 10, 11, 11], layers: ["parcel-fill"] }],
    });

    expect(evidence.status).toBe("empty");
    expect(evidence.summary).toMatchObject({
      readyCaseCount: 0,
      emptyCaseCount: 1,
      blockedCaseCount: 0,
      matchedFeatureCount: 0,
    });
    expect(evidence.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "info",
        code: DiagnosticCodes.QueryEmptyResult,
        path: "/pmtilesQuery/cases/0",
      }),
    );
  });

  it("blocks evidence without at least one query case", () => {
    const evidence = createPMTilesQueryEvidence(createPMTilesSpec(), {
      sourceId: "parcels",
      features: [{ id: "alpha", sourceLayer: "parcels", bbox: [0, 0, 1, 1] }],
      cases: [],
    });

    expect(evidence.status).toBe("blocked");
    expect(evidence.summary.caseCount).toBe(0);
    expect(evidence.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: DiagnosticCodes.CapabilityUnsupported,
        path: "/pmtilesQuery/cases",
      }),
    );
  });

  it("reports loader contract failures for unsupported archives, byte budgets, timeouts, and worker denial", () => {
    const evidence = createPMTilesQueryEvidence(createPMTilesSpec(), {
      sourceId: "parcels",
      loaderContract: {
        timeoutMs: 5,
        byteBudgetBytes: 16,
      },
      features: [{ id: "alpha", sourceLayer: "parcels", bbox: [0, 0, 1, 1] }],
      cases: [
        {
          id: "unsupported-archive",
          point: [0, 0],
          layers: ["parcel-fill"],
          loader: { archive: "unsupported" },
        },
        {
          id: "over-budget",
          point: [0, 0],
          layers: ["parcel-fill"],
          loader: { responseBytes: 32 },
        },
        {
          id: "timeout",
          point: [0, 0],
          layers: ["parcel-fill"],
          loader: { elapsedMs: 8 },
        },
        {
          id: "worker-denied",
          point: [0, 0],
          layers: ["parcel-fill"],
          loader: { worker: "denied" },
        },
      ],
    });

    expect(evidence.status).toBe("blocked");
    expect(evidence.loaderContract).toEqual({
      resourceAccess: "caller-owned",
      cancellation: "caller-owned",
      timeoutMs: 5,
      byteBudgetBytes: 16,
    });
    expect(evidence.summary.blockedCaseCount).toBe(4);
    expect(evidence.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: DiagnosticCodes.CapabilityUnsupported,
          path: "/pmtilesQuery/cases/0/loader/archive",
        }),
        expect.objectContaining({
          code: DiagnosticCodes.SecurityResourceTooLarge,
          path: "/pmtilesQuery/cases/1/loader/responseBytes",
        }),
        expect.objectContaining({
          code: DiagnosticCodes.SecurityResourceTimeout,
          path: "/pmtilesQuery/cases/2/loader/elapsedMs",
        }),
        expect.objectContaining({
          code: DiagnosticCodes.CapabilityUnsupported,
          path: "/pmtilesQuery/cases/3/loader/worker",
        }),
      ]),
    );
  });

  it("reports missing, hidden, incompatible, and unsupported query evidence cases", () => {
    const spec = createPMTilesSpec({
      layers: [
        {
          id: "hidden-fill",
          type: "fill",
          source: "parcels",
          layout: { visibility: "none" },
          metadata: { "source-layer": "parcels" },
        },
        {
          id: "missing-source-fill",
          type: "fill",
          source: "missing-source",
          metadata: { "source-layer": "parcels" },
        },
        { id: "geo-fill", type: "fill", source: "geo", metadata: { "source-layer": "parcels" } },
        { id: "no-source-layer", type: "fill", source: "parcels" },
      ],
    });

    const evidence = createPMTilesQueryEvidence(spec, {
      sourceId: "parcels",
      features: [{ id: "alpha", sourceLayer: "parcels", bbox: [0, 0, 1, 1] }],
      cases: [
        { id: "missing-layer", point: [0, 0], layers: ["does-not-exist"] },
        { id: "hidden-layer", point: [0, 0], layers: ["hidden-fill"] },
        { id: "missing-source", point: [0, 0], layers: ["missing-source-fill"] },
        { id: "unsupported-source", point: [0, 0], layers: ["geo-fill"] },
        { id: "missing-source-layer", point: [0, 0], layers: ["no-source-layer"] },
      ],
    });

    expect(evidence.status).toBe("blocked");
    expect(evidence.summary.blockedCaseCount).toBe(5);
    expect(evidence.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: DiagnosticCodes.LayerNotFound, path: "/pmtilesQuery/cases/0/layers/0" }),
        expect.objectContaining({ code: DiagnosticCodes.CapabilityUnsupported, path: "/layers/0/layout/visibility" }),
        expect.objectContaining({ code: DiagnosticCodes.SourceNotFound, path: "/layers/1/source" }),
        expect.objectContaining({ code: DiagnosticCodes.CapabilityUnsupported, path: "/sources/geo" }),
        expect.objectContaining({
          code: DiagnosticCodes.LayerSourceIncompatible,
          path: "/layers/3/metadata/source-layer",
        }),
      ]),
    );
  });

  it("does not turn adapter PMTiles runtime query into a supported capability", () => {
    const evidence = createPMTilesQueryEvidence(createPMTilesSpec(), {
      sourceId: "parcels",
      features: [{ id: "alpha", sourceLayer: "parcels", bbox: [0, 0, 1, 1] }],
      cases: [{ id: "point-hit", point: [0, 0], layers: ["parcel-fill"] }],
    });

    expect(evidence.requirements.archiveParsing).toBe(false);
    expect(evidence.requirements.rangeRequests).toBe(false);
    expect(evidence.requirements.worker).toBe(false);
    expect(evidence.requirements.callerSuppliedDecodedFeatures).toBe(true);
  });
});

function createPMTilesSpec(overrides: Partial<MapSpec> = {}): MapSpec {
  return {
    version: "0.1",
    view: { center: [0, 0], zoom: 2 },
    sources: {
      parcels: { type: "pmtiles", url: "./tiles/parcels.pmtiles" },
      geo: {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      },
      ...(overrides.sources ?? {}),
    },
    layers: overrides.layers ?? [
      {
        id: "parcel-fill",
        type: "fill",
        source: "parcels",
        metadata: { "source-layer": "parcels" },
      },
      {
        id: "parcel-outline",
        type: "line",
        source: "parcels",
        metadata: { "source-layer": "parcels" },
      },
    ],
    ...overrides,
  };
}
