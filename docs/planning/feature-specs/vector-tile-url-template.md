---
agent: product-strategist
period: 2026-W21
generated_at: 2026-05-17T15:35:00Z
repo_revision: "acdf28e"
inputs:
  - docs/planning/sprint-2026-W21.md
  - docs/research/competitor-updates-2026-W20.md
  - packages/engine/src/spec/schemas/map-spec.schema.ts
  - packages/engine/src/spec/resource-policy.ts
  - packages/engine/src/renderer/maplibre/transformer.ts
decision_level: advisory
---

# Vector Tile URL Template Contract

## Goal

v0.2 adds a generic `vector` source for MVT-compatible URL templates and style
URLs. This complements PMTiles without making PMTiles the only vector-tile
entry point.

## Source Shape

```json
{
  "type": "vector",
  "tiles": ["./tiles/{z}/{x}/{y}.pbf"],
  "minzoom": 0,
  "maxzoom": 14,
  "attribution": "Local vector tiles"
}
```

or:

```json
{
  "type": "vector",
  "url": "https://localhost:5173/styles/source.json"
}
```

`tiles` and `url` are mutually exclusive in the schema. A layer that uses a
vector source may provide the MapLibre `source-layer` through
`layer.metadata["source-layer"]`.

## Resource Policy

- `tiles[]` and `url` must pass `validateResourcePolicy`.
- Relative URLs remain allowed by default for local and intranet demos.
- Remote hosts must be allowlisted through `ResourcePolicy.allowedHosts`.
- `file://` URLs remain blocked.

## Transformer Contract

- `vector.tiles[]` maps to a MapLibre `vector` source with `tiles`.
- `vector.url` maps to a MapLibre `vector` source with `url`.
- `minzoom`, `maxzoom`, and `attribution` are forwarded when present.
- `layer.metadata["source-layer"]` maps to the MapLibre style layer
  `source-layer` field.

## Non-Goals

- Fetching or parsing MVT tiles inside the core engine.
- Validating remote TileJSON contents.
- GeoParquet or FlatGeobuf reading.
- Full PMTiles binary parsing.

## Acceptance Criteria

- `validateSpec` accepts vector tile source specs.
- Resource policy diagnostics point at `/sources/{id}/tiles/{index}` or
  `/sources/{id}/url`.
- `transformMapSpecToMapLibreStyle` emits a MapLibre vector source.
- `examples/vector-tile-url/map.json` demonstrates URL-template vector sources,
  `source-layer` metadata, and v0.2 expression subset usage.
- `tests/fixtures/specs/valid/vector-tile-url.map.json` is included in schema
  fixture validation.
- Snapshot smoke covers the vector fixture without fetching remote tiles.
- Visual release acceptance renders a generated local MVT through MapLibre and
  validates nonblank canvas pixels.
- `pnpm test:schema`, `pnpm test:adapter`, and `pnpm check` pass.
