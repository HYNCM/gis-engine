---
agent: quality
period: release-2026-10-01
generated_at: 2026-10-01T14:05:00Z
repo_revision: "82d3933"
inputs:
  - AGENTS.md
  - scripts/release-verify.mjs
  - scripts/release-preflight.mjs
  - .github/workflows/release.yml
  - .github/workflows/release-verify.yml
  - docs/reviews/quality-gate-2026-10-01.md
  - docs/reviews/review-fixes-builder-evidence-2026-10-01.md
  - .changeset/geoparquet-versioned-metadata.md
  - https://github.com/HYNCM/gis-engine/pull/47
  - https://github.com/HYNCM/gis-engine/pull/126
  - https://github.com/HYNCM/gis-engine/actions/runs/36838718047
  - https://github.com/HYNCM/gis-engine/actions/runs/36866555879
  - https://github.com/HYNCM/gis-engine/actions/runs/36873486290
  - tests/docs/public-docs-consistency.test.ts
model_policy:
  tier: frontier-quality
  reasoning_effort: high
  note: "Use for blocking merge/release gate decisions, architecture review, and waiver review."
owner: "@quality"
decision_level: blocking
evidence_kind: specialist
gate_result: block
---

# Release Readiness Gate — 2026-10-01

## Verdict

**block** for release claims on `82d3933`. The four required deterministic
gates pass, and the release gate chain has now been executed end to end in CI
on Ubuntu, so the missing-visual-evidence blocker first recorded here is
closed. What still blocks a release claim is the publish path: the pending
`major` changeset is only cleared by merging PR #47, and CI at that PR's head
now shows the merge would break `pnpm check` on `main`.

## Machine Gate Evidence

| Gate | Status |
| --- | --- |
| `pnpm build:schema` | ✅ |
| `pnpm check` | ✅ |
| `pnpm test:snapshot:smoke` | ✅ |
| `pnpm test:release:scene3d` | ✅ |
| CI release chain at `82d3933` (`36866555879`) | ✅ 5m22s, 5 visual tests passed |
| CI release chain at PR #47 head `0219feb` (`36873486290`) | ❌ fails in `check` — see blocker 1 |

The excerpts below were captured at `5883e71`. All four gates were re-run on
`82d3933` before this re-issue: `check` `Test Files 16 passed (16) / Tests 150
passed (150)`, `test:snapshot:smoke` `4 passed (4) / 17 passed (17)`,
`test:release:scene3d` `1 passed (1) / 7 passed (7)`, `build:schema` exit 0.

<details>
<summary>Captured gate output excerpts</summary>

### pnpm build:schema

Status: `passed`

```txt
built /Users/chengming/CodeXProjects/gis-engine/packages/engine/dist/evidence-verifier.mjs
```

### pnpm check

Status: `passed`

```txt
ts/workbench/workbench-server-security.test.ts (12 tests) 3355ms
 ✓ tests/workbench/request-body.test.ts (3 tests) 3ms
 ✓ tests/workbench/workbench-migration-cli.test.ts (1 test) 1081ms
   ✓ Workbench legacy migration export > documents the explicit source and output paths without touching a database 1080ms

 Test Files  16 passed (16)
      Tests  150 passed (150)
   Start at  20:06:22
   Duration  3.85s (transform 1.42s, setup 0ms, collect 17.24s, tests 7.90s, environment 2ms, prepare 1.02s)
```

### pnpm test:snapshot:smoke

Status: `passed`

```txt
ng/CodeXProjects/gis-engine

 ✓ tests/snapshot/smoke/scene3d-mock-snapshot.test.ts (3 tests) 3ms
 ✓ tests/snapshot/smoke/snapshot-smoke.test.ts (4 tests) 7ms
 ✓ tests/snapshot/smoke/scene3d-stable-renderer-contract.test.ts (3 tests) 15ms
 ✓ tests/snapshot/smoke/scene3d-release-visual-gate.test.ts (7 tests) 159ms

 Test Files  4 passed (4)
      Tests  17 passed (17)
   Start at  20:06:27
   Duration  1.10s (transform 248ms, setup 0ms, collect 2.12s, tests 183ms, environment 0ms, prepare 222ms)
```

