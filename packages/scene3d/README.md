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
- Provide `snapshotScene3DMock` and `queryScene3DMock` so snapshot/query
  contracts are testable before a production renderer exists.
- Provide `evaluateScene3DReleaseVisualGate` so release runners can require
  strict deterministic 3D evidence and only waive real renderer visuals with a
  coordinator-approved follow-up.
- Provide a stable scaffold for later MCP context and renderer adapter work.

Current resource gate:

- Enforces 3D Tiles JSON byte budget, glTF/model byte budget, texture count,
  texture byte budget, worker cap, and request timeout.
- Returns structured diagnostics such as `SECURITY.RESOURCE_TOO_LARGE`,
  `SECURITY.RESOURCE_TIMEOUT`, `SECURITY.UNSUPPORTED_ASSET_TYPE`, and
  `SRC.NOT_FOUND`.
- Does not perform network fetches; renderer loaders submit a deterministic
  resource load plan before loading.

Current mock snapshot/query gate:

- `snapshotScene3DMock` returns a deterministic `SnapshotResult`-compatible
  report with scene summary, blank-scene diagnostics, and strict pending-source
  diagnostics.
- `queryScene3DMock` returns deterministic pick results for visible pickable
  scene layers and structured diagnostics for missing layer/source references.
- These functions read only `extensions.scene3d`; they do not enable
  `view.mode: "scene3d"`.

Current release visual gate:

- `evaluateScene3DReleaseVisualGate` combines strict mock snapshot evidence,
  deterministic query evidence, optional renderer visual evidence, and an
  explicit coordinator waiver.
- In `ciTier: "release"` mode, the gate fails unless renderer visual evidence
  passes or a coordinator waiver records a reason and follow-up task id.
- Waivers cannot bypass pending resources, blank-scene diagnostics, missing
  layer/source diagnostics, or missing query evidence for pickable layers.
- The direct runner is `pnpm test:release:scene3d`; the same gate is included in
  `pnpm test:snapshot:smoke` and therefore in `pnpm check`.

Current non-goal:

- Do not treat `view.mode: "scene3d"` as stable runtime support.
- Do not import CesiumJS, Three.js, glTF loaders, 3D Tiles parsers, WebGPU-only
  runtime code, workers, or remote asset loading here until the v1 MCP context,
  visual gate, and renderer gates are defined.
