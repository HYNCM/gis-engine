// =============================================================================
// GIS Engine - Heatmap Density Example
// =============================================================================
//
// Demonstrates the heatmap layer type with:
//   - heatmap-weight: driven by earthquake magnitude via interpolate expression
//   - heatmap-intensity: zoom-dependent intensity scaling
//   - heatmap-radius: zoom-dependent radius scaling
//   - heatmap-color: multi-stop color ramp based on heatmap-density
//
// Simulates 40 earthquake events across the Pacific Ring of Fire.
//
// =============================================================================

import type { MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Step 1: Generate sample earthquake data (40 points)
// ---------------------------------------------------------------------------

function generateEarthquakeData() {
  const regions: Array<{ center: [number, number]; spread: number; count: number }> = [
    { center: [142.0, 38.0], spread: 3, count: 8 }, // Japan
    { center: [-122.0, 37.0], spread: 2, count: 6 }, // California
    { center: [175.0, -41.0], spread: 3, count: 5 }, // New Zealand
    { center: [121.0, 14.0], spread: 2, count: 5 }, // Philippines
    { center: [-71.0, -33.0], spread: 3, count: 6 }, // Chile
    { center: [28.0, 38.0], spread: 2, count: 5 }, // Turkey
    { center: [73.0, 33.0], spread: 2, count: 5 }, // Pakistan
  ];

  const features: Array<{
    type: "Feature";
    properties: { magnitude: number; depth: number; name: string };
    geometry: { type: "Point"; coordinates: [number, number] };
  }> = [];

  let idx = 0;
  for (const region of regions) {
    for (let i = 0; i < region.count; i++) {
      idx++;
      const lng = region.center[0] + (Math.random() - 0.5) * region.spread * 2;
      const lat = region.center[1] + (Math.random() - 0.5) * region.spread * 2;
      const magnitude = Math.round((1 + Math.random() * 8) * 10) / 10;
      const depth = Math.round(Math.random() * 700);
      features.push({
        type: "Feature",
        properties: {
          magnitude,
          depth,
          name: `EQ-${idx} M${magnitude}`,
        },
        geometry: { type: "Point", coordinates: [lng, lat] },
      });
    }
  }

  return { type: "FeatureCollection" as const, features };
}

// ---------------------------------------------------------------------------
// Step 2: Define the MapSpec with heatmap layer
// ---------------------------------------------------------------------------

const spec: MapSpec = {
  version: "0.1",
  id: "heatmap-density",
  view: {
    mode: "map2d",
    center: [0, 20],
    zoom: 2,
  },
  sources: {
    "earthquake-data": {
      type: "geojson",
      data: generateEarthquakeData(),
    },
  },
  layers: [
    {
      id: "earthquakes-heat",
      type: "heatmap",
      source: "earthquake-data",
      paint: {
        "heatmap-weight": ["interpolate", ["linear"], ["get", "magnitude"], 0, 0, 9, 1],
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 22, 3],
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 22, 20],
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(0,0,255,0)",
          0.1,
          "royalblue",
          0.3,
          "cyan",
          0.5,
          "lime",
          0.7,
          "yellow",
          1,
          "red",
        ],
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

  console.log("Heatmap rendered successfully.");
  console.log(`Exported spec has ${runtime.exportSpec().layers.length} layer(s).`);
}

void main().catch((error) => {
  console.error("Heatmap density example failed:", error);
});
