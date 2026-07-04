---
title: "GIS Engine v1.5.0: The Rendering Milestone — From Schema to Screen"
date: 2026-07-04
---

# GIS Engine v1.5.0: The Rendering Milestone — From Schema to Screen

For the past two months, GIS Engine has been a schema validation SDK with a
promise: define your map as data, validate it, mutate it through commands, and
hand it off to AI agents — all before a single pixel renders. The architecture
was solid. The MapSpec contract, the command system, the diagnostic codes, the
MCP tools — they all worked. But there was a gap.

`createMap()` didn't actually create a map.

It returned a validated spec and a stub adapter. You could inspect the result,
export it, even snapshot it — but the snapshot was a JSON fixture, not a PNG.
The renderer adapter contract existed; the implementation didn't.

This release — v1.5.0 — closes that gap. `createMap()` now renders a real,
interactive map through MapLibre GL JS. Snapshots are canvas-captured PNGs.
Style updates go through an incremental diff instead of a full rebuild.
Events flow from the map back to your code. And MCP clients get actual images
when they call `snapshot_spec`.

This is the moment GIS Engine becomes a WebGIS SDK.

## What's New

### Real MapLibre Rendering

`MapLibreAdapter` is no longer a contract stub — it's a working renderer. When
you call `createMap()` with `{ renderer: "maplibre" }`, the adapter translates
your MapSpec sources, layers, and view config into a live MapLibre GL JS
instance. Pan, zoom, rotate, tilt — all native.

```typescript
import "maplibre-gl/dist/maplibre-gl.css";
import { createMap } from "@gis-engine/engine";

const map = await createMap(
  document.getElementById("map")!,
  {
    version: "0.1",
    sources: {
      cities: {
        type: "geojson",
        data: "https://example.com/cities.geojson"
      }
    },
    layers: [{
      id: "city-dots",
      type: "circle",
      source: "cities",
      paint: {
        "circle-radius": 6,
        "circle-color": ["interpolate", ["linear"], ["get", "population"],
          0, "#93c5fd", 1000000, "#1e40af"]
      }
    }],
    view: { mode: "map2d", center: [10, 45], zoom: 3 }
  },
  { renderer: "maplibre" }
);
```

That's it. One function call, one MapSpec, one interactive map.

### Real Snapshots

`snapshotSpec()` used to return a JSON description of what the map *would* look
like. Now it captures the actual canvas and returns a PNG buffer:

```typescript
import { snapshotSpec } from "@gis-engine/engine";

const png = await snapshotSpec(spec, { width: 800, height: 600 });
// png is a real image — write it to disk, embed it in a report, send it to an AI
```

This matters for CI pipelines (visual regression testing), documentation
(auto-generated map screenshots), and AI workflows (visual feedback loops).

### Incremental Patch Updates

When you modify a map — change a paint property, add a layer, update a filter
— the engine now computes a diff between the old and new MapLibre styles and
applies only the changed parts. No full teardown and rebuild.

This is what makes `applyCommands()` feel responsive. A color change is a
single `setPaintProperty` call, not a map recreation. A layer reorder is a
`moveLayer`, not a re-render. The command system already tracked what changed;
now the adapter acts on it.

### Event Bridging & Interaction Control

Maps are interactive. This release adds event bridging from MapLibre back
through the engine:

```typescript
map.on("click", "city-dots", (e) => {
  console.log("Clicked feature:", e.features?.[0]?.properties);
});

map.on("moveend", () => {
  console.log("View:", map.getCenter(), map.getZoom());
});
```

Plus `InteractionSpec` for declarative control over pan, zoom, popup, and
selection behavior — all defined in the MapSpec, not scattered across event
handlers.

### MCP Image Responses

The `snapshot_spec` MCP tool now returns actual PNG images to AI clients. When
an AI agent calls `snapshot_spec`, it gets a base64-encoded image in the
response — not a JSON description of one.

This closes the visual feedback loop: an AI can generate a map, snapshot it,
inspect the result, and iterate — all through MCP, with no custom integration
code.

### Studio Integration

Studio now uses the engine's `MapLibreAdapter` instead of driving MapLibre
directly. The map you see in Studio is rendered through the same pipeline as
`createMap()` in your own application. Schema validation, command application,
and snapshots all flow through the engine.

### Expanded Expression Operators

v1.5.0 significantly expands the expression vocabulary. Four new data-access
operators join the existing set:

- **`feature-state`** — read per-feature state for data-driven styling
- **`geometry-type`** — branch on point/line/polygon geometry
- **`id`** — access the feature id
- **`properties`** — access the full properties object

Combined with the v1.4 expression engine additions — arithmetic (`+`, `-`,
`*`, `/`), `coalesce`, exponential and cubic-bezier interpolation, and string
expressions (`concat`, `upcase`, `downcase`) — you can now express most
MapLibre style logic inside a MapSpec, validated by the engine before the
renderer ever sees it.

### New Layer Types: Heatmap & Symbol

Two new layer types are now first-class citizens:

- **Heatmap** — density visualization with configurable radius, weight, and
  color ramp
- **Symbol** — text and icon labels with collision detection, anchor control,
  and halo styling

Both are schema-validated, command-mutable, and covered by the expression
engine. The existing `symbol-lite` layer type is retained for backward
compatibility.

## Developer Quick Start

The fastest way to see a real map:

