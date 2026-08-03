---
agent: builder
period: 2026-08-04
generated_at: 2026-08-03T17:49:24Z
repo_revision: "cf58b4605036d948e5e4783a2cde245eef536d91"
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
evidence_kind: specialist
---

# MapLibre 5.24 / 6.1 Compatibility Builder Evidence

## Outcome

The exact-version compatibility matrix passes for MapLibre GL JS `5.24.0`
and stable `6.1.0` at revision `cf58b46`. An independent unrestricted root run
of `pnpm test:compat:maplibre` exited `0`. Both isolated consumers installed
the requested version natively, compiled the packed public engine API under
strict TypeScript, built the generated ESM application, and passed real
Chromium behavior and strict pixel checks.

This is runtime-compatibility evidence only. The release baseline remains
`5.24.0`; the optional peer range, workspace dependency state, and lockfile did
not change.

## Exact Matrix

| Evidence | `5.24.0` | `6.1.0` |
| --- | --- | --- |
| Exact native install | Pass | Pass |
| Public API strict compile | Pass | Pass |
| Generated ESM build | Pass | Pass |
| Import/package shape | Named ESM consumer import; package default/UMD artifact available | Named ESM consumer import; `main: null`, `dist/maplibre-gl.mjs`, no UMD artifact |
| Worker delivery | Package-default blob worker | Explicit same-origin `maplibre-gl-worker.mjs` and `maplibre-gl-shared.mjs` |
| Browser | Chromium `148.0.7778.96` | Chromium `148.0.7778.96` |
| Lifecycle and missing image | Raw `load/idle/styleimagemissing`; adapter `load/idle/moveend`; pass | Same; pass |
| Overscaled vector query | Local maxzoom-0 MVT queried at zoom 4; rendered count `1`, source-cache count `1` | Same; rendered count `1`, source-cache count `4` |
| Adapter rendered-feature query | Count `1`; diagnostics empty; identity `matrix` / `matrix-point` / `points` | Same exact identity and empty diagnostics |
| Canvas / console | Raw and adapter canvases `1/1`; no console errors | Raw and adapter canvases `1/1`; no console errors |
| Strict visual | Pass; accepted pixel metrics | Pass; identical accepted pixel metrics |
| Render / query timing | `578.7 ms` / `3.6 ms` | `585.5 ms` / `3.2 ms` |

The candidate-minus-baseline delta is `+6.8 ms` render (`+1.175%`) and
`-0.4 ms` query (`-11.111%`). This is one local run, so it is diagnostic data,
not a performance regression or improvement claim.

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
- GREEN: focused audit/framework tests passed 2 files / 12 tests.
- `pnpm test:adapter` passed 11 files / 74 tests.
- `pnpm test:docs` passed 5 files / 35 tests.
- `pnpm test:agent-framework` passed 8 files / 58 tests.
- `pnpm --filter @gis-engine/engine build`, Biome, and `git diff --check`
  passed.
- Independent unrestricted `pnpm test:compat:maplibre` passed both exact
  entries and produced the evidence summarized above.
- Independent unrestricted `pnpm test:e2e:browser` passed 5/5 Chromium tests.
- Independent unrestricted
  `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual` passed 5/5
  strict scenarios: MapLibre base, generated local MVT, fill-extrusion,
  data-driven styling, and Scene3D.

## Recommendations

| Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- |
| Exact native installs and all matrix stages pass for `5.24.0` and `6.1.0` | Stable v6 is runtime-compatible with the tested public adapter and generated-app boundary | `@quality` accepts the bounded compatibility evidence | high |
| Server paths prove tile and v6 worker/shared delivery | Worker fetches cannot be inferred reliably from main-page performance entries | Keep server-observed request paths as the blocking resource evidence | high |
| One local timing sample shows only small deltas | A single sample cannot justify a performance or default-version decision | Retain timings as diagnostic evidence and require a dedicated adoption run for any bump | high |
| Baseline, peer range, and lockfile remain unchanged | Compatibility proof does not silently change supported defaults | Keep `5.24.0`; use a separate reviewed task for any dependency movement | high |

## Handoff

HOC-N2 is complete for the bounded #38 compatibility slice. The authoritative
machine evidence is `test-results/maplibre-compatibility/summary.json`; this
report records its reviewed outcome without approving a default dependency
change.
