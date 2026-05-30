---
agent: qa-agent
period: 2026-05-30
generated_at: 2026-05-30T07:51:33Z
repo_revision: "eee15d5"
inputs:
  - packages/ai/src/tools/generationEvidence.ts
  - packages/engine/src/renderer/queryGeoJson.ts
  - tests/ai/generation-evidence.test.ts
  - tests/adapter/query-features.test.ts
  - docs/planning/sprint-2026-W23-spatial-query-hardening.md
owner: "@qa-agent"
decision_level: advisory
---

# SQH-003 Invalid Source Diagnostics

## Summary

`TASK-2026W23-SQH-003` hardens point/bbox query evidence diagnostics for
invalid geometry, missing or hidden layers, missing sources, unsupported
URL/PMTiles/vector sources, and empty query results. The slice stays inside
existing generation evidence and renderer query contracts; it does not add a
public `spatial_query` MCP tool or parse unsupported source formats.

## Findings

| Finding | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Invalid point/bbox diagnostics are stable | `tests/ai/generation-evidence.test.ts` covers `GEO.INVALID_COORDINATES` at `/spatialQueries/cases/0/point` and `GEO.EMPTY_BBOX` at `/spatialQueries/cases/0/bbox`; `tests/adapter/query-features.test.ts` covers one low-level diagnostic per invalid query. | Query evidence no longer mixes precise geometry errors with a generic missing-query error. | Preserve these paths when SQH-004 adds result caps. | high |
| Missing and hidden layer paths are case-local | AI preflight diagnostics now report `LAYER.NOT_FOUND` and hidden-layer `CAPABILITY.UNSUPPORTED` under `/spatialQueries/cases/{i}/layers/{j}`. | Agents can point to the exact query case layer entry instead of parsing renderer paths. | Keep missing/hidden checks before runtime creation. | high |
| Missing source paths are case-local | Tampered-spec evidence now reports `SRC.NOT_FOUND` at `/spatialQueries/cases/{i}/layers/{j}/source`. | Invalid skeleton specs still produce query-specific evidence when a case explicitly targets the bad layer. | Do not relax command replay or validation gates. | high |
| Unsupported source paths remain source-local | URL GeoJSON, PMTiles, and vector source cases keep stable paths under `/spatialQueries/cases/{i}/sources/{sourceId}`. | Unsupported IO/archive/vector behavior is blocked without adding parsers or hidden fetches. | Keep unsupported source work in future source promotion tasks. | high |
| Empty result is blocked evidence | Empty query results now produce `CAPABILITY.UNSUPPORTED` at `/spatialQueries/cases/{i}/result`. | A query case must prove at least one deterministic feature hit before readiness can pass. | SQH-004 can add caps without changing the empty-result blocker. | high |

## Verification

- `pnpm exec vitest run tests/ai/generation-evidence.test.ts` - passed
- `pnpm exec vitest run tests/adapter/query-features.test.ts` - passed
- `pnpm --filter @gis-engine/engine build` - passed
- `pnpm --filter @gis-engine/ai build` - passed
- `pnpm test:commands` - passed
- `pnpm test:ai` - passed
- `pnpm test:adapter` - passed
- `pnpm check` - passed
- `git diff --check` - passed
