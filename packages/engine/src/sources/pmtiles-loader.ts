/**
 * PMTiles runtime capability boundary.
 *
 * The exported loader class is retained as a compatibility shell, but runtime
 * archive IO and feature query fail closed until spec-complete parsing and
 * resource controls have passed a separate promotion gate.
 */

import { DiagnosticCodes } from "../diagnostics/codes.js";
import { escapePathSegment } from "../spec/patch/path.js";
import type { Diagnostic, JsonValue, MapSpec, PmtilesSourceSpec } from "../types.js";

type Bbox = [number, number, number, number];

export const PMTilesRuntimeBlockerCodes = {
  ArchiveLoad: DiagnosticCodes.PMTilesRuntimeArchiveLoadBlocked,
  FeatureQuery: DiagnosticCodes.PMTilesRuntimeFeatureQueryBlocked,
} as const;

export const PMTilesLoadGateIds = [
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
] as const;

export const PMTilesFeatureQueryGateIds = [
  "query-semantics",
  "query-diagnostics",
  "adapter-boundary",
  "payload-free-evidence",
  "query-tests",
  "docs",
] as const;

export const PMTILES_CAPABILITY_DECISION = {
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
  loadGates: PMTilesLoadGateIds,
  featureQueryGates: PMTilesFeatureQueryGateIds,
} as const;

export type PMTilesCapabilityDecision = typeof PMTILES_CAPABILITY_DECISION;
export type PMTilesLoaderStatus = "idle" | "header-loaded" | "directory-loaded" | "ready" | "blocked" | "error";

export interface PMTilesFetchRangeRequest {
  url: string;
  offset: number;
  length: number;
  signal?: AbortSignal;
}

export interface PMTilesFetchRangeResponse {
  data: ArrayBuffer;
  status: number;
}

export type PMTilesFetchRange = (request: PMTilesFetchRangeRequest) => Promise<PMTilesFetchRangeResponse>;

export interface PMTilesDecodedFeature {
  id?: string | number;
  sourceLayer: string;
  geometry: PMTilesDecodedGeometry;
  properties: Record<string, JsonValue>;
}

export interface PMTilesDecodedGeometry {
  type: string;
  coordinates: unknown;
  bbox?: Bbox;
}

export interface PMTilesDecodeTileInput {
  data: ArrayBuffer;
  sourceLayerFilter?: string[];
}

export type PMTilesDecodeTile = (input: PMTilesDecodeTileInput) => PMTilesDecodedFeature[];

export interface PMTilesRuntimeLoaderOptions {
  sourceId: string;
  url: string;
  fetchRange: PMTilesFetchRange;
  decodeTile: PMTilesDecodeTile;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxDirectoryEntries?: number;
}

export interface PMTilesHeader {
  specVersion: number;
  rootDirectoryOffset: number;
  rootDirectoryLength: number;
  metadataOffset: number;
  metadataLength: number;
  leafDirectoriesOffset: number;
  leafDirectoriesLength: number;
  tileDataOffset: number;
  tileDataLength: number;
  addressedTilesCount: number;
  tileEntriesCount: number;
  tileContentsCount: number;
  clustered: boolean;
  internalCompression: number;
  tileCompression: number;
  tileType: number;
}

export interface PMTilesDirectoryEntry {
  tileId: bigint;
  offset: bigint;
  length: number;
  runLength: number;
}

export interface PMTilesLoaderQueryOptions {
  point?: [number, number];
  bbox?: Bbox;
  sourceLayers?: string[];
  maxFeatures?: number;
  zoom?: number;
}

export interface PMTilesLoaderQueryResult {
  features: PMTilesDecodedFeature[];
  truncated: boolean;
  tilesFetched: number;
  elapsedMs: number;
  diagnostics: Diagnostic[];
}

export interface PMTilesLoaderSnapshot {
  status: PMTilesLoaderStatus;
  header?: PMTilesHeader;
  directoryEntryCount: number;
  sourceId: string;
  url: string;
}

