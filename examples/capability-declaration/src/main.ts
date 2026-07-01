// =============================================================================
// GIS Engine - Capability Declaration Example
// =============================================================================
//
// Demonstrates the MapSpec capabilities field and how the engine handles
// capability requests:
//   1. Standard 2D capability (always supported by MapLibre)
//   2. 2.5D capability (pitch + bearing, supported by MapLibre)
//   3. Experimental capability (fill-extrusion-lite, beta)
//   4. Unsupported capability (scene3d on MapLibre adapter — blocked)
//
// Each case shows how the validation and runtime respond to the declared
// capabilities, demonstrating the capability gate mechanism.
//
// =============================================================================

import type { CapabilityRequest, MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Step 1: Define capability test cases
// ---------------------------------------------------------------------------

interface CapTestCase {
  label: string;
  description: string;
  capabilities: CapabilityRequest;
  viewMode: MapSpec["view"]["mode"];
  shouldRender: boolean;
}

const testCases: CapTestCase[] = [
  {
    label: "Standard 2D",
    description: "Basic 2D map — always supported by MapLibre adapter.",
    capabilities: { dimensions: ["2d"], renderer: "maplibre" },
    viewMode: "map2d",
    shouldRender: true,
  },
  {
    label: "2.5D with pitch",
    description: "2.5D view with pitch and bearing — supported by MapLibre.",
    capabilities: { dimensions: ["2_5d"], renderer: "maplibre" },
    viewMode: "map2_5d",
    shouldRender: true,
  },
  {
    label: "Experimental fill-extrusion-lite",
    description: "Requests experimental capability — may produce warnings.",
    capabilities: { dimensions: ["2_5d"], experimental: ["fill-extrusion-lite"] },
    viewMode: "map2_5d",
    shouldRender: true,
  },
  {
    label: "Scene3D (blocked on MapLibre)",
    description: "Requests 3D scene capability — blocked by MapLibre adapter.",
    capabilities: { dimensions: ["3d"], renderer: "scene3d" },
    viewMode: "scene3d",
    shouldRender: false,
  },
];

// ---------------------------------------------------------------------------
// Step 2: Build specs for each test case
// ---------------------------------------------------------------------------

const inlineGeoJson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Demo Area", height: 80 },
      geometry: {
        type: "Polygon",
        coordinates: [[[120.14, 30.27], [120.18, 30.27], [120.18, 30.29], [120.14, 30.29], [120.14, 30.27]]],
      },
    },
  ],
};

function buildSpec(tc: CapTestCase): MapSpec {
  const spec: MapSpec = {
    version: "0.1",
    id: `cap-test-${tc.label.toLowerCase().replace(/\s+/g, "-")}`,
    capabilities: tc.capabilities,
    view: {
      mode: tc.viewMode,
      center: [120.16, 30.28],
      zoom: 13,
      ...(tc.viewMode === "map2_5d" ? { pitch: 45, bearing: 15 } : {}),
    },
    sources: {
      demo: { type: "geojson", data: inlineGeoJson },
    },
    layers: [
      {
        id: "demo-fill",
        type: tc.capabilities.experimental?.includes("fill-extrusion-lite")
          ? "fill-extrusion-lite"
          : "fill",
        source: "demo",
        paint: tc.capabilities.experimental?.includes("fill-extrusion-lite")
          ? {
              "fill-extrusion-color": "#38bdf8",
              "fill-extrusion-height": ["to-number", ["get", "height"], 0],
              "fill-extrusion-base": 0,
              "fill-extrusion-opacity": 0.7,
            }
          : {
              "fill-color": "#38bdf8",
              "fill-opacity": 0.5,
            },
      },
      {
        id: "demo-outline",
        type: "line",
        source: "demo",
        paint: { "line-color": "#0c4a6e", "line-width": 2 },
      },
    ],
  };
  return spec;
}

// ---------------------------------------------------------------------------
// Step 3: Run capability tests and render the first successful one
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const capOutput = document.getElementById("cap-output");
  let panelHtml = "";
  let firstRenderedSpec: MapSpec | null = null;

  for (const tc of testCases) {
    console.log(`\n=== ${tc.label} ===`);
    console.log(`Capabilities:`, JSON.stringify(tc.capabilities));

    const spec = buildSpec(tc);
    const report = validateSpec(spec);

    console.log(`Valid: ${report.valid}`);
    console.log(`Diagnostics: ${report.diagnostics.length}`);

    for (const d of report.diagnostics) {
      console.log(`  [${d.severity}] ${d.code}: ${d.message}`);
    }

    // Determine status
    let statusClass: string;
    let statusText: string;
    if (report.valid && tc.shouldRender) {
      statusClass = "cap-ok";
      statusText = "SUPPORTED";
      if (!firstRenderedSpec) firstRenderedSpec = spec;
    } else if (report.valid && !tc.shouldRender) {
      statusClass = "cap-warn";
      statusText = "VALID BUT BLOCKED AT RUNTIME";
    } else {
      statusClass = "cap-fail";
      statusText = "VALIDATION FAILED";
    }

    panelHtml += `<div class="cap-card">`;
    panelHtml += `<h3>${tc.label} <span class="cap-status ${statusClass}">${statusText}</span></h3>`;
    panelHtml += `<div class="cap-detail">${tc.description}</div>`;
    panelHtml += `<div class="cap-detail"><strong>Capabilities:</strong> ${JSON.stringify(tc.capabilities)}</div>`;
    panelHtml += `<div class="cap-detail"><strong>View mode:</strong> ${tc.viewMode}</div>`;

    if (report.diagnostics.length > 0) {
      panelHtml += `<div class="cap-detail"><strong>Diagnostics:</strong></div>`;
      for (const d of report.diagnostics) {
        panelHtml += `<div class="cap-detail" style="padding-left:12px">[${d.severity}] ${d.code}: ${d.message}</div>`;
      }
    }

    panelHtml += `</div>`;
  }

  if (capOutput) {
    capOutput.innerHTML = panelHtml;
  }

  // Render the first supported spec on the map
  if (firstRenderedSpec) {
    const container = document.getElementById("map");
    if (!container) throw new Error("Missing #map container.");

    const runtime = await createMap(container, firstRenderedSpec, { renderer: "maplibre" });
    console.log("\nMap rendered with:", firstRenderedSpec.id);
    console.log(`Exported spec has ${runtime.exportSpec().layers.length} layer(s).`);
  } else {
    console.warn("No spec could be rendered.");
  }
}

void main().catch((error) => {
  console.error("Capability declaration example failed:", error);
});
