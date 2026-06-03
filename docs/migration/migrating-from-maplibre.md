# Migrating from MapLibre GL JS

GIS Engine wraps MapLibre as a renderer adapter, not a replacement. MapLibre
stays as an optional peerDependency (`^5.0.0 || ^6.0.0`).

## Key Differences

| Concern | MapLibre GL JS | GIS Engine |
|---|---|---|
| State | Imperative API on live instance | Declarative `MapSpec` document |
| Mutation | `addLayer`, `setPaintProperty`, etc. | `applyCommands` transactions |
| Errors | Strings, exceptions | Typed diagnostics: `code`, `path`, `fix` |
| AI integration | Ad-hoc | MCP tools with typed schemas |

## MapSpec vs Style

```typescript
// MapLibre: imperative
const map = new maplibregl.Map({ container: "map", style: { ... } });

// GIS Engine: declarative MapSpec
const map = await createMap(container, {
  version: "0.2", sources: { ... }, layers: [ ... ], view: { ... }
}, { renderer: "maplibre" });
```

## Commands vs Imperative API

```typescript
// MapLibre
map.setPaintProperty("layer", "fill-color", "#ef4444");
// GIS Engine
await applyCommands(map, [{ type: "setPaint", layerId: "layer", paint: { "fill-color": "#ef4444" } }]);
```

## Source Mapping

| MapSpec Source | MapLibre Equivalent |
|---|---|
| `geojson` | `geojson` (inline or URL) |
| `raster` | `raster` (tile URL templates) |
| `vector` | `vector` (`tiles[]` or `url`) |
| `pmtiles` | `vector` (URL transform) |

Layer types: `background`, `raster`, `fill`, `line`, `circle`, `symbol-lite`,
`fill-extrusion-lite` (experimental).

## When to Stay with MapLibre

- Full Mapbox expression compatibility needed
- Custom WebGL layers or terrain rendering required
- Features outside the [supported feature matrix](../engineering/supported-feature-matrix.md)
