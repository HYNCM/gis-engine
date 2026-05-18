# @gis-engine/scene3d

`@gis-engine/scene3d` is the package boundary for future SceneView3D work. It
does not bundle CesiumJS, Three.js, glTF loaders, 3D Tiles parsers, WebGPU-only
code, workers, or remote asset loading yet.

Current responsibilities:

- Export the v1 SceneView3D capability report.
- Keep 3D runtime concerns outside `@gis-engine/engine`.
- Provide a stable scaffold for later resource-policy, snapshot, query, and
  renderer adapter work.

Current non-goal:

- Do not treat `view.mode: "scene3d"` as stable runtime support.
