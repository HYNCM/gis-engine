// =============================================================================
// GIS Engine - PMTiles Cloud Example
// =============================================================================
//
// Demonstrates loading cloud-hosted PMTiles data using a public endpoint.
// The MapSpec declares a pmtiles source pointing to the Protomaps sample
// dataset and renders fill + line layers from it.
//
// Note: The MapLibre adapter maps pmtiles sources to vector source URLs with
// a diagnostic warning. Full PMTiles runtime loader support is tracked in
// the project roadmap. This example shows the schema-level contract.
//
// =============================================================================

import type { MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Step 1: Define the MapSpec with a cloud PMTiles source
// ---------------------------------------------------------------------------
// The URL points to the Protomaps sample vector dataset hosted on pmtiles.io.
// Replace with your own PMTiles endpoint for production use.
// ---------------------------------------------------------------------------

const spec: MapSpec = {
  version: "0.1",
  id: "pmtiles-cloud-example",
  view: {
    mode: "map2d",
    center: [0, 20],
    zoom: 2,
  },
  sources: {
    "cloud-vector": {
      type: "pmtiles",
      url: "https://pmtiles.io/protomaps-vector-dataset.pmtiles",
      minzoom: 0,
      maxzoom: 15,
      attribution: "© Protomaps © OpenStreetMap",
    },
  },
  layers: [
    {
      id: "earth-fill",
      type: "fill",
      source: "cloud-vector",
      metadata: {
        "source-layer": "earth",
      },
      paint: {
        "fill-color": "#e8f4f8",
      },
    },
    {
      id: "water-fill",
      type: "fill",
      source: "cloud-vector",
      metadata: {
        "source-layer": "water",
      },
      paint: {
        "fill-color": "#aad3df",
      },
    },
    {
      id: "boundaries-line",
      type: "line",
      source: "cloud-vector",
      metadata: {
        "source-layer": "boundaries",
      },
      paint: {
        "line-color": "#94a3b8",
        "line-width": 0.8,
        "line-dasharray": [2, 2],
      },
    },
    {
      id: "places-circle",
      type: "circle",
      source: "cloud-vector",
      metadata: {
        "source-layer": "places",
      },
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          2, 2,
          6, 4,
          10, 8,
        ],
        "circle-color": "#1e40af",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1,
      },
    },
    {
      id: "places-labels",
      type: "symbol-lite",
      source: "cloud-vector",
      metadata: {
        "source-layer": "places",
      },
      layout: {
        "text-field": ["get", "name"],
        "text-size": 11,
        "text-offset": [0, 1.2],
      },
      paint: {
        "text-color": "#334155",
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

  // PMTiles sources produce diagnostic warnings about adapter mapping.
  // Log them for visibility — they are expected at the schema level.
  for (const d of report.diagnostics) {
    console.log(`  [${d.severity}] ${d.code}: ${d.message}`);
  }

  if (!report.valid) {
    console.error("Spec validation failed:");
    throw new Error("Cannot proceed with an invalid spec.");
  }

  const container = document.getElementById("map");
  if (!container) throw new Error("Missing #map container.");

  const runtime = await createMap(container, spec, { renderer: "maplibre" });

  console.log("Map rendered successfully.");
  console.log(`Exported spec has ${runtime.exportSpec().layers.length} layer(s).`);
}

void main().catch((error) => {
  console.error("PMTiles cloud example failed:", error);
});
