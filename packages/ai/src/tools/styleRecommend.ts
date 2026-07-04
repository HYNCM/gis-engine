import type { Diagnostic } from "@gis-engine/engine";
import { DiagnosticCodes } from "@gis-engine/engine";
import { Ajv } from "ajv/dist/ajv.js";
import { toolInputErrorsToDiagnostics } from "./schemaDiagnostics.js";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

export const StyleRecommendToolInputSchema = {
  type: "object",
  properties: {
    geojson: {
      type: "object",
      description: "Inline GeoJSON FeatureCollection or GeoJSON object to analyze for style recommendations.",
    },
    hints: {
      type: "object",
      description: "Optional context hints to influence recommendations.",
      properties: {
        theme: {
          type: "string",
          enum: ["light", "dark", "satellite", "minimal"],
          description: "Preferred visual theme.",
        },
        density: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Expected feature density on the map.",
        },
        purpose: {
          type: "string",
          enum: ["exploration", "presentation", "analysis", "navigation"],
          description: "Map purpose to influence style choices.",
        },
      },
      additionalProperties: false,
    },
  },
  required: ["geojson"],
  additionalProperties: false,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StyleRecommendToolInput {
  geojson: GeoJsonObject;
  hints?: StyleHints;
}

interface StyleHints {
  theme?: "light" | "dark" | "satellite" | "minimal";
  density?: "low" | "medium" | "high";
  purpose?: "exploration" | "presentation" | "analysis" | "navigation";
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

export interface StyleLayerRecommendation {
  layerType: string;
  rationale: string;
  paint: Record<string, unknown>;
  layout: Record<string, unknown>;
  filter?: unknown[];
  priority: number;
}

export interface StyleRecommendationResult {
  featureCount: number;
  geometryTypes: string[];
  primaryGeometry: string;
  numericProperties: string[];
  categoricalProperties: string[];
  recommendations: StyleLayerRecommendation[];
  diagnostics: Diagnostic[];
}

// ---------------------------------------------------------------------------
// Tool entry
// ---------------------------------------------------------------------------

const ajv = new Ajv({ allErrors: true, strict: false });
const validateInput = ajv.compile(StyleRecommendToolInputSchema);

export function styleRecommendTool(rawInput: unknown): {
  ok: boolean;
  result?: StyleRecommendationResult;
  diagnostics?: Diagnostic[];
} {
  if (!validateInput(rawInput)) {
    return {
      ok: false,
      diagnostics: toolInputErrorsToDiagnostics(validateInput.errors, "Invalid style_recommend tool input."),
    };
  }

  const input = rawInput as StyleRecommendToolInput;
  const result = analyzeAndRecommend(input);
  return { ok: true, result };
}

// ---------------------------------------------------------------------------
// Analysis engine
// ---------------------------------------------------------------------------

function analyzeAndRecommend(input: StyleRecommendToolInput): StyleRecommendationResult {
  const diagnostics: Diagnostic[] = [];
  const features = extractFeatures(input.geojson);

  if (features.length === 0) {
    diagnostics.push({
      severity: "warning",
      code: DiagnosticCodes.QueryEmptyResult,
      message: "No features found in the provided GeoJSON data.",
      path: "/geojson",
    });
  }

  const geometryTypes = countGeometryTypes(features);
  const primaryGeometry = selectPrimaryGeometry(geometryTypes);
  const numericProperties = detectNumericProperties(features);
  const categoricalProperties = detectCategoricalProperties(features);
  const recommendations = generateRecommendations(
    primaryGeometry,
    geometryTypes,
    numericProperties,
    categoricalProperties,
    features.length,
    input.hints,
  );

  return {
    featureCount: features.length,
    geometryTypes: [...geometryTypes.keys()],
    primaryGeometry,
    numericProperties,
    categoricalProperties,
    recommendations,
    diagnostics,
  };
}

function extractFeatures(geojson: GeoJsonObject): GeoJsonFeature[] {
  if (geojson.type === "FeatureCollection" && Array.isArray(geojson.features)) {
    return geojson.features.filter((f) => f?.type === "Feature");
  }
  if (geojson.type === "Feature") {
    return [geojson as unknown as GeoJsonFeature];
  }
  if (geojson.geometry) {
    return [
      {
        type: "Feature",
        geometry: geojson.geometry,
        properties: geojson.properties ?? null,
      },
    ];
  }
  return [];
}

function countGeometryTypes(features: GeoJsonFeature[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const feature of features) {
    const types = collectGeometryTypes(feature.geometry);
    for (const type of types) {
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
  }
  return counts;
}

function collectGeometryTypes(geometry: GeoJsonGeometry | undefined): string[] {
  if (!geometry || typeof geometry.type !== "string") return [];
  if (geometry.type === "GeometryCollection" && geometry.geometries) {
    return geometry.geometries.flatMap(collectGeometryTypes);
  }
  return [geometry.type];
}

function selectPrimaryGeometry(counts: Map<string, number>): string {
  let maxCount = 0;
  let primary = "unknown";
  for (const [type, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      primary = type;
    }
  }
  return normalizeGeometryType(primary);
}

function normalizeGeometryType(type: string): string {
  if (type.startsWith("Multi")) return type;
  return type;
}

function detectNumericProperties(features: GeoJsonFeature[]): string[] {
  const numericKeys = new Set<string>();
  const sampleSize = Math.min(features.length, 50);

  for (let index = 0; index < sampleSize; index++) {
    const props = features[index]?.properties;
    if (!props) continue;
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        numericKeys.add(key);
      }
    }
  }

