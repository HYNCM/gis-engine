---
agent: engine-agent
period: 2026-05-29
generated_at: 2026-05-29T09:34:00Z
repo_revision: "74a30a8af2898263d20553ceac0b7eb9204c7b30"
inputs:
  - docs/research/competitor-updates-2026-W22.md
  - docs/research/capability-scorecard.md
  - packages/engine/src/spec/schemas/map-spec.schema.ts
  - packages/engine/src/spec/resource-policy.ts
  - packages/engine/src/renderer/maplibre/transformer.ts
  - tests/schema/resource-policy.test.ts
owner: "@engine-agent"
decision_level: advisory
---

# Cloud-Native Source Readiness Matrix

This matrix is a readiness contract for generated map applications. It does not
add new public `MapSpec` source types or archive parsers. The goal is to make
AI planning honest about which portable data sources are supported now, which
have IO-free load-plan preflight, which are standalone schema/policy contracts
only, and which must stay blocked until diagnostics, resource policy, adapter
boundaries, and tests exist.

## Readiness States

| State | Meaning | Required evidence before AI may claim support |
| --- | --- | --- |
| supported | The source type is accepted by `MapSpecSchema`, passes resource policy, has adapter transform/runtime coverage, and is represented by examples or tests. | schema tests, resource-policy tests, adapter transform/query/snapshot evidence when relevant |
| readiness-only | The source path can appear in planning, export notes, or metadata, but runtime parsing/query semantics are not implemented. | explicit notes, blocked diagnostics for unsupported runtime behavior, no user-facing implementation claim |
| blocked | The source type is not part of the public schema or would require a new loader/worker/query contract. | stable diagnostic path, future contract owner, no generated `MapSpec` output using this type |

## Source Matrix

| Format | Current state | Accepted `MapSpec` shape | Resource policy | Query readiness | Export / manifest behavior | Blocked diagnostics and next contract |
| --- | --- | --- | --- | --- | --- | --- |
| Inline GeoJSON | supported | `sources.*.type: "geojson"` with object `data` | no URL policy needed | point/bbox readiness through headless inline GeoJSON query cases | may be included in generated evidence and example manifests by file path/count only | large-data paging, CRS transforms, and server-side analysis remain future work |
| URL GeoJSON | supported for display/export, readiness-only for headless query | `sources.*.type: "geojson"` with string `data` | relative, `pmtiles:`, localhost, or allowlisted `http(s)` via `/sources/{id}/data` | headless query returns `CAPABILITY.UNSUPPORTED` at `/sources/{id}/data` until data is inlined or a fetch/cache contract exists | manifests may list the URL-bearing spec but must not fetch the URL | future loader contract must define fetch, cache, size, CRS, and error diagnostics |
| Raster tiles | supported for display/export | `sources.*.type: "raster"` with `tiles[]` | checked per tile at `/sources/{id}/tiles/{index}` | no feature query support | manifests may list raster examples without fetching tiles | analysis, sampling, GeoTIFF, and raster array operations remain blocked |
| Vector tile URL | supported for display/export | `sources.*.type: "vector"` with `tiles[]` or `url` | checked at `/sources/{id}/tiles/{index}` or `/sources/{id}/url` | no feature query support in headless evidence | manifests may list vector URL examples; source-layer metadata remains layer metadata | future query support needs tile decode, source-layer, feature id, extent, and ordering semantics |
| PMTiles | supported as URL-compatible vector source evidence with IO-free load-plan preflight; readiness-only for archive parsing | `sources.*.type: "pmtiles"` with `url`; MapLibre vector layers must declare `metadata["source-layer"]` | relative, localhost, allowlisted `http(s)`, or `pmtiles:` via `/sources/{id}/url`; `createPMTilesRuntimeLoadPlan()` also checks range-policy requirements and optional archive metadata budgets | no PMTiles feature query or archive mutation support | `pmtiles-local` manifest stays file-list only; context, CLI preflight, and delivery evidence may include `runtimeLoadPlan` and `sourceReadiness` summaries without fetching resources | future contract must define archive parsing/open behavior, tilejson, mutation/export handoff, and query semantics |
| GeoParquet | schema/policy contract-ready; blocked as a public `MapSpec` source | standalone `GeoParquetSourceSchema`; not included in public `SourceSpecSchema` or `MapSpecSchema` | `validateGeoParquetPolicy()` validates metadata budgets and returns runtime-blocked diagnostics without IO; public MapSpec resource policy has no GeoParquet URL path yet | no query/runtime support; `bbox` metadata may inform future planning only | manifests must not claim GeoParquet source support | promotion gate must wire schema into `MapSpec`, add public resource-policy paths, adapter/runtime blockers, and read-only query tests |
| FlatGeobuf | schema/policy contract-ready; blocked as a public `MapSpec` source | standalone `FlatGeobufSourceSchema`; not included in public `SourceSpecSchema` or `MapSpecSchema` | `validateFlatGeobufPolicy()` validates metadata budgets/index constraints and returns runtime-blocked diagnostics without IO; public MapSpec resource policy has no FlatGeobuf URL path yet | no query/runtime support | manifests must not claim FlatGeobuf source support | promotion gate must wire schema into `MapSpec`, add public resource-policy paths, streaming/index diagnostics, and deterministic fixtures |
| GeoTIFF | blocked | no public `SourceSpec` type | no URL path is accepted until schema exists | no raster query/sampling support | manifests must not claim GeoTIFF source support | add raster source schema, byte/range policy, band/CRS/no-data diagnostics, and snapshot tests |
| GeoZarr | blocked | no public `SourceSpec` type | no URL path is accepted until schema exists | no array query/sampling support | manifests must not claim GeoZarr source support | add array-store schema, chunk/range policy, CRS/time/band diagnostics, worker budgets, and snapshot/query fixtures |

