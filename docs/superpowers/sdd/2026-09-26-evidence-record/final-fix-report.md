# Final fix round — EvidenceRecord sub-project A (whole-branch review close)

Branch `codex/evidence-record-a`, base `0ba4074`. Closes F1–F4 (Importants) and M1–M7 (Minors)
from `final-review.md` per `final-fix-brief.md`. Review items 5–7 (@quality/human) untouched.

## Status

**DONE** — all four gates green; three commits on the branch; nothing pushed.

## Commits

| Commit | Content |
| --- | --- |
| `6c68350` | `fix(evidence): close final whole-branch review findings` — all F/M code, test, and doc changes |
| `d682cdc` | `style(evidence): apply biome formatting from the pre-commit hook` — the hook safely auto-fixed wrapping in `record.ts` / `standalone-verifier.test.ts` after `6c68350` landed; per standing rules this became a NEW commit (no amend, no `--no-verify`) |
| `8e35115` | `docs(acceptance): commit live rehearsal evidence for the final fix round` — M7 |

## Per-item implementation

### F1 — spec §7 trigger 3: packaged mapspec body must canonicalise to `spec.afterHash`

`packages/engine/src/evidence/record.ts`:

- New helper `checkPackagedSpecBody(declaredPath, bytes, spec, path)`:
  `JSON.parse(new TextDecoder().decode(bytes))` (catch → structured `EVIDENCE.DERIVATION_FAILED`,
  never throws at the injected boundary — constraint 7), then `safeCanonicalHash(body)` compared
  with `spec.afterHash`; messages name both the recomputed hash and the declared one.
  Diagnostic path is the plain `/artifacts/${index}` form the brief asks for.
- In the artifact loop, when a role-`mapspec` artifact's declared bytes AND hash match the file on
  disk, the body recompute runs; issues land in a separate `packagedSpecIssues` array pushed into
  `diagnostics` alongside `artifactIssues`.
- `DERIVATION_CLOSED` now fails when `lineageIssue || inverseIssue || packagedSpecIssues.length > 0`,
  with the packaged-spec message surfaced in `detail`.

Tests: `tests/evidence/record-verify.test.ts` new describe "verifyEvidenceRecord packaged mapspec
recompute (spec §7 trigger 3)" — forged pair (`ARTIFACTS_MATCH`/`CHAIN_CLOSED` still passed,
`DERIVATION_CLOSED` failed, `ok` false, diagnostic names both hashes), honest shape
(`afterHash = canonicalHash(JSON.parse(body))` → `ok` true), malformed bytes (`"not-json{{\n"` →
structured DERIVATION_FAILED). `tests/evidence/standalone-verifier.test.ts` adds a forged-pair run
through the shipped `dist/evidence-verifier.mjs` with `--root` (expects exit 2 + the code), proving
the single file, not just src, catches the forgery.

**Resealed fixture (only one):** `tests/evidence/fixtures/record.ts` — its `spec.afterHash` was
`canonicalHash({})` while the mapspec artifact bytes were `MAP_JSON` (`{"view":{}}\n`). The record
was therefore already unsound; F1 legitimately reddened it. Per standing rule 2 the fixture DATA was
fixed (`afterHash: canonicalHash(JSON.parse(MAP_JSON))`), not the check. Verified by the full
focused gate that no other fixture needed resealing: schema-sync mapspec rows never reach
`verifyEvidenceRecord`; containment/standalone overrides use role `data` or honest pairs;
`tests/cli/evidence-export.test.ts` verifies honest CLI output.

### F2 — docs-only (Important 2)

`docs/engineering/evidence-record.md`: new threat-model bullet stating that capability drift is
unreachable by the single-file verifier, that `expectedCapabilities` is only supplied by tests
today, and that the planned consumer is plan Task 9's workbench receipt binding.

### F3 — generation skill example was schema-invalid

