# Task 3 review — `canonicalHash` 唯一实现 + 三处哈希收敛 (e5a5846..1587c33)

```yaml
agent: quality (task-scoped review, evidence-record-a slice, Task 3)
period: ad-hoc
generated_at: 2026-09-27T00:00:00Z
repo_revision: "1587c33"
inputs:
  - .superpowers/sdd/2026-09-26-evidence-record/task-3-brief.md
  - .superpowers/sdd/2026-09-26-evidence-record/task-3-report.md
  - .superpowers/sdd/2026-09-26-evidence-record/review-e5a5846..1587c33.diff
owner: "@quality"
decision_level: advisory
```

### Spec Compliance

- ✅ **One canonical implementation, exact plan shape.** `packages/engine/src/evidence/record.ts:3-16` is byte-equivalent to the brief's Step 4 code (brief:66-83): `canonicalStringify` recurses with `Object.keys().sort()`, arrays order-significant, `JSON.stringify(value) ?? "null"`; `canonicalHash` returns `` `sha256:${…digest("hex")}` ``. Only Task 3 content — no `EvidenceRecord` / builder / verifier scaffolding for Tasks 4-6 (16 lines total).
- ✅ **Key-sorting semantics.** Two objects differing only in key order hash identically, and the test pins the canonical output to a hand-written literal, not to the implementation's own product: `tests/evidence/canonical-hash.test.ts:8-14` (`'{"a":{"c":3,"d":2},"b":1}'`) and `:27-28` (`canonicalHash({x:1,y:"a"}) === canonicalHash({y:"a",x:1})`).
- ✅ **`"sha256:<64 hex>"` shape.** `record.ts:15`; asserted at `tests/evidence/canonical-hash.test.ts:29` (`/^sha256:[a-f0-9]{64}$/`) and still asserted at the consumer site (`tests/ai/generation-evidence.test.ts:494-495`, per implementer evidence, unchanged by diff).
- ✅ **Single commit.** The review package lists exactly one commit (`1587c33`) containing all seven changed files (diff header:7-14). Requirement met.
- ✅ **Evidence-barrel export exactly as plan Step 4.** `packages/engine/src/evidence/index.ts:8`. Root barrel `packages/engine/src/index.ts:24-25` matches the plan's File Structure table (`docs/superpowers/plans/2026-09-26-evidence-record.md:69` "导出 evidence 面") and the plan's own test import of `@gis-engine/engine` (plan:623). ⚠️ See Important #1 — plan-mandated, but I recommend re-shaping before Task 4.
- ✅ **Site 1 (`pmtiles-query.ts`): private sorter deleted, FNV format preserved.** Old `function stableStringify` (diff:189-197) fully removed; `digestStableValue` at `packages/engine/src/sources/pmtiles-query.ts:753-761` keeps the FNV-1a loop and the `fnv1a32:<8 hex>` output format verbatim (brief Step 5 code matched line for line); import added at `pmtiles-query.ts:2`. No `fnv1a32` literal is pinned anywhere in the repo (grep: only the implementation and the plan doc itself).
- ✅ **Site 2 (`generationEvidence.ts`): convergence real.** `spatialQueryFixtureHash` now `return canonicalHash(fixture)` (diff:77-78, at `packages/ai/src/tools/generationEvidence.ts:1292`); `createHash` import removed (diff:51) and grep confirms zero `createHash` residue in the file; the only remaining `JSON.stringify` (`:2154`) is a spec-equality comparison, not a hashing path.
- ✅ **Step 7 convergence guard present** at `tests/evidence/canonical-hash.test.ts:33-42`, semantically verbatim to the brief (the `sources` array is re-flowed onto one line by Biome formatting only).
- ✅ **Baseline discipline (Step 1).** The report's baseline table (task-3-report.md §2) records what pinned what; I independently verified the load-bearing claim (see Spec Compliance item ⚠️ / Adjudication 1 below).
- ✅ **Constraint 3 (record.ts import discipline).** `record.ts:1` is its only import: `import { createHash } from "node:crypto"`. A focused grep of `packages/engine/src` confirms it is the *sole* `node:` value import in the whole package at HEAD — Task 6's static guard will find exactly `node:crypto`.
- ✅ **No fourth private canonical-stringify in scope.** `function stableStringify` exists nowhere in `packages/**` anymore; `diffSpecs.ts:410` / `promptPlanner.ts:172` sort keys for diff ordering, not hashing (report §7 claim spot-checked, plausible and out of Task 3 scope).

