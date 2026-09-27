# Final fix dispatch — whole-branch review Important 1–4 + selected Minors

Work from: `/Users/chengming/CodeXProjects/gis-engine/.worktrees/evidence-record-a`
(branch `codex/evidence-record-a`, HEAD `0ba4074`, tree clean except the untracked rehearsal report).

Binding standing rule for this repo work: **read any file with Read before Edit/Write on it.**

The whole-branch review is at `.superpowers/sdd/2026-09-26-evidence-record/final-review.md` — read it
for the full text of each finding. Spec authority:
`docs/superpowers/specs/2026-09-26-evidence-record-design.md` §7 (the `EVIDENCE.*` trigger table,
line 143). This is the LAST fix round of the plan; anything you do not close goes into the PR body, so
report precisely.

Global constraints that still bind every item below (from the plan): the trust tier is pure-data
recompute only; `record.ts`'s value imports may only be `node:` builtins or members of the build
script's `BUNDLE`; the verifier never throws at an injected boundary — a failure must become a
structured diagnostic (constraint 7); over-budget records are rejected, never truncated.

---

## F1 — spec §7's third `DERIVATION_FAILED` trigger is unimplemented (Important 1)

Spec §7 line 143 lists three triggers for `EVIDENCE.DERIVATION_FAILED`. The first two are implemented
(`checkLineage`, `checkInversePatchHashes`). The third — "包内 spec 文件正文与 `spec.afterHash` 不符"
— is not: nothing re-hashes the packaged spec. Consequence today: a coordinated forgery (`map.json`
plus a self-consistent record whose `artifacts[].sha256` matches those bytes) reports
`ARTIFACTS_MATCH passed`, `DERIVATION_CLOSED passed`, `ok: true`, exit 0.

Implement inside `verifyEvidenceRecord` in `packages/engine/src/evidence/record.ts`, in the artifact
loop's **matched** branch (currently `record.ts:467-470`, the `matched += 1; continue;`):

- When the artifact's `role === "mapspec"` and its bytes/sha256 matched, also recompute
  `canonicalHash(JSON.parse(<utf8 of bytes>))` and compare to `record.spec.afterHash`.
  Writer-side equivalence is already proven by `tests/cli/generate.test.ts:13,285`
  (`canonicalHash(JSON.parse(mapBytes)) === evidence.spec.afterHash`), so an honest package stays green.
- On mismatch: push a `Diagnostic` with `code: EvidenceIssueCode.DerivationFailed` (member exists at
  `record.ts:39`, already used by `checkLineage`/`checkInversePatchHashes`), path pointing at the
  offending artifact, message naming both hashes.
- Fold that issue into the `DERIVATION_CLOSED` assertion (currently keyed on
  `lineageIssue || inverseIssue` at `record.ts:513-517`) so it reports `failed` with the issue's
  message, and therefore into `ok`.
- Wrap the decode/parse so malformed, non-UTF8, or non-JSON bytes degrade to the same structured
  `DERIVATION_FAILED` rather than throwing. Do not add any new value import to `record.ts`; use the
  existing globals (`TextDecoder` or `Buffer`, `JSON`, `canonicalHash` — all same-file/global).
- Skip the recompute when `readArtifact` was not supplied (that path already fails
  `ARTIFACTS_MATCH`).

TDD, red first. Tests to add in `tests/evidence/record-verify.test.ts`:
1. forged pair — honest-looking record whose `mapspec` artifact bytes sha256-match and are internally
   consistent, but whose JSON body canonicalises to a different hash than `spec.afterHash` ⇒
   `DERIVATION_CLOSED failed`, `EVIDENCE.DERIVATION_FAILED` present, `ok === false`. Prove this test
   fails against current HEAD before implementing (paste the RED output in your report).
2. honest package shape — same record with the correct `afterHash` ⇒ green (guards against an
   always-reject).
3. malformed bytes at a matched `mapspec` artifact ⇒ structured `DERIVATION_FAILED`, no throw.
Then prove the shipped single file does it too: extend
`tests/evidence/standalone-verifier.test.ts` (it already runs `packages/engine/dist/evidence-verifier.mjs`
with no `node_modules`) with a forged-pair case asserting exit `2`.

**Watch out:** several existing fixtures hand-build records with fabricated artifact bytes. Any that
declare `role: "mapspec"` will now legitimately go red — fix the fixture so `afterHash` matches its
bytes (do not weaken the new check, do not rename the role to dodge it). Report every fixture you had
to reseal.

