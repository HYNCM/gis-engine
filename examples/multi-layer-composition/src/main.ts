// =============================================================================
// GIS Engine - Multi Layer Composition Example
// =============================================================================
//
// Demonstrates stacking multiple layer types on a single GeoJSON source:
//   background, fill, line, circle, and symbol-lite layers.
// Layer order in the array determines rendering order (first = bottom).
//
// =============================================================================

import type { MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Step 1: Inline GeoJSON data
// ---------------------------------------------------------------------------
// A FeatureCollection with polygons and points so we can demonstrate
// different layer types on the same source.
// ---------------------------------------------------------------------------

const geoData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Park A", category: "park" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.10, 30.25],
            [120.18, 30.25],
            [120.18, 30.30],
            [120.10, 30.30],
            [120.10, 30.25],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Park B", category: "park" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.20, 30.26],
            [120.26, 30.26],
            [120.26, 30.32],
            [120.20, 30.32],
            [120.20, 30.26],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "POI 1", category: "poi" },
      geometry: { type: "Point", coordinates: [120.14, 30.275] },
    },
    {
      type: "Feature",
      properties: { name: "POI 2", category: "poi" },
      geometry: { type: "Point", coordinates: [120.23, 30.29] },
    },
    {
      type: "Feature",
      properties: { name: "POI 3", category: "poi" },
      geometry: { type: "Point", coordinates: [120.17, 30.285] },
    },
  ],
};

// ---------------------------------------------------------------------------
// Step 2: Define the MapSpec
// ---------------------------------------------------------------------------
// Five layers stacked: background → fill → line → circle → symbol-lite.
// Layer order controls z-ordering: the first layer is painted at the bottom.
// ---------------------------------------------------------------------------

const spec: MapSpec = {
  version: "0.1",
  id: "multi-layer-composition",
  view: {
    mode: "map2d",
    center: [120.17, 30.285],
    zoom: 12,
  },
  sources: {
    features: {
      type: "geojson",
      data: geoData,
    },
  },
  layers: [
    // Layer 1: background — fills the entire canvas
    {
      id: "bg",
      type: "background",
      paint: {
        "background-color": "#f0f4f8",
      },
    },
    // Layer 2: fill — polygon areas
    {
      id: "area-fill",
      type: "fill",
      source: "features",
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: {
        "fill-color": "#86efac",
        "fill-opacity": 0.5,
      },
    },
    // Layer 3: line — polygon outlines
    {
      id: "area-outline",
      type: "line",
      source: "features",
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: {
        "line-color": "#166534",
        "line-width": 2,
      },
    },
    // Layer 4: circle — point features
    {
      id: "poi-circles",
      type: "circle",
      source: "features",
      filter: ["==", ["geometry-type"], "Point"],
      paint: {
        "circle-radius": 7,
        "circle-color": "#2563eb",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
    },
    // Layer 5: symbol-lite — text labels on points
    {
      id: "poi-labels",
      type: "symbol-lite",
      source: "features",
      filter: ["==", ["geometry-type"], "Point"],
      layout: {
        "text-field": ["get", "name"],
        "text-size": 12,
        "text-offset": [0, 1.4],
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
  console.error("Multi layer composition example failed:", error);
});
