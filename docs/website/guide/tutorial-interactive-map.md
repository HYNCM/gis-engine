# Interactive Map with Events

This tutorial shows how to build an interactive map that responds to user
clicks, hover, and camera changes using the GIS Engine adapter event system.

## Prerequisites

- Node.js 22+ and npm/pnpm installed
- A working GIS Engine project (see [Quick Start](/guide/quick-start))

## Overview: The Event System

GIS Engine adapters emit typed events through the `on()` method. The supported
events are:

| Event | When |
|-------|------|
| `"click"` | User clicks the map |
| `"mousemove"` | Mouse moves over the map |
| `"moveend"` | Camera finishes panning |
| `"zoomend"` | Camera finishes zooming |
| `"load"` | Map finishes initial load |
| `"idle"` | Map finishes all pending work |
| `"data"` | New data loaded |
| `"error"` | Runtime error |
| `"warning"` | Non-fatal warning |
| `"stats"` | Performance statistics |

To access events, create the adapter explicitly using `createAdapter()` and
pass it to `MapRuntime.create()`.

## Step 1: Set Up the Map with an Explicit Adapter

```typescript
import "maplibre-gl/dist/maplibre-gl.css";
import { createAdapter, MapRuntime, type MapSpec } from "@gis-engine/engine";
import type { RendererAdapter } from "@gis-engine/engine";

const spec: MapSpec = {
  version: "0.1",
  sources: {
    basemap: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
    points: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { name: "West Lake", type: "lake" },
            geometry: { type: "Point", coordinates: [120.15, 30.25] },
          },
          {
            type: "Feature",
            properties: { name: "Lingyin Temple", type: "temple" },
            geometry: { type: "Point", coordinates: [120.1, 30.24] },
          },
          {
            type: "Feature",
            properties: { name: "Hangzhou Station", type: "station" },
            geometry: { type: "Point", coordinates: [120.18, 30.27] },
          },
        ],
      },
    },
  },
  layers: [
    {
      id: "basemap-layer",
      type: "raster",
      source: "basemap",
    },
    {
      id: "point-layer",
      type: "circle",
      source: "points",
      paint: {
        "circle-radius": 8,
        "circle-color": "#3b82f6",
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 2,
      },
    },
  ],
  view: { mode: "map2d", center: [120.15, 30.26], zoom: 12 },
};

async function main(): Promise<void> {
  const container = document.getElementById("map");
  if (!container) throw new Error("Missing #map container.");

  // Create the adapter explicitly so we can subscribe to events
  const adapter = createAdapter("maplibre") as RendererAdapter;

  // Create the runtime with our adapter
  const runtime = await MapRuntime.create(spec, { adapter, container });

  console.log("Map rendered. Try clicking on the blue dots!");
}

void main().catch(console.error);
```

## Step 2: Handle Click Events

Add a click handler that queries features at the clicked location and shows
the feature's properties:

```typescript
// After MapRuntime.create()...

adapter.on("click", (event: unknown) => {
  const e = event as { point?: { x: number; y: number }; lngLat?: { lng: number; lat: number } };

  if (e.lngLat) {
    console.log(`Clicked at: ${e.lngLat.lng.toFixed(4)}, ${e.lngLat.lat.toFixed(4)}`);
  }

  // Query features at the click point
  if (e.point) {
    runtime.queryFeatures({
      point: e.point,
      layers: ["point-layer"],
    }).then((result) => {
      if (result.features.length > 0) {
        const feature = result.features[0];
        console.log("Clicked feature:", feature.properties);
        showInfoPanel(container, feature.properties);
      }
    });
  }
});

function showInfoPanel(container: HTMLElement, props: Record<string, unknown>): void {
  // Remove existing panel
  const existing = container.querySelector(".info-panel");
  if (existing) existing.remove();

  const panel = document.createElement("div");
  panel.className = "info-panel";
  panel.style.cssText = `
    position: absolute; top: 10px; right: 10px; z-index: 10;
    background: white; padding: 16px; border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-family: system-ui;
    max-width: 250px;
  `;

  panel.innerHTML = `
    <h3 style="margin:0 0 8px; font-size:16px;">${props.name ?? "Unknown"}</h3>
    <p style="margin:0; color:#64748b; font-size:13px;">Type: ${props.type ?? "—"}</p>
  `;

  container.style.position = "relative";
  container.appendChild(panel);

  // Auto-dismiss after 4 seconds
  setTimeout(() => panel.remove(), 4000);
}
```

## Step 3: Add Hover Effects

Change the cursor and highlight the feature under the mouse:

```typescript
adapter.on("mousemove", (event: unknown) => {
  const e = event as { point?: { x: number; y: number } };
  if (!e.point) return;

  runtime.queryFeatures({
    point: e.point,
    layers: ["point-layer"],
  }).then((result) => {
    const map = adapter.getMapInstance?.() as maplibregl.Map | undefined;
    if (!map) return;

    if (result.features.length > 0) {
      map.getCanvas().style.cursor = "pointer";
    } else {
      map.getCanvas().style.cursor = "";
    }
  });
});
```

