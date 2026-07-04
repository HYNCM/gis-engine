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
import { createMap, planMapGenerationRequest, validateSpec } from "@gis-engine/engine";

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
                coordinates: [
                  [
                    [120.12, 30.23],
                    [120.17, 30.23],
                    [120.17, 30.27],
                    [120.12, 30.27],
                    [120.12, 30.23],
                  ],
                ],
              },
            },
            {
              type: "Feature",
              properties: { name: "Xixi Wetland", area: 1150 },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [120.04, 30.25],
                    [120.08, 30.25],
                    [120.08, 30.29],
                    [120.04, 30.29],
                    [120.04, 30.25],
                  ],
                ],
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
              geometry: {
                type: "LineString",
                coordinates: [
                  [120.15, 30.25],
                  [120.18, 30.26],
                  [120.2, 30.28],
                ],
              },
            },
            {
              type: "Feature",
              properties: { name: "Wensan Road", type: "major" },
              geometry: {
                type: "LineString",
                coordinates: [
                  [120.1, 30.27],
                  [120.14, 30.275],
                  [120.18, 30.28],
                ],
              },
            },
            {
              type: "Feature",
              properties: { name: "Tiyuchang Road", type: "major" },
              geometry: {
                type: "LineString",
                coordinates: [
                  [120.13, 30.26],
                  [120.16, 30.265],
                  [120.19, 30.27],
                ],
              },
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

/** Render a pipeline stage card into the panel incrementally. */
function addStageCard(
  panel: HTMLElement,
  index: number,
  title: string,
  status: "running" | "success" | "error",
  bodyHtml: string,
): HTMLDivElement {
  const card = document.createElement("div");
  card.className = `pipeline-step pipeline-${status}`;
  card.innerHTML = `<h3><span class="stage-badge stage-${status}">${status === "running" ? "⟳" : status === "success" ? "✓" : "✗"}</span> Stage ${index}: ${title}</h3>${bodyHtml}`;
  panel.appendChild(card);
  panel.scrollTop = panel.scrollHeight;
  return card;
}

function updateStageCard(
  card: HTMLDivElement,
  title: string,
  status: "running" | "success" | "error",
  bodyHtml: string,
): void {
  card.className = `pipeline-step pipeline-${status}`;
  card.innerHTML = `<h3><span class="stage-badge stage-${status}">${status === "running" ? "⟳" : status === "success" ? "✓" : "✗"}</span> Stage ${title}</h3>${bodyHtml}`;
}

/** Update the global progress bar. */
function setProgress(bar: HTMLElement, label: HTMLElement, step: number, total: number, text: string): void {
  const pct = Math.round((step / total) * 100);
  bar.style.width = `${pct}%`;
  label.textContent = text;
}

async function main(): Promise<void> {
  const pipelineOutput = document.getElementById("pipeline-output");
  const progressBar = document.getElementById("progress-bar");
  const progressLabel = document.getElementById("progress-label");
  if (!pipelineOutput || !progressBar || !progressLabel) throw new Error("Missing pipeline UI elements.");

  // Clear the initial "Processing…" placeholder
  pipelineOutput.innerHTML = "";

  const TOTAL_STAGES = 6;

  // =========================================================================
  // Stage 1: Prompt
  // =========================================================================
  setProgress(progressBar, progressLabel, 1, TOTAL_STAGES, "Receiving prompt…");
  console.log("=== Stage 1: User Prompt ===");
  console.log(`"${userPrompt}"`);

  const stage1 = addStageCard(pipelineOutput, 1, "User Prompt", "running", "");
  await delay(300);
  updateStageCard(
    stage1,
    "1: User Prompt",
    "success",
    `
    <pre>"${userPrompt}"</pre>
  `,
  );

  // =========================================================================
  // Stage 2: Generation Plan
  // =========================================================================
  setProgress(progressBar, progressLabel, 2, TOTAL_STAGES, "Creating generation plan…");
  console.log("\n=== Stage 2: Generation Plan ===");

  const stage2 = addStageCard(
    pipelineOutput,
    2,
    "Generation Plan",
    "running",
    `
    <div class="pipeline-info">Analyzing prompt…</div>
  `,
  );
  await delay(400);

  const plan = planMapGenerationRequest(userPrompt);
  console.log("Plan:", JSON.stringify(plan, null, 2));
  updateStageCard(
    stage2,
    "2: Generation Plan",
    "success",
    `
    <pre>${JSON.stringify(plan, null, 2)}</pre>
  `,
  );

  // =========================================================================
  // Stage 3: AI Generation (mock)
  // =========================================================================
  setProgress(progressBar, progressLabel, 3, TOTAL_STAGES, "Generating MapSpec via AI…");
  console.log("\n=== Stage 3: AI Generation (mock) ===");

  const stage3 = addStageCard(
    pipelineOutput,
    3,
    "AI Generation (mock)",
    "running",
    `
    <div class="pipeline-info">Calling mock AI provider…</div>
  `,
  );
  await delay(600);

  const generatedSpec = mockAiGenerateMapSpec(userPrompt);
  console.log("Generated spec id:", generatedSpec.id);
  console.log("Sources:", Object.keys(generatedSpec.sources).join(", "));
  console.log("Layers:", generatedSpec.layers.map((l) => l.id).join(", "));
  updateStageCard(
    stage3,
    "3: AI Generation (mock)",
    "success",
    `
    <div class="pipeline-info">Spec ID: <strong>${generatedSpec.id}</strong></div>
    <div class="pipeline-info">Sources: ${Object.keys(generatedSpec.sources).join(", ")}</div>
    <div class="pipeline-info">Layers: ${generatedSpec.layers.map((l) => l.id).join(", ")}</div>
    <pre>${JSON.stringify(generatedSpec, null, 2).slice(0, 500)}…</pre>
  `,
  );

  // =========================================================================
  // Stage 4: Validation
  // =========================================================================
  setProgress(progressBar, progressLabel, 4, TOTAL_STAGES, "Validating generated spec…");
  console.log("\n=== Stage 4: Validation ===");

  const stage4 = addStageCard(
    pipelineOutput,
    4,
    "Validation",
    "running",
    `
    <div class="pipeline-info">Running schema validation…</div>
  `,
  );
  await delay(400);

  const report = validateSpec(generatedSpec);
  console.log(`Valid: ${report.valid}`);
  console.log(`Sources: ${report.stats.sourceCount}, Layers: ${report.stats.layerCount}`);
  for (const d of report.diagnostics) {
    console.log(`  [${d.severity}] ${d.code}: ${d.message}`);
  }

  if (!report.valid) {
    updateStageCard(
      stage4,
      "4: Validation",
      "error",
      `
      <div class="pipeline-info">Valid: <strong>false</strong></div>
      <div class="pipeline-info">Sources: ${report.stats.sourceCount} | Layers: ${report.stats.layerCount}</div>
      ${report.diagnostics.map((d) => `<div class="pipeline-info">[${d.severity}] ${d.code}: ${d.message}</div>`).join("")}
    `,
    );
    addStageCard(
      pipelineOutput,
      5,
      "Aborted",
      "error",
      `
      <div class="pipeline-info">Spec failed validation. Cannot render.</div>
    `,
    );
    setProgress(progressBar, progressLabel, 4, TOTAL_STAGES, "Validation failed");
    return;
  }

  updateStageCard(
    stage4,
    "4: Validation",
    "success",
    `
    <div class="pipeline-info">Valid: <strong>true</strong></div>
    <div class="pipeline-info">Sources: ${report.stats.sourceCount} | Layers: ${report.stats.layerCount}</div>
    ${report.diagnostics.map((d) => `<div class="pipeline-info">[${d.severity}] ${d.code}: ${d.message}</div>`).join("")}
  `,
  );

  // =========================================================================
  // Stage 5: Render — the real MapLibre map appears here
  // =========================================================================
  setProgress(progressBar, progressLabel, 5, TOTAL_STAGES, "Rendering map with MapLibre…");
  console.log("\n=== Stage 5: Render ===");

  const stage5 = addStageCard(
    pipelineOutput,
    5,
    "Render",
    "running",
    `
    <div class="pipeline-info">Initializing MapLibre renderer…</div>
  `,
  );

  const container = document.getElementById("map");
  if (!container) throw new Error("Missing #map container.");

  // Add a subtle "loading" overlay on the map container while rendering
  container.classList.add("map-loading");

  const runtime = await createMap(container, generatedSpec, { renderer: "maplibre" });

  // Remove loading overlay once the map is live
  container.classList.remove("map-loading");
  container.classList.add("map-ready");

  console.log("Map rendered successfully.");
  updateStageCard(
    stage5,
    "5: Render",
    "success",
    `
    <div class="pipeline-info">Map rendered on the left panel with <strong>${generatedSpec.layers.length}</strong> layers.</div>
    <div class="pipeline-info">Renderer: MapLibre GL</div>
  `,
  );

  // =========================================================================
  // Stage 6: Export (evidence bundle)
  // =========================================================================
  setProgress(progressBar, progressLabel, 6, TOTAL_STAGES, "Exporting evidence bundle…");
  console.log("\n=== Stage 6: Export (evidence bundle) ===");

  const stage6 = addStageCard(pipelineOutput, 6, "Export (evidence bundle)", "running", "");
  await delay(200);

  const exported = runtime.exportSpec();
  console.log("Exported spec:", JSON.stringify(exported, null, 2).slice(0, 300));
  updateStageCard(
    stage6,
    "6: Export (evidence bundle)",
    "success",
    `
    <div class="pipeline-info">Exported ${exported.layers.length} layers, ${Object.keys(exported.sources).length} sources.</div>
    <pre>${JSON.stringify(exported, null, 2).slice(0, 500)}…</pre>
  `,
  );

  setProgress(progressBar, progressLabel, TOTAL_STAGES, TOTAL_STAGES, "Pipeline complete ✓");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

void main().catch((error) => {
  console.error("AI generation demo failed:", error);
  const pipelineOutput = document.getElementById("pipeline-output");
  if (pipelineOutput) {
    const card = document.createElement("div");
    card.className = "pipeline-step pipeline-error";
    card.innerHTML = `<h3><span class="stage-badge stage-error">✗</span> Fatal Error</h3>
      <div class="pipeline-info">${String(error)}</div>`;
    pipelineOutput.appendChild(card);
  }
});
