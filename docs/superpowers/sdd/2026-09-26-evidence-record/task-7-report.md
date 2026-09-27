# Task 7 report — CLI 导出包落盘 `evidence.json` + manifest 角色

```yaml
agent: builder
period: ad-hoc
generated_at: 2026-09-27T06:40:00Z
repo_revision: "c7e7985 (branch codex/evidence-record-a, base b8c546e)"
inputs:
  - .superpowers/sdd/2026-09-26-evidence-record/task-7-brief.md
  - docs/engineering/evidence-record.md
  - config/package-size-budgets.json
owner: "@builder (engine/ai/adapter focus)"
decision_level: info
```

## 1. What I finished vs. what I inherited

### Inherited already-done (uncommitted, judged, kept)

I read every inherited diff before touching anything and treated it as done. Verdict: high
quality, contract-faithful, and the comments carry the reasoning rather than restating the code.

| Area | Judgement |
| --- | --- |
| `packages/cli/src/generate.ts` (+149) | Correct and complete against brief Step 3. Write order is right (evidence after every other artifact incl. the verifier, before the manifest), `artifacts[]` is non-self-referential, `rmSync(outDir)` + `process.exitCode = 1` on builder rejection, `resolveVerifierPath()`/`readEngineVersion()`/`readPackageManagerVersion()` as specified. Verified live: `@gis-engine/engine` `exports` map publishes both `./evidence-verifier.mjs` and `./package.json`, so the packed-install resolve path works. |
| `packages/engine/src/evidence/record.ts` (+19) | Carry-over item 1 genuinely implemented — see §2.1. |
| `packages/engine/scripts/build-evidence-verifier.ts` (+4) + `tests/evidence/standalone-verifier.test.ts` (+94) | Carry-over item 2 not just implemented but strengthened — see §2.2. |
| `packages/ai/src/tools/generationEvidence.ts` (+5) | `recordId?: string` on the interface plus the same-named optional property in the hand-written JSON Schema with `pattern: "^sha256:[a-f0-9]{64}$"`, deliberately outside `required`. Matches brief Step 4 exactly. |
| `tests/cli/generate.test.ts` (+96/-44) | All of Step 4b items 0–3, including the two retired delivery cross-checks and the unconditional `cli-generate-evidence-structure` case. |
| `tests/cli/validate.test.ts` (+2/-1), `tests/cli/evidence-export.test.ts` (new) | Consistent with `evidence.json` joining `requiredReviewFiles`; the export suite covers schema validity, manifest role binding, trust-tier recompute, artifact-path hygiene, the tamper case, and the CLI rejection branch. |

Two concrete inherited defects, both fixed by me (formatting only, no logic):

- `tests/evidence/standalone-verifier.test.ts` had two lost newlines from the predecessor's edits
  (`it(... , () => {    const verifier = ...` and `describe(..., () => {    /**`), which made
  `biome check` report **2 format errors** on that file. Restored.
- `tests/cli/evidence-export.test.ts` had an import order biome flagged as an error
  (`@gis-engine/engine/evidence` before `@gis-engine/cli`). Reordered.

`npx biome check` on all touched code now reports **0 errors** (4 `noNonNullAssertion` warnings
remain, all on pre-existing Task 6 lines 34/47/65 of `standalone-verifier.test.ts`).

### What I wrote

1. **`packages/cli/src/artifacts.ts` (+100)** — the manifest is now actually reused as the
   byte-level anchor for the *evidence surface*, not just for the files it happens to list. See §3.
2. **`docs/engineering/evidence-record.md` (new, 75 lines)** — recompute command, assertion table,
   byte-level integrity section, record provenance, and the **threat-model section** carrying
   Task 6 carry-over item 3. Indexed from `docs/README.md` Core Map.
3. **`skills/gis-engine-generation-pipeline/SKILL.md` (+58/-16)** — `:105` file table now describes
   `EvidenceRecord` and adds the `evidence-verifier.mjs` row; the old "Evidence Bundle Structure"
   section is replaced with the real record shape (keys taken from a live generated record, not
   invented) plus the recompute command and a pointer to the new doc.