export class PMTilesRuntimeBlockedError extends Error {
  readonly code = PMTilesRuntimeBlockerCodes.ArchiveLoad;
  readonly path: string;

  constructor(sourceId: string) {
    super("PMTiles runtime archive loading is blocked by the current capability decision.");
    this.name = "PMTilesRuntimeBlockedError";
    this.path = `/sources/${escapePathSegment(sourceId)}/runtime`;
  }
}

/**
 * Compatibility shell for the previously exported experimental loader.
 * Calls intentionally perform no range IO or decoding while the runtime gate
 * is No-go.
 */
export class PMTilesRuntimeLoader {
  readonly sourceId: string;
  readonly url: string;

  constructor(options: PMTilesRuntimeLoaderOptions) {
    this.sourceId = options.sourceId;
    this.url = options.url;
  }

  getSnapshot(): PMTilesLoaderSnapshot {
    return {
      status: "blocked",
      directoryEntryCount: 0,
      sourceId: this.sourceId,
      url: this.url,
    };
  }

  async loadHeader(): Promise<void> {
    throw new PMTilesRuntimeBlockedError(this.sourceId);
  }

  async loadDirectory(): Promise<void> {
    throw new PMTilesRuntimeBlockedError(this.sourceId);
  }

  async initialize(): Promise<void> {
    throw new PMTilesRuntimeBlockedError(this.sourceId);
  }

  async query(_options: PMTilesLoaderQueryOptions = {}): Promise<PMTilesLoaderQueryResult> {
    return {
      features: [],
      truncated: false,
      tilesFetched: 0,
      elapsedMs: 0,
      diagnostics: [featureQueryBlockedDiagnostic(this.sourceId)],
    };
  }
}

export interface PMTilesRuntimeLoaderReadiness {
  sourceId: string;
  queryReady: boolean;
  status: PMTilesLoaderStatus;
  headerLoaded: boolean;
  directoryLoaded: boolean;
  diagnostics: Diagnostic[];
}

export function assessPMTilesRuntimeLoaderReadiness(
  spec: MapSpec,
  loader: PMTilesRuntimeLoader,
): PMTilesRuntimeLoaderReadiness {
  const source = spec.sources[loader.sourceId] as PmtilesSourceSpec | undefined;
  const diagnostics: Diagnostic[] = [];

  if (source?.type !== "pmtiles") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: `PMTiles runtime loader source "${loader.sourceId}" is not a pmtiles source in the MapSpec.`,
      path: `/sources/${escapePathSegment(loader.sourceId)}/type`,
      relatedResources: [{ kind: "source", id: loader.sourceId }],
    });
  }

  diagnostics.push(archiveLoadBlockedDiagnostic(loader.sourceId), featureQueryBlockedDiagnostic(loader.sourceId));

  return {
    sourceId: loader.sourceId,
    queryReady: false,
    status: "blocked",
    headerLoaded: false,
    directoryLoaded: false,
    diagnostics,
  };
}

function archiveLoadBlockedDiagnostic(sourceId: string): Diagnostic {
  return {
    severity: "error",
    code: PMTilesRuntimeBlockerCodes.ArchiveLoad,
    message:
      "PMTiles runtime archive loading is blocked until spec-complete metadata, columnar directory, compression, leaf-directory, cancellation, budget, cache, and resource-policy evidence is accepted.",
    path: `/sources/${escapePathSegment(sourceId)}/runtime`,
    relatedResources: [{ kind: "source", id: sourceId }],
  };
}

function featureQueryBlockedDiagnostic(sourceId: string): Diagnostic {
  return {
    severity: "error",
    code: PMTilesRuntimeBlockerCodes.FeatureQuery,
    message: "PMTiles runtime feature query is blocked while runtime archive loading remains No-go.",
    path: `/sources/${escapePathSegment(sourceId)}/query`,
    relatedResources: [{ kind: "source", id: sourceId }],
  };
}
