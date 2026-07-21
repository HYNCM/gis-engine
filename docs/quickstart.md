# Quick Start

> **Try it online:** [Open Playground on StackBlitz](https://stackblitz.com/github/HYNCM/gis-engine/tree/main/examples/basic-geojson)

Get to a visible map through one of three supported v1.5.0 entry paths.

## Path 1: npm Install (SDK Direct)

Install the SDK and its **required** peer dependency:

```bash
npm install @gis-engine/engine maplibre-gl
```

> `maplibre-gl` is a **required** peer dependency — not optional.
> GIS Engine delegates rendering to MapLibre GL JS, so your project will
> not work without it. It is listed under `peerDependencies` to avoid
> version conflicts, but you **must** install it yourself.

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

The map is fully interactive — use mouse/touch to pan, zoom, rotate, and tilt
the view. MapLibre GL JS handles all camera interactions natively.

## Path 2: CLI Scaffold

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map
cd my-map
open index.html
```

Use this path when you want the fastest first run and a ready-made scaffold.

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
  <style>body{margin:0}#map{width:100vw;height:100vh}</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"></script>
  <script type="module">
    import { createMap } from "https://unpkg.com/@gis-engine/engine";
    const map = await createMap(document.getElementById("map"), {
      version: "0.1",
      sources: { districts: { type: "geojson",
        data: { type: "FeatureCollection", features: [
          { type: "Feature", geometry: { type: "Polygon",
            coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] },
            properties: { name: "Zone A" } }
        ]}}}},
      layers: [{ id: "district-fill", type: "fill", source: "districts",
        paint: { "fill-color": "#3b82f6", "fill-opacity": 0.6 } }],
      view: { center: [0.5, 0.5], zoom: 10 }
    }, { renderer: "maplibre" });
  </script>
</body>
</html>
```

Also available via jsDelivr and esm.sh. See
[CDN distribution](./engineering/cdn-distribution.md).

Use this path when you want to learn the SDK directly without scaffolding.

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

## Optional: Vite + TypeScript

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --template vite-ts
cd my-map && npm install && npm run dev
```

## AI Integration (MCP)

```typescript
import { createGisEngineMcpServer } from "@gis-engine/ai/mcp";
const server = createGisEngineMcpServer();
// Canonical v1.5 inventory (14 tools): apply_commands, validate_spec,
//   export_spec, get_context_summary,
//   snapshot_spec, explain_spec, export_example_app, diff_specs, generate_spec,
//   inspect_data, edit_spec, query_features, style_recommend, transform_data
```

## Next Steps

- [CLI templates](./cli/templates.md) -- scaffold options
- [Provider config](./cli/provider-config.md) -- AI provider setup
- [MCP tools](./website/mcp/overview.md) -- AI agent integration
- [API reference](./website/api/index.md) -- generated symbol-level package docs
- [Feature matrix](./engineering/supported-feature-matrix.md) -- source/layer coverage
