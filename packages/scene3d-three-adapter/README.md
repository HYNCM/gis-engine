# @gis-engine/scene3d-three-adapter

`@gis-engine/scene3d-three-adapter` is the isolated W28 spike boundary for a
future SceneView3D renderer based on Three.js and 3DTilesRendererJS.

Current status:

- Experimental spike only.
- Does not enable stable `view.mode: "scene3d"`.
- Does not import Three.js or 3DTilesRendererJS at runtime yet.
- Does not declare Three.js or 3DTilesRendererJS in `package.json` yet, so
  offline CI does not need registry metadata for the future renderer packages.
- Does not fetch remote assets, start workers, or create WebGL/WebGPU contexts.
- Converts `extensions.scene3d` source declarations into deterministic resource
  load plans and runs them through `validateSceneResourceLoadPlan`.
- Converts future release-runner visual capture metrics into
  `Scene3DRendererVisualEvidence` through
  `createScene3DThreeAdapterRendererEvidence`, while keeping missing or blank
  captures as failing evidence.

The real renderer implementation must stay in this adapter package or a later
adapter package. `@gis-engine/engine` and `@gis-engine/scene3d` must remain free
of Three.js, CesiumJS, loader, worker, and remote asset dependencies.

Direct evidence commands:

```bash
pnpm --filter @gis-engine/scene3d-three-adapter build
pnpm test:adapter -- tests/adapter/scene3d-three-adapter.test.ts
```

Current evidence API:

- `buildScene3DThreeAdapterLoadPlan(extension, options)` creates a deterministic
  resource load plan from `extensions.scene3d`.
- `evaluateScene3DThreeAdapterSpike(extension, options)` validates that plan
  against `validateSceneResourceLoadPlan` and keeps runtime support false.
- `createScene3DThreeAdapterRendererEvidence(spikeReport, options)` accepts a
  future browser/WebGL capture report and returns release-gate compatible
  renderer evidence. It fails when capture metrics are missing, blank, invalid,
  or when resource policy diagnostics contain errors.