4. **Consumer sweep** — `docs/website/guide/generation-evidence.md:117` still claimed
   `evidence.json` = "Full `GenerationEvidenceBundle`"; corrected, verifier row added, recompute
   command and link added. This file was not in the brief's table but is a live public doc describing
   the on-disk contract. Also checked and confirmed *not* stale: `examples/ai-map-workbench/
   review-console.mjs` and `server.mjs` consume the bundle in memory only, and `docs/website/api/
   reference/**` is generated typedoc output.
5. **`README.md` (+1)** and **`CHANGELOG.md` (+13)** — public contract additions. README stays at
   166 words (limit 500, enforced by `documentation-minimalism`).
6. **`config/package-size-budgets.json`** + every consumer the policy test names — see §5.

## 2. Task 6 carry-over items — verification, not re-derivation

### 2.1 Item 1: read-side byte cap — DONE by predecessor, confirmed

`packages/engine/src/evidence/record.ts` `runEvidenceVerifierCli` now checks
`bytes.byteLength > MAX_EVIDENCE_RECORD_BYTES` **after the read, before `JSON.parse`**, logs
`Refusing ${recordFile}: ${bytes.byteLength} bytes exceeds the ${MAX_EVIDENCE_RECORD_BYTES} byte
evidence-record budget; nothing was verified.` and returns `1`. Strict `>` (matching the builder's
own `>`), so a record landing exactly on the cap is still legal output. No truncation, no relaxed
budget. Covered by 2 new tests in `standalone-verifier.test.ts`:
the oversized case asserts exit 1, names measured bytes and the limit, asserts no `"assertions"`
string ever appears, asserts the joined output is not parseable JSON, **and** re-runs the same
refusal through the shipped `packages/engine/dist/evidence-verifier.mjs` as a real subprocess, so
the guard is proven to survive verbatim embedding rather than only existing in module form. The
second test pins the exact-at-cap boundary. Nothing to complete.

### 2.2 Item 2: `BUNDLE` ↔ `BUNDLE_MODULES` — DONE and strengthened

`build-evidence-verifier.ts`'s `BUNDLE` comment names `BUNDLE_MODULES` in the test; the test's
`BUNDLE_MODULES` comment names the build script. Same order, same set. The predecessor went further
than the comment requirement: a new test parses `const BUNDLE = [...]` out of the build script's own
source and asserts `expect(members).toEqual(BUNDLE_MODULES)`, so the claim is re-derived rather than
left to prose. Kept as-is.

### 2.3 Item 3: symlink residual — DONE

Written in `docs/engineering/evidence-record.md` §威胁模型 and mirrored in the `isInsideRoot`
doc-comment: pure-string guard, an in-root symlink pointing outside is still followed by `readFile`,
`--root` is supplied by the auditing party so in-root links are inside that party's own trust domain,
and `node:fs.realpath` was deliberately not imported to keep the shipped bundle's zero-dependency
closure.

## 3. TDD evidence for the `artifacts.ts` cross-check

**Why a change was needed at all.** The brief lists `artifacts.ts:61-131` as "复用 manifest 做字节级
完整性" and it was untouched. The per-entry pass already hashes every manifest file, so the
byte-swap case in the inherited export suite passed without it. The real gap: the manifest and the
record are two independent lists of the same package and **nothing compared them**. Drop an entry
from `record.artifacts[]` and re-anchor the manifest hash for `evidence.json` and both existing
gates stay green — `verifyArtifacts` verifies every path it lists, and `evidence-verifier.mjs`
returns `ok: true` for its own shortened list. The evidence surface shrinks silently. That is the
audit-side half of constraint 5 applied to the artifact *set*.

**Red first** (`pnpm vitest run tests/cli/evidence-export.test.ts`, before any `artifacts.ts` edit):

```
 FAIL  tests/cli/evidence-export.test.ts > CLI evidence export rejects a record that under-attests
        the package > flags a record whose artifacts[] omit a file the manifest hashes
AssertionError: expected true to be false // Object.is equality
 FAIL  ... > flags a record that attests a file the manifest does not hash
AssertionError: expected true to be false // Object.is equality
 Test Files  1 failed (1)
      Tests  2 failed | 6 passed (8)
```

Both tamper tests **re-anchor the manifest** (`reanchorManifest`) after editing the record, which is
what makes them non-vacuous: without the cross-check the package is manifest-consistent and
`ok === true`. A third test pins that an untouched exported package stays clean
(`result.ok === true && result.diagnostics === []`).

**Green** after implementing:

