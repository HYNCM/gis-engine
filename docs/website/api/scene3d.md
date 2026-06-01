# @gis-engine/scene3d

SceneView3D extension boundary. **Experimental — stable runtime is blocked.**

This package defines the `SceneView3DExtensionSchema` and SceneView3D
preparation commands. It does not enable stable `view.mode: "scene3d"` rendering.

## Status

| Component | Status |
|-----------|--------|
| `SceneView3DExtensionSchema` | ✅ Defined |
| Scene3D commands (camera, sources, layers) | ✅ Preparation only |
| Mock snapshot/query contracts | ✅ Defined |
| Stable runtime rendering | ❌ Blocked |
| Three.js adapter | 🔬 Spike only |

## Schema

```typescript
import { SceneView3DExtensionSchema } from "@gis-engine/scene3d";

// The extension is attached to MapSpec:
// { extensions: { scene3d: SceneView3DExtension } }
```

## Commands

SceneView3D preparation commands mutate only `extensions.scene3d`:

- `setSceneCamera` — Set 3D camera position
- `addSceneSource` — Add a 3D data source
- `removeSceneSource` — Remove a 3D data source
- `addSceneLayer` — Add a 3D render layer
- `removeSceneLayer` — Remove a 3D render layer
- `setSceneLayerVisibility` — Toggle layer visibility

All commands support dry-run, rollback, replay, and `baseRevision` conflict detection.

## Resource Policy

```typescript
import { validateSceneResourceLoadPlan } from "@gis-engine/scene3d";

const result = validateSceneResourceLoadPlan(plan);
// Enforces limits on: 3D Tiles JSON size, model size, texture count,
// worker cap, timeout, missing source detection
```

## Mock Contracts

```typescript
import { snapshotScene3DMock, queryScene3DMock } from "@gis-engine/scene3d";

const snapshot = snapshotScene3DMock(spec);
const query = queryScene3DMock(spec, { layerId: "buildings" });
```

## Release Gate

```typescript
import { evaluateScene3DReleaseVisualGate } from "@gis-engine/scene3d";

const gate = evaluateScene3DReleaseVisualGate(evidence);
// gate.passed → boolean
// gate.requiresVisualEvidence → true until real renderer exists
```

## When Stable?

Stable `view.mode: "scene3d"` is blocked until:
1. Real renderer visual evidence exists (Three.js adapter produces frames)
2. `quality-guardian` accepts renderer snapshot/query/visual evidence
3. `coordinator` records the promotion decision

See the [GitHub repository](https://github.com/HYNCM/gis-engine) for the full roadmap.
