# @gis-engine/engine

`@gis-engine/engine` is the core runtime package for GIS Engine v1.0.0.

## What Lives Here

- `MapSpec` schema exports and runtime validation
- command-only mutation APIs and JSON Patch helpers
- `createMap`, `MapRuntime`, and renderer adapter registration
- structured diagnostics and resource-policy enforcement
- source-readiness and PMTiles preflight/query-evidence helpers

## Reading Order

1. Use the [Guide quick start](/guide/quick-start) for first-run setup.
2. Use the [engine generated reference](/api/reference/engine/) for exact
   exported signatures and types.
3. Use the Guide and engineering docs for capability boundaries and release
   caveats.

## Key Boundaries

- `maplibre-gl` stays an optional peer dependency.
- PMTiles support in this line covers URL-compatible delivery, load-plan
  preflight, and caller-supplied fixture query evidence; it does not add hidden
  archive parsing or runtime query support.
- Stable `view.mode: "scene3d"` remains blocked and does not move into the
  engine runtime in this sprint.

## Reference

- Generated reference: [/api/reference/engine/](/api/reference/engine/)
