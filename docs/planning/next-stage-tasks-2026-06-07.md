---
agent: orchestrator
period: 2026-06-07
generated_at: 2026-06-06T18:32:04Z
repo_revision: "ca461e2"
inputs:
  - docs/reviews/productization-review-2026-06-07.md
  - docs/planning/next-stage-goals-2026-06-06.md
  - docs/planning/monthly-roadmap.md
  - docs/planning/task-burndown.md
  - docs/reviews/w24-quality-acceptance-2026-06-05.md
owner: "@orchestrator"
decision_level: advisory
---

# Next-Stage Tasks: 2026-06-07

## Decision

The next phase is product usability hardening for the SDK+CLI launch surface.
Do not reopen accepted W24 batches. Do not widen the product surface before
release verification, generated-project hygiene, and one bounded source runtime
promotion path are under control.

## Priority Queue

| Rank | ID | Priority | Owner | Scope | Acceptance | Finish Gates |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | TASK-2026W24-PROD-001 | P0 | `@builder`, `@quality` | Release-runner reproducibility | A known runner proves Node 22, pnpm 9.15.0, complete platform binaries, listener permission, and Playwright/Chromium capability before gates run | `pnpm lint`; `pnpm build:schema`; `pnpm check`; `pnpm publish:dry`; `pnpm build:cdn`; `node scripts/doc-generator.mjs links` |
| 1a | TASK-2026W24-PROD-001A | P0 | `@builder`, `@quality` | Version identity + lint gate | Local linked GA package manifests, generated-project dependency expectations, CLI README, CDN docs, and publish workflow release identity are aligned around `1.0.0`; default Biome lint gate passes | `pnpm lint`; `pnpm test:cli`; `pnpm build:schema`; docs link audit |
| 2 | TASK-2026W24-PROD-002 | P0 | `@builder`, `@docs` | Generated-project version hygiene | CLI templates, generate-path evidence, getting-started example, CLI README, and CDN docs reference GA `1.0.0` | `pnpm test:cli`; `pnpm build:schema`; docs link audit; generated-project smoke when runner supports install/build |
| 3 | TASK-2026W24-PROD-003 | P1 | `@docs`, `@orchestrator` | Active docs and planning link hygiene | Active planning docs no longer link to deleted files; archived historical paths are explicitly archived | `node scripts/doc-generator.mjs links`; `pnpm test:docs`; `git diff --check` |
| 4 | TASK-2026W24-PROD-004 | P1 | `@builder`, `@quality`, `@docs` | First cloud-native runtime promotion | One candidate, recommended PMTiles/vector source runtime, gets a caller-controlled SourceLoader contract with diagnostics before IO and no hidden fetch/parser overclaim | `pnpm build:schema`; `pnpm test:resources`; source/runtime tests; adapter/snapshot smoke; docs update |
| 5 | TASK-2026W24-PROD-005 | P1 | `@builder`, `@quality` | SDK+CLI installability smoke | Fresh scaffold and generate outputs install/build against packed or published GA artifacts and run with mock provider | package dry-run or npm pack smoke; CLI tests; template build; browser smoke where available |
| 6 | TASK-2026W24-PROD-006 | P2 | `@product`, `@orchestrator`, `@quality` | AI Map Workbench promotion intake | Hosted/product movement remains No-go unless service owner, auth/storage/export scope, and visual release evidence are approved | promotion-scope update; quality gate; no browser-side secrets |
| 7 | TASK-2026W24-PROD-007 | P2 | `@product` | External signal refresh | npm and official-source evidence is refreshed with checked dates in a network-capable run | updated competitor report and scorecard; no stale-current claims |

## 2026-06-08 Execution Addendum

`TASK-2026W24-PROD-001A` is closed locally by
`docs/reviews/prod-001a-version-identity-lint-gate-2026-06-08.md`. The linked
GA package manifests now align on `1.0.0`, generated-project dependency
expectations remain at `^1.0.0`, and the default Biome lint gate passes. Parent
`TASK-2026W24-PROD-001` remains open for a real release runner because the
current local environment is Node 26 and blocks `127.0.0.1` listeners.

## Phase Order

1. Close release-runner reproducibility.
2. Close generated-project and active-doc hygiene.
3. Run SDK+CLI installability smoke against packed/published artifacts.
4. Promote one cloud-native runtime source candidate.
5. Re-evaluate Workbench/Studio promotion only after the SDK+CLI surface is
   repeatably installable and verifiable.

## Guardrails

- Stable `view.mode: "scene3d"` remains blocked.
- No new MCP tool names.
- No hidden network fetches, workers, or parser claims for cloud-native sources.
- AI Map Workbench stays local/example-scoped until a separate promotion gate.
- External package or competitor claims must cite sources checked in the current
  run; the 2026-06-07 review could not refresh npm due environment limits.
