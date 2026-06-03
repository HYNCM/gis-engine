# snapshot_spec

Validates a MapSpec and produces a deterministic headless snapshot without real WebGL. Useful as a render smoke test and evidence artifact.

## Input Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec` | `MapSpec` | Yes | The map specification to snapshot. |
| `renderer` | `"maplibre"` \| `"mock"` | No | Renderer adapter. Default: `"maplibre"`. |
| `snapshot.width` / `height` | `number` | No | Viewport dimensions in pixels. |
| `snapshot.pixelRatio` | `number` | No | Device pixel ratio. |
| `snapshot.format` | `"png"` \| `"jpeg"` \| `"data-url"` | No | Output image format. |
| `snapshot.targetLayers` | `string[]` | No | Restrict rendering to specific layer IDs. |

## Output Schema

| Field | Type | Description |
|-------|------|-------------|
| `passed` | `boolean` | Whether the snapshot succeeded without errors. |
| `diagnostics` | `Diagnostic[]` | Combined validation and rendering diagnostics. |
| `dataUrl` | `string` | Base64 data URL of the rendered image (when available). |
| `renderer` | `"maplibre"` \| `"mock"` | Renderer adapter used. |
| `validation` | `ValidationReport` | Full validation report for the input spec. |

## Example

### Request
```json
{
  "spec": { "version": "0.2", "view": { "mode": "map2d" }, "sources": { "s": { "type": "geojson", "data": {} } }, "layers": [{ "id": "l", "type": "circle", "source": "s" }] },
  "renderer": "mock",
  "snapshot": { "width": 800, "height": 600, "format": "data-url" }
}
```

### Response
```json
{ "passed": true, "diagnostics": [], "dataUrl": "data:image/png;base64,...", "renderer": "mock",
  "validation": { "valid": true, "diagnostics": [], "stats": { "sourceCount": 1, "layerCount": 1, "visibleLayerCount": 1 } } }
```

## Usage

### Via MCP Client
```typescript
const result = await client.callTool({ name: "snapshot_spec", arguments: { spec, renderer: "mock" } });
```

### Programmatically
```typescript
import { callGisEngineTool } from "@gis-engine/ai";
const result = await callGisEngineTool({ params: { name: "snapshot_spec", arguments: { spec } } });
```

## Notes
- This tool is async; it creates a headless `MapRuntime`, snapshots, then destroys it.
- If validation fails, `passed` is `false` and no rendering is attempted.
- The `"mock"` renderer is useful for CI environments where MapLibre GL is unavailable.
- Renderer failures produce a diagnostic with code `RenderAdapterError`.
