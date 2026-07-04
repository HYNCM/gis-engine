/**
 * GeoParquet WASM Runtime Stub
 *
 * Provides a minimal viable interface for GeoParquet parsing via WASM.
 * This is a stub/spike implementation — actual WASM module loading and
 * Parquet decoding are not implemented. The module defines the contract
 * that a future WASM-based GeoParquet parser must satisfy.
 *
 * Architecture:
 * - Caller supplies raw Parquet bytes (via fetch or file read)
 * - WASM module decodes Parquet column chunks and geometry columns
 * - Output is a GeoJSON FeatureCollection subset
 * - Spatial queries (point/bbox) operate on decoded features
 *
 * @module sources/geoparquet-wasm
 */

import { DiagnosticCodes } from "../diagnostics/codes.js";
import { escapePathSegment } from "../spec/patch/path.js";
import type { Diagnostic, GeoParquetSourceSpec, JsonValue, MapSpec } from "../types.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Bbox = [number, number, number, number];

export type GeoParquetWasmStatus = "stub" | "wasm-unavailable" | "ready" | "error";

export type GeoParquetGeometryEncoding =
  | "WKB"
  | "WKT"
  | "geoarrow-point"
  | "geoarrow-linestring"
  | "geoarrow-polygon"
  | "geoarrow-multipoint"
  | "geoarrow-multilinestring"
  | "geoarrow-multipolygon";

export interface GeoParquetWasmModule {
  /** Parse raw Parquet bytes and return metadata + feature count. */
  parseMetadata(buffer: ArrayBuffer): GeoParquetMetadata;
  /** Decode a row range into GeoJSON-like features. */
  decodeRows(buffer: ArrayBuffer, offset: number, count: number): GeoParquetDecodedRow[];
}

export interface GeoParquetMetadata {
  rowCount: number;
  columnCount: number;
  columns: GeoParquetColumnInfo[];
  geometryColumn: string;
  encoding: GeoParquetGeometryEncoding;
  crs: { authority: string; code: string } | null;
  bbox: Bbox | null;
  parquetVersion: 1 | 2;
}

export interface GeoParquetColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isGeometry: boolean;
}

export interface GeoParquetDecodedRow {
  geometry: {
    type: string;
    coordinates: unknown;
  };
  properties: Record<string, JsonValue>;
}

export interface GeoParquetWasmLoaderOptions {
  sourceId: string;
  source: GeoParquetSourceSpec;
  /** Caller-supplied WASM module factory (ownership inversion). */
  wasmModuleFactory?: () => Promise<GeoParquetWasmModule>;
  /** Caller-supplied byte fetcher. */
  fetchBytes?: (url: string, range?: { offset: number; length: number }) => Promise<ArrayBuffer>;
}

export interface GeoParquetWasmReadinessReport {
  status: GeoParquetWasmStatus;
  sourceId: string;
  metadata: GeoParquetMetadata | null;
  featureCount: number;
  queryReady: boolean;
  diagnostics: Diagnostic[];
  requirements: {
    wasmModule: boolean;
    fetchBytes: boolean;
    fullArchiveDownload: boolean;
    worker: false;
  };
}

// ---------------------------------------------------------------------------
// Stub loader
// ---------------------------------------------------------------------------

export class GeoParquetWasmLoader {
  readonly sourceId: string;
  readonly source: GeoParquetSourceSpec;

  private readonly wasmModuleFactory?: () => Promise<GeoParquetWasmModule>;
  private readonly fetchBytes?: (url: string, range?: { offset: number; length: number }) => Promise<ArrayBuffer>;
  private status: GeoParquetWasmStatus = "stub";
  private metadata: GeoParquetMetadata | null = null;

  constructor(options: GeoParquetWasmLoaderOptions) {
    this.sourceId = options.sourceId;
    this.source = options.source;
    if (options.wasmModuleFactory) this.wasmModuleFactory = options.wasmModuleFactory;
    if (options.fetchBytes) this.fetchBytes = options.fetchBytes;
  }

  getStatus(): GeoParquetWasmStatus {
    return this.status;
  }

  getMetadata(): GeoParquetMetadata | null {
    return this.metadata;
  }

  /**
   * Assess whether this loader can provide runtime GeoParquet parsing.
   * Currently returns stub status since WASM module is not yet implemented.
   */
  async assessReadiness(): Promise<GeoParquetWasmReadinessReport> {
    const diagnostics: Diagnostic[] = [];
    const sourcePath = `/sources/${escapePathSegment(this.sourceId)}`;

    if (!this.wasmModuleFactory) {
      diagnostics.push({
        severity: "info",
        code: DiagnosticCodes.CapabilityUnsupported,
        message: "GeoParquet WASM module factory not provided; runtime parsing is unavailable.",
        path: `${sourcePath}/wasm`,
        relatedResources: [{ kind: "source", id: this.sourceId }],
      });
      this.status = "stub";
    } else if (!this.fetchBytes) {
      diagnostics.push({
        severity: "info",
        code: DiagnosticCodes.CapabilityUnsupported,
        message: "GeoParquet byte fetcher not provided; runtime data loading is unavailable.",
        path: `${sourcePath}/fetch`,
        relatedResources: [{ kind: "source", id: this.sourceId }],
      });
      this.status = "stub";
    } else {
      // Future: attempt WASM module instantiation and Parquet metadata parse
      diagnostics.push({
        severity: "info",
        code: DiagnosticCodes.CapabilityUnsupported,
        message: "GeoParquet WASM runtime is a stub; actual Parquet decoding is not yet implemented.",
        path: sourcePath,
        relatedResources: [{ kind: "source", id: this.sourceId }],
      });
      this.status = "stub";
    }

    return {
      status: this.status,
      sourceId: this.sourceId,
      metadata: this.metadata,
      featureCount: this.metadata?.rowCount ?? this.source.rowCount ?? 0,
      queryReady: false,
      diagnostics,
      requirements: {
        wasmModule: Boolean(this.wasmModuleFactory),
        fetchBytes: Boolean(this.fetchBytes),
        fullArchiveDownload: true,
        worker: false,
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Readiness integration
// ---------------------------------------------------------------------------

export function assessGeoParquetWasmReadiness(
  spec: MapSpec,
  loader: GeoParquetWasmLoader,
): GeoParquetWasmReadinessReport {
  const diagnostics: Diagnostic[] = [];
  const source = spec.sources[loader.sourceId] as GeoParquetSourceSpec | undefined;

  if (!source || source.type !== "geoparquet") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: `GeoParquet WASM loader source "${loader.sourceId}" is not a geoparquet source in the MapSpec.`,
      path: `/sources/${escapePathSegment(loader.sourceId)}/type`,
      relatedResources: [{ kind: "source", id: loader.sourceId }],
    });
  }

  return {
    status: loader.getStatus(),
    sourceId: loader.sourceId,
    metadata: loader.getMetadata(),
    featureCount: loader.getMetadata()?.rowCount ?? source?.rowCount ?? 0,
    queryReady: false,
    diagnostics,
    requirements: {
      wasmModule: false,
      fetchBytes: false,
      fullArchiveDownload: true,
      worker: false,
    },
  };
}
