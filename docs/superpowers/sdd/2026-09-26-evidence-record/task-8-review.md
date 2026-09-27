# Task 8 review (spec compliance + quality) — range 3cb9947..0ba4074

Verdict: **Approved**. 0 Critical, 0 Important against the brief, 5 Minor.

### Spec Compliance

- ✅ **`scripts/cli-install-smoke.mjs`** — New `runStep("Third-party evidence recompute", …)` inserted exactly between "Generated app verification" and "Prompt safety" (diff lines 29–67; placement confirmed against the file itself, `scripts/cli-install-smoke.mjs:97-171`). Logic matches the brief's Step 2 verbatim apart from biome line-wrapping: `runJson(...)` collapsed to one line at `scripts/cli-install-smoke.mjs:132`, all strings, assertion ids, and exit-code checks byte-identical to the brief. The claim that no imports needed "补齐" checks out: `execFileSync`/`readFileSync`/`writeFileSync`/`join` were already present at `scripts/cli-install-smoke.mjs:3-6` in the base (the diff touches no import line). Reuses existing shapes only (`runStep` at `:193`, `runJson` at `:309`, `assertSmokeResult` at `:314`), no new shapes invented.
- ✅ **`scripts/first-run-acceptance.mjs`** — Exactly one line `- \`evidence.json\`` added to Required Review Files (diff line 92); report table untouched as the brief mandated; the step flows through `renderSmokeBreakdown` automatically.
- ✅ **`tests/framework/smoke-report-contract.test.ts`** — Fixture row + `toContain("| Third-party evidence recompute | passed |")` added per brief Step 3 (diff lines 142–146, 164).
- ✅ **`tests/framework/evidence-recompute-step.test.ts`** — Created verbatim from the brief's Step 1 (diff lines 108–126).
- ✅ **Constraints:** (2) pure-data recompute holds — the step only spawns `node evidence-verifier.mjs` twice and rewrites one local file, no render/network/`applyCommands`; Task 6 contract honored — caller branches on `verdict.ok === true` **and** the assertions array, not the array alone (diff line 35–42); Task 7 "excluded → not-covered, not silence" surfaced as a hard assertion on `VISUAL_CONSISTENCY` (diff lines 40–43); brief's "不得删步骤" honored — nothing deleted or softened.
- ⚠️ **Not verifiable from the diff alone:** the gate runs (vitest 7/7, agent-framework 76/76, docs 45/45, `pnpm check` ×2, 35 s rehearsal) and the mutation proofs. Partial corroboration exists in-workspace: the untracked rehearsal report `docs/reviews/first-run-acceptance-2026-09-26.md:47` contains the exact breakdown row with `passed` and the full evidence sentence, which could only be produced by a real green rehearsal. The 0.05 s verifier-vs-35 s pack split claim is plausible (2 short node spawns vs build/pack/install) but unproven here.
- No Missing / Extra / Misunderstood items found.

### Strengths

- The step is genuinely behavioral, not textual: it proves the shipped verifier passes on real installed-package bytes, requires `not-covered` visibility for an excluded capability, and requires exit `2` on a tampered record. The exit-2 requirement doubles as an implicit canary for tamper application (see Risk 1).
- Mutation proof 1 (report §Mutation proofs 1) is the right proof: the tamper was neutralized in a **real full smoke run** and the step went red with the predicted message and `EXIT=1`. That is exactly the evidence needed for the vacuous-tamper risk.
- The recorded `evidence` sentence is truthful by construction: `runStep` only stores it on success (`scripts/cli-install-smoke.mjs:196`), and success requires the tamper detection to have actually exited 2.
- Honest self-review: the report flags the brief's try/catch quirk (the `assertSmokeResult(false, …)` in the try being swallowed by the catch and reported as "exited with 0") rather than papering over it, and correctly kept the brief's verbatim code.
- The whitespace-only deviation claim is consistent with the diff content; biome clean-up on `scripts/**` was needed and the deviation is declared with verification.

### Issues

#### Critical (Must Fix)

None.

#### Important (Should Fix)

