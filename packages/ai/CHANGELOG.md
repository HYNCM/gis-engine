# @gis-engine/ai

## 1.5.0

### Minor Changes

- ## v1.5.0 — SDK Product Maturity Sprint

  ### Added

  - **CLI lintMapSpec tests**: 20 new tests covering `lintMapSpec()` and `formatLintText()` (lint.test.ts)
  - **Community Template Registry tests**: 35 new tests covering all 8 public APIs (community-templates.test.ts)
  - **generate.ts coverage expansion**: 7 new tests covering dryRun mode, result structure, provider errors, and evidence structure
  - **bin.ts dispatch tests**: 12 new tests covering --help, --version, error paths, and scaffold smoke (bin-dispatch.test.ts)
  - **applyCommands batch performance benchmarks**: 4 new tests for 100/500/1000 command batches and mixed command types
  - **Visual snapshot: data-driven styling**: new Playwright scenario with circle-color match/interpolate expressions
  - **Docs boundary regression tests**: 3 new tests ensuring core+extensions wording and rejecting 2D-only phrasing
  - **v1.4 → v1.5 migration guide**: new `docs/migration/v1.4-to-v1.5.md`

  ### Changed

  - **CI matrix**: added Node 24 to lint and build-test; macOS lint as separate job
  - **Performance budgets tightened**: create 1000ms → 500ms, query 500ms → 200ms, snapshot 500ms → 200ms, destroy 500ms → 200ms, batch replay 2000ms → 1000ms
  - **Example READMEs standardized**: ai-map-edit and fill-extrusion-lite READMEs aligned to Goal/Quick Start/What It Shows/Data/Expected Output/Limits template

  ### Test Coverage

  - CLI tests: 141 → 215 (+74 new tests)
  - Docs tests: 16 → 19 (+3 new tests)
  - Visual snapshot scenarios: 3 → 4 (+data-driven-styling)
  - Main `pnpm test` suite: 979 tests (up from 744)
  - Full `pnpm check`: 1022 tests including 43 Studio server/bundle tests

### Patch Changes

- Updated dependencies
  - @gis-engine/engine@1.5.0
  - @gis-engine/scene3d@1.5.0

## 1.4.0

### Minor Changes

- Rendering and AI generation enhancement:
  - Expression engine: +, -, \*, /, coalesce, exponential/cubic-bezier interpolate
  - String expressions: concat, upcase, downcase
  - New heatmap layer type
  - New symbol layer type (full version, symbol-lite retained for backward compatibility)
  - Enhanced generate_spec: choropleth, graduated-circle, multi-layer, 6 themes, 50+ location keywords
  - Expression validator: heatmap-density, concat, upcase, downcase support
  - 4 new runnable examples: heatmap-density, choropleth-auto, symbol-labels, expression-showcase

### Patch Changes

- Updated dependencies
  - @gis-engine/engine@1.4.0
  - @gis-engine/scene3d@1.4.0

## 1.3.0

### Minor Changes

- Add diff_specs and generate_spec MCP tools. diff_specs compares two MapSpec objects and outputs the command set to transform one into the other. generate_spec creates a MapSpec skeleton from a structured intent description. Both tools include full inputSchema/outputSchema and contract tests (22 new test cases).

### Patch Changes

- Updated dependencies
  - @gis-engine/engine@1.3.0
  - @gis-engine/scene3d@1.3.0

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
