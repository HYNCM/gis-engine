# Changelog

## Unreleased

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
- Added hard bundle budgets to CI: engine < 100KB gzipped, cli < 30KB gzipped.
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
