// =============================================================================
// GIS Engine - Basic GeoJSON Example
// =============================================================================
//
// The smallest schema-first example: one GeoJSON source, one circle layer.
// This demonstrates the core GIS Engine workflow with a local GeoJSON file.
//
// =============================================================================

import type { MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// Import the GeoJSON data. Vite's ?raw suffix loads the file as a string,
// which we then parse so the engine receives inline data instead of a
// relative file path (which only works in Node.js validation flows).
import pointsGeoJsonRaw from "../data/points.geojson?raw";

const pointsData = JSON.parse(pointsGeoJsonRaw);

// ---------------------------------------------------------------------------
// Step 1: Define the MapSpec
// ---------------------------------------------------------------------------
// This is the same spec as map.json, but with the GeoJSON data inlined so it
// works in the browser. The spec describes one GeoJSON source and one circle
// layer.
// ---------------------------------------------------------------------------

const spec: MapSpec = {
  version: "0.1",
  id: "basic-geojson-example",
  view: {
    mode: "map2d",
    center: [120.15, 30.28],
    zoom: 11,
  },
  sources: {
    pois: {
      type: "geojson",
      data: pointsData,
    },
  },
  layers: [
    {
      id: "poi-circles",
      type: "circle",
      source: "pois",
      paint: {
        "circle-radius": 6,
        "circle-color": "#2563eb",
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
  console.error("Basic GeoJSON example failed:", error);
});
