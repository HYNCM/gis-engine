// =============================================================================
// GIS Engine - Choropleth Auto Example
// =============================================================================
//
// Demonstrates AI-assisted map generation using planMapGenerationRequest.
// The user describes an intent ("choropleth of population density") and the
// planner analyses the request, selecting visualization type, theme, and
// data property heuristics to produce a structured MapGenerationRequest.
//
// The generated plan is displayed in an overlay and rendered on the map.
//
// =============================================================================

import { planMapGenerationRequest, validateSpec, createMap } from "@gis-engine/engine";
import type { MapSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Step 1: Describe the visualization intent
// ---------------------------------------------------------------------------

const plannerInput = {
  promptHash: "demo-choropleth-auto-001",
  traceId: "trace-choropleth-us-states",
  intent: {
    description: "A choropleth map showing population density across US states",
    dataType: "geojson",
    theme: "ocean",
    dataProperty: "population",
  },
};

// ---------------------------------------------------------------------------
// Step 2: Ask the planner to produce a generation plan
// ---------------------------------------------------------------------------

const plan = planMapGenerationRequest(plannerInput);

console.log("--- Generation Plan ---");
console.log(`Status: ${plan.status}`);
console.log(`Trace ID: ${plan.traceId}`);
console.log(`Diagnostics: ${plan.diagnostics.length}`);
console.log("Provenance:", plan.provenance);
console.log("Request:", JSON.stringify(plan.request, null, 2));

// ---------------------------------------------------------------------------
// Step 3: Build a MapSpec from the plan and render
// ---------------------------------------------------------------------------
//
// In a real application the plan.request would be sent to an LLM or rule-based
// generator that returns a full MapSpec. For this demo we construct a
// representative choropleth spec directly.
//
// ---------------------------------------------------------------------------

const usStatesData: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { name: "California", population: 39538223, area: 423967 }, geometry: { type: "Point", coordinates: [-119.4, 36.8] } },
    { type: "Feature", properties: { name: "Texas", population: 29145505, area: 695662 }, geometry: { type: "Point", coordinates: [-99.9, 31.9] } },
    { type: "Feature", properties: { name: "Florida", population: 21538187, area: 170312 }, geometry: { type: "Point", coordinates: [-81.5, 27.6] } },
    { type: "Feature", properties: { name: "New York", population: 20201249, area: 141297 }, geometry: { type: "Point", coordinates: [-75.0, 43.0] } },
    { type: "Feature", properties: { name: "Pennsylvania", population: 13002700, area: 119280 }, geometry: { type: "Point", coordinates: [-77.0, 41.2] } },
    { type: "Feature", properties: { name: "Illinois", population: 12812508, area: 149995 }, geometry: { type: "Point", coordinates: [-89.4, 40.6] } },
    { type: "Feature", properties: { name: "Ohio", population: 11799448, area: 116098 }, geometry: { type: "Point", coordinates: [-82.9, 40.4] } },
    { type: "Feature", properties: { name: "Georgia", population: 10711908, area: 153910 }, geometry: { type: "Point", coordinates: [-83.5, 32.4] } },
    { type: "Feature", properties: { name: "North Carolina", population: 10439388, area: 139391 }, geometry: { type: "Point", coordinates: [-79.0, 35.5] } },
    { type: "Feature", properties: { name: "Michigan", population: 10077331, area: 250487 }, geometry: { type: "Point", coordinates: [-84.5, 44.3] } },
  ],
};

const spec: MapSpec = {
  version: "0.1",
  id: "choropleth-auto-demo",
  view: {
    mode: "map2d",
    center: [-98.5, 39.8],
    zoom: 4,
  },
  sources: {
    "us-states": {
      type: "geojson",
      data: usStatesData,
    },
  },
  layers: [
    {
      id: "population-density",
      type: "circle",
      source: "us-states",
      paint: {
        // Color by population density (population / area)
        "circle-color": [
          "interpolate",
          ["linear"],
          ["/", ["get", "population"], ["get", "area"]],
          0, "#eff3ff",
          50, "#bdd7e7",
          100, "#6baed6",
          200, "#3182bd",
          500, "#08519c",
        ],
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "population"],
          10000000, 8,
          40000000, 20,
        ],
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#084594",
      },
    },
    {
      id: "state-labels",
      type: "symbol",
      source: "us-states",
      layout: {
        "text-field": ["concat", ["get", "name"], " (", ["to-string", ["get", "population"]], ")"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 3, 10, 8, 16],
        "text-anchor": "bottom",
        "text-offset": [0, -1],
      },
      paint: {
        "text-color": "#1a1a1a",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1,
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Step 4: Validate and render
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const report = validateSpec(spec);

  console.log("--- Choropleth Auto Validation ---");
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
  console.log("Choropleth auto example rendered successfully.");
}

void main().catch((err) => {
  console.error("Choropleth auto example failed:", err);
});