  return [...numericKeys].sort();
}

function detectCategoricalProperties(features: GeoJsonFeature[]): string[] {
  const categoricalKeys = new Set<string>();
  const sampleSize = Math.min(features.length, 50);

  for (let index = 0; index < sampleSize; index++) {
    const props = features[index]?.properties;
    if (!props) continue;
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === "string" || typeof value === "boolean") {
        categoricalKeys.add(key);
      }
    }
  }

  return [...categoricalKeys].sort();
}

// ---------------------------------------------------------------------------
// Recommendation generation
// ---------------------------------------------------------------------------

function generateRecommendations(
  primaryGeometry: string,
  _geometryTypes: Map<string, number>,
  numericProperties: string[],
  categoricalProperties: string[],
  featureCount: number,
  hints?: StyleHints,
): StyleLayerRecommendation[] {
  const recommendations: StyleLayerRecommendation[] = [];
  const theme = hints?.theme ?? "light";
  const isAnalysis = hints?.purpose === "analysis";

  const baseColor = getBaseColor(theme);
  const accentColor = getAccentColor(theme);

  // Primary layer recommendation
  if (isPointGeometry(primaryGeometry)) {
    recommendations.push(
      createCircleRecommendation(baseColor, accentColor, featureCount, isAnalysis, numericProperties),
    );
    if (categoricalProperties.length > 0) {
      const prop = categoricalProperties[0];
      if (prop) recommendations.push(createSymbolRecommendation(prop, featureCount));
    }
  } else if (isLineGeometry(primaryGeometry)) {
    recommendations.push(createLineRecommendation(baseColor, accentColor, numericProperties, isAnalysis));
  } else if (isPolygonGeometry(primaryGeometry)) {
    recommendations.push(
      createFillRecommendation(baseColor, accentColor, numericProperties, categoricalProperties, isAnalysis),
    );
    recommendations.push(createFillOutlineRecommendation(baseColor));
  }

  // Data-driven styling recommendations
  if (numericProperties.length > 0 && isAnalysis) {
    const numProp = numericProperties[0];
    if (numProp) recommendations.push(createHeatmapRecommendation(numProp));
  }

  if (categoricalProperties.length > 0 && featureCount > 10) {
    const catProp = categoricalProperties[0];
    if (catProp) recommendations.push(createCategoricalRecommendation(catProp, primaryGeometry, baseColor));
  }

  return recommendations.sort((a, b) => b.priority - a.priority);
}

function isPointGeometry(type: string): boolean {
  return type === "Point" || type === "MultiPoint";
}

function isLineGeometry(type: string): boolean {
  return type === "LineString" || type === "MultiLineString";
}

function isPolygonGeometry(type: string): boolean {
  return type === "Polygon" || type === "MultiPolygon";
}

function getBaseColor(theme: string): string {
  switch (theme) {
    case "dark":
      return "#4fc3f7";
    case "satellite":
      return "#ffffff";
    case "minimal":
      return "#757575";
    default:
      return "#1976d2";
  }
}

function getAccentColor(theme: string): string {
  switch (theme) {
    case "dark":
      return "#ff7043";
    case "satellite":
      return "#ffeb3b";
    case "minimal":
      return "#9e9e9e";
    default:
      return "#e91e63";
  }
}