## Step 4: Track Camera Changes

Listen for `moveend` and `zoomend` to track the user's viewport:

```typescript
adapter.on("moveend", (event: unknown) => {
  const map = adapter.getMapInstance?.() as maplibregl.Map | undefined;
  if (!map) return;

  const center = map.getCenter();
  const zoom = map.getZoom();
  console.log(`View: center=[${center.lng.toFixed(4)}, ${center.lat.toFixed(4)}], zoom=${zoom.toFixed(1)}`);
});

adapter.on("zoomend", () => {
  const map = adapter.getMapInstance?.() as maplibregl.Map | undefined;
  if (map) {
    console.log(`Zoom level: ${map.getZoom().toFixed(1)}`);
  }
});
```

## Step 5: Use Commands for Dynamic Updates

Combine events with the command system to make the map truly interactive.
For example, zoom to a feature when clicked:

```typescript
adapter.on("click", async (event: unknown) => {
  const e = event as { point?: { x: number; y: number } };
  if (!e.point) return;

  const result = await runtime.queryFeatures({
    point: e.point,
    layers: ["point-layer"],
  });

  if (result.features.length > 0) {
    const coords = result.features[0].geometry?.coordinates as [number, number];
    if (coords) {
      // Zoom to the clicked feature using the command system
      await runtime.apply({
        type: "setView",
        view: { center: coords, zoom: 15 },
      });
    }
  }
});
```

## Complete Example

Here's the full `main.ts` with all interactions combined:

```typescript
import "maplibre-gl/dist/maplibre-gl.css";
import { createAdapter, MapRuntime, type MapSpec } from "@gis-engine/engine";
import type { RendererAdapter } from "@gis-engine/engine";

const spec: MapSpec = {
  version: "0.1",
  sources: {
    basemap: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
    },
    points: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { name: "West Lake", type: "lake" },
            geometry: { type: "Point", coordinates: [120.15, 30.25] },
          },
          {
            type: "Feature",
            properties: { name: "Lingyin Temple", type: "temple" },
            geometry: { type: "Point", coordinates: [120.1, 30.24] },
          },
          {
            type: "Feature",
            properties: { name: "Hangzhou Station", type: "station" },
            geometry: { type: "Point", coordinates: [120.18, 30.27] },
          },
        ],
      },
    },
  },
  layers: [
    { id: "basemap-layer", type: "raster", source: "basemap" },
    {
      id: "point-layer",
      type: "circle",
      source: "points",
      paint: {
        "circle-radius": 8,
        "circle-color": "#3b82f6",
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 2,
      },
    },
  ],
  view: { mode: "map2d", center: [120.15, 30.26], zoom: 12 },
};

async function main(): Promise<void> {
  const container = document.getElementById("map")!;
  const adapter = createAdapter("maplibre") as RendererAdapter;
  const runtime = await MapRuntime.create(spec, { adapter, container });

  // Click: show feature info and zoom in
  adapter.on("click", async (event: unknown) => {
    const e = event as { point?: { x: number; y: number } };
    if (!e.point) return;

    const result = await runtime.queryFeatures({ point: e.point, layers: ["point-layer"] });
    if (result.features.length > 0) {
      const props = result.features[0].properties as Record<string, unknown>;
      const coords = result.features[0].geometry?.coordinates as [number, number];
      console.log("Selected:", props.name);

      if (coords) {
        await runtime.apply({ type: "setView", view: { center: coords, zoom: 15 } });
      }
    }
  });

  // Hover: change cursor
  adapter.on("mousemove", (event: unknown) => {
    const e = event as { point?: { x: number; y: number } };
    if (!e.point) return;
    runtime.queryFeatures({ point: e.point, layers: ["point-layer"] }).then((r) => {
      const map = adapter.getMapInstance?.() as { getCanvas(): HTMLCanvasElement } | undefined;
      if (map) map.getCanvas().style.cursor = r.features.length > 0 ? "pointer" : "";
    });
  });

  // Camera tracking
  adapter.on("moveend", () => {
    const map = adapter.getMapInstance?.() as { getCenter(): { lng: number; lat: number }; getZoom(): number } | undefined;
    if (map) {
      const c = map.getCenter();
      console.log(`[${c.lng.toFixed(3)}, ${c.lat.toFixed(3)}] z${map.getZoom().toFixed(1)}`);
    }
  });

  console.log("Interactive map ready. Click the blue dots!");
}

void main().catch(console.error);
```

## What's Next

- [Build a Choropleth Map](/guide/tutorial-choropleth) — data-driven styling
- [AI-Assisted Map Creation](/guide/tutorial-ai-map) — generate maps with AI tools
- [Command System](/guide/commands) — dry-run, rollback, and conflict detection
- [Snapshot Testing](/guide/snapshot-testing) — test your interactive maps
