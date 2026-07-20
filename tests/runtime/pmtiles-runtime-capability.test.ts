import {
  assessPMTilesRuntimeLoaderReadiness,
  type MapSpec,
  PMTILES_CAPABILITY_DECISION,
  PMTilesRuntimeBlockerCodes,
  PMTilesRuntimeLoader,
} from "@gis-engine/engine";
import { describe, expect, it, vi } from "vitest";

const spec: MapSpec = {
  version: "0.1",
  view: { center: [0, 0], zoom: 2 },
  sources: {
    parcels: { type: "pmtiles", url: "./tiles/parcels.pmtiles" },
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

describe("PMTiles runtime capability truth", () => {
  it("records separate display, archive-load, and feature-query decisions", () => {
    expect(PMTILES_CAPABILITY_DECISION).toEqual({
      display: {
        status: "go",
        scope: "url-compatible-maplibre-vector-display",
      },
      load: {
        status: "no-go",
        scope: "runtime-archive-load",
        blockerCode: PMTilesRuntimeBlockerCodes.ArchiveLoad,
      },
      featureQuery: {
        status: "no-go",
        scope: "runtime-archive-feature-query",
        blockerCode: PMTilesRuntimeBlockerCodes.FeatureQuery,
      },
      loadPlan: {
        status: "go",
        scope: "io-free-caller-metadata-preflight",
      },
      loadGates: [
        "archive-metadata",
        "columnar-directory-lookup",
        "offset-continuation",
        "internal-compression",
        "leaf-directory-traversal",
        "cancellation",
        "byte-budget",
        "range-budget",
        "cache-behavior",
        "resource-policy-before-io",
      ],
      featureQueryGates: [
        "query-semantics",
        "query-diagnostics",
        "adapter-boundary",
        "payload-free-evidence",
        "query-tests",
        "docs",
      ],
    });
    expect(PMTILES_CAPABILITY_DECISION.loadGates).toEqual([
      "archive-metadata",
      "columnar-directory-lookup",
      "offset-continuation",
      "internal-compression",
      "leaf-directory-traversal",
      "cancellation",
      "byte-budget",
      "range-budget",
      "cache-behavior",
      "resource-policy-before-io",
    ]);
    expect(PMTILES_CAPABILITY_DECISION.featureQueryGates).toEqual([
      "query-semantics",
      "query-diagnostics",
      "adapter-boundary",
      "payload-free-evidence",
      "query-tests",
      "docs",
    ]);
  });

  it("keeps the compatibility loader IO-free while archive loading is No-go", async () => {
    const fetchRange = vi.fn(async () => ({ data: new ArrayBuffer(127), status: 206 }));
    const decodeTile = vi.fn(() => []);
    const loader = new PMTilesRuntimeLoader({
      sourceId: "parcels",
      url: "./tiles/parcels.pmtiles",
      fetchRange,
      decodeTile,
    });

    await expect(loader.initialize()).rejects.toMatchObject({
      code: PMTilesRuntimeBlockerCodes.ArchiveLoad,
    });
    const result = await loader.query({ point: [0, 0] });

    expect(fetchRange).not.toHaveBeenCalled();
    expect(decodeTile).not.toHaveBeenCalled();
    expect(loader.getSnapshot()).toMatchObject({
      status: "blocked",
      directoryEntryCount: 0,
      sourceId: "parcels",
    });
    expect(result).toMatchObject({
      features: [],
      truncated: false,
      tilesFetched: 0,
      diagnostics: [
        expect.objectContaining({
          severity: "error",
          code: PMTilesRuntimeBlockerCodes.FeatureQuery,
          path: "/sources/parcels/query",
        }),
      ],
    });
  });

  it("keeps runtime readiness blocked with stable machine-readable diagnostics", () => {
    const loader = new PMTilesRuntimeLoader({
      sourceId: "parcels",
      url: "./tiles/parcels.pmtiles",
      fetchRange: vi.fn(),
      decodeTile: vi.fn(),
    });

    const readiness = assessPMTilesRuntimeLoaderReadiness(spec, loader);

    expect(readiness).toMatchObject({
      sourceId: "parcels",
      queryReady: false,
      status: "blocked",
      headerLoaded: false,
      directoryLoaded: false,
    });
    expect(readiness.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: PMTilesRuntimeBlockerCodes.ArchiveLoad, path: "/sources/parcels/runtime" }),
        expect.objectContaining({ code: PMTilesRuntimeBlockerCodes.FeatureQuery, path: "/sources/parcels/query" }),
      ]),
    );
  });

  it("treats runtime-loader error diagnostics as a parent-source blocker", async () => {
    const loader = new PMTilesRuntimeLoader({
      sourceId: "parcels",
      url: "./tiles/parcels.pmtiles",
      fetchRange: vi.fn(),
      decodeTile: vi.fn(),
    });

    const readiness = assessPMTilesRuntimeLoaderReadiness(spec, loader);
    const errorReadiness = {
      ...readiness,
      status: "ready" as const,
      diagnostics: [
        ...readiness.diagnostics,
        {
          severity: "error" as const,
          code: "PMTILES.RUNTIME_ARCHIVE_LOAD_BLOCKED",
          message: "runtime loader failed",
          path: "/sources/parcels/runtime",
        },
      ],
    };

    const { createSourceReadinessReport } = await import("@gis-engine/engine");
    const report = createSourceReadinessReport(spec, { pmtilesRuntimeLoaders: { parcels: errorReadiness } });

    expect(report.status).toBe("blocked");
    expect(report.sources[0]).toMatchObject({ sourceId: "parcels", state: "blocked" });
  });

  it.each([
    "loadHeader",
    "loadDirectory",
    "initialize",
  ] as const)("rejects %s with the archive-load blocker instead of implying successful loading", async (method) => {
    const fetchRange = vi.fn();
    const loader = new PMTilesRuntimeLoader({
      sourceId: "parcels",
      url: "./tiles/parcels.pmtiles",
      fetchRange,
      decodeTile: vi.fn(),
    });

    await expect(loader[method]()).rejects.toMatchObject({
      code: PMTilesRuntimeBlockerCodes.ArchiveLoad,
      path: "/sources/parcels/runtime",
    });
    expect(fetchRange).not.toHaveBeenCalled();
  });
});
