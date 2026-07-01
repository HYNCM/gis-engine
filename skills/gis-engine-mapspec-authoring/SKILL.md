---
name: gis-engine-mapspec-authoring
description: >
  Author, validate, and fix GIS Engine MapSpec JSON documents. Use when creating
  map configurations from scratch, editing existing map.json files, adding sources
  or layers, or debugging MapSpec validation errors. Covers the full MapSpec v0.1
  schema: version, view, sources, layers, interactions, metadata, extensions, and
  capabilities. Includes valid/invalid examples and the validate-fix-revalidate
  workflow.
metadata:
  author: gis-engine
  version: "1.0"
  package: "@gis-engine/engine"
---

# MapSpec Authoring Guide

MapSpec is the declarative JSON document that fully describes a GIS Engine map.
Every map rendered by GIS Engine starts from a valid MapSpec.

## Quick Reference

| Field | Required | Type | Description |
|---|---|---|---|
| `version` | Yes | `"0.1"` | Schema version. Must be exactly `"0.1"`. |
| `id` | No | `string` | Optional map identifier. |
| `revision` | No | `string` | Optional revision tag for conflict detection. |
| `view` | Yes | `ViewSpec` | Camera position, zoom, bearing, pitch. |
| `sources` | Yes | `Record<string, SourceSpec>` | Named data sources (GeoJSON, raster, PMTiles, vector tiles, etc.). |
| `layers` | Yes | `LayerSpec[]` | Ordered array of visual layers referencing sources. |
| `interactions` | No | `InteractionSpec` | Pan, zoom, hover, click, select, popup toggles. |
| `metadata` | No | `Record<string, unknown>` | Arbitrary key-value metadata. |
| `extensions` | No | `Record<string, unknown>` | Extension namespaces (e.g. `scene3d`). |
| `capabilities` | No | `CapabilityRequest` | Request specific dimensions, renderer, or experimental features. |

## Minimal Valid MapSpec

```json
{
  "version": "0.1",
  "view": { "center": [0, 0], "zoom": 2 },
  "sources": {
    "points": {
      "type": "geojson",
      "data": { "type": "FeatureCollection", "features": [] }
    }
  },
  "layers": [
    {
      "id": "points-layer",
      "type": "circle",
      "source": "points",
      "paint": { "circle-radius": 6, "circle-color": "#3b82f6" }
    }
  ]
}
```

## Field Details

### `view` — Camera and Projection

```json
{
  "view": {
    "mode": "map2d",
    "center": [116.4, 39.9],
    "zoom": 10,
    "bearing": 0,
    "pitch": 0,
    "bounds": [116.0, 39.5, 117.0, 40.5]
  }
}
```

| Sub-field | Type | Constraints |
|---|---|---|
| `mode` | `"map2d" \| "map2_5d" \| "scene3d"` | Optional. `"scene3d"` is currently blocked for stable runtime. |
| `center` | `[longitude, latitude]` | Longitude: [-180, 180], latitude: [-90, 90]. |
| `zoom` | `number` | Typical range 0–22. |
| `bearing` | `number` | Degrees, 0–360. |
| `pitch` | `number` | Degrees, 0–85. |
| `bounds` | `[west, south, east, north]` | west ≤ east, south ≤ north. |

### `sources` — Data Sources

Sources are named entries in a `Record<string, SourceSpec>`. Supported types:

#### GeoJSON

```json
{
  "type": "geojson",
  "data": { "type": "FeatureCollection", "features": [...] }
}
```

`data` can be an inline GeoJSON object or a URL string.

#### Raster Tiles

```json
{
  "type": "raster",
  "tiles": ["https://tile.example.com/{z}/{x}/{y}.png"],
  "tileSize": 256,
  "minzoom": 0,
  "maxzoom": 18,
  "attribution": "© Example"
}
```

#### PMTiles (Cloud-Native)

```json
{
  "type": "pmtiles",
  "url": "https://example.com/data.pmtiles",
  "minzoom": 0,
  "maxzoom": 14,
  "attribution": "© Example"
}
```

#### Vector Tiles

```json
{
  "type": "vector",
  "tiles": ["https://tiles.example.com/{z}/{x}/{y}.pbf"],
  "minzoom": 0,
  "maxzoom": 14
}
```

Or via URL:

```json
{
  "type": "vector",
  "url": "https://tiles.example.com/metadata.json"
}
```

#### FlatGeobuf, GeoParquet, GeoTIFF (Cloud-Native)

```json
{ "type": "flatgeobuf", "url": "https://example.com/data.fgb" }
{ "type": "geoparquet", "url": "https://example.com/data.parquet" }
{ "type": "geotiff", "url": "https://example.com/data.tif" }
```

### `layers` — Visual Layers

Each layer references a source and defines visual styling.

