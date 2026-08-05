---
agent: quality
period: 2026-08-04
generated_at: 2026-08-05T15:16:41Z
repo_revision: "b35a32604cb87bda9dcdc504b92fc56f65dd77dc"
inputs:
  - docs/reviews/geoparquet-version-boundary-builder-evidence-2026-08-03.md
  - docs/planning/feature-specs/cloud-native-source-readiness.md
  - packages/engine/src/spec/cloud-native/geoparquet-source.ts
  - packages/engine/src/spec/cloud-native/validate.ts
  - tests/fixtures/geoparquet
owner: "@quality"
decision_level: blocking
gate_result: pass
evidence_kind: specialist
---

# GeoParquet Version Boundary Quality Decision

## HOC-N3 Decision

**PASS for the bounded Issue #42 metadata-readiness slice.** The public schema
and policy now distinguish GeoParquet `1.1.0` from the reviewed
`2.0.0-rc.1` artifact, preserve the official raw `geo.version` values, reject
missing, unsupported, mismatched, legacy, and mixed-version metadata with
stable diagnostics, and retain explicit URL resource policy.

The final review fixes also validate a recognizable PROJJSON CRS structure,
require affirmative 2.0 RC statistics evidence, avoid unsupported CRS/range
assumptions for bbox values, enforce 4D/6D for 1.1 versus 4D/6D/8D for the 2.0
RC in both policy and TypeBox validation, and align tracked public API plus
WASM-stub types with the versioned source metadata contract. The public policy
entry point also executes the complete source shape and selected version
metadata schema, so callers cannot bypass TypeBox through policy-only use.

**No-go for runtime promotion.** The change does not approve archive fetch,
Parquet parsing, range IO, WASM execution, workers, renderer integration,
snapshot behavior, or feature query. `CAPABILITY.UNSUPPORTED` remains the
runtime decision. GeoParquet 2.0 final or a separately approved implementation
issue is required before that boundary can be reconsidered.

## Gate Status

| Gate | Result | Evidence |
| --- | --- | --- |
| Schema build | PASS | `pnpm build:schema` compiled engine/Scene3D/AI schemas |
| Schema contract | PASS | 137 schema tests; 16 schema-sync/Ajv tests; public policy/schema parity covers versioned bbox and complete source shape |
| Deterministic checks | PASS | unrestricted `pnpm check` completed all builds and test layers |
| Resource policy | PASS | 23/23; GeoParquet file URL remains explicit at `/sources/{id}/url` |
| Adapter boundary | PASS | 74/74; MapLibre/headless query stays unsupported |
| AI/MCP boundary | PASS | 302/302; capability fields updated, canonical MCP contract unchanged |
| Docs | PASS | 38/38; official URLs, checked date, version-specific bbox migration, generated API shape, diagnostics, and No-go recorded |
| Examples | PASS | unrestricted 142/142; review-console capability reporting aligned |
| Smoke snapshot | PASS | full check includes 15/15 deterministic smoke snapshot tests |
| Strict visual | PASS | unrestricted strict visual run passed 5/5 scenarios |
| TypeScript | PASS | workspace builds and `pnpm test:types` pass; source and WASM-stub metadata types derive from TypeBox without `any` widening |

## Review Checklist

| Area | Result | Evidence |
| --- | --- | --- |
| Architecture | PASS | Metadata readiness stays in core schema/policy; the existing fail-closed WASM stub receives type-only alignment, with no renderer dependency or loader behavior added |
| AI operability | PASS | Exact release/raw version identity and stable pointer diagnostics are deterministic and auditable |
| Commands | PASS | No mutation path changed; state mutation remains command-only |
| Diagnostics | PASS | Four stable `GEOPARQUET.*` codes cover required, unsupported, ambiguous, and incompatible cases; runtime warning retained |
| Tests | PASS | Versioned valid/invalid fixtures, CRS/statistics/bbox/API drift regressions, public type compilation, full check, and strict visual are recorded |
| Docs | PASS | Official 1.1 and RC sources, checked date, generated API surface, breaking migration, semantic differences, and revisit gate are explicit |
| Security | PASS | No hidden IO, host exception, worker, WASM execution, or policy relaxation; URL tests pass |
| TypeScript | PASS | Schema-derived public source type and strict builds pass without widening |

## Findings

No Critical, Important, or Minor finding remains in the bounded diff.

Review required nine corrections before this pass:

1. The initial proposed WASM execution contract changes were removed. A later
   type-only alignment replaced the stub's contradictory numeric version and
   legacy encoding fields with `GeoParquetSourceMetadata`; runtime behavior is
   unchanged and remains fail closed.
2. `releaseIdentity` and raw `geoVersion` are separate required fields, so the
   RC tag cannot be mistaken for the embedded metadata constant. Legacy
   top-level fields now receive both a required-version diagnostic and an
   explicit ambiguity/migration diagnostic.
3. CRS metadata requires a recognized PROJJSON CRS type and non-empty name;
   arbitrary objects fail both schema and policy validation.
4. The 2.0 RC branch requires `rowGroupStatistics.bbox` and
   `rowGroupStatistics.geometryTypes` to be literal `true`; false, partial, and
   non-object evidence fails closed.
5. Bbox validation accepts projected coordinates and antimeridian-crossing
   geographic boxes because this boundary does not interpret CRS axes; it
   validates only the version-specific numeric tuple contract.
6. A narrowed generated API update, public type test, and migration guide
   remove the legacy shape without importing unrelated TypeDoc backlog.
7. Policy validation now uses the same version-specific bbox tuple widths as
   TypeBox: 1.1 rejects 8-number evidence while 2.0 RC accepts it. Paired
   positive and negative regressions prevent the two validation layers from
   drifting again.
8. `validateGeoParquetPolicy()` now reuses the complete source and selected
   version metadata schemas. Invalid covering paths, extra fields, negative
   row/file budgets, and a wrong source type return stable error diagnostics
   instead of policy-only false positives.
9. The migration guide and docs regression state the bbox widths separately:
   1.1 accepts 4/6 numbers and the reviewed 2.0 RC accepts 4/6/8.

## Recommendations

| Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- |
| Official RC tag uses raw `geo.version = 2.0.0` | Overloading the release field would mislead writers | Preserve the dual-field invariant and mismatch regression | high |
| All required deterministic, resource, example, and visual gates pass | The metadata boundary is merge-ready | `@orchestrator` may close #42 after merged-main evidence | high |
| Runtime warning remains and no IO implementation exists | A support claim would be false | Keep runtime/query status No-go | high |
| 2.0 is still a release candidate | Final schema may change | Open a fresh reviewed gate after 2.0 final; do not silently widen this union | high |

This HOC-N3 pass authorizes only the version-aware metadata-readiness contract.
Blocking diagnostics: none.
