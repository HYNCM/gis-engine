import {
  type Diagnostic,
  DiagnosticCodes,
  type InteractionSpec,
  type LayerSpec,
  type MapSpec,
  type SourceSpec,
  type ViewSpec,
  validateSpec,
} from "@gis-engine/engine";
import { Ajv } from "ajv/dist/ajv.js";
import { toolInputErrorsToDiagnostics } from "./schemaDiagnostics.js";

export const GenerateSpecToolInputSchema = {
  type: "object",
  properties: {
    intent: {
      type: "object",
      properties: {
        description: { type: "string", minLength: 1 },
        dataType: { type: "string", enum: ["geojson", "vector-tiles", "raster"] },
        center: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
        zoom: { type: "number" },
        theme: { type: "string", enum: ["dark", "light", "satellite"] },
      },
      required: ["description"],
      additionalProperties: false,
    },
    options: {
      type: "object",
      properties: {
        includeMetadata: { type: "boolean" },
        includeInteractions: { type: "boolean" },
      },
      additionalProperties: false,
    },
  },
  required: ["intent"],
  additionalProperties: false,
} as const;

export interface GenerateSpecToolInput {
  intent: {
    description: string;
    dataType?: "geojson" | "vector-tiles" | "raster";
    center?: [number, number];
    zoom?: number;
    theme?: "dark" | "light" | "satellite";
  };
  options?: {
    includeMetadata?: boolean;
    includeInteractions?: boolean;
  };
}

export interface GenerateSpecToolResult {
  spec: MapSpec;
  diagnostics: Diagnostic[];
  suggestions: string[];
}

export type GenerateSpecToolResponse =
  | { ok: true; result: GenerateSpecToolResult; diagnostics: [] }
  | { ok: false; diagnostics: Diagnostic[] };

const ajv = new Ajv({ allErrors: true, strict: false });
const validateInput = ajv.compile(GenerateSpecToolInputSchema);

export function generateSpecTool(input: unknown): GenerateSpecToolResponse {
  if (!validateInput(input)) {
    return {
      ok: false,
      diagnostics: toolInputErrorsToDiagnostics(validateInput.errors, "Invalid generate_spec tool input."),
    };
  }

  const typedInput = input as GenerateSpecToolInput;
  const { intent, options } = typedInput;
  const description = intent.description.toLowerCase();
  const diagnostics: Diagnostic[] = [];
  const suggestions: string[] = [];

  // Detect location
  const location = detectLocation(description);
  const view: ViewSpec = buildView(intent, location);

  // Detect visualization type
  const vizType = detectVisualizationType(description);

  // Detect data type
  const dataType = intent.dataType ?? inferDataType(description, vizType);

  // Build source
  const sourceId = "primary-source";
  const source = buildSource(dataType, description);

  // Build layers
  const layers = buildLayers(sourceId, vizType, intent.theme, description);

  // Build interactions
  const includeInteractions = options?.includeInteractions ?? true;
  const interactions: InteractionSpec | undefined = includeInteractions
    ? { pan: true, zoom: true, click: true, hover: true }
    : undefined;

  // Build metadata
  const includeMetadata = options?.includeMetadata ?? true;
  const metadata: Record<string, unknown> | undefined = includeMetadata
    ? {
        generator: "gis-engine/generate_spec",
        description: intent.description,
        generatedAt: new Date().toISOString(),
      }
    : undefined;

  const spec: MapSpec = {
    version: "0.1",
    view,
    sources: { [sourceId]: source },
    layers,
    ...(interactions ? { interactions } : {}),
    ...(metadata ? { metadata } : {}),
  };

  // Validate the generated spec
  const validation = validateSpec(spec);
  if (!validation.valid) {
    diagnostics.push({
      severity: "warning",
      code: DiagnosticCodes.SpecInvalidType,
      message: "Generated spec has validation errors; review before use.",
      path: "/spec",
    });
    diagnostics.push(...validation.diagnostics.map((d) => ({ ...d, severity: "warning" as const })));
  }

  // Generate suggestions
  if (dataType === "geojson") {
    suggestions.push("Replace the placeholder GeoJSON data with your actual feature collection.");
  }
  if (dataType === "vector-tiles") {
    suggestions.push("Update the tile URL template to point to your vector tile server.");
  }
  if (dataType === "raster") {
    suggestions.push("Replace the tile URL template with your raster tile server endpoint.");
  }
  if (vizType === "fill" || vizType === "fill-extrusion-lite") {
    suggestions.push(
      "Consider adding a data-driven paint expression using ['get', 'property-name'] for choropleth styling.",
    );
  }
  if (!intent.center) {
    suggestions.push("Provide explicit center coordinates for a more precise initial view.");
  }
  if (!intent.zoom) {
    suggestions.push("Adjust the zoom level to match your data's geographic scale.");
  }
  if (layers.length === 1) {
    suggestions.push("Add additional layers (e.g., outline, labels) for richer visualization.");
  }

  return {
    ok: true,
    result: { spec, diagnostics, suggestions },
    diagnostics: [],
  };
}

