// =============================================================================
// GIS Engine - Symbol Labels Example
// =============================================================================
//
// Demonstrates the full symbol layer type with text and icon annotations.
// 12 world cities are rendered as labeled markers with zoom-dependent sizing,
// text halos, and overlap control.
//
// =============================================================================

import type { MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// 12 world cities with population, country, and category data
// ---------------------------------------------------------------------------

const cityFeatures: GeoJSON.Feature[] = [
  { type: "Feature", geometry: { type: "Point", coordinates: [139.69, 35.68] }, properties: { name: "Tokyo", population: 37400068, country: "Japan", type: "megacity" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-74.0, 40.71] }, properties: { name: "New York", population: 18819000, country: "USA", type: "megacity" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-0.12, 51.51] }, properties: { name: "London", population: 9540000, country: "UK", type: "capital" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [2.35, 48.86] }, properties: { name: "Paris", population: 11020000, country: "France", type: "capital" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [37.62, 55.76] }, properties: { name: "Moscow", population: 12506468, country: "Russia", type: "capital" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [116.40, 39.90] }, properties: { name: "Beijing", population: 21540000, country: "China", type: "megacity" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [28.98, 41.01] }, properties: { name: "Istanbul", population: 15620000, country: "Turkey", type: "megacity" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [72.88, 19.08] }, properties: { name: "Mumbai", population: 20667656, country: "India", type: "megacity" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [31.24, 30.04] }, properties: { name: "Cairo", population: 21750020, country: "Egypt", type: "capital" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-43.17, -22.91] }, properties: { name: "Rio de Janeiro", population: 6748000, country: "Brazil", type: "major" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [151.21, -33.87] }, properties: { name: "Sydney", population: 5312000, country: "Australia", type: "major" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [36.82, -1.29] }, properties: { name: "Nairobi", population: 4397073, country: "Kenya", type: "capital" } },
];

// ---------------------------------------------------------------------------
// MapSpec: symbol layer with text + icon
// ---------------------------------------------------------------------------

const spec: MapSpec = {
  version: "0.1",
  id: "symbol-labels-demo",
  view: {
    mode: "map2d",
    center: [30, 25],
    zoom: 2.5,
  },
  sources: {
    cities: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: cityFeatures,
      } as GeoJSON.FeatureCollection,
    },
  },
  layers: [
    {
      id: "city-labels",
      type: "symbol",
      source: "cities",
      layout: {
        // Text label: city name
        "text-field": ["get", "name"],
        // Zoom-dependent text size: small at low zoom, larger when zoomed in
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          2, 10,
          10, 20,
        ],
        "text-anchor": "top",
        "text-offset": [0, 1],
        "text-font": ["Open Sans Regular"],
        // Icon marker
        "icon-image": "marker-15",
        "icon-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          2, 0.8,
          10, 1.5,
        ],
        // Prevent label and icon overlap
        "text-allow-overlap": false,
        "icon-allow-overlap": false,
      },
      paint: {
        "text-color": [
          "match",
          ["get", "type"],
          "megacity", "#c62828",
          "capital", "#1565c0",
          "#333333",
        ],
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.5,
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Validate and render
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const report = validateSpec(spec);

  console.log("--- Symbol Labels Validation ---");
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

  const container = document.getElementById("map");
  if (!container) throw new Error("Missing #map container.");

  await createMap(container, spec, { renderer: "maplibre" });
  console.log("Symbol labels rendered successfully.");
}

void main().catch((err) => {
  console.error("Symbol labels example failed:", err);
});
