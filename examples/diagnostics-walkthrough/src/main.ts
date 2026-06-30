// =============================================================================
// GIS Engine - Diagnostics Walkthrough Example
// =============================================================================
//
// Demonstrates how GIS Engine produces structured, machine-readable diagnostics
// when a MapSpec fails validation. This example:
//   1. Validates a correct MapSpec and renders it on the map.
//   2. Validates intentionally broken specs and displays their diagnostics in
//      a side panel so you can see the structured error output.
//
// Open the browser console to see the full diagnostic objects.
//
// =============================================================================

import type { MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";
// Import the intentionally broken specs for demonstration.
import invalidExamples from "../data/invalid-examples.json";
// Import the GeoJSON data referenced by the valid spec.
import pointsGeoJsonRaw from "../data/points.geojson?raw";

const pointsData = JSON.parse(pointsGeoJsonRaw);

// ---------------------------------------------------------------------------
// Step 1: Define the valid MapSpec (same as map.json but with inlined data)
// ---------------------------------------------------------------------------

const validSpec: MapSpec = {
  version: "0.1",
  id: "diagnostics-walkthrough",
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
        // Data-driven radius: step by "score" property.
        "circle-radius": ["step", ["get", "score"], 4, 60, 8, 90, 12],
        "circle-color": ["step", ["get", "score"], "#dbeafe", 60, "#60a5fa", 90, "#1d4ed8"],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Step 2: Validate the valid spec and render the map
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // --- Valid spec ---
  console.log("=== Valid MapSpec ===");
  const validReport = validateSpec(validSpec);
  console.log(`Valid: ${validReport.valid}`);
  console.log(`Diagnostics: ${validReport.diagnostics.length}`);

  if (!validReport.valid) {
    for (const d of validReport.diagnostics) {
      console.error(`  [${d.severity}] ${d.code}: ${d.message}`);
    }
    throw new Error("Valid spec failed validation — check the diagnostics above.");
  }

  const container = document.getElementById("map");
  if (!container) throw new Error("Missing #map container.");

  await createMap(container, validSpec, { renderer: "maplibre" });
  console.log("Map rendered successfully.");

  // --- Invalid specs ---
  console.log("\n=== Invalid MapSpec Examples ===");
  const panelEl = document.getElementById("diag-output");
  let panelHtml = "";

  for (const example of invalidExamples as Array<{ description: string; spec: unknown }>) {
    console.log(`\n--- ${example.description} ---`);
    const report = validateSpec(example.spec as MapSpec);
    console.log(`Valid: ${report.valid}`);

    panelHtml += `<div style="margin-bottom:12px"><strong>${example.description}</strong>`;

    for (const d of report.diagnostics) {
      console.log(`  [${d.severity}] ${d.code} at ${d.path}`);
      console.log(`    ${d.message}`);
      if (d.fix) console.log(`    Fix: ${d.fix}`);

      const cssClass = d.severity === "error" ? "diag-error" : "diag-warning";
      panelHtml += `<div class="diag-item ${cssClass}">`;
      panelHtml += `<div>[${d.severity}] <strong>${d.code}</strong> at <code>${d.path}</code></div>`;
      panelHtml += `<div>${d.message}</div>`;
      if (d.fix) panelHtml += `<div><em>Fix: ${d.fix}</em></div>`;
      panelHtml += `</div>`;
    }

    panelHtml += `</div>`;
  }

  if (panelEl) {
    panelEl.innerHTML = panelHtml || "<em>No diagnostics produced.</em>";
  }
}

void main().catch((error) => {
  console.error("Diagnostics walkthrough example failed:", error);
});
