# Task 7 review — spec compliance + code quality

Reviewer: fresh general-purpose agent (controller-dispatched). Verdict: spec ✅ (one plan-mandated
Important), task quality **Approved**, 0 Critical / 1 Important / 7 Minor. Reconstructed from the
reviewer's returned report; it read the 92 KB diff in three passes
(1–700 docs/config/ai/artifacts/generate-head, 700–1350 generate-body/build-script/record/SKILL/export-test,
1350–1862 reject-path/generate.test/validate.test/standalone-verifier/package-size-policy).

### Spec Compliance

- ✅ Step 1: `tests/cli/evidence-export.test.ts` is a superset of the brief's three tests (schema-valid +
  manifest role binding, trust-tier recompute with `ok`/failed/`not-covered`, byte-swap tamper) — diff:1161–1240.
- ✅ Step 3: write order honoured — verifier copy + record build after all other artifacts, before the
  manifest (diff:788–875); `artifacts[]` non-self-referential (`evidence.json` pushed only after the record
  is built, diff:861–863); `REQUIRED_REVIEW_FILES` gains `evidence.json` (diff:652–658);
  `classifyGeneratedArtifact` verifier row (diff:668); helpers `readEngineVersion` /
  `readPackageManagerVersion` / `resolveVerifierPath` as specified (diff:677–705); reject branch `rmSync` +
  `process.exitCode = 1` (diff:841–854).
- ✅ Step 4: `recordId?: string` on the interface and the hand-written schema with the mandated pattern,
  deliberately outside `required` (diff:409–435); matches brief:281–288.
- ✅ Step 4b items 0–3: both exact `requiredReviewFiles` arrays updated (diff:1401–1407, 1528–1534);
  `required: false → true` in both cases (diff:1420–1425, 1542–1543); the `:92` case gets the record-shape
  block incl. `recordId` regex and no-prompt leak (diff:1483–1493); the `:208` case gets `recordFiles` +
  `canonicalHash(specOf(mapBytes)) === spec.afterHash` (diff:1519–1527);
  `cli-generate-evidence-structure` made unconditional with the five mandated assertions (diff:1590–1600);
  SKILL.md `:105` table and bundle-structure section replaced with a real record shape + recompute command
  (diff:994–1088).
- ✅ Step 5: gates reported verbatim, incl. the deliberately-red first `pnpm check` (the policy test caught
  an un-synchronised budget) and the after-numbers `size:check`. Budget raised with rationale, `semantics`
  unchanged.
- ✅ Step 6: `docs/engineering/evidence-record.md` created with the mandated three sections, the 6-id frozen
  assertion shape (4 table + 2 always-`not-covered`), the exit-code contract, indexed from
  `docs/README.md` (diff:141); `README.md` / `CHANGELOG.md` updated. One deviation: the brief's verify
  command does not exist; the documented command was swapped to the real `--verify-artifacts` invocation and
  proven by a live run (report §4, §9.1) — acceptable.
- ✅ Carry-over 1 (read-side cap): reject on `bytes.byteLength > MAX_EVIDENCE_RECORD_BYTES` after read,
  before `JSON.parse`, exit 1, message names measured bytes and limit (diff:970–975); strict `>` matches
  the builder side; two tests incl. a subprocess run of the *shipped* file and an exact-at-cap boundary
  (diff:1720–1787).
- ✅ Carry-over 2 (`BUNDLE` ↔ `BUNDLE_MODULES`): each comment names the other (diff:886–889, 1656–1661),
  plus a stronger re-derivation test parsing the build script's own `BUNDLE` literal (diff:1682–1690).
- ✅ Carry-over 3 (symlink residual): in the doc's threat model (diff:274–279) and the `isInsideRoot`
  doc-comment (diff:915–919).
- ✅ Measured-size paragraph carried into the config rationale (diff:115) and CHANGELOG (diff:53), including
  the 226,159 B "deleting the verifier does not help" figure and the `size:check` blind spot.
- ✅ Beyond the brief's list: `docs/website/guide/generation-evidence.md:117` stale bundle claim corrected
  (diff:332–345) — real staleness found and fixed.
- ⚠️ Not verifiable from the diff: `pnpm check` / `size:check` / MCP-contract results, the live end-to-end
  run in report §4, and the packed-install `exports` resolution of `@gis-engine/engine/evidence-verifier.mjs`.
- ❗ Plan-mandated coverage regression: the `summary.delivery.sections` / `spatialQueryReadiness`↔bundle
  cross-checks are retired (diff:1517–1520, 1488–1491). The brief itself labels this a real weakening whose
  acceptance belongs to @quality ("已知代价…由 @quality 判定", brief:346). Disclosed in code comments and
  report §6.4 — correctly routed, not self-certified.

### Strengths

