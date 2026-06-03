# explain_spec

Produces a structured, AI-facing explanation of a map spec combining a context summary, full validation report, and diagnostics in one response.

## Input Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec` | `MapSpec` | Yes | The map specification to explain. |
| `capabilities` | `CapabilityReport` | No | Renderer adapter capability metadata. |

## Output Schema

| Field | Type | Description |
|-------|------|-------------|
| `summary` | `ContextSummary` | Compact summary with sources, layers, validation, and capability domains (same structure as `get_context_summary` output). |
| `validation` | `ValidationReport` | Full validation report with `valid`, `diagnostics`, and `stats`. |
| `diagnostics` | `Diagnostic[]` | Flat array of all validation diagnostics (same as `validation.diagnostics`). |

The `summary` mirrors `get_context_summary` output: `view`, `sources`, `layers` (with visibility), `validation` (with severity counts), `capabilitySummary` (three domains), and optional `scene3d`.

## Example

### Request
```json
{ "spec": { "version": "0.2", "view": { "mode": "map2d" }, "sources": { "s": { "type": "geojson", "data": {} } }, "layers": [{ "id": "l", "type": "circle", "source": "s" }] } }
```

### Response
```json
{
  "summary": { "view": { "mode": "map2d" }, "sources": [{ "id": "s", "type": "geojson" }], "layers": [{ "id": "l", "type": "circle", "source": "s", "visibility": "visible" }], "validation": { "valid": true, "diagnosticCounts": { "error": 0, "warning": 0, "info": 0 } }, "capabilitySummary": { "domains": ["..."] } },
  "validation": { "valid": true, "diagnostics": [], "stats": { "sourceCount": 1, "layerCount": 1, "visibleLayerCount": 1 } },
  "diagnostics": []
}
```

## Usage

### Via MCP Client
```typescript
const result = await client.callTool({ name: "explain_spec", arguments: { spec } });
```

### Programmatically
```typescript
import { callGisEngineTool } from "@gis-engine/ai";
const result = await callGisEngineTool({ params: { name: "explain_spec", arguments: { spec } } });
```

## Notes
- Combines `get_context_summary` and `validate_spec` into a single call, reducing round trips.
- The top-level `diagnostics` duplicates `validation.diagnostics` for convenience.
- Read-only; never modifies the input spec.
- Ideal as a first-call tool for AI agents to orient before planning edits with `apply_commands`.