**Plan disclosure is part of this fix:** the review called this "a plan gap that shipped silently".
Add the row to the plan's Task 5 sync table in
`docs/superpowers/plans/2026-09-26-evidence-record.md` (the table that lists what the plan said vs
what shipped) stating that spec §7's third trigger had no task text and is landed here.

## F2 — capability drift is unreachable and undisclosed (Important 2)

Verified by the controller: `expectedCapabilities` has only test callers
(`tests/evidence/record-verify.test.ts:138,154,171,402,450`), and the plan never mandates a
production caller — Task 9 (`plan:3019`, branch-gated on `codex/workbench-v1`) is the specified
consumer. **Ruling for this round: do NOT wire `--verify-artifacts`.** Adding an engine→CLI dependency
in the last mile is unplanned scope and `config/package-size-budgets.json:45` leaves the CLI only
276 B under a `blocking` gate (review Important 7). So:

- Add a bullet to the 威胁模型 section of `docs/engineering/evidence-record.md`: the single-file
  verifier has no live engine gates, so it **cannot** detect capability drift; `CAPABILITY_DRIFT`
  requires a caller that supplies `expectedCapabilities` (the engine API), and today only tests do.
  An auditor must not read the assertion table as covering the capability claim.
- Same doc: state, one clause, which in-repo consumer is planned to supply it (Task 9's receipt
  binding) so the code is documented as not-yet-consumed rather than silently dead.
- If you disagree with the ruling, say so in the report with evidence — do not silently implement the
  wiring.

## F3 — the AI-facing skill publishes a schema-invalid record (Important 3)

`skills/gis-engine-generation-pipeline/SKILL.md:309-362` (the `evidence.json` example) is rejected by
`EvidenceRecordSchema` on more than the spelling the review named. Verified facts:

- `capabilities.schemaVersion` says `"engine-capability-matrix.v0.1"`; the literal is
  `"engine-capabilities.v0.1"` (`packages/engine/src/evidence/schema.ts:22`,
  `capability-matrix.ts`, `record.ts`).
- Every hash is written `"sha256:<hex>"`, but `Sha256 = Type.String({ pattern: "^sha256:[a-f0-9]{64}$" })`
  (`schema.ts:9`) — so `recordId`, `promptHash`, `beforeHash`/`afterHash`/`diffHash`,
  `inversePatchHash`, `artifacts[].sha256` all fail. Use real 64-hex literals.
- The command object is `{"id": "gen-set-view", "type": "set-view"}`: `NestedMapCommandSchema` requires
  `version: Type.Literal("0.1")` (`packages/engine/src/spec/schemas/command.schema.ts:14`), the union
  member is `"setView"`, and `setView` requires a `view` property (`command.schema.ts:122-124`, inner
  fields optional). Give it `"version": "0.1"`, `"type": "setView"`, `"view": { ... }`.
- `"available": []` under-claims a CLI-issued record (a CLI record carries the `evidence.*` ids). Use
  the ids a CLI generation actually produces — read the writer (`packages/cli/src/generate.ts:745` →
  `buildEngineCapabilityMatrix`) or the existing test expectations and copy honest values.

Then **pin it**: `tests/docs/public-docs-consistency.test.ts` already regex-locks skill examples (see
`:242` for the pattern). Add a case that extracts the fenced `json` block from that SKILL.md section
and validates it against the compiled `EvidenceRecordSchema` (Ajv, `additionalProperties: false`), so a
future edit that breaks the example turns red. Red first: show the test failing against the current
SKILL.md, then fix the prose.

## F4 — the shared hash normaliser is not on the sanctioned surface (Important 4)

`record.ts:371` exports `normaliseEvidencePayload` and its own comment says builder and verifier may
share only that expression, but `packages/engine/src/evidence/index.ts` omits it and package `exports`
blocks deep imports — so `tests/evidence/record-verify.test.ts:34-36` (`reseal()`) re-spells
`JSON.parse(JSON.stringify(...))`, and the copy is the very test meant to notice drift.

- Add `normaliseEvidencePayload` (value export) to the `./evidence` barrel next to `canonicalHash`.
- Make `reseal()` in `tests/evidence/record-verify.test.ts` call it and delete the duplicated comment.
- The root barrel must stay type-only for evidence symbols — the BFS reachability guard in
  `tests/evidence/canonical-hash.test.ts` will catch it if you get this wrong; do not touch the root
  barrel.
