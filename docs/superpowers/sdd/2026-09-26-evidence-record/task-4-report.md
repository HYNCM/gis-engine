# Task 4 Report — `EvidenceRecord` schema + `buildEvidenceRecord`

```yaml
agent: builder
period: ad-hoc
generated_at: 2026-09-27T03:00:00Z
repo_revision: "62a357a"
inputs:
  - .superpowers/sdd/2026-09-26-evidence-record/task-4-brief.md
  - packages/engine/src/evidence/record.ts
  - packages/engine/src/evidence/schema.ts
owner: "@builder"
decision_level: info
```

## Status: DONE_WITH_CONCERNS (one latent-flake concern + one cross-task note; both flagged below, neither blocking)

Commit: `62a357a` — `feat(evidence): add EvidenceRecord contract and hash-chained builder`

## What I implemented

1. **`packages/engine/src/evidence/record.ts`** (modified): appended the `EvidenceRecord`
   shape + builder + a zero-dependency structural validator, exactly per brief Steps 3/4.
   - Constants `EVIDENCE_RECORD_SCHEMA_VERSION = "evidence-record.v0.1"`,
     `MAX_EVIDENCE_RECORD_BYTES = 1_048_576`.
   - `EvidenceAssertionId`, `EvidenceExclusionId`, `EvidenceIssueCode` const+type pairs.
   - Interfaces `EvidenceRecordArtifact`, `EvidenceRecordCommand`, `EvidenceRecordCapabilities`,
     `EvidenceRecord`, `EvidenceRecordInput`, `BuildEvidenceRecordResult`.
   - `buildEvidenceRecord`: structural pre-check → build record → self-referential `recordId`
     via `canonicalHash({ ...record, recordId: undefined })` → size budget rejection (never
     truncates). `DEFAULT_EXCLUSIONS = ["OFFLINE_REPLAY", "VISUAL_CONSISTENCY"]`.
   - `structuralIssues`/`issue`/`SHA256_PATTERN` hand-written validator (Ajv-free).
   - **Ruling #1 honored:** the only value imports in the file remain `node:crypto` and the
     intra-closure `./canonical-stringify.js`. The new `import type { Diagnostic, MapCommand } from
     "../types.js"` is type-only. No value import of `../diagnostics/codes.js`.
2. **`packages/engine/src/evidence/schema.ts`** (new): TypeBox `EngineCapabilityBlockerSchema`,
   `EngineCapabilityMatrixSchema` (own `$id`), `EvidenceRecordSchema` (own `$id`), embedding
   `stripNestedIds` copies of `DiagnosticSchema` / `MapCommandSchema` / `EngineCapabilityMatrixSchema`
   so the whole tree carries exactly one `$id`. Ajv-formats avoided; `Iso8601Utc` uses an explicit
   pattern per the brief.
3. **`packages/engine/src/spec/schemas/generation.schema.ts`**: added `export` to `stripNestedIds`
   only (body unchanged). Not re-exported through `spec/schemas/index.ts` (public API unchanged).
4. **`packages/engine/src/diagnostics/codes.ts`** (see Deviation 1): added the six `EVIDENCE.*`
   diagnostic codes after `SchemaInvalid`, using the plan's exact key names/values.
5. **`packages/engine/src/evidence/index.ts`**: exported the new record + schema surface (see Deviation 2).
6. **`packages/engine/src/index.ts`** (root barrel): re-exported the node-free schema values
   (`EvidenceRecordSchema`, `EngineCapabilityMatrixSchema`, `EngineCapabilityBlockerSchema`, plus the
   two `*FromSchema` types) and the `record.js` interfaces/types via a single whole-statement
   `export type { … } from "./evidence/record.js"`. This form is exactly what the browser-surface
   reachability guard skips, so `record.js`/`node:crypto` never enters the barrel's runtime graph.
7. **`packages/engine/scripts/build-schema.ts`**: registered
   `evidence-record.v0.1.schema.json` + `engine-capabilities.v0.1.schema.json`.
