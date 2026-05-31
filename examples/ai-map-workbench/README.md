# AI Map Workbench

`examples/ai-map-workbench` is a local visual example for GIS Engine. It pairs a
mock AI chat sidebar with a real MapLibre map display and keeps all map
mutation behind GIS Engine commands.

## Run

From the repository root:

```bash
pnpm example:ai-map-workbench
```

Open the printed localhost URL.

Click a point on the map to run a real `queryFeatures` request against the
current inline GeoJSON data. Query results appear in the Feature query panel.

## Supported Mock Prompts

- `make points red`
- `make points blue`
- `increase point size`
- `decrease point size`
- `zoom to Hangzhou`
- `reset`

## Boundaries

- No real AI provider is called.
- No browser-side `MapSpec` mutation is allowed.
- No new MCP tool names are introduced.
- No stable SceneView3D runtime or 3D renderer claim is made.
- No external basemap or network data source is required.
