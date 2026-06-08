# Changelog

## Unreleased

### Added
- **CLI MapSpec preflight mode**: `create-gis-map --preflight <map.json> [--json]` validates a MapSpec and PMTiles runtime load plan without requiring a project name, writing files, fetching resources, or parsing PMTiles archives. Generated `mapspec` and `app` template READMEs include the preflight handoff command.
- **CLI generated delivery review summary**: generated `delivery-summary.json` now includes acceptance state, delivery sections, source-readiness counts and entries, spatial-query readiness, confirmations, and follow-ups so CI and reviewers can inspect delivery status without parsing the full `evidence.json`.
- **CLI generated preflight artifact**: `create-gis-map --generate` now writes `preflight.json` and embeds a compact preflight summary in `delivery-summary.json`, giving generated projects validation, source-readiness, PMTiles load-plan, and diagnostic handoff evidence by default.
- **CLI generated review handoff**: generated projects now include `REVIEW.md`, a human-readable delivery handoff derived from `delivery-summary.json` and `preflight.json` without retaining the raw prompt.
- **CLI generated artifact manifest**: generated projects now include `artifact-manifest.json` with file roles, required-review flags, byte sizes, and sha256 hashes for reproducible CI/reviewer handoff.
- **CLI artifact verification mode**: `create-gis-map --verify-artifacts <project-dir> [--json]` verifies generated artifact-manifest file presence, path safety, byte sizes, and sha256 hashes for CI/reviewer handoff.
- **Generated app artifact links**: the `app` template now turns safe relative `artifact-manifest.json` entries into `Open` links inside the review details panel, making generated evidence files directly inspectable from the app shell.
- **Generated app MapSpec download**: the `app` template now adds a `Download map.json` action that exports the currently loaded MapSpec as local JSON for review or handoff without refreshing the browser.
- **Generated app MapSpec validation**: the `app` template now runs `@gis-engine/engine.validateSpec()` before rendering loaded MapSpecs and surfaces structured diagnostic code/path/message feedback when validation blocks the map.
- **Generated app MapSpec review details**: the `app` template now keeps review details available for scaffold-only projects, including MapSpec validity, diagnostic counts, source/layer counts, and full visible diagnostic entries.
- **Generated app optional evidence fallback**: the `app` template treats HTML fallback responses for missing optional delivery or artifact evidence files as missing evidence instead of JSON errors.
- **Generated app scaffold build cleanup**: the `app` template now keeps the starter `map.json` JSON import build-clean when TypeScript infers tuple-like coordinates as arrays.
- **Generated app validation report download**: the `app` template now downloads `mapspec-validation-report.json` with validity, stats, diagnostic counts, and structured diagnostics from `validateSpec()`.
- **Generated app map reload**: the `app` template now reloads `./map.json` from disk without a browser refresh instead of only re-rendering the in-memory spec.
- **Generated app artifact integrity**: the `app` template now verifies required review artifacts from `artifact-manifest.json` in-browser, including byte counts and `sha256:<hex>` hashes for review handoff files.
- **Generated app artifact manifest panel**: the `app` template now reads optional `artifact-manifest.json` evidence and shows generated file roles, required-review flags, byte counts, and hash references in the review details panel.
- **Generated app review details**: the `app` template now lets generated apps expand `delivery-summary.json` details in-app, including delivery sections, source entries, preflight counts, confirmations, and follow-ups, while keeping the generated MapLibre CSS import order build-clean.
- **Generated app delivery rail**: the `app` template reads optional `delivery-summary.json` evidence at runtime and shows delivery acceptance, preflight, source-readiness, spatial-query, and follow-up signals in the map status banner.
- **PMTiles archive metadata handoff in CLI preflight**: `--require-archive-metadata` and repeatable `--pmtiles-metadata <source-id=path>` let CI require caller-supplied PMTiles archive metadata without hidden fetches or parser claims.
- **Source-readiness preflight report**: `createSourceReadinessReport()` and CLI `sourceReadiness` output summarize supported, readiness-only, and blocked source states for CI/release handoff without fetching resources, parsing archives, or starting workers.
- **PMTiles runtime load-plan preflight**: `PMTilesSourceLoader` and `createPMTilesRuntimeLoadPlan()` validate URL policy, MapLibre `metadata["source-layer"]` requirements, range-policy requirements, and optional archive metadata budgets without fetching or parsing PMTiles archives.
- **Review-console contract** (`examples/ai-map-workbench/review-console.mjs`): pure computation module that derives 6 review sections (delivery-summary, files-and-export, map-edits, data-and-sources, spatial-analysis, scene-browsing) from `GenerationEvidenceBundle` without MCP tool names or `MapSpec` mutation.
- **Review-console tests and fixtures**: 10 tests + 4 delivery-state fixtures (ready, blocked, needs-confirmation, follow-up-required) plus 24 cross-state QA matrix invariants and 11 workbench hardening tests (review actions, durable audit, credential safety).
- **Cloud-native schema/resource-policy contracts**: TypeBox schemas and validation functions for PMTiles archive metadata (`PMTilesArchiveMetadataSchema`, 500 MB limit), GeoParquet source spec (`GeoParquetSourceSchema`, 1 GB / 10 M rows), and FlatGeobuf source spec (`FlatGeobufSourceSchema`, 500 MB / 5 M features). All validation is IO-free and returns structured diagnostics. GeoParquet/FlatGeobuf are accepted as standalone schema/policy contracts only — no public MapSpec source or runtime parser support.
- **Strict visual maintenance tests**: 4 tests covering GeoJSON, MVT, and fill-extrusion-lite scenes as non-blocking evidence-gathering (`tests/snapshot/strict-visual-maintenance.test.ts`).
- **App-template visual test**: 2 tests for the earthquake template exercising snapshot, query, validate, and destroy APIs (`tests/snapshot/app-template-visual.test.ts`).
- **Perf trend ledger harness**: 1k/10k/100k lifecycle timing tests (`tests/perf/perf-trend-ledger.test.ts`); two-week trend data still to be accumulated.
- **`SchemaInvalid` diagnostic code** (`SCHEMA.INVALID`) for cloud-native schema validation failures.

