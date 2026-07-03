import { type Diagnostic, DiagnosticCodes } from "@gis-engine/engine";
import { Ajv } from "ajv/dist/ajv.js";
import { toolInputErrorsToDiagnostics } from "./schemaDiagnostics.js";

export const InspectDataToolInputSchema = {
  type: "object",
  properties: {
    url: { type: "string", description: "URL to fetch GeoJSON data from" },
    geojson: {
      type: "object",
      description: "Inline GeoJSON FeatureCollection or GeoJSON object",
    },
    sampleSize: {
      type: "number",
      minimum: 1,
      maximum: 100,
      default: 5,
      description: "Number of sample features to return",
    },
  },
  additionalProperties: false,
} as const;

export interface InspectDataToolInput {
  url?: string;
  geojson?: GeoJsonObject;
  sampleSize?: number;
}

interface GeoJsonObject {
  type: string;
  features?: GeoJsonFeature[];
  geometry?: GeoJsonGeometry;
  properties?: Record<string, unknown>;
}

interface GeoJsonFeature {
  type: "Feature";
  geometry?: GeoJsonGeometry;
  properties?: Record<string, unknown> | null;
}

interface GeoJsonGeometry {
  type: string;
  coordinates?: unknown;
  geometries?: GeoJsonGeometry[];
}

export interface PropertySchemaEntry {
  name: string;
  types: string[];
  sampleValues: unknown[];
}

export interface InspectDataToolResult {
  featureCount: number;
  propertySchema: PropertySchemaEntry[];
  geometryTypes: string[];
  sample: unknown[];
  bounds: [number, number, number, number];
  suggestions: string[];
}

export type InspectDataToolResponse =
  | { ok: true; result: InspectDataToolResult; diagnostics: [] }
  | { ok: false; diagnostics: Diagnostic[] };

const ajv = new Ajv({ allErrors: true, strict: false });
const validateInput = ajv.compile(InspectDataToolInputSchema);

export function inspectDataTool(input: unknown): InspectDataToolResponse {
  if (!validateInput(input)) {
    return {
      ok: false,
      diagnostics: toolInputErrorsToDiagnostics(validateInput.errors, "Invalid inspect_data tool input."),
    };
  }

  const typedInput = input as InspectDataToolInput;

  if (!typedInput.url && !typedInput.geojson) {
    return {
      ok: false,
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.SpecMissingField,
          message: "Either 'url' or 'geojson' must be provided.",
          path: "/",
        },
      ],
    };
  }

  if (typedInput.url && !typedInput.geojson) {
    return {
      ok: false,
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.CapabilityUnsupported,
          message:
            "URL fetching is not available in this context. Please provide GeoJSON data inline using the 'geojson' parameter.",
          path: "/url",
        },
      ],
    };
  }

  const geojson = typedInput.geojson as GeoJsonObject;
  const sampleSize = typedInput.sampleSize ?? 5;

  const features = extractFeatures(geojson);

  const featureCount = features.length;
  const propertyMap = collectPropertySchema(features);
  const geometryTypes = collectGeometryTypes(features);
  const bounds = calculateBounds(features);
  const sample = features.slice(0, sampleSize);
  const suggestions = generateSuggestions(features, propertyMap, geometryTypes);

  const propertySchema: PropertySchemaEntry[] = Object.entries(propertyMap).map(([name, entry]) => ({
    name,
    types: Array.from(entry.types),
    sampleValues: entry.sampleValues.slice(0, 3),
  }));

  return {
    ok: true,
    result: {
      featureCount,
      propertySchema,
      geometryTypes: Array.from(geometryTypes),
      sample,
      bounds,
      suggestions,
    },
    diagnostics: [],
  };
}

function extractFeatures(geojson: GeoJsonObject): GeoJsonFeature[] {
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

interface PropertyMap {
  [name: string]: { types: Set<string>; sampleValues: unknown[] };
}

function collectPropertySchema(features: GeoJsonFeature[]): PropertyMap {
  const propertyMap: PropertyMap = {};

  for (const feature of features) {
    const properties = feature.properties;
    if (!properties || typeof properties !== "object") continue;

    for (const [key, value] of Object.entries(properties)) {
      if (!propertyMap[key]) {
        propertyMap[key] = { types: new Set(), sampleValues: [] };
      }

      propertyMap[key].types.add(typeof value);
      if (propertyMap[key].sampleValues.length < 3 && value !== null && value !== undefined) {
        propertyMap[key].sampleValues.push(value);
      }
    }
  }

  return propertyMap;
}

function collectGeometryTypes(features: GeoJsonFeature[]): Set<string> {
  const types = new Set<string>();

  for (const feature of features) {
    if (feature.geometry?.type) {
      types.add(feature.geometry.type);
    }
  }

  return types;
}

function calculateBounds(features: GeoJsonFeature[]): [number, number, number, number] {
  let minLon = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  for (const feature of features) {
    if (!feature.geometry) continue;
    visitCoordinates(feature.geometry, (lon, lat) => {
      if (lon < minLon) minLon = lon;
      if (lat < minLat) minLat = lat;
      if (lon > maxLon) maxLon = lon;
      if (lat > maxLat) maxLat = lat;
    });
  }

  if (!Number.isFinite(minLon)) {
    return [0, 0, 0, 0];
  }

  return [minLon, minLat, maxLon, maxLat];
}

function visitCoordinates(geometry: GeoJsonGeometry, visitor: (lon: number, lat: number) => void): void {
  if (geometry.type === "GeometryCollection" && Array.isArray(geometry.geometries)) {
    for (const sub of geometry.geometries) {
      visitCoordinates(sub, visitor);
    }
    return;
  }

  const coords = geometry.coordinates;
  if (!coords) return;

  visitNestedCoordinates(coords, visitor);
}

function visitNestedCoordinates(coords: unknown, visitor: (lon: number, lat: number) => void): void {
  if (!Array.isArray(coords)) return;

  if (coords.length >= 2 && typeof coords[0] === "number" && typeof coords[1] === "number") {
    visitor(coords[0], coords[1]);
    return;
  }

  for (const item of coords) {
    visitNestedCoordinates(item, visitor);
  }
}

function generateSuggestions(
  features: GeoJsonFeature[],
  propertyMap: PropertyMap,
  geometryTypes: Set<string>,
): string[] {
  const suggestions: string[] = [];

  const hasNumericProperty = Object.values(propertyMap).some((entry) => entry.types.has("number"));
  if (hasNumericProperty) {
    suggestions.push("Consider choropleth or graduated-circle visualization");
  }

  const hasStringProperty = Object.values(propertyMap).some((entry) => entry.types.has("string"));
  if (hasStringProperty) {
    suggestions.push("Consider symbol labels or categorical styling");
  }

  if (features.length > 100 && geometryTypes.has("Point")) {
    suggestions.push("Consider heatmap for density visualization");
  }

  if (geometryTypes.has("Polygon") || geometryTypes.has("MultiPolygon")) {
    suggestions.push("Consider fill or fill-extrusion-lite visualization");
  }

  return suggestions;
}
