# pmtiles-local

## Goal

Show the current PMTiles contract that GIS Engine v1.1.0 supports for local,
URL-compatible vector display and readiness/evidence workflows.

## Prerequisites

- A valid PMTiles file at `./data/parcels.pmtiles`
- A vector layer inside that archive named `parcels`
- A runtime or validation flow that can consume the fixture

## Quick Start

```bash
npm install
npm run dev
```

The runnable version uses a public PMTiles endpoint for demo purposes.
To use your own data, place a `.pmtiles` file in `public/data/` and
update the URL in `src/main.ts`.

## Run

- Use this fixture in snapshot, validation, generated-app delivery, or review
  flows that need PMTiles display/readiness coverage.
- For CLI-side delivery checks, pair generated output with
  `create-gis-map --preflight`.

## Expected Output

- A `pmtiles` source named `local-parcels`
- Two visual layers targeting `metadata["source-layer"] = "parcels"`
- A fixture that proves URL-compatible PMTiles display and readiness-only
  delivery semantics

## Limits And Follow-up

- This example does **not** imply PMTiles archive parsing, hidden network
  fetches, worker-based support, or runtime feature-query promotion.
- Treat it as a display/readiness/evidence surface, not as a promoted PMTiles
  runtime loader.
- Use [`../basic-geojson`](../basic-geojson/README.md) for the smallest
  schema-first example and [`../getting-started`](../getting-started/README.md)
  for a runnable SDK walkthrough.
