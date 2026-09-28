# @gis-engine/scene3d-three-adapter

This package isolates experimental renderer evidence from the generic engine contract.

## Stable Renderer Handoff Contract

The quality gate expects evidence for `load`, `render`, `resize`, `camera`, `snapshot`, `query`, `destroy`, structured `diagnostics`, and resource cleanup. The stable `view.mode: "scene3d"` remains blocked until that evidence and the promotion decision are accepted.

Three.js and 3DTilesRendererJS are the target renderer packages for this adapter. They must not enter `@gis-engine/engine` or `@gis-engine/scene3d`, and this spike package declares no Three.js or 3DTilesRendererJS dependency and imports no renderer source.

## Evidence Provenance

The SceneView3D browser runner paints a synthetic Canvas2D frame from the deterministic snapshot and query evidence. Its reports therefore carry `frameProvenance: "synthetic-canvas2d"` and prove the adapter contract and evidence plumbing, not stable 3D rendering. Renderer visual evidence that claims `frameProvenance: "renderer-frame"` is rejected while this package reports `runtimeSupported: false`, and the release gate records a warning when a synthetic frame is accepted as renderer evidence.

## Run

```bash
pnpm --filter @gis-engine/scene3d-three-adapter build
pnpm test:adapter -- tests/adapter/scene3d-three-adapter.test.ts
pnpm test:release:scene3d
```

## Non-goals

- Stable SceneView3D promotion.
- Renderer dependencies in core packages.
- Network or worker access outside resource policy.

See [adapter tests](../../tests/adapter/scene3d-three-adapter.test.ts) and [release evidence tests](../../tests/snapshot/smoke/scene3d-release-visual-gate.test.ts).
