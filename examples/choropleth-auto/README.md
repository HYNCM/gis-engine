# choropleth-auto

## Goal

Demonstrate AI-driven choropleth map generation using the `generate_spec` MCP
tool. A natural language description produces a validated MapSpec with
data-driven color ramp expressions.

## Quick Start

```bash
npm install
npm run dev
```

This starts a local dev server with hot reload. Open the URL shown in the
terminal to see the map rendered in your browser.

## What It Shows

- `generate_spec` tool generating a choropleth spec from natural language
- Theme-driven color ramp (`ocean` theme with 5-stop gradient)
- `interpolate` expression mapping `population` property to fill colors
- Auto-detected location (US center) and appropriate zoom level

## Data

Generated placeholder GeoJSON with 6 polygon regions, each having a
`population` property (800K–5.2M).

## Expected Output

- Choropleth fill with ocean-themed gradient (light → dark)
- Outline layer for region boundaries
- Console output showing generation diagnostics and suggestions

## Limits And Follow-up

- Uses placeholder GeoJSON; replace with real administrative boundary data.
- For manual spec authoring see [`../data-driven-styling`](../data-driven-styling/README.md).
