---
agent: builder
period: 2026-10-01
generated_at: 2026-10-01T07:58:00Z
repo_revision: "0ac2546"
inputs:
  - docs/reviews/project-review-2026-10-01.md
  - packages/engine/src/spec/resource-policy.ts
  - packages/engine/src/runtime/MapRuntime.ts
  - packages/engine/src/renderer/maplibre/styleDiff.ts
  - packages/cli/src/templates/index.ts
  - apps/workbench/server/index.mjs
  - tests/e2e/render-pipeline.spec.ts
owner: "@builder"
decision_level: advisory
evidence_kind: specialist
focus_area: engine
feature: "project-review-2026-10-01 remediation (6xP1 + 3xP2)"
status: ready-for-review
---

# Builder Evidence — Review Remediation 2026-10-01

Nine findings from `docs/reviews/project-review-2026-10-01.md` were remediated
test-first (RED observed before each implementation, GREEN after). Commits on
`main` at repo_revision 0ac2546: 121061d, ba98075, 76c896b, 0626798, e251a4f,
7e1cb8d, 0ac2546.

## Implemented fixes

| Finding | Change | Regression evidence |
| --- | --- | --- |
| P1-1 backslash host-allowlist bypass | `resource-policy.ts` normalizes `\` in URL/tile paths before host checks; bypass now returns `SECURITY.URL_BLOCKED` | `tests/schema/resource-policy.test.ts` |
| P1-2 apply network-confirmation boundary | Workbench submit path re-validates network resource confirmation server-side | `tests/workbench/workbench-api.test.ts` |
| P1-3 local server trust boundary | Origin/Host validation plus token on the Workbench dev server | `tests/workbench/workbench-server-security.test.ts` (5 cases) |
| P1-4 real camera sync | `/view` patches drive `jumpTo` / bounds-only `fitBounds` in `styleDiff.ts` | `tests/adapter/maplibre-style-diff.test.ts` + in-browser E2E-7 in `tests/e2e/render-pipeline.spec.ts` asserting live map center/zoom/bearing (RED reproduced the stale-camera symptom first) |
| P1-5 same-SHA release gate | `release.yml` runs `pnpm release:verify` before `release:publish`; `release-verify.mjs` executes strict visual snapshots | `tests/docs/publish-dry-guardrails.test.ts`, `tests/docs/release-verify-guardrails.test.ts` |
| P1-6 baseline writer policy | `playwright.config.ts` `updateSnapshots: "all" : "none"`; comparison runs can never author reference frames; `.github/workflows/visual-baselines.yml` provides the explicit Linux-runner generation path | `tests/framework/visual-pixel-baseline.test.ts` behavioral probe (two consecutive loud failures on a missing baseline, write only under `SNAPSHOT_UPDATE=1`) |
| P2-1 destroy concurrency | `MapRuntime` enters `#closing` synchronously in `destroy()`; late applies rejected, accepted queue still settles; `snapshot`/`queryFeatures` throw synchronously after destroy | `tests/runtime/map-runtime.test.ts` (15 cases), `tests/resources/resource-release.test.ts`; also fixes the pre-existing HEAD regression in `tests/e2e/render-pipeline.test.ts` step 6 |
| P2-2 export escaping | `jsStringInner`/`htmlText` helpers applied to project-name interpolation in CLI template JS strings, HTML titles, and the Workbench delivery entry | `tests/cli/export-escaping.test.ts` (TypeScript parser asserts generated code parses for `Cities "2026" \ C:\data\n` names) |
| P2-3 gate-plan triggers | `playwright.config.ts`, `tests/__snapshots__/**`, and all of `tests/snapshot/visual/**` now force the strict visual gate | `tests/framework/gate-plan-visual-triggers.test.ts` |

## Gate runs (local, macOS, repo_revision 0ac2546 tree)

- `pnpm build` + `pnpm build:schema`: exit 0
- `pnpm check`: exit 0 (full deterministic suite, 3 re-runs)
- `pnpm test:e2e:node`: 11 passed · `pnpm test:e2e:browser`: 7 passed (incl. E2E-7)
- `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual`: 5 passed against committed darwin baselines
- `pnpm test:release:scene3d`: 7 passed · `pnpm test:compat:maplibre`: all versions passed
- `pnpm test:workbench` / `:security` / `:e2e` / `:delivery`: exit 0

## Known follow-ups (not fixed here)

- Linux pixel baselines (`*-linux.png`) do not exist yet; they must be generated
  via `visual-baselines.yml` (workflow_dispatch) and reviewed before commit. Until
  then the strict visual gate on Ubuntu runners fails as designed.
- `packages/cli/src/templates/community.ts` interpolates `${{projectName}}` into
  the same JS-string/HTML contexts; out of review scope this round.
- Repo-wide `pnpm lint` (biome) still reports pre-existing findings in files this
  batch did not touch.
