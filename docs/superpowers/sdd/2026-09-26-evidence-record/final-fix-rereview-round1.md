# Scoped re-review — final fix round (`0ba4074..8e35115`, round 1)

Verdict delivered by the reviewer: **Loop can close.** All of F1–F4 and M1–M7 ADDRESSED with
reproduced evidence; two new Minor findings, neither a public-contract, gate, or trust-tier defect.

## Verification by running (reviewer's own runs)

- Focused gate `pnpm vitest run tests/evidence tests/docs tests/framework tests/cli tests/schema-sync`
  → `Test Files 31 passed (31) / Tests 457 passed (457)` — matches the fixer's claim exactly.
- `pnpm size:check` → engine `239,763/262,144`, cli `65,260/65,536`, both `status: warning`
  (advisory baseline rows, pre-existing), exit 0. Reproduced, not merely reported.
- `config/package-size-budgets.json` is not in the range's file list — the budget was not edited to
  make room.
- Worktree left as found (the reviewer deleted one `create-gis-map/` scaffold its own CLI probe made).

## Item-by-item verdict

- **F1 — ADDRESSED.** `checkPackagedSpecBody` at `packages/engine/src/evidence/record.ts:673-717`,
  fired only in the byte-matched `role === "mapspec"` branch (`:470-481`); issues folded into
  `diagnostics` (`:493`) and into `DERIVATION_CLOSED`/`ok` (`:527-536`, `:563-566`). Malformed bytes
  degrade to a structured `EVIDENCE.DERIVATION_FAILED` (try/catch `:699-703`), never throws —
  constraint 7 holds. `record.spec` is only read after the non-object guard at `:394`. Three src tests
  plus the shipped-single-file forged-pair exit-2 test execute and pass. The fixture reseal is honest:
  `MAP_JSON` is `{"view":{}}\n` (`tests/evidence/fixtures/record.ts:17`) while the old fixture used
  `canonicalHash({})` for `afterHash` — the data mismatched its own claim, so data was fixed, not the
  check. Claimed RED output is consistent with the pre-fix code. Honest-package case is not a tautology.
- **F2 — ADDRESSED (doc-only, as ruled).** Threat-model bullet in `docs/engineering/evidence-record.md`
  says plainly the single-file verifier structurally cannot supply `expectedCapabilities`, that only
  tests do today, and names plan Task 9 as the planned consumer. `git diff 0ba4074..8e35115 -- packages/cli/`
  is empty.
- **F3 — ADDRESSED, one new Minor.** The example passes the real Ajv-compiled schema; the test is
  non-vacuous (heading presence, first-json-fence capture, `validate === true` with errors printed).
  Independently confirmed honest: `recordId sha256:31fe7fc5…` genuinely re-seals; `promptHash`
  `aa6ff7cf…` equals a real `--provider mock --prompt "Earthquake map"` run; the 5 available ids and
  3 SCENE3D blocker codes match `buildEngineCapabilityMatrix` and the live CLI record;
  `inversePatchHash 4f53cda1… = canonicalHash([])`; command shape matches the real CLI record.
- **F4 — ADDRESSED.** `normaliseEvidencePayload` value-exported at
  `packages/engine/src/evidence/index.ts:269` (subpath only); `reseal()` calls it; root barrel untouched
  and still type-only (`packages/engine/src/index.ts:32-46`); BFS guard passes. Both plan-sync
  disclosure rows appended.
- **M1 — ADDRESSED.** Exit-code paragraph now matches `record.ts:563-566` and folds argv into `1`.
- **M2 — ADDRESSED.** Loop at `record.ts:845-860`; probes: `--root=./pkg` and `--verbose` exit 1 with
  zero reads; missing `--root` value exits 1; every in-repo invocation
  (`README.md:25`, `CHANGELOG.md:7`, `docs/engineering/evidence-record.md:7`,
  `docs/website/guide/generation-evidence.md:124`, `SKILL.md:391`, tests, package.json exports) uses an
  accepted form. `scripts/cli-install-smoke.mjs:137,:154` updated at both call sites, tamper run identical.
