# Quick Start

## Install

```bash
npm install @gis-engine/engine @gis-engine/ai
# Or scaffold a project:
npx create-gis-map my-map --template vite-ts
```

`maplibre-gl` (^5.0.0 || ^6.0.0) is an optional peerDependency -- install it
only when using the MapLibre renderer adapter.

## CDN (No Build Step)

```html
<script type="module">
  import { createMap } from "https://unpkg.com/@gis-engine/engine";
</script>
```

Also available via jsDelivr and esm.sh. See [CDN distribution](./engineering/cdn-distribution.md).

## Minimal HTML Example

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

## Vite + TypeScript

```bash
npx create-gis-map my-map --template vite-ts
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
- [Feature matrix](./engineering/supported-feature-matrix.md) -- source/layer coverage
