import { type Diagnostic, DiagnosticCodes } from "@gis-engine/engine";
import { Ajv } from "ajv/dist/ajv.js";
import { toolInputErrorsToDiagnostics } from "./schemaDiagnostics.js";

export const QueryFeaturesToolInputSchema = {
  type: "object",
  properties: {
    geojson: {
      type: "object",
      description: "Inline GeoJSON FeatureCollection or Feature to query against.",
    },
    point: {
      type: "array",
      items: { type: "number" },
      minItems: 2,
      maxItems: 2,
      description: "Point query as [longitude, latitude].",
    },
    bbox: {
      type: "array",
      items: { type: "number" },
      minItems: 4,
      maxItems: 4,
      description: "Bounding box query as [west, south, east, north].",
    },
    layers: {
      type: "array",
      items: { type: "string" },
      description: "Optional layer filter (not used for GeoJSON but accepted for API consistency).",
    },
    maxFeatures: {
      type: "number",
      minimum: 1,
      maximum: 1000,
      default: 100,
      description: "Maximum number of features to return (default: 100).",
    },
  },
  required: ["geojson"],
  additionalProperties: false,
} as const;

export interface QueryFeaturesToolInput {
  geojson?: GeoJsonInput;
  point?: [number, number];
  bbox?: [number, number, number, number];
  layers?: string[];
  maxFeatures?: number;
}

interface GeoJsonInput {
  type: string;
  features?: GeoJsonFeature[];
  geometry?: GeoJsonGeometry;
  properties?: Record<string, unknown>;
}

interface GeoJsonFeature {
  type: "Feature";
  geometry?: GeoJsonGeometry;
  properties?: Record<string, unknown> | null;
  id?: string | number;
}

interface GeoJsonGeometry {
  type: string;
  coordinates?: unknown;
  geometries?: GeoJsonGeometry[];
}

export interface QueryFeaturesToolResult {
  queryType: "point" | "bbox" | "all";
  featureCount: number;
  features: Array<{
    type: "Feature";
    id?: string | number;
    geometry?: { type: string };
    properties?: Record<string, unknown> | null;
  }>;
  suggestions: string[];
}

export type QueryFeaturesToolResponse =
  | { ok: true; result: QueryFeaturesToolResult; diagnostics: [] }
  | { ok: false; diagnostics: Diagnostic[] };

const ajv = new Ajv({ allErrors: true, strict: false });
const validateInput = ajv.compile(QueryFeaturesToolInputSchema);

export function queryFeaturesTool(input: unknown): QueryFeaturesToolResponse {
  if (!validateInput(input)) {
    return {
      ok: false,
      diagnostics: toolInputErrorsToDiagnostics(validateInput.errors, "Invalid query_features tool input."),
    };
  }

  const typedInput = input as QueryFeaturesToolInput;

  if (!typedInput.geojson) {
    return {
      ok: false,
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.SpecMissingField,
          message: "'geojson' must be provided.",
          path: "/",
        },
      ],
    };
  }

  const features = extractFeatures(typedInput.geojson);
  const maxFeatures = typedInput.maxFeatures ?? 100;
  const queryType = typedInput.point ? "point" : typedInput.bbox ? "bbox" : "all";

  let matched: GeoJsonFeature[];

  if (typedInput.point) {
    matched = queryByPoint(features, typedInput.point);
  } else if (typedInput.bbox) {
    matched = queryByBbox(features, typedInput.bbox);
  } else {
    matched = features;
  }

  const truncated = matched.length > maxFeatures;
  const resultFeatures = matched.slice(0, maxFeatures);

  const suggestions: string[] = [];
  if (truncated) {
    suggestions.push(`Query matched ${matched.length} features, returning first ${maxFeatures}.`);
  }
  if (resultFeatures.length === 0) {
    suggestions.push("No features matched the query. Try expanding the bbox or increasing the search radius.");
  }

  return {
    ok: true,
    result: {
      queryType,
      featureCount: resultFeatures.length,
      features: resultFeatures.map((feature) => ({
        type: "Feature" as const,
        ...(feature.id !== undefined ? { id: feature.id } : {}),
        ...(feature.geometry ? { geometry: { type: feature.geometry.type } } : {}),
        properties: feature.properties ?? null,
      })),
      suggestions,
    },
    diagnostics: [],
  };
}

function extractFeatures(geojson: GeoJsonInput): GeoJsonFeature[] {
  if (geojson.type === "FeatureCollection" && Array.isArray(geojson.features)) {
    return geojson.features.filter(
      (feature): feature is GeoJsonFeature =>
        typeof feature === "object" && feature !== null && feature.type === "Feature",
    );
  }

  if (geojson.type === "Feature") {
    return [geojson as unknown as GeoJsonFeature];
  }

  if (typeof geojson.type === "string" && geojson.type !== "FeatureCollection") {
    return [
      {
        type: "Feature",
        geometry: geojson.geometry ?? { type: geojson.type, coordinates: [] },
        properties: geojson.properties ?? {},
      },
    ];
  }

  return [];
}

function queryByPoint(features: GeoJsonFeature[], point: [number, number]): GeoJsonFeature[] {
  const [lon, lat] = point;
  const tolerance = 0.001;
  return features.filter((feature) => {
    if (!feature.geometry) return false;
    return geometryContainsPoint(feature.geometry, lon, lat, tolerance);
  });
}

