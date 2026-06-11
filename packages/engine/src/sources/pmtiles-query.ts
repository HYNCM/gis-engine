import { DiagnosticCodes } from "../diagnostics/codes.js";
import { manualFix } from "../internal/shared.js";
import { escapePathSegment } from "../spec/patch/path.js";
import type { Diagnostic, JsonValue, LayerSpec, MapSpec, SourceSpec } from "../types.js";

type Bbox = [number, number, number, number];

export type PMTilesQueryEvidenceStatus = "ready" | "empty" | "blocked";
export type PMTilesQueryOperation = "point" | "bbox";

export interface PMTilesQueryLoaderContract {
  resourceAccess: "caller-owned";
  cancellation: "caller-owned";
  timeoutMs: number;
  byteBudgetBytes: number;
}

export interface PMTilesQueryEvidenceCaseLoaderInput {
  archive?: "unsupported";
  responseBytes?: number;
  elapsedMs?: number;
  worker?: "denied";
}

export interface PMTilesQueryFixtureFeature {
  id?: string | number;
  sourceLayer: string;
  bbox?: Bbox;
  geometry?: unknown;
  properties?: Record<string, JsonValue>;
}

export interface PMTilesQueryEvidenceCaseInput {
  id: string;
  layers?: string[];
  point?: [number, number];
  bbox?: Bbox;
  resultLimit?: number;
  loader?: PMTilesQueryEvidenceCaseLoaderInput;
}

export interface CreatePMTilesQueryEvidenceOptions {
  sourceId: string;
  features: PMTilesQueryFixtureFeature[];
  cases: PMTilesQueryEvidenceCaseInput[];
  resultLimit?: number;
  loaderContract?: {
    timeoutMs?: number;
    byteBudgetBytes?: number;
  };
}

export interface PMTilesQueryEvidenceCase {
  id: string;
  status: PMTilesQueryEvidenceStatus;
  operation: PMTilesQueryOperation;
  layerIds: string[];
  sourceLayerIds: string[];
  matchCount: number;
  returnedFeatureCount: number;
  resultLimit: number;
  resultTruncated: boolean;
  fixtureDigest: string;
  diagnostics: Diagnostic[];
  diagnosticCounts: DiagnosticCounts;
}

export interface PMTilesQueryEvidence {
  status: PMTilesQueryEvidenceStatus;
  sourceId: string;
  sourceLayerIds: string[];
  layerIds: string[];
  loaderContract: PMTilesQueryLoaderContract;
  fixtureFeatureCount: number;
  fixtureDigest: string;
  cases: PMTilesQueryEvidenceCase[];
  diagnostics: Diagnostic[];
  diagnosticCounts: DiagnosticCounts;
  requirements: {
    callerSuppliedDecodedFeatures: true;
    archiveParsing: false;
    hiddenFetch: false;
    rangeRequests: false;
    worker: false;
    featurePayloadReturned: false;
  };
  summary: {
    caseCount: number;
    readyCaseCount: number;
    emptyCaseCount: number;
    blockedCaseCount: number;
    matchedFeatureCount: number;
    returnedFeatureCount: number;
    resultTruncated: boolean;
  };
}

interface DiagnosticCounts {
  error: number;
  warning: number;
  info: number;
}

interface IndexedFixtureFeature {
  key: string;
  sourceLayer: string;
  bbox: Bbox;
}

interface LayerEntry {
  layer: LayerSpec;
  index: number;
}

interface NormalizedQuery {
  operation: PMTilesQueryOperation;
  point?: [number, number];
  bbox?: Bbox;
  diagnostics: Diagnostic[];
  valid: boolean;
}

const geometryTypes = new Set([
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
  "GeometryCollection",
]);

const defaultResultLimit = 100;
const defaultLoaderTimeoutMs = 30_000;
const defaultLoaderByteBudgetBytes = 1_048_576;

