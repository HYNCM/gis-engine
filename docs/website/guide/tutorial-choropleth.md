# Build a Choropleth Map in 10 Minutes

This tutorial walks you through creating a data-driven choropleth map using
GIS Engine and MapLibre GL JS. By the end, you'll have a map that colors
regions based on a data property.

## Prerequisites

- Node.js 22+ and npm/pnpm installed
- Basic familiarity with TypeScript and HTML

## Step 1: Project Setup

Create a new project and install dependencies:

```bash
mkdir choropleth-tutorial && cd choropleth-tutorial
npm init -y
npm install @gis-engine/engine maplibre-gl vite typescript
```

Create the following files:

::: code-group

```html [index.html]
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Choropleth Map Tutorial</title>
    <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css" />
    <style>
      body { margin: 0; }
      #map { width: 100vw; height: 100vh; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

```json [tsconfig.json]
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

:::

Add a start script to `package.json`:

```json
{
  "scripts": {
    "dev": "vite"
  }
}
```

## Step 2: Create a MapSpec with GeoJSON Data

Create `src/main.ts`. Start by defining a GeoJSON data source with a numeric
property (`population`) that we'll use for the color ramp:

```typescript
import "maplibre-gl/dist/maplibre-gl.css";
import { createMap, type MapSpec } from "@gis-engine/engine";

const spec: MapSpec = {
  version: "0.1",
  sources: {
    basemap: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
    regions: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { name: "District A", population: 1200 },
            geometry: {
              type: "Polygon",
              coordinates: [[[120.1, 30.2], [120.2, 30.2], [120.2, 30.3], [120.1, 30.3], [120.1, 30.2]]],
            },
          },
          {
            type: "Feature",
            properties: { name: "District B", population: 4500 },
            geometry: {
              type: "Polygon",
              coordinates: [[[120.2, 30.2], [120.3, 30.2], [120.3, 30.3], [120.2, 30.3], [120.2, 30.2]]],
            },
          },
          {
            type: "Feature",
            properties: { name: "District C", population: 8200 },
            geometry: {
              type: "Polygon",
              coordinates: [[[120.1, 30.3], [120.2, 30.3], [120.2, 30.4], [120.1, 30.4], [120.1, 30.3]]],
            },
          },
          {
            type: "Feature",
            properties: { name: "District D", population: 15000 },
            geometry: {
              type: "Polygon",
              coordinates: [[[120.2, 30.3], [120.3, 30.3], [120.3, 30.4], [120.2, 30.4], [120.2, 30.3]]],
            },
          },
        ],
      },
    },
  },
  layers: [],
  view: { mode: "map2d", center: [120.2, 30.3], zoom: 11 },
};
```

## Step 3: Add Data-Driven Styling

Now add layers with an `interpolate` expression that maps `population` to
a color ramp. This is the core of a choropleth map:

```typescript
spec.layers = [
  {
    id: "basemap-layer",
    type: "raster",
    source: "basemap",
    paint: { "raster-opacity": 0.4 },
  },
  {
    id: "region-fill",
    type: "fill",
    source: "regions",
    paint: {
      "fill-color": [
        "interpolate",
        ["linear"],
        ["get", "population"],
        0, "#f7fbff",
        5000, "#6baed6",
        15000, "#08306b",
      ],
      "fill-opacity": 0.7,
    },
  },
  {
    id: "region-outline",
    type: "line",
    source: "regions",
    paint: { "line-color": "#1e3a5f", "line-width": 1.5 },
  },
  {
    id: "region-labels",
    type: "symbol-lite",
    source: "regions",
    layout: {
      "text-field": ["get", "name"],
      "text-size": 13,
    },
    paint: { "text-color": "#0f172a" },
  },
];
```

The `interpolate` expression works as follows:

- `["linear"]` — linear interpolation between stops
- `["get", "population"]` — read the `population` property from each feature
- The stop pairs (`0 → #f7fbff`, `5000 → #6baed6`, `15000 → #08306b`) define
  the color ramp

## Step 4: Render the Map

Add the rendering code at the bottom of `main.ts`:

```typescript
async function main(): Promise<void> {
  const container = document.getElementById("map");
  if (!container) throw new Error("Missing #map container.");

  const runtime = await createMap(container, spec, { renderer: "maplibre" });
  console.log("Choropleth map rendered.");
  console.log(`Layers: ${runtime.exportSpec().layers.length}`);
}

void main().catch(console.error);
```

## Step 5: Run It

```bash
npm run dev
```

Open `http://localhost:5173` in your browser. You should see a map centered on
the Hangzhou area with four colored districts — lighter blue for low population,
darker blue for high population.

## Bonus: Generate with AI

You can also generate a choropleth spec using the AI tool:

```typescript
import { generateSpecTool } from "@gis-engine/ai";

const response = generateSpecTool({
  intent: {
    description: "A choropleth map showing population density across US states",
    dataType: "geojson",
    theme: "ocean",
    dataProperty: "population",
  },
});

if (response.ok) {
  console.log("Generated spec:", response.result.spec);
  console.log("Suggestions:", response.result.suggestions);
}
```

## What's Next

- [AI-Assisted Map Creation](/guide/tutorial-ai-map) — use MCP tools to generate and edit maps with AI
- [Interactive Map with Events](/guide/tutorial-interactive-map) — add click handlers and hover effects
- [Command System](/guide/commands) — learn how to mutate maps safely at runtime
- [Diagnostics](/guide/diagnostics) — understand structured error handling
