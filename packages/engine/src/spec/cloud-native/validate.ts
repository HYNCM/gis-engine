import { DiagnosticCodes } from "../../diagnostics/codes.js";
import type { Diagnostic } from "../../types.js";
import { escapePathSegment } from "../patch/path.js";
import type { FlatGeobufPolicy, FlatGeobufSourceSpec } from "./flatgeobuf-source.js";
import { defaultFlatGeobufPolicy } from "./flatgeobuf-source.js";
import type { GeoParquetPolicy } from "./geoparquet-source.js";
import {
  defaultGeoParquetPolicy,
  hasGeoParquet20Rc1RowGroupStatistics,
  isGeoParquetBbox,
  isGeoParquetProjJsonCrs,
} from "./geoparquet-source.js";
import type { GeoTiffPolicy, GeoTiffSourceSpec } from "./geotiff-source.js";
import { defaultGeoTiffPolicy } from "./geotiff-source.js";
import type { PMTilesArchiveMetadata, PMTilesArchivePolicy } from "./pmtiles-archive.js";
import { defaultPMTilesArchivePolicy } from "./pmtiles-archive.js";

const DEFAULT_MAX_PMTILES_ARCHIVE_BYTES = 524_288_000;
const DEFAULT_MAX_PMTILES_ROOT_DIRECTORY_BYTES = 16_777_216;
const DEFAULT_MAX_GEOPARQUET_FILE_BYTES = 1_073_741_824;
const DEFAULT_MAX_GEOPARQUET_ROW_COUNT = 10_000_000;
const DEFAULT_MAX_GEOTIFF_FILE_BYTES = 536_870_912;
const DEFAULT_MAX_GEOTIFF_PIXELS = 100_000_000;
const DEFAULT_MAX_GEOTIFF_BAND_COUNT = 16;
const DEFAULT_MAX_FLATGEOBUF_FILE_BYTES = 500 * 1024 * 1024;

/**
 * Validate PMTiles archive metadata against policy.
 * Returns diagnostics without performing any IO.
 */
export function validatePMTilesArchivePolicy(
  metadata: PMTilesArchiveMetadata,
  policy: PMTilesArchivePolicy = defaultPMTilesArchivePolicy,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  if (metadata.specVersion !== 3 && metadata.specVersion !== "3") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SchemaInvalid,
      message: `PMTiles spec version ${metadata.specVersion} is not supported. Only version 3 is accepted.`,
      path: "/pmtiles/specVersion",
    });
  }

  const maxBytes = policy.maxArchiveBytes ?? DEFAULT_MAX_PMTILES_ARCHIVE_BYTES;
  if (metadata.archiveBytes > maxBytes) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SecurityUrlBlocked,
      message: `PMTiles archive size ${metadata.archiveBytes} exceeds policy limit ${maxBytes}.`,
      path: "/pmtiles/archiveBytes",
    });
  }

  const maxRootDir = policy.maxRootDirectoryBytes ?? DEFAULT_MAX_PMTILES_ROOT_DIRECTORY_BYTES;
  if (metadata.rootDirectoryLength > maxRootDir) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SecurityUrlBlocked,
      message: `PMTiles root directory size ${metadata.rootDirectoryLength} exceeds policy limit ${maxRootDir}.`,
      path: "/pmtiles/rootDirectoryLength",
    });
  }

  if (metadata.bounds) {
    const [w, s, e, n] = metadata.bounds;
    if (w < -180 || w > 180 || e < -180 || e > 180 || s < -90 || s > 90 || n < -90 || n > 90) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SchemaInvalid,
        message: "PMTiles bounds must be within [-180, -90, 180, 90].",
        path: "/pmtiles/bounds",
      });
    }
  }

  return diagnostics;
}

/**
 * Validate GeoParquet source metadata against policy.
 * Returns diagnostics without performing any IO.
 * Runtime loading/query remains blocked -- this validates metadata only.
 */
