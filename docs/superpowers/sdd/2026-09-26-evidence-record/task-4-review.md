# Task 4 review — spec compliance + code quality (package `review-e9c97af..62a357a.diff`)

Reviewer verdict: spec compliance mostly ✅; **code quality: needs fixes** (4 Important, gates green).
Transcribed by the controller from the reviewer's returned report on 2026-09-27; findings are the
reviewer's, the rulings below are the controller's.

## Spec compliance per brief cluster

| Cluster | Verdict |
|---|---|
| Step 1/2 failing test (11 cases, verbatim) | ✅ `tests/evidence/record-build.test.ts` |
| Step 3 types/builder/constants, `recordId` self-hash | ✅ `record.ts:145-131` |
| Step 4 zero-dep validator | ✅ but not total — I-1 |
| Step 5a `stripNestedIds` export / 5b TypeBox | ✅ body untouched; one `$id` each (checked in `dist/schema/*.json`) |
| Step 6 build-schema + `/evidence` exports | ✅ incl. Deviation 2 (TS2300 is a real brief defect; merged symbol flows — `dist/src/evidence/index.d.ts:3`) |
| Step 7 nested-`$id` guard + Ajv list | ✅ |
| Step 8 commit message | ✅ exact; extra staged files all in Files list + `codes.ts` (R3) |
| Constraint 3 (`record.ts` value imports) | ✅ proven on compiled `dist/src/evidence/record.js:1-2`; no runtime edge from root barrel |
| Constraint 4 (exclusions explicit + non-empty) | ⚠️ partial — `[]` accepted |
| Constraint 7 (structured diagnostics, no throws) | ⚠️ partial — throws on nullish input |
| Pre-flight lock (ledger `progress.md:29`: engine TypeBox vs AI contract agreement) | ❌ missing — I-3 |

## Important findings

- **I-1 `ok:true` ⇏ schema-valid.** Probes against `dist`: `exclusions: []`, non-array / unknown-member
  `exclusions`, `capabilities.schemaVersion: "…v0.2"`, extra key on `project`, `command: {foo: 1}`,
  `issuedAt: "yesterday"`, non-string `available`, bogus `blocked` entry — all build `ok`, all fail Ajv.
  Task 5 has no conformance assertion, so a record claiming *no* exclusions can pass every trust
  assertion. Fix: add `exclusions` (array / member-of / non-empty), `issuedAt` (pattern) and
  `capabilities.schemaVersion` (literal) checks to `structuralIssues`, plus those violation-table cases.
- **I-2** `buildEvidenceRecord(null | undefined)` throws `TypeError` (`record.ts:103`) instead of
  returning a diagnostic. Fix: nullish guard returning `issue("/ must be an object.", "/")`.
- **I-3** The ledger-mandated alignment lock between `EngineCapabilityMatrixSchema` (TypeBox) and the
  AI package's hand-written `EngineCapabilityMatrixContractSchema` is absent — three encodings of one
  public contract, none enforcing the others. Fix: one schema-sync test comparing them.
- **I-4 `recordId` hashes the un-normalised in-memory object** (`record.ts:121`) while the authoritative
  bytes are the file. Proven: `canonicalHash({...JSON.parse(JSON.stringify(record)), recordId: undefined})`
  `!== recordId` when a key holds `undefined` ⇒ honest records go `CHAIN_BROKEN` after a round trip.
  Fix: normalise before hashing (hash the `JSON.parse(JSON.stringify(...))` form).

## Minor findings

- `exclusions` is the one set-semantics array with no canonical producer order (Task 1 sorted
  `available` / `blocked` for exactly this reason): reversed set ⇒ different `recordId` (proven),
  duplicates accepted. Fix `[...new Set(x)].sort()`.
- Oversize diagnostic hardcodes `path: "/commands"` while the bloat is usually artifacts (`record.ts:131`).
- `DERIVED_TOP_LEVEL` + hand-maintained `locked` array auto-derives container-level coverage but not
  leaves of a future new object.
- `capabilities.available: []` accepted.
- `pnpm docs:api` not regenerated for the new published symbols.

## Rulings R1–R4 (reviewer's answers)

- R1 compliant (compiled-import proof + `record.ts:33-41` mirror).
- R2 the lock is real, not decorative: mutation A (drop `pnpmVersion` enforcement) → schema-sync exit 1;
  mutation B (add `/project/workspace` to the schema only) → exit 1 with "required field … has no
  structural-validator violation case", so the field list **is** derived from the schema. Only one
  direction is locked (that is I-1).
- R3 acceptable pull-forward, **but** the plan's Task 5 Step 1 still says "insert these six keys" ⇒
  duplicate literal keys (TS1117) if executed verbatim. Amend to "verify present". Also: this commit
  widens a public enum — say so in the PR body.
- R4 controller's ruling correct; the flake is real (stubbed `Date` +1 ms between the two builds makes
  the recordIds differ). `record.ts:116` is the only new `new Date()`; no other new test compares two builds.

## Gates run by the reviewer (real exit codes)

`pnpm vitest run tests/evidence tests/schema-sync` 0 (46 tests / 4 files) · `pnpm build:schema` 0 ·
`pnpm schema:diff` 0 but **blind** — it prints `Breaking 0 / Non-Breaking 0 / Info 0` because
`scripts/schema-diff.mjs:23` scans only `packages/engine/src/spec/schemas/`, so `evidence/schema.ts` and
the `codes.ts`-driven enum widening are invisible · `pnpm check` 0 (studio vite build green, snapshot
smoke incl. scene3d release-visual 5 passed) · `pnpm lint` 0 · `knip` 1 (56 pre-existing example files,
none from evidence).

## Itemised public-contract delta (routed to @quality; not self-certified)

New root runtime exports: `EvidenceRecordSchema`, `EngineCapabilityMatrixSchema`,
`EngineCapabilityBlockerSchema` + 11 types. New `/evidence` subpath exports: `buildEvidenceRecord`,
2 constants, 3 const+type pairs. `diagnostics.v0.1.schema.json` code enum **+6 literals**.
2 new `$id`s. Nothing removed; the 14 MCP tool names and their order untouched.
Reviewer's reading: additive — **@quality decides**.

## Claims vs diff

- Undeclared omission: the `progress.md:29` alignment lock (I-3) was not listed among the report's
  deviations; the test name "every schema-required field" overstates (I-1 direction).
- Endorsed as non-issues: Deviations 1/2/3/5/6, single-commit history, the shared `validInput()`
  fixture (to be folded into Task 5's `tests/evidence/fixtures/record.ts`), and that self-hashing is
  anti-corruption rather than anti-adversary (Task 7's manifest is the external anchor) — no field is
  excluded from `recordId`, so there is no in-record tampering hole.