`skills/gis-engine-generation-pipeline/SKILL.md`: replaced the EvidenceRecord example (placeholder
`"sha256:<hex>"`, command missing `version`/`view`, wrong `capabilities.schemaVersion`) with a
fully self-consistent record generated from real code: `recordId`
`sha256:31fe7fc5…bcc5` recomputes from the canonical body; `afterHash` and the `map.json` artifact
hash (`sha256:991cde20…`, 152 bytes) are consistent with the 2-space pretty-printed spec exactly as
`packages/cli/src/generate.ts` writes it; the 5 available capability ids and 3 SCENE3D blockers
match `buildEngineCapabilityMatrix` under the default gate. Prose notes the abridged artifact list.
Locked red-proof: `tests/docs/public-docs-consistency.test.ts` new test extracts the first
```json fence under "## Evidence Record Structure" and validates it with Ajv against
`EvidenceRecordSchema`.

### F4 — barrel omission

`packages/engine/src/evidence/index.ts` now value-exports `normaliseEvidencePayload` (record.ts:373).
`tests/evidence/record-verify.test.ts` `reseal()` calls it, so test resealing uses the same JSON
round-trip + canonical hash the builder uses.

### M1 — exit-code documentation

`docs/engineering/evidence-record.md`: `0` = all assertions green AND no `severity: "error"`
diagnostics (the six-green-but-unreadable case exits `2`); `1` now also covers unrecognised CLI
arguments.

### M2 — verifier argv hardening

`runEvidenceVerifierCli` parses flags in an explicit loop: `--json` accepted, `--root` consumes its
value (missing value still errors), anything else → `Unrecognised argument "…"` +
`usage: evidence-verifier <evidence.json> [--root <dir>] [--json]`, exit **1 before any file read**.
Three tests in a new "argument handling" describe (incl. the missing-path pin), each asserting via
a read-spy that `reads).toEqual([])`.

### M3 — sourcemap trailer stripped from the shipped single file

`packages/engine/scripts/build-evidence-verifier.ts` now filters
`.//# sourceMappingURL=` lines when verbatim-embedding closure files;
`tests/evidence/standalone-verifier.test.ts` pins `expect(source).not.toContain("sourceMappingURL")`
and mirrors the filter in its recomputation check.

### M4 — CHANGELOG recordId clause

Now states no in-repo producer sets `recordId` yet (schema and type only) and that the only
specified consumer is plan Task 9's branch-gated workbench receipt binding, removed from the
bundle contract if Task 9 does not land.

### M5 — smoke invocation matches published usage

`scripts/cli-install-smoke.mjs`: both verifier runs use
`["evidence-verifier.mjs", "evidence.json", "--root", ".", "--json"]` (arg order matches the CLI's
own usage; check done before choosing), tamper run identical, comment added.

### M6 — quoting coupling pinned visibly

`tests/evidence/record-verify.test.ts` pins the full lineage message with
`expect.stringContaining("moved from 'r0' to 'r1' without any applied command")` plus a comment
explaining the single quotes exist to survive the bundler's over-approximate `MODULE_SPECIFIER`
scanner (plan deviation D1).

### M7 — live rehearsal evidence committed

`docs/reviews/first-run-acceptance-2026-09-26.md` was regenerated after the code commits so its
`repo_revision` names `d682cdc` (a commit on this branch) instead of `3cb9947`, and committed in
`8e35115`.

### Plan-sync disclosure

`docs/superpowers/plans/2026-09-26-evidence-record.md`: two rows appended to the plan's single
sync table — spec §7 trigger 3 gap closed by Important 1, and Task 5 Step 4b export-list omission
(plan:2050-2056) closed by Important 4.

## TDD evidence (RED then GREEN, real outputs)

- **F4** RED: `pnpm vitest run tests/evidence/record-verify.test.ts` → `TypeError:
  normaliseEvidencePayload is not a function` (5 failed) → GREEN: 26 passed.
- **F1** RED (src): `expected 'passed' to be 'failed'` ×2 + `expected +0 to be 2` (forged pair and
  standalone cases sailed through the old verifier) → after implementation + `pnpm --filter
  @gis-engine/engine build`: GREEN 79 passed (later 82 with M2/M3).
  Note: the standalone forged-pair test was initially red against a stale `dist/evidence-verifier.mjs`
  — expected build order, fixed by rebuilding, not a defect.
- **F1** fixture: fixture reseal was required the moment the check went green (see above).
- **M2** RED: `expected 'Could not read evidence.json: ENOENT:…' to contain 'usage: evidence-verifier…'`
  ×2 (old code silently ignored unknown flags and proceeded to read) → GREEN: argument-handling
  suite 18 passed.
- **M3** RED: `expected '#!/usr/bin/env node…' not to contain 'sourceMappingURL'` → GREEN.
- **F3** RED: Ajv rejected the old skill example verbatim — `recordId` must match
  `^sha256:sha256… pattern`, command missing required `version`/`view`, `type` const `setView`
  mismatch, `capabilities.schemaVersion` const `engine-capabilities.v0.1` → GREEN: 46 docs tests.
