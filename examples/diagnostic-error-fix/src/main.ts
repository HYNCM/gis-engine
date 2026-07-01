// =============================================================================
// GIS Engine - Diagnostic Error Fix Example
// =============================================================================
//
// Demonstrates the diagnostic-code-driven error fix workflow:
//   1. Intentionally create invalid specs
//   2. Capture structured diagnostics (code, severity, path, message, fix)
//   3. Display diagnostics in a visual panel
//   4. Apply suggested fixes and re-validate to show recovery
//
// This is the core workflow for AI agents and developers: read the diagnostic
// code, understand the path, and apply the suggested fix.
//
// =============================================================================

import type { Diagnostic, MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Step 1: Define intentionally broken specs for demonstration
// ---------------------------------------------------------------------------

interface BrokenSpecCase {
  title: string;
  description: string;
  spec: unknown;
}

const brokenSpecs: BrokenSpecCase[] = [
  {
    title: "Missing version",
    description: "The spec omits the required 'version' field.",
    spec: {
      id: "no-version",
      view: { mode: "map2d", center: [0, 0], zoom: 2 },
      sources: {},
      layers: [],
    },
  },
  {
    title: "Invalid layer type",
    description: "Layer uses an unrecognized type value.",
    spec: {
      version: "0.1",
      id: "bad-layer-type",
      view: { mode: "map2d", center: [0, 0], zoom: 2 },
      sources: {
        data: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
      },
      layers: [{ id: "bad", type: "heatmap", source: "data" }],
    },
  },
  {
    title: "Layer references missing source",
    description: "A layer points to a source ID that doesn't exist.",
    spec: {
      version: "0.1",
      id: "dangling-source-ref",
      view: { mode: "map2d", center: [0, 0], zoom: 2 },
      sources: {},
      layers: [{ id: "orphan", type: "circle", source: "nonexistent" }],
    },
  },
  {
    title: "Missing view",
    description: "The spec omits the required 'view' field.",
    spec: {
      version: "0.1",
      id: "no-view",
      sources: {},
      layers: [],
    },
  },
];

// ---------------------------------------------------------------------------
// Step 2: Valid spec to render after demonstrating diagnostics
// ---------------------------------------------------------------------------

const validSpec: MapSpec = {
  version: "0.1",
  id: "diagnostic-fix-demo",
  view: {
    mode: "map2d",
    center: [120.15, 30.28],
    zoom: 11,
  },
  sources: {
    pois: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          { type: "Feature", properties: { name: "A" }, geometry: { type: "Point", coordinates: [120.14, 30.27] } },
          { type: "Feature", properties: { name: "B" }, geometry: { type: "Point", coordinates: [120.16, 30.29] } },
        ],
      },
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
// Step 3: Render diagnostic panel and valid map
// ---------------------------------------------------------------------------

function renderDiagnostic(d: Diagnostic): string {
  const severityClass = `diag-${d.severity}`;
  let html = `<div class="diag-item ${severityClass}">`;
  html += `<span class="diag-code">${d.code}</span> `;
  html += `[${d.severity}]`;
  if (d.path) html += ` at <span class="diag-path">${d.path}</span>`;
  html += `<div>${d.message}</div>`;
  if (d.fix) {
    html += `<div class="diag-fix">Suggested fix (${d.fix.kind}, confidence: ${d.fix.confidence}):<br>${d.fix.message}</div>`;
  }
  html += `</div>`;
  return html;
}

async function main(): Promise<void> {
  const diagOutput = document.getElementById("diag-output");
  let panelHtml = "";

  // Validate each broken spec and collect diagnostics
  for (let i = 0; i < brokenSpecs.length; i++) {
    const testCase = brokenSpecs[i];
    console.log(`\n=== Step ${i + 1}: ${testCase.title} ===`);
    console.log(`Description: ${testCase.description}`);

    const report = validateSpec(testCase.spec as MapSpec);
    console.log(`Valid: ${report.valid}`);
    console.log(`Diagnostics: ${report.diagnostics.length}`);

    panelHtml += `<div class="diag-step">`;
    panelHtml += `<h3>Step ${i + 1}: ${testCase.title}</h3>`;
    panelHtml += `<div style="color:#94a3b8;margin-bottom:8px">${testCase.description}</div>`;
    panelHtml += `<div style="color:#a6e3a1;margin-bottom:8px">Valid: ${report.valid} | Diagnostics: ${report.diagnostics.length}</div>`;

    for (const d of report.diagnostics) {
      console.log(`  [${d.severity}] ${d.code} at ${d.path ?? "—"}`);
      console.log(`    ${d.message}`);
      if (d.fix) console.log(`    Fix: ${d.fix.message}`);
      panelHtml += renderDiagnostic(d);
    }

    if (report.diagnostics.length === 0) {
      panelHtml += `<div class="diag-info">No diagnostics produced (spec may have passed or been accepted with warnings).</div>`;
    }

    panelHtml += `</div>`;
  }

  // Now validate the fixed spec
  panelHtml += `<div class="diag-step">`;
  panelHtml += `<h3>Fixed Spec (recovery)</h3>`;
  panelHtml += `<div style="color:#a6e3a1">After applying fixes, the corrected spec passes validation:</div>`;

  const fixedReport = validateSpec(validSpec);
  panelHtml += `<div style="color:#a6e3a1;margin:8px 0">Valid: ${fixedReport.valid} | `;
  panelHtml += `Sources: ${fixedReport.stats.sourceCount} | Layers: ${fixedReport.stats.layerCount}</div>`;

  if (!fixedReport.valid) {
    for (const d of fixedReport.diagnostics) {
      panelHtml += renderDiagnostic(d);
    }
    console.error("Fixed spec still invalid — check diagnostics.");
  } else {
    panelHtml += `<div style="color:#a6e3a1;margin-top:8px">✓ Spec is valid. Rendering map…</div>`;
  }

  panelHtml += `</div>`;

  if (diagOutput) {
    diagOutput.innerHTML = panelHtml;
  }

  // Render the valid map on the map panel
  const container = document.getElementById("map");
  if (!container) throw new Error("Missing #map container.");

  const runtime = await createMap(container, validSpec, { renderer: "maplibre" });
  console.log("\nMap rendered successfully with the fixed spec.");
  console.log(`Exported spec has ${runtime.exportSpec().layers.length} layer(s).`);
}

void main().catch((error) => {
  console.error("Diagnostic error fix example failed:", error);
});