function createCircleRecommendation(
  baseColor: string,
  accentColor: string,
  featureCount: number,
  isAnalysis: boolean,
  numericProperties: string[],
): StyleLayerRecommendation {
  const radius = featureCount > 1000 ? 3 : featureCount > 100 ? 5 : 7;
  const paint: Record<string, unknown> = {
    "circle-radius": radius,
    "circle-color": baseColor,
    "circle-stroke-width": 1,
    "circle-stroke-color": "#ffffff",
    "circle-opacity": 0.8,
  };

  if (isAnalysis && numericProperties.length > 0) {
    paint["circle-radius"] = ["interpolate", ["linear"], ["get", numericProperties[0]], 0, 3, 100, 12];
    paint["circle-color"] = ["interpolate", ["linear"], ["get", numericProperties[0]], 0, baseColor, 100, accentColor];
  }

  return {
    layerType: "circle",
    rationale: `Circle layer recommended for ${featureCount} point features. ${isAnalysis && numericProperties.length > 0 ? "Data-driven sizing enabled for analysis." : ""}`,
    paint,
    layout: {},
    priority: 10,
  };
}

function createSymbolRecommendation(labelProperty: string, featureCount: number): StyleLayerRecommendation {
  return {
    layerType: "symbol",
    rationale: `Symbol layer for labeling features using "${labelProperty}" property.`,
    paint: { "text-color": "#333333" },
    layout: {
      "text-field": ["get", labelProperty],
      "text-size": 12,
      "text-anchor": "top",
      "text-offset": [0, 1],
      "text-allow-overlap": false,
    },
    priority: featureCount < 50 ? 6 : 3,
  };
}

function createLineRecommendation(
  baseColor: string,
  accentColor: string,
  numericProperties: string[],
  isAnalysis: boolean,
): StyleLayerRecommendation {
  const paint: Record<string, unknown> = {
    "line-color": baseColor,
    "line-width": 2,
    "line-opacity": 0.85,
  };

  if (isAnalysis && numericProperties.length > 0) {
    paint["line-width"] = ["interpolate", ["linear"], ["get", numericProperties[0]], 0, 1, 100, 6];
    paint["line-color"] = accentColor;
  }

  return {
    layerType: "line",
    rationale: `Line layer for linear features. ${isAnalysis && numericProperties.length > 0 ? "Width driven by data property." : ""}`,
    paint,
    layout: { "line-cap": "round", "line-join": "round" },
    priority: 10,
  };
}

function createFillRecommendation(
  baseColor: string,
  accentColor: string,
  numericProperties: string[],
  categoricalProperties: string[],
  isAnalysis: boolean,
): StyleLayerRecommendation {
  const paint: Record<string, unknown> = {
    "fill-color": baseColor,
    "fill-opacity": 0.4,
  };

  if (isAnalysis && categoricalProperties.length > 0) {
    paint["fill-color"] = accentColor;
    paint["fill-opacity"] = 0.6;
  } else if (isAnalysis && numericProperties.length > 0) {
    paint["fill-color"] = ["interpolate", ["linear"], ["get", numericProperties[0]], 0, baseColor, 100, accentColor];
    paint["fill-opacity"] = 0.6;
  }

  return {
    layerType: "fill",
    rationale: "Fill layer for polygon features with semi-transparent fill.",
    paint,
    layout: {},
    priority: 10,
  };
}

function createFillOutlineRecommendation(baseColor: string): StyleLayerRecommendation {
  return {
    layerType: "line",
    rationale: "Outline layer to accompany polygon fill for clearer boundaries.",
    paint: {
      "line-color": baseColor,
      "line-width": 1,
      "line-opacity": 0.8,
    },
    layout: {},
    priority: 5,
  };
}

function createHeatmapRecommendation(weightProperty: string): StyleLayerRecommendation {
  return {
    layerType: "heatmap",
    rationale: `Heatmap layer for density visualization using "${weightProperty}" as weight.`,
    paint: {
      "heatmap-weight": ["get", weightProperty],
      "heatmap-intensity": 1,
      "heatmap-radius": 20,
      "heatmap-opacity": 0.7,
    },
    layout: {},
    priority: 7,
  };
}

function createCategoricalRecommendation(
  categoryProperty: string,
  primaryGeometry: string,
  baseColor: string,
): StyleLayerRecommendation {
  const layerType = isPointGeometry(primaryGeometry) ? "circle" : isLineGeometry(primaryGeometry) ? "line" : "fill";

  return {
    layerType,
    rationale: `Categorical styling using "${categoryProperty}" to distinguish feature groups.`,
    paint: {
      [`${layerType === "fill" ? "fill" : layerType}-color`]: baseColor,
    },
    layout: {},
    filter: ["has", categoryProperty],
    priority: 4,
  };
}