| Sub-field | Required | Type | Description |
|---|---|---|---|
| `id` | Yes | `string` | Unique layer identifier. No duplicates allowed. |
| `type` | Yes | `"background" \| "raster" \| "fill" \| "line" \| "circle" \| "symbol-lite" \| "fill-extrusion-lite"` | Layer rendering type. |
| `source` | Conditional | `string` | Required for all types except `"background"`. Must reference an existing source key. |
| `filter` | No | `Expression` | MapLibre-compatible filter expression. |
| `minzoom` / `maxzoom` | No | `number` (0–24) | Zoom visibility range. `minzoom` must be ≤ `maxzoom`. |
| `paint` | No | `Record<string, unknown>` | Paint properties (colors, radius, opacity). Supports expressions. |
| `layout` | No | `Record<string, unknown>` | Layout properties (visibility, text-field). Supports expressions. |
| `metadata` | No | `Record<string, unknown>` | Layer-level metadata. |

#### Layer–Source Compatibility

| Layer Type | Compatible Source Types |
|---|---|
| `background` | (none required) |
| `raster` | `raster`, `pmtiles` |
| `fill`, `line`, `circle`, `symbol-lite`, `fill-extrusion-lite` | `geojson`, `pmtiles`, `flatgeobuf`, `geoparquet`, `vector` |

### `interactions` — User Interaction Toggles

```json
{
  "interactions": {
    "pan": true,
    "zoom": true,
    "hover": true,
    "click": true,
    "select": false,
    "popup": true
  }
}
```

### `capabilities` — Feature Requests

```json
{
  "capabilities": {
    "dimensions": ["2d", "2_5d"],
    "renderer": "maplibre",
    "experimental": ["fill-extrusion-lite"]
  }
}
```

`fill-extrusion-lite` requires both `dimensions: ["2_5d"]` (or `view.mode: "map2_5d"`) AND `"fill-extrusion-lite"` in `experimental`.

## Common Errors and Fixes

### `SPEC.INVALID_VERSION`

```json
// INVALID
{ "version": "1.0", ... }

// VALID
{ "version": "0.1", ... }
```

### `SPEC.MISSING_FIELD`

`view`, `sources`, and `layers` are required.

```json
// INVALID — missing view
{ "version": "0.1", "sources": {}, "layers": [] }

// VALID
{ "version": "0.1", "view": { "center": [0, 0], "zoom": 2 }, "sources": {}, "layers": [] }
```

### `LAYER.DUPLICATE_ID`

Layer IDs must be unique.

```json
// INVALID
"layers": [
  { "id": "roads", "type": "line", "source": "osm" },
  { "id": "roads", "type": "fill", "source": "buildings" }
]

// VALID — use distinct IDs
"layers": [
  { "id": "roads-line", "type": "line", "source": "osm" },
  { "id": "buildings-fill", "type": "fill", "source": "buildings" }
]
```

### `LAYER.SOURCE_MISSING`

Every non-background layer must reference an existing source.

```json
// INVALID — "parcels" source not defined
"layers": [{ "id": "parcels-fill", "type": "fill", "source": "parcels" }]

// VALID
"sources": { "parcels": { "type": "geojson", "data": "..." } },
"layers": [{ "id": "parcels-fill", "type": "fill", "source": "parcels" }]
```

### `LAYER.SOURCE_INCOMPATIBLE`

A raster layer cannot use a GeoJSON source.

```json
// INVALID
"sources": { "data": { "type": "geojson", "data": {...} } },
"layers": [{ "id": "raster-layer", "type": "raster", "source": "data" }]
```

### `GEO.INVALID_COORDINATES`

Center coordinates out of range.

```json
// INVALID
"view": { "center": [200, 100], "zoom": 5 }

// VALID
"view": { "center": [-73.9, 40.7], "zoom": 5 }
```

## Validation Workflow

### 1. Validate with MCP

```json
// Call validate_spec tool
{
  "spec": { "version": "0.1", "view": {...}, "sources": {...}, "layers": [...] }
}
```

### 2. Validate with CLI

```bash
npx @gis-engine/cli --preflight ./map.json --json
```

### 3. Validate Programmatically

```typescript
import { validateSpec } from "@gis-engine/engine";

const report = validateSpec(mySpec);
if (!report.valid) {
  for (const d of report.diagnostics) {
    console.error(`[${d.code}] ${d.path}: ${d.message}`);
  }
}
```

### 4. Fix and Re-validate

Read diagnostic `code` and `path`, apply the fix, re-run validation.
Repeat until `valid: true` and `diagnostics` is empty.

## Tips

- Always start with `version: "0.1"`.
- Use `view.center` for point maps; use `view.bounds` for area maps.
- Keep layer IDs descriptive: `"roads-line"`, `"buildings-fill"`, not `"layer1"`.
- Use `metadata` to attach application-specific data without affecting rendering.
- PMTiles sources are the recommended path for large vector tile datasets.
- Run `validate_spec` after every edit before handing the spec to a renderer.