- The `artifacts.ts` cross-check closes a genuine hole the brief only hinted at ("复用 manifest 做字节级完整
  性"): a shortened `artifacts[]` was invisible to both existing gates. Red-first evidence (report §3), the
  `reanchorManifest` helper that keeps the tamper tests non-vacuous (diff:1145–1159), and the clean-package
  pin (diff:1301–1310) are the right construction.
- Honest deviation handling: the `schema:diff` false negative surfaced with its root cause, the
  breaking-or-not judgement deferred to @quality, no compat shim, no dual write, no changeset self-bump.
- The mock-intent change (`view: { mode: "map2d" }`, diff:730–738) is the kind of hidden dependency (record
  `commands` `minItems: 1`) a single-agent slice would paper over; commented with the why and disclosed as a
  public-output change (report §6.7).
- Read-side cap tests prove the guard survives verbatim embedding (subprocess of
  `packages/engine/dist/evidence-verifier.mjs`) — that is the threat model's actual attack surface.
- The second agent fixed inherited Biome defects instead of redoing work, and kept the predecessor's
  strengthened test.

### Issues

#### Critical (Must Fix)

None found.

#### Important (Should Fix)

1. **Plan-mandated disclosure gap on the record→bundle link:** `evidenceResult.result.recordId = ...`
   (diff:859) writes into an in-memory object that `generate()` never returns and nothing else consumes; no
   test asserts it. The brief mandates the back-fill (brief:288), so the code is correct-as-specified, but
   the report's only consumer claim (§8, "the ai/MCP path") is unproven — the ai-side test covers schema
   permissibility, not back-fill behaviour. Keep the line only if a consumer is asserted; otherwise remove
   it. Follow-up must be tracked for @quality/orchestrator, as the implementer did.

#### Minor (Nice to Have)

1. Vacuous self-referential assertion: `expect(summary.delivery.sourceReadiness).toMatchObject({ …, sources:
   summary.delivery.sourceReadiness.sources })` (diff:1479) can never fail.
2. 3 of 5 new codes untested: `EVIDENCE_RECORD_UNREADABLE`, `EVIDENCE_RECORD_INVALID`,
   `EVIDENCE_ARTIFACT_MISMATCH` (artifacts.ts:165/176/188/217, no test references). `EVIDENCE_RECORD_INVALID`
   is the branch an old-bundle package actually hits.
3. Rationale arithmetic false as written: "23,384 + 5,239 + 9,898 = 38,703" (diff:115) — items sum to
   38,521; 38,703 is the subtraction-derived total because canonical dist gzip is non-additive.
4. `GenerateResult.evidenceStatus: "rejected"` (diff:850) is a new observable value on a public CLI return
   type and is missing from report §6's contract delta.
5. CHANGELOG mixed-language fragment: "the human/reviewer delivery摘要" (diff:50).
6. CLI budget at 99.2% (65,008/65,536) is disclosed in the report but not in the cli entry's `rationale` in
   `config/package-size-budgets.json` (diff:117–125 untouched) — the budget file is where a future
   contributor looks.
7. `crossCheckEvidenceRecord` parses `evidence.json` with no byte cap (diff:510) — defensible, but the
   reason should be one comment at the parse site.

### Risk Judgements (1–6 requested by the controller)

1. **Format-swap break** — Checked the new cross-check against a bundle-shaped record and
   `verifyEvidenceRecord`'s entry guards (record.ts:394–417). Old package → `verifyArtifacts`: bundle
   parses, `artifacts` not an array → `EVIDENCE_RECORD_INVALID` error → `ok:false`, structured, no crash.
   Old package → standalone verifier: `schemaVersion` guard + `structuralIssues` →
   `SchemaVersionUnsupported`, `ok:false` with `unverifiableAssertions()`, never silently green. Handling is
   honest; CHANGELOG records the swap; a `docs/migration/` note is recommended for external consumers but
   not required pre-1.0 — the breaking call is correctly left to @quality.
2. **Budget raise honesty** — Rationale (diff:107–115) vs brief:29–36: numbers carried faithfully (incl.
   226,159 B and the blind-spot note), `semantics` stayed `blocking` for both packages, `baselineBytes`
   deliberately unchanged so the 22.34% regression remains a visible warning. CLI budget untouched;
   near-exhaustion disclosed in the report, not the config (Minor 6); one arithmetic imprecision (Minor 3).
3. **Five new codes** — `VerifyArtifactDiagnostic.code` is a plain `string` (artifacts.ts:11); the whole
   `ARTIFACT_MANIFEST.*` namespace is CLI-local and absent from `DiagnosticCodes`, so the exact-set lock
   does not apply and no sync was missed. All five are structured `{severity, code, path, message}`. The
   cross-check tests are real behaviour (full generate → tamper → re-anchor → verify); three codes lack
   tests (Minor 2).
4. **Read-side cap** — Reject after read, before `JSON.parse` (diff:970–976), returns 1, message names
   `${bytes.byteLength}` and the limit; tests assert exit 1, both numbers, no `"assertions"` in output,
   output not JSON, the same refusal through the shipped `.mjs`, and exact-at-cap still parsing
   (diff:1720–1787). No truncation path; the constant is untouched (record.ts:14). Fully closed.
5. **`recordId` write-only** — Verified against brief:288: the brief mandates the field and the back-fill,
   not an assertion. True as to the code; the back-fill is nevertheless unobservable in the CLI path and
   untested anywhere. Graded Important, plan-mandated, because an unasserted public-contract link invites
   drift; the implementer disclosed it rather than hiding it.
6. **Two-agent seams** — No duplicated logic (BUNDLE/BUNDLE_MODULES is the intentional, now machine-locked
   exception; the double oversized test is module-form + subprocess-form, which the threat model requires).
   `generate.test.ts` widenings were forced by the bundle leaving disk and match the brief's mandated
   replacements — except the one vacuous line (Minor 1) and the retired sections cross-check (plan-mandated,
   disclosed). No softened `arrayContaining` beyond the brief's own spec; `requiredFileCount` tightened
   4→5. Handoff looks clean.

### Assessment

**Task quality:** Approved

**Reasoning:** All three Task 6 carry-overs are closed with proof-grade tests, every brief step (including
Step 4b file-by-file) is verifiably implemented, and the genuinely risky decisions — budget raise, breaking
format swap, retired cross-check, `schema:diff` blindness — are disclosed and routed to @quality rather than
self-certified. The findings are one plan-mandated unasserted back-link and small test/doc hygiene items; the
controller should carry the follow-up (recordId consumer assertion + migration-note decision) into the PR.
