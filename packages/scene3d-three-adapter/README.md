# @gis-engine/scene3d-three-adapter

This package isolates experimental renderer evidence from the generic engine contract.

## Stable Renderer Handoff Contract

The quality gate expects evidence for `load`, `render`, `resize`, `camera`, `snapshot`, `query`, `destroy`, structured `diagnostics`, and resource cleanup. The stable `view.mode: "scene3d"` remains blocked until that evidence and the promotion decision are accepted.

Three.js and 3DTilesRendererJS are adapter-local renderer dependencies. They must not enter `@gis-engine/engine` or `@gis-engine/scene3d`.

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
