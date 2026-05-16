# GIS Engine

AI-native, TypeScript-first map runtime for building, validating, replaying, and exporting 2D and 3D-ready web map applications.

GIS Engine is currently in architecture and contract design. The first implementation target is a v0.1 runtime that proves this loop:

```txt
MapSpec -> validate -> render -> command modify -> snapshot -> export
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
| Workspace scaffold | Started | Root `package.json`, `pnpm-workspace.yaml`, `packages/engine`, and `packages/ai` exist. |
| `MapSpec` schema | Started | TypeBox schemas are defined in `packages/engine/src/spec/schemas/`; schema build script is present. |
| Runtime validation | Started | `validateSpec` runs schema and semantic checks such as duplicate layers and missing sources. |
| Command system | Started | `applyCommands` supports the first command replay path, JSON Patch output, inverse patch, dry-run shape, and `baseRevision` conflict rejection. |
| Patch utilities | Started | Minimal JSON Pointer normalization, apply, invert, changed path sorting, and validation utilities exist. |
| Diagnostics | Started | Diagnostic code registry exists; more codes and expression-specific validation are still pending. |
| Renderer adapter | Contract only | `RendererAdapter` TypeScript contract exists; MapLibre adapter implementation is not yet started. |
| Snapshot harness | Planned | CI/test strategy and thresholds are documented; Playwright implementation is pending. |
| AI tools | Minimal | `applyCommandsTool` exists; MCP server and full tool suite are pending. |
| Examples/fixtures | Started | Basic GeoJSON and AI map edit examples plus schema/command fixtures exist. |
| CI | Planned | Scripts are declared, but no GitHub Actions workflow is present yet. |

## Planned v0.1 Shape

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

- [Mainstream map engine research](./docs/research/mainstream-map-engines.md)
- [Competitive analysis and AI-native 2D/3D standards](./docs/research/competitive-analysis-ai-native-2d-3d.md)
- [Core framework](./docs/architecture/core-framework.md)
- [Core capabilities](./docs/architecture/core-capabilities.md)
- [Contracts and interfaces](./docs/spec/contracts-and-interfaces.md)
- [v0.1 MVP acceptance criteria](./docs/engineering/v0.1-mvp-acceptance.md)
- [CI and test strategy](./docs/engineering/ci-test-strategy.md)
- [v0.1 implementation playbook](./docs/engineering/implementation-playbook.md)
- [Framework review](./docs/reviews/framework-review.md)
- [External AI review follow-up](./docs/reviews/external-ai-review-followup.md)

## Not Yet

v0.1 will not attempt to replace Cesium or MapLibre. It will not ship full 3D Tiles, full WebGPU rendering, complete Mapbox expression compatibility, complete symbol collision/text shaping, GeoParquet analytics, or a full enterprise GIS platform.

Those are staged for later versions after the AI-operable `MapSpec`, command system, diagnostics, snapshot validation, and adapter contracts are stable.
