---
agent: builder
period: 2026-08-04
generated_at: 2026-08-03T17:31:09Z
repo_revision: "e5eefe43e745a2ca26eeb520bf273561d990a589"
inputs:
  - https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.1.0
  - https://www.npmjs.com/package/maplibre-gl/v/5.24.0
  - https://www.npmjs.com/package/maplibre-gl/v/6.1.0
  - scripts/maplibre-compat-matrix.mjs
  - tests/compatibility/maplibre-compatibility.spec.ts
  - tests/framework/maplibre-compat-matrix.test.ts
  - packages/engine/src/renderer/maplibre/v6-audit.ts
owner: "@builder"
decision_level: advisory
evidence_kind: specialist
---

# MapLibre 5.24 / 6.1 Compatibility Builder Evidence

## Outcome

The compatibility gate now exercises exact `maplibre-gl` versions `5.24.0`
and stable `6.1.0`. The baseline and optional peer range are unchanged. Each
isolated consumer must install the requested version without drift, compile the
packed public engine API with strict TypeScript, build an ESM Vite application,
and pass real Chromium behavior and pixel checks.

The implementation and focused contracts pass. The local full matrix is not a
pass claim: exact `5.24.0` installation, strict compile, and Vite build passed,
but the Chromium run timed out before terminal evidence. Per the bounded retry
rule, `6.1.0` was not run after that first clear browser failure. CI or the root
quality run must produce both JSON entries before this evidence becomes HOC-N2
complete.

## Stable Matrix Contract

| Surface | Required evidence |
| --- | --- |
| Package | Exact installed version; package hash; native peer resolution; named ESM import form |
| Worker / CSP | v5 package-default blob worker; v6 explicit same-origin `maplibre-gl-worker.mjs` plus shared module; `worker-src 'self' blob:` |
| Events | Raw `load`, `idle`, `styleimagemissing`; adapter `load`, `idle`, `moveend` |
| Queries | Adapter `queryRenderedFeatures` semantics and exact feature count; maxzoom-0 local MVT queried at zoom 4 with expected feature identity |
| Visual | Snapshot success, one canvas per path, settled style/tile state, no console errors, nonblank and target-feature pixels |
| Performance | Browser name/version, render and query timings per entry, plus baseline-to-candidate absolute and percentage deltas |

The vector tile is generated as a deterministic local fixture and the browser
server performs no external tile fetch. Stable v6 uses its exports-only
`dist/maplibre-gl.mjs` path and explicit module-worker delivery.

## TDD Evidence

- RED: focused audit/framework run failed 7 assertions against the former
  `6.0.0-22` matrix and missing behavior/metadata fields.
- GREEN: `pnpm vitest run tests/framework/maplibre-compat-matrix.test.ts tests/adapter/maplibre-v6-audit.test.ts`
  passed 2 files / 11 tests.
- Full matrix attempt: native sandbox run stalled during package installation
  and was interrupted; one escalated run passed exact `5.24.0` install, packed
  API strict compile, and Vite build, then failed at the Chromium readiness
  step after 30 seconds. No dual-version summary was accepted.
- Targeted retained-fixture diagnosis found two deterministic fixture faults.
  The initial CSP blocked Ajv schema compilation because `unsafe-eval` was not
  declared; after declaring it explicitly, the fixture reached ready in about
  600 ms. The remaining empty overscaled query was traced to MapLibre v5
  rejecting the root-relative tile request. The source now uses an absolute
  same-origin URL template while preserving `{z}/{x}/{y}` placeholders.
- `pnpm test:adapter` passed 11 files / 74 tests.
- `pnpm test:e2e:browser` exited successfully with all 5 tests skipped in the
  restricted environment, so it is not browser evidence.
- Strict visual attempted 5 tests; all failed closed because Chromium could not
  register its macOS rendezvous service (`Permission denied (1100)`).

## Recommendations

| Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- |
| Stable `6.1.0` was released on 2026-07-30 and is inside the existing peer range; source checked 2026-08-04 | Stable-v6 compatibility can now be tested without prerelease peer forcing | `@quality` reruns the exact two-entry matrix in the release-capable environment | high |
| Browser evidence is incomplete in this run | Compile/build success alone cannot prove worker, query, event, or pixel behavior | Keep HOC-N2 incomplete until both result JSON files and screenshots pass | high |
| Retained 5.24 diagnostics showed Ajv needs `unsafe-eval` and MapLibre v5 needs an absolute tile request URL | A superficially strict CSP or root-relative test tile can prevent the renderer from starting or make overscaling evidence empty | Record both CSP script and worker sources; keep serialized console errors and source-state diagnostics in the browser gate | high |
| The baseline, peer range, workspace dependency state, and lockfile remain unchanged | Compatibility investigation does not silently become dependency adoption | Keep `5.24.0`; require a separate reviewed bump commit for any default change | high |

## Handoff

`@quality` must run `pnpm test:compat:maplibre` and confirm both exact entries,
then run adapter, browser E2E, and strict visual gates. The generated
`test-results/maplibre-compatibility/summary.json` is the authoritative timing
and observed-behavior evidence; this report does not substitute for it.
