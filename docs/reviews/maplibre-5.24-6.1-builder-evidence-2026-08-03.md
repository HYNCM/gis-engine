---
agent: builder
focus_area: qa
feature: issue-38-maplibre-stable-compatibility
period: 2026-08-04
generated_at: 2026-08-03T18:15:31Z
repo_revision: "d672f3f20d1fdb8fccb09e0af0bca532b0aba22c"
inputs:
  - https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.1.0
  - https://www.npmjs.com/package/maplibre-gl/v/5.24.0
  - https://www.npmjs.com/package/maplibre-gl/v/6.1.0
  - scripts/maplibre-compat-matrix.mjs
  - tests/compatibility/maplibre-compatibility.spec.ts
  - tests/framework/maplibre-compat-matrix.test.ts
  - packages/engine/src/renderer/maplibre/v6-audit.ts
  - test-results/maplibre-compatibility/summary.json
owner: "@builder"
decision_level: advisory
status: ready-for-review
evidence_kind: specialist
---

# MapLibre 5.24 / 6.1 Compatibility Builder Evidence

## Outcome

The exact-version compatibility matrix passes for MapLibre GL JS `5.24.0`
and stable `6.1.0` at revision `3b10a6ba`. An independent unrestricted root run
of `pnpm test:compat:maplibre` exited `0`. Both isolated consumers installed
the requested version natively, compiled the packed public engine API under
strict TypeScript, built the generated ESM application, and passed real
Chromium behavior and strict pixel checks.

The authoritative summary was generated at `2026-08-03T18:01:37.519Z` with
Chromium `148.0.7778.96`. Both entries record `status: "passed"`,
`peerRangeSatisfied: true`, `peerResolution: "native"`, and
`nativePeerInstall: { status: "passed", error: null }`.

Revision `d672f3f2` closes the follow-up evidence-integrity findings without
rerunning either browser matrix: CI keeps the two exact-version jobs, downloads
their per-version JSON artifacts, and runs a strict aggregation-only mode. The
aggregator fails closed on a missing version, mismatched version label,
duplicate entry, non-passing status, or invalid timing. Console errors are now
queued synchronously by `message.text()`, while argument details are
best-effort enrichment; the page closes and the queue drains before the final
zero-error assertion and evidence write.

This is runtime-compatibility evidence only. The release baseline remains
`5.24.0`; the optional peer range, workspace dependency state, and lockfile did
not change.

## Exact Matrix

| Evidence | `5.24.0` | `6.1.0` |
| --- | --- | --- |
| Exact native install | Requested/installed `5.24.0`; native status `passed`, peer resolution `native` | Requested/installed `6.1.0`; native status `passed`, peer resolution `native` |
| Public API strict compile | Pass | Pass |
| Generated ESM build | Pass | Pass |
| Import/package shape | Named ESM consumer import; package default/UMD artifact available | Named ESM consumer import; `main: null`, `dist/maplibre-gl.mjs`, no UMD artifact |
| Worker delivery | Package-default blob worker | Explicit same-origin `maplibre-gl-worker.mjs` and `maplibre-gl-shared.mjs` |
| Browser | Chromium `148.0.7778.96` | Chromium `148.0.7778.96` |
| Lifecycle and missing image | Raw `load/idle/styleimagemissing`; adapter `load/idle/moveend`; pass | Same; pass |
| Overscaled vector query | Local maxzoom-0 MVT queried at zoom 4; rendered count `1`, source-cache count `1` | Same; rendered count `1`, source-cache count `4` |
| Adapter rendered-feature query | Count `1`; `adapterQueryPassed: true`; `adapterQueryDiagnostics: []`; identity `name=matrix`, `layer.id=matrix-point`, `source=points` | Same exact count, pass boolean, empty diagnostics, and identity |
| Canvas / console | Raw and adapter canvases `1/1`; no console errors | Raw and adapter canvases `1/1`; no console errors |
| Strict visual | Pass; accepted pixel metrics | Pass; identical accepted pixel metrics |
| Render / query timing | `576.9000000003725 ms` / `3.5 ms` | `588.3000000007451 ms` / `3.799999998882413 ms` |

The recorded candidate-minus-baseline delta is `+11.400000000372529 ms`
render (`+1.976%`) and `+0.2999999988824129 ms` query (`+8.571%`), or
`+11.4 ms` and `+0.3 ms` when rounded. This is one local run, so it is
diagnostic data, not a performance regression or improvement claim.

## Server-Observed Resources

