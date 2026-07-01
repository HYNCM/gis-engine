# Heatmap Density Example

Demonstrates GIS Engine's **heatmap layer type** with the `heatmap-density` expression.

## What it shows

- 40 simulated earthquake data points across 7 global seismic regions
- Heatmap layer with magnitude-weighted heat distribution
- Color ramp driven by `["heatmap-density"]` inside an `interpolate` expression
- Zoom-dependent `heatmap-intensity` and `heatmap-radius`

## Run

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal (usually `http://localhost:5173`).
