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
`capabilities.dimensions: ["3d"]`, but treats them as unsupported until the
dedicated 3D package passes resource, snapshot, query, and renderer gates.

## Current Behavior

Current validation returns `CAPABILITY.UNSUPPORTED` for:

- `/view/mode` when `view.mode` is `scene3d`.
- `/capabilities/renderer` when renderer is `scene3d`.
- `/capabilities/dimensions` when dimensions include `3d`.

This keeps AI agents from mistaking reserved enum values for available runtime
behavior.

`extensions.scene3d` is the reserved namespace for future 3D contracts. It now
has a formal `SceneView3DExtensionSchema`, generated JSON schema, schema/type
sync assertions, scene source URL policy checks, scene layer-source validation,
and deterministic scene command patches. It is still an extension payload while
the document uses `view.mode: "map2d"`; these contracts do not widen the stable
runtime surface.

Current preparation commands mutate only `extensions.scene3d`:

- `setSceneCamera`
- `addSceneSource`
- `removeSceneSource`
- `addSceneLayer`
- `removeSceneLayer`
- `setSceneLayerVisibility`

## Future Entry Criteria

- Loader-level resource enforcement for 3D asset bytes, textures, workers, and
  timeouts following [sceneview3d-v1-rfc.md](./sceneview3d-v1-rfc.md).
- Renderer capability report with `dimensions: ["3d"]`.
- Snapshot contract that can detect blank scene, invalid camera, and unloaded
  tileset.
- Query contract for pick results and 3D object identity.

## Non-Goals

- Rendering Cesium/Three.js scenes in the core 2D package.
- Accepting terrain, glTF, or 3D Tiles sources in the stable MapSpec schema.
- Allowing AI tools to bypass unsupported diagnostics.

## Acceptance Criteria

- Any current Scene3D request receives a stable structured diagnostic.
- `extensions.scene3d` can be validated by `SceneView3DExtensionSchema` while
  `view.mode` remains `map2d`.
- The unsupported result is visible through `validate_spec` and
  `explain_spec`.
- Further 3D implementation work must complete loader-level resource,
  snapshot, query, and MCP context gates before renderer code is treated as
  release-capable.
