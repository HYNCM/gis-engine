---
agent: quality
period: 2026-08-04
generated_at: 2026-08-03T17:31:09Z
repo_revision: "e5eefe43e745a2ca26eeb520bf273561d990a589"
inputs:
  - https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.1.0
  - docs/reviews/maplibre-5.24-6.1-builder-evidence-2026-08-03.md
  - scripts/maplibre-compat-matrix.mjs
  - tests/compatibility/maplibre-compatibility.spec.ts
  - tests/framework/maplibre-compat-matrix.test.ts
  - tests/adapter/maplibre-v6-audit.test.ts
owner: "@quality"
decision_level: blocking
gate_result: block
evidence_kind: specialist
---

# MapLibre 6.1 Compatibility Quality Decision

## HOC-N3 Decision

**BLOCK for closing the compatibility-evidence slice until the real
dual-version browser matrix passes.** The focused implementation contracts are
green, but the current run has no accepted `5.24.0`/`6.1.0` summary and no
stable-v6 screenshot or timing evidence.

**No-go for dependency adoption in this slice.** Runtime compatibility and a
baseline bump are separate decisions. Even after the matrix passes, keep
`5.24.0` as the release/default baseline until an intentional dependency
proposal changes the default, updates release evidence, and receives
`candidateDecision: "bump-approved"`.

## Gate Status

| Gate | Result | Evidence |
| --- | --- | --- |
| Exact matrix contract | PASS | Focused framework and public audit tests: 2 files / 11 tests |
| Exact `5.24.0` install and strict compile | PASS in partial run | Native install, packed API `tsc`, and Vite build completed |
| `5.24.0` Chromium behavior / visual | RE-RUN REQUIRED | Diagnostic run reached ready after the CSP correction; absolute tile-template fix still needs the authoritative matrix rerun |
| Exact `6.1.0` install and browser evidence | NOT RUN | Retry stopped after the first clear browser failure |
| Adapter regression gate | PASS | 11 files / 74 tests |
| Browser E2E | BLOCK | Command exited with 5 skips; no executable browser evidence |
| Strict visual | ENVIRONMENT BLOCK | 5 failures; Chromium rendezvous registration was denied by the local sandbox |
| Default dependency movement | PASS | Baseline, peer range, workspace dependency state, and lockfile unchanged |

## Required Before Pass

1. Run `pnpm test:compat:maplibre` in a network- and WebGL-capable environment.
2. Confirm exact native installs for `5.24.0` and `6.1.0`; any version drift or
   legacy peer retry is blocking.
3. Accept raw and adapter lifecycle events, `styleimagemissing` recovery,
   overscaled local-MVT feature identity, adapter rendered-feature semantics,
   console cleanliness, strict pixels, and worker/CSP resources for both.
4. Record Chromium name/version, per-entry render/query timings, and the
   generated performance delta.
5. Pass `pnpm test:adapter`, `pnpm test:e2e:browser`, and
   `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual`.

The targeted diagnosis is not accepted release evidence. It established that
the first timeout came from the fixture CSP blocking Ajv `unsafe-eval`, then
showed MapLibre v5 rejecting a root-relative vector-tile URL. Both causes have
focused regressions; the full exact-version rerun remains mandatory.

## Recommendations

| Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- |
| Focused behavioral contracts pass but renderer proof is incomplete | Closing now would turn test intent into an unsupported compatibility claim | `@builder` supplies both raw JSON entries and screenshots; `@quality` reissues HOC-N3 | high |
| Stable v6 is eligible under the current optional peer range | A green matrix would show runtime eligibility, not authorize default movement | `@orchestrator` keeps adoption as a separate task and decision | high |
| v6 uses explicit same-origin module-worker assets while v5 uses package-default blob delivery | Generated apps can compile yet stall at runtime under incomplete CSP/asset deployment | Preserve the worker/CSP checks as blocking browser evidence | high |

This report is a fail-closed quality decision. It does not update planning
state, approve MapLibre `6.1.0` adoption, or waive renderer evidence.
