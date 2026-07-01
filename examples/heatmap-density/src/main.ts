// =============================================================================
// GIS Engine - Heatmap Density Example
// =============================================================================
//
// Demonstrates the heatmap layer type with heatmap-density expressions.
// Simulated earthquake data is visualized as a heat distribution map,
// using magnitude to weight each point and heatmap-density for color ramping.
//
// =============================================================================

import type { MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Earthquake data — 40 simulated seismic events distributed across 7 regions
// ---------------------------------------------------------------------------

const earthquakeFeatures = [
  // Pacific Ring of Fire — Japan
  { type: "Feature", geometry: { type: "Point", coordinates: [139.69, 35.68] }, properties: { magnitude: 6.2, depth: 30, region: "Japan" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [140.1, 36.5] }, properties: { magnitude: 4.8, depth: 120, region: "Japan" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [141.8, 39.0] }, properties: { magnitude: 7.1, depth: 45, region: "Japan" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [138.5, 34.5] }, properties: { magnitude: 3.5, depth: 200, region: "Japan" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [143.2, 42.0] }, properties: { magnitude: 5.0, depth: 60, region: "Japan" } },

  // Indonesia / Philippines
  { type: "Feature", geometry: { type: "Point", coordinates: [106.8, -6.2] }, properties: { magnitude: 5.5, depth: 90, region: "Indonesia" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [110.4, -7.5] }, properties: { magnitude: 6.8, depth: 35, region: "Indonesia" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [115.2, -8.3] }, properties: { magnitude: 4.2, depth: 150, region: "Indonesia" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [121.0, 14.5] }, properties: { magnitude: 5.9, depth: 75, region: "Philippines" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [123.5, 10.0] }, properties: { magnitude: 7.5, depth: 20, region: "Philippines" } },

  // Chile / Peru
  { type: "Feature", geometry: { type: "Point", coordinates: [-70.6, -33.4] }, properties: { magnitude: 8.1, depth: 25, region: "Chile" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-71.5, -30.0] }, properties: { magnitude: 5.3, depth: 80, region: "Chile" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-69.0, -22.5] }, properties: { magnitude: 4.7, depth: 130, region: "Chile" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-77.0, -12.0] }, properties: { magnitude: 6.0, depth: 50, region: "Peru" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-75.5, -15.5] }, properties: { magnitude: 5.2, depth: 95, region: "Peru" } },

  // California / Alaska
  { type: "Feature", geometry: { type: "Point", coordinates: [-118.2, 34.0] }, properties: { magnitude: 4.5, depth: 10, region: "California" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-122.4, 37.8] }, properties: { magnitude: 5.1, depth: 8, region: "California" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-121.5, 36.5] }, properties: { magnitude: 3.8, depth: 15, region: "California" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-150.0, 61.2] }, properties: { magnitude: 7.8, depth: 40, region: "Alaska" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-147.5, 64.0] }, properties: { magnitude: 5.6, depth: 20, region: "Alaska" } },

  // Turkey / Iran
  { type: "Feature", geometry: { type: "Point", coordinates: [28.9, 41.0] }, properties: { magnitude: 7.4, depth: 15, region: "Turkey" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [32.8, 39.9] }, properties: { magnitude: 5.0, depth: 7, region: "Turkey" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [36.2, 37.0] }, properties: { magnitude: 6.7, depth: 12, region: "Turkey" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [51.4, 35.7] }, properties: { magnitude: 6.1, depth: 55, region: "Iran" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [59.5, 36.3] }, properties: { magnitude: 7.3, depth: 28, region: "Iran" } },

  // New Zealand
  { type: "Feature", geometry: { type: "Point", coordinates: [174.7, -36.8] }, properties: { magnitude: 5.8, depth: 100, region: "New Zealand" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [172.6, -43.5] }, properties: { magnitude: 6.9, depth: 22, region: "New Zealand" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [176.0, -38.1] }, properties: { magnitude: 4.3, depth: 170, region: "New Zealand" } },

  // Himalaya region
  { type: "Feature", geometry: { type: "Point", coordinates: [85.3, 27.7] }, properties: { magnitude: 7.8, depth: 15, region: "Nepal" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [84.0, 28.2] }, properties: { magnitude: 5.4, depth: 25, region: "Nepal" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [77.2, 28.6] }, properties: { magnitude: 4.9, depth: 40, region: "India" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [73.0, 33.7] }, properties: { magnitude: 6.5, depth: 60, region: "Pakistan" } },

  // Mediterranean
  { type: "Feature", geometry: { type: "Point", coordinates: [15.3, 37.5] }, properties: { magnitude: 6.4, depth: 18, region: "Italy" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [22.4, 38.0] }, properties: { magnitude: 5.7, depth: 22, region: "Greece" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [26.1, 39.5] }, properties: { magnitude: 5.1, depth: 10, region: "Greece" } },

  // Mid-Atlantic ridge
  { type: "Feature", geometry: { type: "Point", coordinates: [-29.0, 38.5] }, properties: { magnitude: 4.1, depth: 5, region: "Azores" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-18.0, 32.0] }, properties: { magnitude: 3.9, depth: 10, region: "Madeira" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-22.0, 64.0] }, properties: { magnitude: 5.5, depth: 8, region: "Iceland" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-19.0, 63.8] }, properties: { magnitude: 4.7, depth: 5, region: "Iceland" } },
  { type: "Feature", geometry: { type: "Point", coordinates: [-17.5, 64.2] }, properties: { magnitude: 6.0, depth: 3, region: "Iceland" } },
].map((f, i) => ({ ...f, id: i }));

// ---------------------------------------------------------------------------
// MapSpec: heatmap layer using heatmap-density color ramp
// ---------------------------------------------------------------------------

const spec: MapSpec = {
  version: "0.1",
  id: "heatmap-density-demo",
  view: {
    mode: "map2d",
    center: [20, 20],
    zoom: 2,
  },
  sources: {
    "earthquake-data": {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: earthquakeFeatures,
      } as GeoJSON.FeatureCollection,
    },
  },
  layers: [
    {
      id: "earthquakes-heat",
      type: "heatmap",
      source: "earthquake-data",
      paint: {
        // Weight by magnitude: stronger quakes contribute more heat
        "heatmap-weight": [
          "interpolate",
          ["linear"],
          ["get", "magnitude"],
          0, 0,
          9, 1,
        ],
        // Increase intensity at higher zoom levels
        "heatmap-intensity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0, 1,
          22, 3,
        ],
        // Expand radius as user zooms in
        "heatmap-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0, 2,
          22, 20,
        ],
        // Color ramp driven by heatmap-density expression
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0, "rgba(0,0,255,0)",
          0.1, "royalblue",
          0.3, "cyan",
          0.5, "lime",
          0.7, "yellow",
          1, "red",
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Validate and render
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const report = validateSpec(spec);

  console.log("--- Heatmap Density Validation ---");
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
  console.log("Heatmap rendered successfully.");
}

void main().catch((err) => {
  console.error("Heatmap density example failed:", err);
});