export function createPMTilesQueryEvidence(
  spec: MapSpec,
  options: CreatePMTilesQueryEvidenceOptions,
): PMTilesQueryEvidence {
  const diagnostics: Diagnostic[] = [];
  const sourcePath = `/sources/${escapePathSegment(options.sourceId)}`;
  const source = spec.sources[options.sourceId];
  if (!source) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SourceNotFound,
      message: `PMTiles query evidence source "${options.sourceId}" does not exist.`,
      path: sourcePath,
      relatedResources: [{ kind: "source", id: options.sourceId, path: sourcePath }],
      fix: manualFix("Add the PMTiles source before generating fixture query evidence.", "high"),
    });
  } else if (source.type !== "pmtiles") {
    diagnostics.push(unsupportedSourceDiagnostic(options.sourceId, source, sourcePath));
  }

  const fixtureDiagnostics: Diagnostic[] = [];
  const indexedFeatures = indexFixtureFeatures(options.features, fixtureDiagnostics);
  diagnostics.push(...fixtureDiagnostics);
  if (options.cases.length === 0) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: "PMTiles fixture query evidence requires at least one point or bbox case.",
      path: "/pmtilesQuery/cases",
      relatedResources: [{ kind: "source", id: options.sourceId }],
      fix: manualFix("Provide at least one deterministic point or bbox query case.", "high"),
    });
  }

  const loaderContract = resolveLoaderContract(options.loaderContract);
  const cases = options.cases.map((queryCase, caseIndex) =>
    evaluateQueryCase(spec, options, loaderContract, queryCase, caseIndex, source, indexedFeatures, diagnostics),
  );

  const allDiagnostics = [...diagnostics, ...cases.flatMap((queryCase) => queryCase.diagnostics)];
  const blockedCaseCount = cases.filter((queryCase) => queryCase.status === "blocked").length;
  const readyCaseCount = cases.filter((queryCase) => queryCase.status === "ready").length;
  const emptyCaseCount = cases.filter((queryCase) => queryCase.status === "empty").length;
  const fixtureDigest = digestStableValue({
    sourceId: options.sourceId,
    features: indexedFeatures.map((feature) => ({
      key: feature.key,
      sourceLayer: feature.sourceLayer,
      bbox: feature.bbox,
    })),
  });

  return {
    status:
      blockedCaseCount > 0 || diagnostics.some((diagnostic) => diagnostic.severity === "error")
        ? "blocked"
        : readyCaseCount > 0
          ? "ready"
          : "empty",
    sourceId: options.sourceId,
    sourceLayerIds: unique(cases.flatMap((queryCase) => queryCase.sourceLayerIds)),
    layerIds: unique(cases.flatMap((queryCase) => queryCase.layerIds)),
    loaderContract,
    fixtureFeatureCount: indexedFeatures.length,
    fixtureDigest,
    cases,
    diagnostics: allDiagnostics,
    diagnosticCounts: countDiagnostics(allDiagnostics),
    requirements: {
      callerSuppliedDecodedFeatures: true,
      archiveParsing: false,
      hiddenFetch: false,
      rangeRequests: false,
      worker: false,
      featurePayloadReturned: false,
    },
    summary: {
      caseCount: cases.length,
      readyCaseCount,
      emptyCaseCount,
      blockedCaseCount,
      matchedFeatureCount: cases.reduce((total, queryCase) => total + queryCase.matchCount, 0),
      returnedFeatureCount: cases.reduce((total, queryCase) => total + queryCase.returnedFeatureCount, 0),
      resultTruncated: cases.some((queryCase) => queryCase.resultTruncated),
    },
  };
}

