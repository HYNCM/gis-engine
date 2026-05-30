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
add new source types or runtime loaders. The goal is to make AI planning honest
about which portable data sources are supported now, which are URL/schema
ready only, and which must stay blocked until schemas, diagnostics, resource
policy, and tests exist.

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
| PMTiles | supported as URL-compatible vector source evidence, readiness-only for archive parsing | `sources.*.type: "pmtiles"` with `url` | relative, localhost, allowlisted `http(s)`, or `pmtiles:` via `/sources/{id}/url` | no PMTiles feature query or archive mutation support | `pmtiles-local` manifest stays file-list only; transformer warns that PMTiles maps to a MapLibre vector URL | future contract must define archive open/range behavior, metadata, tilejson, mutation/export handoff, and worker/resource budgets |
| GeoParquet | blocked | no public `SourceSpec` type | no URL path is accepted until schema exists | no query/runtime support; `covering.bbox` may inform future planning only | manifests must not claim GeoParquet source support | add schema, CRS metadata, WKB/GeoArrow encoding diagnostics, bbox metadata validation, range/worker policy, and read-only query tests |
| FlatGeobuf | blocked | no public `SourceSpec` type | no URL path is accepted until schema exists | no query/runtime support | manifests must not claim FlatGeobuf source support | add schema, magic/version checks, optional index/range semantics, streaming diagnostics, and deterministic fixture tests |
| GeoTIFF | blocked | no public `SourceSpec` type | no URL path is accepted until schema exists | no raster query/sampling support | manifests must not claim GeoTIFF source support | add raster source schema, byte/range policy, band/CRS/no-data diagnostics, and snapshot tests |
| GeoZarr | blocked | no public `SourceSpec` type | no URL path is accepted until schema exists | no array query/sampling support | manifests must not claim GeoZarr source support | add array-store schema, chunk/range policy, CRS/time/band diagnostics, worker budgets, and snapshot/query fixtures |

## Generated-App Rules

- AI generation may emit `geojson`, `raster`, `vector`, and `pmtiles` only
  through the existing `MapGenerationRequestSchema` and command skeleton path.
- GeoParquet, FlatGeobuf, GeoTIFF, and GeoZarr must be represented as blocked
  planning intents or documentation notes until a schema and runtime contract
  lands.
- `spatialQueryEvidence` can use inline GeoJSON point/bbox cases only. It must
  not imply PMTiles, vector tiles, GeoParquet, FlatGeobuf, GeoTIFF, or GeoZarr
  feature queries.
- `export_example_app` may summarize source readiness in manifest notes, but it
  must not fetch resources, parse archives, or write files.

## Follow-Up Contract Checklist

Before promoting any blocked format, the owning task must add:

- TypeBox source schema and generated schema sync.
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
planning evidence only; it does not add schemas, parsers, workers, runtime
loaders, or new MCP tool names.
