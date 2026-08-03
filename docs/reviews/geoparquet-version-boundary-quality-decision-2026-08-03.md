---
agent: quality
period: 2026-08-04
generated_at: 2026-08-03T18:41:48Z
repo_revision: "588252afcd0a957bf9a136f0e56c8254083c45cf"
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

**No-go for runtime promotion.** The change does not approve archive fetch,
Parquet parsing, range IO, WASM execution, workers, renderer integration,
snapshot behavior, or feature query. `CAPABILITY.UNSUPPORTED` remains the
runtime decision. GeoParquet 2.0 final or a separately approved implementation
issue is required before that boundary can be reconsidered.

## Gate Status

| Gate | Result | Evidence |
| --- | --- | --- |
| Schema build | PASS | `pnpm build:schema` compiled engine/Scene3D/AI schemas |
| Schema contract | PASS | 114 schema tests; 16 schema-sync/Ajv tests |
| Deterministic checks | PASS | unrestricted `pnpm check` completed all builds and test layers |
| Resource policy | PASS | 23/23; GeoParquet file URL remains explicit at `/sources/{id}/url` |
| Adapter boundary | PASS | 74/74; MapLibre/headless query stays unsupported |
| AI/MCP boundary | PASS | 302/302; capability fields updated, canonical MCP contract unchanged |
| Docs | PASS | 35/35; official URLs, checked date, field matrix, diagnostics, and No-go recorded |
| Examples | PASS | unrestricted 142/142; review-console capability reporting aligned |
| Smoke snapshot | PASS | full check includes 15/15 deterministic smoke snapshot tests |
| Strict visual | PASS | unrestricted strict visual run passed 5/5 scenarios |
| TypeScript | PASS | workspace builds pass; public GeoParquet type derives from TypeBox without `any` widening |

## Review Checklist

| Area | Result | Evidence |
| --- | --- | --- |
| Architecture | PASS | Metadata readiness stays in core schema/policy; no renderer dependency or runtime loader added |
| AI operability | PASS | Exact release/raw version identity and stable pointer diagnostics are deterministic and auditable |
| Commands | PASS | No mutation path changed; state mutation remains command-only |
| Diagnostics | PASS | Four stable `GEOPARQUET.*` codes cover required, unsupported, ambiguous, and incompatible cases; runtime warning retained |
| Tests | PASS | Versioned valid/invalid fixtures, RED/GREEN evidence, full check, and strict visual are recorded |
| Docs | PASS | Official 1.1 and RC sources, checked date, semantic differences, and revisit gate are explicit |
| Security | PASS | No hidden IO, host exception, worker, WASM behavior, or policy relaxation; URL tests pass |
| TypeScript | PASS | Schema-derived public source type and strict builds pass without widening |

## Findings

No Critical, Important, or Minor finding remains in the bounded diff.

Review required two corrections before this pass:

1. The fail-closed WASM stub was returned to its prior public contract; Issue
   #42 does not touch the runtime/WASM path.
2. `releaseIdentity` and raw `geoVersion` are separate required fields, so the
   RC tag cannot be mistaken for the embedded metadata constant. Legacy
   top-level fields now receive both a required-version diagnostic and an
   explicit ambiguity/migration diagnostic.

## Recommendations

| Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- |
| Official RC tag uses raw `geo.version = 2.0.0` | Overloading the release field would mislead writers | Preserve the dual-field invariant and mismatch regression | high |
| All required deterministic, resource, example, and visual gates pass | The metadata boundary is merge-ready | `@orchestrator` may close #42 after merged-main evidence | high |
| Runtime warning remains and no IO implementation exists | A support claim would be false | Keep runtime/query status No-go | high |
| 2.0 is still a release candidate | Final schema may change | Open a fresh reviewed gate after 2.0 final; do not silently widen this union | high |

This HOC-N3 pass authorizes only the version-aware metadata-readiness contract.
Blocking diagnostics: none.
