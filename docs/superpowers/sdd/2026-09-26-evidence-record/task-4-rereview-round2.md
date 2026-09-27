# Task 4 — scoped re-review, fix round 2

Range: `99b5929..f3a43d1` (one commit, three files). Verdict: **round-1 Important closed, no new
Critical/Important breakage ⇒ Task 4 complete.**

## Finding verdict

**Constraint-7 exclusions throw** — ADDRESSED. Guard at `record.ts:128-130`, non-arrays fall through
to the validator's existing non-array check (`record.ts:311-312`). Re-reviewer reproduced against
compiled `dist`: `{}`, `42`, `true`, function, `Symbol`, `NaN` → all `EVIDENCE.RECORD_INVALID` at
`/exclusions`, zero throws; a self-referencing *array* is spread and diagnosed at `/exclusions/1`
without throwing. Focused suite 21/21 green; test diff is pure additions (+45 / −0), no skip, no
loosening, no `biome-ignore`.

## New breakage

None. Behaviours that had to survive did: absent → sorted default set; `[]` → `/exclusions`;
`["NOPE"]` → `/exclusions/0`; order/duplicate canonicalisation → one `recordId` (pre-existing test,
untouched, passes). The `"ab"` path shift (`/exclusions/0` → `/exclusions`) is a legitimate
consequence of the guard and is pinned as an invariant ("rejected, all diagnostics
`EVIDENCE.RECORD_INVALID`, never thrown") rather than hidden — `record-build.test.ts:192-201`.
Plan Task 4 block (`plans/2026-09-26-evidence-record.md:1121-1131`) is substantively identical to
shipped source, so a later brief cannot re-introduce the unconditional spread.

## Cyclic / BigInt question (controller asked; ruling recorded)

Confirmed **reachable**: `structuralIssues` deliberately does not enumerate extra properties or
deep-validate `MapCommand` (I-1 scope ruling), so a cyclic or `BigInt` leaf survives validation and
throws at `record.ts:139` (`JSON.parse(JSON.stringify(...))`). Reproduced: `commands[0].command.self`
→ `TypeError: Converting circular structure to JSON`; extra prop on `artifacts[0].meta.self` → threw;
`command.amount = 10n` → `TypeError: Do not know how to serialize a BigInt`. A `Symbol`-valued leaf
does **not** throw (both `JSON.stringify` and `canonicalStringify` never see symbol keys), and the
recordId comes from the post-JSON payload, so recomputation stays consistent.

Realistic consumers today: none — `buildEvidenceRecord` has no call site outside
`evidence/index.ts`, `tests/evidence/record-build.test.ts` and `tests/schema-sync/schema-sync.test.ts`;
MCP input arrives as JSON-RPC (`JSON.parse` output is acyclic and BigInt-free). Only Task 7's
in-process CLI builder could hand it a live runtime object with back-references — an internal
programming-error class, not caller-reachable junk like `{}`/`42`/`true` was.

**Ruling: Minor, fixed once in Task 5** (not a round-2 blocker). Patching here would need either a
deep cycle/BigInt check — which contradicts the sanctioned validator scope — or a try/catch at a call
site that Task 5 must duplicate anyway, because the plan requires `verifyEvidenceRecord` to reuse the
*identical* normalisation expression. So the totalisation belongs in the shared helper both sides
call. Carried into the plan's Task 5 as a binding requirement:
the shared normalisation must be throw-safe and return `EVIDENCE.RECORD_INVALID` on failure;
Task 6's standalone verifier is unaffected because it consumes persisted, JSON-parsed records.

## Out-of-scope observations (ledger for the final whole-branch review)

- The plan's Task 4 block carries Chinese inline comments while shipped source comments are English
  (plan prose is a working document; align language or leave, non-blocking).
