// =============================================================================
// GIS Engine - Interactive Popups Example
// =============================================================================
//
// Demonstrates interactive features using the MapSpec interactions field:
//   - click: show a popup with feature properties
//   - hover: change cursor and highlight feature on mouseover
//   - popup: declared in the spec to signal popup capability
//
// This example uses MapLibre GL JS Popup for the click popup and cursor
// changes for hover feedback.
//
// =============================================================================

import maplibregl from "maplibre-gl";
import type { MapSpec } from "@gis-engine/engine";
import { createMap, validateSpec } from "@gis-engine/engine";

// ---------------------------------------------------------------------------
// Step 1: Inline GeoJSON data — landmarks with descriptions
// ---------------------------------------------------------------------------

const landmarksData = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { name: "West Lake", description: "UNESCO World Heritage Site", rating: 4.8 }, geometry: { type: "Point", coordinates: [120.14, 30.25] } },
    { type: "Feature", properties: { name: "Lingyin Temple", description: "Ancient Buddhist temple", rating: 4.6 }, geometry: { type: "Point", coordinates: [120.10, 30.24] } },
    { type: "Feature", properties: { name: "Hefang Street", description: "Historic pedestrian shopping street", rating: 4.3 }, geometry: { type: "Point", coordinates: [120.17, 30.25] } },
    { type: "Feature", properties: { name: "Grand Canal", description: "World's longest ancient canal", rating: 4.5 }, geometry: { type: "Point", coordinates: [120.20, 30.30] } },
    { type: "Feature", properties: { name: "Xixi Wetland", description: "National wetland park", rating: 4.7 }, geometry: { type: "Point", coordinates: [120.06, 30.27] } },
    { type: "Feature", properties: { name: "Qiantang River Bridge", description: "Iconic double-deck bridge", rating: 4.2 }, geometry: { type: "Point", coordinates: [120.22, 30.22] } },
  ],
};

// ---------------------------------------------------------------------------
// Step 2: Define the MapSpec with interactions
// ---------------------------------------------------------------------------

const spec: MapSpec = {
  version: "0.1",
  id: "interactive-popups",
  view: {
    mode: "map2d",
    center: [120.15, 30.26],
    zoom: 12,
  },
  sources: {
    landmarks: {
      type: "geojson",
      data: landmarksData,
    },
  },
  interactions: {
    pan: true,
    zoom: true,
    click: true,
    hover: true,
    popup: true,
  },
  layers: [
    {
      id: "landmark-circles",
      type: "circle",
      source: "landmarks",
      paint: {
        "circle-radius": 8,
        "circle-color": "#dc2626",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
    },
    {
      id: "landmark-labels",
      type: "symbol-lite",
      source: "landmarks",
      layout: {
        "text-field": ["get", "name"],
        "text-size": 11,
        "text-offset": [0, 1.5],
      },
      paint: {
        "text-color": "#1e293b",
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Step 3: Validate, render, and attach interactions
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
  console.log("Map rendered successfully.");

  // Access the underlying MapLibre map instance for native interaction APIs.
  // The runtime exposes the adapter; for MapLibre we can query the map.
  const adapter = runtime.adapter;
  if (!adapter || !("map" in adapter)) {
    console.warn("MapLibre adapter not available — interactions disabled.");
    return;
  }

  const map = (adapter as { map: maplibregl.Map }).map;
  const layerId = "landmark-circles";

  // --- Click: show popup ---
  map.on("click", layerId, (e) => {
    if (!e.features || e.features.length === 0) return;
    const props = e.features[0].properties as Record<string, unknown>;

    const popupHtml = `
      <div class="popup-content">
        <strong>${props.name}</strong>
        <div>${props.description}</div>
        <div>Rating: ${"★".repeat(Math.round(Number(props.rating)))} (${props.rating})</div>
      </div>
    `;

    new maplibregl.Popup({ offset: 12 })
      .setLngLat(e.lngLat)
      .setHTML(popupHtml)
      .addTo(map);
  });

  // --- Hover: cursor change + highlight ---
  map.on("mouseenter", layerId, () => {
    map.getCanvas().style.cursor = "pointer";
    // Highlight: enlarge circles on hover
    map.setPaintProperty(layerId, "circle-radius", 12);
    map.setPaintProperty(layerId, "circle-color", "#f59e0b");
  });

  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";
    // Restore original style
    map.setPaintProperty(layerId, "circle-radius", 8);
    map.setPaintProperty(layerId, "circle-color", "#dc2626");
  });

  console.log("Click any red circle to see details. Hover to highlight.");
}

void main().catch((error) => {
  console.error("Interactive popups example failed:", error);
});
