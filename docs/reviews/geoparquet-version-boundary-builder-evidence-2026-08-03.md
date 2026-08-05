---
agent: builder
focus_area: engine
feature: issue-42-geoparquet-version-boundary
period: 2026-08-04
generated_at: 2026-08-05T14:48:18Z
repo_revision: "2404aebfda21d10d43645cb46d59aaf71d594bbd"
inputs:
  - https://github.com/opengeospatial/geoparquet/releases/tag/v2.0.0-rc.1
  - https://github.com/opengeospatial/geoparquet/blob/v1.1.0/format-specs/schema.json
  - https://github.com/opengeospatial/geoparquet/blob/v1.1.0/format-specs/geoparquet.md
  - https://github.com/opengeospatial/geoparquet/blob/v2.0.0-rc.1/format-specs/schema.json
  - https://github.com/opengeospatial/geoparquet/blob/v2.0.0-rc.1/format-specs/geoparquet.md
  - packages/engine/src/spec/cloud-native/geoparquet-source.ts
  - packages/engine/src/spec/cloud-native/validate.ts
  - tests/fixtures/geoparquet
owner: "@builder"
decision_level: advisory
status: ready-for-review
evidence_kind: specialist
---

# GeoParquet Version Boundary Builder Evidence

## Outcome

Issue #42 now has an exact, fail-closed metadata-readiness boundary for
GeoParquet `1.1.0` and the reviewed `2.0.0-rc.1` release candidate. The public
source schema requires a discriminated `metadata` object and no longer accepts
the ambiguous optional numeric `parquetVersion` or version-neutral top-level
`encoding`, `crs`, and `bbox` fields.

The contract deliberately separates two meanings:

- `metadata.releaseIdentity` identifies the reviewed release artifact:
  `1.1.0` or `2.0.0-rc.1`.
- `metadata.geoVersion` records the raw GeoParquet `geo.version`: `1.1.0` for
  the 1.1 branch and `2.0.0` for the RC branch.

This distinction follows the official RC tag, whose metadata JSON Schema uses
`const: "2.0.0"`. It prevents callers from serializing `2.0.0-rc.1` as the raw
file metadata version or treating the candidate as 2.0 final.

Specification review then closed four fail-open or drift paths. CRS objects now
require a recognized PROJJSON CRS `type` and non-empty `name`; 2.0 RC row-group
statistics require both accepted flags to be `true`; bbox validation checks only
the versioned numeric tuple shape instead of assuming WGS84 ranges or rejecting
RFC 7946 antimeridian boxes; and tracked API references plus the exported WASM
stub metadata type now derive from the same source metadata contract. The WASM
change is type-only and adds no execution behavior.

## Version Contract

| Evidence | `1.1.0` | `2.0.0-rc.1` readiness pin |
| --- | --- | --- |
| Raw `geo.version` | `1.1.0` | `2.0.0` |
| Encoding | WKB or 1.1 GeoArrow single-geometry layout | WKB only |
| Parquet type | Existing 1.1 physical layouts | Native `GEOMETRY` or `GEOGRAPHY` |
| CRS | Basic PROJJSON CRS structure (`type` + `name`) or `null` in `geo` metadata | Native Parquet CRS is source of truth; an optional `geo` restatement must use the same checked structure or `null` |
| Spatial evidence | Optional 4D/6D numeric bbox and `covering.bbox` paths | Optional 4D/6D/8D numeric bbox plus required `bbox: true` and `geometryTypes: true` row-group statistics evidence |
| Covering | Allowed | Rejected |

## Diagnostics And Failure Boundary

- `GEOPARQUET.VERSION_REQUIRED` reports missing release identity at
  `/sources/{id}/metadata/releaseIdentity`.
- `GEOPARQUET.VERSION_UNSUPPORTED` rejects unreviewed identities, including
  `2.0.0` used as a release identity.
- `GEOPARQUET.METADATA_AMBIGUOUS` rejects mixed 1.1 covering and 2.0 native
  fields, and explains migration from legacy top-level metadata even when the
  new `metadata` object is absent.
