---
agent: builder
period: 2026-07-21
generated_at: 2026-07-20T16:51:28Z
repo_revision: "11496faf7d1217d62ff9f14c0652e1699fff0d82"
inputs:
  - https://www.npmjs.com/package/maplibre-gl/v/5.24.0
  - https://www.npmjs.com/package/maplibre-gl/v/6.0.0-22
  - https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.0.0-22
  - scripts/maplibre-compat-matrix.mjs
  - packages/engine/src/renderer/maplibre/v6-audit.ts
  - packages/engine/README.md
  - test-results/maplibre-compatibility/summary.json
owner: "@builder"
decision_level: advisory
evidence_kind: specialist
---

# MapLibre 5.24 / v6 Prerelease Compatibility Evidence

## Outcome

The executable matrix passed for exact `maplibre-gl` versions `5.24.0` and
`6.0.0-22`. It packs `@gis-engine/engine`, installs each renderer in an
isolated consumer without changing the workspace lockfile, compiles the public
adapter API under strict TypeScript, builds a generated Vite example, and
requires real Chromium lifecycle, snapshot, console, and nonblank-pixel proof.

The release baseline remains `5.24.0`. The checked v6 prerelease is evidence
only: npm correctly rejects it against the public `^6.0.0` peer range unless
the isolated fixture uses explicit legacy peer resolution.

## Exact Matrix

| Version | Peer resolution | Package / ESM shape | Public types | Raw + adapter events | Strict visual |
| --- | --- | --- | --- | --- | --- |
| `5.24.0` | native install passed | `main: dist/maplibre-gl.js`; no exports map; package-default worker | pass | raw `load/idle`; adapter `load/idle/moveend`; canvases and loaded/style state asserted | pass; 2,347 center red-feature pixels and 2,560 light-background pixels |
| `6.0.0-22` | native install returned `ERESOLVE`; forced evidence-only retry | exports-only `dist/maplibre-gl.mjs`; explicit module-worker delivery | pass | raw `load/idle`; adapter `load/idle/moveend`; canvases and loaded/style state asserted | pass; 2,347 center red-feature pixels and 2,560 light-background pixels |

Both entries reported `snapshotPassed: true` and no browser console errors.

## Recorded Drift

- **Peer range:** the packed consumer first attempts a normal npm install.
  `5.24.0` passes; `6.0.0-22` returns `ERESOLVE`, after which only the isolated
  evidence fixture retries with `--legacy-peer-deps`. The matrix derives and
  records `peerRangeSatisfied` from that observed result.
- **ESM package shape:** v5 exposes `dist/maplibre-gl.js` through `main`; v6
  exposes `dist/maplibre-gl.mjs` through an exports map and has no UMD entry.
- **Worker delivery:** an initial RED diagnostic run observed v6 stalling
  before `style.load` because it derives `maplibre-gl-worker.mjs` beside
  `import.meta.url`, while Vite renames the application chunk and does not copy
  the worker or its `maplibre-gl-shared.mjs` import. That negative history is
  recorded here; the continuous matrix gates the accepted migration by copying
  both public assets and calling `setWorkerUrl` before creating either map.
- **Events and camera:** after worker delivery, the existing adapter event
  bridge compiles and emits `load`, `idle`, and `moveend` without an adapter
  source change. A raw Map control proves the same renderer state independently.
- **Compatibility versus adoption:** `isMapLibreV6RuntimeCompatible` evaluates
  runtime/type/visual failures only. `isMapLibreV6AdoptionApproved` additionally
  requires `candidateDecision: "bump-approved"`; the current report remains
  `keep-baseline`. `isMapLibreV6Compatible` is retained as a runtime-only alias.

## Recommendations

| Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- |
| Exact matrix passes both entries, but npm excludes `6.0.0-22` from `^6.0.0` | Treating the prerelease as supported would make consumer installation claims false | `@quality` keeps `5.24.0` as the default and issues the independent keep/bump decision | high |
| v6 generated apps stall before `style.load` when the module-worker pair is absent | A future v6 baseline change can compile successfully yet render no map | Any future stable-v6 proposal must define worker asset delivery and rerun this strict matrix | high |
| Raw Map and MapLibreAdapter produce matching lifecycle and pixel evidence once the worker is configured | No adapter event shim or public API widening is required for the checked prerelease | Keep the migration at the consumer/generated-app boundary; do not add a version-specific dependency to core | high |

## Verification

- `pnpm vitest run tests/adapter/maplibre-v6-audit.test.ts tests/framework/maplibre-compat-matrix.test.ts` - passed, 8 tests.
- `pnpm test:compat:maplibre` - passed both exact entries.
- `pnpm test:adapter` - passed, 73 tests.
- `pnpm test:e2e:browser` - passed, 5 Chromium tests.
- `pnpm test:snapshot:smoke` - passed, 15 tests.
- `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual` - passed, 5 strict browser snapshots.
- `pnpm test:agent-framework` - passed, 27 tests.
- `pnpm test:docs` - passed, 34 tests.
- `pnpm --filter @gis-engine/engine build` - passed.
- `pnpm-lock.yaml` - unchanged.

The raw JSON evidence is generated under
`test-results/maplibre-compatibility/summary.json` locally and uploaded per
matrix entry by `.github/workflows/ci.yml`.
