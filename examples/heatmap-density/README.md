# heatmap-density

## Goal

Demonstrate the heatmap layer type with data-driven weight, zoom-dependent
intensity and radius, and a multi-stop color ramp based on `heatmap-density`.

## Quick Start

```bash
npm install
npm run dev
```

This starts a local dev server with hot reload. Open the URL shown in the
terminal to see the map rendered in your browser.

## What It Shows

- **heatmap** layer type rendering
- `heatmap-weight` driven by earthquake magnitude via `interpolate` expression
- `heatmap-intensity` and `heatmap-radius` scaling with zoom level
- `heatmap-color` using a 6-stop gradient (transparent → royalblue → cyan → lime → yellow → red)

## Data

40 simulated earthquake events distributed across 7 seismic regions along the
Pacific Ring of Fire (Japan, California, New Zealand, Philippines, Chile,
Turkey, Pakistan). Each point has `magnitude` (1–9) and `depth` (0–700 km).

## Expected Output

- A global heatmap showing earthquake density patterns
- Hotter colors (yellow/red) in high-density areas
- Cooler colors (blue/cyan) in low-density areas
- Zooming in increases radius and intensity for more detail

## Limits And Follow-up

- Uses randomly generated sample data; replace with real earthquake catalogs
  for production use.
- For expression details see [`../style-expressions`](../style-expressions/README.md).
