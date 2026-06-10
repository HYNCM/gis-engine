# Quick Start

Get to a visible map through one of two supported v1.0.0 entry paths.

## Path 1: CLI Scaffold

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map
cd my-map
open index.html
```

Use this path when you want the fastest first run and a ready-made scaffold.

## Path 2: CDN Single HTML

```html
<script type="module">
  import { createMap } from "https://unpkg.com/@gis-engine/engine";
</script>
```

Also available via jsDelivr and esm.sh. See
[CDN distribution](./engineering/cdn-distribution.md).

## CDN Minimal HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>body{margin:0}#map{width:100vw;height:100vh}</style>
</head>
<body>
  <div id="map"></div>
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

Use this path when you want to learn the SDK directly without scaffolding.

## Optional: Vite + TypeScript

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --template vite-ts
cd my-map && npm install && npm run dev
```

## AI Integration (MCP)

```typescript
import { createGisEngineMcpServer } from "@gis-engine/ai/mcp";
const server = createGisEngineMcpServer();
// Tools: validate_spec, apply_commands, export_spec,
//   get_context_summary, snapshot_spec, explain_spec, export_example_app
```

## Next Steps

- [CLI templates](./cli/templates.md) -- scaffold options
- [Provider config](./cli/provider-config.md) -- AI provider setup
- [MCP tools](./website/mcp/overview.md) -- AI agent integration
- [API reference](./website/api/index.md) -- generated symbol-level package docs
- [Feature matrix](./engineering/supported-feature-matrix.md) -- source/layer coverage