### pnpm test:release:scene3d

Status: `passed`

```txt
RUN  v2.1.9 /Users/chengming/CodeXProjects/gis-engine

 ✓ tests/snapshot/smoke/scene3d-release-visual-gate.test.ts (7 tests) 159ms

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  20:06:28
   Duration  959ms (transform 169ms, setup 0ms, collect 543ms, tests 159ms, environment 0ms, prepare 39ms)
```

</details>

## Why release is blocked

1. **The version-bump PR cannot pass the deterministic gate that documents the
   release it is making.** Dispatching `release-verify.yml` against PR #47's
   head (`36873486290`, SHA `0219feb`) got past `release-preflight`, `lint` and
   `build-schema` on the Node 22 runner, then failed in `check`:

   ```txt
   FAIL tests/docs/public-docs-consistency.test.ts > public docs consistency
     > marks the breaking GeoParquet contract as unreleased and records its release vehicle
   AssertionError: breaking GeoParquet contract should have a changeset:
     expected false to be true
   ```

   `tests/docs/public-docs-consistency.test.ts:351-363` requires the migration
   doc and release notes to say `Unreleased` **and** requires
   `.changeset/geoparquet-versioned-metadata.md` to still exist. `changesets/action`
   deletes that file in the same bump commit, so the two conditions are
   mutually exclusive once the bump is produced: with the changeset pending the
   push `Release` job skips `release:verify` (`if: pending == 'false'`), and
   with it consumed `check` fails. Merging `0219feb` as it stands therefore
   turns `main` red and blocks the publish it exists to trigger. The chain
   stopped before `smoke-cli-install` and `visual-snapshots`, so that head also
   has no Ubuntu visual evidence of its own. The gate is
   correct to refuse — the missing piece is a documentation state transition
   from "unreleased, changeset pending" to "released in <version>", which no
   automated bump commit can author.
2. **PR #47 has no automatic PR gate evidence either.** Its four PR-facing runs
   sit in `action_required` because the head commit is authored by
   `github-actions[bot]`. Workflow approval is decided when the run is
   *created*, before any job or `if:` expression is evaluated, so the job-level
   bot guards added by #123 cannot prevent the parking — they only mean that a
   subsequently approved bot run reports green while skipping every job. `40`
   runs across `10` bot-authored head SHAs (`0a6935e`, `311a4fc`, `9a10604`,
   `b2cfb29`, `cb60f29`, `df3bfbd`, `e7ca3c5`, `ed5abda`, `822db79`, `0219feb`)
   are parked this way. The levers that actually change the outcome are a
   one-time human workflow approval for the bot PR, or an owner-scoped token so
   `changesets/action` produces human-authored commits; both are human
   decisions, and the second one needs a repository secret this agent cannot
   create.
3. **`release:verify` is a manual gate, not a push-activated one.**
   `.github/workflows/release-verify.yml` only fires on `workflow_dispatch`, so
   it verifies the SHA it was dispatched at and nothing else. Any release claim
   must therefore name that SHA, and a different SHA needs a fresh dispatch.
   The push `Release` job still skips `release:verify` whenever a changeset is
   pending, which is the current state of `.changeset/`.

## Resolved since the first issue of this gate

1. **The release gate chain now runs in CI on Ubuntu.** PR #126 added
   `.github/workflows/release-verify.yml` (manual, `permissions: contents: read`,
   no publish, no snapshot update). Run `36866555879` at `82d3933` completed
   successfully in 5m22s on `ubuntu-latest` through `release-preflight`, `lint`,
   `build-schema`, `check`, `smoke-cli-install`, `visual-snapshots`,
   `build-cdn-dry-run`, `publish-dry-run`, and `docs-links`, with
   `visual-snapshots` reporting `Running 5 tests using 2 workers` and
   `5 passed (4.6s)` against the committed
   `tests/__snapshots__/snapshot/visual/**/*-linux.png` frames. This is the
   first time those baselines were consumed by a comparison run.
