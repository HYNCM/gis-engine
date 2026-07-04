# GIS Engine

GIS Engine v1.4.0 is a schema-first map rendering SDK with AI-powered
generation.

[![npm version](https://img.shields.io/npm/v/@gis-engine/engine)](https://www.npmjs.com/package/@gis-engine/engine)
[![CI](https://github.com/HYNCM/gis-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/HYNCM/gis-engine/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/HYNCM/gis-engine)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-hyncm.github.io-blue)](https://hyncm.github.io/gis-engine/)
[![Playground](https://img.shields.io/badge/try-StackBlitz-blue)](https://stackblitz.com/github/HYNCM/gis-engine/tree/main/examples/basic-geojson)

## Why GIS Engine?

Traditional map libraries require imperative JavaScript code. GIS Engine takes a different approach:

- **Schema-first**: Describe your map as a JSON spec (MapSpec). Validate it before rendering.
- **AI-native**: Generate complete maps from natural language prompts. Every map change is traceable and auditable.
- **Command-based mutations**: All state changes go through a command system with dry-run, conflict detection, and rollback support.
- **Structured diagnostics**: Errors return machine-readable diagnostic codes, not opaque strings.

```bash
# Generate a map from a prompt
npx @gis-engine/cli my-map --generate --provider mock
```

[Quick Start](https://hyncm.github.io/gis-engine/guide/quick-start) · [Playground](https://stackblitz.com/github/HYNCM/gis-engine/tree/main/examples/basic-geojson) · [Documentation](https://hyncm.github.io/gis-engine/)

## Quick Start

> **Try it online:** [Open Playground on StackBlitz](https://stackblitz.com/github/HYNCM/gis-engine/tree/main/examples/basic-geojson)

Choose one of these first-run paths:

### Path 1: npm Install (SDK Direct)

Install the SDK and its **required** peer dependency:

```bash
npm install @gis-engine/engine maplibre-gl
```

> `maplibre-gl` is a **required** peer dependency — not optional.
> GIS Engine delegates rendering to MapLibre GL JS, so you **must**
> install it yourself.

Import the MapLibre CSS and create a map:

```typescript
import "maplibre-gl/dist/maplibre-gl.css";
import { createMap } from "@gis-engine/engine";

const map = await createMap(
  document.getElementById("map")!,
  {
    version: "0.1",
    sources: {
      points: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            { type: "Feature", geometry: { type: "Point", coordinates: [0, 0] },
              properties: { name: "Null Island" } }
          ]
        }
      }
    },
    layers: [
      { id: "points-layer", type: "circle", source: "points",
        paint: { "circle-radius": 8, "circle-color": "#3b82f6" } }
    ],
    view: { mode: "map2d", center: [0, 0], zoom: 2 }
  },
  { renderer: "maplibre" }
);
```

### Path 2: CLI Scaffold

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map
cd my-map && open index.html
```

### Path 3: CDN Single HTML

Include the MapLibre CSS and JS before importing the SDK:

```html
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css" />
<script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"></script>
<script type="module">
  import { createMap } from "https://unpkg.com/@gis-engine/engine";
  // ... createMap() call — see docs/quickstart.md for a full example
</script>
```

### 3-Minute Quick Verify

1. `npm install @gis-engine/engine maplibre-gl`
2. `import "maplibre-gl/dist/maplibre-gl.css";`
3. Use the `createMap()` snippet above
4. Open in browser — you should see a world map with a blue dot

**Then layer on AI generation when you need it:**

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map --generate -p mock
```

## Package Overview

```
@gis-engine/cli ──→ @gis-engine/engine (core MapSpec, commands, validation)
     │                    ↑
     └──→ @gis-engine/ai ─┘  (MCP tools, AI orchestration, generation evidence)
```

- **@gis-engine/engine** — Core runtime: `MapSpec` schema, command system, validation, diagnostics, snapshots, and renderer adapters.
- **@gis-engine/ai** — AI layer: MCP tools, generation orchestration, and evidence bundles.
- **@gis-engine/cli** — Developer CLI: project scaffolding and generation workflows.
- **@gis-engine/scene3d** / **@gis-engine/scene3d-three-adapter** — Experimental 3D scene contracts and Three.js adapter scaffold.

## Learn More

- **Package READMEs:** [CLI](packages/cli/README.md) · [Engine](packages/engine/README.md) · [AI](packages/ai/README.md)
- **Documentation:** [Docs site](https://hyncm.github.io/gis-engine/) · [Quick start guide](https://hyncm.github.io/gis-engine/guide/quick-start) · [API reference](https://hyncm.github.io/gis-engine/api/)
- **Examples:** [basic-geojson](examples/basic-geojson) · [raster-basemap](examples/raster-basemap) · [pmtiles-local](examples/pmtiles-local) · [vector-tile-url](examples/vector-tile-url) · [ai-map-edit](examples/ai-map-edit) · [fill-extrusion-lite](examples/fill-extrusion-lite) · [diagnostics-walkthrough](examples/diagnostics-walkthrough) · [snapshot-testing](examples/snapshot-testing) · [mcp-server-setup](examples/mcp-server-setup) · [ai-map-workbench](examples/ai-map-workbench) · [heatmap-density](examples/heatmap-density) · [choropleth-auto](examples/choropleth-auto) · [symbol-labels](examples/symbol-labels) · [expression-showcase](examples/expression-showcase)

---

## Why This Exists

Traditional map SDKs are powerful, but AI agents need a stricter contract:

- A versioned `MapSpec` instead of hidden runtime state.
- Command-only mutation instead of arbitrary JavaScript edits.
- Structured diagnostics instead of plain error strings.
- Snapshot validation to prove the map actually rendered.
- MCP tools that operate on public schemas, not private renderer internals.

AI-native, TypeScript-first map runtime for building, validating, replaying,
snapshotting, and exporting 2D web map applications, with evidence-gated 3D
contract scaffolds.

Core note: `MapSpec` is a generic core + extensions model, not fixed to the
current 2D path. The workbench is a reference implementation, and the
validate -> apply -> snapshot -> export loop is the minimum closed loop, not
the only workflow.

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

For lightweight PMTiles delivery, `createPMTilesRuntimeLoadPlan(spec)` provides
an IO-free preflight for MapLibre vector URL handoff. It checks resource policy,
required `metadata["source-layer"]` values, range-policy requirements, and
optional PMTiles archive metadata budgets before the map reaches runtime.
`createPMTilesQueryEvidence(spec, options)` can also record fixture-only
point/bbox query evidence from caller-supplied decoded features without fetching
resources, parsing PMTiles archives, starting workers, or returning feature
payloads.

## Documentation

- [Documentation map](./docs/README.md)
- [Core framework](./docs/architecture/core-framework.md)
- [Contracts and interfaces](./docs/spec/contracts-and-interfaces.md)
- [Supported feature matrix](./docs/engineering/supported-feature-matrix.md)
- [CI and test strategy](./docs/engineering/ci-test-strategy.md)
- [Release wording guardrails](./docs/engineering/release-wording-guardrails.md)

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

PMTiles support is URL-compatible vector delivery plus SDK load-plan preflight
and caller-supplied fixture query evidence. The engine does not fetch PMTiles
resources, parse PMTiles archives, start PMTiles workers, or provide PMTiles
feature-query runtime semantics.

`fill-extrusion-lite` is an experimental 2.5D contract gated by `capabilities.experimental` and beta-mapped to MapLibre `fill-extrusion`. `@gis-engine/scene3d`, `@gis-engine/scene3d-three-adapter`, `SceneView3DExtensionSchema`, SceneView3D preparation commands, `validateSceneResourceLoadPlan`, `snapshotScene3DMock`, `queryScene3DMock`, and `evaluateScene3DReleaseVisualGate` now exist as the v1 3D contract scaffold, but `view.mode: "scene3d"` is still reserved and returns structured unsupported diagnostics; terrain, glTF, and 3D Tiles are not implemented renderers yet. Note that stable `view.mode: "scene3d"` remains blocked until the future promotion decision gate accepts the complete renderer package.

Generated-app scene browsing is an extension-only delivery signal. It consumes `extensions.scene3d` and stable runtime blocker summaries only; it must not be cited as stable renderer evidence.

## Not Yet

GIS Engine will not attempt to replace Cesium or MapLibre in the current line. It does not ship full 3D Tiles, full WebGPU rendering, complete Mapbox expression compatibility, complete symbol collision/text shaping, GeoParquet analytics, or a full enterprise GIS platform.

Those are staged for later versions after the AI-operable `MapSpec`, command system, diagnostics, snapshot validation, and adapter contracts are stable.

---

## License

[Apache 2.0](LICENSE)
