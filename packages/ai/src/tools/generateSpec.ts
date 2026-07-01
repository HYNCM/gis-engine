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
        theme: { type: "string", enum: ["dark", "light", "satellite", "ocean", "forest", "warm"] },
        dataProperty: { type: "string", description: "Feature property to use for data-driven styling" },
        multiLayer: { type: "boolean", description: "Generate multi-layer composition" },
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
    theme?: "dark" | "light" | "satellite" | "ocean" | "forest" | "warm";
    dataProperty?: string;
    multiLayer?: boolean;
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
  const source = buildSource(dataType, description, vizType);

  // Build layers
  const theme = intent.theme ?? "dark";
  const dataProperty = intent.dataProperty;
  const multiLayer = intent.multiLayer ?? false;

  const layers = multiLayer
    ? buildMultiLayerSpec(sourceId, theme, description, dataProperty)
    : buildLayers(sourceId, vizType, theme, description, dataProperty);

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

/* ─── Location Detection (50+ keywords) ─────────────────────────────────── */

interface LocationHint {
  center: [number, number];
  zoom: number;
}

const LOCATION_HINTS: Record<string, LocationHint> = {
  // Countries
  china: { center: [104.1954, 35.8617], zoom: 4 },
  中国: { center: [104.1954, 35.8617], zoom: 4 },
  japan: { center: [138.2529, 36.2048], zoom: 5 },
  日本: { center: [138.2529, 36.2048], zoom: 5 },
  usa: { center: [-98.5795, 39.8283], zoom: 4 },
  "united states": { center: [-98.5795, 39.8283], zoom: 4 },
  美国: { center: [-98.5795, 39.8283], zoom: 4 },
  germany: { center: [10.4515, 51.1657], zoom: 5 },
  德国: { center: [10.4515, 51.1657], zoom: 5 },
  france: { center: [2.2137, 46.2276], zoom: 5 },
  法国: { center: [2.2137, 46.2276], zoom: 5 },
  india: { center: [78.9629, 20.5937], zoom: 4 },
  印度: { center: [78.9629, 20.5937], zoom: 4 },
  brazil: { center: [-51.9253, -14.235], zoom: 4 },
  巴西: { center: [-51.9253, -14.235], zoom: 4 },
  russia: { center: [105.3188, 61.524], zoom: 3 },
  俄罗斯: { center: [105.3188, 61.524], zoom: 3 },

  // Chinese provinces
  beijing: { center: [116.4074, 39.9042], zoom: 10 },
  北京: { center: [116.4074, 39.9042], zoom: 10 },
  shanghai: { center: [121.4737, 31.2304], zoom: 10 },
  上海: { center: [121.4737, 31.2304], zoom: 10 },
  guangdong: { center: [113.2644, 23.1291], zoom: 7 },
  广东: { center: [113.2644, 23.1291], zoom: 7 },
  zhejiang: { center: [120.1551, 29.2612], zoom: 7 },
  浙江: { center: [120.1551, 29.2612], zoom: 7 },
  sichuan: { center: [104.0657, 30.5728], zoom: 7 },
  四川: { center: [104.0657, 30.5728], zoom: 7 },
  yunnan: { center: [102.7123, 25.0406], zoom: 7 },
  云南: { center: [102.7123, 25.0406], zoom: 7 },

  // Major cities
  "new york": { center: [-74.006, 40.7128], zoom: 10 },
  纽约: { center: [-74.006, 40.7128], zoom: 10 },
  london: { center: [-0.1276, 51.5074], zoom: 10 },
  伦敦: { center: [-0.1276, 51.5074], zoom: 10 },
  tokyo: { center: [139.6917, 35.6895], zoom: 10 },
  东京: { center: [139.6917, 35.6895], zoom: 10 },
  paris: { center: [2.3522, 48.8566], zoom: 10 },
  巴黎: { center: [2.3522, 48.8566], zoom: 10 },
  berlin: { center: [13.405, 52.52], zoom: 10 },
  柏林: { center: [13.405, 52.52], zoom: 10 },
  sydney: { center: [151.2093, -33.8688], zoom: 10 },
  悉尼: { center: [151.2093, -33.8688], zoom: 10 },

  // Continents / regions
  europe: { center: [15.2551, 54.526], zoom: 4 },
  欧洲: { center: [15.2551, 54.526], zoom: 4 },
  africa: { center: [21.0, 1.0], zoom: 3 },
  非洲: { center: [21.0, 1.0], zoom: 3 },
  asia: { center: [100.0, 30.0], zoom: 3 },
  亚洲: { center: [100.0, 30.0], zoom: 3 },
  "south america": { center: [-58.0, -15.0], zoom: 3 },
  南美洲: { center: [-58.0, -15.0], zoom: 3 },
  南美: { center: [-58.0, -15.0], zoom: 3 },
  "north america": { center: [-100.0, 45.0], zoom: 3 },
  北美洲: { center: [-100.0, 45.0], zoom: 3 },
  北美: { center: [-100.0, 45.0], zoom: 3 },
  australia: { center: [133.7751, -25.2744], zoom: 4 },
  澳大利亚: { center: [133.7751, -25.2744], zoom: 4 },

  // Natural geography
  pacific: { center: [-160.0, 0.0], zoom: 3 },
  太平洋: { center: [-160.0, 0.0], zoom: 3 },
  atlantic: { center: [-30.0, 0.0], zoom: 3 },
  大西洋: { center: [-30.0, 0.0], zoom: 3 },
  himalayas: { center: [86.925, 27.9881], zoom: 6 },
  喜马拉雅: { center: [86.925, 27.9881], zoom: 6 },
  sahara: { center: [13.0, 23.0], zoom: 5 },
  撒哈拉: { center: [13.0, 23.0], zoom: 5 },

  // Global
  world: { center: [0, 20], zoom: 2 },
  global: { center: [0, 20], zoom: 2 },
  全球: { center: [0, 20], zoom: 2 },
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

/* ─── Visualization Type Detection ──────────────────────────────────────── */

type VisualizationType =
  | "fill"
  | "circle"
  | "line"
  | "raster"
  | "fill-extrusion-lite"
  | "symbol-lite"
  | "choropleth"
  | "heatmap"
  | "graduated-circle"
  | "symbol";

function detectVisualizationType(description: string): VisualizationType {
  // New types — higher priority
  if (/(choropleth|等值线|分级统计图|thematic\s*map|colored\s*regions?|区域着色)/.test(description)) return "choropleth";
  if (/(heatmap|density|热力图|密度图)/.test(description)) return "heatmap";
  if (/(graduated|bubble|proportional|气泡图|比例符号)/.test(description)) return "graduated-circle";
  if (/(label|annotation|marker|标注|标签|标记|point\s*of\s*interest)/.test(description)) return "symbol";

  // Existing types
  if (/(satellite|imagery|aerial|orthophoto|遥感|卫星|影像)/.test(description)) return "raster";
  if (/(3d|building|extrusion|extrude|建筑|三维|高度|height)/.test(description)) return "fill-extrusion-lite";
  if (/(route|road|path|line|network|trail|线路|道路|路径|线)/.test(description)) return "line";
  if (/(point|city|location|poi|站点|点|城市|位置)/.test(description)) return "circle";
  if (/(name|text|文字)/.test(description)) return "symbol-lite";
  // Default: fill
  return "fill";
}

function inferDataType(description: string, vizType: VisualizationType): "geojson" | "vector-tiles" | "raster" {
  if (vizType === "raster") return "raster";
  if (/(vector.?tile|tile.?server|mvt|矢量切片)/.test(description)) return "vector-tiles";
  if (/(raster.?tile|栅格)/.test(description)) return "raster";
  return "geojson";
}

/* ─── Theme Palettes ────────────────────────────────────────────────────── */

type ThemeName = "dark" | "light" | "satellite" | "ocean" | "forest" | "warm";

interface ThemePalette {
  fill: string;
  line: string;
  circle: string;
  text: string;
  background: string;
}

const THEME_PALETTES: Record<ThemeName, ThemePalette> = {
  dark: { fill: "#4a90d9", line: "#2c5f8a", circle: "#e74c3c", text: "#ffffff", background: "#1a1a2e" },
  light: { fill: "#62b6e7", line: "#3a7ca5", circle: "#e63946", text: "#333333", background: "#f8f9fa" },
  satellite: { fill: "#ff9f1c", line: "#e71d36", circle: "#2ec4b6", text: "#ffffff", background: "#0b132b" },
  ocean: { fill: "#48cae4", line: "#0077b6", circle: "#00b4d8", text: "#caf0f8", background: "#03045e" },
  forest: { fill: "#52b788", line: "#2d6a4f", circle: "#d4a373", text: "#d8f3dc", background: "#1b4332" },
  warm: { fill: "#ff6b6b", line: "#c44536", circle: "#ffd93d", text: "#fff5e1", background: "#3d0c02" },
};

// Choropleth gradient ramps (5-stop)
const CHOROPLETH_RAMPS: Record<ThemeName, string[]> = {
  dark: ["#1a1a2e", "#16537e", "#f4a261", "#e76f51", "#d62828"],
  light: ["#f0f0f0", "#a8d5e2", "#48a9a6", "#d4a373", "#c1121f"],
  satellite: ["#0b132b", "#1b4965", "#62b6e7", "#f4a261", "#e76f51"],
  ocean: ["#caf0f8", "#90e0ef", "#00b4d8", "#0077b6", "#03045e"],
  forest: ["#d8f3dc", "#95d5b2", "#52b788", "#2d6a4f", "#1b4332"],
  warm: ["#fff5e1", "#ffd93d", "#ff6b6b", "#c44536", "#7b2cbf"],
};

function getChoroplethRamp(theme: ThemeName): string[] {
  return CHOROPLETH_RAMPS[theme] ?? CHOROPLETH_RAMPS.dark;
}

/* ─── Data Property Detection ───────────────────────────────────────────── */

const COMMON_DATA_PROPERTIES: Record<string, string> = {
  population: "population",
  人口: "population",
  gdp: "gdp",
  经济: "gdp",
  income: "income",
  收入: "income",
  temperature: "temperature",
  温度: "temperature",
  rainfall: "rainfall",
  降雨: "rainfall",
  density: "density",
  密度: "density",
  magnitude: "magnitude",
  震级: "magnitude",
  price: "price",
  价格: "price",
  elevation: "elevation",
  海拔: "elevation",
  count: "count",
  数量: "count",
  rate: "rate",
  比率: "rate",
};

function detectDataProperty(description: string, explicit?: string): string {
  if (explicit) return explicit;
  for (const [keyword, prop] of Object.entries(COMMON_DATA_PROPERTIES)) {
    if (description.includes(keyword)) return prop;
  }
  return "value";
}

/* ─── Source Builder ────────────────────────────────────────────────────── */

function buildSource(dataType: "geojson" | "vector-tiles" | "raster", _description: string, vizType: VisualizationType): SourceSpec {
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

  // GeoJSON with sample data
  return {
    type: "geojson",
    data: buildSampleGeoJSON(vizType),
  };
}

/* ─── Sample GeoJSON Generator ──────────────────────────────────────────── */

interface FeatureCollection {
  type: "FeatureCollection";
  features: Feature[];
}

interface Feature {
  type: "Feature";
  geometry: { type: string; coordinates: unknown };
  properties: Record<string, unknown> | null;
}

function buildSampleGeoJSON(vizType: string): FeatureCollection {
  if (vizType === "choropleth") {
    return {
      type: "FeatureCollection",
      features: [
        makePolygonFeature([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]], { name: "Region A", population: 1200000 }),
        makePolygonFeature([[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]], { name: "Region B", population: 3500000 }),
        makePolygonFeature([[2, 0], [3, 0], [3, 1], [2, 1], [2, 0]], { name: "Region C", population: 800000 }),
        makePolygonFeature([[0, 1], [1, 1], [1, 2], [0, 2], [0, 1]], { name: "Region D", population: 5200000 }),
        makePolygonFeature([[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]], { name: "Region E", population: 2100000 }),
        makePolygonFeature([[2, 1], [3, 1], [3, 2], [2, 2], [2, 1]], { name: "Region F", population: 4700000 }),
      ],
    };
  }

  if (vizType === "heatmap") {
    const features: Feature[] = [];
    for (let i = 0; i < 25; i++) {
      const lng = 116.0 + Math.random() * 2;
      const lat = 39.0 + Math.random() * 2;
      features.push(makePointFeature([lng, lat], { name: `Hotspot ${i + 1}`, intensity: Math.random() * 100 }));
    }
    return { type: "FeatureCollection", features };
  }

  if (vizType === "graduated-circle") {
    return {
      type: "FeatureCollection",
      features: [
        makePointFeature([116.4, 39.9], { name: "Station A", magnitude: 2.1 }),
        makePointFeature([121.5, 31.2], { name: "Station B", magnitude: 5.8 }),
        makePointFeature([113.3, 23.1], { name: "Station C", magnitude: 3.4 }),
        makePointFeature([104.1, 30.6], { name: "Station D", magnitude: 7.2 }),
        makePointFeature([120.2, 29.3], { name: "Station E", magnitude: 4.5 }),
        makePointFeature([114.1, 22.5], { name: "Station F", magnitude: 6.1 }),
        makePointFeature([108.9, 34.3], { name: "Station G", magnitude: 1.8 }),
        makePointFeature([106.6, 29.6], { name: "Station H", magnitude: 8.9 }),
        makePointFeature([117.0, 36.7], { name: "Station I", magnitude: 3.0 }),
        makePointFeature([113.6, 34.7], { name: "Station J", magnitude: 5.5 }),
      ],
    };
  }

  // Default: Point features
  return {
    type: "FeatureCollection",
    features: [
      makePointFeature([0, 0], { name: "Placeholder" }),
    ],
  };
}