```bash
npm install @gis-engine/engine maplibre-gl
```

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
          features: [{
            type: "Feature",
            geometry: { type: "Point", coordinates: [0, 0] },
            properties: { name: "Null Island" }
          }]
        }
      }
    },
    layers: [{
      id: "points-layer",
      type: "circle",
      source: "points",
      paint: { "circle-radius": 8, "circle-color": "#3b82f6" }
    }],
    view: { mode: "map2d", center: [0, 0], zoom: 2 }
  },
  { renderer: "maplibre" }
);
```

Open it in a browser. You'll see a world map with a blue dot at [0, 0]. Pan,
zoom, rotate — it's a real map.

Or scaffold a project:

```bash
npx @gis-engine/cli@latest my-map
cd my-map && open index.html
```

## AI Integration: 9 MCP Tools & Real Images

The rendering milestone makes AI integration tangible, not theoretical.

**Visual feedback for AI agents.** `snapshot_spec` returns real PNG images.
An AI can generate a MapSpec, snapshot it, evaluate the visual result, and
issue refinement commands — a closed authoring loop with no custom code.

**Two new MCP tools** expand what AI agents can do:

- **`inspect_data`** — inspect GeoJSON source data (feature counts, property
  schemas, sample features) without rendering
- **`edit_spec`** — natural-language spec editing ("make the cities red,"
  "add a zoom-based circle radius") translated into typed commands

That brings the total to **9 MCP tools**: `validate_spec`, `apply_commands`,
`export_spec`, `get_context_summary`, `snapshot_spec`, `explain_spec`,
`export_example_app`, `inspect_data`, and `edit_spec`.

**Enhanced `generate_spec`** now supports choropleth, graduated-circle, and
multi-layer compositions with 6 color themes and 50+ location keywords —
giving the AI generation pipeline significantly more range.

**Studio as an AI review surface.** Studio renders through the same adapter
pipeline, so what you see is what the AI sees. The review-console contract
maps evidence bundles to actionable review sections without leaking
implementation details.

## Test Reliability: E2E Coverage & CLI Refactor

Rendering is only useful if it stays working. v1.5.0 adds significant test
infrastructure:

**16 new E2E tests** cover the full pipeline: spec validation → command
application → rendering → snapshot capture → event handling. These exercise
the complete `createMap()` lifecycle in a real browser, catching integration
regressions that unit tests miss.

**CLI test suite refactored** from a monolithic file into 7 focused test
modules — generate, preflight, scaffold, config, templates, artifacts, and
integration — making failures faster to diagnose and easier to extend.

**4 new runnable tutorials** ship alongside the release:

- **[choropleth-auto](https://github.com/HYNCM/gis-engine/tree/main/examples/choropleth-auto)** — automatic choropleth from GeoJSON properties
- **[heatmap-density](https://github.com/HYNCM/gis-engine/tree/main/examples/heatmap-density)** — density visualization with the new heatmap layer
- **[symbol-labels](https://github.com/HYNCM/gis-engine/tree/main/examples/symbol-labels)** — text and icon labels with the symbol layer
- **[expression-showcase](https://github.com/HYNCM/gis-engine/tree/main/examples/expression-showcase)** — expression operator reference with live examples

## What This Means

Before this release, GIS Engine was a strong foundation with a visible gap.
You could define, validate, and mutate map specs — but you couldn't *see* the
map. That limited adoption to developers willing to wire up their own
rendering.

Now the loop is closed:

- **Define** — MapSpec describes the map as data
- **Validate** — structured diagnostics catch errors before rendering
- **Render** — MapLibreAdapter produces a real interactive map
- **Snapshot** — canvas-captured PNGs for testing and AI feedback
- **Mutate** — incremental commands update the map without rebuilds
- **Interact** — events flow back from the map to your code

GIS Engine v1.5.0 is no longer "a schema layer on top of MapLibre." It's a
complete WebGIS SDK with schema-first architecture, AI-native tooling, and
real rendering.

## Honest Caveats

This is the first rendering release, not a finished product:

- **SceneView3D** remains experimental. The Three.js adapter spike exists, but
  stable `view.mode: "scene3d"` is blocked until real renderer evidence passes
  the release gate.
- **Cloud-native sources** (PMTiles, GeoParquet, FlatGeobuf) have schema
  contracts and resource policies, but no runtime parsers yet.
- **Expression coverage** is growing but not complete — some MapLibre
  expressions are validated, others pass through without engine-level checks.
- **Ecosystem maturity** — MapLibre and Mapbox have years of community
  knowledge. We're building ours.

## What's Next

- **SceneView3D evidence gathering** — browser-based Three.js rendering
  evidence to unblock the 3D promotion gate
- **More expression operators** — closing the gap with MapLibre's full
  expression vocabulary
- **Community building** — contribution guidelines for user-submitted MapSpec
  templates and examples
- **Performance benchmarking** — measuring the overhead of the schema + command
  layer against direct MapLibre usage

## Try It

```bash
npm install @gis-engine/engine maplibre-gl
```

Or try it in your browser:
[Open Playground on StackBlitz](https://stackblitz.com/github/HYNCM/gis-engine/tree/main/examples/basic-geojson)

Read the [quickstart guide](/guide/quick-start), explore the
[examples](https://github.com/HYNCM/gis-engine/tree/main/examples), or
[open an issue](https://github.com/HYNCM/gis-engine/issues) if something
doesn't work.

This is the rendering milestone. The schema was always the hard part — now it
has a screen to render on.
