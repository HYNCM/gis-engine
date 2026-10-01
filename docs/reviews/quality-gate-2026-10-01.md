---
agent: quality
period: 2026-10-01
generated_at: 2026-10-01T07:59:00Z
repo_revision: "0ac2546"
inputs:
  - docs/reviews/project-review-2026-10-01.md
  - docs/reviews/review-fixes-builder-evidence-2026-10-01.md
  - scripts/gate-plan.mjs
  - .github/workflows/release.yml
  - .github/workflows/visual-baselines.yml
  - playwright.config.ts
owner: "@quality"
decision_level: advisory
evidence_kind: specialist
gate_result: conditional-pass
---

# Quality Gate Decision — Review Remediation Batch (2026-10-01)

## Verdict

**conditional-pass** for merge; **block** for release claims until the Linux
pixel baselines exist.

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

## Blocking condition for release

`release:verify` now runs the strict visual suite on Ubuntu runners, where no
`*-linux.png` baselines are committed. Until
`.github/workflows/visual-baselines.yml` is dispatched, its artifacts reviewed,
and the Linux references committed, any main-push Release job will fail on the
missing-baseline condition — by design, not a rendering regression.
Follow-up owner: @orchestrator (dispatch + review + commit baselines).

## Advisory carry-over items

1. `packages/cli/src/templates/community.ts` shares the P2-2 injection surface;
   assign to @builder (engine) as a small follow-up.
2. Repo-wide `pnpm lint` has pre-existing biome findings outside this batch;
   schedule a cleanup or fold it into the merge gate deliberately.
3. Remote `Agent Daily/Monthly Cadence` failures were SLA-staleness of
   specialist evidence (exit 2), addressed by this report set; monitor the next
   cadence run to confirm green.
