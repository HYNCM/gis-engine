# @gis-engine/scene3d

`@gis-engine/scene3d` is the package boundary for future SceneView3D work. It
does not bundle CesiumJS, Three.js, glTF loaders, 3D Tiles parsers, WebGPU-only
code, workers, or remote asset loading yet.

Current responsibilities:

- Export the v1 SceneView3D capability report.
- Keep SceneView3D preparation data under `extensions.scene3d`.
- Document that `setSceneCamera`, `addSceneSource`, `removeSceneSource`,
  `addSceneLayer`, `removeSceneLayer`, and `setSceneLayerVisibility` are
  preparation commands only.
- Keep 3D runtime concerns outside `@gis-engine/engine`.
- Provide `validateSceneResourceLoadPlan` so future renderer loaders can enforce
  `SceneResourcePolicy` before partial rendering starts.
- Provide a stable scaffold for later snapshot, query, and renderer adapter work.

Current resource gate:

- Enforces 3D Tiles JSON byte budget, glTF/model byte budget, texture count,
  texture byte budget, worker cap, and request timeout.
- Returns structured diagnostics such as `SECURITY.RESOURCE_TOO_LARGE`,
  `SECURITY.RESOURCE_TIMEOUT`, `SECURITY.UNSUPPORTED_ASSET_TYPE`, and
  `SRC.NOT_FOUND`.
- Does not perform network fetches; renderer loaders submit a deterministic
  resource load plan before loading.

Current non-goal:

- Do not treat `view.mode: "scene3d"` as stable runtime support.
- Do not import CesiumJS, Three.js, glTF loaders, 3D Tiles parsers, WebGPU-only
  runtime code, workers, or remote asset loading here until the v1 snapshot,
  query, and renderer gates are defined.
