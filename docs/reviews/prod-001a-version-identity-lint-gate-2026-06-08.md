---
agent: builder
period: 2026-06-08
generated_at: 2026-06-08T04:35:26Z
repo_revision: "64277f8"
inputs:
  - package.json
  - packages/engine/package.json
  - packages/ai/package.json
  - packages/cli/package.json
  - packages/scene3d/package.json
  - packages/cli/src/templates/index.ts
  - packages/cli/README.md
  - biome.json
  - command: pnpm lint
owner: "@builder"
decision_level: advisory
---

# PROD-001A Version Identity And Lint Gate

## Decision

`TASK-2026W24-PROD-001A` closes the local version-identity and lint-gate slice
for the SDK+CLI launch surface. The linked GA package group now uses `1.0.0`
in local package manifests, matching the existing CLI README, generated-project
templates, CDN docs, website release notes, and `v1.0.0` tag direction.

This report does not claim npm registry publish status. Registry and GitHub
Actions verification require a network-capable runner.

## Changes

| Area | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Version identity | `package.json`, `packages/engine/package.json`, `packages/ai/package.json`, `packages/cli/package.json`, `packages/scene3d/package.json` now read `1.0.0` | Local manifests no longer contradict GA docs/templates | Keep generated dependencies at `^1.0.0` and validate publish/install in release runner | high |
| Lint gate | `pnpm lint` passes with default Biome reporter | npm publish workflow can reach schema/check gates instead of stopping at lint diagnostics | Keep non-null assertions out of production and test code | high |
| Test hygiene | Fixture access now uses explicit helper assertions instead of `!`; cloud-native defaults use named constants | Lint compliance preserves fixture failure clarity | Run focused CLI/schema/resource tests after this slice | high |

## Gate Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm lint` | PASS | Biome checked 231 files with no diagnostics |
| `pnpm build:schema` | PASS | engine, scene3d, and AI build/schema scripts now report `1.0.0` |
| `pnpm test:cli` | PASS | 129 CLI tests passed, including generated dependency expectations |
| `pnpm test:docs` | PASS | 3 docs guardrail tests passed |
| `pnpm test:resources` | PASS | 13 resource-policy tests passed |
| `pnpm test:schema` | PASS | 53 schema/resource/cloud-native tests passed |
| `pnpm test:commands` | PASS | 46 command tests passed |
| `pnpm test:runtime` | PASS | 11 runtime tests passed |
| `pnpm test:adapter` | PASS | 49 adapter tests passed |
| `pnpm test:ai` | PASS | 56 AI/MCP tests passed |
| `pnpm build:cdn -- --dry-run` | PASS | CDN builder reports engine, AI, and scene3d at `1.0.0` |
| `node scripts/doc-generator.mjs links` | PASS | Active documentation links complete; regenerated `docs/reviews/doc-link-audit.md` |
| `git diff --check` | PASS | No whitespace errors |
| `node scripts/release-preflight.mjs --skip-browser` | ENV-LIMITED | Local Node is `26.0.0` and sandbox blocks `127.0.0.1` listeners; browser check intentionally skipped |
| `pnpm test:examples` | ENV-LIMITED | Non-listener example tests pass; `tests/examples/ai-map-workbench.test.ts` fails on `listen EPERM 127.0.0.1` |

## Follow-Up Gates

Run before closing the parent release-runner task:

- `pnpm build:schema`
- `pnpm test:cli`
- `pnpm test:docs`
- `pnpm test:resources`
- `node scripts/doc-generator.mjs links`
- `pnpm release:preflight` on Node 22 with localhost listener and Chromium support
- `pnpm check` on the same release runner
- `pnpm publish:dry` with npm registry and cache access

## Non-Goals

- No stable `view.mode: "scene3d"` promotion.
- No new MCP tool names.
- No cloud-native runtime/parser/query claim.
- No claim that npm `latest` currently points at `1.0.0` without a fresh
  registry check.