function evaluateQueryCase(
  spec: MapSpec,
  options: CreatePMTilesQueryEvidenceOptions,
  loaderContract: PMTilesQueryLoaderContract,
  queryCase: PMTilesQueryEvidenceCaseInput,
  caseIndex: number,
  source: SourceSpec | undefined,
  indexedFeatures: IndexedFixtureFeature[],
  sourceDiagnostics: Diagnostic[],
): PMTilesQueryEvidenceCase {
  const diagnostics: Diagnostic[] = [];
  const query = normalizeQuery(queryCase, caseIndex);
  diagnostics.push(...query.diagnostics);
  if (sourceDiagnostics.some((diagnostic) => diagnostic.severity === "error")) diagnostics.push(...sourceDiagnostics);

  const layers = selectLayers(spec, options.sourceId, queryCase, caseIndex, diagnostics);
  const layerValidation = validateQueryableLayers(spec, options.sourceId, layers, diagnostics);
  const resultLimit = queryCase.resultLimit ?? options.resultLimit ?? defaultResultLimit;
  const layerIds = unique(layers.map(({ layer }) => layer.id));
  const sourceLayerIds = unique(layerValidation.sourceLayerIds);
  const loaderDiagnostics = validateQueryLoader(queryCase, caseIndex, loaderContract);
  diagnostics.push(...loaderDiagnostics);

  if (!query.valid || diagnostics.some((diagnostic) => diagnostic.severity === "error") || source?.type !== "pmtiles") {
    return createCaseEvidence(
      queryCase.id,
      "blocked",
      query.operation,
      layerIds,
      sourceLayerIds,
      resultLimit,
      [],
      diagnostics,
    );
  }

  const matches: IndexedFixtureFeature[] = [];
  const seenFeatures = new Set<string>();
  for (const feature of indexedFeatures) {
    if (!sourceLayerIds.includes(feature.sourceLayer)) continue;
    if (!matchesQuery(feature.bbox, query)) continue;
    const dedupeKey = `${feature.sourceLayer}:${feature.key}`;
    if (seenFeatures.has(dedupeKey)) continue;
    seenFeatures.add(dedupeKey);
    matches.push(feature);
  }

  if (matches.length === 0) {
    diagnostics.push({
      severity: "info",
      code: DiagnosticCodes.QueryEmptyResult,
      message: `PMTiles fixture query case "${queryCase.id}" matched zero caller-supplied decoded features.`,
      path: `/pmtilesQuery/cases/${caseIndex}`,
      relatedResources: [{ kind: "source", id: options.sourceId }],
    });
  }

  return createCaseEvidence(
    queryCase.id,
    matches.length === 0 ? "empty" : "ready",
    query.operation,
    layerIds,
    sourceLayerIds,
    resultLimit,
    matches,
    diagnostics,
  );
}

function resolveLoaderContract(
  loaderContract?: CreatePMTilesQueryEvidenceOptions["loaderContract"],
): PMTilesQueryLoaderContract {
  return {
    resourceAccess: "caller-owned",
    cancellation: "caller-owned",
    timeoutMs: resolvePositiveInteger(loaderContract?.timeoutMs, defaultLoaderTimeoutMs),
    byteBudgetBytes: resolvePositiveInteger(loaderContract?.byteBudgetBytes, defaultLoaderByteBudgetBytes),
  };
}

function validateQueryLoader(
  queryCase: PMTilesQueryEvidenceCaseInput,
  caseIndex: number,
  loaderContract: PMTilesQueryLoaderContract,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const loader = queryCase.loader;
  if (!loader) return diagnostics;

  if (loader.archive === "unsupported") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: `PMTiles query loader for case "${queryCase.id}" cannot open unsupported archives.`,
      path: `/pmtilesQuery/cases/${caseIndex}/loader/archive`,
      fix: manualFix("Keep runtime PMTiles query loader work behind a future parser/adapter promotion gate.", "high"),
    });
  }

  if (isFinitePositive(loader.responseBytes) && loader.responseBytes > loaderContract.byteBudgetBytes) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SecurityResourceTooLarge,
      message: `PMTiles query loader response for case "${queryCase.id}" is ${loader.responseBytes} bytes, exceeding byteBudgetBytes=${loaderContract.byteBudgetBytes}.`,
      path: `/pmtilesQuery/cases/${caseIndex}/loader/responseBytes`,
      fix: manualFix("Reduce the loader response or raise the byte budget only after a review gate.", "medium"),
    });
  }

  if (isFinitePositive(loader.elapsedMs) && loader.elapsedMs > loaderContract.timeoutMs) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.SecurityResourceTimeout,
      message: `PMTiles query loader for case "${queryCase.id}" took ${loader.elapsedMs}ms, exceeding timeoutMs=${loaderContract.timeoutMs}.`,
      path: `/pmtilesQuery/cases/${caseIndex}/loader/elapsedMs`,
      fix: manualFix("Reduce loader work or increase the timeout only through an explicit contract update.", "medium"),
    });
  }

  if (loader.worker === "denied") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: `PMTiles query loader for case "${queryCase.id}" requires a worker, but the current contract denies worker use.`,
      path: `/pmtilesQuery/cases/${caseIndex}/loader/worker`,
      fix: manualFix(
        "Keep PMTiles runtime query evidence on caller-owned decoding until a worker contract is approved.",
        "high",
      ),
    });
  }

  return diagnostics;
}

