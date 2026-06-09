---
agent: builder
period: 2026-06-10
generated_at: 2026-06-09T16:22:47Z
repo_revision: "328b27b"
inputs:
  - https://github.com/HYNCM/gis-engine/issues/7
  - scripts/cli-install-smoke.mjs
  - docs/engineering/ci-test-strategy.md
  - command: pnpm release:verify
  - command: pnpm smoke:cli-install
  - command: pnpm test:cli
  - command: node scripts/doc-generator.mjs links
owner: "@builder"
decision_level: advisory
---

# PROD-009 Post-Release SDK+CLI Consumer Regression

## Decision

`TASK-2026W24-PROD-009` is closed as a post-release consumer regression gate.
The install smoke now asserts that a fresh temporary consumer installs the
packed workspace `1.0.0` package group, can run the installed
`node_modules/.bin/create-gis-map` binary, can scaffold/build Vite output, can
generate with the mock provider, can preflight and verify artifacts, and does
not retain the raw prompt in generated files.

## Findings

| Area | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Fresh install identity | `scripts/cli-install-smoke.mjs` now checks installed package versions for `engine`, `scene3d`, `ai`, and `cli` are workspace `1.0.0` | Prevents accidentally passing with linked or stale dependencies | Keep version assertion in the release smoke | high |
| Installed binary path | Smoke asserts `node_modules/.bin/create-gis-map` exists before scaffold/generate | Verifies the consumer entrypoint users actually run | Preserve installed-bin execution rather than workspace CLI shortcuts | high |
| Generated scaffold pinning | Smoke pins generated scaffold dependencies to the packed tarballs and verifies the pin before install/build | Confirms scaffold works against the candidate package group | Keep this before publish dry-run in `release:verify` | high |
| Artifact and leak safety | Installed CLI runs `--preflight`, `--verify-artifacts`, required-review-file checks, and raw-prompt retention checks | Generated consumer output remains reviewable and prompt-hash-only | Extend the smoke if future generated artifacts are added | high |

## Gate Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm smoke:cli-install` | PASS | Packed install verified workspace `1.0.0` package group, installed bin, Vite scaffold/build, mock generate, preflight, artifact manifest, and raw prompt policy |
| `pnpm test:cli` | PASS | 129 CLI/provider contract tests passed |
| `pnpm release:verify` | PASS | Release preflight, install smoke, CDN dry-run, publish dry-run, and docs link audit passed |
| `node scripts/doc-generator.mjs links` | PASS | Documentation link audit regenerated `docs/reviews/doc-link-audit.md` with no broken links |
| `pnpm check` | PASS | Full deterministic merge gate passed, including build, tests, resources, snapshots, and Studio |

## Non-Goals

- This does not publish new npm artifacts.
- This does not change provider defaults or require real provider credentials.
- This does not promote Studio or AI Map Workbench into hosted/product scope.
