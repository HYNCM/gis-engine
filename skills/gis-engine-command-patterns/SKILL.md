---
name: gis-engine-command-patterns
description: >
  Apply declarative, replayable commands to modify GIS Engine MapSpec state. Use
  when adding/removing layers or sources, changing paint/layout styles, updating
  the view, reordering layers, or editing interactions. Covers all 18 MapCommand
  types, dry-run mode, atomic transactions, conflict detection via baseRevision,
  and common edit patterns with complete JSON examples.
metadata:
  author: gis-engine
  version: "1.0"
  package: "@gis-engine/engine"
---

# Command Patterns Guide

GIS Engine uses a command-based mutation model. All runtime state changes go
through `MapCommand` objects applied via `applyCommands`. Commands are
deterministic, replayable, and produce structured patches for undo/redo.

## Why Commands

- **Auditability**: every change has an `id`, `author`, and `reason`.
- **Replay**: apply the same command sequence to any base spec to reach the same state.
- **Conflict detection**: `baseRevision` prevents out-of-order edits.
- **Dry-run**: preview changes before committing.
- **Patches**: each command produces JSON Patch ops and their inverses for undo.

## Command Base Fields

Every command shares these fields:

| Field | Required | Type | Description |
|---|---|---|---|
| `id` | Yes | `string` | Unique command identifier. |
| `version` | Yes | `"0.1"` | Command schema version. |
| `type` | Yes | `string` | Command type (see table below). |
| `baseRevision` | No | `string` | Expected current revision for conflict detection. |
| `author` | No | `{ type, id?, name? }` | Who created this command: `"human"`, `"agent"`, or `"system"`. |
| `reason` | No | `string` | Human-readable explanation. |
| `createdAt` | No | `string` | ISO 8601 timestamp. |
| `sourcePromptHash` | No | `string` | Hash of the AI prompt that generated this command. |
| `dryRun` | No | `boolean` | Preview without applying. |

## All Command Types

### 2D Map Commands

| Type | Payload | Description |
|---|---|---|
| `addSource` | `sourceId`, `source` | Add a named data source. |
| `removeSource` | `sourceId` | Remove a source (fails if layers reference it). |
| `addLayer` | `layer`, `beforeLayerId?` | Insert a layer, optionally before another. |
| `removeLayer` | `layerId` | Remove a layer by ID. |
| `setPaint` | `layerId`, `paint` | Replace paint properties on a layer. |
| `setLayout` | `layerId`, `layout` | Replace layout properties on a layer. |
| `setFilter` | `layerId`, `filter` | Set or clear (`null`) a layer filter expression. |
| `setLayerZoomRange` | `layerId`, `minzoom`, `maxzoom` | Change zoom visibility range. |
| `reorderLayer` | `layerId`, `beforeLayerId?` | Move a layer in the render order. |
| `setView` | `view` (partial) | Update camera: center, zoom, bearing, pitch, bounds, mode. |
| `setCapabilities` | `capabilities` | Update capability requests. |
| `setInteractions` | `interactions` | Update interaction toggles. |
| `fitBounds` | `bounds`, `padding?` | Fit view to a bounding box. |

### 3D Scene Commands

| Type | Payload | Description |
|---|---|---|
| `setSceneCamera` | `camera` | Set 3D camera position, target, up, fov. |
| `addSceneSource` | `sourceId`, `source` | Add a 3D source (terrain-raster-dem, 3d-tiles, gltf). |
| `removeSceneSource` | `sourceId` | Remove a 3D source. |
| `addSceneLayer` | `layer` | Add a 3D scene layer (terrain, tileset3d, model). |
| `removeSceneLayer` | `layerId` | Remove a 3D scene layer. |
| `setSceneLayerVisibility` | `layerId`, `visible` | Toggle 3D layer visibility. |

## Common Patterns

### Pattern: Add a GeoJSON Source and Circle Layer

```json
[
  {
    "id": "cmd-001",
    "version": "0.1",
    "type": "addSource",
    "sourceId": "earthquakes",
    "source": {
      "type": "geojson",
      "data": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
    },
    "reason": "Add USGS earthquake feed"
  },
  {
    "id": "cmd-002",
    "version": "0.1",
    "type": "addLayer",
    "layer": {
      "id": "earthquakes-circle",
      "type": "circle",
      "source": "earthquakes",
      "paint": {
        "circle-radius": ["interpolate", ["linear"], ["get", "mag"], 0, 2, 8, 20],
        "circle-color": ["interpolate", ["linear"], ["get", "mag"], 0, "#22c55e", 5, "#ef4444", 8, "#7f1d1d"]
      }
    },
    "reason": "Visualize earthquakes by magnitude"
  }
]
```

### Pattern: Change Layer Style

