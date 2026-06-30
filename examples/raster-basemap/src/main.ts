// =============================================================================
// GIS Engine - Raster Basemap Example
// =============================================================================
//
// Combines a raster tile basemap with an inline GeoJSON vector overlay,
// demonstrating raster/vector layering.
//
// Note: The original map.json references local tiles at ./tiles/{z}/{x}/{y}.png.
// This runnable version uses OpenStreetMap tiles so you can see the
// raster/vector compositing without setting up local tiles.
//
// =============================================================================

import type { MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Step 1: Define the MapSpec
// ---------------------------------------------------------------------------
// The spec registers a raster source and an inline GeoJSON source, then layers
// a raster basemap beneath a vector line overlay.
//
// For local development with your own tiles, replace the tiles URL with:
//   tiles: ["./tiles/{z}/{x}/{y}.png"]
// and place your PNG tiles in the public/ directory.
// ---------------------------------------------------------------------------

const spec: MapSpec = {
  version: "0.1",
  id: "raster-basemap-example",
  view: {
    mode: "map2d",
    center: [120.15, 30.28],
    zoom: 10,
  },
  sources: {
    "local-raster": {
      type: "raster",
      tiles: [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors (runnable substitute for local tiles)",
    },
    // Inline GeoJSON: a rectangular polygon representing a city boundary.
    "city-boundary": {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              name: "demo-boundary",
            },
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [120.02, 30.18],
                  [120.3, 30.18],
                  [120.3, 30.38],
                  [120.02, 30.38],
                  [120.02, 30.18],
                ],
              ],
            },
          },
        ],
      },
    },
  },
  layers: [
    {
      id: "basemap-raster",
      type: "raster",
      source: "local-raster",
      paint: {
        "raster-opacity": 0.92,
      },
    },
    {
      id: "boundary-line",
      type: "line",
      source: "city-boundary",
      paint: {
        "line-color": "#0f766e",
        "line-width": 2,
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Step 2: Validate and render
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const report = validateSpec(spec);

  console.log("--- Validation Report ---");
  console.log(`Valid: ${report.valid}`);
  console.log(`Sources: ${report.stats.sourceCount}`);
  console.log(`Layers: ${report.stats.layerCount}`);

  if (!report.valid) {
    console.error("Spec validation failed:");
    for (const diagnostic of report.diagnostics) {
      console.error(`  [${diagnostic.severity}] ${diagnostic.code}: ${diagnostic.message}`);
    }
    throw new Error("Cannot proceed with an invalid spec.");
  }

  const container = document.getElementById("map");
  if (!container) throw new Error("Missing #map container.");

  const runtime = await createMap(container, spec, {
    renderer: "maplibre",
  });

  console.log("Map rendered successfully.");
  console.log(`Exported spec has ${runtime.exportSpec().layers.length} layer(s).`);
}

void main().catch((error) => {
  console.error("Raster basemap example failed:", error);
});
