---
agent: adapter-agent
period: 2026-W23
generated_at: 2026-05-17T16:20:00Z
repo_revision: "acdf28e"
inputs:
  - docs/planning/monthly-roadmap.md
  - docs/research/competitive-analysis-ai-native-2d-3d.md
  - packages/engine/src/spec/validate.ts
decision_level: advisory
---

# Scene3D Boundary

## Boundary

`SceneView3D` remains a v1 capability boundary. The current v0.2 line reserves
names for `view.mode: "scene3d"`, `capabilities.renderer: "scene3d"`, and
`capabilities.dimensions: ["3d"]`, but treats them as unsupported until a
dedicated 3D package defines camera, terrain, source, query, and snapshot
contracts.

## Current Behavior

Current validation returns `CAPABILITY.UNSUPPORTED` for:

- `/view/mode` when `view.mode` is `scene3d`.
- `/capabilities/renderer` when renderer is `scene3d`.
- `/capabilities/dimensions` when dimensions include `3d`.

This keeps AI agents from mistaking reserved enum values for available runtime
behavior.

## Future Entry Criteria

- `extensions.scene3d` schema for camera, lights, depth, terrain, and tilesets.
- Renderer capability report with `dimensions: ["3d"]`.
- 3D resource policy for tilesets, workers, textures, and model assets.
- Snapshot contract that can detect blank scene, invalid camera, and unloaded
  tileset.
- Query contract for pick results and 3D object identity.

## Non-Goals

- Rendering Cesium/Three.js scenes in the core 2D package.
- Accepting terrain, glTF, or 3D Tiles sources in the stable MapSpec schema.
- Allowing AI tools to bypass unsupported diagnostics.

## Acceptance Criteria

- Any current Scene3D request receives a stable structured diagnostic.
- The unsupported result is visible through `validate_spec` and
  `explain_spec`.
- 3D implementation work must start with schema and resource-policy RFCs before
  renderer code.