```json
[
  {
    "id": "cmd-003",
    "version": "0.1",
    "type": "setPaint",
    "layerId": "buildings-fill",
    "paint": {
      "fill-color": "#1e3a5f",
      "fill-opacity": 0.8
    },
    "reason": "Switch to dark blue building fill"
  }
]
```

### Pattern: Update View

```json
[
  {
    "id": "cmd-004",
    "version": "0.1",
    "type": "setView",
    "view": {
      "center": [-73.9857, 40.7484],
      "zoom": 14,
      "pitch": 60,
      "bearing": -20
    },
    "reason": "Fly to NYC Midtown with 3D perspective"
  }
]
```

### Pattern: Add Filter

```json
[
  {
    "id": "cmd-005",
    "version": "0.1",
    "type": "setFilter",
    "layerId": "earthquakes-circle",
    "filter": [">=", ["get", "mag"], 4.0],
    "reason": "Show only magnitude 4+ earthquakes"
  }
]
```

### Pattern: Remove and Reorder

```json
[
  {
    "id": "cmd-006",
    "version": "0.1",
    "type": "removeLayer",
    "layerId": "old-labels",
    "reason": "Replace with new label layer"
  },
  {
    "id": "cmd-007",
    "version": "0.1",
    "type": "reorderLayer",
    "layerId": "buildings-fill",
    "beforeLayerId": "roads-line",
    "reason": "Render buildings below roads"
  }
]
```

### Pattern: Fit Bounds with Padding

```json
[
  {
    "id": "cmd-008",
    "version": "0.1",
    "type": "fitBounds",
    "bounds": [-122.5, 37.7, -122.3, 37.9],
    "padding": 50,
    "reason": "Fit to San Francisco"
  }
]
```

## Applying Commands

### Via MCP Tool

```json
// Tool: apply_commands
{
  "spec": { "version": "0.1", "view": {...}, "sources": {...}, "layers": [...] },
  "commands": [
    { "id": "cmd-001", "version": "0.1", "type": "setPaint", "layerId": "roads", "paint": { "line-color": "#ff0000" } }
  ],
  "dryRun": false,
  "transaction": "atomic"
}
```

### Programmatically

```typescript
import { applyCommands } from "@gis-engine/engine";

const result = applyCommands(baseSpec, commands, {
  dryRun: false,
  transaction: "atomic",
  collectTrace: true,
  traceId: "edit-session-1",
});

if (result.spec) {
  console.log("Updated spec:", result.spec);
  console.log("Patches:", result.commandResults.map(r => r.patch));
}
```

## Transaction Modes

| Mode | Behavior |
|---|---|
| `"atomic"` | All commands succeed or none apply. If any command fails, the spec is unchanged. |
| `"best-effort"` | Commands apply in order; failures are recorded but do not roll back previous commands. |

Default is `"atomic"`.

## Dry-Run

Set `dryRun: true` to preview changes without modifying the spec:

```json
{
  "id": "cmd-preview",
  "version": "0.1",
  "type": "addLayer",
  "layer": { "id": "preview-layer", "type": "circle", "source": "data" },
  "dryRun": true
}
```

The result includes the patches that *would* be applied, plus any diagnostics, without changing the spec.

## Conflict Detection

Use `baseRevision` to prevent stale edits:

```json
{
  "id": "cmd-conflict-check",
  "version": "0.1",
  "type": "setPaint",
  "layerId": "roads",
  "paint": { "line-color": "#0000ff" },
  "baseRevision": "rev-abc123"
}
```

If the spec's current `revision` does not match `baseRevision`, the command fails
with `CONFLICT.BASE_REVISION`. This prevents two users or agents from editing the
same spec simultaneously without coordination.

## Command Result Structure

Each applied command returns:

```json
{
  "commandId": "cmd-001",
  "sequenceId": 0,
  "status": "applied",
  "baseRevision": "rev-before",
  "nextRevision": "rev-after",
  "changedPaths": ["/layers/0/paint"],
  "patch": [{ "op": "replace", "path": "/layers/0/paint/line-color", "value": "#ff0000" }],
  "inversePatch": [{ "op": "replace", "path": "/layers/0/paint/line-color", "value": "#000000" }],
  "diagnostics": []
}
```

Use `inversePatch` to implement undo. Use `changedPaths` to detect what a command touched.

## Tips

- Always give commands a descriptive `reason` for auditability.
- Use `atomic` transactions for multi-step edits that must be consistent.
- Use `dryRun: true` to validate commands before applying them in production.
- Set `baseRevision` when coordinating edits across multiple agents or users.
- Use `addLayer` with `beforeLayerId` to control z-order at insertion time.
- `setFilter` with `null` clears the filter entirely.
