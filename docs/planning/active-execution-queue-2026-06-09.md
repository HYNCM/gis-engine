---
agent: orchestrator
period: 2026-06-09
generated_at: 2026-06-09T16:58:00Z
repo_revision: "7ca08513bada13b127bf22cee101546329c266e7"
inputs:
  - docs/archive/2026-06-10/planning/next-stage-tasks-2026-06-07.md
  - docs/archive/2026-06-10/planning/v1.0-release-sprint.md
  - docs/planning/monthly-roadmap.md
  - docs/reviews/prod-001-release-runner-publish-chain-2026-06-08.md
  - docs/reviews/prod-004-pmtiles-runtime-promotion-2026-06-08.md
  - docs/reviews/prod-005-cli-install-artifact-acceptance-2026-06-09.md
  - docs/reviews/quality-gate-2026-06-04.md
  - docs/planning/feature-specs/ai-map-workbench-promotion-scope.md
  - docs/research/competitor-updates-2026-W24.md
  - docs/reviews/prod-010-ai-map-workbench-promotion-intake-2026-06-10.md
  - docs/reviews/prod-011-external-signal-refresh-2026-06-10.md
  - docs/reviews/quality-waiver-amw-p2-intake-2026-06-10.md
  - command: gh issue list --state all --limit 50
owner: "@orchestrator"
decision_level: advisory
---

# Active Execution Queue: 2026-06-09

## Decision

The 2026-06-07 productization queue is closed for release-runner
reproducibility, generated-project version hygiene, active docs/link hygiene,
PMTiles display/load-plan promotion, SDK+CLI installability smoke, PMTiles
fixture-query promotion, post-release consumer regression, AI Map Workbench
promotion intake, and W25 external signal refresh. AI Map Workbench
product/hosted movement remains No-go.

The active task state now moves to GitHub Issues. Markdown planning files are
evidence snapshots and entry points; GitHub Issues are the canonical open task
state for execution and prioritization.

## Current Baseline

| Area | Current State | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Repository state | `main` is aligned with `origin/main` at `7ca08513bada13b127bf22cee101546329c266e7` before the P2 closure edits | `git status --short --branch`; `git rev-parse HEAD` | Planning can start from a clean synced baseline | Keep future execution on serialized commits | high |
| Remote gates | Latest `CI` and `Agent Daily Cadence` runs on `main` are green for `7ca08513bada13b127bf22cee101546329c266e7` | GitHub Actions runs `27221302108` and `27221302293` on 2026-06-09 | No current remote CI fire to triage before P2 closure | Use remote runs as the release health baseline and recheck after push | high |
| SDK+CLI release spine | GA packages are aligned at `1.0.0`; `scene3d-three-adapter` remains independent `0.2.1` | package manifests; release-runner and install-smoke reviews | v1.0 identity is coherent enough for post-release hardening | Treat older 0.x release-plan rows as historical | high |
| Release verification | Node 22/pnpm 9.15.0 release runner, `pnpm check`, `pnpm publish:dry`, CDN dry-run, and packed CLI smoke have passing evidence | `prod-001-release-runner-publish-chain-2026-06-08.md`; `prod-005-cli-install-artifact-acceptance-2026-06-09.md` | Primary release-runner blockers are closed | Keep `pnpm release:verify` and install smoke in recurring release checks | high |
| PMTiles display/load-plan | URL-compatible MapLibre vector display and IO-free runtime load plan are accepted | `prod-004-pmtiles-runtime-promotion-2026-06-08.md` | First cloud-native runtime slice is closed without parser/query overclaim | Open the next PMTiles query slice separately | high |
| AI Map Workbench | Local/example hardening is accepted; hosted/product promotion remains No-go | `ai-map-workbench-promotion-scope.md` | Reference surface can support SDK+CLI, but is not the first product promise | Keep promotion intake as an issue, not implementation movement | high |
| GitHub Issues | `gh issue list --state open` returned `[#16]` after GeoParquet gate creation | GitHub Issues API via `gh`; `docs/planning/issues-snapshot.md` | Canonical task state now has one open P2 source/runtime issue | Keep future execution in GitHub Issues and regenerate issue snapshot after changes | high |

## Canonical Issue Queue

