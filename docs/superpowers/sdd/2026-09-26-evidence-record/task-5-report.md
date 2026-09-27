# Task 5 report — `verifyEvidenceRecord` pure-data recompute

```yaml
agent: builder
period: ad-hoc
generated_at: 2026-09-27T00:00:00Z
repo_revision: c2b7d64
inputs:
  - .superpowers/sdd/2026-09-26-evidence-record/task-5-brief.md
  - packages/engine/src/evidence/record.ts
  - packages/engine/src/evidence/index.ts
  - packages/engine/src/index.ts
  - packages/engine/src/diagnostics/codes.ts
  - tests/schema-sync/schema-sync.test.ts
  - tests/evidence/{canonical-hash,record-build}.test.ts
owner: "@builder"
decision_level: info
```

## What I read

- The task brief (binding values: code literals, test cases, commit message).
- `packages/engine/src/evidence/record.ts` (the existing builder, contract types, structural
  validator, and the sanctioned import surface).
- `packages/engine/src/evidence/{index.ts,canonical-stringify.ts}`, `packages/engine/src/index.ts`
  (root barrel), `packages/engine/src/diagnostics/codes.ts`.
- Existing evidence tests `canonical-hash.test.ts` (the browser-surface reachability guard) and
  `record-build.test.ts` (so my builder refactor stays green).
- `tests/schema-sync/schema-sync.test.ts`, `vitest.config.ts`, `packages/engine/package.json`
  (exports + build:schema), `tsconfig.base.json` (strict/exactOptionalPropertyTypes/noUncheckedIndexedAccess),
  `packages/engine/src/spec/schemas/diagnostics.schema.ts` (the `Diagnostic` shape).

## Step 1 (verify, not insert) — DONE, no edit

The six `EVIDENCE.*` codes already exist verbatim at `codes.ts:41-46` (inserted by Task 4). I
confirmed name+value equality against the brief and did NOT re-insert (that is a TS1117 duplicate-key
error). Because `buildEvidenceRecord`'s `issue()` return type is `Diagnostic` and `code` is the Ajv
union over `Object.values(DiagnosticCodes)`, the codes were already required to compile.

## What I changed and why

