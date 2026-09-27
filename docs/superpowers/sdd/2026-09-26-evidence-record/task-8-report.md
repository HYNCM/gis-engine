# Task 8 Report — 外部彩排：第三方复算进 smoke 步骤

```yaml
agent: builder
period: ad-hoc
generated_at: 2026-09-27T07:32:00Z
repo_revision: "0ba4074"
inputs:
  - .superpowers/sdd/2026-09-26-evidence-record/task-8-brief.md
  - scripts/cli-install-smoke.mjs
  - scripts/first-run-acceptance.mjs
  - packages/engine/src/evidence/record.ts
owner: "@builder (engine/qa focus)"
decision_level: info
```

## What was implemented

1. **`tests/framework/evidence-recompute-step.test.ts`** (new) — brief Step 1, verbatim:
   asserts the smoke script contains the step name / `evidence-verifier.mjs` / `--json`,
   and the acceptance report lists `- \`evidence.json\`` among Required Review Files.
2. **`scripts/cli-install-smoke.mjs`** — new `runStep(result, "Third-party evidence recompute", …)`
   inserted exactly between "Generated app verification" and "Prompt safety" (brief Step 2, code
   verbatim): runs the packaged `evidence-verifier.mjs` against the generated package's own
   `evidence.json` with cwd = `generatedProjectDir` via the existing `runJson(command, args, cwd)`,
   asserts `ok === true`, no `failed` assertion, and a `not-covered` `VISUAL_CONSISTENCY` row;
   then tampers `"issuer"` (breaking the record's own `recordId` chain), requires verifier exit
   code `2`, and restores the file in `finally`. All required imports (`execFileSync`,
   `readFileSync`, `writeFileSync`) already existed at `:3-4` — the brief's "补齐" was conditional
   and nothing was missing. No new shape invented; `runStep`/`assertSmokeResult` reused as-is.
3. **`scripts/first-run-acceptance.mjs`** — one line `- \`evidence.json\`` added to the
   "Required Review Files" list (brief Step 3). Report table untouched; the step flows into
   `renderSmokeBreakdown` automatically.
4. **`tests/framework/smoke-report-contract.test.ts`** — fixture step entry +
   `expect(report).toContain("| Third-party evidence recompute | passed |")` (brief Step 3).

## TDD evidence

### RED (Step 1, before any source change)

`pnpm vitest run tests/framework/evidence-recompute-step.test.ts`

```
 ❯ tests/framework/evidence-recompute-step.test.ts (2 tests | 2 failed)
   × third-party evidence recompute rehearsal > runs the shipped verifier against the generated package inside the smoke
   × third-party evidence recompute rehearsal > lists evidence.json among the required review files in the report
     → expect(acceptance).toContain("- `evidence.json`")  [Received: full first-run-acceptance.mjs source without the line]
 Test Files  1 failed (1)
      Tests  2 failed (2)
```

Expected RED because neither the step text existed in `cli-install-smoke.mjs` nor the
`evidence.json` review-file line in `first-run-acceptance.mjs`.

### GREEN (Step 4)

`pnpm vitest run tests/framework/evidence-recompute-step.test.ts tests/framework/smoke-report-contract.test.ts`

```
 ✓ tests/framework/evidence-recompute-step.test.ts (2 tests)
 ✓ tests/framework/smoke-report-contract.test.ts (5 tests)
 Test Files  2 passed (2)
      Tests  7 passed (7)
```

(Re-run after final formatting: same result, exit 0.)

## Mutation proofs

1. **Tamper branch (required by brief/instructions): neutralised the tamper inside a real full smoke.**
   Changed the tamper regex to `/"issuer-MUTANT-NOMATCH":\s*"[^"]*"/` (matches nothing → record stays
   pristine) and ran `node scripts/cli-install-smoke.mjs --keep`:
   ```
   Tampered EvidenceRecord exited with 0; expected the verifier's blocked code 2.
   EXIT=1 WALL=25s
   ```
   Red, as required: with no tamper the verifier exits 0, the in-try
   `assertSmokeResult(false, "Tampered EvidenceRecord did not fail the recompute.")` throws, is caught
   by the surrounding `catch` (status `undefined → 0`), and resurfaces as the exit-code assertion
   failure. Note the brief's verbatim code routes the "no tamper detected" case through the catch and
   reports it as "exited with 0" — still correctly RED and still the brief's exact code, kept verbatim.
   The kept log also proves every green-path assertion in the step executed for real against the
   installed tarball (`$ node evidence-verifier.mjs evidence.json --json` in the run, steps 1-4 passed).
   Restored the regex; final `git diff` confirmed exact brief text.
2. **`verdict.ok` / no-failed-assertion assertions can fail**: in the kept generated package,
   applied exactly the step's issuer tamper and ran the shipped verifier standalone:
   `tampered exit=2`, JSON shows `"ok": false` and `CHAIN_CLOSED: "failed"` (other rows stay
   `passed`/`not-covered`) → both step predicates evaluate false on tampered data. Restore verified:
   `restore exit=0`.
3. **`not-covered VISUAL_CONSISTENCY` assertion can fail**: replaced one
   `"VISUAL_CONSISTENCY"` exclusion entry with a sentinel in the kept record → verifier exits 2 with
   `VISUAL_CONSISTENCY: "failed"` (per `exclusionAssertion`, `record.ts:560-569`) → the
   `some(not-covered && id===…)` predicate is genuinely data-driven, not vacuous.
4. **Contract-test assertion can fail**: removed the new fixture step row via an explicit edit →
   ```
   × smoke report contract > renders a smoke breakdown for the first-run report
     → expected '---\nagent: builder…' to contain '| Third-party evidence recompute | passed |'
   Tests  1 failed | 4 passed (5)
   ```
   Restored the row; suite green again.
5. **New evidence-recompute-step tests' can-fail proof is the Step 1 RED itself** (source-text
   absent → red; source added → green).

