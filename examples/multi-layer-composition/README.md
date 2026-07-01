# multi-layer-composition

## Goal

Demonstrate stacking multiple layer types (background, fill, line, circle,
symbol-lite) on a single GeoJSON source to show how layer order controls
z-ordering in the rendered map.

## Quick Start

```bash
npm install
npm run dev
```

This starts a local dev server with hot reload. Open the URL shown in the
terminal to see the map rendered in your browser.

## What It Shows

- **background** layer: fills the entire canvas with a solid color
- **fill** layer: renders polygon features with semi-transparent green fill
- **line** layer: draws polygon outlines
- **circle** layer: renders point features as styled circles
- **symbol-lite** layer: adds text labels to point features

## Expected Output

- A valid `MapSpec` with 5 layers rendered in correct z-order
- Polygons at the bottom, then outlines, then circles, then labels on top
- Geometry-type filter separates polygon and point features from the same source

## Limits And Follow-up

- This example uses inline GeoJSON only; for vector tile sources see
  [`../vector-tile-url`](../vector-tile-url/README.md).
- For data-driven paint expressions see
  [`../data-driven-styling`](../data-driven-styling/README.md).
