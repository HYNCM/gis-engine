# @gis-engine/engine

The engine owns the renderer-neutral `MapSpec`, command, diagnostic, snapshot, and resource-policy contracts.

## Run

```bash
npm install @gis-engine/engine
```

`maplibre-gl` is an optional peer dependency for the MapLibre adapter.

## Signposts

- [Public exports](src/index.ts)
- [MapSpec schema](src/spec/schemas/map-spec.schema.ts)
- [Commands](src/commands)
- [Resource policy](src/spec/resource-policy.ts)
- [Schema tests](../../tests/schema)
- [Command tests](../../tests/commands)
- [Generated API reference](../../docs/website/api/reference/engine)
