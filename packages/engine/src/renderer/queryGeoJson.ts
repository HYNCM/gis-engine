import { DiagnosticCodes } from "../diagnostics/codes.js";
import { manualFix } from "../internal/shared.js";
import { joinPath } from "../spec/patch/index.js";
import type {
  Diagnostic,
  FeatureQueryResult,
  JsonValue,
  LayerSpec,
  MapSpec,
  QueryFeaturesOptions,
  SourceSpec,
} from "../types.js";

type Bbox = [number, number, number, number];

interface LayerEntry {
  layer: LayerSpec;
  index: number;
}

interface IndexedFeature {
  key: string;
  feature: JsonValue;
  bbox: Bbox;
}

interface NormalizedQuery {
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

export function queryInlineGeoJsonFeatures(
  spec: MapSpec | null,
  options: QueryFeaturesOptions,
  adapterId: string,
): FeatureQueryResult {
  if (!spec) {
    return {
      features: [],
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.RenderAdapterError,
          message: `${adapterId} adapter must load a MapSpec before querying features.`,
        },
      ],
    };
  }

  const query = normalizeQuery(options);
  if (!query.valid) return { features: [], diagnostics: query.diagnostics };

  const diagnostics: Diagnostic[] = [...query.diagnostics];
  const layers = selectLayers(spec, options, diagnostics);
  const reportedUnsupportedSources = new Set<string>();
  const seenFeatures = new Set<string>();
  const features: JsonValue[] = [];

  for (const { layer, index } of layers) {
    if (!layer.source) continue;

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
        fix: manualFix("Add the missing source or query a layer with an existing source.", "medium"),
      });
      continue;
    }

    const sourcePath = joinPath("sources", layer.source);
    const unsupported = unsupportedSourceDiagnostic(layer.source, source, sourcePath, adapterId);
    if (unsupported) {
      if (!reportedUnsupportedSources.has(layer.source)) {
        diagnostics.push(unsupported);
        reportedUnsupportedSources.add(layer.source);
      }
      continue;
    }

    if (source.type !== "geojson") continue;
    const inlineFeatures = collectInlineFeatures(source.data, `${sourcePath}/data`, diagnostics);
    for (const feature of inlineFeatures) {
      const featureKey = `${layer.source}:${feature.key}`;
      if (seenFeatures.has(featureKey)) continue;
      if (!matchesQuery(feature.bbox, query)) continue;
      seenFeatures.add(featureKey);
      features.push(structuredClone(feature.feature) as JsonValue);
    }
  }

  return { features, diagnostics };
}

function normalizeQuery(options: QueryFeaturesOptions): NormalizedQuery {
  const query: NormalizedQuery = {
    diagnostics: [],
    valid: true,
  };
  const hasPoint = options.point !== undefined;
  const hasBbox = options.bbox !== undefined;

  if (hasPoint) {
    if (isPoint(options.point)) {
      query.point = options.point;
    } else {
      query.diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.GeoInvalidCoordinates,
        message: "queryFeatures point must be a finite [x, y] coordinate.",
        path: "/point",
        fix: manualFix(
          "Pass point as [longitude, latitude] in the same coordinate space as the inline GeoJSON data.",
          "medium",
        ),
      });
    }
  }

  if (hasBbox) {
    if (isBbox(options.bbox)) {
      query.bbox = options.bbox;
    } else {
      query.diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.GeoEmptyBbox,
        message:
          "queryFeatures bbox must be a finite [minX, minY, maxX, maxY] extent where min values do not exceed max values.",
        path: "/bbox",
        fix: manualFix(
          "Pass bbox as [minLng, minLat, maxLng, maxLat] in the same coordinate space as the inline GeoJSON data.",
          "medium",
        ),
      });
    }
  }

  if (!hasPoint && !hasBbox) {
    query.diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: "Headless queryFeatures requires either a point or bbox query.",
      path: "/",
      fix: manualFix("Provide point or bbox query options.", "high"),
    });
  }

  query.valid = !query.diagnostics.some((diagnostic) => diagnostic.severity === "error");
  return query;
}

