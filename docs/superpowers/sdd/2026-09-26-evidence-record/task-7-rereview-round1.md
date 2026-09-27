# Task 7 — fix round 1 scoped re-review (condensed record)

Reviewer: fresh general-purpose agent, dispatched by the controller. Verdict: **all 8 findings ADDRESSED,
no new Critical/Important breakage.** Condensed by the controller from the reviewer's returned report — the
verdicts and every file:line anchor are preserved; the reviewer's prose connective tissue is not.

Finding verdicts, in the order the review listed them:

1. **Important, plan-mandated — inert `recordId` back-link: ADDRESSED by deletion.** The write is gone;
   `packages/cli/src/generate.ts:770-775` is now an explanatory comment ("the record↔bundle link is
   deliberately not written here…") above the `evidence.json` write at `:777-778`. The reviewer
   independently re-ran a repo-wide `recordId` grep over `packages/** apps/** examples/** tests/**
   scripts/**` and confirmed the fixer's claim: nothing reads a **bundle's** `recordId`; every other reader
   is audit-shaped (`packages/ai/src/tools/workbenchReviewContract.ts:714` reading `ReviewEvidence`
   (interface `:693`, fields `sessionId/providerId/commandCount`), `:670` audit-deletion filter,
   `WorkbenchAuditRecordInput.recordId` at `:123`; `apps/studio/server/review-decisions.mjs:28` over audit
   ids minted `${sessionId}.${n}` at `apps/studio/server/audit.mjs:8`; `apps/studio/server/index.mjs:1462`;
   `tests/examples/*` `record-1`/`rec-w24-001` into `createDurableAuditRecord`; zero hits in `examples/**`).
   No dead variable left behind (`evidenceResult` still used at `:585/:588/:633-634/:809`), and
   `1,269 → 1,272` tests accounts for exactly the three new cases — nothing depended on the write.
2. **AI-side writer-less field — acceptable, carry the disclosure.** `generationEvidence.ts:417` (schema +
   pattern) and `:614` (optional interface field) are exactly what brief Step 4 mandates; optional, outside
   `required` (schema comment `:415-416` keeps pre-record bundles valid), additive to an exported contract,
   Task 9 is the specified consumer, removal condition stated in the fix report (~`:391-398`). Goes into the
   PR for @quality; does not block the round.
3. **Vacuous self-comparison: ADDRESSED.** `tests/cli/generate.test.ts:198-207` — the
   `sources: ….sources` leg deleted; `toEqual([])` at `:204` fails on a fabricated ghost row, and `:205-207`
   compares sourceId sets against `Object.keys(specOf(mapBytes).sources)`, mirroring the real derivation at
   `packages/engine/src/sources/readiness.ts:96` (so the anchor is semantic, not decoration). Honest
   residual (zero-source fixture pins only the empty case) is disclosed in the report.
4. **Three untested codes: ADDRESSED.** `tests/cli/evidence-export.test.ts:209-336`: UNREADABLE via
   truncated JSON (`:245-268`); INVALID written through `legacyBundleShape()` (`:217-243`) — a full
   `GenerationEvidenceBundle` key set, i.e. genuinely old bytes rather than a record missing one field —
   reaching `artifacts.ts:176-183` with the asserted path/message matching `:180-181`; MISMATCH tampering
   both legs (`:297-335`, `arrayContaining` + `toHaveLength(2)` at `:331`, matching `artifacts.ts:217`).
   Non-vacuity holds because each case re-anchors the manifest via `reanchorManifest` (`:46-55`) — the
   cross-check only runs when the entry is `verified` (`artifacts.ts:156-157`). Reported mutation-proof line
   refs are ~4 lines off the committed file, explained by the disclosed `biome check --write` reflow.
5. **False rationale arithmetic: ADDRESSED.** Engine `rationale` now names 38,703 B as the
   subtraction-derived total (236,057 − 197,354), the per-file sum 38,521 B, and the 182 B gap as
   canonical-dist-gzip non-additivity; the reviewer checked all three. The policy test's `130`/`35`
   rationale substrings (`tests/framework/package-size-policy.test.ts:66-67`) are retained.
6. **CHANGELOG language: ADDRESSED** (`CHANGELOG.md:11`).
7. **CLI near-exhaustion in the budget file: ADDRESSED.** cli `rationale` carries 65,260/65,536 (99.6%,
   7.46% over the 60,730 baseline — consistent), the limit deliberately not raised, and that the next CLI
   feature needs an explicit budget decision.
8. **Uncapped parse comment: ADDRESSED** (`packages/cli/src/artifacts.ts:161-163`, above the `JSON.parse`
   at `:164`).
9. **Report-side `evidenceStatus: "rejected"`: ADDRESSED** (`task-7-report.md` §6 item 9, `:266-270`).

New breakage in the fix diff: **none Critical/Important.** Diff footprint is exactly the findings' six
files (151+/8−); the MISMATCH exact-set assertion is safe because the legacy/short-circuit branches return
early (`artifacts.ts:173/184`) and `evidence.json`/manifest are excluded from the comparison loop (`:202`);
reported log noise is one pre-existing vite chunk-size warning from `apps/studio build`.

Carry-forward for the final review (non-blocking): `CHANGELOG.md:11` still describes the bundle as having
"an optional `recordId` pointing at the record it views" without noting that no in-repo producer sets it
after this round.