export function validateGeoParquetPolicy(
  source: unknown,
  policy: GeoParquetPolicy = defaultGeoParquetPolicy,
  sourceId = "geoparquet",
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const sourcePath = `/sources/${escapePathSegment(sourceId)}`;
  const sourceRecord = asRecord(source);
  const metadata = asRecord(sourceRecord?.metadata);

  // Runtime is always blocked -- this is a metadata-only contract
  diagnostics.push({
    severity: "warning",
    code: DiagnosticCodes.CapabilityUnsupported,
    message: "GeoParquet runtime loading and query are not implemented. This is a metadata-only contract.",
    path: `${sourcePath}/runtime`,
  });

  const releaseIdentity = metadata?.releaseIdentity;
  if (typeof releaseIdentity !== "string" || releaseIdentity.length === 0) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.GeoParquetVersionRequired,
      message: "GeoParquet metadata must declare an exact reviewed release identity.",
      path: `${sourcePath}/metadata/releaseIdentity`,
    });
  } else if (releaseIdentity !== "1.1.0" && releaseIdentity !== "2.0.0-rc.1") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.GeoParquetVersionUnsupported,
      message: `GeoParquet release identity "${releaseIdentity}" is not accepted; use 1.1.0 or the reviewed 2.0.0-rc.1 readiness contract.`,
      path: `${sourcePath}/metadata/releaseIdentity`,
    });
  } else if (metadata) {
    diagnostics.push(...validateGeoParquetMetadata(metadata, releaseIdentity, sourcePath));
  }

  if (sourceRecord && ["parquetVersion", "encoding", "crs", "bbox"].some((key) => key in sourceRecord)) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.GeoParquetMetadataAmbiguous,
      message: "GeoParquet versioned metadata must not be mixed with legacy top-level metadata fields.",
      path: `${sourcePath}/metadata`,
    });
  }

  const url = sourceRecord?.url;
  if (typeof url !== "string" || url.trim().length === 0) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SchemaInvalid,
      message: "GeoParquet source URL must not be empty.",
      path: `${sourcePath}/url`,
    });
  }

  const fileBytes = sourceRecord?.fileBytes;
  if (typeof fileBytes === "number") {
    const maxBytes = policy.maxFileBytes ?? DEFAULT_MAX_GEOPARQUET_FILE_BYTES;
    if (fileBytes > maxBytes) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SecurityUrlBlocked,
        message: `GeoParquet file size ${fileBytes} exceeds policy limit ${maxBytes}.`,
        path: `${sourcePath}/fileBytes`,
      });
    }
  }

  const rowCount = sourceRecord?.rowCount;
  if (typeof rowCount === "number") {
    const maxRows = policy.maxRowCount ?? DEFAULT_MAX_GEOPARQUET_ROW_COUNT;
    if (rowCount > maxRows) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SecurityUrlBlocked,
        message: `GeoParquet row count ${rowCount} exceeds policy limit ${maxRows}.`,
        path: `${sourcePath}/rowCount`,
      });
    }
  }

  return diagnostics;
}

function validateGeoParquetMetadata(
  metadata: Record<string, unknown>,
  releaseIdentity: "1.1.0" | "2.0.0-rc.1",
  sourcePath: string,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const hasCovering = "covering" in metadata;
  const hasLogicalType = "logicalType" in metadata;
  const hasRowGroupStatistics = "rowGroupStatistics" in metadata;
  const mixedVersionFields = hasCovering && (hasLogicalType || hasRowGroupStatistics);

  if (mixedVersionFields) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.GeoParquetMetadataAmbiguous,
      message: "GeoParquet metadata mixes 1.1 covering fields with 2.0 RC native logical-type evidence.",
      path: `${sourcePath}/metadata`,
    });
  }

  const expectedGeoVersion = releaseIdentity === "1.1.0" ? "1.1.0" : "2.0.0";
  if (metadata.geoVersion !== expectedGeoVersion) {
    diagnostics.push(
      incompatibleMetadataDiagnostic(
        sourcePath,
        "geoVersion",
        `GeoParquet release ${releaseIdentity} requires embedded geo.version ${expectedGeoVersion}.`,
      ),
    );
  }

  if (releaseIdentity === "1.1.0") {
    const encodings = new Set([
      "WKB",
      "point",
      "linestring",
      "polygon",
      "multipoint",
      "multilinestring",
      "multipolygon",
    ]);
    if (typeof metadata.encoding !== "string" || !encodings.has(metadata.encoding)) {
      diagnostics.push(
        incompatibleMetadataDiagnostic(sourcePath, "encoding", "GeoParquet 1.1 encoding is unsupported."),
      );
    }
    if (!mixedVersionFields && hasLogicalType) {
      diagnostics.push(
        incompatibleMetadataDiagnostic(
          sourcePath,
          "logicalType",
          "Parquet GEOMETRY/GEOGRAPHY logical types are 2.0-only.",
        ),
      );
    }
    if (!mixedVersionFields && hasRowGroupStatistics) {
      diagnostics.push(
        incompatibleMetadataDiagnostic(
          sourcePath,
          "rowGroupStatistics",
          "Native row-group spatial statistics evidence belongs to the 2.0 RC boundary.",
        ),
      );
    }
  } else {
    if (metadata.encoding !== "WKB") {
      diagnostics.push(
        incompatibleMetadataDiagnostic(sourcePath, "encoding", "GeoParquet 2.0 RC removes 1.1 GeoArrow encodings."),
      );
    }
    if (metadata.logicalType !== "GEOMETRY" && metadata.logicalType !== "GEOGRAPHY") {
      diagnostics.push(
        incompatibleMetadataDiagnostic(
          sourcePath,
          "logicalType",
          "GeoParquet 2.0 RC requires GEOMETRY or GEOGRAPHY native Parquet logical-type evidence.",
        ),
      );
    }
    if (!hasGeoParquet20Rc1RowGroupStatistics(metadata.rowGroupStatistics)) {
      diagnostics.push(
        incompatibleMetadataDiagnostic(
          sourcePath,
          "rowGroupStatistics",
          "GeoParquet 2.0 RC requires bbox and geometryTypes row-group statistics evidence set to true.",
        ),
      );
    }
    if (!mixedVersionFields && hasCovering) {
      diagnostics.push(
        incompatibleMetadataDiagnostic(
          sourcePath,
          "covering",
          "GeoParquet 1.1 covering metadata is removed in 2.0 RC.",
        ),
      );
    }
  }

  if (metadata.crs !== undefined && metadata.crs !== null && !isGeoParquetProjJsonCrs(metadata.crs)) {
    diagnostics.push(
      incompatibleMetadataDiagnostic(sourcePath, "crs", "GeoParquet geo metadata CRS must be inline PROJJSON or null."),
    );
  }

  if (metadata.bbox !== undefined && !isGeoParquetBbox(metadata.bbox)) {
    diagnostics.push(
      incompatibleMetadataDiagnostic(
        sourcePath,
        "bbox",
        "GeoParquet bbox metadata must be a 4-, 6-, or 8-number dimensional extent.",
      ),
    );
  }

  return diagnostics;
}

