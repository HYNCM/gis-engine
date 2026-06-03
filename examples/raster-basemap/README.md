# raster-basemap

Combines a local raster tile basemap with an inline GeoJSON vector overlay, demonstrating raster/vector layering.

## MapSpec Overview

- **ID:** `raster-basemap-example` | **View:** `map2d`, center [120.15, 30.28], zoom 10
- **Sources:**
  - `local-raster` (raster) -- local XYZ tiles (`./tiles/{z}/{x}/{y}.png`), 256px tile size
  - `city-boundary` (geojson) -- inline FeatureCollection with a rectangular polygon
- **Layers:**
  - `basemap-raster` (raster) -- raster basemap at 92% opacity
  - `boundary-line` (line) -- teal polygon outline (`#0f766e`, 2px width)

## Key Concepts

- Raster source with local tile URL template (no remote server needed).
- Inline GeoJSON defined directly in the spec without an external file.
- Layer ordering: raster basemap first, vector line overlay on top.

## Usage

Use this fixture to test raster tile loading from a local directory, verify raster/vector compositing, or validate raster opacity alongside line styling.

**Requirements:** Local tile directory at `./tiles/` with `{z}/{x}/{y}.png` structure must be present.
