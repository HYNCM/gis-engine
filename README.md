# GIS Engine

> **AI-native, schema-first map engine.** Deterministic, replayable, auditable.
> Built for AI agents and human developers who need a stricter contract than
> traditional map SDKs can offer.

[![CI](https://github.com/HYNCM/gis-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/HYNCM/gis-engine/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

```bash
npm install @gis-engine/engine @gis-engine/ai
# Or scaffold a new project:
npx create-gis-map my-map --template vite-ts
```

```html
<!-- Or from CDN: -->
<script type="module">
import { createMap, applyCommands } from "https://unpkg.com/@gis-engine/engine";
</script>
```

**[Quick Start](https://github.com/HYNCM/gis-engine#quick-start) ·
[MCP Tools](https://github.com/HYNCM/gis-engine#mcp-tools-for-ai) ·
[CLI](packages/cli/README.md) ·
[Documentation](https://github.com/HYNCM/gis-engine/tree/main/docs)**

---

AI-native, TypeScript-first map runtime for building, validating, replaying,
snapshotting, and exporting 2D web map applications, with evidence-gated 3D
contract scaffolds.

GIS Engine has completed the 2026-05-17 v0.2 checkpoint, the
2026-05-18 SceneView3D v1 preparation pass, and the 2026-05-24 W23
promotion-readiness plus automation-hardening follow-up on top of the v0.1
runtime base. The W23 SceneView3D promotion-readiness package is Go, but stable
`view.mode: "scene3d"` remains blocked until the stable renderer contract gate
accepts real renderer evidence.
The current implementation proves this evidence-first generation loop:

```txt
prompt hash + structured intent -> planMapGenerationRequest -> capabilitySummary -> MapGenerationCommandSkeleton -> apply_commands -> diagnostics -> snapshot/export/example evidence
```

Generated-app scene browsing is an extension-only delivery signal. It consumes
`extensions.scene3d`, `sceneBrowsing.state`, `stableRuntimeBlocked`, and stable
runtime blocker codes; it must not be cited as stable renderer evidence.

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
| Workspace scaffold | Functional | Root workspace, `@gis-engine/engine`, `@gis-engine/ai`, `@gis-engine/scene3d`, `@gis-engine/scene3d-three-adapter`, and `@gis-engine/cli` build through `pnpm -r build`. |
| `MapSpec` schema | Functional | TypeBox schemas cover GeoJSON, raster, PMTiles, generic vector tiles, `SceneView3DExtensionSchema`, command contracts, diagnostics, and strict capability reports. |
| Runtime validation | Functional | `validateSpec` runs schema, semantic, expression, resource policy, experimental 2.5D, `extensions.scene3d` schema/source URL/layer-reference checks, loader-level scene resource load plan checks, mock 3D snapshot/query contracts, release visual gate rules, and reserved `scene3d` runtime boundary checks. |
| Command system | Functional | `applyCommands` returns transaction metadata, trace ids, optional audit traces via `collectTrace`, command sequence ids, JSON Patch output, inverse patch, dry-run shape, deterministic layer order behavior, SceneView3D preparation command patches, and `baseRevision` conflict rejection. |
| Patch utilities | Functional | JSON Pointer normalization, apply, invert, changed path sorting, and validation utilities are covered by tests. |
| Diagnostics | Functional | Diagnostic registry covers schema, source/layer references, expressions, resource URL policy, command failures, unsupported capabilities, and snapshot errors. |
| Renderer adapter | Functional MVP | `MockAdapter` and `MapLibreAdapter` implement the renderer contract; MapLibre transformation covers GeoJSON, raster, PMTiles, and generic vector sources. |
| Snapshot harness | Functional | Node smoke snapshots are deterministic; Playwright visual snapshots cover a GeoJSON scene and a generated local MVT vector tile scene. |
| AI tools | Functional | MCP exposes `validate_spec`, `apply_commands`, `export_spec`, `get_context_summary`, `snapshot_spec`, `explain_spec`, and `export_example_app` with input and output schemas. `get_context_summary` and `explain_spec` include `capabilitySummary` for feature display, spatial analysis, and scene browsing, plus gated extension-only SceneView3D context when `extensions.scene3d` exists. `planMapGenerationRequest()` accepts prompt hashes plus structured intent and rejects raw prompt retention by default; `createGenerationEvidenceBundle()` composes existing tools and now includes planner, delivery, source-readiness, and extension-only scene browsing evidence without adding a `generate_map_app` alias. |
| Examples/fixtures | Functional | Basic GeoJSON, AI map edit, raster-basemap, pmtiles-local, vector-tile-url, fill-extrusion-lite, and scene3d-extension examples plus schema/command/snapshot fixtures exist. `apps/studio` and `examples/ai-map-workbench` are reference apps and local review surfaces, not hosted products or GA applications. |
| CI/test gates | Functional | `pnpm build:schema` and `pnpm check` are required finish gates; strict visual snapshots require a browser/WebGL-capable runner. |
| SceneView3D promotion | Handoff-ready / stable no-go | W23 promotion-readiness evidence is accepted and SRC-006 records a stable-runtime No-go. Generated-app scene browsing delivery consumes `extensions.scene3d` and blocker summaries only; it is not stable renderer evidence. |

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

- [Documentation map](./docs/README.md)
- [Operating model](./AGENTS.md)
- [Core framework](./docs/architecture/core-framework.md)
- [Contracts and interfaces](./docs/spec/contracts-and-interfaces.md)
- [Supported feature matrix](./docs/engineering/supported-feature-matrix.md)
- [CI and test strategy](./docs/engineering/ci-test-strategy.md)
- [Release wording guardrails](./docs/engineering/release-wording-guardrails.md)
- [SceneView3D stable renderer contract](./docs/planning/feature-specs/sceneview3d-stable-renderer-contract.md)
- [Current review streams](./docs/reviews/REPORT_INDEX.md)

Historical planning, research, and gate evidence remains under `docs/archive/`,
`docs/planning/`, `docs/research/`, and `docs/reviews/`. Start from
`docs/README.md` before drilling into dated snapshots.

## Known Limitations

GIS Engine does not provide automatic retry for command application or export flows. Callers that receive revision conflicts or transient adapter failures must decide whether and how to retry.

Natural-language generation is currently an orchestration and evidence contract,
not an embedded free-form prompt parser. Callers should classify prompts into
capability domains, build a generation command skeleton, and accept generated
apps only after command replay, diagnostics, snapshot, and export evidence pass.

GIS Engine also does not implement three-way merge. For cross-runtime, multi-tab, or multi-process concurrency, callers must refresh the latest spec, rebase their intended commands, and retry explicitly.

Within a single runtime instance, `MapRuntime.apply()` uses a minimal single-flight serialization path so concurrent local calls are applied one at a time. This is not a full command queue and does not perform automatic rebase or merge.

For review and audit flows, callers can pass `collectTrace: true` to `applyCommands` or MCP `apply_commands`. The returned traces preserve command provenance (`author`, `reason`, `sourcePromptHash`), changed JSON Pointer paths, and conflict diagnostics without storing raw prompts in `MapSpec`.

The current `MapLibreAdapter` is still an MVP renderer binding. It transforms supported `MapSpec` sources/layers, passes adapter contract tests, and is exercised by real-browser visual snapshots, but it is not a complete replacement for MapLibre GL JS.

`fill-extrusion-lite` is an experimental 2.5D contract gated by `capabilities.experimental` and beta-mapped to MapLibre `fill-extrusion`. `@gis-engine/scene3d`, `@gis-engine/scene3d-three-adapter`, `SceneView3DExtensionSchema`, SceneView3D preparation commands, `validateSceneResourceLoadPlan`, `snapshotScene3DMock`, `queryScene3DMock`, and `evaluateScene3DReleaseVisualGate` now exist as the v1 3D contract scaffold, but `view.mode: "scene3d"` is still reserved and returns structured unsupported diagnostics; terrain, glTF, and 3D Tiles are not implemented renderers yet.

## Not Yet

GIS Engine will not attempt to replace Cesium or MapLibre in the current line. It does not ship full 3D Tiles, full WebGPU rendering, complete Mapbox expression compatibility, complete symbol collision/text shaping, GeoParquet analytics, or a full enterprise GIS platform.

Those are staged for later versions after the AI-operable `MapSpec`, command system, diagnostics, snapshot validation, and adapter contracts are stable.