The fixture HTTP server, rather than the main page Performance API, is the
authoritative request observer. Both entries requested
`/tiles/0/0/0.pbf`. The `6.1.0` entry also requested
`/maplibre-gl-worker.mjs` and `/maplibre-gl-shared.mjs`. Page-level resource
timing remains supplementary because worker fetches are not guaranteed to
appear in the main page timeline.

The fixture declares the current engine's Ajv runtime requirement explicitly
with `script-src 'self' 'unsafe-eval'`. Worker policy remains explicit as
`worker-src 'self' blob:`: v5 uses blob delivery and v6 uses same-origin module
assets.

## TDD And Verification

- RED: the first focused run failed 7 assertions against the former
  `6.0.0-22` matrix and missing behavior/metadata fields.
- Diagnostic RED runs exposed and fixed an unsafe undefined wait predicate,
  missing Ajv CSP allowance, a root-relative worker tile URL rejected by v5,
  an over-exact raw-map object assertion, and reliance on main-page resource
  timing for worker requests.
- Post-pass RED: 5 focused assertions failed against the legacy peer fallback,
  count-only adapter query gate, and missing query diagnostics/feature identity.
- Mutation evidence: an adapter query result with count `1` and
  `adapterQueryPassed: false` remains failed; a rejected native peer install
  throws `MAPLIBRE_NATIVE_INSTALL_REJECTED` without a fallback install.
- Aggregation/console RED: focused framework ran 12 tests with 5 expected
  failures for missing aggregation behavior, missing CI aggregation, and the
  prior asynchronous console queue.
- Aggregation/console GREEN: the focused MapLibre framework file passed 12/12;
  full framework passed 8 files / 61 tests.
- `pnpm test:adapter` passed 11 files / 74 tests.
- `pnpm test:docs` passed 5 files / 35 tests.
- `pnpm test:resources` passed 4 files / 23 tests, covering the required
  resource-policy gate for the URL, local tile, and worker evidence surfaces.
- `pnpm --filter @gis-engine/engine build`, Biome, and `git diff --check`
  passed.
- Independent unrestricted `pnpm test:compat:maplibre` at `3b10a6ba` passed
  both exact entries and produced the evidence summarized above. The runner
  fails closed on native install rejection; neither exact entry used a
  fallback install in this successful run.
- Independent unrestricted `pnpm test:e2e:browser` passed 5/5 Chromium tests.
- Independent unrestricted
  `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual` passed 5/5
  strict scenarios: MapLibre base, generated local MVT, fill-extrusion,
  data-driven styling, and Scene3D.

## HOC-N2 Evidence Summary

- What changed: exact-version CI artifacts now converge through a strict
  aggregation-only job, and browser console evidence has a synchronous error
  queue with close-and-drain finalization.
- Test coverage: missing version, version mismatch, correct delta, CI job
  wiring, console ordering, resource policy, documentation, and the full agent
  framework are covered by the passing commands above.
- Resource implications: no new external host or resource-policy exception was
  added. Existing local tile and v6 same-origin worker/shared paths remain
  explicit; `pnpm test:resources` passed 23/23.
- MCP implications: none. No tool name, schema, descriptor, structured output,
  or diagnostics envelope changed.
- Known limitation: the full network/browser matrix was not rerun after the
  aggregation and console-harness-only hardening. The exact matrix evidence at
  `3b10a6ba` remains the runtime evidence; the next remote CI run will exercise
  both version jobs and publish the new aggregate artifact.

## Recommendations

| Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- |
| Exact native installs and all matrix stages pass for `5.24.0` and `6.1.0` | Stable v6 is runtime-compatible with the tested public adapter and generated-app boundary | `@quality` accepts the bounded compatibility evidence | high |
| Server paths prove tile and v6 worker/shared delivery | Worker fetches cannot be inferred reliably from main-page performance entries | Keep server-observed request paths as the blocking resource evidence | high |
| One local timing sample shows `+1.976%` render and `+8.571%` query deltas | A single sample cannot justify a performance or default-version decision | Retain timings as diagnostic evidence and require a dedicated adoption run for any bump | high |
| Baseline, peer range, and lockfile remain unchanged | Compatibility proof does not silently change supported defaults | Keep `5.24.0`; use a separate reviewed task for any dependency movement | high |

## Handoff

HOC-N2 is complete for the bounded #38 compatibility slice. The authoritative
machine evidence is `test-results/maplibre-compatibility/summary.json`; this
report records its reviewed outcome without approving a default dependency
change.
