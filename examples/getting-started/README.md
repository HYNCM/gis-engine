# Getting Started with GIS Engine

This example walks you through the fundamentals of GIS Engine: defining a
declarative map specification, validating it, rendering it with MapLibre GL JS,
and applying commands to mutate the map at runtime.

## Prerequisites

- **Node.js 18+** (LTS recommended)
- **npm 9+** (ships with Node.js 18)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the Vite dev server
npm run dev

# 3. Open the URL printed in the terminal (usually http://localhost:5173)
```

You should see a world map with 10 city markers rendered as blue circles. The
browser console will display the validation report and command results.

## Understanding the MapSpec

At the heart of GIS Engine is the **MapSpec** -- a plain, JSON-serializable
object that fully describes your map. Unlike imperative map SDKs, there is no
hidden runtime state. Everything you see on screen is derived from the spec.

A MapSpec has four required fields:

```ts
const spec: MapSpec = {
  version: "0.1",       // Spec format version (always "0.1" for now)
  view: { ... },        // Camera position: center, zoom, bearing, pitch
  sources: { ... },     // Named data sources (GeoJSON, raster, vector, PMTiles)
  layers: [ ... ],      // Visual layers referencing those sources
};
```

### Sources

Sources are named data providers stored in the `sources` record. This example
uses a single GeoJSON source:

```ts
sources: {
  cities: {
    type: "geojson",
    data: citiesData,  // An inline GeoJSON FeatureCollection
  },
},
```

GIS Engine supports four source types:

| Type       | Use Case                        | Key Fields              |
|------------|---------------------------------|-------------------------|
| `geojson`  | Point/line/polygon features     | `data` (object or URL)  |
| `raster`   | Tiled raster imagery            | `tiles`, `tileSize`     |
| `pmtiles`  | Cloud-optimized PMTiles archive | `url`                   |
| `vector`   | Vector tile services            | `tiles` or `url`        |

### Layers

Layers describe how source data is rendered visually. Each layer references a
source by name and specifies a render type:

```ts
layers: [
  {
    id: "city-circles",
    type: "circle",
    source: "cities",
    paint: {
      "circle-radius": 6,
      "circle-color": "#3b82f6",
    },
  },
],
```

Supported layer types: `circle`, `fill`, `line`, `raster`, `symbol-lite`,
`background`, and `fill-extrusion-lite` (experimental 2.5D).

### View

The `view` field sets the initial camera position:

```ts
view: {
  mode: "map2d",
  center: [20, 25],  // [longitude, latitude]
  zoom: 2,
},
```

## Try It Yourself

### Add a heatmap-style layer

Add a second layer to the spec that visualizes city density with larger,
semi-transparent circles:

```ts
// Add this to the layers array in the spec:
{
  id: "city-heat",
  type: "circle",
  source: "cities",
  paint: {
    "circle-radius": 20,
    "circle-color": "#f97316",
    "circle-opacity": 0.3,
  },
},
```

### Change the initial view

Zoom into Asia by changing the `view` field:

```ts
view: {
  mode: "map2d",
  center: [110, 30],
  zoom: 4,
},
```

### Apply a command at runtime

After the map is created, use `runtime.apply()` to mutate the spec in a
controlled, auditable way. For example, change the circle color:

```ts
await runtime.apply({
  id: "recolor-cities",
  version: "0.1",
  type: "setPaint",
  layerId: "city-circles",
  paint: {
    "circle-color": "#ef4444",
  },
});
```

Commands are the only way to mutate the spec at runtime. Every change is
validated, tracked, and produces a JSON Patch that can be inspected or
inverted.

## Validating Your Spec

Use `validateSpec()` to check a spec before rendering:

```ts
import { validateSpec } from "@gis-engine/engine";

const report = validateSpec(mySpec);

if (report.valid) {
  console.log("Spec is valid!");
} else {
  for (const d of report.diagnostics) {
    console.error(`[${d.severity}] ${d.code}: ${d.message}`);
  }
}
```

The validation report includes:

- **`valid`** -- `true` if there are zero error-level diagnostics
- **`diagnostics`** -- structured errors and warnings with codes, messages,
  and JSON Pointer paths
- **`stats`** -- source count, layer count, and visible layer count

Validation catches problems like:
- Missing or duplicate layer IDs
- Layers referencing non-existent sources
- Invalid coordinate values
- Malformed expressions
- Schema violations (wrong types, missing required fields)

## Next Steps

- **CLI tool** -- Use `npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --template vite-ts` to
  scaffold a new project with GIS Engine pre-configured. See
  [packages/cli](../../packages/cli/README.md) for details.
- **More examples** -- Explore the other examples in this directory:
  - `basic-geojson` -- minimal GeoJSON validation example
  - `raster-basemap` -- raster tile basemap configuration
  - `vector-tile-url` -- vector tile source from a URL
  - `fill-extrusion-lite` -- experimental 2.5D extruded polygons
  - `ai-map-workbench` -- AI-assisted map editing workbench
- **AI tools** -- GIS Engine includes MCP tools for AI agents. See
  [packages/ai](../../packages/ai/) for the tool catalog and server setup.
- **Documentation** -- Full architecture and API docs are in the
  [docs/](../../docs/) directory.
