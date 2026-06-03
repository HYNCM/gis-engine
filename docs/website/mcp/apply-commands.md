# apply_commands

Applies `MapCommand` objects to a `MapSpec`, returning the updated spec with per-command results, transaction metadata, and an optional trace log.

## Input Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec` | `MapSpec` | Yes | The base map specification to mutate. |
| `commands` | `MapCommand[]` | Yes | Ordered list of commands to apply. |
| `dryRun` | `boolean` | No | Compute results without committing. Default: `false`. |
| `transaction` | `"atomic"` \| `"best-effort"` | No | `"atomic"` rolls back all on first failure. Default: `"atomic"`. |
| `collectTrace` | `boolean` | No | Populate `traces` with per-command timing. Default: `false`. |
| `traceId` | `string` | No | Caller-supplied trace identifier. |

## Output Schema

| Field | Type | Description |
|-------|------|-------------|
| `spec` | `MapSpec` | Resulting spec after commands are applied. |
| `results` | `CommandResult[]` | Per-command outcome with `commandId`, `sequenceId`, `status` (`"applied"` \| `"skipped"` \| `"failed"`), `changedPaths`, `diagnostics`, and optional `inversePatch`. |
| `transaction` | `"atomic"` \| `"best-effort"` | Transaction mode used. |
| `dryRun` / `committed` / `rolledBack` | `boolean` | Transaction outcome flags. |
| `traceId` | `string` | Trace identifier for this batch. |
| `traces` | `CommandTrace[]` | Detailed trace entries (only when `collectTrace` is `true`). |

## Example

### Request
```json
{
  "spec": { "version": "0.2", "view": { "mode": "map2d" }, "sources": {}, "layers": [] },
  "commands": [{ "commandId": "c1", "type": "set", "path": "/sources/parks", "value": { "type": "geojson", "data": {} } }]
}
```

### Response
```json
{ "spec": { "version": "0.2", "view": { "mode": "map2d" }, "sources": { "parks": { "type": "geojson", "data": {} } }, "layers": [] },
  "results": [{ "commandId": "c1", "sequenceId": 0, "status": "applied", "changedPaths": ["/sources/parks"], "diagnostics": [] }],
  "transaction": "atomic", "dryRun": false, "committed": true, "rolledBack": false, "traceId": "c1:v0.2" }
```

## Usage

### Via MCP Client
```typescript
const result = await client.callTool({ name: "apply_commands", arguments: { spec, commands } });
```

### Programmatically
```typescript
import { callGisEngineTool } from "@gis-engine/ai";
const result = await callGisEngineTool({ params: { name: "apply_commands", arguments: { spec, commands } } });
```

## Notes
- All mutations go through the command system; no direct spec editing.
- `"atomic"` mode rolls back all commands on first failure.
- Each result includes `inversePatch` for undo support.
- A `baseRevision` mismatch causes the command to fail.
