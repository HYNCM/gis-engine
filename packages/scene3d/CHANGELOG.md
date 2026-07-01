# @gis-engine/scene3d

## 1.2.0

### Minor Changes

- Rendering and AI generation enhancement:
  - Expression engine: +, -, \*, /, coalesce, exponential/cubic-bezier interpolate
  - String expressions: concat, upcase, downcase
  - New heatmap layer type with heatmap-density expression validation
  - New symbol layer type (full version, symbol-lite retained for backward compatibility)
  - Enhanced generate_spec: choropleth, graduated-circle, multi-layer, 6 themes, 50+ location keywords
  - New MCP tools: inspect_data (GeoJSON data inspection) and edit_spec (natural language spec editing)
  - 4 new runnable examples

### Patch Changes

- Updated dependencies
  - @gis-engine/engine@1.2.0

## 1.1.0

### Patch Changes

- Updated dependencies [a34a6f4]
- Updated dependencies [d2e5bb8]
  - @gis-engine/engine@1.1.0

## 1.0.0

### Patch Changes

- Updated dependencies [d69ee5a]
  - @gis-engine/engine@1.0.0

## 0.5.0

### Minor Changes

- Engineering infrastructure overhaul: introduce Changesets for automated version management, Biome for linting and formatting, husky for Git hooks, knip for dead code detection. Extract duplicated utility functions (toolInputErrorToCode, readString, manualFix, unescapePathSegment) into shared modules. Fix CLI package missing exports field. Add vitest coverage thresholds. Update CI with lint gate and npm provenance.

### Patch Changes

- Updated dependencies
  - @gis-engine/engine@0.5.0
