---
agent: quality
period: 2026-08-04
generated_at: 2026-08-03T17:49:24Z
repo_revision: "cf58b4605036d948e5e4783a2cde245eef536d91"
inputs:
  - https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.1.0
  - docs/reviews/maplibre-5.24-6.1-builder-evidence-2026-08-03.md
  - scripts/maplibre-compat-matrix.mjs
  - tests/compatibility/maplibre-compatibility.spec.ts
  - tests/framework/maplibre-compat-matrix.test.ts
  - tests/adapter/maplibre-v6-audit.test.ts
  - test-results/maplibre-compatibility/summary.json
owner: "@quality"
decision_level: blocking
gate_result: pass
evidence_kind: specialist
---

# MapLibre 6.1 Compatibility Quality Decision

## HOC-N3 Decision

**PASS for the bounded #38 runtime-compatibility slice.** An independent
unrestricted root run of `pnpm test:compat:maplibre` at revision `cf58b46`
passed exact MapLibre versions `5.24.0` and `6.1.0`. Both entries passed native
installation, strict public types, generated ESM build, lifecycle events,
missing-image recovery, overscaled vector query, adapter
`queryRenderedFeatures`, worker/resource observation, console cleanliness, and
strict visual checks.

**No-go for changing the default dependency in this slice.** Keep `5.24.0` as
the release/default baseline. A runtime-compatible candidate is not an adoption
approval, this task does not authorize package movement, and one local timing
sample is insufficient for a baseline decision. `candidateDecision` remains
`"keep-baseline"`.

## Gate Status

| Gate | Result | Evidence |
| --- | --- | --- |
| Exact native install | PASS | Requested and installed `5.24.0` / `6.1.0`; no forced peer resolution |
| Packed public API strict compile | PASS | Both isolated consumers passed TypeScript |
| Generated ESM application | PASS | Both entries passed Vite build; v6 resolved exports-only `dist/maplibre-gl.mjs` |
| Lifecycle / missing image | PASS | Raw and adapter lifecycle sets accepted; `styleimagemissing` handled in both |
| Overscaled local MVT | PASS | Server observed `/tiles/0/0/0.pbf`; source and rendered query counts are `1` |
| Adapter rendered-feature query | PASS | Query count `1` for each exact version |
| Worker / shared resource | PASS | v6 server paths include both module worker and shared module; v5 uses package-default blob delivery |
| Strict visual / console | PASS | Chromium `148.0.7778.96`; canvases `1/1`; identical accepted pixels; zero console errors |
| Browser E2E | PASS | Independent unrestricted run passed 5/5 Chromium tests |
| Repository strict visual | PASS | Independent unrestricted run passed 5/5: MapLibre base, local MVT, fill-extrusion, data-driven style, and Scene3D |
| Focused deterministic gates | PASS | Audit/framework 11 tests; adapter 74; docs 35; framework 57; engine build and Biome pass |
| Default dependency movement | PASS unchanged | Baseline, optional peer range, workspace state, and lockfile did not move |

## Performance Interpretation

The `6.1.0` candidate rendered in `585.5 ms` versus `578.7 ms` for the
baseline, a `+6.8 ms` (`+1.175%`) delta. Candidate query time was `3.2 ms`
versus `3.6 ms`, a `-0.4 ms` (`-11.111%`) delta. These are single-run local
measurements. They show no blocking compatibility symptom, but they do not
establish a durable performance trend or justify default adoption.

## Findings

No Critical, Important, or Minor implementation findings remain in the bounded
#38 compatibility diff.

The diagnostic sequence closed five fixture-quality defects: premature success
when the result object was undefined, an undeclared Ajv CSP requirement, a v5
root-relative tile URL failure, an exact-object assertion that rejected added
evidence, and main-page resource timing used as worker-fetch proof. Focused
regressions now protect each correction.

## Recommendations

| Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- |
| Both exact entries pass all type, runtime, query, worker, and visual checks | The stable v6 candidate is compatible with the tested adapter boundary | `@orchestrator` may close #38 as runtime-compatibility evidence complete | high |
| v6 requires explicit same-origin worker/shared assets and the engine currently requires Ajv `unsafe-eval` | Generated-app CSP or asset deployment can fail despite a green compile | Preserve CSP and server-path assertions in CI; document the constraint in any future adoption proposal | high |
| One local sample shows `+1.175%` render and `-11.111%` query deltas | Timing noise cannot support a package baseline change | Require repeated measurements and an explicit adoption task before changing defaults | high |
| The task intentionally left package defaults and lockfile unchanged | Expanding runtime evidence must not become an implicit release decision | Keep `5.24.0` and `candidateDecision: "keep-baseline"` | high |

This HOC-N3 pass closes the compatibility-evidence gate only. It does not
approve a MapLibre `6.1.0` default bump or alter planning state.
