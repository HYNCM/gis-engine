# API Reference

GIS Engine keeps high-level workflows in the Guide and symbol-level truth in
the generated API reference.

## How To Read This Section

- Start with the package overview pages when you need to understand boundaries,
  package intent, or release-stage caveats.
- Use the generated reference pages when you need exact exported types,
  functions, classes, and signatures.
- Keep MCP behavior details in the MCP section; the API reference describes the
  package exports that back those tools.

## Package Map

### `@gis-engine/engine`

- Overview: [/api/engine](/api/engine)
- Generated reference: [/api/reference/engine/](/api/reference/engine/)
- Focus: MapSpec schema, commands, validation, runtime, diagnostics,
  renderer adapters, source readiness, and PMTiles preflight helpers.

### `@gis-engine/ai`

- Overview: [/api/ai](/api/ai)
- Generated reference: [/api/reference/ai/](/api/reference/ai/)
- Focus: MCP server exports, tool schemas, generation evidence, and AI-facing
  orchestration helpers.

### `@gis-engine/cli`

- Overview: [/api/cli](/api/cli)
- Generated reference: [/api/reference/cli/](/api/reference/cli/)
- Focus: CLI modes, programmatic scaffolding/generation helpers, preflight, and
  artifact verification utilities.

### `@gis-engine/scene3d`

- Overview: [/api/scene3d](/api/scene3d)
- Focus: experimental 3D contract boundary; stable runtime remains blocked.

## Notes

- The generated package reference is refreshed by `pnpm docs:api`.
- Guide pages remain the place for tutorials, architecture, and workflows.
- SceneView3D remains experimental; API presence does not change the stable
  runtime gate.
