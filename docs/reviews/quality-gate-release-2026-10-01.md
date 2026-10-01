---
agent: quality
period: release-2026-10-01
generated_at: 2026-10-01T12:12:00Z
repo_revision: "5883e71"
inputs:
  - AGENTS.md
  - scripts/release-verify.mjs
  - scripts/release-preflight.mjs
  - .github/workflows/release.yml
  - docs/reviews/quality-gate-2026-10-01.md
  - docs/reviews/review-fixes-builder-evidence-2026-10-01.md
  - .changeset/geoparquet-versioned-metadata.md
  - https://github.com/HYNCM/gis-engine/pull/47
  - https://github.com/HYNCM/gis-engine/actions/runs/36838718047
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

**block** for release claims on `5883e71`. The four required deterministic
gates pass, but the release path itself has never been executed end to end in
CI, and it cannot be executed off CI either.

## Machine Gate Evidence

| Gate | Status |
| --- | --- |
| `pnpm build:schema` | ✅ |
| `pnpm check` | ✅ |
| `pnpm test:snapshot:smoke` | ✅ |
| `pnpm test:release:scene3d` | ✅ |

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

1. **The release gate has never run in CI.** `release.yml` only reaches
   `pnpm release:verify` when no changeset is pending, and `.changeset/` still
   carries a pending `major` entry, so the push Release job stops after
   "Create Version Packages Pull Request" (run `36838718047`, 1m40s, no
   `release:verify` step). The committed Ubuntu pixel baselines (`c32105e`)
   have therefore never been consumed by a comparison run on an Ubuntu runner.
2. **The release path is not reproducible off CI.** `pnpm release:verify` exits
   `1` at its first step on this machine: `release-preflight` reports
   `FAIL node: expected major 22; found 26.0.0` (pnpm, Biome, the loopback
   listener, and Playwright Chromium all PASS). No Node 22 is installed here,
   so a local green run cannot be substituted for CI evidence — and a local run
   would be darwin anyway, which is precisely the platform in question.
3. **The PR that would clear the pending changeset has no gate evidence.**
   PR #47 (`chore: version packages`, head `df3bfbd`) declares
   `@gis-engine/engine: major` for the GeoParquet metadata contract. Its four
   PR runs sit in `action_required` because the head commit is authored by
   `github-actions[bot]`, so no CI result backs the merge that would trigger a
   publish.

## What is release-capable

- Deterministic suite, schema build, smoke snapshots, and the SceneView3D
  release gate are green on `5883e71`.
- The 2026-10-01 review batch is fully landed and its contracts held
  (schema-first, command-only mutation, structured diagnostics, adapter
  boundary) — see [quality-gate-2026-10-01.md](quality-gate-2026-10-01.md).
- Visual references now exist for both runner platforms and
  `tests/framework/visual-pixel-baseline.test.ts` fails if a platform frame is
  lost, so a missing baseline can no longer hide behind a silently skipped
  comparison.

## Waiver analysis

No visual-snapshot waiver is available for this window. `c32105e` added visual
fixtures, and the remaining commits (`21609d8`, `4b62370`, `5883e71`) change the
agent gate runner, a workbench race test, and planning evidence. Release claims
require the required-or-explicitly-waived visual gate to be actually exercised,
which is item 1 above.

## Path to unblock

1. @orchestrator: give CI a non-publishing way to run `release:verify` on
   `ubuntu-latest` at a chosen SHA, then accept its evidence here. Do not relax
   the strict-visual requirement to make it pass.
2. Human decision: approve the current-head runs on PR #47, review the `major`
   metadata change, and merge it only after step 1 exists.
3. @quality: re-issue this gate on the post-merge SHA, where `release:verify`
   and publish run behind the same-SHA gate.

## Handoff Required

HOC-N3 to @orchestrator: `gate_result: block`, decision_level `blocking`.
Blocking artifacts are the CI release-path evidence (step 1) and the PR #47
approval decision (step 2). Confidence: high — every claim above is a captured
command output or a CI run observation on `5883e71`.
