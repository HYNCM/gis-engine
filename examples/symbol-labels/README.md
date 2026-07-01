# symbol-labels

## Goal

Demonstrate the full symbol layer type with text labels, marker icons,
halo effects, and collision control for city annotations.

## Quick Start

```bash
npm install
npm run dev
```

This starts a local dev server with hot reload. Open the URL shown in the
terminal to see the map rendered in your browser.

## What It Shows

- **symbol** layer type (full version, replacing `symbol-lite`)
- `text-field` driven by feature `name` property
- `text-size` with zoom-dependent `interpolate` expression
- `icon-image` and `icon-size` for marker icons
- `text-halo-color` / `text-halo-width` for label readability
- `text-allow-overlap` / `icon-allow-overlap` for collision control

## Data

12 major world cities (Tokyo, Delhi, Shanghai, São Paulo, Cairo, London,
Paris, New York, Beijing, Sydney, Moscow, Lagos) with `name`, `population`,
and `type` properties.

## Expected Output

- City labels with marker icons positioned across the globe
- Labels grow larger as you zoom in
- White halo around text ensures readability over varied basemaps
- Overlapping labels are hidden at low zoom levels

## Limits And Follow-up

- `icon-image` references MapLibre sprite `marker-15`; ensure the basemap
  provides this sprite or supply a custom sprite sheet.
- For simpler label needs see `symbol-lite` in
  [`../data-driven-styling`](../data-driven-styling/README.md).
