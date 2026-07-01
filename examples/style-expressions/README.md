# style-expressions

## Goal

Provide a catalog of MapSpec expression types, each demonstrated in a
dedicated layer with inline GeoJSON data.

## Quick Start

```bash
npm install
npm run dev
```

This starts a local dev server with hot reload. Open the URL shown in the
terminal to see the map rendered in your browser.

## Expression Catalog

| Expression | Layer | Description |
|---|---|---|
| `match` | zone-fill-match | Discrete category → fill color mapping |
| `step` | zone-outline-step | Zoom-level thresholds for line width |
| `interpolate` | points-radius-interpolate | Continuous value → circle radius |
| `case` | points-opacity-case | Conditional opacity with nested checks |
| `get` / `has` | points-labels-get / points-opacity-case | Property access and existence check |
| math (`+`, `*`) | zone-labels-math | Arithmetic: `8 + (density * 6)` for text size |

## Data

- **points**: 6 POIs with `name`, `category`, `value`, and optional `population`
- **polygons**: 3 zones with `zone` type and `density` score

## Expected Output

- Color-coded polygon fills (green=residential, blue=commercial, yellow=industrial)
- Polygon outlines that grow thicker as you zoom in
- Circle sizes proportional to the `value` property
- Points with `population >= 10000` are fully opaque; others are translucent
- Zone labels with size proportional to density

## Limits And Follow-up

- This catalog covers the most common expression types. MapLibre GL JS supports
  additional expressions (e.g., `coalesce`, `to-color`) that may also work in
  GIS Engine paint/layout fields.
- For focused data-driven styling see
  [`../data-driven-styling`](../data-driven-styling/README.md).
