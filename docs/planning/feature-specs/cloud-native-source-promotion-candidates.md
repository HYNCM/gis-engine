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
| PMTiles feature query | readiness-only | point/bbox query over decoded vector tiles | source-layer and feature-id contract before query output | tile range allowlist, max tile bytes, timeout, worker cancellation | deterministic fixture with tile order, source-layer, extent, duplicate id handling | query fixtures, large-result cap, hidden/missing layer diagnostics, AI evidence tests | `@engine-agent`, `@qa-agent` |
| GeoParquet | standalone schema/policy contract-ready; blocked as public `MapSpec` source | read-only vector source readiness, then query if metadata is sufficient | promote standalone `GeoParquetSourceSchema` into public `SourceSpecSchema` only after gate review | URL/range paths, max bytes, worker budget, optional metadata sidecar | no generated `MapSpec` until public schema/resource-policy paths land; query requires WKB/GeoArrow fixture semantics | invalid schema, blocked host, missing CRS, unsupported encoding, bbox metadata, query fixture | `@engine-agent`, `@qa-agent` |
| FlatGeobuf | standalone schema/policy contract-ready; blocked as public `MapSpec` source | streaming vector source readiness | promote standalone `FlatGeobufSourceSchema` into public `SourceSpecSchema` only after gate review | URL/range paths, stream timeout, max bytes | query requires deterministic index/window semantics; export remains file-list only | magic/version checks, missing index, range policy, point/bbox fixtures | `@engine-agent`, `@qa-agent` |
| GeoTIFF | blocked | raster display/export, later sampling | new raster source schema with band, CRS, no-data, bounds metadata | byte/range paths, tile/window budget, worker budget | sampling/query stays blocked until raster evidence exists; snapshots required for display | schema fixtures, no-data diagnostics, CRS/band errors, resource policy, smoke snapshot | `@engine-agent`, `@qa-agent` |
| GeoZarr | blocked | array-store readiness | new `geozarr` source schema with store layout, chunks, CRS/time/band metadata | chunk URL/range policy, max chunks, worker budget, timeout | no query/sampling until deterministic chunk fixtures exist | schema fixtures, chunk policy, missing metadata, worker cancellation, snapshot/query as applicable | `@engine-agent`, `@qa-agent` |

## Required Follow-Up Tasks

| id | Title | Depends On | Exit Evidence |
| --- | --- | --- | --- |
| TASK-2026W22-AIN-003A | PMTiles archive metadata promotion gate | AIN-003 | Schema/resource-policy/manifest tests prove archive metadata is explicit and query remains blocked. |
| TASK-2026W22-AIN-003B | PMTiles feature query promotion gate | AIN-003A | Deterministic vector tile fixtures and query diagnostics prove point/bbox semantics. |
| TASK-2026W22-AIN-003C | GeoParquet public source promotion gate | AIN-003 | Public `MapSpec` schema wiring, CRS/encoding diagnostics, range policy, and no-runtime-claim manifest tests. |
| TASK-2026W22-AIN-003D | FlatGeobuf public source promotion gate | AIN-003 | Public `MapSpec` schema wiring, stream/index diagnostics, resource policy, and deterministic negative fixtures. |
| TASK-2026W22-AIN-003E | GeoTIFF raster source gate | AIN-003 | Raster schema, band/CRS/no-data diagnostics, resource policy, and snapshot strategy. |
| TASK-2026W22-AIN-003F | GeoZarr array source gate | AIN-003 | Array-store schema, chunk policy, worker budget, and blocked query/sampling diagnostics. |

## Non-Goals

- No new source type is implemented by this split plan.
- No parser dependency is added to `@gis-engine/engine`.
- No generated app may fetch remote data, parse archives, start workers, or
  write files without a future approved confirmation boundary.
- No public MCP tool name is added.
