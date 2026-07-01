// =============================================================================
// GIS Engine - Choropleth Auto Example
// =============================================================================
//
// Demonstrates AI-driven choropleth map generation using the generate_spec tool:
//   1. Describe the desired map in natural language
//   2. generateSpecTool produces a validated MapSpec with choropleth styling
//   3. The generated spec uses interpolate expressions for data-driven color ramps
//   4. Render the result on the map
//
// This showcases the "ocean" theme with population-driven choropleth styling.
//
// =============================================================================

import { createMap, validateSpec } from "@gis-engine/engine";
import { generateSpecTool } from "@gis-engine/ai";

// ---------------------------------------------------------------------------
// Step 1: Use generate_spec to create a choropleth spec
// ---------------------------------------------------------------------------

const response = generateSpecTool({
  intent: {
    description: "A choropleth map showing population density across US states",
    dataType: "geojson",
    theme: "ocean",
    dataProperty: "population",
  },
});

// ---------------------------------------------------------------------------
// Step 2: Inspect the generation result
// ---------------------------------------------------------------------------

if (!response.ok) {
  console.error("Generation failed:");
  for (const d of response.diagnostics) {
    console.error(`  [${d.severity}] ${d.code}: ${d.message}`);
  }
  throw new Error("Cannot proceed — spec generation failed.");
}

const { spec, diagnostics, suggestions } = response.result;

console.log("--- Generation Result ---");
console.log(`Spec ID: ${spec.id ?? "(auto)"}`);
console.log(`View: center=${JSON.stringify(spec.view.center)}, zoom=${spec.view.zoom}`);
console.log(`Sources: ${Object.keys(spec.sources).length}`);
console.log(`Layers: ${spec.layers.length}`);

if (diagnostics.length > 0) {
  console.log("\nDiagnostics:");
  for (const d of diagnostics) {
    console.log(`  [${d.severity}] ${d.code}: ${d.message}`);
  }
}

console.log("\nSuggestions:");
for (const s of suggestions) {
  console.log(`  - ${s}`);
}

// ---------------------------------------------------------------------------
// Step 3: Validate the generated spec
// ---------------------------------------------------------------------------

const report = validateSpec(spec);
console.log(`\n--- Validation Report ---`);
console.log(`Valid: ${report.valid}`);
console.log(`Sources: ${report.stats.sourceCount}, Layers: ${report.stats.layerCount}`);

if (!report.valid) {
  console.error("Spec validation failed:");
  for (const d of report.diagnostics) {
    console.error(`  [${d.severity}] ${d.code}: ${d.message}`);
  }
  throw new Error("Cannot proceed with an invalid spec.");
}

// ---------------------------------------------------------------------------
// Step 4: Render the generated choropleth map
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const container = document.getElementById("map");
  if (!container) throw new Error("Missing #map container.");

  const runtime = await createMap(container, spec, { renderer: "maplibre" });

  console.log("Choropleth map rendered successfully.");
  console.log(`Exported spec has ${runtime.exportSpec().layers.length} layer(s).`);
}

void main().catch((error) => {
  console.error("Choropleth auto example failed:", error);
});