Adjudications of the three self-reported items are folded into the Issues section.

### Strengths

- Textbook plan-fidelity: the implementation, both barrels, and both convergence sites match the brief's verbatim code, including the non-obvious decisions (keeping site 1's `fnv1a32` summary format instead of "simplifying" it to sha256, and removing the orphaned `createHash` import at site 2).
- The tests assert real algebraic properties (order-independence against a hand-written canonical literal, array-order sensitivity, `undefined`→`null` normalization) rather than snapshotting a hash the code just produced — exactly what a hashing primitive needs.
- The report's §2/§3 is unusually honest: it volunteered the site-2 value drift with concrete old/new digests, and correctly routed the consequence to @quality/Task 7 instead of burying it.
- Single-commit requirement respected even when it forced an out-of-plan config edit, with the pressure documented (§5) rather than resolved by splitting the convergence across commits.

### Issues

#### Critical (Must Fix)

None.

#### Important (Should Fix)

1. **`node:crypto` is now reachable from the browser-facing public root barrel, patched with an app-level build-config edit — plan-mandated shape; recommend re-shaping before Task 4.**
   Adjudication of report §5 (verified, not accepted):
   - Fact-checked: before this commit the engine root barrel had **zero** node-builtin value imports (`record.ts:1` is the only `node:` value import in all of `packages/engine/src` at HEAD). This commit introduces the first one into the barrel that every browser consumer imports (`apps/studio/src/components/MapStage.tsx:1`; all `examples/*/src/main.ts` import the root barrel).
   - No *live* regression today: `pnpm check`'s `pnpm build` = `pnpm -r build` includes the example packages' `vite build` scripts (verified in `examples/getting-started/package.json` etc.), and the report has those green via dist-resolution + tree-shaking. But the shape is fragile: `apps/studio/vite.config.ts:23` `external: ["node:crypto"]` means the *first* time any studio browser module imports `canonicalHash`, Rollup will happily emit a literal external `node:crypto` import into a browser chunk — a silently unresolvable runtime failure instead of a build error. The config edit doesn't make browser use safe; it makes it silent.
   - The brief and plan do mandate this surface (plan:69 "导出 evidence 面"; plan:623 imports from `@gis-engine/engine`; per report §5 the dispatch reiterated the barrel) — hence **plan-mandated**. But Tasks 4-6 have not run, and nothing in the plan requires browser consumers to call `canonicalHash` (Tasks 4/5 are Node-side build/verify; Task 6's verifier is compiled from `record.ts` directly, not from the root barrel).
   - **Recommended fix (cheap now, expensive later):** add an `./evidence` (or `./hash`) subpath to `packages/engine/package.json` `exports` (currently only `"."`, so this is a small additive change already inside Task 6's declared package.json scope, plan:70), point `tests/evidence/canonical-hash.test.ts:3` and any Node consumers at `@gis-engine/engine/evidence`, then revert `packages/engine/src/index.ts:24-25` and `apps/studio/vite.config.ts:23`. Alternative acceptable shape: keep `record.ts` out of the root barrel entirely until something outside evidence actually needs it. Either way the decision should be made by the controller before Task 4 bakes more root-barrel surface in; this is a plan amendment, not implementer error.

2. **Report §3.2/§7 rationale is factually wrong about the old/new stringifier divergence on nested `undefined` — conclusion survives, rationale must not be reused.**
   task-3-report.md:168-170 claims `{a: undefined}` renders as `{"a":null}` "under both old and new" because "JSON.stringify drops undefined-valued keys identically." It does not. The deleted `stableStringify` (diff:192-197) iterated `Object.keys()` and recursed per key, so `{a: undefined}` rendered as `{"a":undefined}` (the JS `undefined` interpolated into the template) — the old and new implementations *did* diverge for nested-`undefined` inputs, at the point the plan's Step 5 warning was specifically watching for. The **verdict** ("no diff, format preserved") is nonetheless correct: I verified both `digestStableValue` call sites (`packages/engine/src/sources/pmtiles-query.ts:181-188` and `:381-383`) consume `IndexedFixtureFeature` objects that `indexFixtureFeatures` (`pmtiles-query.ts:572-608`) filters to always have concrete `key` (`:602` stringifies), non-empty `sourceLayer` (`:579-588` drops otherwise), and non-nullish `bbox` (`:590-598` drops otherwise) — no reachable input contains `undefined`. Why Important: Task 5's trust-tier verifier re-derives chained hashes over arbitrary record data; if anyone later feeds `digestStableValue` (or assumes report §3.2's reasoning for another site) raw optional-field objects, `fnv1a32` values will differ from pre-convergence history for a reason the written rationale got wrong. Fix: correct the reasoning — either a one-line comment at `pmtiles-query.ts:753` noting digest inputs are sanitized by `indexFixtureFeatures`, or a test locking the invariant that no `undefined` reaches the hasher.

#### Minor (Nice to Have)

1. **Adjudication of report §3 item 1 — accepted.** No artifact outside the changed code pins a site-2 `fixtureHash` literal. Repo-wide grep for `sha256:[0-9a-f]{16,}` returns exactly two hits: `tests/examples/ai-map-workbench.test.ts:1535` pins a `promptHash` computed by the example's own provider over a raw message string (`examples/ai-map-workbench/openai-compatible-provider.mjs:210`, `createHash(...).update(message)` — no canonical stringify involved, untouched by this diff), and `docs/migration/v0.2-to-v0.3.md:7` is a `sha256:<32-hex>` doc placeholder for a different field. The typedoc pages under `docs/website/api/...` only declare `fixtureHash: string` schema shape. So "unpinned internal change" is accurate, the drift is the intended semantic of the task (old impl violated order-independence), and routing the published-artifact consequence to @quality/Task 7 is correct. A one-line PR-description note (report §8.2) is still warranted.
2. **No known-answer vector for `canonicalHash`.** `tests/evidence/canonical-hash.test.ts:29` checks only the shape regex. A single pinned `canonicalHash({x:1}) === "sha256:<known>"` literal would catch an accidental future change to the primitive itself (the shape test passes for any wrong sha256). The brief's Step 2 tests don't include one, so this is a plan-shape gap, not implementer drift.
3. **Convergence guard is name-literal and cwd-dependent.** `tests/evidence/canonical-hash.test.ts:36-37` misses a reintroduced sorter under a different name (`const stringifyStable = …`) or a `function stableStringify`-free re-wrap, and resolves `process.cwd()`-relative paths (would no-op-crash if run outside repo root). Verbatim from the brief (Step 7), so plan-mandated; noted for the final branch review, not actionable here.
4. **NaN/Infinity/function values collide with `null` in the canonical string.** `JSON.stringify(NaN)` → `"null"`, and the `?? "null"` fallback maps `undefined`/functions/symbols to the same token, so `{a:NaN}` and `{a:null}` hash identically (`record.ts:4`). Irrelevant for the JSON-domain inputs this repo hashes (`JsonValue`, parsed fixtures), and the implementation is the brief's verbatim code; worth a doc-comment if Tasks 4-5 ever widen the input domain. `-0` → `"0"`, non-ASCII stays raw UTF-8 (deterministic), duplicate keys are impossible post-parse — all fine.
5. **Cyclic input throws `RangeError` from recursion** rather than a structured diagnostic envelope (global constraint 7). Plan-mandated verbatim code and unreachable for JSON-parsed data; flag only if `canonicalHash` ever faces user-authored objects.

### Assessment

**Task quality:** Needs fixes
**Reasoning:** The convergence itself is correct, single-committed, and verified — all three hash sites provably share one implementation and no pinned value moved. The blocking residue is shape, not behavior: the browser-facing root barrel now transitively references `node:crypto` with an app-level `external` paper-over (Important 1, plan-mandated — the controller, not the implementer, should decide the subpath-export re-shape, and it is still cheap before Task 4), and the report's rationale for site-1 safety is wrong even though its conclusion holds (Important 2 — fix the record before Task 5 builds on it).
