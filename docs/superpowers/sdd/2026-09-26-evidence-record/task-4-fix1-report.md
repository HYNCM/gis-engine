# Task 4 — Fix round 1 report (review I-1..I-4 + accepted Minors)

```yaml
agent: builder
period: ad-hoc
generated_at: 2026-09-27T03:36:00Z
repo_revision: "17bae74 (on top of 62a357a)"
inputs:
  - .superpowers/sdd/2026-09-26-evidence-record/task-4-review.md
  - .superpowers/sdd/2026-09-26-evidence-record/task-4-brief.md (regenerated)
  - docs/superpowers/plans/2026-09-26-evidence-record.md
owner: "@builder"
decision_level: info
```

## Status: DONE

Commit: `17bae74` — `fix(evidence): close Task 4 review findings I-1..I-4 plus accepted minors`
(post-commit `git status --porcelain` empty, `git diff --exit-code` 0, final
`pnpm vitest run tests/evidence tests/schema-sync` EXIT=0 / 56 passed.)

Files changed (single commit): `packages/engine/src/evidence/record.ts`,
`tests/evidence/record-build.test.ts`, `tests/schema-sync/schema-sync.test.ts`,
`docs/superpowers/plans/2026-09-26-evidence-record.md` (plan sync, constraint 7).
`packages/engine/src/evidence/schema.ts` and `packages/ai/src/mcp/server.ts` are
byte-identical to HEAD (they were touched only during the two sanctioned mutation
demos; proven clean below).

## Per-finding changes and red-first evidence

### I-4 (recordId normalisation) — `record.ts`

