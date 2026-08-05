---
agent: builder
period: 2026-08-04
generated_at: 2026-08-03T18:31:52Z
repo_revision: "25100a071761b0078741de58e8ce5c5d391c7fcf"
inputs:
  - https://github.com/opengeospatial/geoparquet/releases/tag/v2.0.0-rc.1
  - https://github.com/opengeospatial/geoparquet/blob/v1.1.0/format-specs/schema.json
  - https://github.com/opengeospatial/geoparquet/blob/v2.0.0-rc.1/format-specs/schema.json
  - docs/research/competitor-updates-2026-W22.md
  - docs/research/capability-scorecard.md
  - packages/engine/src/spec/schemas/map-spec.schema.ts
  - packages/engine/src/spec/resource-policy.ts
  - packages/engine/src/renderer/maplibre/transformer.ts
  - tests/schema/resource-policy.test.ts
owner: "@builder"
decision_level: advisory
---

# Cloud-Native Source Readiness Matrix

This matrix is a readiness contract for generated map applications. It does not
add new public `MapSpec` source types or archive parsers. The goal is to make
AI planning honest about which portable data sources are supported now, which
have IO-free load-plan preflight, which are public readiness-only contracts
without runtime loading/query, and which must stay blocked until diagnostics,
resource policy, adapter boundaries, and tests exist.

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
| PMTiles | supported as URL-compatible vector source evidence with IO-free load-plan preflight; runtime `queryReady: false`; fixture evidence is separate via `fixtureEvidenceReady` and `fixtureEvidenceStatus`; readiness-only for archive parsing | `sources.*.type: "pmtiles"` with `url`; MapLibre vector layers must declare `metadata["source-layer"]` | relative, localhost, allowlisted `http(s)`, or `pmtiles:` via `/sources/{id}/url`; `createPMTilesRuntimeLoadPlan()` also checks range-policy requirements and optional archive metadata budgets | no PMTiles runtime feature query or archive mutation support; fixture evidence never promotes runtime `queryReady` | `pmtiles-local` manifest stays file-list only; context, CLI preflight, and delivery evidence may include `runtimeLoadPlan`, `sourceReadiness`, and fixture evidence fields without fetching resources | future contract must define archive parsing/open behavior, tilejson, mutation/export handoff, and query semantics |
| GeoParquet | version-aware metadata readiness for `1.1.0` and reviewed `2.0.0-rc.1`; runtime blocked | `sources.*.type: "geoparquet"` with URL and required discriminated `metadata`; 1.1 accepts WKB/GeoArrow encodings and optional covering, while 2.0 RC requires WKB, native `GEOMETRY`/`GEOGRAPHY`, and row-group statistics evidence | `/sources/{id}/url` always passes the public resource policy; `validateGeoParquetPolicy()` performs metadata-only validation and never fetches | no parser, decode, display, query, worker, or WASM runtime support; bbox/statistics are evidence only | manifests may report exact release identity and readiness diagnostics but must not claim GeoParquet runtime support | `GEOPARQUET.VERSION_REQUIRED`, `GEOPARQUET.VERSION_UNSUPPORTED`, `GEOPARQUET.METADATA_AMBIGUOUS`, and `GEOPARQUET.METADATA_INCOMPATIBLE` fail closed; every path retains `CAPABILITY.UNSUPPORTED` at `/sources/{id}/runtime` |
| FlatGeobuf | schema/policy contract-ready; public `MapSpec` source contract with runtime blocked | standalone `FlatGeobufSourceSchema`; included in public `SourceSpecSchema` and `MapSpecSchema` via the embedded contract variant | `validateFlatGeobufPolicy()` validates metadata budgets/index constraints and returns runtime-blocked diagnostics without IO; public MapSpec resource policy includes a FlatGeobuf URL path | no query/runtime support | manifests must not claim FlatGeobuf runtime support | promotion gate must add read-only query fixtures, streaming/index diagnostics, and deterministic negative fixtures before runtime promotion |
| GeoTIFF | schema/policy contract-ready; public `MapSpec` source contract with runtime blocked | standalone `GeoTiffSourceSchema`; included in public `SourceSpecSchema` and `MapSpecSchema` via the embedded contract variant | `validateGeoTiffPolicy()` validates URL, CRS, bbox, band, no-data, pixel, and byte metadata without IO; public MapSpec resource policy includes a GeoTIFF URL path | no runtime, sampling, display, or query support | manifests may list GeoTIFF only as readiness-only contract evidence and must not claim raster runtime support | promotion gate must add raster decode/display evidence, sampling/query blockers, worker/range policy evidence, and snapshot tests before runtime promotion |
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
| GeoParquet | `readiness-only`. | Show exact `metadata.releaseIdentity`, matching raw `metadata.geoVersion`, version-compatible encoding, inline PROJJSON/null CRS, 1.1 covering or 2.0 RC native logical-type/statistics evidence, URL-policy result, stable diagnostics, and the runtime No-go. | Sets the source section to follow-up-required; missing, unknown, mismatched, or mixed version metadata is blocked rather than inferred. |
| FlatGeobuf | `readiness-only`. | Show public source contract evidence, no runtime loader/query claim, standalone schema/policy evidence when relevant, and follow-up requirements for read-only query fixtures, magic/version checks, index/range semantics, streaming diagnostics, and deterministic fixtures. | Sets the source section to follow-up-required unless an explicit user confirmation is needed. |
| GeoTIFF | `readiness-only`. | Show public source contract evidence, no runtime loader/display/sampling/query claim, and follow-up requirements for raster decode, byte/range policy, band/CRS/no-data diagnostics, worker policy, sampling blockers, and snapshot tests. | Sets the source section to follow-up-required unless an explicit user confirmation is needed. |
| GeoZarr | `blocked`. | Show blocked source intent only, no generated `SourceSpec`, and follow-up requirements for array-store schema, chunk/range policy, CRS/time/band diagnostics, worker budgets, and query/snapshot fixtures. | Blocks delivery if requested as an implemented source. |

