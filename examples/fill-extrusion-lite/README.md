# fill-extrusion-lite

## Goal

Demonstrate 3D extruded polygons using the experimental `fill-extrusion-lite`
layer type on a 2.5D map with pitch and bearing.

## Quick Start

```bash
npm install
npm run dev
```

This starts a local dev server with hot reload. Open the URL shown in the
terminal to see the 2.5D extruded polygon rendered with pitch and bearing.

## What It Shows

- **Experimental** `fill-extrusion-lite` layer type under `capabilities.experimental`
- `map2_5d` view mode with camera pitch (50°) and bearing (20°) for perspective
- Data-driven extrusion height read from GeoJSON feature `height` property
- Sky-blue extrusion (`#38bdf8`, 75% opacity) with base at ground level

## Data

Single polygon district with `height: 120` property, centered at
[120.15, 30.28] (Hangzhou area) with zoom 13.

## Expected Output

- 3D extruded polygon visible with pitch and bearing perspective
- Sky-blue fill with 75% opacity
- Height driven by `get` expression reading the `height` property
- Interactive camera controls for orbiting around the extrusion

## Limits And Follow-up

- **Beta / Experimental** -- Layer type and paint properties may change between releases.
- Engine must declare `fill-extrusion-lite` and `2_5d` capabilities.
- For stable 2D fill layers see [`../basic-geojson`](../basic-geojson/README.md).