function incompatibleMetadataDiagnostic(sourcePath: string, field: string, message: string): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.GeoParquetMetadataIncompatible,
    message,
    path: `${sourcePath}/metadata/${field}`,
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

/**
 * Validate GeoTIFF source metadata against policy.
 * Returns diagnostics without performing any IO.
 * Runtime loading/query remains blocked -- this validates metadata only.
 */
export function validateGeoTiffPolicy(
  source: GeoTiffSourceSpec,
  policy: GeoTiffPolicy = defaultGeoTiffPolicy,
  sourceId = "geotiff",
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const sourcePath = `/sources/${escapePathSegment(sourceId)}`;

  diagnostics.push({
    severity: "warning",
    code: DiagnosticCodes.CapabilityUnsupported,
    message:
      "GeoTIFF runtime loading, decoding, sampling, and query are not implemented. This is a metadata-only contract.",
    path: `${sourcePath}/runtime`,
  });

  if (!source.url || source.url.trim().length === 0) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SchemaInvalid,
      message: "GeoTIFF source URL must not be empty.",
      path: `${sourcePath}/url`,
    });
  }

  if (source.bbox) {
    const [w, s, e, n] = source.bbox;
    if (w < -180 || w > 180 || e < -180 || e > 180 || s < -90 || s > 90 || n < -90 || n > 90) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SchemaInvalid,
        message: "GeoTIFF bbox must be within [-180, -90, 180, 90].",
        path: `${sourcePath}/bbox`,
      });
    }
    if (w > e) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SchemaInvalid,
        message: "GeoTIFF bbox west must be <= east.",
        path: `${sourcePath}/bbox`,
      });
    }
    if (s > n) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SchemaInvalid,
        message: "GeoTIFF bbox south must be <= north.",
        path: `${sourcePath}/bbox`,
      });
    }
  }

  if (source.fileBytes !== undefined) {
    const maxBytes = policy.maxFileBytes ?? DEFAULT_MAX_GEOTIFF_FILE_BYTES;
    if (source.fileBytes > maxBytes) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SecurityUrlBlocked,
        message: `GeoTIFF file size ${source.fileBytes} exceeds policy limit ${maxBytes}.`,
        path: `${sourcePath}/fileBytes`,
      });
    }
  }

  if (source.width !== undefined && source.height !== undefined) {
    const pixelCount = source.width * source.height;
    const maxPixels = policy.maxPixels ?? DEFAULT_MAX_GEOTIFF_PIXELS;
    if (pixelCount > maxPixels) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SecurityResourceTooLarge,
        message: `GeoTIFF pixel count ${pixelCount} exceeds policy limit ${maxPixels}.`,
        path: `${sourcePath}/width`,
      });
    }
  }

  if (source.bandCount !== undefined) {
    const maxBandCount = policy.maxBandCount ?? DEFAULT_MAX_GEOTIFF_BAND_COUNT;
    if (source.bandCount > maxBandCount) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SecurityResourceTooLarge,
        message: `GeoTIFF band count ${source.bandCount} exceeds policy limit ${maxBandCount}.`,
        path: `${sourcePath}/bandCount`,
      });
    }
  }

  if (source.bandCount !== undefined && source.bands && source.bands.length !== source.bandCount) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SchemaInvalid,
      message: `GeoTIFF bands length ${source.bands.length} must match bandCount ${source.bandCount}.`,
      path: `${sourcePath}/bands`,
    });
  }

  if (source.bands) {
    const seenBandIndexes = new Set<number>();
    for (const [index, band] of source.bands.entries()) {
      const bandPath = `${sourcePath}/bands/${index}`;
      if (seenBandIndexes.has(band.index)) {
        diagnostics.push({
          severity: "error",
          code: DiagnosticCodes.SchemaInvalid,
          message: `GeoTIFF band index ${band.index} must be unique.`,
          path: `${bandPath}/index`,
        });
      }
      seenBandIndexes.add(band.index);

      if (source.bandCount !== undefined && band.index > source.bandCount) {
        diagnostics.push({
          severity: "error",
          code: DiagnosticCodes.SchemaInvalid,
          message: `GeoTIFF band index ${band.index} exceeds bandCount ${source.bandCount}.`,
          path: `${bandPath}/index`,
        });
      }

      if (policy.requireNoData && band.noData === undefined) {
        diagnostics.push({
          severity: "error",
          code: DiagnosticCodes.SchemaInvalid,
          message: "GeoTIFF noData metadata is required by policy for each declared band.",
          path: `${bandPath}/noData`,
        });
      }
    }
  }

  if (policy.requireCrs !== false && !source.crs?.authority && !source.crs?.code && !source.crs?.wkt) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SchemaInvalid,
      message: "GeoTIFF CRS metadata is required by policy.",
      path: `${sourcePath}/crs`,
    });
  }

  if (source.crs?.authority && source.crs?.code && source.crs.authority.toUpperCase() !== "EPSG") {
    diagnostics.push({
      severity: "warning",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: `GeoTIFF CRS authority "${source.crs.authority}" may not be supported. EPSG is recommended.`,
      path: `${sourcePath}/crs/authority`,
    });
  }

  return diagnostics;
}

