# basic-geojson

## Goal

Provide the smallest schema-first example in the repository: one GeoJSON
source, one circle layer, and a relative data file.

## Prerequisites

- A GIS Engine runtime or test harness that can load `map.json`
- The sibling file `./data/points.geojson`

## Run

- Copy or reference `map.json` in a runtime, validation test, or generated app
  review flow.
- If you only need a contract check, run `validateSpec()` against the fixture.

## Expected Output

- A valid `MapSpec` with `view.mode: "map2d"`
- One `geojson` source named `pois`
- One `circle` layer named `poi-circles`
- A minimal proof point for local GeoJSON path resolution and schema coverage

## Limits And Follow-up

- This fixture is intentionally minimal; it does not demonstrate commands,
  generated-app evidence, PMTiles, or MCP flows.
- Use [`../getting-started`](../getting-started/README.md) when you want a full
  runnable SDK walkthrough.
- Use [`../pmtiles-local`](../pmtiles-local/README.md) when you need a readiness
  example for URL-compatible PMTiles display.