```
 ✓ tests/cli/evidence-export.test.ts (8 tests) 501ms
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

Implementation notes: it runs only once `evidence.json` itself verified, so the record being read is
the one the manifest endorses; it recomputes no hash (every compared value came from
`verifyManifestFileEntry`); it never throws (parse failure becomes
`ARTIFACT_MANIFEST.EVIDENCE_RECORD_UNREADABLE`); and it emits `EVIDENCE_ARTIFACT_MISSING`,
`EVIDENCE_ARTIFACT_UNLISTED`, `EVIDENCE_ARTIFACT_MISMATCH`. Codes stay on the existing
`ARTIFACT_MANIFEST.*` namespace rather than inventing a second scheme. Structured diagnostics only —
constraint 7 holds, the verifier path stays pure data with no rendering, network, or `applyCommands`.

**Artifact path hygiene (binding constraint on the exporter)** was already asserted by the
predecessor in `tests/cli/evidence-export.test.ts:59` (`keeps every recorded artifact path a clean
relative POSIX path`), on the nested `vite-ts` template so multi-segment paths are actually walked,
checking `\`, `\0`, leading `/`, `./`, `..` segments and duplicates. Verified present and green —
I did not need to add it.

## 4. Live end-to-end evidence (not only unit tests)

Generated a real package outside the repo with the built CLI and ran both gates on it:

```
$ node packages/cli/dist/bin.js demo --generate --provider mock --prompt "Show parks in NYC" --yes
$ cd demo && node evidence-verifier.mjs evidence.json --root . --json
{ "ok": true,
  "assertions": [
    ARTIFACTS_MATCH     passed       "7 of 7 artifacts matched",
    CHAIN_CLOSED        passed       "recordId matches the canonical body",
    DERIVATION_CLOSED   passed       "revision lineage closed",
    OFFLINE_REPLAY      not-covered  "excluded: requires referenced replay outside the trust tier",
    TOOLCHAIN_RECORDED  passed       "engine 1.5.0 / node 26 / pnpm unknown",
    VISUAL_CONSISTENCY  not-covered  "excluded: visual consistency is deferred" ],
  "diagnostics": [] }

$ node packages/cli/dist/bin.js --verify-artifacts .
Artifact manifest verification
  Status:     verified
  Files:      8/8 verified
  Required:   5
  Bytes:      0 mismatches
  Hashes:     0 mismatches
```

Record keys observed on disk: `schemaVersion, recordId, project, origin, commands, spec, artifacts,
capabilities, toolchain, issuedAt, issuer, exclusions`; `commands.length === 1` (`gen-set-view`,
`baseRevision "0"` → `nextRevision "1"`); `exclusions === ["OFFLINE_REPLAY","VISUAL_CONSISTENCY"]`.
The doc's assertion table and JSON samples are written against this real output.

## 5. Gates — verbatim

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm build:schema` | 0 | rebuilt engine schema + `dist/evidence-verifier.mjs` + ai schema; **no regenerated tracked file** (`git status --porcelain` showed only my source/doc edits) |
| `pnpm check` (first, pre-budget-fix) | **1** | `tests/framework/package-size-policy.test.ts` **3 failed / 71 passed** — see §5.1 |
| `pnpm check` (final, on the committed tree content) | **0** | **91 test files / 1269 tests passed**, 0 failures; `grep -c "ELIFECYCLE\|FAIL "` on the full log = 0 |
| `pnpm test:cli` | 0 | 9 files / **223** passed (evidence-export 8, generate 16, validate 16) |
| `pnpm test:evidence` | 0 | 5 files / **75** passed (standalone-verifier **14**, record-verify 26, record-build 21, canonical-hash 6, capability-matrix 8) |
| `pnpm test:agent-framework` | 0 | 9 files / **74** passed (package-size-policy 8, agent-framework 32) |
| `pnpm test:compat:mcp` (MCP contract) | 0 | 2 files / **10** passed, incl. "returns schema-conforming structured content and JSON text for every public tool" and "declares the JSON Schema dialect for every public descriptor" |
| `pnpm test:ai` | 0 | 15 files / **305** passed, incl. `generation evidence bundles > keeps generation evidence schemas strict and Ajv-compilable` (the `recordId` envelope) |
| `pnpm test:docs` | 0 | 6 files / **45** passed (public-docs-consistency 28, documentation-minimalism 5) |
| `pnpm test:schema-sync` | 0 | covered inside `pnpm check`; `GenerationEvidenceBundleSchema` sync intact |
| `node scripts/doc-generator.mjs links` | 0 | `✅ 文档引用审计 -> docs/reviews/doc-link-audit.md` / `✅ Doc Generator 完成`; committed report regenerated byte-identical (not left dirty) |
| `npx biome check <touched code>` | 0 | 0 errors, 4 pre-existing warnings |

