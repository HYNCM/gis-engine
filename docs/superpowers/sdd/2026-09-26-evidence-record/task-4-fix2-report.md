# Task 4 fix-2 report: totalise the exclusions canonicalisation (constraint 7)

```yaml
agent: builder
period: 2026-09-27
repo_revision: f3a43d1
owner: "@builder"
decision_level: info
```

## What I read

- `packages/engine/src/evidence/record.ts` (full, before editing)
- `tests/evidence/record-build.test.ts` (full)
- `docs/superpowers/plans/2026-09-26-evidence-record.md` lines ~1080–1155 (Task 4 Step 3/4 code block)
- `vitest.config.ts` (confirmed `@gis-engine/engine/evidence` aliases to `packages/engine/src`, so tests exercise source, not `dist/`)

## The finding

`buildEvidenceRecord` evaluated `[...new Set(input.exclusions ?? DEFAULT_EXCLUSIONS)]` inside the
record literal, before `structuralIssues` ran. A non-iterable, non-nullish `exclusions`
(`{}`, `42`, `true`) threw `TypeError: object is not iterable` — a constraint-7 violation
(failures must be structured diagnostics, never throws), the same class ruled unacceptable in I-2.

## Changes (3 files, one commit `f3a43d1`)

1. `packages/engine/src/evidence/record.ts` — canonicalise only arrays; anything else falls
   through untouched to the validator's existing non-array check
   (`/exclusions must be a non-empty array.` at `/exclusions`):

   ```ts
   exclusions: Array.isArray(input.exclusions)
     ? [...new Set(input.exclusions)].sort()
     : (input.exclusions ?? DEFAULT_EXCLUSIONS),
   ```

   Comment keeps the load-bearing "sorted + de-duplicated because canonical hashing preserves
   array order" rationale and adds the before-structuralIssues / constraint-7 note. Nothing else
   in the function was touched.
2. `tests/evidence/record-build.test.ts` — new cases (see below).
3. `docs/superpowers/plans/2026-09-26-evidence-record.md` — Task 4 Step 3/4 code block amended to
   the shipped totalised form plus a one-line note that the canonicalisation must not run before
   the array check (constraint 7). Nothing else in the plan rewritten.

New tests:
- parameterised `{}`, `42`, `true` → `ok === false`, diagnostic
  `{ code: "EVIDENCE.RECORD_INVALID", path: "/exclusions" }`
- `"ab"` → still rejected (ok false, all diagnostics EVIDENCE.RECORD_INVALID, path `/exclusions`
  or `/exclusions/0`). Note: before the fix the string was spread into `["a","b"]` and rejected at
  `/exclusions/0`; after the fix it is a non-array and is rejected at `/exclusions` by the
  validator's existing check. "Rejected as an EVIDENCE.RECORD_INVALID diagnostic, never thrown"
  is the invariant; the exact sub-index path legitimately changes, so the assertion pins the
  invariant rather than the pre-fix path.
- `[]` → rejected at `/exclusions`; `["NOPE"]` → rejected at `/exclusions/0` (paths stable)
- defaults and order/duplicate canonicalisation remain covered by the pre-existing tests
  ("records exclusions by default…", "produces one recordId per exclusion set…"), untouched.

## Red-first evidence (before source change)

`pnpm exec vitest run tests/evidence/record-build.test.ts` → exit 1, `Tests 3 failed | 18 passed (21)`;
each of the 3 failures was the expected TypeError at `record.ts:126`, e.g.:
`TypeError: number 42 is not iterable (cannot read property Symbol(Symbol.iterator))`
(full log: /tmp/record-build-red.log)

After the guard: exit 0, `Tests 21 passed (21)` (/tmp/record-build-green.log).

## Mutation proof

Temporarily reverted only the `Array.isArray` guard to
`[...new Set(input.exclusions ?? DEFAULT_EXCLUSIONS)].sort()` (via script against a byte-copy):
vitest → exit 1, 3 failed, 3 TypeError occurrences (/tmp/record-build-mutation.log).
Restored from the copy; re-ran → exit 0 21/21; `git diff` showed exactly the intended guard +
comment hunk, no experiment leftovers.

## Gates (real exit codes)

| Gate | Command | Exit | Result |
| --- | --- | --- | --- |
| schema | `pnpm build:schema` | 0 | no tracked regeneration drift |
| focused tests | `pnpm exec vitest run tests/evidence tests/schema-sync` | 0 | 4 files, 61 passed (was 56 + 5 new) |
| deterministic | `pnpm check` | 0 | full gate incl. Vite build green |

## Commit

- `f3a43d1 fix(evidence): keep the exclusions canonicalisation total over non-array input`
- 3 files changed, 56 insertions(+), 3 deletions(-). Pre-commit Biome reported two `useTemplate`
  **infos** on pre-existing lines (record.ts placeholder, baseInput promptHash) — infos, not errors;
  no `--no-verify`, no `biome-ignore`. Tree clean after commit.

## Deliberately not done

- No `DERIVED_TOP_LEVEL` refactor, no fixture dedup, no `pnpm docs:api` (parked minors).
- No changes to `MAX_EVIDENCE_RECORD_BYTES`, the recordId normalisation expression, the schema,
  or any test I did not write for this finding.
- No branch/worktree/stash/reset/checkout/push operations; `dist/` and `.superpowers/` not committed.

## Concerns

- Behaviour note (not a defect): with the guard, iterable non-array values like `"ab"` are now
  diagnosed at `/exclusions` (non-array check) instead of `/exclusions/0` (member check). This is
  exactly what "fall through untouched to the validator's existing non-array check" prescribes;
  flagged above for the record.
- The plan file is a binding brief for Task 5; its code block now matches the shipped form, so the
  verifier side will not re-introduce the throwing pattern.
