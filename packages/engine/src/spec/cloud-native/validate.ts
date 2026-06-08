import { DiagnosticCodes } from "../../diagnostics/codes.js";
import type { Diagnostic } from "../../types.js";
import { escapePathSegment } from "../patch/path.js";
import type { FlatGeobufPolicy, FlatGeobufSourceSpec } from "./flatgeobuf-source.js";
import { defaultFlatGeobufPolicy } from "./flatgeobuf-source.js";
import type { GeoParquetPolicy, GeoParquetSourceSpec } from "./geoparquet-source.js";
import { defaultGeoParquetPolicy } from "./geoparquet-source.js";
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
