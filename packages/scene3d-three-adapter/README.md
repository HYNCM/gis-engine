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
- Exposes `createScene3DThreeAdapterRuntime(extension, options)` as a thin
  adapter-local shim for `load`, `snapshot`, `query`, and `destroy`, reusing
  mock SceneView3D snapshot/query contracts while keeping `stableViewMode`
  false.
- Converts future release-runner visual capture metrics into
  `Scene3DRendererVisualEvidence` through
  `createScene3DThreeAdapterRendererEvidence`, while keeping missing or blank
  captures as failing evidence.
- Summarizes load-plan, resource, runtime, snapshot, query, and release visual
  evidence through `createScene3DThreeAdapterPromotionEvidenceSummary`, while
  keeping `stablePromotionAllowed` false.
- Exposes `getScene3DThreeAdapterStableRendererContract()` as a machine-readable
  adapter handoff contract for the future stable renderer obligations.

The real renderer implementation must stay in this adapter package or a later
adapter package. `@gis-engine/engine` and `@gis-engine/scene3d` must remain free
of Three.js, CesiumJS, loader, worker, and remote asset dependencies.

## Stable Renderer Handoff Contract

`getScene3DThreeAdapterStableRendererContract()` returns an auditable summary for
the adapter-side part of `TASK-2026W23-SRC-001` and `TASK-2026W23-SRC-002`. It
is a contract and evidence checklist, not a runtime promotion; stable
`view.mode: "scene3d"` remains blocked until the future promotion decision gate
accepts the complete renderer package.

The contract records these required adapter obligations:

| Obligation | Adapter-side requirement |
| --- | --- |
| `load` | Validate the SceneView3D extension and adapter resource load plan before creating renderer resources. |
| `render` | Render terrain, 3D Tiles, and glTF layers through adapter-local renderer state without mutating core runtime state. |
| `resize` | Apply viewport size and pixel ratio changes deterministically and report invalid dimensions as diagnostics. |
| `camera` | Apply schema-validated camera position, target, up vector, field of view, and clipping values. |
| `snapshot` | Return deterministic PNG or data-url snapshots and resource-pending diagnostics when required sources are not loaded. |
| `query` | Return deterministic picking results with layer, source, object id, position, and properties fields. |
| `destroy` | Make lifecycle teardown idempotent and report stable diagnostics for post-destroy operations. |
| `diagnostics` | Use structured `Diagnostic` objects for load, render, snapshot, query, lifecycle, and resource-policy failures. |
| `resource cleanup` | Dispose adapter-owned renderer, scene graph, geometry, material, texture, worker, listener, and object URL resources. |

The contract also repeats the guardrails for this adapter package: schema first,
command-only mutation, structured diagnostics, snapshot verification, resource
policy enforcement, and adapter boundary preservation.

## Dependency Boundary

Three.js and 3DTilesRendererJS are adapter-local renderer dependencies. They
must stay inside `@gis-engine/scene3d-three-adapter` or a future renderer
adapter package. They must not be imported by, declared by, or surfaced as
runtime dependencies of `@gis-engine/engine` or `@gis-engine/scene3d`.

During the current spike, `three` and `3d-tiles-renderer` are intentionally not
declared in this package manifest either. That keeps offline CI independent from
future renderer package metadata while the contract is being frozen.

## Non-goals

- Do not enable stable `view.mode: "scene3d"`.
- Do not promote `capabilities.renderer: "scene3d"` or
  `capabilities.dimensions: ["3d"]`.
- Do not move renderer dependencies into `@gis-engine/engine` or
  `@gis-engine/scene3d`.
- Do not mutate runtime state outside `MapCommand` and `applyCommands`.
- Do not accept renderer visual evidence without resource-policy checks and
  deterministic snapshot/query evidence.

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
- `createScene3DThreeAdapterRuntime(extension, options)` returns a thin runtime
  shim with adapter-local `load`, `snapshot`, `query`, `destroy`, and
  `rendererEvidence` methods.
- `createScene3DThreeAdapterRendererEvidence(spikeReport, options)` accepts a
  future browser/WebGL capture report and returns release-gate compatible
  renderer evidence. It fails when capture metrics are missing, blank, invalid,
  or when resource policy diagnostics contain errors.
- `createScene3DThreeAdapterPromotionEvidenceSummary(spikeReport, options)`
  creates the adapter-side promotion summary for W23 readiness review. It is
  decision evidence only; it does not enable stable `view.mode: "scene3d"`.
- `getScene3DThreeAdapterStableRendererContract()` returns the stable renderer
  handoff obligations, dependency boundary, guardrails, and stable-runtime
  blocker diagnostics for the adapter-side SRC-001/SRC-002 slice.
