---
agent: builder
period: 2026-06-10
generated_at: 2026-06-09T16:22:47Z
repo_revision: "328b27b"
inputs:
  - https://github.com/HYNCM/gis-engine/issues/5
  - packages/engine/src/sources/pmtiles-query.ts
  - packages/engine/src/sources/readiness.ts
  - packages/ai/src/tools/generationEvidence.ts
  - tests/resources/pmtiles-query-evidence.test.ts
  - tests/resources/source-readiness.test.ts
  - tests/ai/generation-evidence.test.ts
owner: "@builder"
decision_level: advisory
---

# PROD-008 PMTiles Fixture Query Evidence

## Decision

`TASK-2026W24-PROD-008` is closed as a narrow fixture-evidence gate. PMTiles
point/bbox query evidence can now be recorded only when the caller supplies
decoded fixture features. The closure does not add archive parsing, hidden
fetch/range IO, worker execution, adapter `queryFeatures()` support for
PMTiles, or feature payload output in generated-app evidence.

## Findings

| Area | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Fixture query contract | `createPMTilesQueryEvidence()` records source-layer, point/bbox, result caps, empty results, and diagnostic counts | Reviewers can accept PMTiles query evidence without implying runtime parser support | Keep runtime parser/query promotion as a separate future gate | high |
| Blocked diagnostics | Resource tests cover hidden layer, missing layer, missing source, unsupported source, and missing `metadata["source-layer"]` paths | Query promotion failures remain machine-readable | Keep diagnostic paths stable when adding runtime decode support | high |
| Generated-app handoff | `createGenerationEvidenceBundle()` accepts explicit `pmtilesQueryEvidence` and emits source `queryEvidence` summaries without fixture payloads | Source-readiness can explain query-ready evidence, blocked cases, and follow-up runtime work | Keep generated-app evidence payload-free | high |
| Runtime boundary | Existing adapter query path still treats PMTiles as unsupported; fixture evidence has requirements `archiveParsing=false`, `hiddenFetch=false`, `worker=false` | Prevents broad PMTiles runtime support overclaim | Add adapter/runtime query only through a future parser/decode gate | high |

## Gate Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm test:resources -- --run tests/resources/pmtiles-query-evidence.test.ts tests/resources/source-readiness.test.ts` | PASS | PMTiles fixture evidence and source-readiness tests passed with existing resource tests |
| `pnpm test:ai -- --run tests/ai/generation-evidence.test.ts` | PASS | Generated-app delivery accepts explicit PMTiles query evidence and rejects payload retention |
| `pnpm build:schema` | PASS | Engine/scene3d/AI schema builds completed after adding `QUERY.EMPTY_RESULT` |

## Remaining Follow-Ups

- PMTiles archive parser/open behavior remains future work.
- PMTiles runtime feature query over decoded vector tiles remains future work.
- PMTiles worker/range-request execution remains future work.
- PMTiles mutation/export handoff beyond review summaries remains future work.