/**
 * Validate FlatGeobuf source metadata against policy.
 * Returns diagnostics without performing any IO.
 */
export function validateFlatGeobufPolicy(
  source: FlatGeobufSourceSpec,
  policy: FlatGeobufPolicy = defaultFlatGeobufPolicy,
  sourceId = "flatgeobuf",
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const sourcePath = `/sources/${escapePathSegment(sourceId)}`;

  // Runtime is always blocked
  diagnostics.push({
    severity: "warning",
    code: DiagnosticCodes.CapabilityUnsupported,
    message: "FlatGeobuf runtime loading and query are not implemented. This is a metadata-only contract.",
    path: `${sourcePath}/runtime`,
  });

  if (!source.url || source.url.trim().length === 0) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SchemaInvalid,
      message: "FlatGeobuf source URL must not be empty.",
      path: `${sourcePath}/url`,
    });
  }

  if (source.fileBytes !== undefined) {
    const maxBytes = policy.maxFileBytes ?? DEFAULT_MAX_FLATGEOBUF_FILE_BYTES;
    if (source.fileBytes > maxBytes) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SecurityUrlBlocked,
        message: `FlatGeobuf file size ${source.fileBytes} exceeds policy limit ${maxBytes}.`,
        path: `${sourcePath}/fileBytes`,
      });
    }
  }

  if (policy.indexRequired && source.hasIndex === false) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: "FlatGeobuf spatial index is required by policy but not present.",
      path: `${sourcePath}/hasIndex`,
    });
  }

  if (source.bbox) {
    const [w, s, e, n] = source.bbox;
    if (w < -180 || w > 180 || e < -180 || e > 180 || s < -90 || s > 90 || n < -90 || n > 90) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SchemaInvalid,
        message: "FlatGeobuf bbox must be within [-180, -90, 180, 90].",
        path: `${sourcePath}/bbox`,
      });
    }
  }

  return diagnostics;
}