### Changed
- `@gis-engine/engine` now exports cloud-native validation functions (`validatePMTilesArchivePolicy`, `validateGeoParquetPolicy`, `validateFlatGeobufPolicy`), source-readiness report helpers, default policies, and types from the public barrel.
- `@gis-engine/ai` generation evidence, `get_context_summary`, and AI Map Workbench mock fallback now derive source-readiness states from the engine report instead of maintaining parallel PMTiles/GeoJSON/vector/raster readiness logic.
- Workbench server gains `/api/review-console` endpoint returning computed review-console state from the last compact evidence.

## [0.4.0] - 2026-06-04

### Added
- **`--template app`**: Full interactive map application template (Vite + React + Tailwind)
- 5 UI components: LayerPanel, FeaturePopup, Legend, SearchBox, BasemapSwitcher
- Provider system prompt extended with appType inference (`explorer` / `dashboard` / `locator`)
- Generate pipeline renders app template alongside MapSpec evidence output
- Earthquake explorer demo fixture (`tests/fixtures/specs/valid/earthquake-explorer.json`)
- 9 new CLI tests (6 app template + 3 earthquake demo)

### Changed
- CLI version bumped to 0.4.0
- `TEMPLATES` now includes `"app"` as the fourth template option
- Generate pipeline accepts `--template` flag to render app scaffolding with AI-generated MapSpec

## [0.3.0] - 2026-06-04

### Added
- Provider HTTP layer: real OpenAI-compatible API calls from CLI generate pipeline
- `--api-key` flag and `DEEPSEEK_API_KEY`/`OPENAI_API_KEY` env var support
- `--timeout` flag for provider request timeout (default: 20s)
- Confidence sanitization and unsafe intent detection (adapted from workbench)
- CLI-specific system prompt for first-generation (no existing map)
- 20 new provider HTTP tests + 13 provider profile/config tests (total: 93 CLI tests)
- `--yes` / `--force` / `-y` flag to `create-gis-map` to skip directory-exists check and allow overwrite in CI and scripted usage.
- `--model` and `--base-url` flags to `create-gis-map` for configuring OpenAI-compatible provider endpoints, with `GIS_ENGINE_MODEL` and `GIS_ENGINE_BASE_URL` env var support and sensible defaults per provider (`deepseek-chat` / `gpt-4o-mini`).
- Updated `createProviderDiagnostics()` to accept an optional `options` parameter for `model` and `baseUrl`, reporting default-vs-custom usage in diagnostics.
- Cleaned dead `unhandledRejection` workaround from CLI tests — `bin.ts` `isDirectExecution` guard prevents side-effect on barrel import.
- CLI test suite expanded from 39 to 52 tests covering `--yes`, `--model`, `--base-url`, env var priority, and provider model/baseUrl diagnostics.

