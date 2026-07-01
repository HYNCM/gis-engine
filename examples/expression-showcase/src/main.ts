// =============================================================================
// GIS Engine - Expression Showcase
// =============================================================================
//
// Demonstrates the four categories of expression capabilities added in v1.4.0:
//
//   1. Arithmetic expressions — population density via division
//   2. coalesce — graceful fallback when data fields are missing
//   3. String operations — concat, upcase for dynamic labels
//   4. Exponential interpolate — non-linear scaling for circle radius
//
// Each category is visualized as a separate layer using shared city data.
//
// =============================================================================

import type { MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Shared city data with varying properties to demonstrate coalesce and strings
// ---------------------------------------------------------------------------

const showcaseFeatures: GeoJSON.Feature[] = [
  { type: "Feature", geometry: { type: "Point", coordinates: [139.69, 35.68] }, properties: { name: "Tokyo", name_en: "Tokyo", code: "JP-TKY", population: 37400068, area: 13572, magnitude: 7.2 } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-74.0, 40.71] }, properties: { name: "New York", name_en: "New York", code: "US-NYC", population: 18819000, area: 13124, magnitude: 3.1 } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-0.12, 51.51] }, properties: { name: "London", code: "GB-LON", population: 9540000, area: 8382, magnitude: 2.8 } },
  { type: "Feature", geometry: { type: "Point", coordinates: [2.35, 48.86] }, properties: { name: "Paris", name_en: "Paris", code: "FR-PAR", population: 11020000, area: 10534, magnitude: 2.5 } },
  { type: "Feature", geometry: { type: "Point", coordinates: [116.40, 39.90] }, properties: { name: "北京", name_en: "Beijing", code: "CN-BJS", population: 21540000, area: 16410, magnitude: 5.4 } },
  { type: "Feature", geometry: { type: "Point", coordinates: [28.98, 41.01] }, properties: { name: "İstanbul", name_en: "Istanbul", code: "TR-IST", population: 15620000, area: 5343, magnitude: 6.8 } },
  { type: "Feature", geometry: { type: "Point", coordinates: [72.88, 19.08] }, properties: { name: "मुंबई", name_en: "Mumbai", population: 20667656, area: 4355, magnitude: 5.1 } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-43.17, -22.91] }, properties: { name: "Rio de Janeiro", name_en: "Rio de Janeiro", code: "BR-RIO", population: 6748000, area: 1255, magnitude: 4.0 } },
];

// ---------------------------------------------------------------------------
// MapSpec: 4 layers showcasing different expression categories
// ---------------------------------------------------------------------------

const spec: MapSpec = {
  version: "0.1",
  id: "expression-showcase",
  view: {
    mode: "map2d",
    center: [40, 25],
    zoom: 2,
  },
  sources: {
    cities: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: showcaseFeatures,
      } as GeoJSON.FeatureCollection,
    },
  },
  layers: [
    // -------------------------------------------------------------------------
    // Layer 1: Arithmetic — circle color by population density (pop / area)
    // -------------------------------------------------------------------------
    {
      id: "density-circles",
      type: "circle",
      source: "cities",
      paint: {
        // fill-color based on population density (people per km²)
        "circle-color": [
          "interpolate",
          ["linear"],
          ["/", ["get", "population"], ["get", "area"]],
          0, "#eff3ff",
          1000, "#6baed6",
          3000, "#2171b5",
          5000, "#084594",
        ],
        "circle-radius": 10,
        "circle-opacity": 0.7,
      },
    },

    // -------------------------------------------------------------------------
    // Layer 2: coalesce — fallback chain for text-field
    // -------------------------------------------------------------------------
    {
      id: "coalesce-labels",
      type: "symbol",
      source: "cities",
      layout: {
        // Fallback: name_en → name → "Unknown"
        // Some features lack name_en, demonstrating coalesce behavior
        "text-field": ["coalesce", ["get", "name_en"], ["get", "name"], "Unknown"],
        "text-size": 12,
        "text-anchor": "top",
        "text-offset": [0, 1.5],
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#1565c0",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1,
      },
    },

    // -------------------------------------------------------------------------
    // Layer 3: String operations — concat + upcase for code labels
    // -------------------------------------------------------------------------
    {
      id: "string-labels",
      type: "symbol",
      source: "cities",
      layout: {
        // concat: "City Name (CODE)" with upcase for the code
        "text-field": [
          "concat",
          ["coalesce", ["get", "name_en"], ["get", "name"]],
          " (",
          ["upcase", ["coalesce", ["get", "code"], "N/A"]],
          ")",
        ],
        "text-size": 9,
        "text-anchor": "bottom",
        "text-offset": [0, -1.5],
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#6a1b9a",
        "text-halo-color": "#f3e5f5",
        "text-halo-width": 0.8,
      },
    },

    // -------------------------------------------------------------------------
    // Layer 4: Exponential interpolate — non-linear circle radius by magnitude
    // -------------------------------------------------------------------------
    {
      id: "magnitude-circles",
      type: "circle",
      source: "cities",
      paint: {
        // Exponential interpolation with base 1.5
        "circle-radius": [
          "interpolate",
          ["exponential", 1.5],
          ["get", "magnitude"],
          0, 2,
          9, 50,
        ],
        "circle-color": [
          "interpolate",
          ["linear"],
          ["get", "magnitude"],
          0, "#a5d6a7",
          4, "#fdd835",
          7, "#ef6c00",
          9, "#b71c1c",
        ],
        "circle-opacity": 0.6,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#37474f",
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Validate and render
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const report = validateSpec(spec);

  console.log("--- Expression Showcase Validation ---");
  console.log(`Valid: ${report.valid}`);
  console.log(`Sources: ${report.stats.sourceCount}`);
  console.log(`Layers: ${report.stats.layerCount}`);

  if (!report.valid) {
    console.error("Spec validation failed:");
    for (const d of report.diagnostics) {
      console.error(`  [${d.severity}] ${d.code}: ${d.message}`);
    }
    throw new Error("Cannot proceed with an invalid spec.");
  }

  console.log("Expression categories demonstrated:");
  console.log("  1. Arithmetic (/) — density circles");
  console.log("  2. coalesce — fallback labels");
  console.log("  3. concat + upcase — code labels");
  console.log("  4. exponential interpolate — magnitude circles");

  const container = document.getElementById("map");
  if (!container) throw new Error("Missing #map container.");

  await createMap(container, spec, { renderer: "maplibre" });
  console.log("Expression showcase rendered successfully.");
}

void main().catch((err) => {
  console.error("Expression showcase example failed:", err);
});