8. **`tests/evidence/record-build.test.ts`** (new): the brief Step 1 test verbatim (11 cases).
9. **`tests/schema-sync/schema-sync.test.ts`**: added `EvidenceRecordSchema` +
   `EngineCapabilityMatrixSchema` to the engine import block and the Ajv compile list; added the
   brief Step 7 nested-`$id` guard verbatim; added the schema↔validator alignment lock (Ruling #2)
   and the `EvidenceIssueCode`↔`DiagnosticCodes` sync lock (Ruling #1).

## Gate-by-gate results (real exit codes; captured with `>file 2>&1`, not from pipes)

- **Step 1/2 (TDD red)** `pnpm vitest run tests/evidence/record-build.test.ts` → `EXIT=1`.
  Reason: `EvidenceRecordSchema` (and the other Task 4 symbols) do not exist yet, so
  `Ajv.compile(undefined)` throws `schema must be object or boolean` at collection time — the
  "imported symbols don't exist" red the brief expects.
- **Baseline (pre-work)** `pnpm vitest run tests/evidence` → `EXIT=0`, 14 tests / 2 files.
- **Post-impl evidence** `pnpm vitest run tests/evidence` → `EXIT=0`, **25 tests / 3 files**
  (canonical-hash 6, record-build 11, capability-matrix 8). The browser-surface guard (6 tests)
  stayed green with the new root-barrel exports, confirming no `node:` leak.
- **`pnpm build:schema`** → first `EXIT=2` (Deviation 2 surfaced: TS2300 duplicate identifier from
  the brief's literal Step 6 export block). After the fix → `EXIT=0`; regenerated
  `dist/schema/diagnostics.v0.1.schema.json` contains all 6 `EVIDENCE.*` codes, and
  `evidence-record.v0.1.schema.json` / `engine-capabilities.v0.1.schema.json` each contain exactly
  one `"$id"`.
- **`pnpm test:schema-sync`** → `EXIT=0`, **21 tests** (16 pre-existing + nested-`$id` guard +
  4 alignment/sync guards).
- **`pnpm test:schema`** → `EXIT=0`, **137 tests / 4 files**.
- **`pnpm test:ai`** → `EXIT=0`, **305 tests / 15 files**.
- **`pnpm check`** (full deterministic gate) → **`CHECK_EXIT=0`**.
  - `pnpm -r build`: engine, scene3d, ai, scene3d-three-adapter, cli all `tsc` Done;
    `apps/studio` `tsc && vite build` succeeded — `✓ 522 modules transformed` (the Vite bundle of
    the root barrel is the real proof that `node:crypto` did not leak into a browser target).
  - `pnpm test` chain (types, schema, schema-sync, commands, patch, runtime, adapter, ai, cli,
    evidence, examples, docs, agent-framework, resources, perf:smoke, snapshot:smoke): all green
    (`Test Files … passed` per suite, zero failures).
  - `pnpm test:studio`: `EXIT=0`, 52 tests / 6 files.

## Ruling #2 — how the schema and the hand-written validator are locked together

`evidence/schema.ts` (TypeBox/Ajv) and `record.ts`'s `structuralIssues` encode the same shape twice.
I proved they agree with a **behavioral violation table + a coverage lock** in
`tests/schema-sync/schema-sync.test.ts` (new `describe("evidence record schema/validator alignment")`):

1. `accepts a fully valid input through both the structural validator and Ajv` — a complete valid
   `EvidenceRecordInput` returns `ok:true`, and Ajv's `EvidenceRecordSchema` compile+validate
   returns `true` for the built record. This also asserts the four builder-derived fields
   (`schemaVersion`, `recordId`, `issuedAt`, `exclusions`) are actually emitted.
2. `rejects a violation of every schema-required field the validator owns` — one representative
   violation per required field (all top-level required input fields + every required leaf on the
   validator-owned objects `project`, `origin`, `spec`, `toolchain`, `capabilities`, and the
   `commands`/`artifacts` item schemas). Each must make `buildEvidenceRecord` return `ok:false`
   with an `EVIDENCE.RECORD_INVALID` diagnostic.
3. `keeps the schema's required fields and the validator's violation cases in lockstep` — reads
   `EvidenceRecordSchema.required` (top level) and each locked object's `.required` **from the
   schema itself**, and asserts a matching violation case exists. A new schema-required field with
   no validator enforcement fails here.
4. `keeps record.ts EvidenceIssueCode literals in sync with DiagnosticCodes EVIDENCE.* codes`
   (Ruling #1) — asserts exact set equality between `Object.values(EvidenceIssueCode)` and the
   `EVIDENCE.*` subset of `Object.values(DiagnosticCodes)`.

### Drift demonstration (proof the lock is real, not decorative)

With the working tree clean at `62a357a`, I backed up `record.ts`
(`git hash-object` == committed blob `f2ab2bb`), then **drifted the validator**: dropped
`"pnpmVersion"` from the toolchain required-key loop while `EvidenceRecordSchema.toolchain` still
requires it.

```
pnpm vitest run tests/schema-sync  → EXIT=1
  FAIL tests/schema-sync/schema-sync.test.ts > evidence record schema/validator alignment
       > rejects a violation of every schema-required field the validator owns
  AssertionError: /toolchain/pnpmVersion: expected true to be false
  Tests  1 failed | 20 passed (21)
```

I then restored the file from the backup and proved the revert is byte-exact:

```
git diff --exit-code packages/engine/src/evidence/record.ts  → DIFF_EXIT=0
git status --short  → (clean)
pnpm vitest run tests/schema-sync  → EXIT=0, 21 passed
```

## Deviations from the brief (all necessary; each reason given)

1. **Edited `packages/engine/src/diagnostics/codes.ts`** (not in the brief's Files list; the plan
   assigns it to Task 5 Step 1). The brief's Step 4 `issue(): Diagnostic` returns
   `code: "EVIDENCE.RECORD_INVALID"`, but `Diagnostic["code"]` is a **closed union** over
   `DiagnosticCodes`, so the brief's own code does not compile under `strict` until those codes
   exist. This is also the precondition for Ruling #1's "mirroring `EVIDENCE.*` diagnostic codes".
   I added exactly the six keys/values/insertion point the plan's Task 5 Step 1 specifies (verbatim),
   so Task 5 will find them present rather than re-adding. `schema-sync` `Object.values(DiagnosticCodes)`
   membership test and the Ajv-derived `DiagnosticSchema` stay green (self-referential).
2. **Corrected the brief's Step 6 export block (it does not compile — TS2300).** Listing both
   `type EvidenceAssertionId,` and `EvidenceAssertionId,` for the three const+type merged symbols is
   a duplicate identifier. A single `X,` specifier already re-exports both the value and the type
   meanings of a merged symbol, so I dropped the redundant `type …` lines. Intent (both the const
   and its type reachable from `@gis-engine/engine/evidence`) is preserved; verified by green
   `build:schema` + evidence tests.
3. **Step 8 `git add` list was incomplete.** I also staged `packages/engine/src/index.ts` and
   `packages/engine/src/spec/schemas/generation.schema.ts` (both in the brief's Files list) and the
   `codes.ts` prerequisite (Deviation 1) so the commit is self-consistent; used the brief's exact
   commit message.
4. **Added the schema↔validator alignment lock + the `EvidenceIssueCode` sync lock** to
   `schema-sync` per Rulings #1/#2. The brief's Step 7 only specified the nested-`$id` guard and the
   capability-matrix acceptance case; the parent's rulings are the stricter requirement and I
   followed them.
5. **Adjusted one source comment** in `record.ts`: the brief's text pointed the sync pin at
   `tests/evidence/standalone-verifier.test.ts` (a Task 6 file that does not exist yet). I redirect
   it to the schema-sync guard that actually exists. No field name, literal value, or schema shape
   changed.
6. **Biome-normalized formatting** (import order in `schema.ts`; merging the `canonicalHash` export
   into the record block; wrapping two long fixture object literals across lines). All values verbatim.
   Two `useTemplate` diagnostics (string concat for `"sha256:" + "a".repeat(64)` and the recordId
   placeholder) are reported as **infos only** (`biome check` `EXIT=0`, zero `×`), so the pre-commit
   hook passes; I kept them exactly as the brief wrote them.

## What I deliberately did NOT do

- No `verifyEvidenceRecord` / `EvidenceAssertionStatus` (Task 5), no
  `tests/evidence/standalone-verifier.test.ts` or `tests/evidence/fixtures/record.ts` (Tasks 5/6).
- Did not re-export `stripNestedIds` through `spec/schemas/index.ts` (keeps the public barrel
  unchanged; `evidence/schema.ts` imports it directly from `generation.schema.js`).
- Did not weaken `MAX_EVIDENCE_RECORD_BYTES`, add `// biome-ignore`, delete/skip any test, or edit an
  unrelated assertion to green.
- Did not commit generated `dist/schema/*.json` (untracked; regenerated by `build:schema`).
- Did not touch git history (no `stash`/`reset`/`checkout --`/force-push).

## Concerns for the reviewer

1. **Latent flake in `is stable under key reordering of the same input` (brief-verbatim test).** It
   compares two `recordId`s where both inputs omit `issuedAt`, so each build stamps
   `new Date().toISOString()`. The two calls are synchronous and back-to-back, so they share the
   same millisecond virtually always — but under a heavily loaded CI runner the ms could straddle and
   the equality could fail. This is the brief's exact test; I did not modify it. If it ever flakes,
   the surgical fix is to pass an explicit `issuedAt` in that one test's input (value-identical, not
   a weakening). Flagging rather than pre-emptively diverging from the binding fixture.
2. **Cross-task note for @orchestrator / Task 5:** the six `EVIDENCE.*` codes are now in `codes.ts`
   as of this Task 4 commit. Task 5's Step 1 (per the extracted plan) adds them; it should treat this
   as already-done and skip, to avoid a duplicate-key compile error. The `EvidenceIssueCode` sync lock
   is in `schema-sync` (not only the Task 6 file the brief comment anticipated), which is stronger
   because it runs in the PR/deterministic gate path.
