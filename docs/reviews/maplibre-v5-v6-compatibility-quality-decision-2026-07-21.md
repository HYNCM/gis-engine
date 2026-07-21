---
agent: quality
period: 2026-07-21
generated_at: 2026-07-20T16:57:56Z
repo_revision: "11496faf7d1217d62ff9f14c0652e1699fff0d82"
inputs:
  - https://www.npmjs.com/package/maplibre-gl/v/5.24.0
  - https://www.npmjs.com/package/maplibre-gl/v/6.0.0-22
  - docs/planning/next-step-plan.md
  - docs/reviews/maplibre-v5-v6-compatibility-builder-evidence-2026-07-21.md
  - scripts/maplibre-compat-matrix.mjs
  - packages/engine/src/renderer/maplibre/v6-audit.ts
  - tests/adapter/maplibre-v6-audit.test.ts
  - tests/compatibility/maplibre-compatibility.spec.ts
  - tests/framework/maplibre-compat-matrix.test.ts
  - test-results/maplibre-compatibility/summary.json
owner: "@quality"
decision_level: blocking
gate_result: pass
evidence_kind: specialist
---

# MapLibre 5.24 / v6 Compatibility Quality Decision

## HOC-N3 Decision

**PASS for the bounded Task 3 compatibility-evidence slice.** Keep MapLibre
`5.24.0` as the release baseline. A dependency bump to the checked
`6.0.0-22` prerelease is **No-go**: it is runtime evidence only, is excluded by
the public peer range during native npm resolution, and requires explicit ESM
module-worker delivery in generated applications.

| Decision | Result | Evidence | Confidence |
| --- | --- | --- | --- |
| Runtime compatibility evidence | Pass | Exact-version strict type compile, Vite ESM build, raw and adapter lifecycle assertions, and Chromium visual evidence pass for `5.24.0` and `6.0.0-22` | high |
| Release baseline | Keep `5.24.0` | npm `latest` is `5.24.0`; the workspace dependency and lockfile did not move | high |
| v6 prerelease dependency bump | No-go | Native npm install returns `ERESOLVE`; the successful v6 run is explicitly `forced-evidence-only` after `--legacy-peer-deps` | high |
| Future stable-v6 consideration | Separate decision required | Adoption requires runtime evidence plus `candidateDecision: "bump-approved"`; the current report remains `keep-baseline` | high |

## Severity Findings

No Critical, Important, or Minor findings remain in the bounded Task 3 diff.

## Re-review Closure

The prior review findings and advisory are closed:

1. The generated browser test explicitly requires adapter `load`, `idle`, and
   `moveend`, raw MapLibre `load` and `idle`, one canvas for each path, and
   loaded style/tile state with no movement or console errors.
2. Strict visual acceptance now isolates the expected center feature region and
   requires more than 500 red-circle pixels plus more than 500 light-background
   pixels. Both exact versions recorded 2,347 feature pixels and 2,560
   background pixels at 320 x 200.
3. `isMapLibreV6RuntimeCompatible` reports runtime/type/visual evidence only.
   `isMapLibreV6AdoptionApproved` additionally requires an explicit
   `bump-approved` decision. The legacy compatibility helper is documented as a
   runtime-only alias.
4. Peer eligibility is derived from an actual native npm install. `5.24.0`
   installs natively; `6.0.0-22` records `npm error code ERESOLVE`, clears the
   rejected install, and retries with legacy peer resolution only for isolated
   evidence generation.

## Compatibility Evidence

| Check | `5.24.0` | `6.0.0-22` |
| --- | --- | --- |
| Exact installed version | Pass | Pass |
| Native peer install | Pass | Rejected with `ERESOLVE` as expected |
| Evidence resolution | Native | Forced, evidence-only |
| Packed public API strict compile | Pass | Pass |
| Generated Vite ESM build | Pass | Pass |
| Raw events | `load`, `idle` | `load`, `idle` |
| Adapter events | `load`, `idle`, `moveend` | `load`, `idle`, `moveend` |
| Browser readiness | Canvas, style, tiles, and settled movement assertions pass | Canvas, style, tiles, and settled movement assertions pass |
| Worker delivery | Package default | Explicit `maplibre-gl-worker.mjs` and `maplibre-gl-shared.mjs` resources |
| Strict visual | Pass, 2,347 feature pixels | Pass, 2,347 feature pixels |

The checked v6 package is exports-only ESM and requires the worker module pair
to be deployed and selected through `setWorkerUrl`. This is a generated-app
delivery constraint, not evidence for changing the core adapter dependency or
public release baseline.

## Verification Evidence

| Gate | Result |
| --- | --- |
| Focused audit and framework contracts | PASS, 2 files / 8 tests |
| `pnpm test:compat:maplibre` | PASS, two exact entries; fresh summary generated at `2026-07-20T16:53:05.052Z` |
| `pnpm test:adapter` | PASS, 73 tests |
| `pnpm test:e2e:browser` | PASS, 5 Chromium tests |
| `pnpm test:snapshot:smoke` | PASS, 15 tests |
| `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual` | PASS, 5 strict browser snapshots |
| `pnpm test:agent-framework` | PASS, 27 tests |
| `pnpm test:docs` | PASS, 34 tests |
| `pnpm --filter @gis-engine/engine build` | PASS |
| `git diff --check` | PASS |
| Default dependency and `pnpm-lock.yaml` | Unchanged |

The CI workflow contains an independent exact-version job for each matrix
entry, and the path-aware gate planner requires adapter, browser, exact-version
matrix, strict visual, and full deterministic checks for MapLibre changes.

## Constraints

| Constraint | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| v6 prerelease remains outside the supported peer install path | Native npm `ERESOLVE` evidence | Publishing it as supported would make installation claims false | Keep `5.24.0`; reconsider only against a stable v6 package and explicit peer-range decision | high |
| v6 worker modules are not copied automatically by the generated Vite build | Recorded worker/shared-module resources and prior no-worker stall | A future v6 app can compile but fail to reach lifecycle readiness | Preserve explicit worker asset delivery and rerun the strict matrix for any future adoption proposal | high |
| Runtime compatibility does not authorize adoption | Separate tested helpers and `candidateDecision: "keep-baseline"` | Prevents green runtime evidence from silently moving release defaults | Require a new HOC-N3 decision before any package, peer-range, or lockfile change | high |

This report is quality evidence only. It does not update planning state, change
the release dependency, or approve the v6 prerelease bump.
