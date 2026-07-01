# data-driven-styling

## Goal

Demonstrate conditional rendering based on feature properties using MapSpec
expressions: `match`, `interpolate`, `case`, and `step`.

## Quick Start

```bash
npm install
npm run dev
```

This starts a local dev server with hot reload. Open the URL shown in the
terminal to see the map rendered in your browser.

## What It Shows

- **match** expression: maps discrete `category` values to specific colors
- **interpolate** (linear): maps continuous `value` range to circle radius
- **case** expression: conditional opacity based on value thresholds
- **step** expression: discrete thresholds for text label size

## Data

10 POI points with `category` (food, nature, culture, lodging, shopping) and
`value` (0-100 score) properties.

## Expected Output

- Circle color varies by category (red=food, green=nature, purple=culture, etc.)
- Circle size scales with the value property
- High-value points are fully opaque; low-value points are translucent
- Label text size increases at value thresholds

## Limits And Follow-up

- Only inline GeoJSON is used; for tile-based data-driven styling see
  [`../vector-tile-url`](../vector-tile-url/README.md).
- For a full expression catalog see
  [`../style-expressions`](../style-expressions/README.md).
