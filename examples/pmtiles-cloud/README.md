# pmtiles-cloud

## Goal

Demonstrate loading cloud-hosted PMTiles data using a public endpoint,
showing the PMTiles source schema contract with fill, line, circle, and
symbol-lite layers.

## Quick Start

```bash
npm install
npm run dev
```

This starts a local dev server with hot reload. Open the URL shown in the
terminal to see the map rendered in your browser.

## What It Shows

- **pmtiles source**: cloud-hosted vector data via HTTP range requests
- **Multiple source-layers**: earth, water, boundaries, places
- **Zoom-dependent styling**: circle radius scales with zoom level
- **Attribution**: proper data attribution for OSM-based vector tiles

## Data Source

Uses the Protomaps sample vector dataset from `pmtiles.io`. Replace with your
own PMTiles endpoint for production use.

## Expected Output

- World map with earth fill, water bodies, country boundaries, and place labels
- Circle sizes increase as you zoom in
- Diagnostic warnings about PMTiles adapter mapping (expected at schema level)

## Limits And Follow-up

- The MapLibre adapter currently maps pmtiles sources to vector URLs with a
  diagnostic warning. Full PMTiles runtime loader support is on the roadmap.
- For local PMTiles files see
  [`../pmtiles-local`](../pmtiles-local/README.md).
