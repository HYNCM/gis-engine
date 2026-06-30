# fill-extrusion-lite

Renders 3D extruded polygons using the experimental `fill-extrusion-lite` layer type on a 2.5D map with pitch and bearing.

## MapSpec Overview

- **ID:** `fill-extrusion-lite-example`
- **Capabilities:** `2_5d` dimensions, `fill-extrusion-lite` (experimental)
- **View:** `map2_5d`, center [120.15, 30.28], zoom 13, pitch 50, bearing 20
- **Source:** `districts` (geojson) -- inline polygon with `height: 120` property
- **Layer:** `district-extrusion` (fill-extrusion-lite) -- sky-blue extrusion (`#38bdf8`, 75% opacity), height driven by `["get", "height"]`, base at 0

## Key Concepts

- **Experimental:** declared under `capabilities.experimental`; engine must support it.
- 2.5D view mode with camera pitch and bearing for perspective rendering.
- Data-driven extrusion height read from GeoJSON feature properties.

## Quick Start

```bash
npm install
npm run dev
```

This starts a local dev server showing the 2.5D extruded polygon rendered
with pitch and bearing.

## Usage

Use this fixture to test fill-extrusion-lite rendering, validate 2.5D camera settings, or verify experimental capability declarations. The rendering engine must support the `fill-extrusion-lite` and `2_5d` capabilities.

> **Beta / Experimental** -- Layer type and paint properties may change between releases.