function makePointFeature(coords: [number, number], properties: Record<string, unknown>): Feature {
  return { type: "Feature", geometry: { type: "Point", coordinates: coords }, properties };
}

function makePolygonFeature(coords: number[][], properties: Record<string, unknown>): Feature {
  return { type: "Feature", geometry: { type: "Polygon", coordinates: [coords] }, properties };
}

/* ─── Layer Builders ────────────────────────────────────────────────────── */

function buildLayers(
  sourceId: string,
  vizType: VisualizationType,
  theme: ThemeName,
  description: string,
  dataProperty?: string,
): LayerSpec[] {
  const palette = THEME_PALETTES[theme] as ThemePalette;
  const prop = detectDataProperty(description, dataProperty);

  // New viz types
  if (vizType === "choropleth") return buildChoroplethLayer(sourceId, theme, description, prop);
  if (vizType === "graduated-circle") return buildGraduatedCircleLayer(sourceId, palette, prop);
  if (vizType === "heatmap") return buildHeatmapLayer(sourceId, prop);
  if (vizType === "symbol") return buildSymbolLayer(sourceId, palette);

  // Raster
  if (vizType === "raster") {
    return [{ id: "raster-layer", type: "raster", source: sourceId, paint: { "raster-opacity": 1.0 } }];
  }

  // Circle
  if (vizType === "circle") {
    return [{
      id: "point-layer", type: "circle", source: sourceId,
      paint: {
        "circle-radius": 6,
        "circle-color": palette.circle,
        "circle-stroke-width": 1,
        "circle-stroke-color": theme === "dark" || theme === "satellite" ? "#1e3a5f" : "#ffffff",
      },
    }];
  }

  // Line
  if (vizType === "line") {
    return [{
      id: "line-layer", type: "line", source: sourceId,
      paint: { "line-color": palette.line, "line-width": 2 },
    }];
  }

  // Fill-extrusion-lite
  if (vizType === "fill-extrusion-lite") {
    return [{
      id: "extrusion-layer", type: "fill-extrusion-lite", source: sourceId,
      paint: {
        "fill-extrusion-color": theme === "dark" || theme === "satellite" ? "#4b5563" : "#9ca3af",
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-opacity": 0.8,
      },
    }];
  }

  // Symbol-lite (backward compat)
  if (vizType === "symbol-lite") {
    return [{
      id: "label-layer", type: "symbol-lite", source: sourceId,
      layout: { "text-field": ["get", "name"] },
      paint: { "text-color": palette.text },
    }];
  }

  // Default: fill
  return [
    {
      id: "fill-layer", type: "fill", source: sourceId,
      paint: { "fill-color": palette.fill, "fill-opacity": 0.7 },
    },
    {
      id: "outline-layer", type: "line", source: sourceId,
      paint: { "line-color": palette.line, "line-width": 1 },
    },
  ];
}

