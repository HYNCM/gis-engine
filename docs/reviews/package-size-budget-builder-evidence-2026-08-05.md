---
agent: builder
focus_area: qa
feature: issue-39-package-size-budget-convergence
period: 2026-08-05
generated_at: 2026-08-05T15:31:21Z
repo_revision: "f60452d5eba453f828834590b9ea1d0dc88bb827"
inputs:
  - config/package-size-budgets.json
  - scripts/package-size-policy.mjs
  - scripts/check-package-size.mjs
  - tests/framework/package-size-policy.test.ts
  - .github/workflows/bundle-size.yml
owner: "@builder"
decision_level: advisory
status: ready-for-review
evidence_kind: specialist
---

# Package Size Budget Builder Evidence

## Outcome

Issue #39 now has one structured package-size authority:
`config/package-size-budgets.json`. It replaces the conflicting active-doc
130/35 KB claims, the workflow-only 170/70 KB thresholds, and the previous
`du`-only local command without narrowing the artifact scope.

This report supersedes the first candidate committed at `d2ad409`. That
candidate used a stale shared `dist`, locale-aware ordering, and a build recipe
that did not clear TypeScript incremental state. Its 193998-byte engine
baseline and 194524-byte final measurement are invalid and must not be consumed
as HOC evidence.

The blocking complete-`dist` budgets are 204800 bytes (200 KiB) for engine and
65536 bytes (64 KiB) for CLI. Two detached clean `c176f317` worktrees using the
same recipe independently reproduced the baselines: engine 1,984,108 raw /
193,984 gzip bytes / 210 files and CLI 296,932 raw / 60,730 gzip bytes / 44
files at `2026-08-05T15:23:33Z`. Growth above a baseline by more than 5% is
advisory; crossing a package rule whose `semantics` is `blocking` fails the
command.

## Measurement Contract

`canonical-dist-gzip-v1` recursively accepts only regular files, sorts POSIX
relative paths with UTF-8 `Buffer.compare`, and starts with the magic
`gis-engine-dist-gzip-v1\0`. Each record is framed as
`path\0byteLength\0content\0`, then the complete byte sequence is compressed at
gzip level 9. File modification time, permissions, and host ICU collation are
excluded.

The policy also owns the build recipe. It removes only engine/CLI `dist` and
`.tsbuildinfo`, runs `pnpm build:schema`, then runs `pnpm build`. Clearing the
incremental caches is required: a reproduced negative run that removed only
`dist` caused TypeScript to skip emit and `build:schema` to fail on missing
`dist/scripts/build-schema.js`. Missing directories, non-regular entries,
malformed policy/build recipe fields, failed builds, and blocking overages fail
closed with stable `PACKAGE_SIZE.*` diagnostics.

The CLI emits a machine-readable JSON result on stdout, a Markdown summary on
stderr, and appends the same summary to `GITHUB_STEP_SUMMARY` when invoked with
`--github-summary`.

## TDD Evidence

- RED: `pnpm exec vitest run tests/framework/package-size-policy.test.ts`
  failed before production code existed with `Failed to load url
  ../../scripts/package-size-policy.mjs` and exit 1.
- Intermediate GREEN: core policy, framing, baseline, malformed-policy, and
  missing-dist behaviors passed; three consumer/fixture assertions still
  failed until package script, workflow, active docs, and strict fixture data
  were migrated.
- Final GREEN: the focused suite passes 7/7, including exact policy bytes,
  deterministic metadata-independent framing, advisory versus blocking exit
  behavior, missing-dist failure, workflow/script/docs convergence, and a
  tampered-doc divergence regression.
- Clean-CI review RED: a clean `pnpm build` produced only 200 engine files and
  exposed that the original 193998-byte baseline contained residual schema
  output; locale-aware sorting also depended on ICU. A second RED showed that
  cleaning `dist` without `.tsbuildinfo` suppresses TypeScript emit.
- Clean-CI review GREEN: the policy-owned clean/schema/full-build recipe and
  UTF-8 bytewise ordering reproduce 193984/60730-byte baselines in two detached
  `c176f317` worktrees. The focused suite now passes 8/8.

## Verification

| Command | Result | Evidence |
| --- | --- | --- |
| `pnpm exec vitest run tests/framework/package-size-policy.test.ts` | PASS | 1 file / 8 tests |
| `pnpm size:check` | PASS | authoritative clean/schema/full-build recipe; engine 1,987,192 raw / 194,509 gzip bytes / 210 files; CLI 296,932 / 60,730 / 44; zero blocking failures and warnings |
| `pnpm test:agent-framework` | PASS | 9 files / 69 tests |
| `pnpm test:docs` | PASS | 5 files / 38 tests |
| Biome + Node syntax | PASS | both scripts and the focused test are formatted; both `.mjs` files parse |
| `git diff --check` | PASS | no whitespace errors |

Engine is 525 gzip bytes (+0.27%) above the recorded `c176f317` baseline because
the final branch also contains the subsequent GeoParquet fail-closed source
shape fix. It remains 10291 bytes below the blocking budget and does not cross
the 5% advisory threshold. CLI exactly reproduces its baseline.

## HOC-N2 Evidence Summary

- What changed: one strict JSON policy now owns algorithms, byte budgets,
  semantics, baselines, provenance, and rationale; local and CI gates consume
  one CLI.
- Test coverage: malformed structure, deterministic byte framing, metadata
  exclusion, current measurements, missing dist, blocking/advisory behavior,
  consumer wiring, and tamper detection are covered.
- Resource implications: none. No URL, tile, worker, example resource, host
  allowlist, or resource policy changed.
- MCP implications: none. No tool, descriptor, schema, protocol version,
  structured content, or diagnostic envelope changed.
- Visual implications: none. The diff changes CI policy, Node scripts, tests,
  and documentation; it does not touch renderer, style, snapshot, fixture, or
  browser resource behavior.
- Known limitation: a baseline is historical evidence, not an automatically
  moving allowance. Future accepted artifact changes must either stay within
  budget or update baseline provenance and rationale through review.

## Recommendations

| Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- |
| Local, CI, and active docs consume one JSON authority | Divergent numbers can no longer silently coexist | Keep budget changes coupled to policy tests and rationale | high |
| Canonical bytes exclude archive metadata | Linux/macOS tar headers cannot create false regressions | Retain the framing mutation tests | high |
| Current engine is +0.27% and CLI is unchanged | Final branch remains below both advisory and blocking thresholds | `@quality` should independently rerun focused, framework, docs, and the recipe-owning size gate | high |

HOC-N2 is ready for `@quality`. Planning state remains owned by
`@orchestrator`.
