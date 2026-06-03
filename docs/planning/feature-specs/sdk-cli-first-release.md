---
agent: orchestrator
period: 2026-06-03
generated_at: 2026-06-03T07:45:00Z
repo_revision: "27d900a"
inputs:
  - /Users/chengming/Downloads/PLAN.md
  - packages/engine/package.json
  - packages/cli/package.json
  - scripts/build-cdn.mjs
  - .github/workflows/npm-publish.yml
  - .github/workflows/bundle-size.yml
owner: "@orchestrator"
decision_level: advisory
---

# SDK + CLI 首发产品化

## Summary

首发面锁定为 **SDK + CLI**：`@gis-engine/engine`、`@gis-engine/ai`、新增
`@gis-engine/cli` 是主产品；`apps/studio` 与 AI Map Workbench 保持
example/reference，不作为 hosted product 或 GA 应用承诺。

AI provider 策略锁定为 **mock + OpenAI-compatible**。mock 用于确定性演示和测试，
真实 provider 走兼容 OpenAI 接口的 server/CLI 适配层。

## Phase 1 Status

### 1a. MapLibre v6 升级门禁 — Done

- Evidence: `docs/reviews/maplibre-v6-upgrade-gate-2026-06-03.md`
- MapLibre v6 (`6.0.0-11`) is prerelease; GA stays on `^5.24.0`.
- `@gis-engine/engine` adds `maplibre-gl` as optional `peerDependency` (`^5.0.0 || ^6.0.0`).
- v6 compat branch passes peerDependency range check; no runtime change.
- Future stable v6 GA requires: official release, changelog diff, lockfile diff,
  adapter tests, smoke/visual snapshot, release runner.

### 1b. v0.2 公共面冻结 — Done

- Engine/AI exports frozen at current surface.
- MCP 7 tool names frozen: `validate_spec`, `apply_commands`, `export_spec`,
  `get_context_summary`, `snapshot_spec`, `explain_spec`, `export_example_app`.
- No new `generate_map_app` / `spatial_query` MCP alias.
- CHANGELOG updated with Phase 1 changes.
- README updated with CLI quick start and reference app wording.

### 1c. npm publish workflow — Done

- `.github/workflows/npm-publish.yml` updated to include `@gis-engine/cli`.
- Publish order: engine → scene3d → ai → cli.
- `scene3d-three-adapter` excluded from GA publish.

### 1d. CDN 根入口修正 — Done

- `scripts/build-cdn.mjs` reads `exports["."].import` per package.
- `@gis-engine/scene3d` added to CDN coverage.
- Hardcoded `createMap` default export removed for non-engine packages.

### 1e. Bundle 预算 — Done

- `bundle-size.yml` adds hard budgets: engine < 100KB gz, cli < 30KB gz.
- Budget failure blocks CI (exit code 1).

### 1f. Studio/Workbench 文案降级 — Done

- Root README: "reference app", "local review surface", "example".
- Studio README: added "Reference app / local review surface" banner.
- AI Map Workbench README: added "Example / reference app" banner.
- No hosted product, SaaS, or GA application claims.

### 1g. npm 包内容审计 — Done

- All published packages use `files: ["dist", "README.md"]` whitelist.
- CLI adds `"templates"` to files for scaffold templates.
- No tests, fixtures, source-only docs, or Playwright artifacts in npm packages.

## Phase 2-4: CLI 与首发交付 — Done

> **Phase B — Provider HTTP layer** (implemented in v0.3.0): Real OpenAI-compatible
> API calls from the CLI generate pipeline, including `--api-key` / `--timeout` flags,
> confidence sanitization, unsafe intent detection, and provider intent resolution.
> Mock provider remains deterministic; real providers (deepseek, openai) issue HTTP
> calls and feed resolved intent back into the existing command pipeline.

### CLI Package

- bin: `create-gis-map` with two modes: scaffold (default) and generate (`--generate`)
- Templates: `static-html`, `vite-ts`, `mapspec`
- Config priority: flags > env vars > `~/.gis-engine/config.json` > defaults
- Provider: mock (default) + deepseek/openai OpenAI-compatible profiles
- No raw prompt retention: only prompt hash, delivery summary, diagnostics, export evidence

### Generate Pipeline

- `--generate` / `-g` flag activates full AI pipeline
- `--yes` / `--force` / `-y` flag skips directory-exists check for CI/scripted usage
- `--model` and `--base-url` flags for OpenAI-compatible provider configuration
- `--prompt` flag + `GIS_ENGINE_PROMPT` / `GIS_ENGINE_MODEL` / `GIS_ENGINE_BASE_URL` env vars
- `--api-key` flag + `DEEPSEEK_API_KEY` / `OPENAI_API_KEY` env vars (v0.3.0)
- `--timeout` flag for provider request timeout, default 20s (v0.3.0)
- Steps: resolve provider intent (HTTP for real providers, deterministic for mock) → prompt hash → `normalizeWorkbenchProviderPlan()` → `planMapGenerationRequest()` → `createMapGenerationCommandSkeleton()` → `applyCommands()` → `validateSpec()` → `createGenerationEvidenceBundle()`
- Output files: `map.json`, `delivery-summary.json`, `evidence.json`, `diagnostics.json`
- `retainedRawPrompt: false` in delivery summary

### Tests — 93/93 pass

- Config: 38 tests (defaults, flags, short flags, equals form, env vars, combined, --yes, --model, --base-url, --api-key, --timeout)
- Provider diagnostics: 7 tests (mock, known, unknown, case-insensitive, custom model/baseUrl, partial options)
- Provider profile: 13 tests (profile resolution, env var priority, config merging)
- Templates: 10 tests (registry, file generation, content, JSON validity)
- hashPrompt: 4 tests (determinism, sha256 hex format, empty string)
- No raw prompt retention: 2 tests (hash irreversibility, no substring leak)
- Provider HTTP: 20 tests (OpenAI-compatible request/response, timeout, error handling, confidence sanitization)
- Registered as `test:cli` in root package.json and `pnpm test` chain

### Documentation

- CLI README: quickstart, CLI reference, provider config, templates, generate pipeline, SDK minimal use
- All sections derived from actual source code — no fabricated APIs

### Verification Gates — All pass

- `pnpm publish:dry`: 5 packages (engine 105.7KB, scene3d 11.6KB, ai 127.3KB, scene3d-three-adapter 20.2KB, cli 10.8KB)
- `pnpm build:cdn`: 3 CDN bundles (engine, ai, scene3d) + manifest
- `tests/docs` wording guardrails: 2/2 pass
- CLI package size: 11.6KB (well under 30KB gz budget)

## Boundaries

- v0.2 GA does not depend on MapLibre prerelease.
- `scene3d` publishes with v0.2 as experimental package boundary.
- `scene3d-three-adapter` stays internal evidence, not in GA publish.
- Studio/Workbench are not product surfaces.
- No new MCP tool aliases.
- No hosted deployment, auth, database, or product provider admin.
