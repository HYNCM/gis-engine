# Command System

All map state mutation in GIS Engine goes through the command system.
Direct property access is not supported.

## Why Commands?

| Problem | Command Solution |
|---------|-----------------|
| Unsafe AI edits | Commands are validated before execution |
| No audit trail | `collectTrace` records every change |
| Irreversible mistakes | Rollback via inverse commands |
| Concurrent edits | `baseRevision` conflict detection |
| Testing | Deterministic replay of command sequences |

## Command Types

### setPaint

Change a layer's paint properties.

```typescript
{ type: "setPaint", layerId: "my-layer", paint: { "circle-color": "#ef4444" } }
```

### setLayout

Change a layer's layout properties.

```typescript
{ type: "setLayout", layerId: "my-layer", layout: { visibility: "none" } }
```

### addLayer

Add a new layer to the map.

```typescript
{
  type: "addLayer",
  layer: { id: "new-layer", type: "circle", source: "points", paint: { "circle-radius": 6 } },
  beforeLayerId: "existing-layer"  // optional: insert before this layer
}
```

### removeLayer

Remove a layer by ID.

```typescript
{ type: "removeLayer", layerId: "old-layer" }
```

### reorderLayer

Change layer z-order.

```typescript
{ type: "reorderLayer", layerId: "my-layer", beforeLayerId: "other-layer" }
```

### addSource / removeSource

Add or remove data sources.

```typescript
{ type: "addSource", sourceId: "new-source", source: { type: "geojson", data: { ... } } }
{ type: "removeSource", sourceId: "old-source" }
```

### setView / fitBounds

Change the camera.

```typescript
{ type: "setView", view: { center: [120.15, 30.28], zoom: 12 } }
{ type: "fitBounds", bounds: [119.5, 29.5, 121.0, 31.0], padding: 20 }
```

## Dry Run

Preview command effects without committing:

```typescript
const preview = await applyCommands(spec, commands, { dryRun: true });
// preview.spec contains the would-be result
// Active spec is unchanged
```

## Rollback

```typescript
const result = await applyCommands(spec, commands);
if (!result.committed) return;

// Rollback using the inverse patch
const rollback = await applyCommands(result.spec, result.inverseCommands);
```

## Conflict Detection

```typescript
const result = await applyCommands(spec, commands, { baseRevision: "5" });
// If spec.revision !== "5", result.status === "conflict"
```

## Audit Trail

```typescript
const result = await applyCommands(spec, commands, { collectTrace: true });
// result.traces[] — each trace records:
//   - author, reason, sourcePromptHash
//   - changed JSON Pointer paths
//   - conflict diagnostics
```