interface LocationHint {
  center: [number, number];
  zoom: number;
}

const LOCATION_HINTS: Record<string, LocationHint> = {
  china: { center: [104.1954, 35.8617], zoom: 4 },
  中国: { center: [104.1954, 35.8617], zoom: 4 },
  japan: { center: [138.2529, 36.2048], zoom: 5 },
  日本: { center: [138.2529, 36.2048], zoom: 5 },
  usa: { center: [-98.5795, 39.8283], zoom: 4 },
  "united states": { center: [-98.5795, 39.8283], zoom: 4 },
  美国: { center: [-98.5795, 39.8283], zoom: 4 },
  europe: { center: [15.2551, 54.526], zoom: 4 },
  欧洲: { center: [15.2551, 54.526], zoom: 4 },
  africa: { center: [21.0, 1.0], zoom: 3 },
  非洲: { center: [21.0, 1.0], zoom: 3 },
  asia: { center: [100.0, 30.0], zoom: 3 },
  亚洲: { center: [100.0, 30.0], zoom: 3 },
  "south america": { center: [-58.0, -15.0], zoom: 3 },
  南美洲: { center: [-58.0, -15.0], zoom: 3 },
  "north america": { center: [-100.0, 45.0], zoom: 3 },
  北美洲: { center: [-100.0, 45.0], zoom: 3 },
  australia: { center: [133.7751, -25.2744], zoom: 4 },
  澳大利亚: { center: [133.7751, -25.2744], zoom: 4 },
  world: { center: [0, 20], zoom: 2 },
  global: { center: [0, 20], zoom: 2 },
  全球: { center: [0, 20], zoom: 2 },
  beijing: { center: [116.4074, 39.9042], zoom: 10 },
  北京: { center: [116.4074, 39.9042], zoom: 10 },
  shanghai: { center: [121.4737, 31.2304], zoom: 10 },
  上海: { center: [121.4737, 31.2304], zoom: 10 },
  "new york": { center: [-74.006, 40.7128], zoom: 10 },
  纽约: { center: [-74.006, 40.7128], zoom: 10 },
  london: { center: [-0.1276, 51.5074], zoom: 10 },
  伦敦: { center: [-0.1276, 51.5074], zoom: 10 },
  tokyo: { center: [139.6917, 35.6895], zoom: 10 },
  东京: { center: [139.6917, 35.6895], zoom: 10 },
};

function detectLocation(description: string): LocationHint {
  for (const [keyword, hint] of Object.entries(LOCATION_HINTS)) {
    if (description.includes(keyword)) return hint;
  }
  return { center: [0, 20], zoom: 2 };
}

function buildView(intent: GenerateSpecToolInput["intent"], location: LocationHint): ViewSpec {
  return {
    center: intent.center ?? location.center,
    zoom: intent.zoom ?? location.zoom,
  };
}

