import {
  defaultFlatGeobufPolicy,
  type FlatGeobufSourceSpec,
  type GeoParquetSourceSpec,
  type PMTilesArchiveMetadata,
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
