---
agent: adapter-agent
period: 2026-W23
generated_at: 2026-05-17T16:20:00Z
repo_revision: "acdf28e"
inputs:
  - docs/planning/monthly-roadmap.md
  - docs/planning/sprint-2026-W21.md
  - packages/engine/src/spec/validate.ts
  - packages/engine/src/renderer/maplibre/transformer.ts
decision_level: implementation
---

# Fill Extrusion Lite Beta

## Boundary

`fill-extrusion-lite` is a v0.2.x experimental 2.5D layer contract. It is now
implemented as a MapLibre beta adapter mapping, but it is not part of the
stable 2D layer surface and must not imply full 3D engine support.

## Gate

A MapSpec may use `fill-extrusion-lite` only when both conditions are true:

- `capabilities.experimental` contains `fill-extrusion-lite`.
- The document requests 2.5D through `view.mode: "map2_5d"` or
  `capabilities.dimensions: ["2_5d"]`.

Missing either condition returns `CAPABILITY.UNSUPPORTED` at
`/layers/{index}/type` with a manual suggested fix.

## Renderer Contract

- `MapLibreAdapter.getCapabilities()` declares `layers:
  ["fill-extrusion-lite"]` and `experimental: ["fill-extrusion-lite"]`.
- `transformMapSpecToMapLibreStyle()` maps `fill-extrusion-lite` to MapLibre
  `fill-extrusion` only after `validateSpec()` accepts the experimental gate.
- Missing gate still returns `CAPABILITY.UNSUPPORTED` and no style.
- Snapshot smoke includes the gated 2.5D fixture, and strict visual snapshot
  includes a gated `fill-extrusion-lite` release scene.

## Non-Goals

- Terrain, globe, model layers, depth picking, and 3D Tiles.
- Automatic promotion from 2D fill layers.
- Treating 2.5D support as a stable v1 3D capability.

## Acceptance Criteria

- Missing experimental gate produces `CAPABILITY.UNSUPPORTED`.
- Explicit 2.5D experimental gate passes semantic validation.
- Adapter capabilities claim support only with experimental marking.
- Transformer maps to MapLibre `fill-extrusion` with smoke and adapter tests.
- Release notes call the feature experimental whenever exposed.
