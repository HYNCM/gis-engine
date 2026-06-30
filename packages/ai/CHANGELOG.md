# @gis-engine/ai

## 1.2.0

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @gis-engine/engine@1.2.0
  - @gis-engine/scene3d@1.2.0

## 1.1.0

### Minor Changes

- 7631990: Derive `get_context_summary`, generation evidence delivery, and AI Map
  Workbench mock fallback source-readiness states from the engine
  `createSourceReadinessReport()` contract instead of maintaining parallel
  readiness logic in AI surfaces.

### Patch Changes

- Updated dependencies [a34a6f4]
- Updated dependencies [d2e5bb8]
  - @gis-engine/engine@1.1.0
  - @gis-engine/scene3d@1.1.0

## 1.0.0

### Patch Changes

- Updated dependencies [d69ee5a]
  - @gis-engine/engine@1.0.0
  - @gis-engine/scene3d@1.0.0

## 0.5.0

### Minor Changes

- Engineering infrastructure overhaul: introduce Changesets for automated version management, Biome for linting and formatting, husky for Git hooks, knip for dead code detection. Extract duplicated utility functions (toolInputErrorToCode, readString, manualFix, unescapePathSegment) into shared modules. Fix CLI package missing exports field. Add vitest coverage thresholds. Update CI with lint gate and npm provenance.

### Patch Changes

- Updated dependencies
  - @gis-engine/engine@0.5.0
  - @gis-engine/scene3d@0.5.0
