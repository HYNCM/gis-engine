// =============================================================================
// GIS Engine - Fill Extrusion Lite Example
// =============================================================================
//
// Renders 3D extruded polygons using the experimental fill-extrusion-lite layer
// type on a 2.5D map with pitch and bearing. This demonstrates:
//   - The experimental fill-extrusion-lite capability
//   - 2.5D view mode (map2_5d) with camera pitch and bearing
//   - Data-driven extrusion height from GeoJSON feature properties
//
// Note: fill-extrusion-lite is a beta/experimental layer type. Paint properties
// may change between releases.
//
// =============================================================================

import type { MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Step 1: Define the MapSpec
// ---------------------------------------------------------------------------
// The spec declares experimental capabilities and uses a 2.5D view mode with
// pitch and bearing to show the extruded polygon in perspective.
// ---------------------------------------------------------------------------

const spec: MapSpec = {
  version: "0.1",
  id: "fill-extrusion-lite-example",
  capabilities: {
    dimensions: ["2_5d"],
    experimental: ["fill-extrusion-lite"],
  },
  view: {
    mode: "map2_5d",
    center: [120.15, 30.28],
    zoom: 13,
    pitch: 50,
    bearing: 20,
  },
  sources: {
    districts: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              height: 120,
              name: "Beta block",
            },
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [120.145, 30.275],
                  [120.155, 30.275],
                  [120.155, 30.285],
                  [120.145, 30.285],
                  [120.145, 30.275],
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
      id: "district-extrusion",
      type: "fill-extrusion-lite",
      source: "districts",
      paint: {
        "fill-extrusion-color": "#38bdf8",
        // Extrusion height is driven by the feature's "height" property.
        "fill-extrusion-height": ["to-number", ["get", "height"], 0],
        "fill-extrusion-base": 0,
        "fill-extrusion-opacity": 0.75,
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

  // Log any diagnostics (experimental capability warnings, etc.)
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
  console.error("Fill extrusion lite example failed:", error);
});
