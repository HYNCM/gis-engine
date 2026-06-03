// =============================================================================
// GIS Engine - Getting Started Example
// =============================================================================
//
// This example demonstrates the core workflow of GIS Engine:
//   1. Define a MapSpec (the declarative description of your map)
//   2. Validate the spec to catch errors before rendering
//   3. Render the map using createMap() with the MapLibre renderer
//   4. Apply commands to mutate the map in a controlled way
//
// =============================================================================

import { createMap, validateSpec } from "@gis-engine/engine";
import type { MapSpec, MapCommand } from "@gis-engine/engine";

// Import the GeoJSON data for world cities.
// Vite resolves JSON imports at build time, so the data is bundled directly.
import citiesData from "../data/cities.geojson";

// ---------------------------------------------------------------------------
// Step 1: Define the MapSpec
// ---------------------------------------------------------------------------
//
// A MapSpec is the single source of truth for your map. It describes:
//   - version:  The spec format version (currently "0.1")
//   - view:     Initial camera position (center, zoom, bearing, pitch)
//   - sources:  Named data sources (GeoJSON, raster tiles, PMTiles, vector)
//   - layers:   Visual layers that reference sources (circle, fill, line, etc.)
//
// The spec is a plain JSON-serializable object. No hidden state, no side effects.
// ---------------------------------------------------------------------------

const spec: MapSpec = {
  version: "0.1",
  id: "getting-started",

  // The initial view: centered on a world view so all cities are visible
  view: {
    mode: "map2d",
    center: [20, 25],
    zoom: 2,
  },

  // Register a GeoJSON data source containing 10 world cities.
  // The "data" field accepts an inline GeoJSON object or a URL string.
  sources: {
    cities: {
      type: "geojson",
      data: citiesData,
    },
  },

  // Define one circle layer that renders each city as a styled point.
  // Paint properties control the visual appearance of the layer.
  layers: [
    {
      id: "city-circles",
      type: "circle",
      source: "cities",
      paint: {
        // Scale circle radius by population: larger cities get bigger circles.
        // The "step" expression maps population thresholds to pixel values.
        "circle-radius": [
          "step",
          ["get", "population"],
          6,          // default: 6px
          20000000, 8,  // 20M+: 8px
          30000000, 12, // 30M+: 12px
        ],
        "circle-color": "#3b82f6",
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#1e3a5f",
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Step 2: Validate the spec before rendering
// ---------------------------------------------------------------------------
//
// validateSpec() checks the spec against the MapSpec schema and runs semantic
// rules (e.g., layer-source references, zoom range consistency, expression
// syntax). It returns a ValidationReport with:
//   - valid:       boolean indicating whether there are zero errors
//   - diagnostics: structured warnings and errors
//   - stats:       counts of sources, layers, and visible layers
//
// This is useful during development and in CI pipelines to catch problems early.
// ---------------------------------------------------------------------------

const report = validateSpec(spec);

console.log("--- Validation Report ---");
console.log(`Valid: ${report.valid}`);
console.log(`Sources: ${report.stats.sourceCount}`);
console.log(`Layers: ${report.stats.layerCount}`);
console.log(`Visible layers: ${report.stats.visibleLayerCount}`);

if (!report.valid) {
  console.error("Spec validation failed:");
  for (const diagnostic of report.diagnostics) {
    console.error(`  [${diagnostic.severity}] ${diagnostic.code}: ${diagnostic.message}`);
  }
  throw new Error("Cannot proceed with an invalid spec.");
}

// ---------------------------------------------------------------------------
// Step 3: Render the map
// ---------------------------------------------------------------------------
//
// createMap() takes a container element, the validated spec, and renderer
// options. It returns a MapRuntime instance that you can use to apply
// commands, take snapshots, query features, and export the current spec.
//
// The "maplibre" renderer uses MapLibre GL JS under the hood.
// ---------------------------------------------------------------------------

const container = document.getElementById("map")!;

const runtime = await createMap(container, spec, {
  renderer: "maplibre",
});

console.log("Map rendered successfully.");

// ---------------------------------------------------------------------------
// Step 4: Apply a command to mutate the map
// ---------------------------------------------------------------------------
//
// GIS Engine uses a command system to mutate the map spec. Instead of calling
// imperative methods on the map, you declare commands that describe the change.
// Each command is validated, applied atomically, and produces a JSON Patch
// that can be inspected, inverted, or replayed.
//
// Here we add a second layer that renders city labels as text symbols.
// ---------------------------------------------------------------------------

const addLabelCommand: MapCommand = {
  id: "add-city-labels",
  version: "0.1",
  type: "addLayer",
  layer: {
    id: "city-labels",
    type: "symbol-lite",
    source: "cities",
    layout: {
      "text-field": ["get", "name"],
      "text-size": 12,
      "text-offset": [0, 1.5],
    },
    paint: {
      "text-color": "#1e293b",
    },
  },
};

const results = await runtime.apply(addLabelCommand);

console.log("--- Command Results ---");
for (const result of results) {
  console.log(`  ${result.commandId}: ${result.status}`);
  console.log(`    Changed paths: ${result.changedPaths.join(", ")}`);
}

// You can also export the current spec at any time to see the full state
// after all commands have been applied.
const currentSpec = runtime.exportSpec();
console.log(`Current spec now has ${currentSpec.layers.length} layers.`);