type VisualizationType = "fill" | "circle" | "line" | "raster" | "fill-extrusion-lite" | "symbol-lite";

function detectVisualizationType(description: string): VisualizationType {
  if (/(satellite|imagery|aerial|orthophoto|遥感|卫星|影像)/.test(description)) return "raster";
  if (/(3d|building|extrusion|extrude|建筑|三维|高度|height)/.test(description)) return "fill-extrusion-lite";
  if (/(route|road|path|line|network|trail|线路|道路|路径|线)/.test(description)) return "line";
  if (/(point|city|location|marker|poi|站点|点|城市|位置|标注)/.test(description)) return "circle";
  if (/(label|name|text|annotation|标签|标注|文字)/.test(description)) return "symbol-lite";
  // Default: fill (choropleth)
  return "fill";
}

function inferDataType(description: string, vizType: VisualizationType): "geojson" | "vector-tiles" | "raster" {
  if (vizType === "raster") return "raster";
  if (/(vector.?tile|tile.?server|mvt|矢量切片)/.test(description)) return "vector-tiles";
  if (/(raster.?tile|栅格)/.test(description)) return "raster";
  // Default to geojson
  return "geojson";
}

function buildSource(dataType: "geojson" | "vector-tiles" | "raster", _description: string): SourceSpec {
  if (dataType === "raster") {
    return {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    };
  }

  if (dataType === "vector-tiles") {
    return {
      type: "vector",
      tiles: ["https://example.com/tiles/{z}/{x}/{y}.pbf"],
      minzoom: 0,
      maxzoom: 14,
    };
  }

  // Default: GeoJSON with placeholder FeatureCollection
  return {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: { name: "Placeholder" },
        },
      ],
    },
  };
}

function buildLayers(
  sourceId: string,
  vizType: VisualizationType,
  theme: "dark" | "light" | "satellite" | undefined,
  _description: string,
): LayerSpec[] {
  const layers: LayerSpec[] = [];
  const isDark = theme === "dark" || theme === "satellite";

  if (vizType === "raster") {
    layers.push({
      id: "raster-layer",
      type: "raster",
      source: sourceId,
      paint: { "raster-opacity": 1.0 },
    });
    return layers;
  }

  if (vizType === "circle") {
    layers.push({
      id: "point-layer",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-radius": 6,
        "circle-color": isDark ? "#60a5fa" : "#2563eb",
        "circle-stroke-width": 1,
        "circle-stroke-color": isDark ? "#1e3a5f" : "#ffffff",
      },
    });
  } else if (vizType === "line") {
    layers.push({
      id: "line-layer",
      type: "line",
      source: sourceId,
      paint: {
        "line-color": isDark ? "#60a5fa" : "#2563eb",
        "line-width": 2,
      },
    });
  } else if (vizType === "fill-extrusion-lite") {
    layers.push({
      id: "extrusion-layer",
      type: "fill-extrusion-lite",
      source: sourceId,
      paint: {
        "fill-extrusion-color": isDark ? "#4b5563" : "#9ca3af",
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-opacity": 0.8,
      },
    });
  } else if (vizType === "symbol-lite") {
    layers.push({
      id: "label-layer",
      type: "symbol-lite",
      source: sourceId,
      layout: {
        "text-field": ["get", "name"],
      },
      paint: {
        "text-color": isDark ? "#e5e7eb" : "#1f2937",
      },
    });
  } else {
    // fill (choropleth)
    layers.push({
      id: "fill-layer",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": isDark ? "#1e40af" : "#93c5fd",
        "fill-opacity": 0.7,
      },
    });
    layers.push({
      id: "outline-layer",
      type: "line",
      source: sourceId,
      paint: {
        "line-color": isDark ? "#60a5fa" : "#2563eb",
        "line-width": 1,
      },
    });
  }

  return layers;
}