`pnpm check` does **not** include `size:check` — confirmed and recorded (see the budget commit
message and CHANGELOG note).

### 5.1 `pnpm size:check` before

```
| @gis-engine/engine | 2299829 | 237324 | 237 | 193984 | 204800 | blocking | 22.34% | fail  |
| @gis-engine/cli    |  306605 |  63480 |  44 |  60730 |  65536 | blocking |  4.53% | pass  |
  "summary": { "blockingFailures": 1, "errors": 0, "warnings": 1 }   exit 1
```

The first `pnpm check` failure was the *point*, not noise: `package-size-policy.test.ts` hard-codes
`budgetBytes: 204_800`, requires `/200\s*KiB/` in four consumer docs, and runs a tamper probe over
`"200 KiB" → "201 KiB"`. Raising the budget without moving all of them is caught. That is the "不能
静默调高" mechanism working as designed. I moved every consumer **and** the test literal/tamper
probe; I did not touch `scripts/package-size-policy.mjs` (that would be editing the gate).

### 5.2 `pnpm size:check` after (the committed numbers)

```
| @gis-engine/engine | 2299829 | 237324 | 237 | 193984 | 262144 | blocking | 22.34% | warning |
| @gis-engine/cli    |  313442 |  65008 |  44 |  60730 |  65536 | blocking |  7.04% | warning |
  "summary": { "blockingFailures": 0, "errors": 0, "warnings": 2 }   exit 0
```

