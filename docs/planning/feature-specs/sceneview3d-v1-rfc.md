---
agent: product-strategist
period: 2026-05
generated_at: 2026-05-18T09:00:00Z
repo_revision: "e3e8427"
inputs:
  - docs/planning/feature-specs/scene3d-boundary.md
  - docs/research/competitive-analysis-ai-native-2d-3d.md
  - docs/spec/contracts-and-interfaces.md
  - tests/fixtures/specs/valid/scene3d-extension.map.json
decision_level: rfc
---

# SceneView3D v1 RFC

## Decision

SceneView3D starts as a v1 RFC, not a v0.2 implementation. The current
`MapSpec.version: "0.1"` surface keeps `view.mode: "scene3d"`,
`capabilities.renderer: "scene3d"`, and `capabilities.dimensions: ["3d"]`
reserved but unsupported. Future 3D work must begin by formalizing the
`extensions.scene3d` contract, resource policy, snapshot contract, query
contract, and command schema before any renderer package is allowed to mutate
runtime state.

## Goals

- Preserve AI-native guarantees for 3D: deterministic commands, replayable
  patches, structured diagnostics, snapshot evidence, and resource isolation.
- Keep 3D capability gated so 2D/2.5D projects are not forced to carry terrain,
  model, or 3D Tiles runtime costs.
- Define a bridge from current `extensions.scene3d` sketches to a future
  schema-first v1 package.

## Proposed Extension Shape

The RFC keeps 3D data under `extensions.scene3d` until a future schema version
promotes it.

```ts
interface SceneView3DExtension {
  camera: SceneCamera;
  lights?: SceneLight[];
  depth?: SceneDepthOptions;
  terrain?: SceneTerrain;
  sources?: Record<string, SceneSource>;
  layers?: SceneLayer[];
  snapshot?: SceneSnapshotOptions;
  resourcePolicy?: SceneResourcePolicy;
}
```

### Camera

```ts
interface SceneCamera {
  type?: "perspective";
  position: [number, number, number];
  target: [number, number, number];
  up?: [number, number, number];
  fov?: number;
  near?: number;
  far?: number;
}
```

Rules:

- Coordinates are `[longitude, latitude, heightMeters]` until a local CRS RFC
  exists.
- `position` and `target` must be finite numbers.
- `fov` must be greater than `0` and less than `180`.
- `near` must be greater than `0`; `far` must be greater than `near`.

### Sources

```ts
type SceneSource =
  | { type: "terrain-raster-dem"; url: string; encoding?: "mapbox" | "terrarium" }
  | { type: "3d-tiles"; url: string; maximumScreenSpaceError?: number }
  | { type: "gltf"; url: string; transform?: SceneTransform };
```

Rules:

- No 3D source type enters stable `MapSpec.sources` in v0.2.
- All URLs must pass the same resource policy model as 2D URL sources, plus 3D
  size and worker limits.
- `file://` remains blocked.

### Layers

```ts
type SceneLayer =
  | { id: string; type: "terrain"; source: string; visible?: boolean }
  | { id: string; type: "tileset3d"; source: string; pickable?: boolean }
  | { id: string; type: "model"; source: string; pickable?: boolean };
```

Rules:

- Layer id uniqueness follows the existing `LayerSpec` rule.
- `source` must reference a `SceneSource`.
- `pickable` controls query visibility, not rendering visibility.

## Renderer Package Boundary

The first implementation must live behind a dedicated package boundary such as
`@gis-engine/scene3d`. The core 2D package may own shared schemas and
diagnostic codes, but it must not import Cesium, Three.js, WebGPU, glTF loaders,
or 3D Tiles parsers directly.

Capability report requirements:

```ts
{
  renderer: "scene3d",
  dimensions: ["3d"],
  sources: ["terrain-raster-dem", "3d-tiles", "gltf"],
  layers: ["terrain", "tileset3d", "model"],
  expressions: [],
  queries: ["pick", "bbox3d"],
  snapshot: { supported: true, formats: ["png", "data-url"] },
  experimental: ["sceneview3d-v1"]
}
```

## Resource Policy

SceneView3D adds high-risk resources and therefore needs explicit controls:

- Maximum tileset JSON size.
- Maximum glTF/model size.
- Maximum texture count and texture byte budget.
- Worker count cap.
- Request timeout and retry policy.
- Host allowlist shared with 2D sources.
- Diagnostic codes for blocked URL, oversized resource, timeout, and unsupported
  asset type.

The first implementation is `validateSceneResourceLoadPlan` in
`@gis-engine/scene3d`. It validates deterministic loader plans for 3D Tiles JSON
bytes, model bytes, texture count/bytes, worker cap, timeout, missing source,
and unsupported asset type before a renderer is allowed to fetch or partially
render resources.

## Snapshot Contract

3D snapshot must return a `SnapshotReport` compatible with the existing report
shape plus 3D-specific diagnostics. The current mock-level implementation is
`snapshotScene3DMock`, which returns a `SnapshotResult`-compatible report,
scene summary, deterministic data-url payload, and pending source ids without
requiring a GPU.

Minimum checks:

- Scene canvas exists and is nonblank.
- Camera is valid and inside allowed numeric bounds.
- Required tilesets/models are loaded or explicitly reported as pending through
  `SNAPSHOT.RESOURCE_PENDING`.
- Depth rendering is available or downgraded with a structured diagnostic.
- Console errors are empty.

Strict release mode must fail if any required 3D resource is skipped.

## Query Contract

3D query must be read-only and deterministic:

```ts
interface ScenePickResult {
  objectId: string;
  layerId: string;
  sourceId: string;
  position: [number, number, number];
  properties: Record<string, unknown>;
}
```

Rules:

- Query methods do not mutate camera, selection, or renderer state.
- Picked objects must include stable object identity.
- Results must be serializable and replayable in tests.
- The current mock-level implementation is `queryScene3DMock`, which returns
  deterministic picks for visible, pickable scene layers and reports missing
  layer/source references with structured diagnostics.

## Command Contract

Initial v1 command support is available as v1 preparation commands under
`extensions.scene3d`:

- `setSceneCamera`
- `addSceneSource`
- `removeSceneSource`
- `addSceneLayer`
- `removeSceneLayer`
- `setSceneLayerVisibility`

All commands must follow the existing command contract:

- `baseRevision` conflict rejection.
- JSON Patch output.
- `inversePatch`.
- `collectTrace`.
- `dryRun`.
- atomic/best-effort transaction behavior.

These commands do not make `view.mode: "scene3d"` stable; they only prepare and
audit scene extension state.

## Migration

No automatic promotion from `extensions.scene3d` to stable 3D schema is allowed.
A future migration must:

- Read an existing extension payload.
- Validate it against the v1 schema.
- Emit applied JSON Patch operations.
- Preserve unsupported diagnostics for fields that cannot be promoted.

## Acceptance Criteria

- A formal TypeBox schema exists for `SceneView3DExtension`.
- Valid and invalid scene fixtures cover camera, terrain, 3D Tiles, glTF, and
  query identity.
- Resource policy tests cover blocked host, oversize asset, timeout, and worker
  cap.
- Snapshot smoke can run without a real GPU, and visual snapshot runs in a
  release-capable browser/WebGL environment.
- MCP tools expose 3D context only after schema-sync and output-schema tests
  pass.
- Core 2D package still passes without importing 3D renderer dependencies.

## Non-Goals

- Implementing Cesium/Three.js runtime in this RFC.
- Making `scene3d` a stable `view.mode` before v1 schema acceptance.
- Supporting unrestricted remote 3D Tiles or model URLs.
- Adding implicit 2D-to-3D promotion.
