# Task 1 re-review — fix round 1 (`3c4d13c..04b5bbe`)

### Finding Verdicts

**1. `blocked[]` not canonically ordered (readiness rows tracked spec key order)** — ADDRESSED.

- Readiness rows are now copied and sorted before the loop that appends source blockers:
  `packages/engine/src/evidence/capability-matrix.ts:64-66`
  (`[...(input.readiness ?? [])].sort((a, b) => compareIds(a.sourceId, b.sourceId) || compareIds(a.type, b.type))`),
  consumed at `:68`.
- The three scene3d blockers keep the pinned literal order because they are pushed from the
  frozen `SCENE3D_BLOCKERS` literal (`:32-48`, ViewMode → Renderer → Dimensions) at `:56`,
  which is strictly before the sort/loop. The sort never touches `blocked`; it only reorders the
  local `readiness` copy, so the scene3d prefix cannot be permuted by input order (check (a)).
- Rationale comment tying it to the Task 4 `recordId` hash is present at `:61-63`.
- Test pins it: `tests/evidence/capability-matrix.test.ts:70-82` builds the same blocked set in
  forward and reversed input order, asserts exact path order `["/sources/alpha", "/sources/zeta"]`
  and `expect(reversed.blocked).toEqual(forward.blocked)`. That assertion fails against the
  pre-fix implementation (reversed would emit `/sources/zeta` first), so it is a real behavioural
  guard, not a restatement.

**2. Unescaped source ids in blocker paths** — ADDRESSED.

- `packages/engine/src/evidence/capability-matrix.ts:77` — `path: \`/sources/${escapePathSegment(entry.sourceId)}\``.
- Import added at `:3` (`../spec/patch/path.js`); the module exists at
  `packages/engine/src/spec/patch/path.ts:1-3` (`~` → `~0`, then `/` → `~1`).
- Matches the repo convention exactly, so blocker paths are joinable against diagnostics from
  other tooling: `packages/engine/src/sources/readiness.ts:327` builds
  `/sources/${escapePathSegment(sourceId)}` for the same purpose (and `spec/cloud-native/validate.ts`
  uses the same helper).
- Test pins the encoding: `tests/evidence/capability-matrix.test.ts:84-91` — id `a/b~c` →
  `/sources/a~1b~0c`, which fails pre-fix (`/sources/a/b~c`).

**3. Test quality: `as never` casts + missing `readiness-only` case** — ADDRESSED.

- Both `as never` casts are gone. A typed helper `readinessEntry(...): SourceReadinessEntry`
  (`tests/evidence/capability-matrix.test.ts:4-16`) now supplies every required field of
  `SourceReadinessEntry` (`packages/engine/src/sources/readiness.ts:56-71`: `sourceId, type,
  state, displayReady, queryReady, resourcePolicy, diagnostics, limitations, nextAction`), and the
  supported-source call site was converted (`:50`). `SourceReadinessEntry` is re-exported from the
  package root (`packages/engine/src/index.ts:130`), so the type-only import at test line 1
  resolves; the helper's `state` parameter is `SourceReadinessEntry["state"]`, so the literal
  `"readiness-only"` used at `:63` is checked against the union
  (`sources/readiness.ts:27`).
- The `readiness-only`-in-neither-set case was added: `tests/evidence/capability-matrix.test.ts:60-68`
  (asserts `available` omits `source.raster` and `blocked` is empty). Note this case also passed
  before the fix — it is coverage the review asked for, not proof of a changed behaviour.

### Specific checks requested

- (a) Sorting cannot reorder the scene3d blockers: push happens at `capability-matrix.ts:56`,
  sort/append at `:64-80`; the sort target is the `readiness` copy, not `blocked`. Fixed literal
  order at `:32-48`; default-gate order asserted at `capability-matrix.test.ts:27-31`.
- (b) Comparator is a total order and cannot throw: `compareIds` (`:27-30`) returns `0` only on
  `a === b`, otherwise `-1/1` from JS string `<` (code-unit lexicographic), which is trichotomous
  and transitive on distinct strings; `||` at `:65` adds a deterministic `type` tie-break, so
  equal ids still resolve. Both operands are typed `string` (`sources/readiness.ts:57-58`), so no
  `undefined` comparison; no locale/intl call, no exception path, no locale dependence.
  `Array.prototype.sort` is stable (ES2019), and duplicate `sourceId` keys cannot arrive from
  `Object.entries(spec.sources)`.