### Changed
- `hashPrompt()` now produces `sha256:<32-hex>` format (was 16-char truncated hex)
- Generate pipeline resolves intent from provider instead of hardcoded `targetDomains`
- Pipeline step 1 is now "Resolve provider intent" (HTTP call for real providers, deterministic for mock)
- CLI version bumped to 0.3.0

## [0.2.0] - 2026-06-03

- Bumped all publishable packages (`engine`, `ai`, `cli`, `scene3d`) to v0.2.0.
- Added CLI `generate` subcommand (`--generate` / `-g`) that runs the full AI pipeline: prompt hash, provider plan normalization, `planMapGenerationRequest`, command skeleton, `applyCommands`, `validateSpec`, and evidence bundle — outputting `map.json`, `delivery-summary.json`, `evidence.json`, and `diagnostics.json` with no raw prompt retention.
- Added CLI `--prompt` flag and `GIS_ENGINE_PROMPT` env var for passing prompt text to the generate pipeline.
- Added 39 CLI tests covering config parsing, provider diagnostics, template generation, hashPrompt determinism, and no-raw-prompt-retention verification.
- Added comprehensive CLI documentation: quickstart, provider config guide, template guide, generate pipeline reference, and SDK minimal use section.
- Added Phase 3 developer documentation: quickstart guide, migration guide from MapLibre, CDN distribution guide, performance benchmarks, provider configuration guide, and template reference.
- Fixed CLI `bin.ts` side effects: separated pure function exports from entry-point self-invocation to prevent accidental `process.exit` on module import.
- Registered `test:cli` script in root package.json and added it to the `pnpm test` chain.
- Added `@gis-engine/cli` alias to vitest.config.ts for cross-package test imports.
- Added `@gis-engine/cli` package with `create-gis-map` bin, supporting `static-html`, `vite-ts`, and `mapspec` templates for scaffolding GIS Engine map projects.
- Added `maplibre-gl` as optional `peerDependency` (`^5.0.0 || ^6.0.0`) to `@gis-engine/engine`, making the renderer boundary explicit for SDK consumers without bundling MapLibre.
- Added MapLibre v6 prerelease compatibility audit: `6.0.0-11` passes peerDependency range check; GA stays on `^5.24.0` until stable v6 with strict visual evidence.
- Fixed CDN build script to read each package's `exports["."].import` for root ESM entry, added `@gis-engine/scene3d` to CDN coverage, and removed hardcoded `createMap` default for non-engine packages.
- Added hard bundle budgets to CI: engine < 130KB gzipped, cli < 35KB gzipped.
- Standardized `files` whitelist across all published packages (`dist`, `README.md`).
- Extended npm publish workflow to include `@gis-engine/cli` in version bump and publish steps.
- Downgraded Studio/Workbench references in public docs to "reference app", "local review surface", "example" — not hosted product or GA application.
- Updated `contract-freeze.md` with v0.2 GA additions: CLI exports, peerDependency, CDN entry, and frozen MCP tool names.
- Synchronized root `maplibre-gl` devDependency to `^5.0.0 || ^6.0.0` to align with engine peerDependency range.
- Added the SceneView3D v1 preparation surface: `SceneView3DExtensionSchema`, generated JSON schema, schema/type sync assertions, valid/invalid fixtures, scene source URL policy diagnostics, and scene layer-source reference validation.
- Added deterministic SceneView3D preparation commands for camera, scene sources, scene layers, scene layer visibility, dry-run, replay, rollback, and missing-target diagnostics. These commands mutate only `extensions.scene3d`; they do not make `view.mode: "scene3d"` stable.
- Added the `@gis-engine/scene3d` package boundary scaffold with capability reporting, unsupported scaffold diagnostics, README guidance, and dependency guard tests that keep Cesium, Three.js, glTF loaders, 3D Tiles parsers, and WebGPU-only runtime code out of `@gis-engine/engine`.
- Added `validateSceneResourceLoadPlan` for loader-level SceneView3D resource enforcement: 3D Tiles JSON size, model size, texture count/bytes, worker cap, timeout, missing source, and unsupported asset type diagnostics.
- Added mock-level SceneView3D snapshot/query contracts through `snapshotScene3DMock` and `queryScene3DMock`, including pending-resource, blank-scene, missing-layer, hidden-layer, and deterministic pick coverage.
- Added gated SceneView3D context to `get_context_summary` / `explain_spec` output schemas, exposing extension-only 3D source/layer/resource/snapshot/query summaries without enabling stable 3D runtime support.
- Added `evaluateScene3DReleaseVisualGate` and `pnpm test:release:scene3d` to define SceneView3D release visual evidence, coordinator waiver, and deterministic no-bypass rules before a stable renderer exists.
- Added the `@gis-engine/scene3d-three-adapter` W28 spike boundary with deterministic Three.js/3DTilesRendererJS load-plan evaluation, resource-policy validation, and dependency isolation tests; it does not enable stable 3D runtime rendering.
- Added `createScene3DThreeAdapterRuntime` so the adapter spike can keep `load`, `snapshot`, `query`, and `destroy` adapter-local while reusing mock SceneView3D evidence and still refusing stable runtime rendering.
- Added `runScene3DThreeAdapterBrowserRunner` and a Playwright visual spec so a local Chromium fixture can render SceneView3D browser evidence and feed `pnpm test:release:scene3d`.
- Added `createScene3DThreeAdapterRendererEvidence` so future browser/WebGL capture metrics can be converted into release-gate compatible renderer evidence without enabling stable SceneView3D runtime support.
- Added `createScene3DThreeAdapterPromotionEvidenceSummary` so the Three adapter spike can summarize load-plan, resource, runtime, snapshot, query, and renderer visual evidence for promotion-readiness review while keeping stable promotion disabled.
- Added the W23 SceneView3D promotion-readiness package, browser matrix evidence, stable-runtime blocker codes, and no-go gate report while keeping stable `view.mode: "scene3d"` blocked.
- Added the natural-language map app generation evidence loop: `MapGenerationRequestSchema`, `createMapGenerationCommandSkeleton()`, `createGenerationEvidenceBundle()`, prompt evidence scenarios, and docs that keep generation command-only, MCP-tool-compatible, and stable SceneView3D blocked.
- Added the typed natural-language planner boundary: `MapGenerationPromptPlannerInputSchema`, `MapGenerationPromptPlanSchema`, and `planMapGenerationRequest()` accept prompt hashes plus structured intent, reject raw prompt retention by default, and feed the existing command skeleton without adding an MCP tool alias.
- Added generation planner evidence to `GenerationEvidenceBundleSchema`, including planner confidence, prompt/trace provenance, accepted and unsupported intent fields, source prompt hashes, and planner diagnostics.
- Added release wording guardrails and a docs test to keep public generated-app
  wording from claiming stable SceneView3D runtime support, side-effect file
  writes, unsupported source runtime behavior, or advanced geoprocessing
  support.