2. **Off-CI reproducibility is no longer load-bearing.** The local Node-26
   limitation stands unchanged: `release-preflight` still reports
   `FAIL node: expected major 22; found 26.0.0` on this machine, which has no
   Node 22 installed, and a darwin host could not answer an Ubuntu question
   anyway. It is recorded here as an environment limitation rather than a
   blocker because the requirement it was blocking — Ubuntu visual evidence — is
   now satisfied by CI.

## What is release-capable

- Deterministic suite, schema build, smoke snapshots, and the SceneView3D
  release gate are green on `82d3933` (locally re-run, and as steps of CI run
  `36866555879`).
- The full non-publishing release chain — preflight, lint, schema, check, CLI
  install smoke, strict visual snapshots, CDN dry-run, publish dry-run, docs
  links — is reproducible on demand at any SHA through
  `gh workflow run release-verify.yml --ref <ref>`, and passed end to end at
  `82d3933`.
- The 2026-10-01 review batch is fully landed and its contracts held
  (schema-first, command-only mutation, structured diagnostics, adapter
  boundary) — see [quality-gate-2026-10-01.md](quality-gate-2026-10-01.md).
- Visual references now exist for both runner platforms and
  `tests/framework/visual-pixel-baseline.test.ts` fails if a platform frame is
  lost, so a missing baseline can no longer hide behind a silently skipped
  comparison.

## Waiver analysis

No visual-snapshot waiver is needed or used in this window. `c32105e` added
visual fixtures, and the later commits (`21609d8`, `4b62370`, `5883e71`, plus
framework PRs #123-#126) change the agent gate runner, a workbench race test,
workflow YAML, and planning evidence. The strict visual gate has now actually
been exercised on the platform in question (`36866555879`), so the
required-or-explicitly-waived condition is satisfied by the required branch
rather than by a waiver.

## Path to unblock

1. @builder: land the release-state documentation transition that blocker 1
   shows is missing — move `docs/migration/geoparquet-versioned-metadata.md`,
   `docs/website/release-notes.md`, and the engine API reference out of
   "Unreleased / changeset pending" into the released version, and teach
   `tests/docs/public-docs-consistency.test.ts` the released-state expectations
   instead of dropping the assertion. Do not weaken the gate to make the bump
   green.
2. Human decision: choose the bot-run lever from blocker 2 — an owner-scoped
   token for `changesets/action`, or one-time approval knowing that #123 makes
   such a run skip every job — then merge PR #47 only after step 1 exists.
3. @quality: re-issue this gate at the post-merge SHA, where `release:verify`
   and publish run behind the same-SHA gate.

## Handoff Required

HOC-N3 to @orchestrator: `gate_result: block`, decision_level `blocking`.
Blocking artifacts are the release-state documentation transition (path step 1,
@builder) and the PR #47 bot-run lever (path step 2, a human repository
administrator). Confidence: high — every claim above is a captured command
output or a CI run observation: the four local gate excerpts at `5883e71` and
re-run at `82d3933`, the green CI chain at `82d3933`, and the failing CI chain
at `0219feb`.

## Re-issue Log

- `2026-10-01T12:12Z` at `5883e71` — first issue: `release:verify` never ran in
  CI, the Ubuntu baselines were unconsumed, PR #47 was unverified.
- `2026-10-01T14:05Z` at `82d3933` — the never-runs-in-CI blocker is closed by
  PR #126 and run `36866555879`; the earlier claim that #123's bot guard fixes
  the parked runs is corrected; dispatching the new workflow against PR #47's
  head (`36873486290`) exposed the docs-consistency deadlock now recorded as
  blocker 1.
