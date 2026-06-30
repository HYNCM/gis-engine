# @gis-engine/engine

## 1.1.0

### Minor Changes

- a34a6f4: Add IO-free PMTiles runtime load-plan preflight with source URL policy checks,
  MapLibre `source-layer` metadata validation, range-policy requirements, and
  optional archive metadata budget diagnostics.
- d2e5bb8: Add an IO-free source-readiness report for MapSpec preflight. The engine now
  exports `createSourceReadinessReport()`, and CLI preflight JSON/text output
  includes `sourceReadiness` with supported, readiness-only, and blocked source
  states without fetching resources, starting workers, or parsing archives.

## Unreleased

### Minor Changes

- Add `PMTilesSourceLoader` and `createPMTilesRuntimeLoadPlan()` for IO-free
  PMTiles preflight. The load plan checks resource policy, MapLibre
  `metadata["source-layer"]` requirements, range-policy requirements, and
  optional archive metadata budgets before runtime without fetching or parsing
  PMTiles archives.

## 1.0.0

### Major Changes

- d69ee5a: v1.0.0 — First stable release of the schema-first AI-native map rendering SDK.

  Public API surface: `MapSpec` schema (TypeBox + Ajv), command system (`applyCommands` with JSON Patch), structured diagnostics, snapshot validation, renderer adapter contract (`MockAdapter` / `MapLibreAdapter`), MCP tools (`validate_spec`, `apply_commands`, `export_spec`, `get_context_summary`, `snapshot_spec`, `explain_spec`, `export_example_app`), and developer CLI (`create-gis-map`).

  Note: `@gis-engine/scene3d` is included in the linked version group but remains an experimental contract scaffold — `view.mode: "scene3d"` is reserved and not a stable runtime mode. `@gis-engine/scene3d-three-adapter` is versioned independently at 0.x.

## 0.5.0

### Minor Changes

- Engineering infrastructure overhaul: introduce Changesets for automated version management, Biome for linting and formatting, husky for Git hooks, knip for dead code detection. Extract duplicated utility functions (toolInputErrorToCode, readString, manualFix, unescapePathSegment) into shared modules. Fix CLI package missing exports field. Add vitest coverage thresholds. Update CI with lint gate and npm provenance.