function createCaseEvidence(
  id: string,
  status: PMTilesQueryEvidenceStatus,
  operation: PMTilesQueryOperation,
  layerIds: string[],
  sourceLayerIds: string[],
  resultLimit: number,
  matches: IndexedFixtureFeature[],
  diagnostics: Diagnostic[],
): PMTilesQueryEvidenceCase {
  return {
    id,
    status,
    operation,
    layerIds,
    sourceLayerIds,
    matchCount: matches.length,
    returnedFeatureCount: Math.min(matches.length, resultLimit),
    resultLimit,
    resultTruncated: matches.length > resultLimit,
    fixtureDigest: digestStableValue(
      matches.map((feature) => ({ key: feature.key, sourceLayer: feature.sourceLayer })),
    ),
    diagnostics,
    diagnosticCounts: countDiagnostics(diagnostics),
  };
}

function normalizeQuery(queryCase: PMTilesQueryEvidenceCaseInput, caseIndex: number): NormalizedQuery {
  const diagnostics: Diagnostic[] = [];
  const hasPoint = queryCase.point !== undefined;
  const hasBbox = queryCase.bbox !== undefined;
  const operation: PMTilesQueryOperation = hasPoint ? "point" : "bbox";

  if (hasPoint && !isPoint(queryCase.point)) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.GeoInvalidCoordinates,
      message: "PMTiles fixture query point must be a finite [x, y] coordinate.",
      path: `/pmtilesQuery/cases/${caseIndex}/point`,
      fix: manualFix("Pass point as [longitude, latitude] in the fixture coordinate space.", "medium"),
    });
  }

  if (hasBbox && !isBbox(queryCase.bbox)) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.GeoEmptyBbox,
      message:
        "PMTiles fixture query bbox must be a finite [minX, minY, maxX, maxY] extent where min values do not exceed max values.",
      path: `/pmtilesQuery/cases/${caseIndex}/bbox`,
      fix: manualFix("Pass bbox in the fixture coordinate space.", "medium"),
    });
  }

  if (!hasPoint && !hasBbox) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: "PMTiles fixture query evidence requires either point or bbox.",
      path: `/pmtilesQuery/cases/${caseIndex}`,
      fix: manualFix("Provide a point or bbox query case.", "high"),
    });
  }

  return {
    operation,
    ...(isPoint(queryCase.point) ? { point: queryCase.point } : {}),
    ...(isBbox(queryCase.bbox) ? { bbox: queryCase.bbox } : {}),
    diagnostics,
    valid: !diagnostics.some((diagnostic) => diagnostic.severity === "error"),
  };
}

function resolvePositiveInteger(value: number | undefined, fallback: number): number {
  return isFinitePositive(value) ? Math.trunc(value) : fallback;
}

function isFinitePositive(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function selectLayers(
  spec: MapSpec,
  sourceId: string,
  queryCase: PMTilesQueryEvidenceCaseInput,
  caseIndex: number,
  diagnostics: Diagnostic[],
): LayerEntry[] {
  if (!queryCase.layers) {
    const sourceLayers = spec.layers
      .map((layer, index) => ({ layer, index }))
      .filter(({ layer }) => layer.source === sourceId);
    if (sourceLayers.length === 0) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.LayerSourceMissing,
        message: `No layers reference PMTiles source "${sourceId}" for fixture query evidence.`,
        path: `/sources/${escapePathSegment(sourceId)}`,
        relatedResources: [{ kind: "source", id: sourceId }],
        fix: manualFix('Add a visible layer with metadata["source-layer"] for this PMTiles source.', "high"),
      });
    }
    return sourceLayers;
  }

  const layers: LayerEntry[] = [];
  const seenLayerIds = new Set<string>();
  for (const [layerIndex, layerId] of queryCase.layers.entries()) {
    if (seenLayerIds.has(layerId)) continue;
    seenLayerIds.add(layerId);
    const index = spec.layers.findIndex((layer) => layer.id === layerId);
    if (index < 0) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.LayerNotFound,
        message: `Layer "${layerId}" does not exist for PMTiles fixture query case "${queryCase.id}".`,
        path: `/pmtilesQuery/cases/${caseIndex}/layers/${layerIndex}`,
        relatedResources: [{ kind: "layer", id: layerId }],
        fix: manualFix("Check the PMTiles query layer id or omit layers to use source-linked layers.", "high"),
      });
      continue;
    }

    const layer = spec.layers[index];
    if (layer) layers.push({ layer, index });
  }
  return layers;
}