Issue numbers below are the canonical open task state. Use the task ids as
stable local identifiers in reports and commits.

| Rank | Task ID | GitHub Issue | Priority | Owner | Scope | Exit Condition | Required Gates |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `TASK-2026W24-PROD-008` | [#5](https://github.com/HYNCM/gis-engine/issues/5) | P1 | `@builder`, `@quality`, `@docs` | PMTiles point/bbox feature-query promotion gate | Deterministic PMTiles query fixtures prove source-layer, result-cap, hidden/missing layer, missing source, unsupported source, and empty-result semantics without hidden fetch/parser overclaim | `pnpm build:schema`; `pnpm test:resources`; `pnpm test:adapter`; `pnpm test:ai`; `pnpm test:snapshot:smoke`; docs link audit |
| 2 | `TASK-2026W24-PROD-009` | [#7](https://github.com/HYNCM/gis-engine/issues/7) | P1 | `@builder`, `@quality` | Post-release SDK+CLI consumer regression | Fresh consumer install/generate/build path verifies published or packed `1.0.0` artifacts, mock provider, artifact manifest integrity, no raw prompt retention, docs links, and CDN dry-run | `pnpm release:verify`; `pnpm smoke:cli-install`; `pnpm test:cli`; `node scripts/doc-generator.mjs links` |
| 3 | `TASK-2026W24-PROD-010` | [#4](https://github.com/HYNCM/gis-engine/issues/4) | P2 | `@product`, `@orchestrator`, `@quality` | AI Map Workbench product-promotion intake | Promotion request has named runtime/service owner, route/module boundary, auth/storage/export scope, release-grade visual evidence, resource policy evidence, MCP safety, and rollback plan before any file movement or hosted route | product-promotion checklist; `pnpm test:examples`; visual evidence or quality waiver; no browser-side secrets |
| 4 | `TASK-2026W24-PROD-011` | [#6](https://github.com/HYNCM/gis-engine/issues/6) | P2 | `@product`, `@orchestrator` | External signal refresh for W25 planning | Official/npm evidence is refreshed with checked dates for MapLibre, Mapbox, PMTiles, GeoParquet, FlatGeobuf, GeoTIFF/GeoZarr, MCP contracts, and relevant AI map tooling | dated research report; capability scorecard update; no stale-current claims |

## 2026-06-10 P2 Closure Update

This update closes the remaining P2 queue items as planning/research evidence.
It does not create new product runtime, source parser, hosted workbench, or
renderer promotion scope.

| Task ID | GitHub Issue | Outcome | Evidence | Remaining Boundary |
| --- | --- | --- | --- | --- |
| `TASK-2026W24-PROD-010` | [#4](https://github.com/HYNCM/gis-engine/issues/4) | Closed for product-promotion intake | `docs/planning/feature-specs/ai-map-workbench-promotion-scope.md`; `docs/reviews/prod-010-ai-map-workbench-promotion-intake-2026-06-10.md`; `docs/reviews/quality-waiver-amw-p2-intake-2026-06-10.md` | Product/hosted movement remains No-go until a future Go issue passes owners, auth, durable storage, export, resource-policy, MCP, and release-grade visual gates |
| `TASK-2026W24-PROD-011` | [#6](https://github.com/HYNCM/gis-engine/issues/6) | Closed for W25 external signal refresh | `docs/research/competitor-updates-2026-W24.md`; `docs/research/capability-scorecard.md`; `docs/reviews/prod-011-external-signal-refresh-2026-06-10.md` | No W25 roadmap change; SDK+CLI-first and bounded source-promotion plan stand |

After these issues were closed and before the GeoParquet gate reopened the
queue, `docs/planning/issues-snapshot.md` showed no open P0/P1/P2
productization items.

## 2026-06-11 GeoParquet Gate

The source/runtime queue is reopened with `TASK-2026W26-DATA-002` /
[issue #16](https://github.com/HYNCM/gis-engine/issues/16). The gate stays
contract-first and read-only: no GeoParquet runtime loader/query, hidden fetch,
range requests, or worker startup are approved.

| Task ID | GitHub Issue | Priority | Owner | Scope | Exit Condition | Required Gates |
| --- | --- | --- | --- | --- | --- | --- |
| `TASK-2026W26-DATA-002` | [#16](https://github.com/HYNCM/gis-engine/issues/16) | P2 | `@builder`, `@quality` | GeoParquet runtime/query promotion gate | GeoParquet stays readiness-only; read-only query fixtures and diagnostics prove the promotion boundary | `pnpm build:schema`; `pnpm test:resources`; `pnpm test:adapter`; `pnpm test:ai`; `pnpm test:docs`; `node scripts/doc-generator.mjs links` |

## Closed Productization Items

| Previous Task | Outcome | Evidence |
| --- | --- | --- |
| `TASK-2026W24-PROD-001` | closed | release-runner reproducibility passed under Node 22 wrapper; `pnpm check`, publish dry-run, and CDN dry-run have evidence |
| `TASK-2026W24-PROD-001A` | closed | linked GA package version identity and lint gate aligned around `1.0.0` |
| `TASK-2026W24-PROD-002` | closed | generated-project dependency hygiene aligned to `^1.0.0` and covered by CLI smoke |
| `TASK-2026W24-PROD-003` | closed | active docs/link hygiene passed docs link audit, docs tests, and diff check |
| `TASK-2026W24-PROD-004` | closed for PMTiles display/load-plan only | URL-compatible MapLibre display and IO-free load plan accepted; archive parsing and query remain separate |
| `TASK-2026W24-PROD-005` | closed | packed SDK+CLI installability smoke verifies scaffold, generate, preflight, artifact integrity, and prompt leak safety |
| `TASK-2026W24-PROD-006` | No-go, intake superseded by `TASK-2026W24-PROD-010` closure | hosted/product movement still lacks future Go implementation evidence despite completed intake |
| `TASK-2026W24-PROD-007` | closed for W24 | external signals refreshed on 2026-06-08; W25 needs a fresh dated refresh before changing priorities |
| `TASK-2026W24-PROD-008` | closed | deterministic PMTiles fixture-query evidence covers point/bbox source-layer, caps, unsupported source, missing source, missing layer, and empty result without hidden IO |
| `TASK-2026W24-PROD-009` | closed | post-release consumer regression verifies packed install, generated-app build, prompt leak safety, artifact integrity, docs links, and CDN dry-run |
| `TASK-2026W24-PROD-010` | closed for intake only | product-promotion intake names owners, route/module, auth/storage/export, append-only review semantics, waiver, resource/MCP safety, and rollback; hosted/product movement remains No-go |
| `TASK-2026W24-PROD-011` | closed for W25 planning refresh | external signals refreshed on 2026-06-10; no priority change from current evidence |

## Guardrails

- Keep SDK+CLI first. Studio and AI Map Workbench remain reference/example
  surfaces unless a future product-promotion issue passes its blocking checks.
- Do not add MCP tool names or aliases.
- Do not claim PMTiles archive parsing, vector tile decoding, hidden range IO,
  workers, mutation/export handoff, or feature query until a dedicated issue
  lands evidence and @quality accepts it.
- Do not promote stable `view.mode: "scene3d"`.
- Do not move MapLibre package versions without fresh official evidence and
  strict visual checks.
- Any public schema or source contract change must include TypeBox/Ajv coverage,
  generated schema sync, structured diagnostics, docs, and the path-aware gates.

## Validation Plan

| Change Class | Gate |
| --- | --- |
| Planning-only queue updates | `node scripts/doc-generator.mjs links`; `pnpm test:docs`; `git diff --check`; `node scripts/issues-snapshot.mjs` |
| Issue queue changes | GitHub issue creation/update; regenerated `docs/planning/issues-snapshot.md` |
| PMTiles query implementation | `pnpm build:schema`; `pnpm test:resources`; `pnpm test:adapter`; `pnpm test:ai`; `pnpm test:snapshot:smoke`; docs link audit |
| Release/consumer regression | `pnpm release:verify`; `pnpm smoke:cli-install`; `pnpm test:cli`; docs link audit |
| Workbench promotion intake | product-promotion checklist evidence; no file movement before Go; visual evidence or explicit waiver |
| External signal refresh | current official/npm source URLs and checked dates recorded in research docs |
