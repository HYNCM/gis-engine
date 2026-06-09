---
agent: engine-agent
period: 2026-W22
generated_at: 2026-05-30T05:05:17Z
repo_revision: "40655ce798d4bbad5067a4ecafab915c45456392"
inputs:
  - docs/planning/feature-specs/cloud-native-source-readiness.md
  - packages/engine/src/spec/schemas/map-spec.schema.ts
  - packages/engine/src/spec/resource-policy.ts
  - packages/engine/src/renderer/queryGeoJson.ts
  - tests/schema/resource-policy.test.ts
  - tests/resources
owner: "@engine-agent"
decision_level: advisory
---

# Cloud-Native Source Promotion Candidates

This is the `TASK-2026W22-AIN-003` split plan. It does not add source schemas,
runtime loaders, archive readers, workers, or MCP tool aliases. It converts the
readiness matrix into implementation-ready promotion gates so future work can
move one format at a time without overclaiming generated-app support.

## Promotion Rule

A source format may move from `blocked` or `readiness-only` only when all gates
for that row have landed and the generated-app manifest can explain the new
state through `delivery.sourceReadiness`.

| Gate | Required Artifact | Blocking Standard |
| --- | --- | --- |
| Schema | TypeBox source schema plus generated schema sync | Public `MapSpec.sources.*` shape is strict, typed, and Ajv-covered. |
| Resource policy | URL/range/worker/byte/timeout paths and tests | Every external resource path produces allow/deny diagnostics before IO. |
| Diagnostics | Stable diagnostic codes and paths | Unsupported encoding, CRS, metadata, host, size, and query modes are machine-readable. |
| Adapter/runtime | Transformer or loader boundary tests | Renderer dependencies stay adapter-local; core does not import parser libraries. |
| Query/export | Deterministic query/export behavior or explicit blocked state | Generated apps cannot imply feature, raster, or archive support before evidence exists. |
| Docs/examples | README/spec/example-manifest wording | User-facing copy states support level without fetching, parsing, or writing files unexpectedly. |

## Candidate Splits

| Candidate | Current State | Promotion Target | Schema Gate | Resource-Policy Gate | Query / Export Gate | Tests | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PMTiles archive metadata | readiness-only | supported display/export with explicit archive-metadata evidence; query still blocked unless decoded | keep `sources.*.type: "pmtiles"` stable; add optional metadata only after schema review | `/sources/{id}/url`, byte/range budget, archive open timeout, worker budget | manifest may show metadata counts only after deterministic parser evidence; feature query remains blocked | schema sync, resource policy, transformer, manifest evidence, no-fetch negative tests | `@engine-agent`, `@docs-agent` |
| PMTiles feature query | fixture evidence accepted; runtime query follow-up | point/bbox query evidence over caller-supplied decoded vector features | source-layer and feature-id contract before query output | no hidden fetch/range/worker in the fixture gate; runtime tile range allowlist, max tile bytes, timeout, and worker cancellation stay future work | deterministic fixture evidence with source-layer, point/bbox, result caps, empty results, hidden/missing layer/source diagnostics, unsupported source diagnostics, and no feature payload retention | `createPMTilesQueryEvidence()` tests, source-readiness tests, AI generated-app evidence tests, adapter negative query coverage | `@engine-agent`, `@qa-agent` |
| GeoParquet | public `MapSpec` source contract-ready; runtime blocked | read-only vector source readiness, then query if metadata is sufficient | public `SourceSpecSchema` wiring is already present; keep runtime/query blocked until read-only evidence and negative fixtures land | URL/range paths, max bytes, worker budget, optional metadata sidecar | query requires WKB/GeoArrow fixture semantics; export remains file-list only | invalid schema, blocked host, missing CRS, unsupported encoding, bbox metadata, query fixture | `@engine-agent`, `@qa-agent` |
| FlatGeobuf | public `MapSpec` source contract-ready; runtime blocked | streaming vector source readiness | public `SourceSpecSchema` wiring is already present; keep runtime/query blocked until read-only evidence and negative fixtures land | URL/range paths, stream timeout, max bytes | query requires deterministic index/window semantics; export remains file-list only | magic/version checks, missing index, range policy, point/bbox fixtures | `@engine-agent`, `@qa-agent` |
| GeoTIFF | public `MapSpec` source contract-ready; runtime blocked | raster display/export, later sampling | public `SourceSpecSchema` wiring is already present; keep runtime/display/query blocked until raster evidence and negative fixtures land | byte/range paths, tile/window budget, worker budget | sampling/query stays blocked until raster evidence exists; snapshots required for display promotion | no-data diagnostics, CRS/band errors, resource policy, MapLibre rejection, headless query rejection, smoke snapshot before display | `@engine-agent`, `@qa-agent` |
| GeoZarr | blocked | array-store readiness | new `geozarr` source schema with store layout, chunks, CRS/time/band metadata | chunk URL/range policy, max chunks, worker budget, timeout | no query/sampling until deterministic chunk fixtures exist | schema fixtures, chunk policy, missing metadata, worker cancellation, snapshot/query as applicable | `@engine-agent`, `@qa-agent` |