function validateQueryableLayers(
  spec: MapSpec,
  sourceId: string,
  layers: LayerEntry[],
  diagnostics: Diagnostic[],
): { sourceLayerIds: string[] } {
  const sourceLayerIds: string[] = [];
  for (const { layer, index } of layers) {
    if (!layer.source) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.LayerSourceMissing,
        message: `Layer "${layer.id}" has no source for PMTiles fixture query evidence.`,
        path: `/layers/${index}/source`,
        relatedResources: [{ kind: "layer", id: layer.id }],
        fix: manualFix("Query only layers that reference a PMTiles source.", "high"),
      });
      continue;
    }

    const source = spec.sources[layer.source];
    if (!source) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SourceNotFound,
        message: `Layer "${layer.id}" references missing source "${layer.source}".`,
        path: `/layers/${index}/source`,
        relatedResources: [
          { kind: "layer", id: layer.id },
          { kind: "source", id: layer.source },
        ],
        fix: manualFix("Add the missing source or remove the layer from the PMTiles query case.", "medium"),
      });
      continue;
    }

    if (layer.source !== sourceId || source.type !== "pmtiles") {
      diagnostics.push(
        unsupportedSourceDiagnostic(layer.source, source, `/sources/${escapePathSegment(layer.source)}`),
      );
      continue;
    }

    if (layer.layout?.visibility === "none") {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.CapabilityUnsupported,
        message: `Hidden layer "${layer.id}" cannot be used as PMTiles fixture query promotion evidence.`,
        path: `/layers/${index}/layout/visibility`,
        relatedResources: [
          { kind: "layer", id: layer.id },
          { kind: "source", id: layer.source },
        ],
        fix: manualFix(
          "Use visible query evidence layers or make the hidden-layer behavior an explicit blocked case.",
          "medium",
        ),
      });
      continue;
    }

    const sourceLayerId = readSourceLayerId(layer);
    if (!sourceLayerId) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.LayerSourceIncompatible,
        message: `PMTiles query layer "${layer.id}" requires metadata["source-layer"].`,
        path: `/layers/${index}/metadata/source-layer`,
        relatedResources: [
          { kind: "layer", id: layer.id },
          { kind: "source", id: layer.source },
        ],
        fix: manualFix('Add metadata: { "source-layer": "<tileset-layer-name>" } to the query layer.', "high"),
      });
      continue;
    }
    sourceLayerIds.push(sourceLayerId);
  }
  return { sourceLayerIds: unique(sourceLayerIds) };
}

function indexFixtureFeatures(
  features: PMTilesQueryFixtureFeature[],
  diagnostics: Diagnostic[],
): IndexedFixtureFeature[] {
  return features.flatMap((feature, index) => {
    const sourceLayer = typeof feature.sourceLayer === "string" ? feature.sourceLayer.trim() : "";
    const bbox = feature.bbox ?? bboxFromGeometry(feature.geometry);
    if (!sourceLayer) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SpecMissingField,
        message: "PMTiles fixture feature requires a sourceLayer value.",
        path: `/pmtilesQuery/fixtures/${index}/sourceLayer`,
        fix: manualFix("Set sourceLayer to the decoded vector tile layer name.", "high"),
      });
      return [];
    }

    if (!bbox) {
      diagnostics.push({
        severity: "warning",
        code: DiagnosticCodes.GeoInvalidCoordinates,
        message: "PMTiles fixture feature has no bbox-able geometry.",
        path: `/pmtilesQuery/fixtures/${index}/geometry`,
      });
      return [];
    }

    return [
      {
        key: feature.id === undefined ? String(index) : String(feature.id),
        sourceLayer,
        bbox,
      },
    ];
  });
}

