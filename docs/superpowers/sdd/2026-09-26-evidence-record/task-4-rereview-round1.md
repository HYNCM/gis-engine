# Task 4 — scoped re-review, fix round 1

Range reviewed: `62a357a..99b5929` (implementer `17bae74`, controller `99b5929`).
Package: `review-62a357a..99b5929.diff`. Verdict: **all five original findings ADDRESSED,
but the fix introduced one new Important issue ⇒ round 2 required.**

## Finding Verdicts

**I-1 `ok:true` did not imply schema-valid (within the adjudicated Task-5-recomputation scope)** —
ADDRESSED. `packages/engine/src/evidence/record.ts:165-168,281-330` adds the
`capabilities.schemaVersion` literal, `available` member, `blocked` entry-shape, `/exclusions`
non-empty + vocabulary, and `/issuedAt` pattern checks, all inside the ruling's scope (no
`MapCommand`/`MapSpec` deep validation was added — record.ts:174-180 documents the boundary).
All six ruling-mandated probes now return `ok:false`; verified live against the compiled `dist`:
`exclusions []`, `exclusions unknown`, `schemaVersion v0.2`, `available nonstring`,
`blocked bad member`, `issuedAt yesterday` → all `ok:false`. The table is now bidirectional
(`tests/schema-sync/schema-sync.test.ts:618-634`: per row, structural reject +
`recordValidate(mutated pristine record)` false), and cannot pass vacuously: the same fixture's
Ajv-validity is pinned by `accepts a fully valid input through both` (schema-sync.test.ts:595-606)
and the mutation target fields all exist on the pristine record. The two sanctioned literal
duplications are pinned two-sided (schema-sync.test.ts:639-668).

**I-2 `buildEvidenceRecord(null|undefined)` threw TypeError** — ADDRESSED. Nullish guard at
`record.ts:104-106` returns `issue("/ must be an object.", "/)` per the ruling verbatim; covered by
`tests/evidence/record-build.test.ts:150-160`. Caveat: the fix opened a *new* throw path for
non-array exclusions (see New Breakage) — not I-2's defect, but the same constraint-7 class.

**I-3 ledger-mandated capability-matrix alignment lock missing** — ADDRESSED.
`tests/schema-sync/schema-sync.test.ts:713-774` adds the three-leg lock: (1) compile-time
`MutuallyAssignable<EngineCapabilityMatrix, EngineCapabilityMatrixFromSchema>`, (2) descriptor
equality between the engine TypeBox schema and the AI-side `EngineCapabilityMatrixContractSchema`
after a JSON round trip and a recursive strip of `$id`/`$schema`/`definitions`/`$comment` only,
(3) producer `buildEngineCapabilityMatrix()` validated through Ajv against both encodings.
A required field added to one encoding reddens leg 2 (key-set + required-set) and leg 1 if the
interface changes; the report documents a performed mutation demo (drop `blocked` from AI `required`
→ red). Residual (Minor): an *optional-member-only* addition to the TS interface passes leg 1 in
both directions; caught only if the producer emits the field (leg 3, `additionalProperties: false`).

**I-4 `recordId` hashed the un-normalised in-memory object** — ADDRESSED. `record.ts:135-136`
hashes exactly `canonicalHash(JSON.parse(JSON.stringify({ ...record, recordId: undefined })))`.
A verifier working from the wire form reproduces it (inner JSON round trip is idempotent, canonical
hashing is order-insensitive). Verified live with an `origin.planHash: undefined` input.
`tests/evidence/record-build.test.ts:52-68` pins it, and the plan's Task 5 snippet was updated to
the same expression (`chainExpected`) so Task 5 cannot drift.

**Minor: exclusions order/duplicates canonicalisation** — ADDRESSED (`record.ts:126`,
`record-build.test.ts:164-187`).

**Minor: oversize diagnostic hardcoded `/commands`** — ADDRESSED (`record.ts:138-139,150-158`;
both `/<key>` and `/` paths tested). No loosening of `MAX_EVIDENCE_RECORD_BYTES`, still reject-not-truncate.

**Parked minors (not accepted this round, non-blocking)**: `DERIVED_TOP_LEVEL` leaf auto-derivation
for future objects; `capabilities.available: []` still accepted (both sides accept ⇒ no I-1 breach);
`pnpm docs:api` not regenerated.

## New Breakage in the Fix Diff

- **Important — new constraint-7 throw path**: `record.ts:126` evaluates
  `[...new Set(input.exclusions ?? DEFAULT_EXCLUSIONS)]` inside the record literal, *before*
  `structuralIssues` runs (record.ts:129). A non-iterable, non-nullish `exclusions` (plain object,
  number, boolean) throws `TypeError: object is not iterable`. Reproduced by the controller against
  `dist/src/evidence/record.js`: `{}` / `42` / `true` → TypeError; `"ab"` → `ok:false` at
  `/exclusions/0`. Exactly the class the controller ruled unacceptable in I-2.
- **Minor**: I-3 leg 1 blind spot for optional-member-only drift in the TS interface
  (schema-sync.test.ts:745-746), partially compensated by leg 3.
- Checked clean: `record.ts` value imports unchanged (only `node:crypto` + `./canonical-stringify.js`);
  `schema.ts` and `packages/ai/src/mcp/server.ts` byte-identical to `62a357a`; no test deleted,
  skipped or weakened — the renamed table test is a strict superset, and the
  `/capabilities/schemaVersion` row value change (`""` → `"engine-capabilities.v0.2"`) is the
  ruling's own enumerated probe and is rejected by both encodings either way; the describe-body
  `throw` at schema-sync.test.ts:610-612 is a fixture-invariant guard that fires at collection.

## Deviation Rulings (controller)

1. **Validate-after-defaults — ACCEPT.** The brief's Steps 3/4 as composed reject the brief's own
   Step 1 fixture; materialising `issuedAt`/`exclusions` defaults then validating the candidate is
   the only order satisfying both. No caller-supplied *present* invalid value is overwritten before
   validation, so `ok:true` still implies Ajv-valid for every adjudicated-scope probe (live-verified).
   Plan synced in the same commit.
2. **Renamed violation-table test — ACCEPT.** Keeps all prior structural assertions and adds the
   Ajv half; pure coverage gain.
3. **Controller-authored `99b5929` (pin `issuedAt` in the key-reordering test) — ACCEPT, correct.**
   `issuedAt` is inside the hashed payload and `baseInput` omits it, so the pre-fix comparison
   re-stamped `new Date()` on each build — a genuine millisecond flake (controller proved a 1 ms
   delta changes `recordId`).

## Out-of-Scope Observations (ledger for the final review)

- `scripts/schema-diff.mjs:23` scans only `packages/engine/src/spec/schemas/`, so
  `evidence/schema.ts` and the diagnostics-enum widening are invisible to `pnpm schema:diff`.
- `validInput()` in schema-sync.test.ts still duplicates record-build's fixture; folding into
  Task 5's `tests/evidence/fixtures/record.ts` remains a controller-endorsed deferred item.
