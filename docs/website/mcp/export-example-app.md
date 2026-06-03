# export_example_app

Generates a descriptive manifest for a bundled example application, including a file list and optional generation evidence summary. Does **not** write any files.

## Input Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `exampleId` | `string` | Yes | One of: `"basic-geojson"`, `"ai-map-edit"`, `"raster-basemap"`, `"pmtiles-local"`, `"vector-tile-url"`, `"fill-extrusion-lite"`. |
| `generationEvidence` | `ExampleAppGenerationEvidenceSummary` | No | Caller-provided evidence from a generation pipeline. |

## Output Schema

| Field | Type | Description |
|-------|------|-------------|
| `exampleId` | `string` | The example identifier. |
| `title` | `string` | Human-readable example title. |
| `description` | `string` | One-line description. |
| `writesFiles` | `false` | Always `false`; this tool never writes files. |
| `files` | `ExampleAppFile[]` | Files comprising the example. |
| `notes` | `string[]` | Informational notes. |
| `generationEvidence` | `ExampleAppGenerationEvidenceSummary` | Echoed evidence (when provided). |

Each file in `files[]` has: `path` (string), `role` (`"spec"` \| `"data"` \| `"commands"` \| `"script"`), `mediaType` (string), `required` (boolean), `description` (string).

## Example

### Request
```json
{ "exampleId": "basic-geojson" }
```

### Response
```json
{ "exampleId": "basic-geojson", "title": "Basic GeoJSON",
  "description": "A minimal point layer backed by a local GeoJSON file.",
  "writesFiles": false,
  "files": [
    { "path": "examples/basic-geojson/map.json", "role": "spec", "mediaType": "application/json", "required": true, "description": "MapSpec for the point layer example." },
    { "path": "examples/basic-geojson/data/points.geojson", "role": "data", "mediaType": "application/geo+json", "required": true, "description": "Local point features." }
  ],
  "notes": ["The manifest is descriptive only; export_example_app does not create or modify files."] }
```

## Usage

### Via MCP Client
```typescript
const result = await client.callTool({ name: "export_example_app", arguments: { exampleId: "basic-geojson" } });
```

### Programmatically
```typescript
import { callGisEngineTool } from "@gis-engine/ai";
const result = await callGisEngineTool({ params: { name: "export_example_app", arguments: { exampleId: "ai-map-edit" } } });
```

## Notes
- Purely descriptive; `writesFiles` is always `false`.
- Unknown `exampleId` values produce a validation error.
- When `generationEvidence` is provided, an extra note is appended.
- File paths are relative to the project root.
