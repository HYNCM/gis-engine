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
- Include review-ready delivery evidence in generated `delivery-summary.json`:
  acceptance state, delivery sections, source-readiness counts and entries,
  spatial-query readiness, confirmations, and follow-ups are now available
  without parsing the full `evidence.json` bundle.
- Write `REVIEW.md` during `create-gis-map --generate` as a human-readable
  handoff derived from `delivery-summary.json` and `preflight.json` without
  retaining the raw prompt.
- Write `artifact-manifest.json` during `create-gis-map --generate` with
  generated file roles, required-review flags, byte sizes, and sha256 hashes for
  reproducible CI/reviewer handoff.
- Add `create-gis-map --verify-artifacts <project-dir> [--json]` to verify
  generated artifact-manifest file presence, path safety, byte sizes, and sha256
  hashes before CI/reviewer handoff.
- Read optional `artifact-manifest.json` in the generated `app` template and
  surface generated file roles, required-review flags, byte counts, and hash
  references in the review details panel.
- Render safe relative `artifact-manifest.json` entries as `Open` links in the
  generated `app` template review details panel so reviewers can inspect
  generated evidence files directly from the app shell.
- Add a `Download map.json` action to the generated `app` template so the
  currently loaded MapSpec can be exported locally for review or handoff without
  refreshing the browser.
- Surface generated delivery evidence in the `app` template status banner when
  `delivery-summary.json` is present, while scaffold-only app projects keep
  running without that optional file. The rail now includes the generated
  preflight status alongside source, spatial-query, and review follow-up
  signals.
- Add an expandable review details panel to the generated `app` template so
  `delivery-summary.json` sections, source entries, preflight counts,
  confirmations, and follow-ups can be inspected without leaving the app, and
  keep the generated MapLibre CSS import before Tailwind directives for a
  build-clean app stylesheet.
- Write `preflight.json` during `--generate` and include a compact preflight
  summary in `delivery-summary.json` so generated projects carry validation,
  source-readiness, PMTiles load-plan, and diagnostic handoff evidence by
  default.

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