/* ─── New Data-Driven Layer Builders ────────────────────────────────────── */

function buildChoroplethLayer(sourceId: string, theme: ThemeName, _description: string, prop: string): LayerSpec[] {
  const ramp = getChoroplethRamp(theme);
  return [
    {
      id: "choropleth-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": [
          "interpolate", ["linear"], ["get", prop],
          0, ramp[0],
          1000000, ramp[1],
          2000000, ramp[2],
          5000000, ramp[3],
          10000000, ramp[4],
        ],
        "fill-opacity": 0.8,
      },
    },
    {
      id: "choropleth-outline",
      type: "line",
      source: sourceId,
      paint: {
        "line-color": (THEME_PALETTES[theme] as ThemePalette).line,
        "line-width": 1,
      },
    },
  ];
}

function buildGraduatedCircleLayer(sourceId: string, palette: ThemePalette, prop: string): LayerSpec[] {
  return [
    {
      id: "graduated-circle-layer",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-radius": [
          "interpolate", ["linear"], ["get", prop],
          0, 4,
          5, 12,
          10, 28,
        ],
        "circle-color": palette.circle,
        "circle-stroke-width": 1,
        "circle-stroke-color": palette.background,
        "circle-opacity": 0.8,
      },
    },
  ];
}

function buildHeatmapLayer(sourceId: string, prop: string): LayerSpec[] {
  return [
    {
      id: "heatmap-layer",
      type: "heatmap",
      source: sourceId,
      paint: {
        "heatmap-weight": ["get", prop],
        "heatmap-intensity": 1.5,
        "heatmap-radius": 20,
        "heatmap-color": [
          "interpolate", ["linear"], ["heatmap-density"],
          0, "rgba(0,0,0,0)",
          0.2, "#3b82f6",
          0.5, "#f59e0b",
          1, "#ef4444",
        ],
      },
    },
  ];
}