- `GEOPARQUET.METADATA_INCOMPATIBLE` reports release/raw-version mismatch,
  wrong encoding, cross-version fields, invalid CRS shape, or missing 2.0 RC
  logical-type/statistics evidence with stable JSON pointer paths.
- `CAPABILITY.UNSUPPORTED` remains present at `/sources/{id}/runtime` for valid
  and invalid input. Runtime loading and query remain blocked.

## TDD Evidence

- Initial RED: focused policy suite had 11 expected failures for missing
  version schemas, stable codes, mixed-field rejection, metadata bbox path,
  and null-input safety.
- Initial GREEN: focused suite passed 33/33.
- Semantic review RED: after separating reviewed release identity from raw
  `geo.version` and adding legacy migration diagnostics, the suite had 12
  expected failures.
- Final GREEN: focused suite passed 35/35, including valid 1.1/RC fixtures,
  missing and unknown releases, mismatched raw version, mixed metadata,
  cross-version encodings/fields, legacy shape, invalid CRS, metadata budgets,
  URL validation, and unknown input.
- Specification-review RED: four Important findings reproduced arbitrary CRS
  objects, false/partial statistics, projected and antimeridian bbox false
  negatives, and stale public API/WASM metadata shapes.
- Specification-review GREEN: cloud-native policy now passes 51/51 and the
  combined policy/docs regression set passes 92/92. Public type compilation
  proves the WASM stub metadata surface consumes `GeoParquetSourceMetadata`.

## HOC-N2 Evidence Summary

- What changed: TypeBox now owns the version-discriminated source metadata
  type; public hand-written and WASM-stub metadata types derive from it;
  capability summaries and generated API pages expose both release and raw
  version fields.
- Test coverage: three deterministic fixtures plus policy, MapSpec schema,
  resource policy, readiness, adapter, AI context/generation, example, and
  full-repository gates.
- Resource implications: the only resource remains the explicit source URL at
  `/sources/{id}/url`; resource-policy code and allowlists did not change.
- MCP implications: no tool name, order, input/output descriptor, protocol
  version, structured content, or failure envelope changed. AI summaries only
  report the corrected metadata field names.
- Known limitation: this is metadata evidence only. The WASM surface received
  a breaking type alignment and migration guide, but no fetch, range request,
  parser, archive reader, WASM execution, worker, renderer path, snapshot
  implementation, or feature query was added.

## Verification

- `pnpm build:schema`: pass.
- `pnpm test:types`: pass for the versioned source and WASM-stub metadata
  public type contract.
- `pnpm test:schema`: 4 files / 130 tests pass.
- `pnpm test:schema-sync`: 1 file / 16 tests pass.
- `pnpm test:resources`: 4 files / 23 tests pass.
- `pnpm test:docs`: 5 files / 37 tests pass.
- `pnpm test:adapter`: 11 files / 74 tests pass.
- `pnpm test:ai`: 14 files / 302 tests pass.
- Unrestricted `pnpm test:examples`: 7 files / 142 tests pass.
- Unrestricted `pnpm check`: pass, including all workspace builds, framework,
  performance, smoke snapshot, and Studio suites.
- Unrestricted `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm
  test:snapshot:visual`: 5/5 pass.
- `pnpm docs:api` output was filtered by generated-file content to the 38
  GeoParquet-bearing source, API, migration, and regression files in
  `2404aeb`; unrelated A2A, PMTiles, MapLibre, and TypeDoc classification
  backlog was explicitly reverted.
- Biome and `git diff --check`: pass.

## Recommendations

| Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- |
| Official RC schema separates tag identity from raw `geo.version` | A single overloaded version field would produce non-conformant metadata | Keep both required fields and their matching invariant | high |
| Both version branches pass schema, policy, AI, example, and visual gates | The readiness contract is deterministic without runtime promotion | `@quality` may accept the bounded metadata slice | high |
| Runtime remains `CAPABILITY.UNSUPPORTED` and no IO path changed | Users cannot load or query GeoParquet through this work | Keep all runtime claims No-go | high |
| The reviewed 2.0 artifact is still an RC | Final semantics may change | Revisit only after 2.0 final or a separately approved implementation issue | high |

HOC-N2 is ready for `@quality`. Planning state remains owned by
`@orchestrator`.
