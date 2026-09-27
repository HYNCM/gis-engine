# Task 5 — task review (spec + quality)

Range: `c2b7d64..98f946e`. Package: `review-c2b7d64..98f946e.diff`.
**Verdict: Needs fixes** — no Critical; two Important, both labeled plan-mandated.

## Spec compliance

✅ Substantially compliant. Verified: `codes.ts` untouched (six `EVIDENCE.*` literals already at
`diagnostics/codes.ts:41-46`); one shared `normaliseEvidencePayload` used by builder
(`record.ts:140-150`) and verifier — no second JSON-round-trip spelling left in the file;
constraint 2 purity enforced by the file-text guard (`record-verify.test.ts:65-76`); constraint 3
value imports unchanged (`record.ts:1-3`); constraint 4 `not-covered` only when declared, else
`failed`; `verifyEvidenceRecord` value-exported only through the subpath with the root barrel gaining
four type-only symbols + comment, and the BFS guard it protects confirmed at
`tests/evidence/canonical-hash.test.ts:44-58`; Step 7 sync lock added.

⚠️ Not verifiable from this diff: Task 6's build-script closure guard; the pasted mutation outputs;
the `pnpm check` / `build:schema` green claims (not re-run per instructions); whether the subpath
export shifts the MCP contract surface (no tool schema touched).

## Strengths

- The `normaliseEvidencePayload` consolidation closes Task 4's I-4 with the reason recorded in the
  doc comment.
- Test 4 rebuilds through `buildFixture` so the recordId stays valid and asserts CHAIN_BROKEN is
  *absent* (`record-verify.test.ts:53-54`) — a discriminating test.
- Test 1 pins the whole sorted assertions array with `toEqual` (status, order, detail).
- Hostile-input suite exercises the real function with `readArtifact` as the only seam.
- `.sort()` split onto its own statement to keep the status literals from widening.
- The plan amendment commit keeps the governing document honest instead of silently deviating.

## Important

1. **DERIVATION_CLOSED passes vacuously when command revisions are absent** — `record.ts:559`,
   `565-567` skip checks silently on missing/non-string revisions, which are optional on
   `EvidenceRecordCommand` (`record.ts:57-58`) and never required by `structuralIssues`
   (`record.ts:230-245`). A builder-valid record with no revision data verifies `passed` having
   checked nothing — the `not-covered` smuggling prohibition applied to `passed`. *Plan-mandated:*
   the brief's Step 4 code has the identical conditional-skip shape.
2. **`ok: true` despite `SCHEMA_VERSION_UNSUPPORTED` / `CAPABILITY_DRIFT`** — `ok` computed from the
   six assertion rows only (`record.ts:~514`); the version check (`record.ts:397-403`) and drift
   check (`record.ts:~461-464`) only append diagnostics, so Task 7's CLI would green-light records the
   verifier declares it cannot interpret. *Plan-mandated* (identical in the brief; brief test 6
   asserts only the diagnostic).

## Minor

- The verifier never re-runs `structuralIssues`, so a chain-closed forge with garbage
  `spec.beforeHash` / malformed `issuedAt` passes (`record.ts:381-514`).
- `checkCapabilityDrift` compares only sorted blocked-code sets; `available` drift unnoticed.
- Module-level mutable `artifacts` Map restored after the assertions
  (`record-verify.test.ts:6,42-50`) leaks on a failed expectation.
- `verifyEvidenceRecord(record, undefined as any)` throws at `options.expectedCapabilities`.
- New schema-sync lock is a one-directional subset of Task 4's exact-set lock (brief-mandated, harmless).
- Biome `noNonNullAssertion` warning on `validRecord.commands[0]!` — output not pristine.

## Deviation rulings (all correct)

- **D1** zero-artifacts ⇒ `failed`: right, since the builder forbids empty artifacts and a vacuous
  `passed` would feed `ok`.
- **D2** no root-barrel value export: matches the amended ruling; BFS guard verified.
- **D3** static import instead of the brief's `await import("@gis-engine/engine")`: the root barrel
  exports `EvidenceIssueCode` type-only, so the brief's runtime import would yield `undefined` and
  `Object.values(undefined)` would throw — the brief's test as written could never pass.
- **D4** widened import regex: the brief's own constraint 3 sanctions `./canonical-stringify.js`; the
  lookahead still rejects engine/TypeBox/Ajv value imports and keeps the `applyCommands` assertion.

## Verifier-hole analysis

- Authorship is not proven, only self-consistency: `recordId = canonicalHash(body)` is re-derivable by
  anyone who edits a field — correct-by-design for the pure-data tier (§6 decision 4); anchoring
  honest issuance is Tasks 7/8's job.
- Read-but-never-re-derived fields (`spec.*Hash`, `origin.*Hash`, `project.*Revision` vs a real VCS,
  `artifact.role`, `issuer`, `issuedAt`) are *reported claims*, not verifiable ones — but their
  **format** was also unchecked, which is a hole, not a design choice.
- Vacuous lineage (Important 1) and version/drift blindness (Important 2) were holes.
- Artifact bytes are matched by sha256 + length — solid recompute. `artifact.path` is handed to
  caller-supplied `readArtifact` verbatim ⇒ path-traversal policy is a Task 7 CLI obligation.

## Controller rulings issued after this review (fix round 1 scope)

- L-1: applied-only chain anchored at `project.baseRevision` → `project.revision`, five clauses
  including non-string anchors and the zero-applied-moved-revision case; per-entry diagnostic paths;
  assertion derived from the lineage diagnostic, never hardcoded.
- L-2: `ok === (no failed assertion) && (no severity:"error" diagnostic)`, six assertion ids frozen;
  verifier re-runs `structuralIssues(record)` once and folds it in.
- Folded in as Minors: `available` drift, missing-options guard, per-test artifact state, pristine
  test output.