## Gate results (verbatim, exit codes)

| Gate | Result |
| --- | --- |
| `pnpm vitest run tests/framework/evidence-recompute-step.test.ts tests/framework/smoke-report-contract.test.ts` | exit 0 — `Test Files 2 passed (2) / Tests 7 passed (7)` (final state) |
| `node scripts/first-run-acceptance.mjs --max-minutes 30` | exit 0, wall clock 30s (pre-format) and **35s final run on committed state**. Report line: `Status: **passed**`; `| Elapsed time | 35.0s / 30m budget |`; breakdown row: `\| Third-party evidence recompute \| passed \| Recomputed the shipped EvidenceRecord with the packaged zero-dependency verifier and detected a tampered record. \|` |
| Recompute step cost | verifier process: `real 0.05` per run (×2 runs in the step). The smoke's ~35s wall clock is `pnpm build` + 4× `pnpm pack` + `npm install`/scaffold/generate/build — pack/install, not the recompute. Budget never at risk (35s vs 30m). |
| `pnpm test:agent-framework` | exit 0 — `Test Files 10 passed (10) / Tests 76 passed (76)` (re-run post-format: same) |
| `pnpm test:docs` | exit 0 — `Test Files 6 passed (6) / Tests 45 passed (45)` (re-run post-format: same) |
| `pnpm check` | exit 0 — run twice (once before final formatting, once after: full build + `pnpm test` + `pnpm test:studio` all green, e.g. `Tests 52 passed (52)` studio tail) |
| `pnpm exec biome check <4 changed files>` | exit 0 after `biome format --write` (see Deviations) |

No step was deleted or softened; the rehearsal ran end-to-end twice green plus one deliberately
neutralized red.

## Files changed / commits

- `scripts/cli-install-smoke.mjs`, `scripts/first-run-acceptance.mjs`,
  `tests/framework/smoke-report-contract.test.ts`, `tests/framework/evidence-recompute-step.test.ts` (new)
- Commit: `0ba4074 test(acceptance): rehearse third-party evidence recomputation end to end`
- `docs/reviews/first-run-acceptance-2026-09-26.md` was generated by the rehearsal but left
  untracked, exactly matching the brief's Step 5 `git add` list.

## Self-review findings

- Diff re-read post-commit: only the four intended files; step placement, exit-code `2`, assertion id
  `VISUAL_CONSISTENCY`, step-name string, and review-files row all match the brief verbatim.
- Observation (not a deviation): the brief's tamper `try` block contains an `assertSmokeResult(false, …)`
  inside the same `try` whose `catch` inspects `error?.status`; the "no tamper" failure is therefore
  reported as "exited with 0; expected … 2" rather than "did not fail the recompute". Behavior is still
  a hard red with an accurate-enough message (the verifier did exit 0); kept the brief's code unchanged.
- The tamper restore lives in `finally`, and a failed step aborts the smoke anyway, so the later
  "Prompt safety" / "Generated app build" steps never see a mutated `evidence.json` (confirmed: final
  rehearsal had all seven steps green, including Prompt safety reading the restored files).
- No rendering, no `applyCommands`, no new network in the evidence path (constraint 2): the step only
  spawns `node evidence-verifier.mjs` twice and rewrites one file locally.

## Deliberate deviations (with evidence)

1. **Whitespace-only biome reformat** of the brief's Step 2/3 code: the brief's literal wrapping failed
   the repo's formatter (`biome check` reported 2 `format` errors on `scripts/cli-install-smoke.mjs`
   and `tests/framework/smoke-report-contract.test.ts` before the change). Applied
   `pnpm exec biome format --write` on just those two files; all strings, ids, exit codes, and logic
   are byte-identical apart from line wrapping (verified by re-reading the final step code and by the
   post-format acceptance rehearsal running green). `biome check` on all four files now exits 0.

## Visual-snapshot waiver

Waived: this change touches only `scripts/**` acceptance machinery and framework tests. It adds no
renderer adapter, layer/source transformation, style, snapshot code, URL/tile/worker, example, or
visual-fixture surface — the new step consumes bytes already on disk, so no visual output can change.
Deterministic gates and smoke snapshots were all run green instead.