- Builder now hashes `JSON.parse(JSON.stringify({ ...record, recordId: undefined }))`
  (the amended brief's Step 3 expression); the Step 1 test carries the brief's
  regenerated round-trip assertions plus a dedicated scratch case: a record built
  from an input whose `origin.planHash` key exists with value `undefined` is
  asserted (a) to keep the key in memory, (b) to drop it after
  `JSON.parse(JSON.stringify(record))`, and (c) to reproduce `recordId` from the
  wire form with Task 5's exact recomputation expression.
- Red (`pnpm vitest run tests/evidence/record-build.test.ts`, EXIT=1, 7 failed | 9 passed):
  `derives recordId ... → expected 'sha256:ad3d9d0a...' to be 'sha256:8e10e0ec...'`
  and `keeps the recordId verifiable after a JSON round trip when a key holds undefined →
  expected 'sha256:850efa6d...' to be 'sha256:cd1bf7c3...'`.
- Note: because the old hash included the `recordId: null` key while the normalised
  payload drops it, **every** `recordId` value changes for the same input. No golden
  recordIds exist yet (records only reach disk in Task 7), so nothing external moves.

### I-2 (nullish guard) — `record.ts`

- `if (!input || typeof input !== "object") return { ok: false, diagnostics: [issue("/ must be an object.", "/")] }`
  at the entry, per the ruling.
- Red (same run): both nullish cases failed with
  `TypeError: Cannot read properties of null (reading 'project')`.

### I-1 (structural hardening + bidirectional table)

- `record.ts` `structuralIssues` now pins, exactly within the ruling's scope and
  using the brief's Step 4 code: `capabilities.schemaVersion` must equal the
  literal `engine-capabilities.v0.1` (mirrored constant), `capabilities.available`
  string members, `capabilities.blocked` entry shape (object / non-empty
  `code`,`reason` / optional string `path`), `/exclusions` non-empty + vocabulary
  via `Object.values(EvidenceExclusionId)`, and `/issuedAt` against an
  `ISO8601_UTC_PATTERN` semantically identical to schema.ts's `Iso8601Utc`.
  No `MapCommand`/`MapSpec` deep validation was added (Ajv's contract).
- `schema-sync.test.ts`: the violation table gained rows `/capabilities/available/member`
  (`[_, 42]`), `/capabilities/blocked/member` (`[{reason}]`, missing `code`),
  `/exclusions` (`[]`), `/exclusions/member` (unknown id), `/issuedAt`
  (`"yesterday"`); the pre-existing `/capabilities/schemaVersion` row now uses the
  ruling's probe value `"engine-capabilities.v0.2"`. The row loop is **bidirectional**:
  per row it asserts the structural direction (`buildEvidenceRecord` → `ok:false`
  with `EVIDENCE.RECORD_INVALID`) AND that the same mutation applied to a
  JSON-cloned pristine record makes Ajv reject against `EvidenceRecordSchema`.
  Two mirror pins were added: every known exclusion id accepted through both
  encoders, and six borderline ISO stamps (incl. `.1234Z` and `+00:00`) accepted/
  rejected identically by record.ts and by Ajv — that is what keeps the two
  hand-duplicated literals from drifting.
- Red (EXIT=1, 2 failed | 21 passed / 23):
  `structural must reject /capabilities/schemaVersion: expected true to be false`
  and `structural 2026-09-26T12:00:00.1234Z: expected true to be false`.
- The exclusions-`[]` row's structural lock was additionally demonstrated by a
  temporary local removal of `|| input.exclusions.length === 0` →
  `structural must reject /exclusions: expected true to be false` (EXIT=1), then
  reverted.
- Ajv-direction liveness mutation demo (see next section for byte-clean proof):
  temporarily dropping `minItems: 1` from `EvidenceRecordSchema.exclusions`
  (schema.ts only, Ajv side relaxed, structural side intact) produced exactly
  `Ajv must reject /exclusions: expected true to be false`, EXIT=1 — the table's
  Ajv half is real, not decorative.

### I-3 (three-encoding capability matrix lock) — `schema-sync.test.ts`

New `describe("engine capability matrix contract alignment")` with three tests:
1. TS-type leg: `MutuallyAssignable<EngineCapabilityMatrix, EngineCapabilityMatrixFromSchema>`
  — a compile-time mutual-assignability constant (the interface is erased at
  runtime; drift fails `pnpm test:types`, exercised inside `pnpm check`).
2. Schema-vs-contract descriptor leg: both sides JSON-cloned, `$id`/`$schema`/
  `definitions`/`$comment` recursively stripped, then compared on property-key
  sets, sorted `required`, `additionalProperties === false`, and full
  `toEqual` per-property normalised descriptors (covers the nested blocker
  object).
3. Producer leg: `buildEngineCapabilityMatrix()` validates through Ajv against
  BOTH `EngineCapabilityMatrixSchema` and the AI `EngineCapabilityMatrixContractSchema`.
- Mutation demo (required `自证有效`): temporarily removed `"blocked"` from
  `EngineCapabilityMatrixContractSchema.required` in `packages/ai/src/mcp/server.ts` →
  `pnpm vitest run tests/schema-sync` EXIT=1 with
  `AssertionError: required: expected [ 'available', 'blocked', …(1) ] to deeply equal [ 'available', 'schemaVersion' ]`.
- Reverted via Edit; byte-clean proof:
  `git diff --exit-code -- packages/ai/src/mcp/server.ts` → exit 0;
  `git status --porcelain -- packages/ai/src/mcp/server.ts` → empty;
  same for `packages/engine/src/evidence/schema.ts` after its demo; final
  `git status --porcelain` lists only the four intended files.

### Accepted Minor (a): exclusions canonical order — `record.ts`

`exclusions: [...new Set(input.exclusions ?? DEFAULT_EXCLUSIONS)].sort()`.
Test `produces one recordId per exclusion set regardless of input order or
duplicates` (explicit `issuedAt` so it does not inherit the known `new Date()`
flake) — red first: `expected 'sha256:370aad62...' to be 'sha256:cbf892dd...'`.

### Accepted Minor (b): oversize diagnostic path — `record.ts`

New `oversizeDiagnostic(record)`: reports `/<key>` for the first top-level section
whose own canonical bytes exceed `MAX_EVIDENCE_RECORD_BYTES`, else `/` when only
the record as a whole does. Tests: the existing 1 MB-artifact case now asserts
`path === "/artifacts"` (red: `expected '/commands' to be '/artifacts'`), and a
distributed-bloat case (4 fat commands + 3 fat artifacts, no single section
oversize) asserts `path === "/"` (red: `expected { severity: 'error', …(3) } to
deeply equal ObjectContaining{…}`). `MAX_EVIDENCE_RECORD_BYTES` unchanged; still
rejects, never truncates.

## Deviations (each declared)

1. **Validate-then-default order.** The brief's Step 3 calls `structuralIssues(input)`
  before building the record while its Step 4 checks `issuedAt`/`exclusions` in
  required form — literally composed, the brief's own Step 1 fixture (no
  `issuedAt`/`exclusions`) would be rejected. Implementation materialises the
  defaults into the candidate record first, then runs the identical checks on it
  (assignable: `EvidenceRecord` ⊇ `EvidenceRecordInput`). Behavior is identical
  for every row of the violation table (absent → defaulted, invalid supplied
  value → rejected). Plan Step 3/4 snippets updated in the same commit.
2. **Superseded one test name.** `rejects a violation of every schema-required
  field the validator owns` became
  `rejects every violation-table row in both the structural validator and Ajv` —
  a strict superset (all old assertions + the Ajv half); coverage was only added.
3. **Existing row value change.** `/capabilities/schemaVersion` row mutated `""`;
  changed to the ruling's probe `"engine-capabilities.v0.2"` (both encodings
  reject either; the v0.2 form is what the review enumerated).
