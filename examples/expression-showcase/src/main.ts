// =============================================================================
// GIS Engine - Expression Showcase Example
// =============================================================================
//
// Demonstrates 4 categories of newly added expression capabilities:
//
//   1. Arithmetic expressions (+, -, *, /) — population density calculation
//   2. coalesce — fallback data property resolution
//   3. String expressions (concat, upcase, downcase) — dynamic text formatting
//   4. Exponential interpolate — non-linear magnitude-to-radius mapping
//
// Each layer uses real expression syntax validated by the schema engine.
//
// =============================================================================

import type { MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Step 1: Sample data with diverse properties
// ---------------------------------------------------------------------------

const regionsData = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: {
        name: "Alpha",
        name_en: "Alpha Region",
        code: "ALP",
        population: 5200000,
        area: 12400,
        density: 419,
        magnitude: 3.2,
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [10, 40],
            [15, 40],
            [15, 45],
            [10, 45],
            [10, 40],
          ],
        ],
      },
    },
    {
      type: "Feature" as const,
      properties: {
        name: "Beta",
        name_en: null,
        code: "BET",
        population: 8700000,
        area: 25800,
        density: 337,
        magnitude: 5.1,
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [15, 40],
            [20, 40],
            [20, 45],
            [15, 45],
            [15, 40],
          ],
        ],
      },
    },
    {
      type: "Feature" as const,
      properties: {
        name: "Gamma",
        name_en: "Gamma Province",
        code: "GAM",
        population: 1500000,
        area: 8200,
        density: 183,
        magnitude: 2.8,
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [10, 45],
            [15, 45],
            [15, 50],
            [10, 50],
            [10, 45],
          ],
        ],
      },
    },
    {
      type: "Feature" as const,
      properties: {
        name: "Delta",
        name_en: "Delta State",
        code: "DEL",
        population: 12000000,
        area: 45600,
        density: 263,
        magnitude: 7.4,
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [15, 45],
            [20, 45],
            [20, 50],
            [15, 50],
            [15, 45],
          ],
        ],
      },
    },
  ],
};

const citiesData = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: { name: "Springfield", name_en: "Springfield", population: 1200000, magnitude: 4.5 },
      geometry: { type: "Point" as const, coordinates: [12.5, 42.5] },
    },
    {
      type: "Feature" as const,
      properties: { name: "Riverside", name_en: null, population: 850000, magnitude: 6.2 },
      geometry: { type: "Point" as const, coordinates: [17.5, 42.5] },
    },
    {
      type: "Feature" as const,
      properties: { name: "Lakewood", name_en: "Lakewood City", population: 2100000, magnitude: 3.0 },
      geometry: { type: "Point" as const, coordinates: [12.5, 47.5] },
    },
    {
      type: "Feature" as const,
      properties: { name: "Hilltop", name_en: "Hilltop Town", population: 430000, magnitude: 8.1 },
      geometry: { type: "Point" as const, coordinates: [17.5, 47.5] },
    },
  ],
};

// ---------------------------------------------------------------------------
// Step 2: Define the MapSpec with 4 expression categories
// ---------------------------------------------------------------------------

const spec: MapSpec = {
  version: "0.1",
  id: "expression-showcase",
  view: {
    mode: "map2d",
    center: [15, 45],
    zoom: 5,
  },
  sources: {
    regions: { type: "geojson", data: regionsData },
    cities: { type: "geojson", data: citiesData },
  },
  layers: [
    // ── Category 1: Arithmetic expressions (/) ──────────────────────────
    // Population density = population / area, driving fill color
    {
      id: "density-fill",
      type: "fill",
      source: "regions",
      paint: {
        "fill-color": [
          "interpolate",
          ["linear"],
          ["/", ["get", "population"], ["get", "area"]],
          0,
          "#f7fbff",
          500,
          "#6baed6",
          1000,
          "#08306b",
        ],
        "fill-opacity": 0.8,
      },
    },
    {
      id: "region-outline",
      type: "line",
      source: "regions",
      paint: {
        "line-color": "#333333",
        "line-width": 1,
      },
    },

    // ── Category 2: coalesce — fallback property resolution ─────────────
    // Uses name_en if available, falls back to name, then "Unknown"
    {
      id: "coalesce-labels",
      type: "symbol-lite",
      source: "regions",
      layout: {
        "text-field": ["coalesce", ["get", "name_en"], ["get", "name"], "Unknown"],
        "text-size": 14,
        "text-offset": [0, -1],
      },
      paint: {
        "text-color": "#1e293b",
      },
    },

    // ── Category 3: String expressions (concat, upcase) ─────────────────
    // Formats city labels as "NAME (population)"
    {
      id: "city-string-labels",
      type: "symbol-lite",
      source: "cities",
      layout: {
        "text-field": ["concat", ["upcase", ["get", "name"]], " (", ["to-string", ["get", "population"]], ")"],
        "text-size": 11,
        "text-offset": [0, 1.5],
      },
      paint: {
        "text-color": "#4a5568",
      },
    },

    // ── Category 4: Exponential interpolate ─────────────────────────────
    // Non-linear magnitude-to-radius mapping: base=1.5
    {
      id: "magnitude-circles",
      type: "circle",
      source: "cities",
      paint: {
        "circle-radius": ["interpolate", ["exponential", 1.5], ["get", "magnitude"], 0, 1, 9, 50],
        "circle-color": ["interpolate", ["linear"], ["get", "magnitude"], 0, "#22c55e", 5, "#f59e0b", 9, "#ef4444"],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
        "circle-opacity": 0.85,
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

  console.log("Expression showcase rendered successfully.");
  console.log(`Exported spec has ${runtime.exportSpec().layers.length} layer(s).`);
}

void main().catch((error) => {
  console.error("Expression showcase example failed:", error);
});
