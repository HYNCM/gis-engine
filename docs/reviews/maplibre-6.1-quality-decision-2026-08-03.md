---
agent: quality
period: 2026-08-04
generated_at: 2026-08-03T18:15:31Z
repo_revision: "6e48d6b92db679c71f43a568d7e148ae94416a63"
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
unrestricted root run of `pnpm test:compat:maplibre` at revision `2f437e7c`
passed exact MapLibre versions `5.24.0` and `6.1.0`. Both entries passed native
installation, strict public types, generated ESM build, lifecycle events,
missing-image recovery, overscaled vector query, adapter
`queryRenderedFeatures`, worker/resource observation, console cleanliness, and
strict visual checks.

The machine summary was generated at `2026-08-03T18:01:37.519Z` with Chromium
`148.0.7778.96`. For both exact entries, requested and installed versions
match, `nativePeerInstall.status` is `passed`, `peerResolution` is `native`,
and the adapter result records `adapterQueryPassed: true`,
`adapterQueryDiagnostics: []`, plus exact identity `name=matrix`,
`layer.id=matrix-point`, `source=points`.

Revision `6e48d6b9` resolves the final quality-review blocks: per-version CI
evidence is combined into a remotely retained cross-version summary without
installing dependencies or rerunning a browser in the aggregation job, and
console errors cannot arrive asynchronously after the final assertion but
before evidence persistence.

**No-go for changing the default dependency in this slice.** Keep `5.24.0` as
the release/default baseline. A runtime-compatible candidate is not an adoption
approval, this task does not authorize package movement, and one local timing
sample is insufficient for a baseline decision. `candidateDecision` remains
`"keep-baseline"`.

## Gate Status

| Gate | Result | Evidence |
| --- | --- | --- |
| Exact native install | PASS | Requested and installed `5.24.0` / `6.1.0`; both native statuses `passed`; rejected native resolution now fails closed with `MAPLIBRE_NATIVE_INSTALL_REJECTED` and has no fallback path |
| Packed public API strict compile | PASS | Both isolated consumers passed TypeScript |
| Generated ESM application | PASS | Both entries passed Vite build; v6 resolved exports-only `dist/maplibre-gl.mjs` |
| Lifecycle / missing image | PASS | Raw and adapter lifecycle sets accepted; `styleimagemissing` handled in both |
| Overscaled local MVT | PASS | Server observed `/tiles/0/0/0.pbf`; rendered count is `1` for both versions, while source-cache counts are `1` for `5.24.0` and `4` for `6.1.0` |
| Adapter rendered-feature query | PASS | Both record count `1`, `adapterQueryPassed: true`, `adapterQueryDiagnostics: []`, and exact `name=matrix` / `layer.id=matrix-point` / `source=points` identity |
| Worker / shared resource | PASS | v6 server paths include both module worker and shared module; v5 uses package-default blob delivery |
| Resource policy | PASS | `pnpm test:resources`: 4 files / 23 tests; covers the required gate for URL, local tile, worker, and resource-lifecycle surfaces |
| Cross-version CI summary | PASS | Version jobs upload independent JSON; aggregation-only job downloads both, rejects missing/mismatched/failed entries, computes delta, and uploads the merged summary without browser rerun |
| Console evidence lifecycle | PASS | Error text enters synchronously; page close and stable diagnostic drain precede the final assertion and JSON write |
| Strict visual / console | PASS | Chromium `148.0.7778.96`; canvases `1/1`; identical accepted pixels; zero console errors |
| Browser E2E | PASS | Independent unrestricted run passed 5/5 Chromium tests |
| Repository strict visual | PASS | Independent unrestricted run passed 5/5: MapLibre base, local MVT, fill-extrusion, data-driven style, and Scene3D |
| Focused deterministic gates | PASS | MapLibre framework 12; adapter 74; resources 23; docs 35; full framework 61; engine build, Playwright test discovery, Biome, script syntax, and diff check pass |
| Default dependency movement | PASS unchanged | Baseline, optional peer range, workspace state, and lockfile did not move |

## Review Checklist

| Area | Result | Evidence |
| --- | --- | --- |
| Architecture | PASS | Runtime behavior stays behind `MapLibreAdapter`; aggregation is evidence-only and adds no renderer dependency to core |
| AI operability | PASS | Machine JSON remains deterministic and auditable; no MCP or public AI contract changed |
| Commands | PASS | No `MapSpec` mutation path was added; runtime mutation remains command-only |
| Diagnostics | PASS | Native install and aggregate failures use stable codes, including missing/mismatched version failures; console text is captured synchronously |
| Tests | PASS | TDD recorded 5 expected RED failures, then focused 12/12; resource 23/23, docs 35/35, framework 61/61, adapter 74/74, and prior exact browser matrix pass |
| Docs | PASS | HOC-N2/HOC-N3 reports contain final evidence, scope boundary, test results, and adoption No-go |
| Security | PASS | No new host or policy exception; URL/tile/worker changes passed `pnpm test:resources` 4 files / 23 tests |
| TypeScript | PASS | No public type widening; strict generated consumers passed in the exact matrix, and the updated Playwright TypeScript spec loads in test discovery |

## Performance Interpretation

The `6.1.0` candidate rendered in `588.3000000007451 ms` versus
`576.9000000003725 ms` for the baseline, a recorded
`+11.400000000372529 ms` (`+1.976%`) delta. Candidate query time was
`3.799999998882413 ms` versus `3.5 ms`, a recorded
`+0.2999999988824129 ms` (`+8.571%`) delta. Rounded, these are `+11.4 ms`
render and `+0.3 ms` query. These are single-run local measurements. They show
no blocking compatibility symptom, but they do not establish a durable
performance trend or justify default adoption.

## Findings

No Critical, Important, or Minor implementation findings remain in the bounded
#38 compatibility diff.

The diagnostic sequence closed five fixture-quality defects: premature success
when the result object was undefined, an undeclared Ajv CSP requirement, a v5
root-relative tile URL failure, an exact-object assertion that rejected added
evidence, and main-page resource timing used as worker-fetch proof. Focused
regressions now protect each correction.

The final hardening also removed legacy peer fallback and made the adapter
query gate depend on empty diagnostics plus exact live MapLibre feature
identity. Count-only mutation evidence remains blocked even when the count is
`1`.

The CI aggregation regression tests additionally prove that a missing exact
version and a checked/result version mismatch fail closed. The successful case
proves the combined render/query delta while performing no package install or
browser execution.

## Recommendations

| Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- |
| Both exact entries pass all type, runtime, query, worker, and visual checks | The stable v6 candidate is compatible with the tested adapter boundary | `@orchestrator` may close #38 as runtime-compatibility evidence complete | high |
| v6 requires explicit same-origin worker/shared assets and the engine currently requires Ajv `unsafe-eval` | Generated-app CSP or asset deployment can fail despite a green compile | Preserve CSP and server-path assertions in CI; document the constraint in any future adoption proposal | high |
| One local sample shows `+1.976%` render and `+8.571%` query deltas | Timing noise cannot support a package baseline change | Require repeated measurements and an explicit adoption task before changing defaults | high |
| The task intentionally left package defaults and lockfile unchanged | Expanding runtime evidence must not become an implicit release decision | Keep `5.24.0` and `candidateDecision: "keep-baseline"` | high |

This HOC-N3 pass closes the compatibility-evidence gate only. It does not
approve a MapLibre `6.1.0` default bump or alter planning state.

Blocking diagnostics: none.
