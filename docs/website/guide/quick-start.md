# Quick Start

Get a map rendered with GIS Engine v1.0.0 through one of two supported
first-run paths.

## Path 1: CLI Scaffold

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map
cd my-map
open index.html
```

Use this path when you want the shortest route from zero setup to a visible map.

The CLI README covers `--generate`, `--preflight`, and `--verify-artifacts`
after the basic scaffold succeeds.

## Path 2: CDN Single HTML

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      body { margin: 0; }
      #map { width: 100vw; height: 100vh; }
    </style>
  </head>
  <body>
    <div id="map"></div>
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

Use this path when you want a build-free SDK entry point.

## Next Steps

- [Core Concepts](/guide/core-concepts) — understand the runtime model
- [API Reference](/api/) — browse generated package-level reference docs
- [MCP Tools](/mcp/overview) — add AI tooling after the first render succeeds
