// =============================================================================
// GIS Engine - Vector Tile URL Example
// =============================================================================
//
// Demonstrates loading vector tiles from a URL template with data-driven
// expression styling for fill and line layers.
//
// Note: The original map.json references local tiles at ./tiles/{z}/{x}/{y}.pbf.
// This runnable version uses the MapLibre demo-tile-server so you can see
// data-driven styling in action without setting up local tiles.
//
// =============================================================================

import type { MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Step 1: Define the MapSpec
// ---------------------------------------------------------------------------
// The spec uses a vector tile source with URL template and applies data-driven
// paint expressions (match, case, step, get) to fill and line layers.
//
// For local development with your own tiles, replace the tiles URL with:
//   tiles: ["./tiles/{z}/{x}/{y}.pbf"]
// and place your .pbf tiles in the public/ directory.
// ---------------------------------------------------------------------------

const spec: MapSpec = {
  version: "0.1",
  id: "vector-tile-url-example",
  view: {
    mode: "map2d",
    center: [120.15, 30.28],
    zoom: 12,
  },
  sources: {
    "local-parcels": {
      type: "vector",
      tiles: [
        "https://demotiles.maplibre.org/tiles/{z}/{x}/{y}.pbf",
      ],
      minzoom: 0,
      maxzoom: 14,
      attribution: "MapLibre demo tiles (runnable substitute for local tiles)",
    },
  },
  layers: [
    {
      id: "parcel-fill",
      type: "fill",
      source: "local-parcels",
      metadata: {
        "source-layer": "countries",
      },
      paint: {
        // Data-driven fill color: match expression maps feature "class" to colors.
        // Using the demo-tiles "countries" layer as a stand-in for parcels.
        "fill-color": [
          "match",
          ["to-string", ["get", "continent"]],
          "Asia", "#22c55e",
          "Europe", "#38bdf8",
          "Africa", "#f97316",
          "North America", "#a855f7",
          "South America", "#eab308",
          "#94a3b8",
        ],
        "fill-opacity": 0.42,
      },
    },
    {
      id: "parcel-outline",
      type: "line",
      source: "local-parcels",
      metadata: {
        "source-layer": "countries",
      },
      paint: {
        "line-color": "#14532d",
        // Zoom-dependent line width via step expression.
        "line-width": ["step", ["zoom"], 0.5, 12, 1, 14, 2],
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
  console.error("Vector tile URL example failed:", error);
});
