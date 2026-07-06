# @gis-engine/engine

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

## 1.3.0

### Minor Changes

- Expand example library with 8 new runnable examples (multi-layer, data-driven styling, interactive popups, PMTiles cloud, diagnostic error fix, AI generation demo, style expressions, capability declaration). Add Agent Skills package with 5 SKILL.md files for AI coding tools. Add AI evaluation suite with 41 test cases.

## 1.2.0

### Minor Changes

- Improve developer experience with runnable examples, diagnostic codes reference, StackBlitz playground links, and enhanced install guidance.

  - Add runnable configs (package.json, index.html, vite) to 6 core examples
  - Create diagnostic codes reference page in docs
  - Add StackBlitz playground links for zero-install trial
  - Improve MapLibre peerDependency install guidance with 3-minute quick verify
  - Sync all documentation version references to v1.1.0

### Patch Changes

- Clean up import ordering in diagnostics-walkthrough example to satisfy lint rules.

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
