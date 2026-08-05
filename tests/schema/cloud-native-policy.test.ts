import {
  createPMTilesRuntimeLoadPlan,
  DiagnosticCodes,
  defaultFlatGeobufPolicy,
  defaultResourcePolicy,
  type FlatGeobufSourceSpec,
  type GeoParquetSourceSpec,
  type GeoTiffSourceSpec,
  type MapSpec,
  type PMTilesArchiveMetadata,
  PMTilesSourceLoader,
  validateFlatGeobufPolicy,
  validateGeoParquetPolicy,
  validateGeoTiffPolicy,
  validatePMTilesArchivePolicy,
  validateSpec,
} from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import invalidAmbiguousGeoParquet from "../fixtures/geoparquet/invalid-ambiguous.json";
import validGeoParquet11 from "../fixtures/geoparquet/valid-1.1.json";
import validGeoParquet20Rc1 from "../fixtures/geoparquet/valid-2.0-rc.1.json";

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
      specVersion: 2,
      archiveBytes: 1000,
      rootDirectoryOffset: 0,
      rootDirectoryLength: 100,
      hasVectorTiles: false,
      hasRasterTiles: false,
    } as unknown as PMTilesArchiveMetadata;
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
  it.each([
    ["1.1.0", validGeoParquet11],
    ["2.0.0-rc.1", validGeoParquet20Rc1],
  ])("accepts explicit GeoParquet %s metadata and remains runtime-blocked", (_version, fixture) => {
    const source = fixture as GeoParquetSourceSpec;
    const diagnostics = validateGeoParquetPolicy(source);

    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.CapabilityUnsupported,
        path: "/sources/geoparquet/runtime",
      }),
    );
    expect(diagnostics.filter((diagnostic) => diagnostic.severity === "error")).toEqual([]);

    const report = validateSpec({
      version: "0.1",
      view: { center: [0, 0], zoom: 1 },
      sources: { data: fixture },
      layers: [],
    });
    expect(report.valid).toBe(true);
  });

  it("fails closed when version identity is missing", () => {
    const diagnostics = validateGeoParquetPolicy({
      type: "geoparquet",
      url: "./data.parquet",
      metadata: { geoVersion: "1.1.0", encoding: "WKB" },
    });

    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        code: "GEOPARQUET.VERSION_REQUIRED",
        path: "/sources/geoparquet/metadata/releaseIdentity",
        severity: "error",
      }),
    );
  });

  it("explains legacy top-level metadata while requiring an exact version", () => {
    const diagnostics = validateGeoParquetPolicy({
      type: "geoparquet",
      url: "./data.parquet",
      parquetVersion: 1,
      encoding: "WKB",
    });

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "GEOPARQUET.VERSION_REQUIRED",
          path: "/sources/geoparquet/metadata/releaseIdentity",
        }),
        expect.objectContaining({
          code: "GEOPARQUET.METADATA_AMBIGUOUS",
          path: "/sources/geoparquet/metadata",
        }),
      ]),
    );
  });

  it("fails closed for unsupported version identities", () => {
    const diagnostics = validateGeoParquetPolicy({
      type: "geoparquet",
      url: "./data.parquet",
      metadata: { releaseIdentity: "2.0.0", geoVersion: "2.0.0", encoding: "WKB" },
    });

    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        code: "GEOPARQUET.VERSION_UNSUPPORTED",
        path: "/sources/geoparquet/metadata/releaseIdentity",
        severity: "error",
      }),
    );
  });

  it("rejects a raw geo version that does not match the reviewed release", () => {
    const diagnostics = validateGeoParquetPolicy({
      ...validGeoParquet20Rc1,
      metadata: { ...validGeoParquet20Rc1.metadata, geoVersion: "2.0.0-rc.1" },
    });

    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        code: "GEOPARQUET.METADATA_INCOMPATIBLE",
        path: "/sources/geoparquet/metadata/geoVersion",
        severity: "error",
      }),
    );
  });

  it("fails closed for mixed-version metadata", () => {
    const diagnostics = validateGeoParquetPolicy(invalidAmbiguousGeoParquet);

    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        code: "GEOPARQUET.METADATA_AMBIGUOUS",
        path: "/sources/geoparquet/metadata",
        severity: "error",
      }),
    );

    const report = validateSpec({
      version: "0.1",
      view: { center: [0, 0], zoom: 1 },
      sources: { data: invalidAmbiguousGeoParquet },
      layers: [],
    });
    expect(report.valid).toBe(false);
  });

  it.each([
    [
      "1.1 covering under 2.0 RC",
      {
        type: "geoparquet",
        url: "./data.parquet",
        metadata: {
          releaseIdentity: "2.0.0-rc.1",
          geoVersion: "2.0.0",
          encoding: "WKB",
          covering: validGeoParquet11.metadata.covering,
        },
      },
      "/sources/geoparquet/metadata/covering",
    ],
    [
      "2.0 logical type under 1.1",
      {
        type: "geoparquet",
        url: "./data.parquet",
        metadata: {
          releaseIdentity: "1.1.0",
          geoVersion: "1.1.0",
          encoding: "WKB",
          logicalType: "GEOMETRY",
        },
      },
      "/sources/geoparquet/metadata/logicalType",
    ],
    [
      "GeoArrow encoding under 2.0 RC",
      {
        type: "geoparquet",
        url: "./data.parquet",
        metadata: {
          releaseIdentity: "2.0.0-rc.1",
          geoVersion: "2.0.0",
          encoding: "point",
          logicalType: "GEOMETRY",
        },
      },
      "/sources/geoparquet/metadata/encoding",
    ],
  ])("reports stable incompatible metadata for %s", (_name, source, path) => {
    expect(validateGeoParquetPolicy(source)).toContainEqual(
      expect.objectContaining({
        code: "GEOPARQUET.METADATA_INCOMPATIBLE",
        path,
        severity: "error",
      }),
    );
  });

  it("handles unknown input without throwing and keeps runtime blocked", () => {
    const diagnostics = validateGeoParquetPolicy(null);

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: DiagnosticCodes.CapabilityUnsupported, path: "/sources/geoparquet/runtime" }),
        expect.objectContaining({
          code: "GEOPARQUET.VERSION_REQUIRED",
          path: "/sources/geoparquet/metadata/releaseIdentity",
        }),
      ]),
    );
  });

  it("rejects empty URL", () => {
    const source = { ...validGeoParquet11, url: "" } as GeoParquetSourceSpec;
    const diagnostics = validateGeoParquetPolicy(source);
    expect(diagnostics).toContainEqual(expect.objectContaining({ path: "/sources/geoparquet/url", severity: "error" }));
  });

  it.each([
    ["projected coordinates", [500_000, 0, 600_000, 100_000]],
    ["an antimeridian crossing", [170, -10, -170, 10]],
    ["a 3D extent", [500_000, 0, -20, 600_000, 100_000, 500]],
  ])("accepts %s as a numeric GeoParquet bbox tuple", (_name, bbox) => {
    const source = {
      ...validGeoParquet11,
      metadata: { ...validGeoParquet11.metadata, bbox },
    };

    expect(validateGeoParquetPolicy(source)).not.toContainEqual(
      expect.objectContaining({ path: "/sources/geoparquet/metadata/bbox", severity: "error" }),
    );
    expect(
      validateSpec({
        version: "0.1",
        view: { center: [0, 0], zoom: 1 },
        sources: { data: source },
        layers: [],
      }).valid,
    ).toBe(true);
  });

  it("rejects an 8-number bbox for GeoParquet 1.1 in both policy and schema validation", () => {
    const source = {
      ...validGeoParquet11,
      metadata: { ...validGeoParquet11.metadata, bbox: [0, 1, 2, 3, 4, 5, 6, 7] },
    };

    expect(validateGeoParquetPolicy(source)).toContainEqual(
      expect.objectContaining({
        code: "GEOPARQUET.METADATA_INCOMPATIBLE",
        path: "/sources/geoparquet/metadata/bbox",
        severity: "error",
      }),
    );
    expect(
      validateSpec({
        version: "0.1",
        view: { center: [0, 0], zoom: 1 },
        sources: { data: source },
        layers: [],
      }).valid,
    ).toBe(false);
  });

  it("accepts an 8-number bbox for GeoParquet 2.0 RC in both policy and schema validation", () => {
    const source = {
      ...validGeoParquet20Rc1,
      metadata: { ...validGeoParquet20Rc1.metadata, bbox: [0, 1, 2, 3, 4, 5, 6, 7] },
    };

    expect(validateGeoParquetPolicy(source)).not.toContainEqual(
      expect.objectContaining({ path: "/sources/geoparquet/metadata/bbox", severity: "error" }),
    );
    expect(
      validateSpec({
        version: "0.1",
        view: { center: [0, 0], zoom: 1 },
        sources: { data: source },
        layers: [],
      }).valid,
    ).toBe(true);
  });

  it.each([
    ["wrong tuple length", [0, 1, 2]],
    ["non-numeric member", [0, 1, "2", 3]],
    ["non-array value", { west: 0, south: 1, east: 2, north: 3 }],
  ])("fails closed for a GeoParquet bbox with %s", (_name, bbox) => {
    const source = {
      ...validGeoParquet11,
      metadata: { ...validGeoParquet11.metadata, bbox },
    };

    expect(validateGeoParquetPolicy(source)).toContainEqual(
      expect.objectContaining({
        code: "GEOPARQUET.METADATA_INCOMPATIBLE",
        path: "/sources/geoparquet/metadata/bbox",
        severity: "error",
      }),
    );
  });

  it("rejects file exceeding byte limit", () => {
    const source: GeoParquetSourceSpec = {
      ...validGeoParquet11,
      fileBytes: 2_000_000_000,
    };
    const diagnostics = validateGeoParquetPolicy(source);
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ path: "/sources/geoparquet/fileBytes", severity: "error" }),
    );
  });

  it.each([
    [
      "an invalid 1.1 covering",
      {
        ...validGeoParquet11,
        metadata: {
          ...validGeoParquet11.metadata,
          covering: {
            bbox: {
              ...validGeoParquet11.metadata.covering.bbox,
              xmin: ["bbox", "wrong"],
            },
          },
        },
      },
      "GEOPARQUET.METADATA_INCOMPATIBLE",
      "/sources/geoparquet/metadata/covering/bbox/xmin/1",
    ],
    [
      "an extra metadata field",
      {
        ...validGeoParquet11,
        metadata: { ...validGeoParquet11.metadata, unexpected: true },
      },
      "GEOPARQUET.METADATA_INCOMPATIBLE",
      "/sources/geoparquet/metadata/unexpected",
    ],
    ["a negative row count", { ...validGeoParquet11, rowCount: -1 }, "SCHEMA.INVALID", "/sources/geoparquet/rowCount"],
    [
      "a negative file size",
      { ...validGeoParquet11, fileBytes: -1 },
      "SCHEMA.INVALID",
      "/sources/geoparquet/fileBytes",
    ],
    ["the wrong source type", { ...validGeoParquet11, type: "geojson" }, "SCHEMA.INVALID", "/sources/geoparquet/type"],
  ])("fails closed for %s when the public source schema rejects it", (_name, source, code, path) => {
    expect(validateGeoParquetPolicy(source)).toContainEqual(expect.objectContaining({ code, path, severity: "error" }));
    expect(
      validateSpec({
        version: "0.1",
        view: { center: [0, 0], zoom: 1 },
        sources: { data: source },
        layers: [],
      }).valid,
    ).toBe(false);
  });

  it("rejects row count exceeding limit", () => {
    const source: GeoParquetSourceSpec = {
      ...validGeoParquet11,
      rowCount: 20_000_000,
    };
    const diagnostics = validateGeoParquetPolicy(source);
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ path: "/sources/geoparquet/rowCount", severity: "error" }),
    );
  });

  it.each([
    ["null", null],
    ["GeographicCRS", { type: "GeographicCRS", name: "WGS 84", id: { authority: "EPSG", code: 4326 } }],
    ["ProjectedCRS", { type: "ProjectedCRS", name: "WGS 84 / UTM zone 33N", customEvidence: true }],
  ])("accepts %s inline CRS metadata", (_name, crs) => {
    const source = {
      ...validGeoParquet11,
      metadata: { ...validGeoParquet11.metadata, crs },
    };

    expect(validateGeoParquetPolicy(source)).not.toContainEqual(
      expect.objectContaining({ path: "/sources/geoparquet/metadata/crs", severity: "error" }),
    );
    expect(
      validateSpec({
        version: "0.1",
        view: { center: [0, 0], zoom: 1 },
        sources: { data: source },
        layers: [],
      }).valid,
    ).toBe(true);
  });

  it.each([
    ["a non-object", "EPSG:4326"],
    ["an arbitrary object", { notProjJson: true }],
    ["an unsupported PROJJSON type", { type: "Feature", name: "not a CRS" }],
    ["a missing name", { type: "GeographicCRS" }],
    ["an empty name", { type: "ProjectedCRS", name: "" }],
  ])("rejects %s as inline CRS metadata", (_name, crs) => {
    const source = {
      ...validGeoParquet11,
      metadata: { ...validGeoParquet11.metadata, crs },
    };

    expect(validateGeoParquetPolicy(source)).toContainEqual(
      expect.objectContaining({
        code: "GEOPARQUET.METADATA_INCOMPATIBLE",
        path: "/sources/geoparquet/metadata/crs",
        severity: "error",
      }),
    );
  });

  it.each([
    ["false capability evidence", { bbox: false, geometryTypes: false }],
    ["partial capability evidence", { bbox: true }],
    ["a non-object", "available"],
  ])("rejects RC row-group statistics with %s", (_name, rowGroupStatistics) => {
    const source = {
      ...validGeoParquet20Rc1,
      metadata: { ...validGeoParquet20Rc1.metadata, rowGroupStatistics },
    };

    expect(validateGeoParquetPolicy(source)).toContainEqual(
      expect.objectContaining({
        code: "GEOPARQUET.METADATA_INCOMPATIBLE",
        path: "/sources/geoparquet/metadata/rowGroupStatistics",
        severity: "error",
      }),
    );
  });

  it("requires literal true RC row-group statistics in the public schema", () => {
    const source = {
      ...validGeoParquet20Rc1,
      metadata: {
        ...validGeoParquet20Rc1.metadata,
        rowGroupStatistics: { bbox: false, geometryTypes: true },
      },
    };

    expect(
      validateSpec({
        version: "0.1",
        view: { center: [0, 0], zoom: 1 },
        sources: { data: source },
        layers: [],
      }).valid,
    ).toBe(false);
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

describe("CNS-004: GeoTIFF policy validation", () => {
  it("accepts valid GeoTIFF metadata and reports runtime-blocked", () => {
    const source: GeoTiffSourceSpec = {
      type: "geotiff",
      url: "https://localhost/data.tif",
      bbox: [-180, -90, 180, 90],
      crs: { authority: "EPSG", code: "4326" },
      width: 1024,
      height: 512,
      bandCount: 3,
      bands: [
        { index: 1, name: "red", dataType: "uint16", noData: 0 },
        { index: 2, name: "green", dataType: "uint16", noData: 0 },
        { index: 3, name: "blue", dataType: "uint16", noData: 0 },
      ],
      fileBytes: 1_000_000,
    };

    const diagnostics = validateGeoTiffPolicy(source);

    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        code: "CAPABILITY.UNSUPPORTED",
        path: "/sources/geotiff/runtime",
      }),
    );
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  });

  it("rejects missing CRS metadata by default", () => {
    const source: GeoTiffSourceSpec = { type: "geotiff", url: "data.tif" };

    const diagnostics = validateGeoTiffPolicy(source);

    expect(diagnostics).toContainEqual(expect.objectContaining({ path: "/sources/geotiff/crs", severity: "error" }));
  });

  it("rejects band metadata that does not match bandCount", () => {
    const source: GeoTiffSourceSpec = {
      type: "geotiff",
      url: "data.tif",
      crs: { authority: "EPSG", code: "4326" },
      bandCount: 2,
      bands: [{ index: 1, name: "red", dataType: "uint16" }],
    };

    const diagnostics = validateGeoTiffPolicy(source);

    expect(diagnostics).toContainEqual(expect.objectContaining({ path: "/sources/geotiff/bands", severity: "error" }));
  });
});
