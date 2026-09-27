# Task 6 review — spec compliance + code quality

Reviewer: fresh general-purpose agent (dispatched by the controller). Verdict: spec ✅, task quality
**Approved**, 0 Critical / 0 Important / 6 Minor. Reconstructed verbatim from the reviewer's returned
report (the dispatch returns the report as its message; it does not write files).

### Spec Compliance

- ✅ **Step 3 — injectable CLI in `record.ts`** (diff lines 203–276): `EvidenceVerifierCliDependencies`,
  `runEvidenceVerifierCli`, exit codes `0/2/1`, and the usage string are verbatim from the brief; the
  mandated `isInsideRoot` guard is verbatim (diff:216–222); no new value imports were added to
  `record.ts`, so constraint 3's budget (`node:crypto` + `./canonical-stringify.js` only) is untouched.
  The throw lives in the injected `readArtifact` closure (diff:265–270), exactly the mechanism the brief
  sanctions; `verifyEvidenceRecord` itself still never throws (constraint 7).
- ✅ **Step 4 — build script** (`packages/engine/scripts/build-evidence-verifier.ts`, diff:63–130):
  mandated `MODULE_SPECIFIER` regex verbatim (diff:77), fail-the-build on non-`node:`/non-BUNDLE offenders
  with the offending file named (diff:90–98), line-level strip of intra-bundle specifiers only, footer
  `node:fs/promises` reader, `0o755`. Guard load-bearingness is evidenced by mutation proofs M1 (static
  import) and M2 (dynamic `await import`), the latter with the `grep -cE '\bfrom\s+"' = 2` datum showing
  exactly the Task-3 bypass being closed — report-only evidence, internally consistent and I did not
  re-run it.
- ✅ **Step 5 — build hooks + exports** (diff:44–47, 33–34): match the brief's prescribed strings exactly;
  `./evidence-verifier.mjs` and `./package.json` added to `exports`.
- ✅ **Export surface**: `runEvidenceVerifierCli` + type re-exported from the `evidence` subpath barrel only
  (diff:146, 148); the root barrel is absent from the diff, consistent with the Task 3 module-boundary
  contract; the report says `pnpm check`'s BFS `node:` guard passed.
- ✅ **Containment test surface**: brief mandated 3 escape shapes + spy proving zero reads + 1 legal nested
  path — all present (diff:421–501), plus the D4 fifth case covering the guard's own root-`..` clause
  (diff:503–529), which the brief's four cases indeed left untested.
- ✅ **`.gitignore` conditional step**: verified — `dist/` is ignored repo-wide at `.gitignore:2`, so
  skipping was correct.
- ⚠️ **Not verifiable from the diff**: the `pnpm check` exit-0 run, the bare-temp-dir standalone run, the
  createRequire resolution from `packages/cli`, and the §9 package-size measurements (236,057 vs. 204,800
  budget, pre-existing ~21 KB overrun) — all report-only. The size-budget ruling is correctly routed to
  @quality and the implementer did not self-certify by rebaselining; the controller must carry this to
  @quality with the PR.
- ⚠️ **Malformed-record robustness on the read side**: `runEvidenceVerifierCli` `JSON.parse`s and casts to
  `EvidenceRecord` with no schema validation (diff:257–258); safety then rests entirely on Task 5's
  `verifyEvidenceRecord` defensive-field handling, which is outside this diff.

### Strengths

- The spy design in the containment tests is genuinely load-bearing: `expect(reads).toEqual([recordPath])`
  (diff:463) proves "never opened", not just `ok:false`, and M3 shows all four escape tests go red when
  the guard is neutralized — the right standard, given the report's own observation that `ok:false` alone
  is also produced by a hash mismatch.
- D1/D2 deviations are the correct kind: each reproduces the brief-snippet failure first (D2's
  `//var/...` ENOENT output, D1's pre-existing `…/dist/src/evidence/…` false positive from the brief's own
  comment), then applies the minimal fix that keeps every mandated invariant intact. D3 is a real
  strict-mode TS2345 in the brief's snippet.
- The verbatim-embedding lock (test 2, diff:318–336) recomputes the strip rule and M4 incidentally proved
  it detects drift. Honest self-review: items 2, 3, 5 and the "plan text the controller must amend" table
  are exactly what a task handoff should contain.

### Issues

#### Critical (Must Fix)

None.

#### Important (Should Fix)

None blocking at task scope. The one candidate — read-side byte budget — is judged and deferral-conditioned
under Risk 3 below.

#### Minor (Nice to Have)

1. **Read-side `MAX_EVIDENCE_RECORD_BYTES` not enforced** (`packages/engine/src/evidence/record.ts`,
   diff:256–258): two-line fix (`bytes.byteLength > MAX_EVIDENCE_RECORD_BYTES` → return 1 or an
   error-shaped verdict). Acceptable to defer, but only if the controller records it as a committed
   Task 8 item, not a loose flag.
2. **Test-2 strip predicate is not strictly isomorphic to the build script's** (diff:325–333 vs. script
   diff:104–107): the test strips any non-`node:` `./`-relative specifier line; the script strips only
   lines resolving *inside BUNDLE*. Today they agree because any out-of-BUNDLE relative import fails the
   build first (fail-loud), but if BUNDLE grows to three modules and `BUNDLE_MODULES` in the test isn't
   updated in lockstep, the verbatim lock silently shrinks coverage. A comment cross-referencing the two
   lists would help; the build script already says "append closure members in this order" (diff:67) —
   point it at the test too.
