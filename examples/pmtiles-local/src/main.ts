// =============================================================================
// GIS Engine - PMTiles Local Example
// =============================================================================
//
// Demonstrates the PMTiles source contract in GIS Engine. The MapSpec declares
// a pmtiles source with fill and line layers targeting a "parcels" layer.
//
// Note: The original map.json references a local file at ./data/parcels.pmtiles.
// This runnable version uses a public PMTiles endpoint (Overture Maps) so you
// can see the PMTiles display contract in action without a local file.
//
// The MapLibre adapter currently maps pmtiles sources to vector source URLs
// with a diagnostic warning. This is an MVP-level mapping; full PMTiles runtime
// loader support is tracked in the roadmap.
//
// =============================================================================

import type { MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Step 1: Define the MapSpec
// ---------------------------------------------------------------------------
// The spec declares a pmtiles source and two layers (fill + line).
// For local development, replace the URL with:
//   url: "./data/parcels.pmtiles"
// and place your .pmtiles file in the public/ directory.
// ---------------------------------------------------------------------------

const spec: MapSpec = {
  version: "0.1",
  id: "pmtiles-local-example",
  view: {
    mode: "map2d",
    center: [120.15, 30.28],
    zoom: 12,
  },
  sources: {
    "local-parcels": {
      type: "pmtiles",
      // Public PMTiles endpoint for runnable demo. Replace with local file for
      // your own data.
      url: "https://demo-bucket.overturemaps.org/v1/parcels.pmtiles",
      minzoom: 0,
      maxzoom: 14,
      attribution: "Overture Maps Foundation (runnable substitute)",
    },
  },
  layers: [
    {
      id: "parcel-fill",
      type: "fill",
      source: "local-parcels",
      metadata: {
        "source-layer": "parcels",
      },
      paint: {
        "fill-color": "#22c55e",
        "fill-opacity": 0.36,
      },
    },
    {
      id: "parcel-outline",
      type: "line",
      source: "local-parcels",
      metadata: {
        "source-layer": "parcels",
      },
      paint: {
        "line-color": "#166534",
        "line-width": 1.2,
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

  // PMTiles sources currently produce a diagnostic warning in the MapLibre
  // adapter. This is expected — log it for visibility.
  for (const d of report.diagnostics) {
    console.log(`  [${d.severity}] ${d.code}: ${d.message}`);
  }

  if (!report.valid) {
    console.error("Spec validation failed:");
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
  console.error("PMTiles local example failed:", error);
});