function buildSymbolLayer(sourceId: string, palette: ThemePalette): LayerSpec[] {
  return [
    {
      id: "symbol-label-layer",
      type: "symbol",
      source: sourceId,
      layout: {
        "text-field": ["get", "name"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 0, 10, 22, 24],
      },
      paint: {
        "text-color": palette.text,
        "text-halo-color": palette.background,
        "text-halo-width": 2,
      },
    },
  ];
}

/* ─── Multi-Layer Composition ───────────────────────────────────────────── */

interface LayerIntent {
  vizType: VisualizationType;
  keyword: string;
}

const MULTI_LAYER_INTENTS: LayerIntent[] = [
  { vizType: "line", keyword: "road" },
  { vizType: "line", keyword: "道路" },
  { vizType: "line", keyword: "route" },
  { vizType: "fill", keyword: "building" },
  { vizType: "fill", keyword: "建筑" },
  { vizType: "fill", keyword: "region" },
  { vizType: "fill", keyword: "区域" },
  { vizType: "fill", keyword: "area" },
  { vizType: "symbol", keyword: "label" },
  { vizType: "symbol", keyword: "标注" },
  { vizType: "symbol", keyword: "point of interest" },
  { vizType: "symbol", keyword: "兴趣点" },
  { vizType: "circle", keyword: "point" },
  { vizType: "circle", keyword: "站点" },
  { vizType: "heatmap", keyword: "heatmap" },
  { vizType: "heatmap", keyword: "热力" },
  { vizType: "heatmap", keyword: "density" },
  { vizType: "choropleth", keyword: "choropleth" },
  { vizType: "choropleth", keyword: "population" },
  { vizType: "fill-extrusion-lite", keyword: "3d" },
  { vizType: "fill-extrusion-lite", keyword: "三维" },
];

