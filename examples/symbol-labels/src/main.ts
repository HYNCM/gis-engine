// =============================================================================
// GIS Engine - Symbol Labels Example
// =============================================================================
//
// Demonstrates the full symbol layer type with:
//   - text-field: driven by feature name property
//   - text-size: zoom-dependent sizing via interpolate expression
//   - text-anchor / text-offset: label positioning
//   - icon-image / icon-size: marker icons
//   - text-halo: halo effect for readability
//   - text-allow-overlap / icon-allow-overlap: collision control
//
// Shows 12 major world cities with population-driven sizing.
//
// =============================================================================

import type { MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Step 1: City data — 12 world cities
// ---------------------------------------------------------------------------

const citiesData = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: { name: "Tokyo", population: 37400000, type: "megacity" },
      geometry: { type: "Point" as const, coordinates: [139.6917, 35.6895] },
    },
    {
      type: "Feature" as const,
      properties: { name: "Delhi", population: 30290000, type: "megacity" },
      geometry: { type: "Point" as const, coordinates: [77.1025, 28.7041] },
    },
    {
      type: "Feature" as const,
      properties: { name: "Shanghai", population: 27058000, type: "megacity" },
      geometry: { type: "Point" as const, coordinates: [121.4737, 31.2304] },
    },
    {
      type: "Feature" as const,
      properties: { name: "São Paulo", population: 22043000, type: "megacity" },
      geometry: { type: "Point" as const, coordinates: [-46.6333, -23.5505] },
    },
    {
      type: "Feature" as const,
      properties: { name: "Cairo", population: 20901000, type: "megacity" },
      geometry: { type: "Point" as const, coordinates: [31.2357, 30.0444] },
    },
    {
      type: "Feature" as const,
      properties: { name: "London", population: 9002000, type: "capital" },
      geometry: { type: "Point" as const, coordinates: [-0.1276, 51.5074] },
    },
    {
      type: "Feature" as const,
      properties: { name: "Paris", population: 11020000, type: "capital" },
      geometry: { type: "Point" as const, coordinates: [2.3522, 48.8566] },
    },
    {
      type: "Feature" as const,
      properties: { name: "New York", population: 18819000, type: "megacity" },
      geometry: { type: "Point" as const, coordinates: [-74.006, 40.7128] },
    },
    {
      type: "Feature" as const,
      properties: { name: "Beijing", population: 20463000, type: "capital" },
      geometry: { type: "Point" as const, coordinates: [116.4074, 39.9042] },
    },
    {
      type: "Feature" as const,
      properties: { name: "Sydney", population: 5312000, type: "capital" },
      geometry: { type: "Point" as const, coordinates: [151.2093, -33.8688] },
    },
    {
      type: "Feature" as const,
      properties: { name: "Moscow", population: 12538000, type: "capital" },
      geometry: { type: "Point" as const, coordinates: [37.6173, 55.7558] },
    },
    {
      type: "Feature" as const,
      properties: { name: "Lagos", population: 14368000, type: "megacity" },
      geometry: { type: "Point" as const, coordinates: [3.3792, 6.5244] },
    },
  ],
};

// ---------------------------------------------------------------------------
// Step 2: Define the MapSpec with symbol layer
// ---------------------------------------------------------------------------

const spec: MapSpec = {
  version: "0.1",
  id: "symbol-labels",
  view: {
    mode: "map2d",
    center: [20, 25],
    zoom: 2,
  },
  sources: {
    cities: {
      type: "geojson",
      data: citiesData,
    },
  },
  layers: [
    {
      id: "city-labels",
      type: "symbol",
      source: "cities",
      layout: {
        "text-field": ["get", "name"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 2, 10, 10, 20],
        "text-anchor": "top",
        "text-offset": [0, 1],
        "text-font": ["Open Sans Regular"],
        "icon-image": "marker-15",
        "icon-size": 1.2,
        "text-allow-overlap": false,
        "icon-allow-overlap": false,
      },
      paint: {
        "text-color": "#333333",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.5,
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

  console.log("Symbol labels rendered successfully.");
  console.log(`Exported spec has ${runtime.exportSpec().layers.length} layer(s).`);
}

void main().catch((error) => {
  console.error("Symbol labels example failed:", error);
});
