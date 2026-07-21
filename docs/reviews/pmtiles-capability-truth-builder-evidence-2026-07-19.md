---
agent: builder
period: 2026-07-19
generated_at: 2026-07-19T08:10:00Z
repo_revision: "f52a5c56d7640d2ebb442e312451766f52f95501"
inputs:
  - packages/engine/src/sources/pmtiles-loader.ts
  - packages/engine/src/sources/readiness.ts
  - packages/ai/src/tools/contextSummary.ts
  - packages/ai/src/tools/generationEvidence.ts
  - tests/runtime/pmtiles-runtime-capability.test.ts
  - https://github.com/protomaps/PMTiles/blob/main/spec/v3/spec.md
owner: "@builder"
decision_level: advisory
---

# PMTiles Capability Truth Builder Evidence

## Proposed Quality Decision

| Capability | Proposed decision | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Display | Go for URL-compatible MapLibre vector display only | Existing schema/resource-policy/adapter/snapshot path; `PMTILES_CAPABILITY_DECISION.display` | Preserves the accepted display surface without implying archive ownership | `@quality` verifies adapter and resource gates | high |
| Load | No-go for runtime archive load; Go only for IO-free load-plan preflight | PMTiles v3 uses columnar directories, internal compression, offset continuation, and leaf-directory entries; the compatibility loader rejects with `PMTILES.RUNTIME_ARCHIVE_LOAD_BLOCKED` before caller IO | Prevents incorrect archive reads and unbounded resource behavior | Keep blocked until spec-correct fixtures prove metadata, directory traversal, cancellation, byte/range budgets, cache, and resource policy | high |
| Feature query | No-go for runtime archive feature query | Query returns `PMTILES.RUNTIME_FEATURE_QUERY_BLOCKED`, zero features, and zero fetched tiles; fixture query evidence remains caller-supplied and payload-free | Prevents fixture evidence from becoming a runtime product claim | Keep blocked until archive load is accepted and adapter/query gates pass | high |

## Evidence Matrix

| Requirement | Current result | Machine evidence |
| --- | --- | --- |
| Archive metadata | blocked before IO | `loadGates: archive-metadata` |
| Root/leaf directory lookup | blocked before IO | `loadGates: columnar-directory-lookup`, `leaf-directory-traversal` |
| Offset continuation | blocked before IO | `loadGates: offset-continuation` |
| Internal compression | blocked before IO | `loadGates: internal-compression` |
| Cancellation | blocked before IO | `loadGates: cancellation` |
| Byte and range budgets | blocked before IO | `loadGates: byte-budget`, `range-budget` |
| Cache behavior | blocked before IO | `loadGates: cache-behavior` |
| Resource policy | blocked before IO | `loadGates: resource-policy-before-io` |
| Feature-query promotion | blocked until runtime promotion | `featureQueryGates: query-semantics`, `query-diagnostics`, `adapter-boundary`, `payload-free-evidence`, `query-tests`, `docs` |
| Hidden IO | prohibited | fetch/decode spies remain uncalled across the matrix |
| Negative diagnostics | deterministic | archive-load and feature-query blocker codes and paths |

## Verification Request

TDD evidence:

- RED: the first focused run failed 11 tests because the capability decision
  was absent, the loader invoked range IO, and readiness was not blocked.
- RED: the load-method contract run failed three tests because
  `loadHeader()`, `loadDirectory()`, and `initialize()` resolved instead of
  rejecting with a blocker.
- GREEN: `tests/runtime/pmtiles-runtime-capability.test.ts` passes 7 tests,
  including the exact load/feature-query gate inventories and three load-method
  enforcement cases.

Builder verification passed:

- `pnpm build:schema`
- `pnpm test:schema`
- `pnpm test:resources`
- `pnpm test:runtime`
- `pnpm test:adapter`
- `pnpm test:ai`
- `pnpm test:schema-sync`
- `pnpm test:docs`
- `pnpm check` with loopback binding permitted for Workbench integration tests
- `git diff --check`

`@quality` should independently verify this evidence and issue the final HOC-N3
pass/block decision. This builder report does not promote runtime archive load
or runtime feature query and does not update planning state.
