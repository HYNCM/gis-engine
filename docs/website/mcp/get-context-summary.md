# get_context_summary

Produces a compact, AI-facing summary of a map spec including sources, layers, validation, and capability domain boundaries for planning and review.

## Input Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec` | `MapSpec` | Yes | The map specification to summarize. |
| `capabilities` | `CapabilityReport` | No | Renderer adapter capability metadata (queries, dimensions, experimental). |

## Output Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Map spec identifier (when present). |
| `revision` | `string` | Current spec revision (when present). |
| `view` | `object` | View configuration (`mode`, `center`, `zoom`). |
| `sources` | `Array<{ id, type }>` | Declared data sources. |
| `layers` | `Array<{ id, type, source?, visibility }>` | Layers with visibility (`"visible"` \| `"none"`). |
| `validation` | `{ valid, diagnosticCounts }` | Pass/fail and counts by severity. |
| `capabilitySummary` | `{ domains: CapabilityDomainSummary[] }` | Three domains: `feature-display`, `spatial-analysis`, `scene-browsing`. |
| `capabilities` | `CapabilityReport` | Echoed input capability report (when provided). |
| `scene3d` | `Scene3DContextSummary` | 3D scene context (only when `extensions.scene3d` is present). |

Each `CapabilityDomainSummary` has `id`, `status` (`"supported"` \| `"experimental"` \| `"blocked"`), `supported` / `experimental` / `blocked` string arrays, recommended `tools`, and `evidence`.

## Example

### Request
```json
{ "spec": { "version": "0.1", "view": { "mode": "map2d" }, "sources": { "s": { "type": "geojson", "data": {} } }, "layers": [{ "id": "l", "type": "circle", "source": "s" }] } }
```

### Response
```json
{ "view": { "mode": "map2d" }, "sources": [{ "id": "s", "type": "geojson" }],
  "layers": [{ "id": "l", "type": "circle", "source": "s", "visibility": "visible" }],
  "validation": { "valid": true, "diagnosticCounts": { "error": 0, "warning": 0, "info": 0 } },
  "capabilitySummary": { "domains": [{ "id": "feature-display", "status": "supported", "tools": ["validate_spec", "apply_commands", "export_spec", "snapshot_spec", "export_example_app"] }] } }
```

## Usage

### Via MCP Client
```typescript
const result = await client.callTool({ name: "get_context_summary", arguments: { spec } });
```

### Programmatically
```typescript
import { callGisEngineTool } from "@gis-engine/ai";
const result = await callGisEngineTool({ params: { name: "get_context_summary", arguments: { spec } } });
```

## Notes
- Designed for AI agent planning; output is compact and structured for LLM consumption.
- The `capabilitySummary.domains` always contains exactly three entries.
- When validation errors exist, all domains report `"blocked"` until errors are resolved.
- The `scene3d` field only appears when `extensions.scene3d` is present in the spec.
