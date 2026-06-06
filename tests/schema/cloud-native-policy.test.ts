import {
  createPMTilesRuntimeLoadPlan,
  DiagnosticCodes,
  defaultFlatGeobufPolicy,
  defaultResourcePolicy,
  type FlatGeobufSourceSpec,
  type GeoParquetSourceSpec,
  type MapSpec,
  type PMTilesArchiveMetadata,
  PMTilesSourceLoader,
  validateFlatGeobufPolicy,
  validateGeoParquetPolicy,
  validatePMTilesArchivePolicy,
} from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

describe("CNS-001: PMTiles archive policy validation", () => {
  it("accepts valid PMTiles v3 archive metadata", () => {
    const metadata: PMTilesArchiveMetadata = {
      specVersion: 3,
      archiveBytes: 1_000_000,
      rootDirectoryOffset: 0,
      rootDirectoryLength: 1024,
      hasVectorTiles: true,
      hasRasterTiles: false,
    };
    const diagnostics = validatePMTilesArchivePolicy(metadata);
    expect(diagnostics).toEqual([]);
  });

  it("rejects non-v3 spec version", () => {
    const metadata = {
      specVersion: 2 as any,
      archiveBytes: 1000,
      rootDirectoryOffset: 0,
      rootDirectoryLength: 100,
      hasVectorTiles: false,
      hasRasterTiles: false,
    };
    const diagnostics = validatePMTilesArchivePolicy(metadata);
    expect(diagnostics).toContainEqual(expect.objectContaining({ path: "/pmtiles/specVersion", severity: "error" }));
  });

  it("rejects archive exceeding byte limit", () => {
    const metadata: PMTilesArchiveMetadata = {
      specVersion: 3,
      archiveBytes: 600_000_000,
      rootDirectoryOffset: 0,
      rootDirectoryLength: 100,
      hasVectorTiles: true,
      hasRasterTiles: false,
    };
    const diagnostics = validatePMTilesArchivePolicy(metadata);
    expect(diagnostics).toContainEqual(expect.objectContaining({ path: "/pmtiles/archiveBytes", severity: "error" }));
  });

  it("rejects root directory exceeding limit", () => {
    const metadata: PMTilesArchiveMetadata = {
      specVersion: 3,
      archiveBytes: 1000,
      rootDirectoryOffset: 0,
      rootDirectoryLength: 20_000_000,
      hasVectorTiles: false,
      hasRasterTiles: false,
    };
    const diagnostics = validatePMTilesArchivePolicy(metadata);
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ path: "/pmtiles/rootDirectoryLength", severity: "error" }),
    );
  });

  it("rejects invalid bounds", () => {
    const metadata: PMTilesArchiveMetadata = {
      specVersion: 3,
      archiveBytes: 1000,
      rootDirectoryOffset: 0,
      rootDirectoryLength: 100,
      hasVectorTiles: false,
      hasRasterTiles: false,
      bounds: [-200, -100, 200, 100],
    };
    const diagnostics = validatePMTilesArchivePolicy(metadata);
    expect(diagnostics).toContainEqual(expect.objectContaining({ path: "/pmtiles/bounds", severity: "error" }));
  });
});

