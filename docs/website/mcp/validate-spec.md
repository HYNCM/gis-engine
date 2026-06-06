# validate_spec

Validates a MapSpec against the JSON schema and semantic rules, returning a `ValidationReport` with diagnostics and spec statistics.

## Input Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec` | `MapSpec` | Yes | The map specification document to validate. |

## Output Schema

| Field | Type | Description |
|-------|------|-------------|
| `valid` | `boolean` | `true` when zero error-severity diagnostics were produced. |
| `diagnostics` | `Diagnostic[]` | Findings with `severity` (`"error"` \| `"warning"` \| `"info"`), `code`, `message`, and optional `path`. |
| `stats.sourceCount` | `number` | Number of declared sources. |
| `stats.layerCount` | `number` | Total number of layers. |
| `stats.visibleLayerCount` | `number` | Layers whose visibility is not `"none"`. |

## Example

### Request
```json
{
  "spec": {
    "version": "0.1",
    "view": { "mode": "map2d", "center": [0, 0], "zoom": 2 },
    "sources": { "points": { "type": "geojson", "data": {} } },
    "layers": [{ "id": "dots", "type": "circle", "source": "points" }]
  }
}
```

### Response
```json
{ "valid": true, "diagnostics": [], "stats": { "sourceCount": 1, "layerCount": 1, "visibleLayerCount": 1 } }
```

## Usage

### Via MCP Client
```typescript
const result = await client.callTool({ name: "validate_spec", arguments: { spec } });
```

### Programmatically
```typescript
import { callGisEngineTool } from "@gis-engine/ai";
const result = await callGisEngineTool({ params: { name: "validate_spec", arguments: { spec } } });
```

## Notes
- Purely read-only; the input spec is never mutated.
- `valid: true` means zero errors; warnings and info diagnostics may still be present.
- Common codes: `SpecUnknownField`, `SpecMissingField`, `SpecInvalidVersion`, `SpecInvalidType`.
- Call this before `export_spec` or `snapshot_spec` to ensure the spec is ready.