3. **Symlink escape is out of reach of a pure-string guard**: an in-root relative artifact that is a symlink
   to outside is followed by the injected `readFile`. The brief explicitly mandates pure string work and
   names the root as operator-supplied, so this is a known-and-accepted residual, but it should be stated
   in the spec §6 threat-model writeup if it isn't already.
4. **Argv parsing edges**: `--root --json` consumes `--json` as the directory (diff:246–252, inherited from
   the brief sketch); unknown flags are silently ignored. Both match the brief verbatim, so no deviation
   was owed.
5. `writeFileSync({mode})` only applies on creation, so a pre-existing `dist/evidence-verifier.mjs` keeps
   its old mode. Irrelevant in practice (invoked via `node`).

### Risk Judgements (1–4 requested by the controller)

1. **D2 vs. containment** — Traced every `readArtifact` call: `isInsideRoot` runs and throws *before*
   `resolveUnderRoot`/`deps.readFile` (diff:265–269); a passing path is by construction not `/`-prefixed
   (so the absolute branch of `resolveUnderRoot` is unreachable for artifacts), not drive-shaped,
   NUL-free, and `..`-free, and the root-`..` clause rejects a poisoned root. Only the operator-named
   record file can take the absolute branch, which is trusted argv. The spy assertion
   `reads).toEqual([record])` (diff:463, with M3 red-on-neutralization) is the empirical proof.
   **Conclusion: no artifact escape through the new resolver; D2 is sound and necessary — the brief's own
   Step 1 tests pass absolute record paths with `--root` and the verbatim sketch provably fails them.**
2. **D1 message rewording** — Judged the direction: keeping the mandated over-approximate scanner
   fail-loud and cleaning the input is correct; a precision fix would have to handle multi-line
   `import {…}\nfrom "…"` and the line-based strip cannot safely un-fragment those — exactly the Task-3
   false-negative failure mode. The brief itself pins the regex ("MODULE_SPECIFIER … verbatim"), so
   weakening it was not the implementer's call to make. Pinned-assertion check (focused grep over
   `tests/` for the message): `tests/evidence/record-verify.test.ts:298` asserts only
   `stringContaining("without any applied command")`, which the reworded message preserves; no test pins
   the double-quote form. The explanatory comment at the change site (diff:174–176) documents why the
   quotes are single. **Conclusion: safe direction, no breakage.**
3. **Read-side byte budget** — Checked whether the brief's Step 3 contract covers it: it does not; the
   sketch shipped verbatim apart from D2, and constraint 5's reject-not-truncate is stated as the
   producer-side record budget. The distinct hole (untrusted auditor input, `JSON.parse` of arbitrary
   size, diff:256–258) is the same file and threat model, so I would have preferred the two-line check
   now — but deferral is legitimate **only if** the controller converts the implementer's self-review
   item 1 into a tracked Task 8 requirement rather than leaving it as a flag.
4. **Build-hook correctness** — Verified the ordering: `tsc` runs first in both hooks and must emit
   `dist/src/evidence/*.js` + `dist/scripts/build-evidence-verifier.js` before the inliner reads them
   (report's RED/GREEN evidence shows the ENOENT mode of a misorder, i.e. it fails loudly). The script
   resolves paths relative to cwd, so invoking the compiled script directly from the repo root breaks —
   but it's only wired via pnpm package scripts (cwd = package dir), acceptable. `exports` additions leak
   nothing: `files:["dist","README.md"]` already ships the verifier and `package.json` is public by npm
   convention; the `./package.json` export is the standard self-introspection idiom. Concatenation
   name-collision between the two inlined modules is possible in principle but self-policing: test 1/2
   execute the bundle, so any SyntaxError fails the gate (the brief's comment at diff:100–103 documents
   exactly this).

### Assessment

**Task quality:** Approved

**Reasoning:** Every brief-mandated artifact, guard, invariant and test surface is present and verifiably
load-bearing (mutation proofs M1–M4, spy-based containment assertions), and all four deviations are either
provable defects in the brief's own snippets or coverage the brief's mandate implied but didn't enumerate.
Residual items (read-side byte budget, §9 size overrun, symlink caveat) are correctly flagged for the
controller/@quality rather than self-certified, and must be carried as tracked follow-ups.

## Controller disposition after the review

- No fix round: the loop's trigger (Critical/Important) did not fire.
- The reviewer's condition on Minor 1 was met the same session: the byte cap, the `BUNDLE`/`BUNDLE_MODULES`
  cross-reference and the symlink threat-model sentence became **binding Task 7 requirements** in `b8c546e`.
- The controller corrected the reviewer's size attribution: the ~21 KB "pre-existing" overrun the
  implementer reported is pre-existing only *relative to this branch*; measured against a clean dist,
  the evidence subsystem accounts for the whole +38,703 B and the non-evidence figure is 197,354 B — i.e.
  main is inside budget and this spec is what crosses it. Recorded in the Task 6 ledger section.