describe("CNS-001 runtime load plan: PMTiles URL-compatible delivery", () => {
  it("creates a ready PMTiles runtime load plan with source-layer metadata and archive budgets", () => {
    const plan = createPMTilesRuntimeLoadPlan(pmtilesMapSpec(), {
      archiveMetadata: { parcels: validPMTilesArchiveMetadata() },
      requireArchiveMetadata: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.summary).toEqual({
      pmtilesSourceCount: 1,
      readySourceCount: 1,
      metadataRequiredSourceCount: 0,
      blockedSourceCount: 0,
    });
    expect(plan.sources[0]).toMatchObject({
      sourceId: "parcels",
      status: "ready",
      url: "./data/parcels.pmtiles",
      layerIds: ["parcel-fill", "parcel-outline"],
      sourceLayerIds: ["parcels"],
      requirements: {
        mapLibreVectorSource: true,
        sourceLayerMetadata: true,
        rangeRequests: true,
        worker: true,
        archiveMetadata: true,
        archiveParsing: false,
        featureQuery: false,
      },
      capabilities: {
        sourceType: "pmtiles",
        estimatedByteSize: 1_000_000,
        metadata: expect.objectContaining({
          delivery: "maplibre-vector-url",
          archiveParsing: false,
          featureQuery: false,
          tileType: "vector",
        }),
      },
    });
    expect(plan.diagnostics).toEqual([]);
  });

  it("marks PMTiles plans as metadata-required when archive metadata is required but absent", () => {
    const plan = createPMTilesRuntimeLoadPlan(pmtilesMapSpec(), { requireArchiveMetadata: true });

    expect(plan.status).toBe("metadata-required");
    expect(plan.summary.metadataRequiredSourceCount).toBe(1);
    expect(plan.diagnostics).toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.CapabilityUnsupported,
        severity: "warning",
        path: "/sources/parcels/archiveMetadata",
      }),
    );
  });

  it("blocks PMTiles vector delivery when layers omit source-layer metadata", () => {
    const spec = pmtilesMapSpec();
    const firstLayer = spec.layers[0];
    if (!firstLayer) throw new Error("Expected PMTiles test fixture to include a layer.");
    spec.layers[0] = { ...firstLayer, metadata: undefined };

    const plan = createPMTilesRuntimeLoadPlan(spec);

    expect(plan.status).toBe("blocked");
    expect(plan.summary.blockedSourceCount).toBe(1);
    expect(plan.diagnostics).toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.LayerSourceIncompatible,
        severity: "error",
        path: "/layers/0/metadata/source-layer",
      }),
    );
  });

  it("blocks PMTiles plans before IO when the URL violates resource policy", () => {
    const spec = pmtilesMapSpec();
    spec.sources.parcels = { type: "pmtiles", url: "https://tiles.example.com/parcels.pmtiles" };

    const plan = createPMTilesRuntimeLoadPlan(spec, {
      resourcePolicy: {
        ...defaultResourcePolicy,
        allowedHosts: ["localhost"],
      },
    });

    expect(plan.status).toBe("blocked");
    expect(plan.diagnostics).toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.SecurityUrlBlocked,
        severity: "error",
        path: "/sources/parcels/url",
      }),
    );
  });

  it("scopes archive metadata budget diagnostics to the PMTiles source id", () => {
    const plan = createPMTilesRuntimeLoadPlan(pmtilesMapSpec(), {
      archiveMetadata: {
        parcels: {
          ...validPMTilesArchiveMetadata(),
          archiveBytes: 600_000_000,
        },
      },
    });

    expect(plan.status).toBe("blocked");
    expect(plan.diagnostics).toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.SecurityUrlBlocked,
        severity: "error",
        path: "/sources/parcels/archiveMetadata/archiveBytes",
      }),
    );
  });

  it("exposes a PMTilesSourceLoader for SDK callers that need source-only validation", () => {
    const loader = new PMTilesSourceLoader("parcels");
    const result = loader.validate({ type: "pmtiles", url: "./data/parcels.pmtiles" }, defaultResourcePolicy);

    expect(result.status).toBe("ready");
    expect(result.diagnostics).toEqual([]);
    expect(result.capabilities).toMatchObject({
      sourceType: "pmtiles",
      supportsStreaming: true,
      supportsRandomAccess: true,
      requiresWorker: true,
    });
  });
});

describe("CNS-002: GeoParquet policy validation", () => {
  it("accepts valid GeoParquet metadata and reports runtime-blocked", () => {
    const source: GeoParquetSourceSpec = {
      type: "geoparquet",
      url: "https://localhost/data.parquet",
      bbox: [-180, -90, 180, 90],
      encoding: "WKB",
      crs: { authority: "EPSG", code: "4326" },
      rowCount: 1000,
      fileBytes: 1_000_000,
    };
    const diagnostics = validateGeoParquetPolicy(source);
    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        code: "CAPABILITY.UNSUPPORTED",
        path: "/sources/geoparquet/runtime",
      }),
    );
    // Should have no errors -- only the runtime-blocked warning
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  });

  it("rejects empty URL", () => {
    const source: GeoParquetSourceSpec = { type: "geoparquet", url: "" };
    const diagnostics = validateGeoParquetPolicy(source);
    expect(diagnostics).toContainEqual(expect.objectContaining({ path: "/sources/geoparquet/url", severity: "error" }));
  });

  it("rejects invalid bbox coordinates", () => {
    const source: GeoParquetSourceSpec = {
      type: "geoparquet",
      url: "data.parquet",
      bbox: [-200, -100, 200, 100],
    };
    const diagnostics = validateGeoParquetPolicy(source);
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ path: "/sources/geoparquet/bbox", severity: "error" }),
    );
  });

  it("rejects file exceeding byte limit", () => {
    const source: GeoParquetSourceSpec = {
      type: "geoparquet",
      url: "data.parquet",
      fileBytes: 2_000_000_000,
    };
    const diagnostics = validateGeoParquetPolicy(source);
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ path: "/sources/geoparquet/fileBytes", severity: "error" }),
    );
  });

  it("rejects row count exceeding limit", () => {
    const source: GeoParquetSourceSpec = {
      type: "geoparquet",
      url: "data.parquet",
      rowCount: 20_000_000,
    };
    const diagnostics = validateGeoParquetPolicy(source);
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ path: "/sources/geoparquet/rowCount", severity: "error" }),
    );
  });

  it("warns about non-EPSG CRS authority", () => {
    const source: GeoParquetSourceSpec = {
      type: "geoparquet",
      url: "data.parquet",
      crs: { authority: "IAU", code: "49900" },
    };
    const diagnostics = validateGeoParquetPolicy(source);
    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        path: "/sources/geoparquet/crs/authority",
        severity: "warning",
      }),
    );
  });
});