## Generated-App Rules

- AI generation may emit `geojson`, `raster`, `vector`, and `pmtiles` only
  through the existing `MapGenerationRequestSchema` and command skeleton path.
- GeoParquet and FlatGeobuf may be represented as public schema/policy
  contract evidence, but runtime loading/query must remain blocked until the
  promotion gates for read-only evidence, adapter/runtime blockers, docs, and
  tests land.
- GeoTIFF may be represented as public schema/policy contract evidence, but
  runtime loading, display, sampling, and query must remain blocked until its
  promotion gate lands. GeoZarr must remain a blocked planning intent until a
  schema and runtime contract lands.
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

## 2026-08-04 GeoParquet Version Boundary Addendum

Official sources were checked on `2026-08-04`:

- GeoParquet [`v1.1.0` metadata schema](https://github.com/opengeospatial/geoparquet/blob/v1.1.0/format-specs/schema.json)
  and [format specification](https://github.com/opengeospatial/geoparquet/blob/v1.1.0/format-specs/geoparquet.md).
- GeoParquet [`v2.0.0-rc.1` release](https://github.com/opengeospatial/geoparquet/releases/tag/v2.0.0-rc.1),
  published `2026-07-19`, plus its [metadata schema](https://github.com/opengeospatial/geoparquet/blob/v2.0.0-rc.1/format-specs/schema.json)
  and [format specification](https://github.com/opengeospatial/geoparquet/blob/v2.0.0-rc.1/format-specs/geoparquet.md).

The release is explicitly a release candidate even though GitHub release
metadata does not mark it prerelease. The repository tag is the reviewed
release identity `2.0.0-rc.1`, while the candidate's embedded GeoParquet
`geo.version` schema constant is `2.0.0`. GIS Engine keeps these meanings
separate: `metadata.releaseIdentity: "2.0.0-rc.1"` pins the reviewed artifact,
and `metadata.geoVersion: "2.0.0"` records the raw metadata constant. The two
fields must match their discriminated branch, and neither is evidence that 2.0
final exists.

| Contract area | GeoParquet `1.1.0` | GeoParquet `2.0.0-rc.1` readiness pin |
| --- | --- | --- |
| Encoding | `WKB` or one of the single-geometry GeoArrow layouts: `point`, `linestring`, `polygon`, `multipoint`, `multilinestring`, `multipolygon` | `WKB` only; geometry columns use native Parquet `GEOMETRY` or `GEOGRAPHY` logical types |
| CRS | `geo` column metadata is inline PROJJSON or `null`; absent means OGC:CRS84 | Native Parquet logical-type `crs` is source of truth and supports additional forms; when `geo` metadata is present, its restatement is still inline PROJJSON or `null` and must describe the same CRS |
| Spatial statistics | No standardized native Parquet geospatial statistics contract; GeoArrow layouts may expose ordinary nested-column statistics | Native Parquet row-group spatial statistics carry geometry types and bounding-box evidence |
| Covering | Optional `covering.bbox` column paths may accelerate spatial filtering | Removed; mixing `covering` with native logical-type/statistics evidence is ambiguous and rejected |
| Capability reporting | Exact 1.1 metadata identity plus version-compatible fields; readiness-only | Exact reviewed RC identity plus WKB, logical type, and row-group-statistics evidence; readiness-only |
| Diagnostics | Missing/unknown identity and 2.0-only fields fail closed | Missing/unknown identity, GeoArrow/covering fields, and mixed-version evidence fail closed |

Both branches keep the same security and runtime boundary:

- URL access is explicit at `/sources/{id}/url` and must pass
  `ResourcePolicy`; metadata validation performs no IO.
- `CAPABILITY.UNSUPPORTED` remains at `/sources/{id}/runtime` for valid and
  invalid metadata alike.
- No archive fetch, Parquet parser, decode, WASM module, worker, display,
  snapshot, or feature-query behavior is added by this contract.
- Runtime readiness must not be revisited until GeoParquet 2.0 final ships or a
  separately approved implementation issue defines resource, parser, worker,
  query, diagnostics, and deterministic evidence gates.

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