- **M3 — ADDRESSED.** `grep -c sourceMappingURL packages/engine/dist/evidence-verifier.mjs` → `0`.
- **M4 — ADDRESSED.** CHANGELOG says no in-repo producer sets `recordId`, names Task 9 + removal condition.
- **M5 / M7 — ADDRESSED.** Committed rehearsal report is on-disk identical, names an in-range revision,
  and carries `Third-party evidence recompute | passed` from the current `--root .` invocation.
- **M6 — ADDRESSED.** Test pins `"moved from 'r0' to 'r1' without any applied command"`, identical to
  `record.ts:655`, with the D1 rationale comment.

## Controller's questions, as answered

1. **F1 completeness:** the recompute is keyed to a *declared* `role === "mapspec"` artifact; a record
   that omits it or re-roles it (`role` is an arbitrary string, `schema.ts:71`) still reports
   `DERIVATION_CLOSED passed`. Judged **(b)+(c)**: exactly what the brief's wording prescribed, and the
   omission half is compensated by `crossCheckEvidenceRecord`
   (`packages/cli/src/artifacts.ts:151-237`, `EVIDENCE_ARTIFACT_MISSING` on a manifest-hashed but
   unattested file); the standalone verifier has no manifest by design. The **role-relabel evasion is a
   residual neither path catches**, but it is not new — pre-fix every forgery evaded everything, so the
   fix strictly shrank the hole. → PR body for @quality, not a loop blocker.
2. **F1 correctness:** the `String(spec && spec.afterHash)` fallback is reachable (`structuralIssues` at
   `:408` never early-returns), but any record reaching it already carries an
   `EVIDENCE.RECORD_INVALID` error diagnostic, so it can only produce an odd message on an already-red
   verdict — never a false green.
3. **F2:** accurate, CLI untouched.
4. **F3:** see new Minor-1.
5. **M2:** no rejected invocation forms remain in repo.
6. **M5/rehearsal:** consistent with final code state.
7. **Engine size:** budgets untouched, verified live.

## New findings introduced by the fix round

- **Minor-1 (report/code disagreement):** the fix report and the SKILL prose line "Every value below is a
  real hash recomputed from the example's own content" claimed the `map.json` pair
  (`sha256:991cde20…`, 152 B) and `afterHash sha256:ad44a71f…` are consistent with the 2-space
  pretty-printed spec. Reviewer could not reproduce any preimage (faithful reconstruction gives
  153 B / `sha256:dd0fd659…`, and no candidate canonicalises to `ad44a71f`). Nothing contract-breaking —
  recordId/promptHash/capabilities verified — but the prose claim was unverifiable and probably
  inaccurate. `beforeHash`/`diffHash` are equally free-floating but carry no equivalent claim.
- **Minor-2 (cosmetic, same class as before):** the new argv loop takes the last of
  `--root a --root b`, and `--root --json` consumes `--json` as a directory name (probe: reads
  `--json/evidence.json`). No repo invocation uses either form; unknown-flag exit 1 still holds. Noted only.

## Controller disposition (after the loop closed)

- Minor-1 fixed in `f0376ba`: the prose now states what is actually pinned (schema-validity and the
  `recordId` re-seal) and labels the `spec.*`/`artifacts[].sha256` literals illustrative, and the
  re-seal is now enforced by the docs test instead of asserted in prose. Can-fail proof: corrupting the
  example's `recordId` by one hex digit makes the test fail with
  `skill example recordId does not re-seal from its own body` (then restored; `519e30f` drops the
  non-null assertions Biome flagged).
- Minor-1 also removed the fixer's own overclaim from the shipped surface; `final-fix-report.md` keeps it
  as a historical record, and this file is the correction.
- Minor-2 and the F1 role-relabel residual are carried to the PR body for @quality, not fixed here:
  the first is a cosmetic argv edge with no in-repo caller, the second is a detection-completeness
  boundary that a second code change in this loop would not close without deciding what a record must
  attest — which is spec territory, i.e. @quality's call.