function validPMTilesArchiveMetadata(): PMTilesArchiveMetadata {
  return {
    specVersion: 3,
    archiveBytes: 1_000_000,
    rootDirectoryOffset: 0,
    rootDirectoryLength: 1024,
    hasVectorTiles: true,
    hasRasterTiles: false,
    tileType: "vector",
    minZoom: 0,
    maxZoom: 14,
    bounds: [120, 30, 121, 31],
  };
}

function pmtilesMapSpec(): MapSpec {
  return {
    version: "0.1",
    id: "pmtiles-runtime-plan",
    view: { mode: "map2d", center: [120.15, 30.28], zoom: 12 },
    sources: {
      parcels: {
        type: "pmtiles",
        url: "./data/parcels.pmtiles",
        minzoom: 0,
        maxzoom: 14,
      },
    },
    layers: [
      {
        id: "parcel-fill",
        type: "fill",
        source: "parcels",
        metadata: { "source-layer": "parcels" },
        paint: { "fill-color": "#22c55e" },
      },
      {
        id: "parcel-outline",
        type: "line",
        source: "parcels",
        metadata: { "source-layer": "parcels" },
        paint: { "line-color": "#166534" },
      },
    ],
  };
}

describe("CNS-003: FlatGeobuf policy validation", () => {
  it("accepts valid FlatGeobuf metadata and reports runtime-blocked", () => {
    const source: FlatGeobufSourceSpec = {
      type: "flatgeobuf",
      url: "https://localhost/data.fgb",
      hasIndex: true,
      featureCount: 5000,
      geometryType: "Polygon",
    };
    const diagnostics = validateFlatGeobufPolicy(source);
    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        code: "CAPABILITY.UNSUPPORTED",
        path: "/sources/flatgeobuf/runtime",
      }),
    );
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  });

  it("rejects empty URL", () => {
    const source: FlatGeobufSourceSpec = { type: "flatgeobuf", url: "" };
    const diagnostics = validateFlatGeobufPolicy(source);
    expect(diagnostics).toContainEqual(expect.objectContaining({ path: "/sources/flatgeobuf/url", severity: "error" }));
  });

  it("rejects file exceeding byte limit", () => {
    const source: FlatGeobufSourceSpec = {
      type: "flatgeobuf",
      url: "data.fgb",
      fileBytes: 600_000_000,
    };
    const diagnostics = validateFlatGeobufPolicy(source);
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ path: "/sources/flatgeobuf/fileBytes", severity: "error" }),
    );
  });

  it("rejects missing index when required by policy", () => {
    const source: FlatGeobufSourceSpec = {
      type: "flatgeobuf",
      url: "data.fgb",
      hasIndex: false,
    };
    const diagnostics = validateFlatGeobufPolicy(source, {
      ...defaultFlatGeobufPolicy,
      indexRequired: true,
    });
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ path: "/sources/flatgeobuf/hasIndex", severity: "error" }),
    );
  });

  it("rejects invalid bbox", () => {
    const source: FlatGeobufSourceSpec = {
      type: "flatgeobuf",
      url: "data.fgb",
      bbox: [-200, 0, 0, 0],
    };
    const diagnostics = validateFlatGeobufPolicy(source);
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ path: "/sources/flatgeobuf/bbox", severity: "error" }),
    );
  });
});
