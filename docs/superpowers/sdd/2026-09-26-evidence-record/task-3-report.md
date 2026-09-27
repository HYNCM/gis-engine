# Task 3 report — `canonicalHash` 唯一实现 + 三处哈希收敛

```yaml
agent: builder (evidence-record-a slice, Task 3)
period: 2026-09
generated_at: 2026-09-27T02:00:00+08:00
repo_revision: "1587c33"
inputs:
  - docs/superpowers/plans/2026-09-26-evidence-record.md (Task 3 section, lines 595-760)
owner: "@builder"
decision_level: info
```

## 0. Brief-file note (deviation from dispatch instructions)

The dispatch pointed at
`.superpowers/sdd/2026-09-26-evidence-record/task-3-brief.md`, which **does not exist**
(directory contains only task-1/task-2 briefs, reports, reviews, and the progress ledger).
I used the repo-committed plan, `docs/superpowers/plans/2026-09-26-evidence-record.md`
"## Task 3" (line 595 ff.), as the authoritative requirements — it is complete and
self-consistent, contains the exact verbatim values the dispatch referenced (function names,
`sha256:` format string, key-sort rule, the three sites, the Step 2/Step 7 test code), and
progress.md's pre-flight scan references Task 3 by plan line ranges. The plan section and the
dispatch's "decisions already made" agree at every point I could check, so I proceeded rather
than stopping; if the controller's brief file differs from the plan section in any way,
re-validate against it.

## 1. What I implemented

Exactly the plan's Task 3, TDD order (Step 1 baseline → Step 2 failing test → Step 4
implementation → Steps 5/6 convergence → Step 7 pinning test → Step 8 single commit):

- **Created `packages/engine/src/evidence/record.ts`** — the single canonical primitive,
  byte-for-byte the plan's Step 4 code: `canonicalStringify` (recursive; object keys
  `.sort()`ed; arrays order-significant; `JSON.stringify(value) ?? "null"` normalises
  `undefined` → `null`; null passthrough) and
  `canonicalHash(value): "sha256:<64 hex>"`.
- **Created `tests/evidence/canonical-hash.test.ts`** — the plan's Step 2 four cases verbatim
  plus the Step 7 convergence guard (source-text scan asserting no `function stableStringify`
  and no `createHash("sha256").update(JSON.stringify` in the two converged files).
- **`packages/engine/src/evidence/index.ts`** — appended
  `export { canonicalHash, canonicalStringify } from "./record.js";` (plan Step 4).
