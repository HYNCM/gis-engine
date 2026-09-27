# Task 5 — scoped re-review, fix round 1

Range: `98f946e..c0bb64b`. Package: `review-98f946e..c0bb64b.diff`.
**Verdict: All findings addressed, no new Critical/Important breakage ⇒ Task 5 complete.**

## Finding verdicts (all ADDRESSED)

- **L-1 vacuous lineage** — `checkLineage` rewritten at `record.ts:588-652` into exactly the ruled
  five clauses: applied-entry missing/non-string revision ⇒ `DERIVATION_FAILED` at `/commands/<i>`
  (`620-625`); chain walks only `applied` entries anchored `project.baseRevision` →
  `project.revision` (`636-650`) and is **not** index-keyed, so a leading `skipped` entry cannot
  corrupt the predecessor expectation (test present and green); non-applied entries may omit
  revisions (`619`) but a supplied non-string fails (`613-618`, `null` caught); zero applied closes
  only when `baseRevision === revision` (`629-634`); non-string project anchors fail per anchor path
  (`599-607`). The row is derived: `status: lineageIssue || inverseIssue ? "failed" : "passed"`
  (`515`). Dead `previousRevision` helper deleted.
- **L-2 `ok` blind to diagnostics** — `record.ts:544-547` implements the ruled formula with the
  severity test; `structuralIssues(record)` re-run exactly once right after the non-object guard
  (`408`) and folded in; three re-seal forgery tests (garbage `spec.beforeHash`,
  `issuedAt: "yesterday"`, non-string `project.revision`) now red. Test 1's `toEqual([])` on
  diagnostics proves the re-run is silent for honest evidence.
- **Minors folded by ruling** — `available` drift detected both directions with a naming message
  (`688-722`); missing/`null` options no longer throws and reports `ARTIFACTS_MATCH` `failed`
  honestly (`435-447`); per-test `artifactReader(files)` replaces the module-level mutable Map; the
  `commands[0]!` non-null assertion is gone — re-reviewer ran Biome on both changed files: 0 errors,
  0 warnings (only the pre-existing Task 4 `useTemplate` **info** at `record.ts:113`).
- Not folded (unchanged): the one-directional schema-sync lock, which the review itself graded
  harmless.

## Regression probes the re-reviewer ran

Twelve honest builder-produced shapes round-tripped through
`buildEvidenceRecord → JSON.parse(JSON.stringify(record)) → verifyEvidenceRecord` against fresh
`dist` (plain transport, stamped `issuedAt`, `origin.planHash` undefined/absent/valid, mixed
skipped/applied/failed, zero-applied with equal anchors, unsorted/duplicated exclusions, `blocked`
with optional `path`, matching `expectedCapabilities`, duplicated `nextRevision`, skipped entry with
unrelated string revisions): **all `ok: true` with an empty diagnostics array — no false red.** The
structural re-run is safe by construction because the builder already validates the record-shaped
object (`record.ts:133`).

Risk 2/3/4: mixture cases only pass through a real chain walk; `not-covered` rows neither block `ok`
nor smuggle a green; the six assertion ids, statuses and sort order are byte-identical to the
pre-fix shape (no seventh row). Constraint 2/3/7 hold: no new value import in `record.ts:1-3`, no
`applyCommands`, no new throw path. Reported counts reproduced independently (88 across the two
suites, 26/26 focused, red-first 15|11 consistent, mutation B's "6 failed" matching the six
severity-gated tests).

## Residual items → controller action

1. **Plan Step 4 skeleton drift** (the block still showed two hardcoded `not-covered` rows, the
   chained `.sort()`, `record.artifacts.length` and an unsafe `record.toolchain` detail, and omitted
   `unverifiableAssertions`/`exclusionAssertion`): closed by the controller in a docs commit — the
   block now matches the shipped shape and carries an explicit "Step 4 is illustrative; shipped
   `record.ts` is authoritative" note so no later task re-copies a weaker version.
2. **Symbol-typed leaf** — `SHA256_PATTERN.test(symbolValue)` would throw for a symbol-valued
   `origin.planHash` reached through `structuralIssues`. Unreachable for anything a JSON transport can
   carry (the auditor's only intake) and pre-existing since Task 4's builder-input validation. **Ruled
   Minor, ledgered for the final whole-branch review**, alongside the cyclic/BigInt note it shares a
   class with.
3. **v0.2 stacking** (an unsupported `schemaVersion` also produces `RECORD_INVALID` rows from the
   structural re-run next to `SCHEMA_VERSION_UNSUPPORTED`) — deferred; `ok` is correct either way.
