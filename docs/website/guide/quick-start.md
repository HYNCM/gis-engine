# Quick Start

> **Try it online:** [Open Playground on StackBlitz](https://stackblitz.com/github/HYNCM/gis-engine/tree/main/examples/basic-geojson)

Get a map rendered with GIS Engine v1.1.0 through one of three supported
first-run paths.

## Path 1: npm Install (SDK Direct)

Install the SDK and its **required** peer dependency:

```bash
npm install @gis-engine/engine maplibre-gl
```

::: tip Important
`maplibre-gl` is a **required** peer dependency — it is not optional.
GIS Engine delegates rendering to MapLibre GL JS, so your project will not
work without it. The package is listed under `peerDependencies` to avoid
version conflicts, but you **must** install it yourself.
:::

Import the MapLibre CSS in your entry file:

```typescript
import "maplibre-gl/dist/maplibre-gl.css";
import { createMap } from "@gis-engine/engine";

const map = await createMap(
  document.getElementById("map")!,
  {
    version: "0.1",
    sources: {
      points: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [0, 0] },
              properties: { name: "Null Island" }
            }
          ]
        }
      }
    },
    layers: [
      {
        id: "points-layer",
        type: "circle",
        source: "points",
        paint: { "circle-radius": 8, "circle-color": "#3b82f6" }
      }
    ],
    view: { mode: "map2d", center: [0, 0], zoom: 2 }
  },
  { renderer: "maplibre" }
);
```

Run your bundler (`vite`, `webpack`, etc.) and open the result in a browser.
You should see a map with a blue dot at coordinates [0, 0].

## Path 2: CLI Scaffold

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map
cd my-map
open index.html
```

Use this path when you want the shortest route from zero setup to a visible map.

The CLI README covers `--generate`, `--preflight`, and `--verify-artifacts`
after the basic scaffold succeeds.

## Path 3: CDN Single HTML

When using a CDN, include both the MapLibre CSS and the MapLibre JS bundle
before importing the GIS Engine SDK:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css"
    />
    <style>
      body { margin: 0; }
      #map { width: 100vw; height: 100vh; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"></script>
    <script type="module">
      import { createMap } from "https://unpkg.com/@gis-engine/engine";

      await createMap(document.getElementById("map"), {
        version: "0.1",
        sources: {
          points: {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: { type: "Point", coordinates: [120.15, 30.28] },
                  properties: { name: "Hangzhou" }
                }
              ]
            }
          }
        },
        layers: [
          {
            id: "points-layer",
            type: "circle",
            source: "points",
            paint: { "circle-radius": 8, "circle-color": "#3b82f6" }
          }
        ],
        view: { mode: "map2d", center: [120.15, 30.28], zoom: 12 }
      }, { renderer: "maplibre" });
    </script>
  </body>
</html>
```

Also available via jsDelivr and esm.sh.

Use this path when you want a build-free SDK entry point.

## 3-Minute Quick Verify

Confirm your setup works end-to-end:

1. **Install:** `npm install @gis-engine/engine maplibre-gl`
2. **Import CSS:** `import "maplibre-gl/dist/maplibre-gl.css";`
3. **Create a map:** use the `createMap()` snippet from Path 1
4. **Open in browser:** you should see a world map with a blue dot

If the map does not appear, check:
- The `maplibre-gl` CSS is loaded (missing CSS → map renders but controls/markers break)
- Your bundler resolves the `maplibre-gl` package
- The container element exists in the DOM before `createMap()` is called

## Next Steps

- [Core Concepts](/guide/core-concepts) — understand the runtime model
- [API Reference](/api/) — browse generated package-level reference docs
- [MCP Tools](/mcp/overview) — add AI tooling after the first render succeeds