- **`packages/engine/src/index.ts`** — added `canonicalHash`, `canonicalStringify` to the
  existing evidence barrel-export block (dispatch: "add your new symbols to that existing
  barrel"; the Step 2 test imports from `@gis-engine/engine`).
- **Site 1, `packages/engine/src/sources/pmtiles-query.ts`** — deleted the private
  `stableStringify` (old lines 762-770); `digestStableValue` now feeds on
  `canonicalStringify` while keeping its `fnv1a32:<8 hex>` summary format verbatim per plan
  Step 5. Added `import { canonicalStringify } from "../evidence/record.js";` at top
  (Biome import order).
- **Site 2, `packages/ai/src/tools/generationEvidence.ts`** — `spatialQueryFixtureHash`
  returns `canonicalHash(fixture)`; removed the now-unused `createHash` import (verified
  sole other use was line 1292). `sha256:` prefix format unchanged.
- **`apps/studio/vite.config.ts`** — added `build.rollupOptions.external: ["node:crypto"]`
  with a comment (see §5; forced by the plan, not a scope grab).

## 2. Step 1 baseline capture

Commands: `pnpm test:schema && pnpm test:ai && pnpm test:runtime` (baseline, all green:
137/305/18) plus `grep -rn "fixtureHash" tests | head` and repo-wide greps for
`fnv1a32:` / `sha256:<hex>` literals.

Tests pinning hash literals at baseline:

| Location | Pinned value | Touches my convergence sites? |
| --- | --- | --- |
| `tests/ai/generation-evidence.test.ts:494-495` | only the **shape** `/^sha256:[a-f0-9]{64}$/` + cross-run determinism of `fixtureHash` — no literal hex pinned | Yes (site 2), shape/determinism preserved |
| `tests/examples/ai-map-workbench.test.ts:1535` | literal `sha256:98336f…b1ac` — but this is the workbench example's `promptHash` over a raw **string** (`examples/ai-map-workbench/openai-compatible-provider.mjs:210` hashes `message` text directly, no canonical stringify) | No — not one of the three sites; untouched |
| `fnv1a32` literals in `tests/**` | **none exist** — `grep -rEn "fnv1a32:[0-9a-f]{8}" tests` is empty; no `fixtureDigest`/`fnv1a32` values persisted in any test, fixture, or JSON artifact | Site 1 digests are computed-only in tests |

So no test pinned a literal digest value produced by either converged implementation.

## 3. Hash values that changed after convergence

**Expected-value diffs observed in test output: none.** All suites stayed green, so no test's
expected hash moved. But two behavioral notes, per the brief's demand for honesty:

1. **Site 2 (`spatialQueryFixtureHash`) output values DID change for non-pre-sorted fixtures —
   judgement: expected change, not implementation error.** The old code used raw
   `JSON.stringify(fixture)` (insertion order), where the fixture literal's key order is
   `id, operation, query, requestedLayerIds, layerIds, sourceIds, resultLimit` — NOT sorted
   (`layerIds`/`sourceIds` land after `requestedLayerIds`/`resultLimit` alphabetically:
   sorted order puts `layerIds` before `operation`). Concretely, for a representative fixture:
   - old: `sha256:af219a7170f71d49cab8f11a54d42b3f16974b915ae3ccbe2f5128a9e58de534`
   - new: `sha256:a59f7df2dda5bab403ebd0e2aad8cc26ca7f70f836c9e390c80a8d51cec3a0e3`
   Any previously generated `fixtureHash` in published evidence artifacts moves with this
   change. This is precisely the convergence the task exists to perform (old impl was the
   divergent one: order-sensitive stringification under a "canonical" contract), the prefix
   format is unchanged as required, and no repo test or fixture pinned the old literals, so
   nothing needed batch-updating. **Flagging it for @quality/Task 7**: Task 7 changes the
   published `evidence.json` format anyway and routes that judgement to @quality — consumers
   comparing historical `fixtureHash` values will see this delta.
2. **Site 1 (`fnv1a32` summaries): no diff, format preserved as required.** The two
   implementations differ only in the `?? "null"` fallback, which is reachable solely when the
   top-level `value` stringifies to `undefined` (i.e. `undefined`/function/symbol input).
   Both call sites pass objects/arrays (`{sourceId, features:[…]}` at :180, an array at :380),
   and all nested fields (`key`, `sourceLayer`, `bbox`) are required non-optional types, so
   no input in practice contains `undefined`. Plan Step 5's warning scenario did not
   materialise: all resource/runtime/adapter/snapshot suites pass unchanged, confirming the
   `fnv1a32` output format is byte-identical on real inputs. Convergence of implementation did
   not change output format — no conflict requiring escalation.

## 4. TDD evidence

- **RED** — `pnpm vitest run tests/evidence/canonical-hash.test.ts` (after Step 2, before Step 4):
  `Test Files 1 failed (1) / Tests 4 failed (4)`, e.g.
  `TypeError: canonicalHash is not a function` at line 23 (and `canonicalStringify is not a
  function`). Expected: symbols didn't exist yet. (One intermediate red after Step 4: the root
  barrel `packages/engine/src/index.ts` hadn't been updated — the test imports
  `@gis-engine/engine`, and per the dispatch the barrel is the sanctioned export path.)
- **GREEN** — same command: `Tests 4 passed (4)`; after Step 7's guard: `5 passed (5)`.
- Step 7 gate set: `pnpm test:schema` 137 ✓, `pnpm test:ai` 305 ✓ (includes the `fixtureHash`
  shape + determinism assertions), `pnpm test:runtime` 18 ✓, `pnpm test:resources` 23 ✓,
  `pnpm test:evidence` 13 ✓ (capability-matrix 8 + canonical-hash 5).
- **Full gate**: `pnpm check` (build + test + test:studio) → exit 0, 0 failures, including
  `apps/studio` vite build and the 6 studio suites (52 tests). `documentation-minimalism`
  was NOT failing; no docs-test edits made.