- Archived the superseded W21 sprint plan and refreshed active documentation to point at completed SceneView3D alpha-gate, adapter-feasibility, release-gate, and Three adapter spike evidence; the remaining follow-up is real renderer visual evidence inside the adapter package.
- Simplified the documentation entry points, replaced the stale review report
  index with a current guide, aligned evolution/process docs with the 5-agent
  model, and documented how to read legacy agent labels in dated evidence.

## 0.2.0-checkpoint - 2026-05-17

- Added generic `vector` source contracts, resource policy validation, MapLibre vector transformation, example fixtures, snapshot smoke coverage, and a real-browser visual snapshot scene backed by generated local MVT.
- Expanded the expression contract and validation coverage for `case`, `match`, `zoom`, `to-number`, and `to-string`.
- Hardened MCP tools with public input/output schemas, strict `CapabilityReportSchema` validation, and v0.2 vector/expression contract coverage.
- Added deterministic command/style behavior coverage for `setPaint`, `setLayout`, `reorderLayer`, rollback, dry-run, and missing `beforeLayerId` diagnostics.
- Defined the `fill-extrusion-lite` experimental 2.5D gate and the reserved `scene3d` unsupported boundary.
- Added v0.2 checkpoint audit and release note draft with `pnpm build:schema`, `pnpm check`, visual snapshot, and strict visual snapshot evidence.

## 0.1.0 - Unreleased

- Created the initial pnpm workspace with `@gis-engine/engine` and `@gis-engine/ai`.
- Added TypeBox schemas, runtime validation, diagnostics, command application, JSON Patch utilities, and renderer adapter contracts.
- Added initial schema, command, patch, runtime, adapter, and AI tool tests.
- Added architecture, engineering, competitive analysis, and review documentation.
