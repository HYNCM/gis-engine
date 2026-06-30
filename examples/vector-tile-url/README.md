# vector-tile-url

Loads vector tiles from a URL template and applies data-driven expression styling to fill and line layers.

## MapSpec Overview

- **ID:** `vector-tile-url-example` | **View:** `map2d`, center [120.15, 30.28], zoom 12
- **Source:** `local-parcels` (vector) -- local URL template (`./tiles/{z}/{x}/{y}.pbf`), zoom range 0-14
- **Layers:**
  - `parcel-fill` (fill) -- `match` expression colors by `class` property (park/water/default); `case` expression controls opacity
  - `parcel-outline` (line) -- `step` expression varies width by zoom level; reads `stroke_width` from feature properties

## Key Concepts

- Vector source with `.pbf` tile URL template from a local directory.
- Data-driven paint expressions: `match`, `case`, `step`, `get`, `to-string`, `to-number`.
- Zoom-dependent line width increases at zoom 12 and 14.

## Quick Start

```bash
npm install
npm run dev
```

The runnable version uses MapLibre demo tiles so you can see data-driven styling
without local tile files. The original `map.json` references local tiles at
`./tiles/{z}/{x}/{y}.pbf`.

## Usage

Use this fixture to validate vector tile URL loading, test expression-based paint properties, or verify zoom-dependent and feature-conditional styling.

## Requirements

Local tiles at `./tiles/{z}/{x}/{y}.pbf` with a `parcels` layer containing `class` and `stroke_width` properties.