function selectLayers(spec: MapSpec, options: QueryFeaturesOptions, diagnostics: Diagnostic[]): LayerEntry[] {
  if (!options.layers) {
    return spec.layers.map((layer, index) => ({ layer, index }));
  }

  const layers: LayerEntry[] = [];
  const seenLayerIds = new Set<string>();
  for (const layerId of options.layers) {
    if (seenLayerIds.has(layerId)) continue;
    seenLayerIds.add(layerId);

    const index = spec.layers.findIndex((layer) => layer.id === layerId);
    if (index < 0) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.LayerNotFound,
        message: `Layer "${layerId}" does not exist.`,
        path: "/layers",
        relatedResources: [{ kind: "layer", id: layerId }],
        fix: manualFix("Check the query layer id or omit layers to query all queryable layers.", "high"),
      });
      continue;
    }

    const layer = spec.layers[index];
    if (layer) layers.push({ layer, index });
  }
  return layers;
}

function unsupportedSourceDiagnostic(
  sourceId: string,
  source: SourceSpec,
  sourcePath: string,
  adapterId: string,
): Diagnostic | undefined {
  if (source.type === "geojson" && typeof source.data !== "string") return undefined;

  if (source.type === "geojson") {
    return {
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: `Headless queryFeatures in ${adapterId} supports inline GeoJSON only; source "${sourceId}" uses URL/string GeoJSON data.`,
      path: `${sourcePath}/data`,
      relatedResources: [{ kind: "source", id: sourceId, path: sourcePath }],
      fix: manualFix(
        "Inline the GeoJSON Feature or FeatureCollection data before using headless queryFeatures.",
        "medium",
      ),
    };
  }

  const path =
    source.type === "pmtiles" || source.type === "flatgeobuf" || source.type === "geoparquet"
      ? `${sourcePath}/url`
      : sourcePath;
  return {
    severity: "error",
    code: DiagnosticCodes.CapabilityUnsupported,
    message: `Headless queryFeatures in ${adapterId} does not support "${source.type}" source "${sourceId}".`,
    path,
    relatedResources: [{ kind: "source", id: sourceId, path: sourcePath }],
    fix: manualFix("Use an inline GeoJSON source for headless feature queries.", "medium"),
  };
}

function collectInlineFeatures(data: unknown, path: string, diagnostics: Diagnostic[]): IndexedFeature[] {
  if (!isRecord(data)) {
    diagnostics.push(invalidGeoJsonDiagnostic(path, "Inline GeoJSON query data must be an object."));
    return [];
  }

  if (data.type === "FeatureCollection") {
    const features = data.features;
    if (!Array.isArray(features)) {
      diagnostics.push(
        invalidGeoJsonDiagnostic(`${path}/features`, "GeoJSON FeatureCollection.features must be an array."),
      );
      return [];
    }

    return features.flatMap((feature, index) =>
      readFeature(feature, `${path}/features/${index}`, String(index), diagnostics),
    );
  }

  if (data.type === "Feature") {
    return readFeature(data, path, "0", diagnostics);
  }

  if (typeof data.type === "string" && geometryTypes.has(data.type)) {
    return readFeature({ type: "Feature", properties: {}, geometry: data }, path, "0", diagnostics);
  }

  diagnostics.push({
    severity: "error",
    code: DiagnosticCodes.CapabilityUnsupported,
    message: "Headless queryFeatures supports inline GeoJSON Feature, FeatureCollection, or Geometry data.",
    path,
    fix: manualFix("Use a GeoJSON FeatureCollection with queryable Feature geometries.", "medium"),
  });
  return [];
}

function readFeature(value: unknown, path: string, key: string, diagnostics: Diagnostic[]): IndexedFeature[] {
  if (!isRecord(value) || value.type !== "Feature") {
    diagnostics.push(invalidGeoJsonDiagnostic(path, "GeoJSON FeatureCollection entries must be Feature objects."));
    return [];
  }

  const geometry = value.geometry;
  const geometryBbox = geometry === null ? undefined : bboxFromGeometry(geometry);
  const featureBbox = bboxFromUnknown(value.bbox);
  const bbox = geometryBbox ?? featureBbox;

  if (!bbox) {
    diagnostics.push({
      severity: "warning",
      code: DiagnosticCodes.GeoInvalidCoordinates,
      message: "GeoJSON feature has no bbox-able geometry for headless queryFeatures.",
      path: `${path}/geometry`,
    });
    return [];
  }

  return [
    {
      key,
      feature: value as JsonValue,
      bbox,
    },
  ];
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

function bboxFromUnknown(value: unknown): Bbox | undefined {
  if (!isBbox(value)) return undefined;
  return value;
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

function invalidGeoJsonDiagnostic(path: string, message: string): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.SpecInvalidType,
    message,
    path,
  };
}