function geometryContainsPoint(geometry: GeoJsonGeometry, lon: number, lat: number, tolerance: number): boolean {
  if (geometry.type === "GeometryCollection" && Array.isArray(geometry.geometries)) {
    return geometry.geometries.some((sub) => geometryContainsPoint(sub, lon, lat, tolerance));
  }

  const coords = geometry.coordinates;
  if (!coords) return false;

  switch (geometry.type) {
    case "Point":
      return pointNearCoords(coords, lon, lat, tolerance);
    case "MultiPoint":
      return Array.isArray(coords) && coords.some((c) => pointNearCoords(c, lon, lat, tolerance));
    case "LineString":
      return Array.isArray(coords) && coords.some((c) => pointNearCoords(c, lon, lat, tolerance));
    case "MultiLineString":
      return (
        Array.isArray(coords) &&
        coords.some((line) => Array.isArray(line) && line.some((c) => pointNearCoords(c, lon, lat, tolerance)))
      );
    case "Polygon":
      return pointInPolygon(coords, lon, lat);
    case "MultiPolygon":
      return Array.isArray(coords) && coords.some((polygon) => pointInPolygon(polygon, lon, lat));
    default:
      return false;
  }
}

function pointNearCoords(coords: unknown, lon: number, lat: number, tolerance: number): boolean {
  if (!Array.isArray(coords) || coords.length < 2) return false;
  const [cLon, cLat] = coords;
  if (typeof cLon !== "number" || typeof cLat !== "number") return false;
  return Math.abs(cLon - lon) <= tolerance && Math.abs(cLat - lat) <= tolerance;
}

function pointInPolygon(rings: unknown, lon: number, lat: number): boolean {
  if (!Array.isArray(rings) || rings.length === 0) return false;
  const outerRing = rings[0];
  if (!Array.isArray(outerRing) || outerRing.length < 3) return false;

  if (!pointInRing(outerRing, lon, lat)) return false;

  for (let ringIndex = 1; ringIndex < rings.length; ringIndex += 1) {
    const hole = rings[ringIndex];
    if (Array.isArray(hole) && pointInRing(hole, lon, lat)) return false;
  }

  return true;
}

function pointInRing(ring: unknown[], lon: number, lat: number): boolean {
  let inside = false;
  const ringLength = ring.length;
  for (let i = 0, j = ringLength - 1; i < ringLength; j = i++) {
    const xi = extractCoord(ring[i]);
    const xj = extractCoord(ring[j]);
    if (!xi || !xj) continue;

    const intersect = xi[1] > lat !== xj[1] > lat && lon < ((xj[0] - xi[0]) * (lat - xi[1])) / (xj[1] - xi[1]) + xi[0];
    if (intersect) inside = !inside;
  }
  return inside;
}

function extractCoord(coord: unknown): [number, number] | null {
  if (!Array.isArray(coord) || coord.length < 2) return null;
  const [x, y] = coord;
  if (typeof x !== "number" || typeof y !== "number") return null;
  return [x, y];
}

function queryByBbox(features: GeoJsonFeature[], bbox: [number, number, number, number]): GeoJsonFeature[] {
  const [west, south, east, north] = bbox;
  return features.filter((feature) => {
    if (!feature.geometry) return false;
    return geometryIntersectsBbox(feature.geometry, west, south, east, north);
  });
}

function geometryIntersectsBbox(
  geometry: GeoJsonGeometry,
  west: number,
  south: number,
  east: number,
  north: number,
): boolean {
  if (geometry.type === "GeometryCollection" && Array.isArray(geometry.geometries)) {
    return geometry.geometries.some((sub) => geometryIntersectsBbox(sub, west, south, east, north));
  }

  const coords = geometry.coordinates;
  if (!coords) return false;

  const featureBounds = computeBounds(geometry);
  if (!featureBounds) return false;

  const [fWest, fSouth, fEast, fNorth] = featureBounds;
  return !(fWest > east || fEast < west || fSouth > north || fNorth < south);
}

function computeBounds(geometry: GeoJsonGeometry): [number, number, number, number] | null {
  let minLon = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  visitCoords(geometry, (lon, lat) => {
    if (lon < minLon) minLon = lon;
    if (lat < minLat) minLat = lat;
    if (lon > maxLon) maxLon = lon;
    if (lat > maxLat) maxLat = lat;
  });

  if (!Number.isFinite(minLon)) return null;
  return [minLon, minLat, maxLon, maxLat];
}

function visitCoords(geometry: GeoJsonGeometry, visitor: (lon: number, lat: number) => void): void {
  if (geometry.type === "GeometryCollection" && Array.isArray(geometry.geometries)) {
    for (const sub of geometry.geometries) {
      visitCoords(sub, visitor);
    }
    return;
  }

  const coords = geometry.coordinates;
  if (!coords) return;
  visitNestedCoords(coords, visitor);
}

function visitNestedCoords(coords: unknown, visitor: (lon: number, lat: number) => void): void {
  if (!Array.isArray(coords)) return;
  if (coords.length >= 2 && typeof coords[0] === "number" && typeof coords[1] === "number") {
    visitor(coords[0], coords[1]);
    return;
  }
  for (const item of coords) {
    visitNestedCoords(item, visitor);
  }
}
