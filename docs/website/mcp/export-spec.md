# export_spec

Exports the current map state as a clean, validated `MapSpec` JSON. Optionally applies commands before exporting.

## Input Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec` | `MapSpec` | Yes | The base map specification to export. |
| `commands` | `MapCommand[]` | No | Commands to apply before exporting. |
| `dryRun` | `boolean` | No | Apply commands without committing. Default: `false`. |
| `transaction` | `"atomic"` \| `"best-effort"` | No | Transaction mode. Default: `"atomic"`. |
| `traceId` | `string` | No | Optional trace identifier. |
| `includeEvidence` | `boolean` | No | Return `{ spec, evidence }` with a recomputable EvidenceRecord. Default: `false`. Requires a non-empty `commands` batch, a revision-anchored `spec` (`revision` set, e.g. `"0"`), and `dryRun: false`; violations return `EVIDENCE.INPUT_INVALID`. |

## Output Schema

On success, `structuredContent` is a clean `MapSpec` object and the text block
contains the same value as JSON. With `includeEvidence: true`, `structuredContent`
is instead `{ spec, evidence }`, where `evidence` is an `evidence-record.v0.1`
record attesting the command transition. On failure, `structuredContent` is the common
`{ diagnostics: Diagnostic[] }` envelope; the legacy JSON text block retains the
raw `Diagnostic[]` array for older clients.

| Field | Type | Description |
|-------|------|-------------|
| `version` | `string` | MapSpec version (e.g. `"0.1"`). |
| `view` | `object` | View configuration (`mode`, `center`, `zoom`, etc.). |
| `sources` | `Record<string, SourceSpec>` | Declared data sources. |
| `layers` | `LayerSpec[]` | Declared map layers. |

## Example

### Request
```json
{ "spec": { "version": "0.1", "view": { "mode": "map2d", "center": [0, 0], "zoom": 2 }, "sources": { "cities": { "type": "geojson", "data": {} } }, "layers": [{ "id": "dots", "type": "circle", "source": "cities" }] } }
```

### Response
```json
{ "version": "0.1", "view": { "mode": "map2d", "center": [0, 0], "zoom": 2 }, "sources": { "cities": { "type": "geojson", "data": {} } }, "layers": [{ "id": "dots", "type": "circle", "source": "cities" }] }
```

## Usage

### Via MCP Client
```typescript
const result = await client.callTool({ name: "export_spec", arguments: { spec } });
```

### Programmatically
```typescript
import { callGisEngineTool } from "@gis-engine/ai";
const result = await callGisEngineTool({ params: { name: "export_spec", arguments: { spec } } });
```

## Notes
- The input spec must pass validation; otherwise diagnostics are returned instead of a MapSpec.
- When `commands` are provided, they are applied first. Any error-severity diagnostic aborts the export.
- Use `dryRun: true` with commands to preview the result without mutating the base spec.
- The exported MapSpec is suitable for persistence, diffing, or passing to `snapshot_spec`.

## Evidence export

With `includeEvidence: true`, the record's single artifact is `mapspec.json`
(role `mapspec`), attested over the CLI `map.json` byte convention: two-space
pretty JSON plus a trailing newline. To recompute the record, write the returned
`spec` with exactly that serialization and verify:

```typescript
import { writeFile, readFile } from "node:fs/promises";
import { verifyEvidenceRecord } from "@gis-engine/engine/evidence";

await writeFile("mapspec.json", `${JSON.stringify(payload.spec, null, 2)}\n`);
const verdict = await verifyEvidenceRecord(payload.evidence, {
  readArtifact: (path) => readFile(`./${path}`),
});
// verdict.ok === true when the record, bytes, and revision lineage all close.
```

The record declares `OFFLINE_REPLAY` and `VISUAL_CONSISTENCY` exclusions: this
data-only export does not execute replay or render the map. See
[EvidenceRecord recompute](../../engineering/evidence-record.md) for the
assertion semantics.
