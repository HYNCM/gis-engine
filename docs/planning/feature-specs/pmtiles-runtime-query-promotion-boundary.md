---
agent: product
period: 2026-W25
generated_at: 2026-06-10T05:35:49Z
repo_revision: "0254a8576bfe54b764e68966235b4dc7f84b4aca"
inputs:
  - docs/planning/feature-specs/cloud-native-source-readiness.md
  - docs/planning/feature-specs/cloud-native-source-promotion-candidates.md
  - docs/reviews/prod-004-pmtiles-runtime-promotion-2026-06-08.md
  - docs/reviews/prod-008-pmtiles-query-evidence-2026-06-10.md
  - packages/engine/src/sources/pmtiles-query.ts
  - tests/resources/pmtiles-query-evidence.test.ts
  - https://github.com/HYNCM/gis-engine/issues/12
owner: "@product @quality"
decision_level: advisory
---

# PMTiles Runtime Query Promotion Boundary

## Decision

PMTiles runtime feature query remains **No-go** for W25. The accepted product
state is still bounded to:

- public `sources.*.type: "pmtiles"` schema and resource-policy paths;
- URL-compatible MapLibre display/load-plan evidence;
- IO-free preflight/readiness summaries;
- deterministic fixture query evidence over caller-supplied decoded features;
- generated-app review summaries that do not retain feature payloads.

The fixture query evidence proves the query contract shape, not a runtime
archive parser, range fetcher, worker, or adapter query implementation.

## 2026-07-19 Capability Truth Addendum

The exported experimental loader did not meet the PMTiles v3 directory
contract: the specification uses columnar directory fields, compressed internal
directories, offset continuation semantics, and `runLength = 0` leaf-directory
pointers. The previous implementation interleaved entry fields and did not
decompress or traverse leaf directories. It also lacked accepted cancellation,
byte/range budget, cache, and resource-policy-before-IO evidence.

`PMTILES_CAPABILITY_DECISION` therefore records one enforced state:

| Capability | Decision | Enforcement |
| --- | --- | --- |
| URL-compatible MapLibre vector display | Go | Existing schema, resource-policy, adapter, and snapshot evidence |
| IO-free caller-metadata load-plan preflight | Go | `createPMTilesRuntimeLoadPlan()` performs no archive IO |
| Runtime archive load | No-go | `PMTILES.RUNTIME_ARCHIVE_LOAD_BLOCKED`; compatibility loader load methods reject before IO |
| Runtime archive feature query | No-go | `PMTILES.RUNTIME_FEATURE_QUERY_BLOCKED`; compatibility loader query returns no features and performs no IO |

Source readiness, `get_context_summary`, and generated-app delivery evidence
expose this same decision. Fixture-only query evidence remains review evidence
and does not change the runtime feature-query No-go: PMTiles `queryReady` stays
false, while `fixtureEvidenceReady` and `fixtureEvidenceStatus` identify the
separate payload-free fixture evidence state.

The capability decision exposes separate `loadGates` and `featureQueryGates`
inventories. The load inventory covers archive metadata, columnar directory
lookup, offset continuation, compression, leaf traversal, cancellation,
budgets, cache behavior, and resource policy before IO. The feature-query
inventory covers future query semantics, diagnostics, adapter boundaries,
payload-free evidence, tests, and docs.

## Current Accepted Boundary

| Capability | Status | Evidence | Must Not Claim |
| --- | --- | --- | --- |
| PMTiles source shape | Accepted | `pmtiles-vector.map.json`, schema/resource-policy tests | Archive parser support |
| Display/load-plan | Accepted | `createPMTilesRuntimeLoadPlan()`, MapLibre transform tests, snapshot smoke | Hidden range IO or worker execution |
| Fixture query evidence | Accepted | `createPMTilesQueryEvidence()` and AI delivery tests | Runtime feature query |
| Generated-app evidence | Accepted | source readiness and `queryEvidence` summaries | Feature payload output or mutation/export handoff |

## Future Go Requirements

Any future PMTiles runtime query promotion issue must bring all of these before
@quality can issue a Go decision.

| Gate | Required Evidence | Blocking Diagnostic If Missing |
| --- | --- | --- |
| Loader contract | Explicit archive open/decode API with caller-owned resource access, timeout, byte budget, and cancellation semantics | `PMTILES_QUERY.LOADER_CONTRACT_MISSING` |
| Resource policy | URL/range/worker fields checked in implementation, tests, and docs before IO | `PMTILES_QUERY.RESOURCE_POLICY_MISSING` |
| Query semantics | Point and bbox query rules, layer/source-layer selection, result cap, empty results, stable ordering, and CRS assumptions | `PMTILES_QUERY.SEMANTICS_MISSING` |
| Structured diagnostics | Missing source, missing layer, hidden layer, invalid bbox, unsupported archive, over-budget response, timeout, and worker denial paths | `PMTILES_QUERY.DIAGNOSTICS_MISSING` |
| Adapter boundary | Renderer adapters remain behind `RendererAdapter`; core engine must not import parser or renderer dependencies directly | `PMTILES_QUERY.ADAPTER_BOUNDARY_BROKEN` |
| Evidence shape | Generated-app evidence remains payload-free and records counts, caps, states, and diagnostics only | `PMTILES_QUERY.PAYLOAD_RETENTION` |
| Tests | Schema, resource-policy, runtime negative fixtures, query fixtures, adapter boundary, AI evidence, CLI preflight, and snapshot gates as applicable | `PMTILES_QUERY.TEST_GAP` |
| Docs | Source-readiness docs, CLI preflight docs, release wording, and migration notes aligned with the exact promotion level | `PMTILES_QUERY.DOC_DRIFT` |

## Non-Goals

- No PMTiles archive parsing in the W25 design task.
- No hidden fetch, range request, worker startup, or cache mutation.
- No adapter `queryFeatures()` support for PMTiles.
- No generated-app feature payload retention.
- No mutation/export handoff beyond compact review summaries.
- No new MCP tool names.

## Next Issue Shape

A future implementation issue should be titled as a promotion gate, not a broad
runtime milestone. Recommended title:

`TASK-2026W26-DATA-001: PMTiles runtime query loader contract and negative fixtures`

That task should start with loader/resource-policy and negative fixture tests
before any parser/runtime code is accepted.
