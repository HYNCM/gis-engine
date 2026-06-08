import { DiagnosticCodes } from "../../diagnostics/codes.js";
import type { Diagnostic } from "../../types.js";
import { escapePathSegment } from "../patch/path.js";
import type { FlatGeobufPolicy, FlatGeobufSourceSpec } from "./flatgeobuf-source.js";
import { defaultFlatGeobufPolicy } from "./flatgeobuf-source.js";
import type { GeoParquetPolicy, GeoParquetSourceSpec } from "./geoparquet-source.js";
import { defaultGeoParquetPolicy } from "./geoparquet-source.js";
import type { PMTilesArchiveMetadata, PMTilesArchivePolicy } from "./pmtiles-archive.js";
import { defaultPMTilesArchivePolicy } from "./pmtiles-archive.js";

const DEFAULT_MAX_PMTILES_ARCHIVE_BYTES = 524_288_000;
const DEFAULT_MAX_PMTILES_ROOT_DIRECTORY_BYTES = 16_777_216;
const DEFAULT_MAX_GEOPARQUET_FILE_BYTES = 1_073_741_824;
const DEFAULT_MAX_GEOPARQUET_ROW_COUNT = 10_000_000;
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
  source: GeoParquetSourceSpec,
  policy: GeoParquetPolicy = defaultGeoParquetPolicy,
  sourceId = "geoparquet",
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const sourcePath = `/sources/${escapePathSegment(sourceId)}`;

  // Runtime is always blocked -- this is a metadata-only contract
  diagnostics.push({
    severity: "warning",
    code: DiagnosticCodes.CapabilityUnsupported,
    message: "GeoParquet runtime loading and query are not implemented. This is a metadata-only contract.",
    path: `${sourcePath}/runtime`,
  });

  if (!source.url || source.url.trim().length === 0) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SchemaInvalid,
      message: "GeoParquet source URL must not be empty.",
      path: `${sourcePath}/url`,
    });
  }

  if (source.bbox) {
    const [w, s, e, n] = source.bbox;
    if (w < -180 || w > 180 || e < -180 || e > 180 || s < -90 || s > 90 || n < -90 || n > 90) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SchemaInvalid,
        message: "GeoParquet bbox must be within [-180, -90, 180, 90].",
        path: `${sourcePath}/bbox`,
      });
    }
    if (w > e) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SchemaInvalid,
        message: "GeoParquet bbox west must be <= east.",
        path: `${sourcePath}/bbox`,
      });
    }
    if (s > n) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SchemaInvalid,
        message: "GeoParquet bbox south must be <= north.",
        path: `${sourcePath}/bbox`,
      });
    }
  }

  if (source.fileBytes !== undefined) {
    const maxBytes = policy.maxFileBytes ?? DEFAULT_MAX_GEOPARQUET_FILE_BYTES;
    if (source.fileBytes > maxBytes) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SecurityUrlBlocked,
        message: `GeoParquet file size ${source.fileBytes} exceeds policy limit ${maxBytes}.`,
        path: `${sourcePath}/fileBytes`,
      });
    }
  }

  if (source.rowCount !== undefined) {
    const maxRows = policy.maxRowCount ?? DEFAULT_MAX_GEOPARQUET_ROW_COUNT;
    if (source.rowCount > maxRows) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SecurityUrlBlocked,
        message: `GeoParquet row count ${source.rowCount} exceeds policy limit ${maxRows}.`,
        path: `${sourcePath}/rowCount`,
      });
    }
  }

  // CRS validation
  if (source.crs?.authority && source.crs?.code) {
    if (source.crs.authority.toUpperCase() !== "EPSG") {
      diagnostics.push({
        severity: "warning",
        code: DiagnosticCodes.CapabilityUnsupported,
        message: `GeoParquet CRS authority "${source.crs.authority}" may not be supported. EPSG is recommended.`,
        path: `${sourcePath}/crs/authority`,
      });
    }
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
