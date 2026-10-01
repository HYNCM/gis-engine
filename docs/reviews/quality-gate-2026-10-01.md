---
agent: quality
period: 2026-10-01
generated_at: 2026-10-01T08:55:00Z
repo_revision: "4b62370"
inputs:
  - docs/reviews/project-review-2026-10-01.md
  - docs/reviews/review-fixes-builder-evidence-2026-10-01.md
  - scripts/gate-plan.mjs
  - .github/workflows/release.yml
  - .github/workflows/visual-baselines.yml
  - playwright.config.ts
  - https://github.com/HYNCM/gis-engine/actions/runs/36834064620
owner: "@quality"
decision_level: advisory
evidence_kind: specialist
gate_result: conditional-pass
---

# Quality Gate Decision — Review Remediation Batch (2026-10-01)

## Verdict

**conditional-pass** for merge. The Linux pixel-baseline release blocker raised
in the first revision of this report is **closed**; one new release condition
replaces it (see "Blocking condition for release").

All nine findings from `docs/reviews/project-review-2026-10-01.md` are
remediated with regression tests that were observed failing first. The batch
itself was re-verified on the merged local tree (repo_revision 0ac2546):

| Gate | Result |
| --- | --- |
| `pnpm build:schema` + `pnpm build` | pass (exit 0) |
| `pnpm check` (deterministic full suite, incl. workbench) | pass (exit 0, 3 consecutive runs) |
| `pnpm test:snapshot:smoke` | pass |
| `GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual` | pass (5/5 vs committed darwin baselines) |
| `pnpm test:e2e:browser` (real MapLibre camera, E2E-7) | pass (7/7) |
| `pnpm test:e2e:node` | pass (11/11 — includes the previously red destroy lifecycle step) |
| `pnpm test:release:scene3d` | pass (7/7) |
| `pnpm test:compat:maplibre` | pass (all exact versions) |
| Workbench install/build/preflight/artifact-hash delivery gate | pass |
| Doc cross-reference audit (`node scripts/doc-generator.mjs links`) | pass, zero broken refs |

## Contract re-checks

- P1-5: `release.yml` publish steps are now gated by `pnpm release:verify` on
  the same SHA, with Playwright Chromium installed first; `npm-publish.yml`
  inherits through `needs`. Asserted by workflow-order guardrail tests.
- P1-6: comparison runs cannot author reference frames
  (`updateSnapshots: "all" : "none"`), proven by a behavioral probe spec that
  fails twice on a missing baseline and writes only under `SNAPSHOT_UPDATE=1`.
- AGENTS.md boundaries held: mutation stayed command-only, diagnostics stayed
  structured (`SECURITY.URL_BLOCKED`, `RENDER.DESTROYED` paths unchanged),
  renderer behavior stayed behind the adapter contract.

## Linux pixel baselines — closed

Visual Baselines run `36834064620` generated the five Ubuntu frames
(`SNAPSHOT_UPDATE=1` on `ubuntu-latest`), the step log recorded
`A snapshot doesn't exist ... writing actual` for each one, and all five were
reviewed frame by frame before commit `c32105e`. They are byte-identical to the
macOS references, so these fixtures render deterministically across runners.
`tests/framework/visual-pixel-baseline.test.ts` now fails if any scene loses a
platform frame, which is what a missing baseline used to hide behind.

## Blocking condition for release

`pnpm release:verify` runs the strict visual suite on `ubuntu-latest`, and the
push-triggered Release job has not exercised that path yet: while changesets are
pending it stops after "Create Version Packages Pull Request" (run `36838718047`,
1m40s, no `release:verify` step). The Ubuntu frames are therefore reviewed and
committed but never consumed by CI. Close this by running
`GIS_ENGINE_REQUIRE_VISUAL_SNAPSHOT=1 pnpm test:snapshot:visual` on an Ubuntu
runner once through the release path, or by dispatching it deliberately before
the next release claim.
Follow-up owner: @orchestrator (release-day verification), @quality (accept the
evidence).

## CI failures found after the merge push

Both were pre-existing and were exposed, not caused, by this batch:

1. `scripts/agent-runner.mjs` capped every gate at 120s while `pnpm check` is
   build plus the whole suite. Run `36835161332` timed out at 154s; run
   `36837116539` cleared the same four gates in 118s, i.e. two seconds under the
   cap — the daily quality evidence was a coin flip, and the failure excerpt
   reached only a report that push runs never upload. Fixed in `21609d8`
   (30-minute budget, excerpt logged, `maxBuffer` raised).
2. `tests/workbench/workbench-chat-session.test.ts` raced a second chat edit
   against a held provider response without synchronising on the handler
   entering it. CI run `36837116518` (macos-latest) served the second request
   first, so the "stale" result was legitimately current and returned 200
   instead of 409. Fixed in `4b62370`; the race did not reproduce locally in 20
   runs, so the fix follows the CI evidence rather than a local repro.

## Advisory carry-over items

1. `packages/cli/src/templates/community.ts` shares the P2-2 injection surface;
   assign to @builder (engine) as a small follow-up.
2. Repo-wide `pnpm lint` has pre-existing biome findings outside this batch;
   schedule a cleanup or fold it into the merge gate deliberately.
3. Remote `Agent Daily/Monthly Cadence` failures were SLA-staleness of
   specialist evidence (exit 2), addressed by this report set; the daily cadence
   has been green since run `36837116539`. The Monthly run `36817352239` still
   shows the pre-fix failure and has not been re-run.
4. PR #47 (`chore: version packages`) workflow runs keep landing in
   `action_required`; the runs need a one-time approval or a repository
   approval-setting change, which is a human decision.

