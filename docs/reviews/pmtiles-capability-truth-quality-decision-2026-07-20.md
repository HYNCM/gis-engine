---
agent: quality
period: 2026-07-20
generated_at: 2026-07-20T15:55:54Z
repo_revision: "f52a5c56d7640d2ebb442e312451766f52f95501"
inputs:
  - packages/engine/src/sources/pmtiles-loader.ts
  - packages/engine/src/sources/readiness.ts
  - packages/ai/src/tools/pmtilesCapability.ts
  - packages/ai/src/mcp/server.ts
  - packages/ai/src/tools/exportExampleApp.ts
  - packages/ai/src/tools/generationEvidence.ts
  - packages/cli/src/preflight.ts
  - packages/cli/src/generate.ts
  - tests/runtime/pmtiles-runtime-capability.test.ts
  - tests/resources/source-readiness.test.ts
  - tests/ai/generation-evidence.test.ts
  - tests/ai/mcp-integration.test.ts
  - docs/reviews/pmtiles-capability-truth-builder-evidence-2026-07-19.md
owner: "@quality"
decision_level: blocking
---

# PMTiles Capability Truth Quality Decision

## HOC-N3 Decision

**PASS for the bounded Task 2 capability convergence.** This decision accepts
the display and IO-free load-plan surfaces, keeps runtime archive loading and
runtime feature query blocked, and does not promote a PMTiles parser, worker,
range-IO path, or adapter query implementation.

| Capability | Decision | Enforcement | Confidence |
| --- | --- | --- | --- |
| URL-compatible MapLibre vector display | Go | Existing schema, resource-policy, transformer, adapter, and snapshot evidence | high |
| IO-free caller-metadata load-plan preflight | Go | `createPMTilesRuntimeLoadPlan()` performs no archive IO | high |
| Runtime archive load | No-go | `PMTILES.RUNTIME_ARCHIVE_LOAD_BLOCKED`; compatibility loader load methods reject before calling fetch/decode callbacks | high |
| Runtime archive feature query | No-go | `PMTILES.RUNTIME_FEATURE_QUERY_BLOCKED`; compatibility loader returns zero features and performs no IO | high |

## Re-review Closure

The three prior Important findings are closed:

1. `queryReady` is now always `false` for PMTiles. Fixture evidence is
   represented separately by `fixtureEvidenceReady` and
   `fixtureEvidenceStatus`, and this distinction is propagated through engine
   readiness, MCP context, generated evidence, CLI preflight, generated-app
   summaries, and documentation.
2. A blocked or error-level runtime-loader readiness object now makes the
   parent PMTiles source blocked. The resource readiness suite and runtime
   suite cover both status-based and diagnostic-based blocking.
3. The decision now exposes separate `loadGates` and `featureQueryGates`
   inventories. The inventories include archive format/IO controls, query
   semantics and diagnostics, adapter boundaries, payload-free evidence, tests,
   and documentation. The MCP/export schema is shared through
   `PMTilesCapabilityDecisionSchema` and uses closed enum inventories.

## Verification Evidence

The following commands passed in the current worktree based on the stated
repository revision:

| Gate | Result |
| --- | --- |
| `pnpm build:schema` | PASS |
| `pnpm test:schema-sync` | PASS, 16 tests |
| `pnpm test:resources` | PASS, 23 tests |
| `pnpm test:runtime` | PASS, 18 tests |
| `pnpm test:ai` | PASS, 299 tests |
| `pnpm test:cli` | PASS, 215 tests |
| `pnpm test:docs` | PASS, 34 tests |
| Focused PMTiles/readiness/AI/CLI run | PASS, 74 tests |
| `git diff --check` | PASS |

The focused runtime tests verify rejected load methods, zero-IO query behavior,
stable blocker diagnostics, separate capability gate inventories, and parent
source blocking. Source-readiness tests verify `queryReady: false` alongside
fixture evidence fields and cover runtime-loader error integration. MCP and
generation tests verify the propagated decision and schema-conforming output.

## Follow-up Constraints

| Constraint | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Runtime archive load remains blocked | `PMTilesLoadGateIds`; `PMTILES.RUNTIME_ARCHIVE_LOAD_BLOCKED` tests | Prevents incorrect PMTiles parsing and hidden resource IO | Keep the loader shell fail-closed until every load gate has independent spec-correct evidence | high |
| Runtime feature query remains blocked | `PMTilesFeatureQueryGateIds`; `PMTILES.RUNTIME_FEATURE_QUERY_BLOCKED` tests | Prevents fixture evidence from becoming a runtime query claim | Keep `queryReady` false; use fixture fields only for payload-free review evidence | high |
| Capability schemas must remain synchronized | Shared `PMTilesCapabilityDecisionSchema`; schema-sync and MCP contract tests | Prevents AI/export consumers from receiving drifted decisions | Update engine constants and the shared schema together when a future promotion decision changes | high |

This report is quality evidence only. It does not update planning state or
promote runtime PMTiles loading/query support.