- F2/M1/M4/M5/M6/M7: documentation/mechanism items, covered by the green suites and the rehearsal;
  no logic to reddened.

## Gates (final state)

1. `pnpm vitest run tests/evidence tests/docs tests/framework tests/cli tests/schema-sync` →
   `Test Files 31 passed (31) / Tests 457 passed (457)`.
2. `pnpm build` → Done. `pnpm size:check` (re-run on the final build):

   | Package | Gzip bytes | Budget | Status |
   | --- | ---: | ---: | --- |
   | @gis-engine/engine | 239,763 | 262,144 | warning (advisory baseline regression, pre-existing) |
   | @gis-engine/cli | 65,260 | 65,536 | warning (same advisory rows; **within budget, stop rule not triggered**) |

3. `node scripts/first-run-acceptance.mjs --max-minutes 30` (run twice: pre-commit and again at
   `d682cdc` for M7). Breakdown row in the committed report:
   `| Third-party evidence recompute | passed | Recomputed the shipped EvidenceRecord with the
   packaged zero-dependency verifier and detected a tampered record. |` — F1 did not flip the
   rehearsal; no step was softened. (`Release-runner parity | fail (advisory)` is the pre-existing
   local node 26 vs expected 22 advisory, unrelated.)
4. `pnpm check` (`build && test && test:studio`) → full suite green (tail shows the final
   `test:studio` stage, 6 files / 52 tests passed; the `&&` chain proves earlier stages green).
5. Post-formatting re-verification: `tests/evidence` re-run green (5 files / 82 tests), engine
   rebuilt, rehearsal re-run (gate 3), `size:check` re-run.

## Files changed

- `packages/engine/src/evidence/record.ts`, `packages/engine/src/evidence/index.ts`,
  `packages/engine/scripts/build-evidence-verifier.ts`
- `tests/evidence/fixtures/record.ts`, `tests/evidence/record-verify.test.ts`,
  `tests/evidence/standalone-verifier.test.ts`, `tests/docs/public-docs-consistency.test.ts`
- `scripts/cli-install-smoke.mjs`
- `skills/gis-engine-generation-pipeline/SKILL.md`, `docs/engineering/evidence-record.md`,
  `CHANGELOG.md`, `docs/superpowers/plans/2026-09-26-evidence-record.md`
- `docs/reviews/first-run-acceptance-2026-09-26.md` (regenerated + committed)

## Deviations from the brief (ruled toward the spec)

1. **"Task 5 sync table"** — the plan has exactly one sync table ("Task 6 落地后的计划同步",
   plan:2473). Both disclosure rows were appended there.
2. **Commit shape** — the brief suggested one `git add -A` commit; the Biome pre-commit hook applied
   safe formatting fixes to the worktree only after `6c68350` was created, so a follow-up style
   commit (`d682cdc`) was required (no amend, no `--no-verify`). The rehearsal commit (`8e35115`)
   is third because M7 requires `repo_revision` to name an existing branch commit.
3. **M7 file name vs run date** — the clock rolled to 2026-09-27 mid-round; the script's default
   output is date-based, so the regeneration used `--output docs/reviews/first-run-acceptance-2026-09-26.md`
   to match the exact filename the brief mandates. A transient, content-identical
   `first-run-acceptance-2026-09-27.md` from the pre-commit gate-3 run was deleted (untracked,
   superseded).
4. **F3 example beyond the minimum** — the brief required a schema-valid example; the example is
   instead a fully honest, recomputable record, so a future producer-side test can reuse it.
5. **Gate 4 ordering** — `pnpm check` ran before the hook-applied (formatting-only) diff existed;
   the post-formatting state was re-verified with the focused evidence suite, a full engine build,
   the rehearsal, and `size:check`.

## Remaining concerns

- CLI sits 276 bytes under its blocking budget (65,260/65,536). The next functional CLI change
  without a @quality budget raise will trip the gate (budget raise explicitly out of scope).
- Non-blocking Biome findings intentionally left: `useTemplate` at `record.ts:113` (pre-existing
  placeholder line) and `useOptionalChain` at `record.ts:706` (semantically identical to the
  current form), plus `noNonNullAssertion` in the two test files (tests deliberately assert on
  matched captures). The hook classified these as unsafe fixes and did not block on them.
- `expectedCapabilities` still has no non-test consumer until plan Task 9 lands (documented in the
  F2 threat-model bullet and the M4 CHANGELOG clause).
