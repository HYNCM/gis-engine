// =============================================================================
// GIS Engine - AI Generation Demo Example
// =============================================================================
//
// Demonstrates the end-to-end AI map generation workflow:
//   1. Prompt: user describes what they want
//   2. Plan: planMapGenerationRequest creates a generation plan
//   3. Generate: mock provider produces a MapSpec
//   4. Validate: validateSpec checks the generated spec
//   5. Render: createMap renders the validated spec on the map
//   6. Export: exportSpec produces the final evidence bundle
//
// This example uses a mock AI provider (no real LLM calls) to demonstrate
// the full pipeline structure that MCP tools would follow.
//
// =============================================================================

import type { MapSpec } from "@gis-engine/engine";
import {
  createMap,
  planMapGenerationRequest,
  validateSpec,
} from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Step 1: Simulate a user prompt
// ---------------------------------------------------------------------------

const userPrompt = "Show me a map of Hangzhou with parks highlighted in green and major roads as orange lines.";

// ---------------------------------------------------------------------------
// Step 2: Mock AI provider — generates a MapSpec from the prompt
// ---------------------------------------------------------------------------
// In a real integration this would be an LLM call via MCP tools.
// Here we return a pre-built spec that matches the prompt intent.
// ---------------------------------------------------------------------------

function mockAiGenerateMapSpec(_prompt: string): MapSpec {
  return {
    version: "0.1",
    id: "ai-generated-hangzhou",
    view: {
      mode: "map2d",
      center: [120.15, 30.27],
      zoom: 12,
    },
    sources: {
      // Simulated basemap
      basemap: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
      // Simulated parks GeoJSON
      parks: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "West Lake Park", area: 640 },
              geometry: {
                type: "Polygon",
                coordinates: [[[120.12, 30.23], [120.17, 30.23], [120.17, 30.27], [120.12, 30.27], [120.12, 30.23]]],
              },
            },
            {
              type: "Feature",
              properties: { name: "Xixi Wetland", area: 1150 },
              geometry: {
                type: "Polygon",
                coordinates: [[[120.04, 30.25], [120.08, 30.25], [120.08, 30.29], [120.04, 30.29], [120.04, 30.25]]],
              },
            },
          ],
        },
      },
      // Simulated roads GeoJSON
      roads: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Yan'an Road", type: "major" },
              geometry: { type: "LineString", coordinates: [[120.15, 30.25], [120.18, 30.26], [120.20, 30.28]] },
            },
            {
              type: "Feature",
              properties: { name: "Wensan Road", type: "major" },
              geometry: { type: "LineString", coordinates: [[120.10, 30.27], [120.14, 30.275], [120.18, 30.28]] },
            },
            {
              type: "Feature",
              properties: { name: "Tiyuchang Road", type: "major" },
              geometry: { type: "LineString", coordinates: [[120.13, 30.26], [120.16, 30.265], [120.19, 30.27]] },
            },
          ],
        },
      },
    },
    layers: [
      {
        id: "basemap-raster",
        type: "raster",
        source: "basemap",
        paint: { "raster-opacity": 0.6 },
      },
      {
        id: "park-fill",
        type: "fill",
        source: "parks",
        paint: { "fill-color": "#22c55e", "fill-opacity": 0.4 },
      },
      {
        id: "park-outline",
        type: "line",
        source: "parks",
        paint: { "line-color": "#166534", "line-width": 2 },
      },
      {
        id: "road-lines",
        type: "line",
        source: "roads",
        paint: { "line-color": "#f97316", "line-width": 3 },
      },
      {
        id: "park-labels",
        type: "symbol-lite",
        source: "parks",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 13,
        },
        paint: { "text-color": "#14532d" },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Step 3: Run the full pipeline
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const pipelineOutput = document.getElementById("pipeline-output");
  const steps: string[] = [];

  // --- Stage 1: Prompt ---
  console.log("=== Stage 1: User Prompt ===");
  console.log(`"${userPrompt}"`);
  steps.push(`<div class="pipeline-step">
    <h3>Stage 1: User Prompt</h3>
    <pre>"${userPrompt}"</pre>
  </div>`);

  // --- Stage 2: Generation Plan ---
  console.log("\n=== Stage 2: Generation Plan ===");
  const plan = planMapGenerationRequest(userPrompt);
  console.log("Plan:", JSON.stringify(plan, null, 2));
  steps.push(`<div class="pipeline-step">
    <h3>Stage 2: Generation Plan</h3>
    <pre>${JSON.stringify(plan, null, 2)}</pre>
  </div>`);

  // --- Stage 3: AI Generation (mock) ---
  console.log("\n=== Stage 3: AI Generation (mock) ===");
  const generatedSpec = mockAiGenerateMapSpec(userPrompt);
  console.log("Generated spec id:", generatedSpec.id);
  console.log("Sources:", Object.keys(generatedSpec.sources).join(", "));
  console.log("Layers:", generatedSpec.layers.map((l) => l.id).join(", "));
  steps.push(`<div class="pipeline-step">
    <h3>Stage 3: AI Generation (mock)</h3>
    <div class="pipeline-info">Spec ID: ${generatedSpec.id}</div>
    <div class="pipeline-info">Sources: ${Object.keys(generatedSpec.sources).join(", ")}</div>
    <div class="pipeline-info">Layers: ${generatedSpec.layers.map((l) => l.id).join(", ")}</div>
    <pre>${JSON.stringify(generatedSpec, null, 2).slice(0, 500)}…</pre>
  </div>`);

  // --- Stage 4: Validation ---
  console.log("\n=== Stage 4: Validation ===");
  const report = validateSpec(generatedSpec);
  console.log(`Valid: ${report.valid}`);
  console.log(`Sources: ${report.stats.sourceCount}, Layers: ${report.stats.layerCount}`);
  for (const d of report.diagnostics) {
    console.log(`  [${d.severity}] ${d.code}: ${d.message}`);
  }

  const validClass = report.valid ? "pipeline-success" : "";
  steps.push(`<div class="pipeline-step ${validClass}">
    <h3>Stage 4: Validation</h3>
    <div class="pipeline-info">Valid: ${report.valid}</div>
    <div class="pipeline-info">Sources: ${report.stats.sourceCount} | Layers: ${report.stats.layerCount}</div>
    ${report.diagnostics.map((d) => `<div class="pipeline-info">[${d.severity}] ${d.code}: ${d.message}</div>`).join("")}
  </div>`);

  if (!report.valid) {
    steps.push(`<div class="pipeline-step"><h3>Aborted</h3><div class="pipeline-info">Spec failed validation. Cannot render.</div></div>`);
    if (pipelineOutput) pipelineOutput.innerHTML = steps.join("");
    return;
  }

  // --- Stage 5: Render ---
  console.log("\n=== Stage 5: Render ===");
  const container = document.getElementById("map");
  if (!container) throw new Error("Missing #map container.");

  const runtime = await createMap(container, generatedSpec, { renderer: "maplibre" });
  console.log("Map rendered successfully.");
  steps.push(`<div class="pipeline-step pipeline-success">
    <h3>Stage 5: Render</h3>
    <div class="pipeline-info">Map rendered successfully on the map panel.</div>
  </div>`);

  // --- Stage 6: Export (evidence bundle) ---
  console.log("\n=== Stage 6: Export (evidence bundle) ===");
  const exported = runtime.exportSpec();
  console.log("Exported spec:", JSON.stringify(exported, null, 2).slice(0, 300));
  steps.push(`<div class="pipeline-step pipeline-success">
    <h3>Stage 6: Export (evidence bundle)</h3>
    <div class="pipeline-info">Exported ${exported.layers.length} layers, ${Object.keys(exported.sources).length} sources.</div>
    <pre>${JSON.stringify(exported, null, 2).slice(0, 500)}…</pre>
  </div>`);

  if (pipelineOutput) {
    pipelineOutput.innerHTML = steps.join("");
  }
}

void main().catch((error) => {
  console.error("AI generation demo failed:", error);
});