4. **Structural is marginally stricter than Ajv on `available` member emptiness**
  (brief's `non-empty string` check vs Ajv `Type.String()`), i.e. it rejects some
  inputs Ajv would allow. That direction is safe for the `ok:true ⇒ Ajv-valid`
  contract; no table row asserts the inverse. Left as the brief wrote it.
5. **Regex spelling.** `ISO8601_UTC_PATTERN` uses `(?:\.\d{1,3})?` (non-capturing)
  where TypeBox uses `(\.\d{1,3})?` — matching semantics identical; the
  borderline-stamp pin test would catch any divergence.

## What I deliberately did not do

- No deep `MapCommand`/`MapSpec` validation in the structural validator (ruling).
- Parked Minors untouched: `DERIVED_TOP_LEVEL` leaf auto-derivation,
  `capabilities.available: []` acceptance, `pnpm docs:api` regeneration, folding
  `validInput()` into Task 5's fixture file.
- No changes to MCP tool names/order (14 intact), the TypeBox schemas,
  `codes.ts`, `MAX_EVIDENCE_RECORD_BYTES`, root barrel export lists, or any
  pre-existing assertion's strength. No `// biome-ignore`.

## Gates (real exit codes, redirected to files)

- `pnpm vitest run tests/evidence tests/schema-sync` → final EXIT=0, **56 passed**
  (record-build 16, canonical-hash 6, capability-matrix 8, schema-sync 26);
  red runs recorded above (7F/16, 2F/23, 1F/26, 1F/26).
- `pnpm build:schema` → EXIT=0.
- `pnpm check` → **CHECK_EXIT=0** (full chain incl. `test:types`, all package
  builds, studio vite build, snapshot smoke incl. scene3d release-visual 5
  passed, `pnpm test:studio` 52 passed). Tail:
  `Test Files 6 passed (6) / Tests 52 passed (52)` (tests/studio, last suite).
- `pnpm schema:diff` → EXIT=0 but **blind**, prints
  `Breaking 0 / Non-Breaking 0 / Info 0` (scans only `src/spec/schemas/`).
  Not certifying "not breaking". Public-contract delta for @quality from THIS
  round: no export/schema/enum changes; behavior changes inside
  `buildEvidenceRecord` only — (1) `recordId` values change for identical inputs
  (normalised payload; no persisted records exist yet), (2) previously-accepted
  invalid inputs (`[]`/unknown exclusions, non-ISO `issuedAt`, stale capabilities
  literal, malformed blocked/available members) now return
  `EVIDENCE.RECORD_INVALID`, (3) nullish input returns a diagnostic instead of
  throwing, (4) oversize diagnostics path semantics `"/commands"` → true culprit
  (`/<key>` or `/`), (5) exclusions canonicalised (sorted+deduped).

## Note for Task 5

`verifyEvidenceRecord` must recompute with the exact normalised expression
`canonicalHash(JSON.parse(JSON.stringify({ ...record, recordId: undefined })))`
— the plan's Task 5 snippet already carries the amended form.
