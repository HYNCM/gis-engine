---
agent: engine-agent
period: 2026-W23
generated_at: 2026-05-24T15:41:09Z
repo_revision: "1b607fde6219d9a011771d24210915ac14d33531"
inputs:
  - tests/resources/scene3d-loader-policy.test.ts
  - tests/adapter/scene3d-package-boundary.test.ts
  - packages/engine/src/spec/resource-policy.ts
  - packages/engine/src/spec/validate.ts
  - packages/scene3d/src/index.ts
  - packages/engine/package.json
  - packages/scene3d/package.json
owner: "@engine-agent"
decision_level: advisory
---

# SceneView3D Stable Renderer Resource Policy Boundary

## Scope

This engine slice covers the engine/package-boundary part of
`TASK-2026W23-SRC-002` and the resource-policy part of
`TASK-2026W23-SRC-005`.

No runtime promotion was made. Stable `view.mode: "scene3d"` remains blocked;
the current SceneView3D path stays under `extensions.scene3d`.

## Evidence

| Contract area | Evidence | Result |
| --- | --- | --- |
| Renderer dependency boundary | `tests/adapter/scene3d-package-boundary.test.ts` checks `packages/engine/package.json` and `packages/scene3d/package.json` dependency fields, plus source imports under `packages/engine/src` and `packages/scene3d/src` | Three.js, 3DTilesRendererJS, Cesium, loaders.gl, and `three-stdlib` are barred from engine and scaffold packages |
| Stable runtime boundary | `packages/scene3d/src/index.ts` keeps `scene3dPackageBoundary.stableViewMode` false and `explainScene3DScaffold` returns `CAPABILITY.UNSUPPORTED` | SceneView3D remains scaffold/extension-only |
| External URL policy | `tests/resources/scene3d-loader-policy.test.ts` blocks `https://cdn.example.com/.../tileset.json` and `https://assets.example.com/.../station.glb` until `resourcePolicy.allowedHosts` allowlists both hosts | External renderer assets require explicit policy approval before loader evidence can be accepted |
| Loader budgets | `tests/resources/scene3d-loader-policy.test.ts` covers 3D Tiles JSON bytes, model bytes, texture count/bytes, worker count, timeout, unsupported asset kind, and missing source diagnostics | Renderer loader evidence must return structured diagnostics for resource-policy failures |
| Core policy alignment | `packages/engine/src/spec/validate.ts` validates `extensions.scene3d.sources/*/url` through `validateResourceUrl` with SceneView3D policy fields | Scene source URL checks stay aligned with core resource-policy semantics |

## Recommendations

### Freeze renderer dependencies outside core packages

- Evidence: `tests/adapter/scene3d-package-boundary.test.ts` denies package dependencies and source imports for `three`, `3d-tiles-renderer`, `cesium`, loaders.gl renderer loaders, and `three-stdlib` in `@gis-engine/engine` and `@gis-engine/scene3d`.
- Impact: architecture and AI safety stay protected because the stable renderer implementation cannot leak into engine contracts or the scaffold package.
- Action: `@adapter-agent` keeps renderer libraries inside adapter-owned packages; `@engine-agent` keeps this boundary test green for SRC-002.
- Confidence: high.

### Treat external renderer assets as explicit resource-policy input

- Evidence: `tests/resources/scene3d-loader-policy.test.ts` now fails SceneView3D external 3D Tiles/model URLs until the scene `resourcePolicy.allowedHosts` includes the remote hosts.
- Impact: security and product release evidence remain auditable; renderer loaders cannot silently fetch unreviewed external tilesets, models, textures, or related assets.
- Action: `@adapter-agent` and `@qa-agent` should include source URLs and host policy in renderer evidence reports; `@quality-guardian` should reject stable/beta claims when external assets are not policy-approved.
- Confidence: high.

### Keep loader evidence structured before stable promotion

- Evidence: loader policy tests already cover `tileset-json`, `model`, `texture`, `worker`, timeout, unsupported asset type, and missing source diagnostics with stable diagnostic codes.
- Impact: AI tooling and release gates can distinguish budget overflow, timeout, missing source, and unsupported asset failures instead of relying on natural-language-only loader errors.
- Action: `@engine-agent` should extend this test only when new public SceneView3D resource kinds enter the schema; `@quality-guardian` should require the resource-policy evidence before accepting SRC-005.
- Confidence: high.

### Do not promote stable SceneView3D runtime from this slice

- Evidence: no runtime files, schemas, MCP tools, or renderer adapters were changed; `scene3dPackageBoundary.stableViewMode` remains false.
- Impact: product messaging stays honest: this slice strengthens prerequisites but does not prove stable renderer lifecycle, visual, snapshot, or query behavior.
- Action: `@coordinator` keeps stable `view.mode: "scene3d"` blocked until the later renderer contract, lifecycle, visual, query, and quality-gate tasks pass.
- Confidence: high.

## Verification Commands

- `pnpm -s vitest run tests/resources/scene3d-loader-policy.test.ts`
- `pnpm -s vitest run tests/adapter/scene3d-package-boundary.test.ts`