function buildMultiLayerSpec(
  sourceId: string,
  theme: ThemeName,
  description: string,
  dataProperty?: string,
): LayerSpec[] {
  const palette = THEME_PALETTES[theme] as ThemePalette;
  const prop = detectDataProperty(description, dataProperty);
  const detected = new Set<VisualizationType>();

  for (const intent of MULTI_LAYER_INTENTS) {
    if (description.includes(intent.keyword)) {
      detected.add(intent.vizType);
    }
  }

  // If only 0 or 1 types detected, fall back to a default multi-layer (fill + outline + symbol)
  if (detected.size <= 1) {
    const baseType: VisualizationType = detected.size === 1 ? ([...detected][0] as VisualizationType) : "fill";
    const layers = buildLayers(sourceId, baseType, theme, description, dataProperty);
    // Append a symbol layer for labels if not already present
    if (!layers.some((l) => l.type === "symbol" || l.type === "symbol-lite")) {
      layers.push(...buildSymbolLayer(sourceId, palette));
    }
    return layers;
  }

  // Build each detected layer type
  const layers: LayerSpec[] = [];
  for (const vizType of detected) {
    const sub = buildLayers(sourceId, vizType, theme, description, prop);
    for (const l of sub) {
      // Avoid duplicate IDs by prefixing
      if (layers.some((existing) => existing.id === l.id)) {
        l.id = `${l.id}-${layers.length}`;
      }
      layers.push(l);
    }
  }

  return layers;
}