- Pre-commit Biome hook passed on the single commit.

## 5. `record.ts` import discipline (global constraint 3)

`packages/engine/src/evidence/record.ts` import lines — verbatim:

```ts
import { createHash } from "node:crypto";
```

That is the only value import (repo-wide grep confirms `record.ts` is the sole
`node:`-value-importer under `packages/engine/src`; `import type` usage: none needed).
Task 6's static guard will find exactly `node:crypto`.

**Consequence found and fixed (outside the plan's file list, forced):** `@gis-engine/engine`'s
root barrel re-exporting `record.js` puts `node:crypto` into `apps/studio`'s browser bundle
graph (vite aliases the barrel to `src/index.ts`). Rollup then failed:
`"createHash" is not exported by "__vite-browser-external"` (Vite's browser-external stub
can't satisfy Rollup's named-export trace, and the trace happens before tree-shaking can
drop the unused re-export). This broke `pnpm check`'s build stage. Fix: one line in
`apps/studio/vite.config.ts` — `build.rollupOptions.external: ["node:crypto"]` (with
explanatory comment). Verified: studio builds; `grep -rl "node:crypto" apps/studio/dist/assets/`
matches nothing (the import is tree-shaken out of the shipped chunks — studio never calls the
hasher); removing the line reproduces the failure, keeping it is load-bearing. Alternative
considered and rejected: having studio import a subpath barrel — but the dispatch mandates the
single existing barrel, and Tasks 4-6 will add more `record.ts` symbols to it anyway.

## 6. Files changed (all in the single commit `1587c33`)

- `packages/engine/src/evidence/record.ts` (new)
- `tests/evidence/canonical-hash.test.ts` (new)
- `packages/engine/src/evidence/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/sources/pmtiles-query.ts`
- `packages/ai/src/tools/generationEvidence.ts`
- `apps/studio/vite.config.ts`

## 7. Self-review findings

- Read the full committed diff. Convergence guard patterns match the plan verbatim;
  `/createHash\("sha256"\)\.update\(JSON\.stringify/` correctly targets the site-2 idiom and
  does not false-positive on `canonicalHash`'s own `createHash("sha256").update(canonical…`
  (which lives in `record.ts`, a file the guard doesn't scan — by design, it is the one
  allowed implementation).
- Repo sweep for a fourth private canonical-stringify: `diffSpecs.ts:410` and
  `promptPlanner.ts:172` use `Object.keys().sort()` for diff-ordering/keys, not for hashing —
  out of scope, untouched.
- Confirmed `createHash` import removal in `generationEvidence.ts` was safe (single prior use).
- `generationEvidence.ts` (~1300 lines) and `pmtiles-query.ts` (~760 lines) remain large;
  edits were surgical. Size concern noted per dispatch, no refactor beyond task.
- The `?? "null"` divergence in site-1 nested-object values (`{a: undefined}` →
  `{"a":null}` under both old and new — JSON.stringify drops undefined-valued keys inside
  plain objects identically in both; only the scalar-top-level path differs; covered in §3.2).
- Test file's path strings in the convergence guard are cwd-relative (`process.cwd()`); fine
  because `pnpm test:evidence` runs from repo root, matching how existing tests in this repo
  resolve paths.

## 8. Issues / concerns

1. Missing `task-3-brief.md` (§0) — worked from the plan section; content matched every value
   quoted in the dispatch, so low risk, but the controller should confirm no brief-only addendum existed.
2. Historical `fixtureHash` values (site 2) change as an intended consequence of convergence
   (§3.1). No repo artifact pins them; external consumers with stored bundles would see the
   delta. Recommend a line in the PR description for @quality.
3. `apps/studio/vite.config.ts` is outside the plan's Task 3 Files list (§5). It is a
   build-config, not a contract change; if the controller prefers, it can be split into its
   own commit, but keeping it with the convergence is what makes the single commit pass
   `pnpm check` on its own.
4. Site 3 of "三处哈希收敛" = `record.ts` itself (the barrel-exported canonical implementation);
   the plan's Files list matches this reading (create `record.ts` + modify the two consumer
   sites + barrel).
