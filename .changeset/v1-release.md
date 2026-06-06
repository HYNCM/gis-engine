---
"@gis-engine/engine": major
---

v1.0.0 — First stable release of the schema-first AI-native map rendering SDK.

Public API surface: `MapSpec` schema (TypeBox + Ajv), command system (`applyCommands` with JSON Patch), structured diagnostics, snapshot validation, renderer adapter contract (`MockAdapter` / `MapLibreAdapter`), MCP tools (`validate_spec`, `apply_commands`, `export_spec`, `get_context_summary`, `snapshot_spec`, `explain_spec`, `export_example_app`), and developer CLI (`create-gis-map`).

Note: `@gis-engine/scene3d` is included in the linked version group but remains an experimental contract scaffold — `view.mode: "scene3d"` is reserved and not a stable runtime mode. `@gis-engine/scene3d-three-adapter` is versioned independently at 0.x.
