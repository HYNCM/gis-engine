---
agent: builder
period: 2026-06-08
generated_at: 2026-06-08T13:48:14Z
repo_revision: "5ddec91"
inputs:
  - packages/engine/src/sources/pmtiles.ts
  - packages/engine/src/sources/readiness.ts
  - packages/engine/src/renderer/maplibre/transformer.ts
  - tests/fixtures/specs/valid/pmtiles-vector.map.json
  - tests/schema/schema-fixtures.test.ts
  - tests/resources/source-readiness.test.ts
  - tests/adapter/maplibre-transformer.test.ts
  - tests/adapter/maplibre-adapter.contract.test.ts
  - tests/snapshot/smoke/snapshot-smoke.test.ts
owner: "@builder"
decision_level: advisory
---

# PROD-004 PMTiles Runtime Promotion

## Decision

`TASK-2026W24-PROD-004` is closed for the first bounded cloud-native runtime
promotion: PMTiles vector display/load-plan evidence. The accepted behavior is
URL-compatible MapLibre vector display plus IO-free PMTiles runtime load-plan
preflight. PMTiles archive parsing, vector tile decoding, mutation/export
handoff, and feature query remain blocked.

## Accepted Behavior

| Capability | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Public source shape | `tests/fixtures/specs/valid/pmtiles-vector.map.json` and schema fixture test | PMTiles vector archives have a stable MapSpec fixture with `metadata["source-layer"]` | Keep fixture as the release smoke source for future adapter/resource checks | high |
| Load plan | `createPMTilesRuntimeLoadPlan()` and `createSourceReadinessReport()` tests | CI and CLI can prove readiness without fetching, parsing, or starting workers | Require caller-supplied metadata only when a release gate asks for archive budgets | high |
| MapLibre display path | MapLibre transformer and adapter tests | PMTiles maps to a MapLibre vector URL source and forwards source-layer metadata | Keep parser/query work separate from display/load-plan acceptance | high |
| Query boundary | Adapter query test returns `CAPABILITY.UNSUPPORTED` at `/sources/local-parcels/url` | The promotion does not overclaim PMTiles feature query | Keep query promotion under a future deterministic vector tile fixture gate | high |
| Snapshot smoke | PMTiles fixture now participates in snapshot smoke lifecycle | Release smoke covers load/snapshot/export/destroy for PMTiles fixture state | Keep visual snapshot requirements separate if real renderer output changes | high |

## Gate Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm build:schema` on Node 22 wrapper | PASS | Engine, scene3d, and AI schema/build gate passed |
| `pnpm test:schema` on Node 22 wrapper | PASS | 54 schema tests passed, including the PMTiles vector fixture |
| `pnpm test:resources` on Node 22 wrapper | PASS | 13 resource/readiness tests passed |
| `pnpm test:adapter` on Node 22 wrapper | PASS | 51 adapter tests passed, including PMTiles MapLibre display/query boundary |
| `pnpm test:snapshot:smoke` on Node 22 wrapper | PASS | 15 snapshot smoke tests passed, including PMTiles fixture lifecycle |

## Non-Goals

- No PMTiles archive parser.
- No vector tile decoder.
- No hidden range fetch.
- No worker startup.
- No PMTiles feature query.
- No new MCP tool names.