## Required Follow-Up Tasks

| id | Title | Depends On | Exit Evidence |
| --- | --- | --- | --- |
| TASK-2026W22-AIN-003A | PMTiles archive metadata promotion gate | AIN-003 | Schema/resource-policy/manifest tests prove archive metadata is explicit and query remains blocked. |
| TASK-2026W22-AIN-003B | PMTiles feature query promotion gate | AIN-003A | Deterministic vector tile fixtures and query diagnostics prove point/bbox semantics. |
| TASK-2026W22-AIN-003C | GeoParquet runtime/query promotion gate | AIN-003 | Read-only query fixtures, CRS/encoding diagnostics, range policy, runtime blockers, and no-runtime-claim manifest tests. |
| TASK-2026W22-AIN-003D | FlatGeobuf runtime/query promotion gate | AIN-003 | Read-only query fixtures, stream/index diagnostics, resource policy, and deterministic negative fixtures. |
| TASK-2026W22-AIN-003E | GeoTIFF runtime/query promotion gate | AIN-003 | Public contract parity, raster decode/display evidence, band/CRS/no-data diagnostics, resource policy, and snapshot strategy. |
| TASK-2026W22-AIN-003F | GeoZarr array source gate | AIN-003 | Array-store schema, chunk policy, worker budget, and blocked query/sampling diagnostics. |

## 2026-06-08 PMTiles Display/Load-Plan Closure

`TASK-2026W24-PROD-004` closes the first PMTiles promotion slice for
URL-compatible vector display and IO-free runtime load-plan evidence. This
absorbs the display/load-plan portion of `TASK-2026W22-AIN-003A` into current
release evidence.

Remaining PMTiles follow-ups stay separate:

- archive parsing/open behavior;
- vector tile decoding;
- worker and range-request execution;
- runtime feature query beyond caller-supplied decoded fixture evidence;
- mutation/export handoff beyond manifest/source-readiness summaries.

## 2026-06-10 PMTiles Fixture Query Evidence Closure

`TASK-2026W24-PROD-008` closes the narrow PMTiles point/bbox fixture-query
evidence slice. `createPMTilesQueryEvidence()` records caller-supplied decoded
features only, covers source-layer selection, point/bbox cases, result caps,
empty-result semantics, hidden/missing layer diagnostics, missing/unsupported
source diagnostics, and generated-app source-readiness query summaries.

The closure is intentionally not a runtime parser/query promotion:

- no PMTiles archive parsing;
- no hidden fetch, range request, or worker execution;
- no feature payloads returned from generated-app evidence;
- no adapter `queryFeatures()` support for PMTiles;
- no mutation/export handoff beyond review summaries.

## Non-Goals

- No new source type is implemented by this split plan.
- No parser dependency is added to `@gis-engine/engine`.
- No generated app may fetch remote data, parse archives, start workers, or
  write files without a future approved confirmation boundary.
- No public MCP tool name is added.
