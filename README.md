# GIS Engine

AI-native, TypeScript-first map runtime for building, validating, replaying, snapshotting, and exporting 2D and 3D-ready web map applications.

GIS Engine has completed the 2026-05-17 v0.2 checkpoint and the
2026-05-18 SceneView3D v1 preparation pass on top of the v0.1 runtime base.
The current implementation proves this loop:

```txt
MapSpec -> validate -> render/transform -> command modify -> snapshot -> export
```

## Why This Exists

Traditional map SDKs are powerful, but AI agents need a stricter contract:

- A versioned `MapSpec` instead of hidden runtime state.
- Command-only mutation instead of arbitrary JavaScript edits.
- Structured diagnostics instead of plain error strings.
- Snapshot validation to prove the map actually rendered.
- MCP tools that operate on public schemas, not private renderer internals.

## Current Implementation Status

| Area | Status | Notes |
| --- | --- | --- |
| Workspace scaffold | Functional | Root workspace, `@gis-engine/engine`, `@gis-engine/ai`, and `@gis-engine/scene3d` build through `pnpm -r build`. |
| `MapSpec` schema | Functional | TypeBox schemas cover GeoJSON, raster, PMTiles, generic vector tiles, `SceneView3DExtensionSchema`, command contracts, diagnostics, and strict capability reports. |
| Runtime validation | Functional | `validateSpec` runs schema, semantic, expression, resource policy, experimental 2.5D, `extensions.scene3d` schema/source URL/layer-reference checks, loader-level scene resource load plan checks, and reserved `scene3d` runtime boundary checks. |
| Command system | Functional | `applyCommands` returns transaction metadata, trace ids, optional audit traces via `collectTrace`, command sequence ids, JSON Patch output, inverse patch, dry-run shape, deterministic layer order behavior, SceneView3D preparation command patches, and `baseRevision` conflict rejection. |
| Patch utilities | Functional | JSON Pointer normalization, apply, invert, changed path sorting, and validation utilities are covered by tests. |
| Diagnostics | Functional | Diagnostic registry covers schema, source/layer references, expressions, resource URL policy, command failures, unsupported capabilities, and snapshot errors. |
| Renderer adapter | Functional MVP | `MockAdapter` and `MapLibreAdapter` implement the renderer contract; MapLibre transformation covers GeoJSON, raster, PMTiles, and generic vector sources. |
| Snapshot harness | Functional | Node smoke snapshots are deterministic; Playwright visual snapshots cover a GeoJSON scene and a generated local MVT vector tile scene. |
| AI tools | Functional | MCP exposes `validate_spec`, `apply_commands`, `export_spec`, `get_context_summary`, `snapshot_spec`, `explain_spec`, and `export_example_app` with input and output schemas. CamelCase aliases are intentionally not supported. |
| Examples/fixtures | Functional | Basic GeoJSON, AI map edit, raster-basemap, pmtiles-local, vector-tile-url, fill-extrusion-lite, and scene3d-extension examples plus schema/command/snapshot fixtures exist. |
| CI/test gates | Functional | `pnpm build:schema` and `pnpm check` are required finish gates; strict visual snapshots require a browser/WebGL-capable runner. |

## Current Runtime Shape

```ts
import { createMap } from "@gis-engine/engine";

const map = await createMap(container, spec, {
  renderer: "maplibre",
});

await map.apply({
  id: "cmd-style-districts",
  version: "0.1",
  type: "setPaint",
  layerId: "district-fill",
  paint: {
    "fill-color": ["step", ["get", "score"], "#dbeafe", 60, "#60a5fa", 90, "#1d4ed8"],
  },
});

const report = await map.validate();
const snapshot = await map.snapshot({ targetLayers: ["district-fill"] });
const exported = map.exportSpec();
```

## Documentation

- [Documentation map and lifecycle](./docs/README.md)
- [Mainstream map engine research](./docs/research/mainstream-map-engines.md)
- [Competitive analysis and AI-native 2D/3D standards](./docs/research/competitive-analysis-ai-native-2d-3d.md)
- [Core framework](./docs/architecture/core-framework.md)
- [Core capabilities](./docs/architecture/core-capabilities.md)
- [Contracts and interfaces](./docs/spec/contracts-and-interfaces.md)
- [v0.1 MVP acceptance criteria](./docs/engineering/v0.1-mvp-acceptance.md)
- [v0.1 release checklist](./docs/engineering/v0.1-release-checklist.md)
- [CI and test strategy](./docs/engineering/ci-test-strategy.md)
- [Contract freeze checklist](./docs/engineering/contract-freeze.md)
- [v0.1 implementation playbook](./docs/engineering/implementation-playbook.md)
- [Supported Feature Matrix](./docs/engineering/supported-feature-matrix.md)
- [SceneView3D package boundary](./packages/scene3d/README.md)
- [v0.2 checkpoint audit](./docs/reviews/v0.2-checkpoint-audit-2026-05-17.md)
- [v0.2 release note draft](./docs/planning/v0.2-release-note-draft.md)
- [v0.2 gate checklist](./docs/planning/v0.2-gate-checklist.md)
- [SceneView3D v1 sprint plan](./docs/planning/sprint-2026-W25-sceneview3d-v1.md)

## Known Limitations

GIS Engine does not provide automatic retry for command application or export flows. Callers that receive revision conflicts or transient adapter failures must decide whether and how to retry.

GIS Engine also does not implement three-way merge. For cross-runtime, multi-tab, or multi-process concurrency, callers must refresh the latest spec, rebase their intended commands, and retry explicitly.

Within a single runtime instance, `MapRuntime.apply()` uses a minimal single-flight serialization path so concurrent local calls are applied one at a time. This is not a full command queue and does not perform automatic rebase or merge.

For review and audit flows, callers can pass `collectTrace: true` to `applyCommands` or MCP `apply_commands`. The returned traces preserve command provenance (`author`, `reason`, `sourcePromptHash`), changed JSON Pointer paths, and conflict diagnostics without storing raw prompts in `MapSpec`.

The current `MapLibreAdapter` is still an MVP renderer binding. It transforms supported `MapSpec` sources/layers, passes adapter contract tests, and is exercised by real-browser visual snapshots, but it is not a complete replacement for MapLibre GL JS.

`fill-extrusion-lite` is an experimental 2.5D contract gated by `capabilities.experimental` and beta-mapped to MapLibre `fill-extrusion`. `@gis-engine/scene3d`, `SceneView3DExtensionSchema`, SceneView3D preparation commands, and `validateSceneResourceLoadPlan` now exist as the v1 3D contract scaffold, but `view.mode: "scene3d"` is still reserved and returns structured unsupported diagnostics; terrain, glTF, and 3D Tiles are not implemented renderers yet.

## Not Yet

GIS Engine will not attempt to replace Cesium or MapLibre in the current line. It does not ship full 3D Tiles, full WebGPU rendering, complete Mapbox expression compatibility, complete symbol collision/text shaping, GeoParquet analytics, or a full enterprise GIS platform.

Those are staged for later versions after the AI-operable `MapSpec`, command system, diagnostics, snapshot validation, and adapter contracts are stable.