`budgetBytes` 204800 → **262144** (256 KiB). `semantics` stays `"blocking"`. `baselineBytes` stays
193,984 @ `4465943` so the 22.34% regression remains visible as an advisory instead of being
smoothed into a fresh baseline. The evidence surface was not shrunk to dodge the gate. Config
`rationale` carries the brief's full attribution: measured 236,057 B at `99a902a` clean build
(237,324 B in this tree, which also carries Task 6's read-side changes) against 204,800 B;
`dist/src/evidence/**` 23,384 + `dist/schema/evidence-record*.json` 5,239 +
`dist/evidence-verifier.mjs` 9,898 = **+38,703 B**; non-evidence dist **197,354 B** inside the old
budget; deleting the verifier single file still leaves 226,159 B.

## 6. Real public-contract delta for @quality (self-certified by no one)

`pnpm schema:diff` is blind here — verbatim:

```
$ pnpm schema:diff
## Schema Change Report
> Base: `main` → Head: `HEAD`
**Summary**: 🚨 Breaking **0** / ✅ Non-Breaking **0** / ℹ️ Info **0**
```

`scripts/schema-diff.mjs:23` sets `SCHEMA_DIR = "packages/engine/src/spec/schemas/"`, and the
EvidenceRecord contract lives at `packages/engine/src/evidence/schema.ts` and emits
`packages/engine/dist/schema/evidence-record.v0.1.schema.json` — outside the scanned directory. The
0/0/0 is a false negative, not a clean report. The actual delta:

1. **New public contract:** `evidence-record.v0.1` (`EvidenceRecord`), plus the
   `engine-capability-matrix` it embeds, reachable only via the `@gis-engine/engine/evidence`
   subpath (root barrel stays free of the `node:crypto` value closure).
2. **New public export path:** `@gis-engine/engine/evidence-verifier.mjs` — a shipped executable.
3. **AI tool schema:** `GenerationEvidenceBundleSchema` gains optional `recordId`
   (`^sha256:[a-f0-9]{64}$`), not in `required` → additive for existing producers; MCP tool names,
   count and order unchanged (contract test green).
4. **CLI export package format:** `evidence.json` payload replaced
   (`GenerationEvidenceBundle` → `EvidenceRecord`) — breaking for anyone parsing that file; the
   brief's "不得加兼容层、不得同时写两份" is honoured, no compatibility shim and no dual write.
5. **`artifact-manifest.json`:** `requiredReviewFiles` exact array gains `"evidence.json"` (breaking
   for exact-array consumers), `files[]` gains `evidence-verifier.mjs` (`role: "evidence"`,
   `required: false`), and `evidence.json` flips to `required: true`.
6. **`verifyArtifacts` result contract:** five new diagnostic codes
   (`EVIDENCE_RECORD_UNREADABLE`, `EVIDENCE_RECORD_INVALID`, `EVIDENCE_ARTIFACT_MISSING`,
   `EVIDENCE_ARTIFACT_UNLISTED`, `EVIDENCE_ARTIFACT_MISMATCH`) that can make `ok: false` where the
   same package previously reported `verified`. Strictly narrowing for callers.
7. **Mock provider output changed:** `map.json` now carries `view.mode: "map2d"` and
   `revision: "1"` produced by one `gen-set-view` command, where the old mock intent yielded zero
   commands. This is an inherited, deliberate deviation (below) and it changes generated artifact
   content, so it is @quality's call, not mine.
8. **Package size policy:** engine blocking budget 204,800 → 262,144.
9. **`GenerateResult.evidenceStatus` gains a third observable value:** `"rejected"`
   (`packages/cli/src/generate.ts:50` declares `evidenceStatus: string`; the builder-rejection branch now
   returns `"rejected"` where the value space used to be only `"ok" | "diagnostics"`). `GenerateResult` is
   exported from `@gis-engine/cli`, so any caller branching on that field has to handle the new value; this
   belongs in the same contract delta @quality reviews.

I did not add a `.changeset` entry: that declares a semver bump, which is exactly the
breaking/non-breaking judgement reserved to @quality.

## 7. Files changed and commits created

Base `b8c546e`. 21 files, +852/-67 across 5 commits, no `git reset`/`stash`/force-push, no inherited
work discarded, and `git diff --name-only b8c546e..HEAD | grep -E "node_modules|/dist/|\.superpowers/"`
→ none.

| SHA | Subject | Files |
| --- | --- | --- |
| `abb7856` | feat(evidence): cap the verifier read side and lock its embedded closure list | `record.ts`, `build-evidence-verifier.ts`, `standalone-verifier.test.ts` |
| `be66dac` | feat(cli): write a recomputable EvidenceRecord into exported packages | `generate.ts`, `generationEvidence.ts`, `tests/cli/generate.test.ts`, `tests/cli/validate.test.ts` |
| `c6408f6` | feat(cli): reuse the manifest to pin the exported evidence surface | `artifacts.ts`, `tests/cli/evidence-export.test.ts` |
| `de68430` | build(size): raise the engine budget for the EvidenceRecord contract | `config/package-size-budgets.json`, `package-size-policy.test.ts`, `contract-freeze.md`, `performance-benchmarks.md`, `website/guide/performance.md`, `design/phase-b-provider-http-layer.md` |
| `c7e7985` | docs(evidence): publish the third-party recompute path and its threat model | `docs/engineering/evidence-record.md`, `docs/README.md`, `website/guide/generation-evidence.md`, `skills/.../SKILL.md`, `README.md`, `CHANGELOG.md` |

Working tree clean at `c7e7985`. Nothing pushed.

## 8. Self-review findings

- **The `recordId` back-link is currently write-only in the CLI path.** `generate.ts` sets
  `evidenceResult.result.recordId = ...`, but the bundle is no longer persisted and
  `delivery-summary.json` is written *before* that line, so nothing downstream observes it. It cannot
  be moved into `delivery-summary.json`: that file is hashed into the record, so the link must point
  bundle → record, never record → bundle (the predecessor's comment says exactly this). The brief
  mandates the field and the back-fill, and the observable consumer is the ai/MCP path, so I kept it
  as written. **@quality should note that no CLI-level assertion covers it**; the follow-up issue for
  full bundle → record-view replacement is a PR requirement per brief Step 4.
- **CLI budget is now effectively saturated:** 65,008 / 65,536 = 99.2%, 7.04% above baseline (was
  4.53% / 63,480 before my cross-check landed). It passes with blocking semantics intact and I did
  **not** touch the CLI budget since it isn't breached, but the next CLI feature will need a budget
  decision. Worth an orchestrator note.
- **`isInsideRoot` vs `artifacts.ts` are intentionally different guards.** `artifacts.ts` uses
  `realpathSync` and *does* reject escaping symlinks (`PATH_ESCAPE`); the standalone verifier cannot.
  Documented in the threat model so nobody later "unifies" them by adding `fs.realpath` to the bundle.
- **Brief's doc block referenced a command that does not exist** — deviation, see §9.1. My docs use
  the real one, proven in §4.
- Kept every inherited comment that explains a *why*; trimmed none of the predecessor's evidence.

## 9. Deliberate deviations from the brief, with evidence

1. **`pnpm --filter @gis-engine/cli verify <dir>` → real command.** Brief Step 6's markdown uses that
   invocation. It cannot run: `packages/cli/package.json` declares `"scripts": {"build":"tsc -p
   tsconfig.json"}` (no `verify` script) and `"bin": {"create-gis-map":"./dist/bin.js"}`, and
   `bin.ts:81` dispatches `config.verifyArtifacts` from `--verify-artifacts`. Publishing a
   non-reproducible command in the one doc whose purpose is third-party self-service is worse than
   rewording, so `docs/engineering/evidence-record.md`, `SKILL.md` and the website guide all use
   `npx @gis-engine/cli create-gis-map --verify-artifacts ./my-map`, which I ran successfully (§4).
   Everything else in the brief's doc block is preserved verbatim in substance.
2. **Two size numbers in the budget rationale.** The brief's 236,057 B is `99a902a`-clean-build;
   this tree measures **237,324 B** because it also carries Task 6's `record.ts` read-side changes.
   The task requires the committed numbers be the real ones, so the rationale records both rather
   than quoting the stale figure alone.
3. **`artifacts.ts` scope widened beyond per-entry hashing.** The brief named the file and the intent
   but no step. Per-entry hashing alone left the shortened-`artifacts[]` hole in §3 wide open, and the
   brief's own doc text makes the manifest the byte-level anchor — an anchor that never checks the
   object it anchors is not an anchor. Implemented red-first, minimal (one new pure function, no new
   dependency, no hash recomputation), and confined to the existing diagnostic namespace.
4. **No `.changeset`** — see §6; adding one would self-certify a semver bump.

## 10. Visual snapshot waiver

Waived under the AGENTS.md waiver-candidate rule. This task touches no renderer adapter, no
layer/source transformation, no style handling, no snapshot code, no visual fixture, no URL/tile/
worker/example path, and no resource policy; `packages/engine/src/spec/resource-policy.ts`,
`tests/schema/resource-policy.test.ts` and the resource-policy doc sections are unmodified, and no
new network or external-asset surface exists — the evidence path is pure data plus local file reads
bounded to `--root`. The one content change to a generated artifact is the mock `view.mode: "map2d"`
command, which is covered deterministically by `tests/cli` (223) and by the live package run in §4.
Deterministic gates and smoke snapshots still ran and are green: `test:snapshot:smoke` 4 files /
15 tests inside `pnpm check`, including the SceneView3D release visual gate suite.

## Fix round 1

```yaml
agent: builder
period: ad-hoc
generated_at: 2026-09-27T07:10:00Z
repo_revision: "4650241 + fix-round-1 working tree (branch codex/evidence-record-a)"
inputs:
  - .superpowers/sdd/2026-09-26-evidence-record/task-7-brief.md
  - .superpowers/sdd/2026-09-26-evidence-record/task-7-review.md
owner: "@builder"
decision_level: info
```

Six findings closed (I-1, M1, M2, M3, M5, M6, M7) plus the report-side M4. Scope kept to the
findings: no re-review, no restructuring. Constraints honoured — `MAX_EVIDENCE_RECORD_BYTES`,
`semantics: "blocking"`, and the assertion-id shapes are untouched, and the verifier still answers
with structured diagnostics instead of throwing.

### I-1 (Important) — `recordId` back-link: **branch = no consumer, deleted the inert write**

Grep over the whole repo for anything reading `recordId` off the in-memory bundle (`recordId` across
`packages/**`, `apps/**`, `examples/**`, `tests/**`):

- `packages/cli/src/generate.ts:50` — `GenerateResult` is
  `{ promptHash, planStatus, commandCount, validationValid, evidenceStatus, outputDir, files }`. It carries
  no bundle, so the write at `:773` could not be observed through `generate()`'s return value.
- `evidenceResult.result` has exactly two uses: `:634` (`delivery-summary.json`'s `delivery` block, computed
  *before* the record exists and hashed into it) and `:773` itself. Nothing else in the CLI touches the
  bundle afterwards.
- `examples/ai-map-workbench/server.mjs` builds its own bundle (`:533`, `:773`) and passes it through
  `compactGenerationEvidence` (`:714`), which copies named fields and never reads `recordId`.
- The only repo readers of a `recordId` on an evidence-shaped object are
  `packages/ai/src/tools/workbenchReviewContract.ts:714` and `apps/studio/server/review-decisions.mjs:28`,
  and both are fed **audit** records (`apps/studio/server/audit.mjs:12` mints `${sessionId}.${n}`), not
  `GenerationEvidenceBundle`s. Task 9 (`docs/superpowers/plans/…:3019`) is the slice that binds a workbench
  receipt to a record id.
- No test asserted the field: `tests/cli/generate.test.ts:206` and `:578` read `recordId` from the on-disk
  `EvidenceRecord`, which is unaffected.

So the assignment was inert and it is gone. The comment at the deletion site now states why the link is
carried by `evidence.json`'s own `recordId` — hashed byte-for-byte by `artifact-manifest.json` and
cross-checked against the file set by `verifyArtifacts` — and that a producer holding both objects sets the
bundle's optional field itself. `pnpm check` after the deletion: 91 files / 1272 tests green, i.e. no
behaviour depended on the write.

**AI-side field status (disclosed, not deleted).** `packages/ai/src/tools/generationEvidence.ts:417`
(schema property) and `:614` (interface field) are still justified as a *contract slot*: the producer that
runs the record path is meant to fill it, and `createGenerationEvidenceBundle` never sets it itself (the
only writes in the repo were the CLI line above). With that line removed there is **no in-repo writer left**,
so today the field is populated by nobody and read by nobody. It stays because it is an exported contract of
`@gis-engine/ai` that Task 9's workbench receipt is specified to consume; deleting it would pre-empt that
slice's contract decision. `@quality`: if Task 9 does not land, this field and its schema property should be
removed rather than kept as decoration.

### M1 — vacuous `sources` self-comparison replaced

`tests/cli/generate.test.ts` (the `reviewable-map` case): the `sources: summary.delivery.sourceReadiness.sources`
leg is gone, replaced by two anchors that can fail — `toBeInstanceOf(Array)` and an id-set equality against
the shipped `map.json` (`buildSourceReadiness` emits exactly one row per spec source). The fixture's honest
limitation is recorded in the new comment: the deterministic mock plan declares **zero** sources, so a
`length > 0` check would have been vacuous in the opposite direction; `toEqual([])` pins that fact and turns
the anchor into a real derivation check.

Mutation proof (`packages/cli/src/generate.ts`, `summarizeDeliveryForReview` given a ghost readiness row
whose counts derive from the same ghost list, so the pre-existing self-consistent count legs stay green):

```
 FAIL  tests/cli/generate.test.ts > cli-generate-delivery-summary > writes review-ready delivery evidence…
 AssertionError: expected [ { sourceId: 'ghost', … } ] to equal []
 ❯ tests/cli/generate.test.ts:204:56
 Tests  1 failed | 15 skipped (16)
```

Restored → `✓ tests/cli/generate.test.ts (16 tests)`.

### M2 — three untested `verifyArtifacts` codes covered

New `describe("CLI evidence export cross-check diagnostic codes")` in `tests/cli/evidence-export.test.ts`
(:209). Each case drives a real `main()` export, tampers `evidence.json`, re-anchors
`artifact-manifest.json` (so only the cross-check can see it), and asserts code + `severity` + `path`, plus
exact diagnostic-set equality so a silent green is impossible:

| Code | Path reached through | Assertion |
| --- | --- | --- |
| `ARTIFACT_MANIFEST.EVIDENCE_RECORD_UNREADABLE` | truncated JSON in the manifest-endorsed `evidence.json` | `ok: false`, single diagnostic, `severity: "error"`, `path: "evidence.json"`, message names the read failure — the verifier returns data instead of throwing (constraint 7) |
| `ARTIFACT_MANIFEST.EVIDENCE_RECORD_INVALID` | a **`legacyBundleShape()` `evidence.json`** — the pre-Task-7 `GenerationEvidenceBundle` key set (`delivery.sections`, `delivery.sourceReadiness`, `delivery.spatialQueryReadiness`, no `artifacts`) | `ok: false`, single diagnostic with `path: "evidence.json/artifacts"` — the format swap's behaviour is pinned by a test, not by reasoning |
| `ARTIFACT_MANIFEST.EVIDENCE_ARTIFACT_MISMATCH` | record's `map.json` `sha256` swapped for a well-formed wrong hash **and** `preflight.json` `bytes` bumped by one | exactly two diagnostics, one per file, both `severity: "error"` — covers both legs of the fact comparison |

Mutation proofs, one per code (`packages/cli/src/artifacts.ts`):

```
1. catch → `return;` (no push):      FAIL evidence-export :256  expected false to be true   → restored
2. `!Array.isArray` → no push:       FAIL evidence-export :279  expected false to be true   → restored
3. drop the sha256 leg:              FAIL evidence-export :313  map.json diagnostic absent  → restored
4. drop the bytes leg:               FAIL evidence-export :313  preflight.json diag absent  → restored
```

Mutations 1 and 2 are the important ones: without those two branches an unreadable or old-format record
verifies as `ok: true`. All four restored → `✓ tests/cli/evidence-export.test.ts (11 tests)`.

### M3 — budget rationale arithmetic made true

`config/package-size-budgets.json` engine `rationale` now states 38,703 B as the subtraction-derived
whole-subsystem share (236,057 B − 197,354 B), names the per-file sum 38,521 B explicitly, and explains the
182 B difference: canonical dist gzip is not additive across files. `docs/engineering/contract-freeze.md:87`
already phrases it as "accounts for 38,703 measured gzip bytes" without claiming the three files add up, so
it needed no change; `pnpm check`'s policy test still passes (it asserts only the `130`/`35` substrings).

### M5 — CHANGELOG language defect

`CHANGELOG.md:11`: "the human/reviewer delivery摘要" → "the human/reviewer delivery summary".

### M6 — CLI near-exhaustion disclosed in the budget file

`config/package-size-budgets.json` cli `rationale` gained the measured state, taken from this round's
`pnpm size:check` rather than the older number in §8: 65,260 B against the 65,536 B limit (99.6% consumed,
7.46% above the 60,730 B baseline — slightly higher than the 65,008 B in §5.2 because this round's comments
and tests are in the CLI dist), with an explicit "the limit is deliberately not raised; the next CLI feature
needs a budget decision". CLI budget untouched.

### M7 — missing comment at the uncapped parse

`packages/cli/src/artifacts.ts:161`: one comment at the `JSON.parse` site recording why no
`MAX_EVIDENCE_RECORD_BYTES` cap applies here (these bytes just matched the manifest's sha256, so they are
endorsed; the cap guards the standalone verifier, whose input nobody vouched for).

### M4 — report-side

§6 of this report gained item 9: `GenerateResult.evidenceStatus: "rejected"` is a new observable value on a
public CLI return type and belongs in the contract delta @quality reviews.

### Gates

| Command | Result |
| --- | --- |
| `pnpm --filter @gis-engine/engine build` | exit 0 (`dist/evidence-verifier.mjs` rebuilt) |
| `pnpm vitest run tests/cli tests/evidence tests/framework/package-size-policy.test.ts` | **15 files / 309 tests passed**, 0 failures |
| `pnpm check` | **exit 0 — 91 test files / 1272 tests passed** (`grep -E "ELIFECYCLE\|FAIL \|×\|skipped"` over the log → no matches; the one `warn` line is the pre-existing vite chunk-size notice from `apps/studio build`) |
| `pnpm size:check` | exit 0, `blockingFailures: 0`, warnings: engine 22.34%, cli 7.46% (both advisory-visible by design) |
| `npx biome check <4 touched files>` | 0 errors; one long-line formatting error in the new test fixed with `biome check --write` |

Visual-snapshot waiver unchanged from §10: this round touches CLI/test/config/CHANGELOG text only, no
renderer, style, source, URL/tile/worker/example or resource-policy surface.

### Not closed here, by instruction

The retired `summary.delivery.sections` / `spatialQueryReadiness`↔bundle cross-checks (plan-mandated,
disclosed, @quality's call) and a `docs/migration/` note for the `evidence.json` format swap (human/@quality
decision) were left alone. One residual worth the final review's attention: the CLI mock plan has no data
sources, so M1's anchor can only pin the empty-list case until a source-bearing generate fixture exists.
