---
agent: adapter-agent
period: 2026-W23
generated_at: 2026-05-17T16:20:00Z
repo_revision: "working-tree"
inputs:
  - docs/planning/monthly-roadmap.md
  - docs/planning/sprint-2026-W21.md
  - packages/engine/src/spec/validate.ts
  - packages/engine/src/renderer/maplibre/transformer.ts
decision_level: advisory
---

# Fill Extrusion Lite Beta

## Boundary

`fill-extrusion-lite` is a v0.2.x experimental 2.5D layer contract. It is not
part of the stable 2D layer surface and must not imply full 3D engine support.

## Gate

A MapSpec may use `fill-extrusion-lite` only when both conditions are true:

- `capabilities.experimental` contains `fill-extrusion-lite`.
- The document requests 2.5D through `view.mode: "map2_5d"` or
  `capabilities.dimensions: ["2_5d"]`.

Missing either condition returns `CAPABILITY.UNSUPPORTED` at
`/layers/{index}/type` with a manual suggested fix.

## Renderer Contract

- Current MapLibre MVP does not advertise or transform `fill-extrusion-lite`.
- A future beta adapter may map it to MapLibre `fill-extrusion` only after its
  capability report declares `experimental: ["fill-extrusion-lite"]`.
- Snapshot support must include one passing smoke test and one visual test or a
  coordinator-approved waiver.

## Non-Goals

- Terrain, globe, model layers, depth picking, and 3D Tiles.
- Automatic promotion from 2D fill layers.
- Treating 2.5D support as a stable v1 3D capability.

## Acceptance Criteria

- Missing experimental gate produces `CAPABILITY.UNSUPPORTED`.
- Explicit 2.5D experimental gate passes semantic validation.
- Adapter capabilities do not claim support before transformer support exists.
- Release notes call the feature experimental whenever exposed.
