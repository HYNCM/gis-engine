// =============================================================================
// GIS Engine - Data Driven Styling Example
// =============================================================================
//
// Demonstrates conditional rendering based on feature properties using:
//   - match expression: discrete category-to-color mapping
//   - interpolate expression: continuous numeric range mapping
//   - case expression: conditional branching with fallback
//   - step expression: discrete thresholds for sizing
//
// Each point has "category" and "value" properties that drive the visual style.
//
// =============================================================================

import type { MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Step 1: Inline GeoJSON data with category and value properties
// ---------------------------------------------------------------------------

const pointsData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Restaurant A", category: "food", value: 85 },
      geometry: { type: "Point", coordinates: [120.12, 30.26] },
    },
    {
      type: "Feature",
      properties: { name: "Restaurant B", category: "food", value: 72 },
      geometry: { type: "Point", coordinates: [120.15, 30.27] },
    },
    {
      type: "Feature",
      properties: { name: "Park X", category: "nature", value: 95 },
      geometry: { type: "Point", coordinates: [120.18, 30.29] },
    },
    {
      type: "Feature",
      properties: { name: "Park Y", category: "nature", value: 60 },
      geometry: { type: "Point", coordinates: [120.22, 30.31] },
    },
    {
      type: "Feature",
      properties: { name: "Museum 1", category: "culture", value: 45 },
      geometry: { type: "Point", coordinates: [120.14, 30.3] },
    },
    {
      type: "Feature",
      properties: { name: "Museum 2", category: "culture", value: 88 },
      geometry: { type: "Point", coordinates: [120.2, 30.26] },
    },
    {
      type: "Feature",
      properties: { name: "Hotel Alpha", category: "lodging", value: 30 },
      geometry: { type: "Point", coordinates: [120.16, 30.25] },
    },
    {
      type: "Feature",
      properties: { name: "Hotel Beta", category: "lodging", value: 92 },
      geometry: { type: "Point", coordinates: [120.24, 30.28] },
    },
    {
      type: "Feature",
      properties: { name: "Shop 1", category: "shopping", value: 55 },
      geometry: { type: "Point", coordinates: [120.13, 30.28] },
    },
    {
      type: "Feature",
      properties: { name: "Shop 2", category: "shopping", value: 78 },
      geometry: { type: "Point", coordinates: [120.21, 30.3] },
    },
  ],
};

// ---------------------------------------------------------------------------
// Step 2: Define the MapSpec with data-driven expressions
// ---------------------------------------------------------------------------

const spec: MapSpec = {
  version: "0.1",
  id: "data-driven-styling",
  view: {
    mode: "map2d",
    center: [120.17, 30.28],
    zoom: 12,
  },
  sources: {
    pois: {
      type: "geojson",
      data: pointsData,
    },
  },
  layers: [
    // Circle layer: color by category (match), size by value (interpolate)
    {
      id: "poi-circles",
      type: "circle",
      source: "pois",
      paint: {
        // match expression: discrete category → color mapping
        "circle-color": [
          "match",
          ["get", "category"],
          "food",
          "#ef4444",
          "nature",
          "#22c55e",
          "culture",
          "#a855f7",
          "lodging",
          "#f97316",
          "shopping",
          "#06b6d4",
          "#94a3b8", // fallback color
        ],
        // interpolate expression: continuous value → radius mapping
        "circle-radius": ["interpolate", ["linear"], ["get", "value"], 0, 4, 50, 8, 100, 16],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
        // case expression: conditional opacity based on value threshold
        "circle-opacity": ["case", [">=", ["get", "value"], 70], 1.0, [">=", ["get", "value"], 40], 0.7, 0.4],
      },
    },
    // Label layer using step expression for text size
    {
      id: "poi-labels",
      type: "symbol-lite",
      source: "pois",
      layout: {
        "text-field": ["get", "name"],
        // step expression: discrete thresholds for text size
        "text-size": ["step", ["get", "value"], 10, 50, 12, 80, 14],
        "text-offset": [0, 1.6],
      },
      paint: {
        "text-color": "#1e293b",
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Step 3: Validate and render
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const report = validateSpec(spec);

  console.log("--- Validation Report ---");
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

  const runtime = await createMap(container, spec, { renderer: "maplibre" });

  console.log("Map rendered successfully.");
  console.log(`Exported spec has ${runtime.exportSpec().layers.length} layer(s).`);
}

void main().catch((error) => {
  console.error("Data driven styling example failed:", error);
});