None against the brief. (Items that would normally be Important are either plan-mandated verbatim code or mitigated by the step's own assertions — see Risk Judgements.)

#### Minor (Nice to Have)

1. **No explicit "tamper actually changed the bytes" assertion.** `scripts/cli-install-smoke.mjs:145-147` writes `original.replace(...)` without checking `original !== tampered` or that `"tampered-by-rehearsal"` is present before running the verifier. The behavioral exit-2 check makes a silent no-op tamper loudly red (proven by mutation proof 1), so this is belt-and-suspenders, but a one-line guard would fail with a precise message ("tamper pattern did not match") instead of the misleading "exited with 0; expected the verifier's blocked code 2" (`:157-158`), which misattributes a regex-drift failure as a verifier failure. Plan-mandated shape; the fix is additive.
2. **Restore is not verified.** The `finally` rewrite at `scripts/cli-install-smoke.mjs:160-161` has no read-back/hash comparison and could itself throw (leaving a half-written record in the `--keep` forensic dir). Mitigated in practice: the tampered write precedes the try, so a throw there aborts the smoke before corruption matters; a throw in the restore propagates through `runStep` (`scripts/cli-install-smoke.mjs:197-204` rethrows) into the outer try at `:37`, which skips all later steps — so no later step ever reads a mutated record. Real residual exposure is only the `--keep` artifact.
3. **`expect(smoke).toMatch(/--json/)` is vacuous.** `--json` already occurred twice in the base file (`scripts/cli-install-smoke.mjs:104,112`), so that assertion passes with the recompute step entirely removed. The other two assertions (`Third-party evidence recompute`, `/evidence-verifier\.mjs/`) still pin the step, so the test file isn't wholly false coverage. Brief-mandated verbatim test (**plan-mandated**).
4. **Source-text tests don't pin the tamper half.** If someone deletes only the tamper/restore block, both new tests stay green and `release:verify` still passes while the evidence sentence claims tamper detection. The end-to-end guard for that lives only in reviewer discipline / the mutation proof. Inherent to the brief's design ("the real end-to-end assertion lives in the smoke run"), noted as a coverage boundary, not a defect.
5. **Doc prose drift (follow-up for @docs, not a task miss).** `docs/engineering/ci-test-strategy.md:69-75` enumerates what the CLI install smoke fails on and now under-describes it (no mention of evidence recompute / `evidence.json` tamper detection). The gate table at `:105` and the release wiring remain accurate.

### Risk Judgements

1. **Vacuous tamper — covered; failure is loud.** Checked: full step body (`scripts/cli-install-smoke.mjs:129-163`), `runStep` (`:193-205`, rethrows → outer try at `:37` aborts the smoke → `passed:false`), `assertSmokeResult` (`:314-316`, plain `Error` with no `.status`, so a no-op tamper yields `code = error?.status ?? 0 = 0` → `assertSmokeResult(code === 2, …)` throws red). The step does **not** explicitly prove the replacement mutated bytes, but the required exit-2 makes an unmutated record impossible to pass — mutation proof 1 in the report demonstrates exactly this branch red in a real smoke (`EXIT=1`). Residual weakness: misleading failure message (Minor 1).
2. **State restoration — adequate, unasserted restore.** Checked the control flow above. Tampered write is outside the try, so a throwing tampered-write never leaves a corrupted file that a later step reads (smoke aborts at the first failed step; the report's claim is structurally confirmed, not just asserted). Restore runs in `finally` before any rethrow; a throwing restore also fails the step loudly. What's missing is only a read-back verification of the restored bytes (Minor 2).
3. **Does anything run this rehearsal — yes, on the release path.** The controller's check (no workflow names `cli-install-smoke`) is true but incomplete: `scripts/release-verify.mjs:38-40` runs `pnpm smoke:cli-install`, and `.github/workflows/npm-release.yml:38` runs `pnpm release:verify`. So the step is a release-blocking gate, exactly as documented in `docs/engineering/ci-test-strategy.md:105` (`CLI install smoke | PR: 否 | release: 必跑且阻断`) and `:77-80`. The doc does **not** misdescribe reality; only its prose failure-mode list (`:72-75`) is now under-inclusive (Minor 5). Honest follow-up: a one-sentence @docs addition to the smoke description — no new CI wiring is required by this brief.
4. **Assertion quality of the new tests — thin but plan-mandated, with real end-to-end backing.** `evidence-recompute-step.test.ts:8-10`: first two assertions can fail for the right reasons (mutation proof 5 = the captured Step 1 RED); the `--json` one is vacuous (Minor 3). `smoke-report-contract.test.ts` row check can fail for the right reason — mutation proof 4 shows a genuine red/green cycle. The substring form is a reasonable structural tripwire for acceptance scripts that no deterministic test can execute cheaply (the pack+install path); the substantive coverage is the smoke step itself, and its three data-driven assertions each have a demonstrated can-fail proof (report mutation proofs 1–3). Coverage boundary in Minor 4. No mutation proof was shown for the second evidence-recompute test in isolation, but the RED capture covered both tests (report:21 both named tests failed), which suffices.

### Assessment

**Task quality:** Approved
**Reasoning:** All four brief files are implemented verbatim modulo declared whitespace, the binding constraints ((2)/(5)/(7), Task 6 exit-code contract, Task 7 not-covered visibility, no step deletion) hold, and the four named risks are either structurally mitigated or Minor. The residual items (explicit tamper-guard, restore read-back, vacuous `--json` assertion, docs prose alignment) are polish and @docs follow-ups, not trust blockers.