## Review-Console Card Mapping

`docs/planning/feature-specs/generated-app-review-console.md` should surface
the matrix above as `Data and sources` cards. The cards are review evidence
only: they do not add MCP tool names, promote stable SceneView3D behavior, or
introduce resource fetches, parsers, decoders, archive readers, or workers.

| Format | Card state in Generated App Review Console | Card details | Delivery impact |
| --- | --- | --- | --- |
| PMTiles | `supported` for URL-compatible display/export evidence and load-plan preflight; `readiness-only` for archive parsing, mutation/export handoff, and feature query. | Show `sources.*.type: "pmtiles"`, `/sources/{id}/url` resource-policy evidence, `runtimeLoadPlan` status, `sourceReadiness` state, required `metadata["source-layer"]`, optional archive metadata budget checks, transformer warning, and explicit "no archive parser/query runtime" evidence. | May pass the source section for display/export when load-plan status is not `blocked`; PMTiles archive or query requests become `follow-up-required` or `needs-confirmation` and must not be accepted as implemented behavior. |
| URL GeoJSON | `supported` for display/export; `readiness-only` for headless feature query when `data` is a URL string. | Show `sources.*.type: "geojson"`, `/sources/{id}/data` policy result, manifest note that export does not fetch, and `CAPABILITY.UNSUPPORTED` query evidence for URL-backed headless cases. | Display/export evidence can be accepted; URL-backed query requests require inline data or a future fetch/cache contract before the app can be fully ready. |
| GeoParquet | `blocked`. | Show blocked source intent only, no generated `SourceSpec`, standalone schema/policy evidence when relevant, and follow-up requirements for public MapSpec wiring, CRS metadata, WKB/GeoArrow diagnostics, bbox metadata, range/worker policy, and query tests. | Blocks delivery if requested as an implemented source. |
| FlatGeobuf | `blocked`. | Show blocked source intent only, no generated `SourceSpec`, standalone schema/policy evidence when relevant, and follow-up requirements for public MapSpec wiring, magic/version checks, index/range semantics, streaming diagnostics, and deterministic fixtures. | Blocks delivery if requested as an implemented source. |
| GeoTIFF | `blocked`. | Show blocked source intent only, no generated `SourceSpec`, and follow-up requirements for raster schema, byte/range policy, band/CRS/no-data diagnostics, sampling, and snapshot tests. | Blocks delivery if requested as an implemented source. |
| GeoZarr | `blocked`. | Show blocked source intent only, no generated `SourceSpec`, and follow-up requirements for array-store schema, chunk/range policy, CRS/time/band diagnostics, worker budgets, and query/snapshot fixtures. | Blocks delivery if requested as an implemented source. |