- Note in the report that `plan:2050-2056` (Task 5 Step 4b's export list) is the source of the
  omission, and add it to the plan's Task 5 sync table like F1.

---

## Minors to close in the same round (cheap, no design risk)

- **M1** `docs/engineering/evidence-record.md:14` says exit `0` = "全部断言绿"; `ok` also requires no
  `severity: "error"` diagnostic (`record.ts:544-547`). One clause, so an unsupported-`schemaVersion`
  record that prints six green rows and exits 2 is correctly described.
- **M2** `runEvidenceVerifierCli` ignores unrecognised flags (`record.ts:777-783`), so `--root=./pkg`
  silently degrades to cwd-relative reads. Reject unknown flags (and a missing record path) with the
  existing usage text and exit `1`. Add a test.
- **M3** The generated single file carries two dangling `//# sourceMappingURL=` comments
  (`canonical-stringify.js.map`, `record.js.map`) that resolve to nothing beside it; strip them in the
  inliner `packages/engine/scripts/build-evidence-verifier.ts`, and pin with the existing test that
  reads `dist/evidence-verifier.mjs`.
- **M4** `CHANGELOG.md` Unreleased claims the bundle "gained an optional `recordId` pointing at the
  record it views" without saying no in-repo producer sets it (`packages/ai/src/tools/generationEvidence.ts:417,614`
  are schema/type only). Add the clause and the removal condition (Task 9).
- **M5** `scripts/cli-install-smoke.mjs:132` runs the verifier without `--root`, while every published
  command uses `--root .`. Match the published invocation (`["evidence-verifier.mjs", "--root", ".",
  "evidence.json", "--json"]` or the arg order the CLI's own usage documents — check
  `printUsage`/arg parsing before choosing, and keep the tamper run identical).
- **M6** `record.ts:631-636` uses single quotes purely to survive the bundler's over-approximate
  `MODULE_SPECIFIER` scanner (deviation D1), and `tests/evidence/record-verify.test.ts:298` pins only
  a substring. Pin the quoting in that test so the coupling is visible rather than discovered as a
  build error.
- **M7** Commit the live rehearsal evidence `docs/reviews/first-run-acceptance-2026-09-26.md` (still
  untracked) — it follows the existing `docs/reviews/` dated-report convention with YAML front matter.
  Regenerate it (see gates) so its `repo_revision` names a commit on this branch rather than `3cb9947`.

Explicitly NOT in scope (controller decided; do not do them): `--verify-artifacts` capability wiring
(F2), the `report.valid` readiness-derivation divergence across `packages/ai/src/mcp/server.ts:894`,
`packages/ai/src/tools/contextSummary.ts:216`, `packages/cli/src/generate.ts:745` (plan-mandated at
`plan:552`), the CLI 276 B budget raise, the `documentation-minimalism` exemption (already user-approved
and now ruled in the ledger), a `gate-plan.mjs` row for the smoke (CI cost = @quality).

---

## Gates (run all, in this order; paste real output into the report)

1. Focused: `pnpm vitest run tests/evidence tests/docs tests/framework tests/cli tests/schema-sync`
2. `pnpm build` then `pnpm size:check` (engine has headroom; **CLI is at 65,260/65,536 — if the CLI
   goes over budget, stop and report rather than raising the limit**).
3. `node scripts/first-run-acceptance.mjs --max-minutes 30` — this is the real third-party rehearsal
   and F1 can flip it. The report's "CLI Install Smoke Breakdown" must still show
   `Third-party evidence recompute | passed`. Never delete or soften a step to get green.
4. `pnpm check` (full suite) once before committing.

## Commit

Two commits are fine if you want the plan/disclosure separate, otherwise one:

```bash
git add -A
git commit -m "fix(evidence): close final whole-branch review findings"
```

`docs/reviews/first-run-acceptance-2026-09-26.md` must be in one of them (M7). Do not push.

## Report

Write the full report to `.superpowers/sdd/2026-09-26-evidence-record/final-fix-report.md`:
what changed per item (F1–F4, M1–M7), TDD evidence (RED command+output, GREEN command+output) for F1,
F2's doc-only status, F3 and F4, fixtures you had to reseal, gate outputs verbatim where they matter,
anything you could not close and why. Then reply with under 15 lines: Status
(DONE/DONE_WITH_CONCERNS/BLOCKED), commits, one-line test summary, concerns, report path.

You do not dispatch subagents. Do not spawn a reviewer.
