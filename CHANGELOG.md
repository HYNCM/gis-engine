# Changelog

## Unreleased

- Added the SceneView3D v1 preparation surface: `SceneView3DExtensionSchema`, generated JSON schema, schema/type sync assertions, valid/invalid fixtures, scene source URL policy diagnostics, and scene layer-source reference validation.
- Added deterministic SceneView3D preparation commands for camera, scene sources, scene layers, scene layer visibility, dry-run, replay, rollback, and missing-target diagnostics. These commands mutate only `extensions.scene3d`; they do not make `view.mode: "scene3d"` stable.
- Added the `@gis-engine/scene3d` package boundary scaffold with capability reporting, unsupported scaffold diagnostics, README guidance, and dependency guard tests that keep Cesium, Three.js, glTF loaders, 3D Tiles parsers, and WebGPU-only runtime code out of `@gis-engine/engine`.
- Added `validateSceneResourceLoadPlan` for loader-level SceneView3D resource enforcement: 3D Tiles JSON size, model size, texture count/bytes, worker cap, timeout, missing source, and unsupported asset type diagnostics.
- Archived the superseded W21 sprint plan and refreshed active documentation to point at the W25 SceneView3D v1 sprint and remaining loader-level resource/snapshot/query work.

## 0.2.0-checkpoint - 2026-05-17

- Added generic `vector` source contracts, resource policy validation, MapLibre vector transformation, example fixtures, snapshot smoke coverage, and a real-browser visual snapshot scene backed by generated local MVT.
- Expanded the expression contract and validation coverage for `case`, `match`, `zoom`, `to-number`, and `to-string`.
- Hardened MCP tools with public input/output schemas, strict `CapabilityReportSchema` validation, and v0.2 vector/expression contract coverage.
- Added deterministic command/style behavior coverage for `setPaint`, `setLayout`, `reorderLayer`, rollback, dry-run, and missing `beforeLayerId` diagnostics.
- Defined the `fill-extrusion-lite` experimental 2.5D gate and the reserved `scene3d` unsupported boundary.
- Added v0.2 checkpoint audit and release note draft with `pnpm build:schema`, `pnpm check`, visual snapshot, and strict visual snapshot evidence.

## 0.1.0 - Unreleased

- Created the initial pnpm workspace with `@gis-engine/engine` and `@gis-engine/ai`.
- Added TypeBox schemas, runtime validation, diagnostics, command application, JSON Patch utilities, and renderer adapter contracts.
- Added initial schema, command, patch, runtime, adapter, and AI tool tests.
- Added architecture, engineering, competitive analysis, and review documentation.