## Generated-App Rules

- AI generation may emit `geojson`, `raster`, `vector`, and `pmtiles` only
  through the existing `MapGenerationRequestSchema` and command skeleton path.
- GeoParquet and FlatGeobuf may be represented as standalone schema/policy
  contract evidence, but they must remain blocked as generated `MapSpec`
  sources until a promotion gate wires them into public `SourceSpecSchema`,
  resource-policy paths, adapter/runtime blockers, docs, and tests.
- GeoTIFF and GeoZarr must be represented as blocked planning intents or
  documentation notes until a schema and runtime contract lands.
- `spatialQueryEvidence` can use inline GeoJSON point/bbox cases only. It must
  not imply PMTiles, vector tiles, GeoParquet, FlatGeobuf, GeoTIFF, or GeoZarr
  feature queries.
- `export_example_app` may summarize source readiness in manifest notes, but it
  must not fetch resources, parse archives, or write files.

## 2026-06-08 PMTiles Runtime Promotion Addendum

`TASK-2026W24-PROD-004` promotes the PMTiles/vector display and load-plan path
from planning-only pressure to accepted release evidence. The promotion is
bounded to URL-compatible MapLibre vector display and IO-free readiness
preflight.

Accepted evidence:

- `tests/fixtures/specs/valid/pmtiles-vector.map.json` is a valid MapSpec
  fixture with `sources.*.type: "pmtiles"` and layer
  `metadata["source-layer"]`.
- `createPMTilesRuntimeLoadPlan()` reports ready, metadata-required, or blocked
  states before IO.
- `createSourceReadinessReport()` keeps PMTiles `displayReady: true` only when
  the load plan is not blocked or metadata-required, and always keeps
  `queryReady: false`.
- MapLibre transformer/adapter tests map PMTiles to a vector URL source and
  forward source-layer metadata.
- Headless query still returns `CAPABILITY.UNSUPPORTED` at
  `/sources/{id}/url`.
- Snapshot smoke now loads, snapshots, exports, and destroys the PMTiles
  fixture.

The following remain blocked follow-ups: PMTiles archive parsing, vector tile
decoding, feature query, hidden range requests, worker startup, and
mutation/export handoff.

## Follow-Up Contract Checklist

Before promoting any blocked format, the owning task must add:

- TypeBox source schema or public `MapSpec` schema wiring when a standalone
  schema already exists, plus generated schema sync.
- Resource-policy paths and tests for every URL/range/worker field.
- Structured diagnostics for invalid URL, blocked host, unsupported encoding,
  missing CRS/metadata, oversized resources, timeout, and unsupported query
  modes.
- Adapter transform or runtime boundary tests.
- Snapshot/query evidence when rendering or analysis behavior changes.
- Documentation and example manifest updates that avoid implementation claims
  before the gates pass.

## AIN-003 Promotion Split

The follow-up split is now captured in
`docs/planning/feature-specs/cloud-native-source-promotion-candidates.md`.
That document keeps PMTiles archive metadata, PMTiles feature query,
GeoParquet, FlatGeobuf, GeoTIFF, and GeoZarr as separate promotion gates. It is
planning evidence only; it does not add public `MapSpec` source types, parsers,
workers, runtime loaders, or new MCP tool names.