- (c) No caller mutation: the spread at `:64` produces a fresh mutable array from the
  `readonly SourceReadinessEntry[]` (`:22`); `.sort()` mutates only that copy. The caller's
  `input.readiness` reference and its element objects are untouched (elements are read-only in the
  loop; a new blocker object is built at `:74-78`).
- (d) No double escaping, `/sources/parcels` intact: `escapePathSegment` is applied once, only to
  `entry.sourceId`; the `/sources/` prefix is a literal outside the call (`:77`). `parcels`
  contains no `~` or `/`, so it maps to itself and the existing expectation at
  `capability-matrix.test.ts:53-55` still holds. Escaping is injective (`unescapePathSegment`
  round-trips, `spec/patch/path.ts:33-35`), so distinct ids cannot collapse to one path.
- (e) New tests assert behavior, not implementation: the ordering test permutes inputs and compares
  two derived matrices (`:70-82`); the escaping test pins the pointer encoding against an external
  convention (`:84-91`); the readiness-only test pins the no-over-claim boundary (`:60-68`). None
  of them re-implements the comparator or the escape function inline. The `compareIds`/`type`
  tie-break itself has no dedicated test, but it is not observable through `path` alone and is a
  determinism belt-and-braces tie-break.

### Report claim verification

- The fix report names the covering test (`pnpm test:evidence`) and shows `8 tests / 8 passed`
  (`task-1-report.md:149-161`). The test file contains exactly 8 `it(...)` blocks
  (`tests/evidence/capability-matrix.test.ts:23,34,40,47,60,70,84,93`), consistent with the claim.
- The plan was amended to match the implementation, as the fix note claims
  (`docs/superpowers/plans/2026-09-26-evidence-record.md:239` `escapePathSegment` import,
  `:263` `compareIds`, `:300-301` sort, `:313` escaped path, `:320` sorted `available`), and its
  Task 1 Step 1 test block now carries the three new cases (`:178, :188, :202`).
- Downstream compatibility: the Task 5 verifier in the plan compares blocked sets by sorted code
  lists (`docs/superpowers/plans/2026-09-26-evidence-record.md:1697-1698`), so a canonically
  ordered `blocked[]` is compatible with drift detection rather than conflicting with it.

### New Breakage in the Fix Diff

None Critical or Important.

- **Minor (plan text, in the fix diff):** `docs/superpowers/plans/2026-09-26-evidence-record.md:357`
  still states `Expected: PASS（5 passed）` for Task 1 Step 5, while the same commits expanded the
  plan's Step 1 test block to 8 tests. A literal re-run of the amended plan would see 8 passed
  against a 5-passed expectation. Non-blocking doc drift; fix with a one-line plan edit.
- **Minor (coverage nit):** no test combines the default `blocked` gate with blocked readiness, so
  nothing pins "scene3d prefix first, then sorted source blockers" as a single array
  (`capability-matrix.test.ts:70-82` runs at gate `stable`, `:23-32` runs without readiness).
  The implementation is correct by construction (`:56` before `:64-80`), but a future refactor that
  moved the scene3d push after the loop would not be caught by the current suite.
- **Nit (no behavioural effect):** `readinessEntry` derives `displayReady`/`queryReady` from
  `state` (`tests/evidence/capability-matrix.test.ts:9-10`), which does not mirror real readiness
  semantics (`sources/readiness.ts:176` marks a supported raster `displayReady: true`,
  `queryReady: false`). Those fields are not consumed by `buildEngineCapabilityMatrix`, so this is
  only a fidelity comment about the fixture.

### Out-of-Scope Observations

- `Task 1 report` self-review item 1 (`task-1-report.md:95-105`) documents the brief's
  `available`-ordering conflict; the resolution now lives in the amended plan and is covered by
  `capability-matrix.test.ts:93-105`. No action for this round.
- Task 2 (`plan:553`) will call `buildEngineCapabilityMatrix` with `createSourceReadinessReport`
  output; the canonical ordering added here is what makes that envelope stable, so Task 2 should
  not re-sort `blocked` — flag for the Task 2 review rather than this one.

### Verdict

**Fix round:** All findings addressed, no new Critical/Important breakage.
