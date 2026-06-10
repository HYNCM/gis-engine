# Getting Started with GIS Engine

## Goal

Use this example as the SDK-first learning path after the shortest CLI scaffold
path already works. It demonstrates a small Vite app that renders a GeoJSON map
and logs validation plus command output in the browser.

## Prerequisites

- Node.js 20+
- npm 9+
- A browser that can open the local Vite dev URL

## Run

```bash
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## Expected Output

- A world map with 10 city markers rendered as blue circles
- Browser console output showing validation results and command activity
- A working example of `MapSpec`, `createMap()`, `validateSpec()`, and
  command-driven edits in one place

## Limits And Follow-up

- This is an SDK learning example, not the shortest first-run path. For the
  fastest zero-to-map flow, start with
  `npm exec --package @gis-engine/cli@latest -- create-gis-map my-map`.
- The example focuses on GeoJSON and 2D rendering. It does not add stable
  SceneView3D runtime, PMTiles runtime parsing, or cloud-native runtime loaders.
- Next examples to read:
  - [`../basic-geojson`](../basic-geojson/README.md) for the smallest schema +
    validation fixture
  - [`../pmtiles-local`](../pmtiles-local/README.md) for PMTiles display and
    readiness-only delivery
  - [`../../packages/cli/README.md`](../../packages/cli/README.md) for scaffold,
    generate, preflight, and artifact verification flows
