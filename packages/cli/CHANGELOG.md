# @gis-engine/cli

## Unreleased

### Minor Changes

- Add `create-gis-map --preflight <map.json> [--json]` for CI-friendly
  MapSpec validation and PMTiles runtime load-plan checks without scaffolding,
  file generation, network fetches, or archive parsing. Generated `mapspec`
  and `app` template READMEs now include the preflight handoff command.
- Add `--require-archive-metadata` and repeatable `--pmtiles-metadata
  <source-id=path>` so CI can enforce caller-supplied PMTiles archive metadata
  without hidden fetches or parser claims.

## 1.0.0

### Patch Changes

- Updated dependencies [d69ee5a]
  - @gis-engine/engine@1.0.0
  - @gis-engine/ai@1.0.0

## 0.5.0

### Minor Changes

- Engineering infrastructure overhaul: introduce Changesets for automated version management, Biome for linting and formatting, husky for Git hooks, knip for dead code detection. Extract duplicated utility functions (toolInputErrorToCode, readString, manualFix, unescapePathSegment) into shared modules. Fix CLI package missing exports field. Add vitest coverage thresholds. Update CI with lint gate and npm provenance.

### Patch Changes

- Updated dependencies
  - @gis-engine/engine@0.5.0
  - @gis-engine/ai@0.5.0
