---
agent: builder
period: 2026-06-09
generated_at: 2026-06-09T14:23:52Z
repo_revision: "55d7353"
inputs:
  - scripts/cli-install-smoke.mjs
  - packages/cli/README.md
  - docs/engineering/ci-test-strategy.md
  - tests/docs/release-verify-guardrails.test.ts
  - command: pnpm test:cli
  - command: pnpm test:docs
  - command: pnpm smoke:cli-install
owner: "@builder"
decision_level: advisory
---

# PROD-005 CLI Install Artifact Acceptance

## Decision

`TASK-2026W24-PROD-005` is strengthened for the SDK+CLI launch surface. The
packed-install smoke now verifies that an installed `create-gis-map` can
generate a mock AI map bundle, preflight the generated `map.json`, verify every
manifested artifact hash, confirm required review files, and reject raw prompt
retention in generated files.

## Findings

| Area | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Installed CLI generation | `pnpm smoke:cli-install` created `smoke-generate` through the installed binary | Users can exercise the product path without linking the workspace CLI | Keep install smoke ahead of publish dry-run in `release:verify` | high |
| Generated MapSpec preflight | Installed CLI returned `ok: true` and `status: "ready"` for `smoke-generate/map.json` | Release smoke now catches broken generated specs before packaging claims | Keep `--preflight` in the smoke script | high |
| Artifact integrity | Installed CLI returned `status: "verified"` with 7/7 manifested files verified, 0 missing files, and 0 hash mismatches | Review handoff files are reproducible and CI-verifiable | Keep `--verify-artifacts` in the smoke script | high |
| Leak safety | Smoke prompt included private verifier wording and the script checks generated files plus `artifact-manifest.json` for raw prompt retention | The user-facing mock generate path remains prompt-hash-only | Keep raw prompt checks in the install smoke | high |

## Gate Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm test:cli` | PASS | 129 CLI/provider tests passed |
| `pnpm test:docs` | PASS | release verify guardrail now checks the acceptance loop |
| `pnpm smoke:cli-install` | PASS | packed engine, scene3d, AI, and CLI tarballs; installed into a fresh consumer; built Vite scaffold; generated and verified mock bundle |

## Non-Goals

- This does not publish npm packages.
- This does not promote Studio or AI Map Workbench to hosted/product scope.
- This does not change MCP tool names, schema contracts, renderer adapters, or
  resource-policy behavior.
- This does not add a browser visual snapshot requirement; the change is a CLI
  installability and artifact-integrity smoke.