1. `packages/engine/src/evidence/record.ts`
   - Builder refactor: line ~139 `JSON.parse(JSON.stringify({...record, recordId: undefined}))`
     → `normaliseEvidencePayload({...record, recordId: undefined})`, returning an
     `EVIDENCE.RECORD_INVALID` diagnostic when it yields `undefined` (a cyclic/BigInt payload no
     longer throws). Builder and verifier now share the ONE normalisation expression (fact #4).
   - Appended `EvidenceAssertionStatus`, `EvidenceAssertion`, `EvidenceVerificationResult`,
     `VerifyEvidenceRecordOptions`, `normaliseEvidencePayload`, `verifyEvidenceRecord`, and the pure
     helpers `exclusionAssertion`, `unverifiableAssertions`, `checkLineage`, `previousRevision`,
     `checkInversePatchHashes`, `safeCanonicalHash`, `checkCapabilityDrift`, `blockedCodes`.
     No new value import was added — `record.ts` still value-imports only `node:crypto` and the
     `./canonical-stringify.js` sibling (fact #3, Task 6 inlining preserved).
2. `packages/engine/src/evidence/index.ts` — added the 5 verify symbols from the brief's Step 4b
   list (`EvidenceAssertion`, `EvidenceAssertionStatus`, `EvidenceVerificationResult`,
   `VerifyEvidenceRecordOptions`, `verifyEvidenceRecord`) to the `record.js` export batch. Kept
   `EVIDENCE_RECORD_SCHEMA_VERSION` and everything else. (This is where Task 6/7/8 consume
   `verifyEvidenceRecord`, per fact #2.)
3. `packages/engine/src/index.ts` (root barrel) — added the 4 **type-only** verify symbols to the
   existing `export type { ... } from "./evidence/record.js"` block. See Deviation D2 for why
   `verifyEvidenceRecord` (the value) is deliberately NOT exported here.
4. `tests/schema-sync/schema-sync.test.ts` — added the Step 7 lock `locks EvidenceIssueCode literals
   into DiagnosticCodes`. See Deviation D3.
5. New: `tests/evidence/fixtures/record.ts` and `tests/evidence/record-verify.test.ts`.

## TDD evidence

### Red (Step 3), before implementation
`pnpm exec vitest run tests/evidence/record-verify.test.ts` → EXIT=1,
8 tests fail with `TypeError: verifyEvidenceRecord is not a function` (the static "never executes
commands" file-read test passed already). (A first run also exposed an off-by-one in my own path
edits; corrected back to the brief's verbatim `./fixtures/record.js` and `../../packages/...`, both
of which are correct relative to `tests/evidence/record-verify.test.ts`.)

### Green (Step 5)
`pnpm exec vitest run tests/evidence tests/schema-sync` → EXIT=0:
- `tests/evidence/canonical-hash.test.ts` (6) — browser guard still green (root barrel stays
  node:crypto-free).
- `tests/evidence/record-verify.test.ts` (9) — 6 brief tests + 3 hostile-input tests.
- `tests/evidence/record-build.test.ts` (21) — unaffected by the builder refactor (lines 48/74
  still hold; `normaliseEvidencePayload` returns the identical value for all non-hostile payloads).
- `tests/evidence/capability-matrix.test.ts` (8)
- `tests/schema-sync/schema-sync.test.ts` (27)
- Total: 5 files / 71 tests passed.

### Load-bearing / mutation evidence (Step 6)
Each mutation was applied, the relevant test confirmed RED, then reverted; a final grep confirmed no
`MUTATION` markers remain and the suite re-ran green.

- MUTATION-1 — `checkLineage` body first line → `return undefined;`:
  `reports EVIDENCE.DERIVATION_FAILED on a broken revision lineage` FAILS. (Proves DERIVATION_CLOSED
  depends on lineage recomputation, not on the fixture happening to look right.)
- MUTATION-2 — `chainClosed` → `typeof record.recordId === "string";`:
  BOTH `reports EVIDENCE.CHAIN_BROKEN when a data-bearing byte of the record changes` AND my cyclic
  hostile test FAIL. (Proves CHAIN_CLOSED depends on the canonical re-hash comparison.)
- MUTATION-3 — `exclusionAssertion` hardcoded to always `not-covered`:
  `survives a record whose collection fields are missing or non-array` FAILS. (Proves the
  exclusion-driven `not-covered` vs `failed` branch is load-bearing, i.e. a `not-covered` row cannot
  sneak an assertion that should have run into a green `ok`.)

## Ambiguities I resolved in code (per the resolved-ambiguity instructions)

- **not-covered is exclusion-driven.** `OFFLINE_REPLAY` and `VISUAL_CONSISTENCY` (the two claims a
  data-only verifier can never check) report `not-covered` with the brief's exact detail strings ONLY
  when `record.exclusions` declares them; otherwise they report `failed` and hold `ok` down. The brief's
  Step 4 code hardcoded them as always `not-covered`; I honored the stronger controller ruling that a
  `not-covered` row must never carry an assertion that should have run. `validRecord` declares both
  (default exclusions), so the brief's test 1 still passes byte-for-byte.
- **Structural scope not widened.** The verifier reads only the fields the recomputation needs; it does
  not deep-validate `MapCommand`/`MapSpec`. `inversePatch` is read via a narrow `as { inversePatch?:
  unknown }` cast, exactly as the brief's footnote prescribes.
- **Constraint 7 totalisation.** Every collection/object/`toolchain`/`project`/`capabilities` access is
  guarded (`Array.isArray`, optional-chaining, `!!toolchain &&`), and unserialisable payloads / inverse
  patches are caught (`normaliseEvidencePayload`, `safeCanonicalHash`). No code path throws: nullish
  record → `RECORD_INVALID` + all-`failed`; cyclic record → `CHAIN_BROKEN`; missing/non-array
  collections → all `failed`, `ok:false`. `ARTIFACTS_MATCH` was hardened to `failed` on an empty
  artifact list (see Deviation D1) so a forged 0-artifact record cannot produce a vacuous pass.

## Gates (real exit codes; output redirected, never trusted from a pipe)

1. `pnpm exec vitest run tests/evidence tests/schema-sync` → **EXIT=0** (71 passed).
2. `pnpm build:schema` → **EXIT=0** (regenerates `dist/schema/**` only; nothing tracked to commit).
3. `pnpm check` → **EXIT=0** (full `pnpm build` incl. the studio Vite bundle + the entire `pnpm test`
   matrix + `pnpm test:studio`; the run completed with 0 and the studio suite alone shows 6 files /
   52 tests passing). No `ERR_`/`error TS`/failed line anywhere in the 406-line log.

## Deviations from the brief

- **D1 — `ARTIFACTS_MATCH` status hardening.** Brief: `artifactIssues.length === 0 ? "passed" : "failed"`.
  Mine adds `artifactEntries.length > 0 &&` so a record with zero artifacts is `failed`, not a vacuous
  `passed`. Reason: constraint 7 + the "an assertion that should have run must not make `ok` true"
  ruling; the builder already forbids empty artifacts, so the only way to reach 0 is a hand-forged
  record, which must not pass. The brief's happy-path test (1 of 1) is unaffected.
- **D2 — `verifyEvidenceRecord` NOT value-exported from the root barrel.** Brief Step 4b lists
  `verifyEvidenceRecord` in the batch added to `packages/engine/src/index.ts` and asserts
  "Task 6/7/8 全部通过 `@gis-engine/engine` 消费 `verifyEvidenceRecord`." This contradicts fact #2 and
  would break `tests/evidence/canonical-hash.test.ts`'s reachability guard (the root barrel is bundled
  by apps/studio + examples; value-exporting `record.js` drags `node:crypto` into the browser graph).
  I export the 4 verify **types** from the root barrel (safe, erased) and the value `verifyEvidenceRecord`
  from the subpath `@gis-engine/engine/evidence` only, which is what the brief's own test file imports.
  Downstream Tasks 6/7/8 should import from the subpath.
- **D3 — Step 7 test uses the statically imported value, not a root-barrel dynamic import.** Brief:
  `const { EvidenceIssueCode } = await import("@gis-engine/engine")`. The root barrel re-exports
  `EvidenceIssueCode` only as a **type** (fact #2), so that runtime import yields `undefined` and
  `Object.values(undefined)` throws. I reference the `EvidenceIssueCode` value already imported at the
  top of the file from `@gis-engine/engine/evidence`. Semantics preserved: every `EvidenceIssueCode`
  literal is asserted to be a registered `DiagnosticCodes` entry. (A separate bidirectional sort-equal
  lock already exists from Task 4; I did not remove it.)
- **D4 — test-5 import regex widened.** Brief: `expect(text).not.toMatch(/^import\s+(?!type)[^\n]*from\s+"(?!node:)/m)`.
  As written this FAILS against the repo, because `record.ts` legitimately value-imports
  `./canonical-stringify.js` (its sanctioned hash-closure sibling per fact #3; Task 6 inlines exactly
  that closure). I widened the lookahead to also allow `./canonical-stringify.js`:
  `...from\s+"(?!node:)(?!\.\/canonical-stringify\.js)`. Intent preserved — engine runtime modules,
  TypeBox, and Ajv value imports are still rejected. The `applyCommands` assertion is verbatim.

## Deliberately NOT done

- Did NOT touch `tests/schema-sync`'s duplicated `validInput()` fixture or refactor it into the new
  fixtures file (per instructions).
- Did NOT edit any parked minor in the ledger; my only schema-sync edit is the Step 7 sync lock.
- Did NOT re-insert the diagnostic codes (Step 1 verify-only), NOT touch `vitest.config.ts` (the
  subpath alias is already listed before the root alias), NOT export `normaliseEvidencePayload`/`sha256Of`
  beyond what the brief's Step 4b/Step 2 list requires (kept the surface to the specified 5 symbols).
- Did NOT modify `packages/engine/src/evidence/{schema.ts,capability-matrix.ts}`.

## Concerns for the reviewer

- Task 6's standalone-verifier inlining: `record.ts` now contains the full verifier plus 8 helper
  functions but still only value-imports `node:crypto` + `./canonical-stringify.js`, so the
  dependency-free closure is intact. Task 6 should confirm the "never executes commands" regex stays
  accurate if new helper bodies are added.
- `unverifiableAssertions()` uses `Object.values(EvidenceAssertionId)`; if a future assertion id is
  added that is NOT exclusion-backed, the non-object early-return path marks it `failed`, which is the
  conservative choice.
- The `!` non-null assertion in the brief's DERIVATION test (`validRecord.commands[0]!`) produces a
  Biome `noNonNullAssertion` **warning** (not error; `biome check` exits 0), matching repo tolerance.

## Fix round 1

```yaml
agent: builder
period: ad-hoc
generated_at: 2026-09-27T04:45:00Z
repo_revision: 98f946e
inputs:
  - packages/engine/src/evidence/record.ts
  - tests/evidence/record-verify.test.ts
  - tests/evidence/fixtures/record.ts
  - .superpowers/sdd/2026-09-26-evidence-record/task-5-brief.md
  - docs/superpowers/plans/2026-09-26-evidence-record.md (Task 5 Step 4, Task 7 Step 1)
owner: "@builder"
decision_level: info
```

### What I read

- `packages/engine/src/evidence/record.ts` in full (builder, `structuralIssues`, the verify pass, and
  the four pure-data helpers).
- `tests/evidence/record-verify.test.ts` in full and `tests/evidence/fixtures/record.ts` (the shared
  builder the review says must stay the single fixture source).
- `.superpowers/sdd/2026-09-26-evidence-record/task-5-brief.md` — the binding contract (six assertion
  ids, interfaces, Step 6 load-bearing rule). NOTE: the review file the task pointed me at,
  `task-5-review.md`, does not exist in this worktree (`.superpowers/sdd/2026-09-26-evidence-record/`
  holds task-5-brief.md, task-5-report.md and review-*.diff only), so I worked from the controller
  rulings in the task message, which are authoritative anyway.
- Plan Task 5 Step 4 / Step 4b / Task 7 Step 1 blocks in
  `docs/superpowers/plans/2026-09-26-evidence-record.md`.
- `packages/engine/src/evidence/index.ts` (subpath export surface — unchanged this round) and a
  repo-wide grep confirming nothing consumes `verifyEvidenceRecord` yet besides the subpath barrel and
  the schema-sync code lock, so no downstream file needed adapting.

### L-1 — applied-only lineage (`checkLineage` rewritten, `previousRevision` deleted)

Red first: 9 new lineage tests written against the unmodified source → `Tests 15 failed | 11 passed`
(`pnpm exec vitest run tests/evidence/record-verify.test.ts`, EXIT=1). Each clause:

| Clause | Test | Red evidence before the fix |
| --- | --- | --- |
| 1 applied entry must carry string revisions | "fails when an applied entry omits its revision fields" / "…carries a non-string revision field" | no `DERIVATION_FAILED` at `/commands/0`; `DERIVATION_CLOSED` reported `passed` |
| 2 applied entries form one unbroken chain project→project | "reports EVIDENCE.DERIVATION_FAILED on a broken revision lineage" (kept), "fails on a gap between two applied entries, naming the successor", "keeps the chain anchored to the applied entries, not their array indexes" | gap test: only `/commands`-level noise; leading-`skipped` test: **false failure** because the predecessor was array-index keyed |
| 3 non-applied entries may omit, but never corrupt | "tolerates a skipped entry that carries no revisions" (positive, was already green) / "fails when a non-applied entry supplies a non-string revision" | malformed `baseRevision: true` on a skipped entry passed silently |
| 4 zero applied ⇒ only closed when base === revision | "fails when the project revision moved without any applied command" / "closes lineage for zero applied commands only when the project revision did not move" | moved-revision case reported `passed / "revision lineage closed"` |
| 5 non-string project anchors are a failure | "fails when project.revision is not a string…" / "…project.baseRevision is not a string…" (both re-sealed so `CHAIN_CLOSED` stays `passed`) | silent pass; assertion `passed` |

Every failure path is *derived* into `DERIVATION_CLOSED` (`status: lineageIssue || inverseIssue ? "failed" : "passed"` was already diagnostic-driven and is unchanged); no row is hardcoded.
Tests pin code + path + the entry index inside the message, never "some diagnostic appeared".

### L-2 — `ok` is no longer diagnostic-blind

- `ok: assertions.every(a => a.status !== "failed") && !diagnostics.some(d => d.severity === "error")`
  (severity test, not `diagnostics.length === 0`; the six assertion ids and array shape are untouched).
- `verifyEvidenceRecord` now calls `structuralIssues(record)` once, right after the non-object guard,
  and folds those diagnostics in — zero new imports, so constraint 3 is untouched.
- New tests: unsupported `schemaVersion` on an otherwise all-green record ⇒ zero `failed` rows but
  `ok === false`; forged *re-sealed* (chain-closed) records with `spec.beforeHash: "not-a-hash"`, with
  `issuedAt: "yesterday"`, and with non-string `project.revision` ⇒ `RECORD_INVALID` (and lineage
  failure) pin the record down. Red evidence: `expected true to be false`, `expected [] to deep equally
  contain ObjectContaining{…}`.

### Capability drift (`available` side) + never-throw options

- `checkCapabilityDrift` now compares both lists as sorted sets: `available` drift ⇒
  `CAPABILITY_DRIFT` at `/capabilities/available` naming the available list; `blocked` drift keeps its
  message/path. A matching-matrix test pins that the check does not over-block (reason/`path` on the
  recorded side are still ignored). No new dependency; still only runs when `expectedCapabilities` is
  supplied.
- Options guard: `readArtifact`/`expectedCapabilities` are read through a nullish-safe probe, so
  `verifyEvidenceRecord(record, undefined)`/`null` no longer throws. Missing reader ⇒ one
  `ARTIFACT_MISMATCH` diagnostic at `/artifacts` and `ARTIFACTS_MATCH` `failed` (honest, never a
  vacuous pass); no `CAPABILITY_DRIFT` is invented.

### Mutation proofs (each perturbation → red → restored → suite re-green)

| # | Perturbation | Result |
| --- | --- | --- |
| A | applied-entry missing revisions → `continue` (restores the vacuous skip) | 1 failed: "fails when an applied entry omits its revision fields" — the diagnostic degraded to `…/commands … "project revision moved from \"r0\" to \"r1\" without any applied command."`, proving the `/commands/0` branch is load-bearing |
| A2 | malformed revision fields → `continue` | 3 failed: applied-omits, applied-non-string, non-applied-supplies-non-string |
| A3 | chain predecessor keyed off `commands[index - 1]` instead of the applied list | 1 failed, and only "keeps the chain anchored to the applied entries, not their array indexes" — exactly the leading-`skipped` defect |
| B | `ok: assertions.every(...)` (drop the diagnostic test) | 6 failed: both drift tests, unsupported-version test, forged `spec.beforeHash`, forged `issuedAt`, "treats an error-only diagnostic as blocking" |
| C | `diagnostics.push(...structuralIssues(record))` commented out | 2 failed: the two forged-chain-closed structural tests (lineage-only forgeries stay green, as designed) |
| D | `options.readArtifact` / `options.expectedCapabilities` read unguarded | 1 failed with `TypeError: Cannot read properties of undefined (reading 'readArtifact')` |
| E | `available` comparison disabled | 1 failed: the `available`-drift test |

After each run the marker was removed; `grep -rn "MUTATION" packages/engine/src tests/evidence` → "no
markers", and `git diff --stat` shows only the three intended files (no leftover perturbation, no
`dist/**` in the commit — dist is ignored).

### Test hygiene

- The module-level mutable `artifacts` Map is gone: `artifactReader(files)` builds a per-test store, so
  a failed expectation cannot leak a poisoned byte into a later test, and no restore-after-assert
  ordering remains.
- `validRecord.commands[0]!` replaced by a destructured `fixtureCommand` with an explicit presence
  check; `pnpm exec biome check` on both changed files now reports 0 errors and 0 warnings (the only
  remaining finding is the pre-existing `useTemplate` *info* on `record.ts:113` from Task 4, untouched
  and non-failing).

### Gates (real exit codes, output redirected)

1. `pnpm exec vitest run tests/evidence tests/schema-sync` → **EXIT=0**, 5 files / **88 tests passed**
   (record-verify alone: 26, up from 9).
2. `pnpm build:schema` → **EXIT=0**.
3. `pnpm check` → **EXIT=0** (405-line log, zero `FAIL` / `error TS` lines).
   Also `pnpm exec tsc -p tests/types/tsconfig.json` → EXIT=0.

### Deviations from the shipped round-1 shape

- **Lineage diagnostic paths are now per-entry** (`/commands/<index>`, `/project/baseRevision`,
  `/project/revision`) instead of the single `/commands` the old code used for everything, because the
  ruling requires the failing entry to be named. Messages for the two anchor cases and the zero-applied
  case are new text; the two historical messages ("…does not continue the revision lineage.", "The
  final command revision does not match project.revision.") are preserved verbatim so any consumer
  string-matching them (none today) is unaffected.
- **`ARTIFACT_MISMATCH` is the code used for a missing `readArtifact`.** The `EVIDENCE.*` vocabulary is
  frozen (I must not touch `codes.ts`), and "an artifact byte could not be read" is the honest
  semantics; `RECORD_INVALID` would blame the record for the caller's omission.
- **`structuralIssues` is re-run on the record object, not on a re-typed input.** It takes
  `EvidenceRecordInput`; an `EvidenceRecord` is structurally assignable (extra `schemaVersion` /
  `recordId` are ignored), so no cast, no duplicate validator, and no deep `MapCommand`/`MapSpec`
  validation was added — Ajv still owns that.
- Plan amended (not just code): Task 5 Step 4's `verifyEvidenceRecord` + `checkLineage` +
  `checkCapabilityDrift` blocks now carry the shipped rules, a consumer-facing paragraph states
  "`ok` = no failed assertion **and** no error diagnostic ⇒ Task 7 must branch on `result.ok`", the
  assertions-array shape is called out as frozen for Tasks 6/7/8, and Task 7's Step 1 test now asserts
  `result.ok` before the assertions filter. A short pointer notes that the shipped verify test file is
  authoritative over Step 2's first-draft skeleton.

### Deliberately NOT done

- Did not add a seventh assertion id, rename one, or change `EvidenceAssertion[]` ordering/shape (spec
  §8 contract for Tasks 6/7/8).
- Did not touch `MAX_EVIDENCE_RECORD_BYTES`, `normaliseEvidencePayload` (still the single shared hash
  expression), the subpath-only export of `verifyEvidenceRecord`, `diagnostics/codes.ts`, the root
  barrel, or any other task's files.
- Did not widen `structuralIssues` into deep command/spec validation.
- Did not loosen or delete any existing test; the file-text "never executes commands" guard is
  byte-identical (constraint 2), and the hostile-input and exclusion-driven rows all still run.
- Did not create the missing `task-5-review.md`; recorded as context, not fabricated.

### Concerns for the reviewer

- `ok` is now strictly more conservative: any record whose `schemaVersion` is newer, or that trips a
  structural rule, is red even with green rows. Task 7's CLI exit code (`result.ok ? 0 : 2`) will
  therefore start failing on records the earlier shape let through — that is the intended fix, but the
  Task 7 implementation note "不得为了让包能导出而放宽" applies to the gate, not to `ok`.
- `structuralIssues(record)` on an *unsupported-version* record reports that version's fields under
  v0.1 rules, so a future v0.2 record can produce both `SCHEMA_VERSION_UNSUPPORTED` and
  version-artifact `RECORD_INVALID` rows. `ok` is right either way; if v0.2 ever ships, the version
  check should short-circuit the v0.1 structural pass rather than stack noise.
- Task 6 inlines `record.js`'s compiled output: this round adds no value import, but the file now calls
  `structuralIssues` from `verifyEvidenceRecord`, so the standalone verifier must keep that function in
  its closure (it already ships for the builder path).