function readSourceLayerId(layer: LayerSpec): string | undefined {
  const value = layer.metadata?.["source-layer"];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function unsupportedSourceDiagnostic(sourceId: string, source: SourceSpec, sourcePath: string): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.CapabilityUnsupported,
    message: `PMTiles fixture query evidence cannot use "${source.type}" source "${sourceId}".`,
    path: source.type === "pmtiles" ? `${sourcePath}/id` : sourcePath,
    relatedResources: [{ kind: "source", id: sourceId, path: sourcePath }],
    fix: manualFix(
      "Use a PMTiles source plus caller-supplied decoded fixture features for this evidence gate.",
      "medium",
    ),
  };
}

function matchesQuery(featureBbox: Bbox, query: NormalizedQuery): boolean {
  if (query.point && !containsPoint(featureBbox, query.point)) return false;
  if (query.bbox && !intersectsBbox(featureBbox, query.bbox)) return false;
  return true;
}

function bboxFromGeometry(value: unknown): Bbox | undefined {
  if (!isRecord(value) || typeof value.type !== "string") return undefined;

  if (value.type === "GeometryCollection") {
    const geometries = value.geometries;
    if (!Array.isArray(geometries)) return undefined;
    return geometries.reduce<Bbox | undefined>(
      (accumulator, geometry) => combineBbox(accumulator, bboxFromGeometry(geometry)),
      undefined,
    );
  }

  if (!geometryTypes.has(value.type)) return undefined;
  return bboxFromCoordinates(value.coordinates);
}

function bboxFromCoordinates(value: unknown): Bbox | undefined {
  const bbox = createEmptyBbox();
  expandCoordinates(value, bbox);
  return bbox.valid ? [bbox.minX, bbox.minY, bbox.maxX, bbox.maxY] : undefined;
}

function expandCoordinates(value: unknown, bbox: MutableBbox): void {
  if (isPoint(value)) {
    expandBbox(bbox, value[0], value[1]);
    return;
  }

  if (!Array.isArray(value)) return;
  for (const child of value) {
    expandCoordinates(child, bbox);
  }
}

interface MutableBbox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  valid: boolean;
}

function createEmptyBbox(): MutableBbox {
  return {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
    valid: false,
  };
}

function expandBbox(bbox: MutableBbox, x: number, y: number): void {
  bbox.minX = Math.min(bbox.minX, x);
  bbox.minY = Math.min(bbox.minY, y);
  bbox.maxX = Math.max(bbox.maxX, x);
  bbox.maxY = Math.max(bbox.maxY, y);
  bbox.valid = true;
}

function combineBbox(left: Bbox | undefined, right: Bbox | undefined): Bbox | undefined {
  if (!left) return right;
  if (!right) return left;
  return [
    Math.min(left[0], right[0]),
    Math.min(left[1], right[1]),
    Math.max(left[2], right[2]),
    Math.max(left[3], right[3]),
  ];
}

function containsPoint(bbox: Bbox, point: [number, number]): boolean {
  return point[0] >= bbox[0] && point[0] <= bbox[2] && point[1] >= bbox[1] && point[1] <= bbox[3];
}

function intersectsBbox(left: Bbox, right: Bbox): boolean {
  return left[0] <= right[2] && left[2] >= right[0] && left[1] <= right[3] && left[3] >= right[1];
}

function isPoint(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length >= 2 && isFiniteNumber(value[0]) && isFiniteNumber(value[1]);
}

function isBbox(value: unknown): value is Bbox {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    isFiniteNumber(value[0]) &&
    isFiniteNumber(value[1]) &&
    isFiniteNumber(value[2]) &&
    isFiniteNumber(value[3]) &&
    value[0] <= value[2] &&
    value[1] <= value[3]
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function countDiagnostics(diagnostics: Diagnostic[]): DiagnosticCounts {
  return diagnostics.reduce<DiagnosticCounts>(
    (counts, diagnostic) => {
      counts[diagnostic.severity] += 1;
      return counts;
    },
    { error: 0, warning: 0, info: 0 },
  );
}

function digestStableValue(value: unknown): string {
  const input = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}
