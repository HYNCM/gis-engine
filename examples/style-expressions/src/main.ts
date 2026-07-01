// =============================================================================
// GIS Engine - Style Expressions Example
// =============================================================================
//
// A catalog of MapSpec expression types, each demonstrated in a dedicated layer:
//   - interpolate (linear): continuous value → radius mapping
//   - match: discrete category → color mapping
//   - case: conditional branching with fallback
//   - step: discrete zoom thresholds for line width
//   - get / has: property access and existence checks
//   - math: arithmetic expressions (+, *, /)
//
// Open the legend panel (top-right) for a quick reference of each expression.
//
// =============================================================================

import type { MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Step 1: Inline GeoJSON data with varied properties
// ---------------------------------------------------------------------------

const pointsData = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { name: "Alpha", category: "A", value: 20, population: 5000 }, geometry: { type: "Point", coordinates: [120.10, 30.25] } },
    { type: "Feature", properties: { name: "Beta", category: "B", value: 45, population: 12000 }, geometry: { type: "Point", coordinates: [120.13, 30.27] } },
    { type: "Feature", properties: { name: "Gamma", category: "A", value: 70, population: 30000 }, geometry: { type: "Point", coordinates: [120.16, 30.29] } },
    { type: "Feature", properties: { name: "Delta", category: "C", value: 90, population: 8000 }, geometry: { type: "Point", coordinates: [120.19, 30.26] } },
    { type: "Feature", properties: { name: "Epsilon", category: "B", value: 35, population: 20000 }, geometry: { type: "Point", coordinates: [120.22, 30.28] } },
    { type: "Feature", properties: { name: "Zeta", category: "C", value: 60 }, geometry: { type: "Point", coordinates: [120.14, 30.31] } },
  ],
};

const polygonsData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { zone: "residential", density: 0.8 },
      geometry: { type: "Polygon", coordinates: [[[120.09, 30.24], [120.14, 30.24], [120.14, 30.27], [120.09, 30.27], [120.09, 30.24]]] },
    },
    {
      type: "Feature",
      properties: { zone: "commercial", density: 0.5 },
      geometry: { type: "Polygon", coordinates: [[[120.15, 30.24], [120.20, 30.24], [120.20, 30.28], [120.15, 30.28], [120.15, 30.24]]] },
    },
    {
      type: "Feature",
      properties: { zone: "industrial", density: 0.3 },
      geometry: { type: "Polygon", coordinates: [[[120.21, 30.25], [120.25, 30.25], [120.25, 30.29], [120.21, 30.29], [120.21, 30.25]]] },
    },
  ],
};

// ---------------------------------------------------------------------------
// Step 2: Define the MapSpec with expression catalog
// ---------------------------------------------------------------------------

const spec: MapSpec = {
  version: "0.1",
  id: "style-expressions-catalog",
  view: {
    mode: "map2d",
    center: [120.16, 30.27],
    zoom: 12,
  },
  sources: {
    points: { type: "geojson", data: pointsData },
    polygons: { type: "geojson", data: polygonsData },
  },
  layers: [
    // --- match expression: category → fill color ---
    {
      id: "zone-fill-match",
      type: "fill",
      source: "polygons",
      paint: {
        // match: discrete mapping from "zone" property to color
        "fill-color": [
          "match",
          ["get", "zone"],
          "residential", "#86efac",
          "commercial", "#93c5fd",
          "industrial", "#fde68a",
          "#e2e8f0", // fallback
        ],
        "fill-opacity": 0.5,
      },
    },

    // --- step expression: zoom-dependent line width ---
    {
      id: "zone-outline-step",
      type: "line",
      source: "polygons",
      paint: {
        "line-color": "#475569",
        // step: discrete thresholds based on zoom level
        "line-width": ["step", ["zoom"], 0.5, 11, 1, 13, 2, 15, 4],
      },
    },

    // --- interpolate (linear): value → circle radius ---
    {
      id: "points-radius-interpolate",
      type: "circle",
      source: "points",
      paint: {
        // interpolate: continuous mapping from "value" to radius
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "value"],
          0, 3,
          50, 8,
          100, 18,
        ],
        "circle-color": "#3b82f6",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
      },
    },

    // --- case expression: conditional opacity based on property existence ---
    {
      id: "points-opacity-case",
      type: "circle",
      source: "points",
      paint: {
        // case: if "population" exists and >= 10000 → full opacity, else 0.4
        "circle-opacity": [
          "case",
          ["has", "population"],
          [
            "case",
            [">=", ["get", "population"], 10000],
            1.0,
            0.6,
          ],
          0.3,
        ],
        "circle-color": "#f59e0b",
        "circle-radius": 5,
      },
    },

    // --- get expression: property access for label text ---
    {
      id: "points-labels-get",
      type: "symbol-lite",
      source: "points",
      layout: {
        // get: access the "name" property for text content
        "text-field": ["get", "name"],
        "text-size": 11,
        "text-offset": [0, 1.8],
      },
      paint: {
        "text-color": "#1e293b",
      },
    },

    // --- math expression: arithmetic for text size ---
    // text-size = 8 + (value / 10) — demonstrates + and / operators
    {
      id: "zone-labels-math",
      type: "symbol-lite",
      source: "polygons",
      layout: {
        "text-field": ["get", "zone"],
        // math: 8 + (density * 6) — density 0.3→9.8, 0.5→11, 0.8→12.8
        "text-size": ["+", 8, ["*", ["get", "density"], 6]],
        "text-transform": "uppercase",
      },
      paint: {
        "text-color": "#334155",
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
  console.log("\nExpression catalog:");
  console.log("  - match: zone-fill-match (category → color)");
  console.log("  - step: zone-outline-step (zoom → line width)");
  console.log("  - interpolate: points-radius-interpolate (value → radius)");
  console.log("  - case: points-opacity-case (conditional opacity)");
  console.log("  - get: points-labels-get (property → text)");
  console.log("  - math: zone-labels-math (arithmetic for text size)");
}

void main().catch((error) => {
  console.error("Style expressions example failed:", error);
});
