# SDD ledger — plan: docs/superpowers/plans/2026-09-26-evidence-record.md

Sub-project A (spec steps 0–3). User approved execution of **Task 1–8** on 2026-09-26;
Task 9 stays branch-gated (`codex/workbench-v1` vs PR #112 merge order is undecided).

Workspace: `.worktrees/evidence-record-a` on branch `codex/evidence-record-a` (from `bc6fa1e`).
Spec: `docs/superpowers/specs/2026-09-26-evidence-record-design.md` (`7d36a57` + `6dcc375`).

## Baseline

`pnpm install --frozen-lockfile` clean. `pnpm check` **failed on one test**:
`tests/docs/documentation-minimalism.test.ts` — handwritten docs 19157 / code 86044 = 0.2226 vs
the 0.2 budget. Attributed deterministically: `bc6fa1e` alone added the 2611-line plan; at
`6dcc375` the ratio was 0.1923 (passing). Overshoot 1948 lines.

**Ruling (user-approved, not a controller ruling):** exempt `docs/superpowers/**` from the budget
ratio only. Link audit + canonical-copy checks still cover those files. Committed as `b7ad498`.
Cost if wrong: workflow artifacts stop being restrained by the docs budget — the product-facing
gate stays intact, so the loss is bounded and visible in `pnpm test:docs`.

After `b7ad498`: `pnpm test:docs` 45/45 green. All other suites were green in the baseline run.

## Pre-flight conflict scan

Task-pair / interface rows:

| Pair | Producer output vs consumer need | Finding | Ruling |
| --- | --- | --- | --- |
| T1 → T2, T4 | `EngineCapabilityMatrix` (TS interface) vs T2's hand-written `EngineCapabilityMatrixContractSchema` (ai/mcp/server.ts) vs T4's TypeBox `EngineCapabilityMatrixSchema` | Three descriptions of one public contract; plan says T2's literal is "供 Task 4 对齐用" but **no test enforces agreement** | Add an alignment assertion in T4: `Value.Convert`/JSON-equality between the engine TypeBox schema (id-stripped) and the ai hand-written contract, placed in `tests/schema-sync/schema-sync.test.ts` where both are already imported. Repo-level test, no package-dependency inversion. |
| T3 → T4, T5, T6 | `canonicalHash` / `canonicalStringify` in `record.ts` | Consistent; T6's verifier is T3's compiled file | none |
| T4 → T5 | T5 Consumes `EvidenceAssertionId`, `EvidenceIssueCode`; T4's **Produces** block omits both (they are defined in T4 Step 3, plan lines 843–870) | Produces list incomplete, brief text is authoritative | Carry an explicit note in T5's dispatch: both symbols come from T4 `record.ts`. No code change to the plan needed for execution. |
| T5 → T6 | T6 test imports `./fixtures/record.js` (`MAP_JSON`, `buildFixture`, `sha256Of`, `validRecord`); T5 creates that fixture at plan line 1386 but its **Files** block does not list it | Files block omits a real deliverable | Note in T5 dispatch: `tests/evidence/fixtures/record.ts` is a deliverable of T5 and must export all four symbols T6 consumes. |
| T4 internal | Global constraint 3 (`record.ts` value imports only `node:*`) vs T4 Consumes `MapCommandSchema`/`DiagnosticSchema`/`stripNestedIds` | Would break the zero-dep verifier if read loosely | Confirmed non-conflict: plan line ~843 block puts `import type` in `record.ts` and the TypeBox value imports in `schema.ts`. T4 dispatch must restate this. |
| T5 → T6/T7 | `verifyEvidenceRecord` must be reachable from `@gis-engine/engine` barrel | Covered by T5 Step 4b | none |
| T6 → T7 | `dist/evidence-verifier.mjs` must be resolvable from the CLI package | Covered (T7 `resolveVerifierPath()` with `createRequire` + relative fallback, plan lines 2207/2210) | none |
| T6, T7 → T8 | Verifier CLI exit codes 0/1/2 + package contents | T8 asserts on smoke-script text and step name; contract matches T6's stated CLI | none |
| T1, T8 | Both touch coordination surfaces (`package.json` scripts, `scripts/**`) | Global constraint 10 requires `pnpm test:agent-framework` | Both dispatches must run that suite, not just `test:evidence`. |

Per-task self-consistency: every task's specified tests reference only symbols its own steps
define, except the two Produces/Files omissions above. Task 2 keeps the 14 MCP tool names and
order untouched (constraint 1) — its diff is `outputSchema`-only. Task 7 changes the *content* of
a published artifact (`evidence.json` format) and routes that judgement to @quality with
`pnpm schema:diff` evidence rather than self-certifying — matches constraint 8.

Visual-snapshot waiver (constraint 9) applies to the whole slice: no renderer adapter, style
transform, snapshot code, visual fixture, or URL/tile/worker path is touched. Must be stated in
the PR description.

## Tasks

- Task 1: complete — `19d8b37` + `3c4d13c` + `04b5bbe` + `d017f02`; review round 1 closed,
  re-review verdict "all findings addressed, no new Critical/Important breakage". Carried into
  Task 2: `blocked[]` is already canonical (scene3d literal prefix, then sources sorted by
  `sourceId`/`type`) — Task 2 must NOT re-sort it. Parked Minors: shared-object aliasing of
  `SCENE3D_BLOCKERS`; code↔path pairing now duplicated in three places (follow-up issue, not this
  slice); no test pins "scene3d prefix then sorted sources" as one array at the default gate.
- Task 2: not started
- Task 2: complete — see below
- Task 3: not started
- Task 4: not started
- Task 5: not started
- Task 6: not started
- Task 7: not started
- Task 8: not started
- Task 9: OUT OF SCOPE this run (branch-gated)

## Task 1: engine capability matrix truth source + gate wiring

Implementer `19d8b37` (DONE_WITH_CONCERNS) → review `b7ad498..3c4d13c` → **Needs fixes**.

- **Ruling (brief defect):** the brief's Step 3 sorted `available` while its Step 1 test asserted
  Set insertion order. Sorted wins — Task 4 hashes the matrix into `recordId` and canonical hashing
  preserves array order. Amended in `3c4d13c`, which also fixes the plan text.
- **Reviewer Important #1** (`blocked[]` still input-order-dependent, same `recordId` hazard):
  accepted. Readiness rows are now sorted by `sourceId` then `type` before iteration, so the
  scene3d literal order (which the plan pins: VIEW_MODE, RENDERER, DIMENSIONS) is preserved and
  source blockers are canonical. Tests added for both properties.
- **Reviewer Important #2** (plan-mandated: `/sources/${entry.sourceId}` unescaped, while
  `readiness.ts`/`validate.ts` use `escapePathSegment`): accepted as a plan defect, not a reason to
  keep the defect. Now uses `escapePathSegment` from `spec/patch/path.ts`; plan text updated to
  match so a re-run does not reintroduce it.
- **Reviewer Minor #1 (shared-object aliasing of `SCENE3D_BLOCKERS`): parked.** No consumer mutates
  the matrix; a defensive copy would be speculative.
- **Reviewer Minor #2 (code↔path pairing is now the third copy, after `spec/validate.ts:338-366` and
  `generation/commandSkeleton.ts:269-298`): parked as a follow-up issue**, outside this slice's
  scope — a shared blocker constant touches scene3d validation, not evidence.
- **Reviewer Minor #3 (coverage: `readiness-only` case, `as never` casts): fixed** — the test now
  builds real `SourceReadinessEntry` values through a typed helper and asserts `readiness-only`
  lands in neither set.
- **Reviewer Minor #4 (one type-level `available` entry vs per-source blockers): parked**, brief-designed.
- ⚠️ carried forward: constraint 7 (TypeBox + Ajv coverage for the matrix) is satisfied by Task 2's
  outputSchema work, not Task 1.

**Process note:** this harness exposes no subagent resume/messaging tool, so fix-round work is
applied by the controller directly onto the implementer's commit and then gated by an independent
scoped re-review, rather than by resuming the implementer. Model tiers could not be set per dispatch
(no model parameter exposed); session model was inherited.


## Task 2: capability matrix through two MCP envelopes

Implementer `2d47430` + `57f6c24` (DONE_WITH_CONCERNS) → review `d017f02..57f6c24` → **Approved**,
no Critical/Important.

- **Ruling (plan defect, second one):** the brief's Step 3 said to add `capabilities` to the shared
  `ValidationReportSchema`. That schema is embedded by `snapshot_spec`, `explain_spec` and
  `GenerationEvidenceBundleSchema`, all of which carry bare `validateSpec()` reports with no
  `capabilities` field, so the literal edit would have broken three published envelopes
  (implementer captured the Ajv failure). The brief's own **Produces** block names
  `ValidateSpecToolResultSchema.capabilities`, so the implementer's decoupled composition is the
  contract-faithful reading. Plan Step 3 + Files block amended to match.
- Out-of-brief edit accepted as minimal: `generationEvidence.ts` now embeds the bare
  `ValidationReportSchema` so the bundle's published `validation` shape stays byte-identical;
  `ValidationReportSchema` is exported from `server.ts` but deliberately *not* re-exported from the
  `@gis-engine/ai` barrel.
- **Routed to @quality (not self-certified):** two `outputSchema`s widened + transitive widen through
  the context-summary embed. `pnpm schema:diff` printed "No schema file changes" and that is truthful
  — `scripts/schema-diff.mjs:23` only scans `packages/engine/src/spec/schemas/`, so hand-written MCP
  descriptors are structurally invisible to it. The itemized delta is in `task-2-report.md`.
- **Parked (tooling gap, for @orchestrator):** `schema:diff` cannot see MCP descriptor changes, which
  are the most contract-relevant changes in an ai-package diff. Out of this slice's scope.
- Parked Minors: no source-bearing spec exercised through an MCP envelope (derivation itself is
  covered by Task 1's engine tests); `input.spec as MapSpec` cast is plan-mandated noise; two
  overlapping guard comments; `server.ts` > 1100 lines (split candidate); pre-existing Biome
  `useOptionalChain` warnings in `transformData.ts`.

## Task 3: canonicalHash 唯一实现 + 三处哈希收敛

- Brief `task-3-brief.md`, impl `1587c33`, report `task-3-report.md`, review `task-3-review.md` → **Needs fixes**.
- **Controller process error (disclosed to the reviewer):** the dispatch referenced `task-3-brief.md`
  before it had been generated; the implementer recovered the requirements from the plan text and the
  brief was generated afterwards. Brief and plan text are now authoritative and identical.
- **Ruling on Important #1 (plan-mandated shape rejected):** the plan exported `canonicalHash`
  (which value-imports `node:crypto`) from the browser-facing root barrel, and the implementer
  silenced the resulting studio build failure with `rollupOptions.external: ["node:crypto"]`.
  "Silent" is not "safe": `apps/studio` and `examples/*` bundle that barrel. Fix round 1:
  split `canonical-stringify.ts` (pure, zero imports — what `pmtiles-query.ts` needs) from
  `record.ts` (`node:crypto`), stop re-exporting hashing from the root barrel, and expose the
  hashing surface only through a new `@gis-engine/engine/evidence` subpath export
  (`packages/engine/package.json` + a `vitest.config.ts` alias entry that must precede the
  `@gis-engine/engine` prefix). The studio `external` hack is reverted; `pnpm check` runs
  `pnpm -r build`, which includes `apps/studio: tsc && vite build`, so the real bundler is now the
  gate instead of a comment.
- **New guard:** `tests/evidence/canonical-hash.test.ts` BFS-walks every module the root barrel
  reaches at runtime and asserts no `node:` specifier. Mutation-tested (temp `node:crypto` import in
  `src/index.ts` turned it red, reported `index.ts -> node:crypto`, then reverted).
- **Ruling on Important #2:** the report's claim about the deleted `stableStringify` and `undefined`
  keys was wrong in direction; the surviving invariant is that `indexFixtureFeatures` sanitises every
  digest input, so no key ever holds `undefined`. Captured as a two-line comment on `digestStableValue`.
- **Plan defect found while re-shaping:** Task 6 assumed the verifier is a byte copy of one compiled
  file. The split makes that false, so Task 6's build script is now a dependency-ordered inliner over a
  declared BUNDLE (`canonical-stringify.js`, `record.js`) that **fails loudly** on any non-`node:`,
  non-BUNDLE import instead of stripping it silently. The plan's global constraint #3 and the
  record.ts module-table row are restated accordingly: `record.ts` still must not value-import
  `diagnostics/codes.js` — the plan deliberately gives it its own `EvidenceIssueCode` literals, pinned
  in sync by the schema-sync test.
- **Also amended in the plan:** Task 7/8's `createRequire(...).resolve("@gis-engine/engine/dist/…")`
  would throw `ERR_PACKAGE_PATH_NOT_EXPORTED` once `exports` exists, so Task 6 now also exports
  `./evidence-verifier.mjs` and `./package.json`, and Task 7 resolves the subpath specifier.
- Verification: `pnpm check` EXIT=0 (build incl. studio vite build + all test suites + test:studio).

### Fix round 1 outcome (re-review `task-3-rereview-round1.md`)

- Scoped re-review verdict: **ADDRESSED**. Independently re-ran the BFS (48 modules, 0 offenders),
  built studio, and grepped `apps/studio/dist/assets/*.js` for `node:crypto` (absent, not stubbed).
  Gate exit codes it reported: test:evidence 0, test:ai 0 (305), studio build 0, `pnpm check` 0.
- Its Minor #1 (guard bypassed by `await import("node:crypto")`) was load-bearing enough to fix on the
  spot: `e9c97af` scans dynamic imports too, mutation-proven red-then-reverted. Minors #2/#3 (multiline
  import blind spot in Task 6's strip regex; stale plan wording) — wording fixed in the same commit,
  the regex blind spot is latent while Biome/tsc emit single-line imports and is parked.
- Parked for the final whole-branch review: `@gis-engine/engine` gains a public subpath export and no
  changeset exists for it yet (`.changeset/` currently carries only `geoparquet-versioned-metadata.md`);
  PR CI does not require one, `release.yml` consumes them.
- Task 3 **complete** at `e9c97af`.

## Task 4 — EvidenceRecord public contract + buildEvidenceRecord

**Complete at `f3a43d1`** (head `99b5929` → base for Task 5). Commits: `62a357a` (feature),
`17bae74` (fix round 1), `99b5929` (controller test hardening), `f3a43d1` (fix round 2).

- Scope shipped: `evidence/record.ts` (types, `EvidenceAssertionId`/`EvidenceIssueCode`/
  `EvidenceExclusionId`, `buildEvidenceRecord`, `MAX_EVIDENCE_RECORD_BYTES`), `evidence/schema.ts`
  (`EvidenceRecordSchema` with `stripNestedIds` on the nested `$id` carriers), the six `EVIDENCE.*`
  diagnostic codes, and the `@gis-engine/engine/evidence` subpath barrel.
- **Task 5 note carried forward:** the six `EVIDENCE.*` codes are already in
  `packages/engine/src/diagnostics/codes.ts` — Task 5 Step 1 must verify presence/values, not
  re-insert (duplicate keys are TS1117).

### Review findings and rulings (round 1, `task-4-review.md` / `task-4-rereview-round1.md`)

- **I-1** `ok:true` ⇏ schema-valid; **I-2** TypeError on nullish input; **I-3** the pre-flight
  alignment lock I had mandated was never implemented *and* the implementer did not declare it
  missing; **I-4** `recordId` hashed the un-normalised in-memory object, so an honest record would
  come back CHAIN_BROKEN after a JSON round trip. All four closed in `17bae74`; the re-reviewer
  verified each against compiled `dist` and live probes, not just the diff.
- **Ruling (validator scope):** `structuralIssues` pins exactly the fields Task 5's recomputation
  reads. It must NOT deep-validate `MapCommand`/`MapSpec` — that is Ajv's public contract, and a
  second spelling creates a second truth source. Literal duplication between `record.ts` and
  `schema.ts` (ISO-8601 grammar, exclusion vocabulary, capability schemaVersion) is sanctioned only
  where a two-sided test pins it; `record.ts` may not value-import TypeBox because Task 6 inlines
  its closure into a zero-dependency verifier.
- **Ruling (validate-after-defaults):** ACCEPTED. The brief's own Steps 3/4 rejected the brief's own
  Step 1 fixture; materialising `issuedAt`/`exclusions` defaults before validating is the only order
  that satisfies both, and no caller-supplied *present* invalid value is masked (`""` issuedAt, `[]`
  and unknown exclusions all still rejected — live-verified). Plan amended to the shipped order.
- **Ruling (test rename):** ACCEPTED — the violation table is now bidirectional per row (structural
  reject + Ajv reject on the same mutation), a strict superset of what it asserted before.
- **Controller-authored `99b5929`:** the key-reordering stability test compared two `recordId`s for
  inputs that omit `issuedAt`, so each build stamped its own `new Date()`; proved a 1 ms delta
  changes `recordId` (issuedAt is inside the hashed payload) and pinned an explicit timestamp. The
  implementer had flagged this as a latent flake rather than fixing it unilaterally — correct call,
  controller authored the fix.

### Fix round 2 (`task-4-fix2-report.md` / `task-4-rereview-round2.md`)

- Round-1 re-review found the *fix* had introduced a new constraint-7 throw:
  `[...new Set(input.exclusions ?? DEFAULT)]` ran inside the record literal, so `{}`/`42`/`true`
  threw `TypeError: object is not iterable`. Closed by guarding on `Array.isArray` and letting
  non-arrays fall through to the validator's existing non-array check; red-first + mutation-proven;
  plan Task 4 block amended in the same commit so no later brief can re-introduce the spread.
  `"ab"` now diagnoses at `/exclusions` instead of `/exclusions/0` — the test pins the invariant
  (rejected, structured, never thrown) rather than the incidental path.
- **Ruling (cyclic / BigInt input):** confirmed reachable and throwing at the builder's
  `JSON.parse(JSON.stringify(...))`, because the validator deliberately does not enumerate extra
  properties. Judged **Minor, fixed once in Task 5**: no consumer in the repo can produce such a
  graph today (`buildEvidenceRecord` has zero non-test call sites; MCP input is JSON-RPC, hence
  acyclic and BigInt-free), and patching it here would either widen the validator beyond its
  sanctioned scope or duplicate a try/catch that Task 5 needs anyway. The plan now requires Task 5 to
  introduce `normaliseEvidencePayload` and make the builder call that one helper, returning a
  diagnostic instead of throwing.

### Gates

`pnpm build:schema` EXIT=0, `pnpm check` EXIT=0 (controller-run at `f3a43d1`),
`tests/evidence` + `tests/schema-sync` 61 passed (46 at feature commit).

### Ledger for the final whole-branch review

- `scripts/schema-diff.mjs:23` scans only `packages/engine/src/spec/schemas/`, so
  `evidence/schema.ts` and the diagnostics-enum widening are **invisible to `pnpm schema:diff`** —
  the tool printed 0/0/0 while this task added a public schema. Task 7 must hand @quality the real
  delta rather than trusting the tool; extending the scanner is a coordination-surface change.
- `validInput()` in `tests/schema-sync/schema-sync.test.ts` duplicates record-build's fixture;
  folding both into Task 5's `tests/evidence/fixtures/record.ts` is endorsed, deferred to Task 5.
- Plan prose carries Chinese comments inside code blocks that ship as English source comments
  (working-document artifact only; align or leave at final review).
- No changeset yet for the `@gis-engine/engine` public surface this task widens (subpath export +
  `EVIDENCE.*` codes + `EvidenceRecordSchema`); still parked with Task 3's.

## Task 5 — verifyEvidenceRecord (pure-data recomputation)

**Complete at `c0bb64b`** (base for Task 6). Commits: `be0e0ea` (feature), `98f946e` (controller plan
fix), `c0bb64b` (fix round 1).

- Shipped: `verifyEvidenceRecord` + the four verify-facing types, the single
  `normaliseEvidencePayload` hash expression now shared by builder and verifier (closing Task 4's I-4
  for good), `tests/evidence/fixtures/record.ts` (consumed by Task 6 too), and the diagnostic-code
  sync lock.
- **Export shape (controller ruling, plan amended in `98f946e`):** the brief's Step 4b said Tasks
  6/7/8 consume `verifyEvidenceRecord` through `@gis-engine/engine`. That contradicts Task 3's
  module-boundary contract — the verifier is a runtime value in `record.ts`, which value-imports
  `node:crypto`, so a root-barrel value export would make it bundle-reachable and redden the BFS
  guard. Root barrel exports the four verify **types** only; **Tasks 6/7/8 must import the value
  from `@gis-engine/engine/evidence`.**
- **Consumer contract handed to Tasks 6/7/8:** `ok === (no assertion `failed`) && (no
  `severity:"error"` diagnostic)`. Branch on `result.ok`, never on the assertions array alone — the
  version-unsupported and capability-drift failures have no assertion row of their own. The six
  assertion ids are a frozen spec §8 shape: no seventh row will appear to carry them.

### Review (Important ×2, both plan-mandated) and fix round 1

- **L-1** `DERIVATION_CLOSED` passed vacuously: `checkLineage` skipped entries silently when
  `baseRevision`/`nextRevision` were absent, and both are optional on `EvidenceRecordCommand` and
  unrequired by `structuralIssues` — the brief's own Step 4 code had the same conditional-skip shape,
  so this is reported as **plan-mandated**, i.e. the plan authored a defect the human must see.
  Ruled: applied-only chain anchored `project.baseRevision` → `project.revision` in five clauses,
  including the zero-applied case (closes only when the anchors are equal) and non-string anchors.
- **L-2** `ok: true` while the verifier emitted `SCHEMA_VERSION_UNSUPPORTED` / `CAPABILITY_DRIFT`.
  Also plan-mandated. Ruled: the severity-based `ok` formula above + the verifier re-runs
  `structuralIssues(record)` once so a chain-closed forgery with a malformed field cannot report
  green. Assertion ids/order untouched.
- Four Minors folded in by ruling (both-lists capability drift, nullish options never-throw, per-test
  artifact state, pristine Biome-clean test output).
- Fix round 1 re-review (`task-5-rereview-round1.md`): all ADDRESSED, and it ran twelve honest
  builder-produced record shapes through build → JSON transport → verify to prove the new structural
  re-fires no false red — the exact regression risk this class of fix creates. Deviations D1–D4 from
  the feature round were all ruled correct by the reviewer (notably D3: the brief's
  `await import("@gis-engine/engine")` could never have worked, since the root barrel exports
  `EvidenceIssueCode` type-only).

### Ledger for the final whole-branch review

- Symbol-typed leaf: `SHA256_PATTERN.test(symbolValue)` would throw if a `origin.planHash` (or
  sibling) were a `Symbol`. Unreachable through any JSON transport; pre-existing since Task 4's
  builder-input validation. Ruled Minor; same family as Task 4's cyclic/BigInt note, which Task 5
  totalised via `normaliseEvidencePayload`.
- Unsupported `schemaVersion` records now also collect `RECORD_INVALID` rows from the verifier's
  structural re-run alongside `SCHEMA_VERSION_UNSUPPORTED`. `ok` is correct either way; the message
  stack is cosmetic and deferred.
- Controller process note: two writes to this ledger silently failed with a harness internal error and
  were retried; the Task 5 section is the second attempt. `task-5-review.md` had to be reconstructed
  from the reviewer's returned report rather than saved straight from the dispatch.

## Task 6 — 零依赖单文件 verifier + §8 断言 7 守卫

**Complete at `99a902a`** (base `ade0933`, head for Task 7 = `b8c546e`). Commits: `e4e42df` (injectable
verifier CLI + containment guard), `99a902a` (standalone bundle + build hooks + exports), `ade0933`
(controller: plan containment guard written before dispatch), `b8c546e` (controller: plan sync +
Task 7 carry-overs).

### Pre-flight ruling executed as planned

The path-traversal hole in the brief's own sketch was found before dispatch and written into the plan
(`ade0933`), so the implementer built `isInsideRoot` from the start instead of having a fix round
discover it. That is the second time pre-flight reading the plan's code caught a spec §6 決定 4 threat
model gap (the first was the `ANY_IMPORT` bypass closed in `30e6dc2`).

### Review (spec ✅, quality Approved; 0 Critical / 0 Important / 6 Minor)

`task-6-review.md`. Four deviations D1–D4 all ruled **correct** by the reviewer with my own verification
on top:
- **D1** (diagnostic quotes): the mandated `MODULE_SPECIFIER` scan is deliberately an
  over-approximation — it false-positives on prose like `moved from "${x}" to`. Ruling: keep the
  fail-loud scanner and make the *input* scanner-clean. A "precise" statement-anchored regex would miss
  a multi-line `import {…}\nfrom "…"` emission, i.e. it converts a loud false positive into the silent
  false negative Task 3 already exposed once. No test pinned the double-quote form.
- **D2** (`resolveUnderRoot`): the brief's naive prefix provably cannot pass the brief's own Step 1
  tests, which pass an absolute record path with `--root`. Absolute form is honoured only for the
  operator-named record; `isInsideRoot` runs before any join for artifacts. Reviewer traced the same
  ordering independently and agreed there is no artifact escape.
- **D3** (`.map((source) => resolve(source))`): strict-mode TS2345 in the brief — `tsc` would have failed
  before the guard, making the mutation proofs indistinguishable from a compile error.
- **D4** (fifth containment case): the brief's four cases left the guard's own root-`..` clause untested.

Mutation proofs M1/M2 (static + dynamic import both fail the build, and `grep -cE '\bfrom\s+"'` on the
compiled `record.js` returning 2 for a leaking file — i.e. a `from`-only scanner would have shipped it)
and M3 (guard neutralised ⇒ the four escape tests go red on the *read spy*, not just on `ok`) are the
strongest evidence in this plan so far. M4 incidentally showed the verbatim-embedding lock detects
dist drift.

### Blocking gate finding — package size (routed to @quality / the human, not self-certified)

`pnpm size:check` at `99a902a`: engine **236,057 B vs 204,800 B blocking budget** (exit 1). Attribution
measured with the policy's own canonical algorithm on a clean dist:
`dist/src/evidence/**` 23,384 + `dist/schema/evidence-record*.json` 5,239 + `dist/evidence-verifier.mjs`
9,898 = **+38,703**, leaving 197,354 — i.e. the overrun is entirely this spec's doing, and dropping the
verifier alone does not get back under budget (226,159). The implementer correctly refused to touch the
budget file; the plan's Task 7 Step 5 already prescribes "update the budget with measured numbers and a
written rationale, never silently", so the fix is on-plan — but the *decision* stays @quality's and is in
the PR handoff.
Process gap worth a follow-up outside this plan: `pnpm check` does not include `size:check`, and
`bundle-size.yml` is filtered to `packages/**`, so this branch is the first in ~7 weeks to actually run
the gate — which is why the local/CI parity promised by the 2026-08-05 #39 decision did not hold.

### Carried into Task 7's dispatch (binding, committed in `b8c546e`)

1. Read-side `MAX_EVIDENCE_RECORD_BYTES` enforcement in `runEvidenceVerifierCli` (reject before parse).
2. `BUNDLE` ↔ `BUNDLE_MODULES` cross-reference comments.
3. Symlink residual of a pure-string guard written into the §6 threat-model doc, not left implicit.
Plus the size budget/rationale and the two review Minors that need no new behaviour.

## Task 7 — CLI 导出包落盘 `evidence.json` + manifest 角色

**Complete (feature rounds) at `c7e7985`** (base `b8c546e`). Runs in two dispatches because the first
implementer hit the harness turn limit (150) mid-task with a large **uncommitted but green** tree
(51 tests across the four touched files, verified by the controller before any handoff). The takeover
dispatch was told explicitly what was inherited, what remained, and not to re-derive working code — the
cheapest recovery, and it held: the takeover finished Steps 4b/5/6 + `artifacts.ts` + docs and committed
five focused commits rather than one squash.

- `abb7856` read-side byte cap + `BUNDLE`/`BUNDLE_MODULES` lock (Task 6 carry-over 1 + 2)
- `be66dac` CLI writes a recomputable `EvidenceRecord`
- `c6408f6` manifest reuse for byte-level integrity (closes a hole the brief only hinted at)
- `de68430` engine size budget raise with the measured rationale
- `c7e7985` docs: third-party recompute path + threat model (carry-over 3)
- `4650241` controller: plan text fixed — Task 7's verify command is `create-gis-map --verify-artifacts`,
  not the `pnpm --filter @gis-engine/cli verify <dir>` the brief invented (implementer deviated correctly
  and proved the real command by running it).

### Review (spec ✅ except one plan-mandated gap, quality Approved; 0 Critical / 1 Important / 7 Minor)

`task-7-review.md`. Risk judgements the controller asked for and the reviewer closed with checks:
- **Format swap** is honest: a pre-Task-7 package hits `EVIDENCE_RECORD_INVALID` through `verifyArtifacts`
  and `SchemaVersionUnsupported` + `unverifiableAssertions()` through the standalone verifier — structured,
  never silently green. Migration note for external consumers is a @quality/human call, not self-certified.
- **Budget raise** is on-plan and faithful: `semantics` still `blocking` for both packages,
  `baselineBytes` deliberately left at 193,984 so the 22.34% regression stays a visible warning.
- **New codes**: `ARTIFACT_MANIFEST.*` is CLI-local and not part of `DiagnosticCodes`, so the
  `EvidenceIssueCode`↔`DiagnosticCodes` exact-set lock does not apply — no missed sync.
- **Two-agent seams**: none found; `requiredFileCount` was tightened 4→5, and the test widenings were
  forced by the bundle leaving disk (one vacuous exception, M1).
- **Important (plan-mandated)**: `generate.ts:773` back-fills `recordId` into an in-memory object the CLI
  never returns and no test asserts — the brief mandates the back-fill, so the defect is the plan's.
  Ruled: fix round 1 must prove a consumer exists (assert it) or delete the inert write; evidence in the
  report either way.

### Rulings written into the ledger

- `Ruling: the reviewer's Important is fixed by a branch the code decides, not by keeping a dead write.`
  Cost if wrong: a public-contract link that silently drifts.
- The size-gate story told to @quality: engine 236,057→237,324 against 204,800; evidence subsystem
  attribution ≈38.7 KB; non-evidence 197,354 (main is inside budget); removing the verifier alone still
  fails (226,159). Also recorded: `pnpm check` omits `size:check` and `bundle-size.yml` only fires on
  `packages/**`, so this branch is the first in ~7 weeks to actually run a "blocking" gate — the local/CI
  parity the 2026-08-05 #39 decision promised does not hold in practice. Follow-up outside this plan.
- `pnpm schema:diff` remains blind to `evidence/schema.ts` and `packages/cli`'s surface: task 7 §6 of its
  report is the real 8-item contract delta and must ride in the PR body. No changeset exists yet — the
  implementer declined to self-bump, which is correct.

### Fix round 1 (`3cb9947`) and scoped re-review — closed

Re-review verdict: **all 8 findings ADDRESSED, no new Critical/Important breakage.** Condensed record in
`task-7-rereview-round1.md`. Highlights the controller verified into the ledger:
- **I-1 resolved by deletion, not assertion.** The fixer proved no code reads a *bundle's* `recordId`
  (every other reader is audit-shaped: `workbenchReviewContract.ts:714`/`:670`,
  `apps/studio/server/review-decisions.mjs:28`, `apps/studio/server/audit.mjs:8`, `tests/examples/*`),
  so the inert write is gone and the link is documented as carried by `evidence.json`'s own `recordId`.
  The reviewer re-ran that grep independently and confirmed it, plus the arithmetic that
  `1,269 → 1,272 tests` accounts for exactly the three new cases — i.e. nothing depended on the write.
- The AI-side `recordId` field (`generationEvidence.ts:417`, `:614`) stays — brief-mandated, optional,
  outside `required`, Task 9 is its specified consumer — but is now **writer-less in-repo**, with a stated
  removal condition. Carried to the PR for @quality.
- Old-package behaviour is now *pinned by a test*, not by reasoning:
  `evidence-export.test.ts:270-295` feeds a genuine `GenerationEvidenceBundle` key set and asserts
  `EVIDENCE_RECORD_INVALID` at `evidence.json/artifacts`.
- Rationale arithmetic corrected in the config itself: 38,703 B is the subtraction-derived total, the
  per-file sum is 38,521 B, the 182 B gap is canonical-dist-gzip non-additivity. The cli entry now records
  65,260/65,536 (99.6%) and that the limit was deliberately not raised.
- Non-blocking carry-overs for the final review: CHANGELOG's "bundle gained an optional `recordId`
  pointing at the record it views" doesn't say no in-repo producer sets it any more; `pnpm check` carries
  one pre-existing vite chunk-size warning from `apps/studio build`.






---

## Task 8: 外部彩排——第三方复算进 smoke 步骤 — complete

Commit `0ba4074` (range `3cb9947..0ba4074`, package `review-3cb9947..0ba4074.diff`).
Reviewer verdict: **Approved** — 0 Critical, 0 Important, 5 Minor (record in `task-8-review.md`;
saved after the fact from the reviewer's report, the ledger had not yet carried it).

- All four brief files implemented verbatim modulo declared biome whitespace. Imports needed no
  "补齐" — `execFileSync`/`readFileSync`/`writeFileSync`/`join` were already present at
  `scripts/cli-install-smoke.mjs:3-6`; the reviewer checked the base and confirmed the brief's
  premise was wrong but harmless.
- Binding constraints hold: (2) pure-data recompute only; Task 6 contract — caller branches on
  `verdict.ok === true` **and** the assertions array; Task 7's "excluded → not-covered, not silence"
  is a hard assertion on `VISUAL_CONSISTENCY`; "不得为了让彩排通过而删步骤" honored, nothing removed.
- Gates as brief mandated: focused vitest, `pnpm test:agent-framework` + `pnpm test:docs`
  (coordination surface), `pnpm check`, and a real `node scripts/first-run-acceptance.mjs`
  rehearsal with the tamper step green.
- **Controller correction recorded:** my pre-review note "no CI runs this rehearsal" was wrong.
  `scripts/release-verify.mjs:38-40` runs `pnpm smoke:cli-install` and
  `.github/workflows/npm-release.yml:38` runs `pnpm release:verify`, so the step **is** a
  release-blocking gate, matching `docs/engineering/ci-test-strategy.md:105`.
- Reviewer Minors carried to the final backlog: no explicit "tamper actually changed bytes" guard
  (residual is a misleading message, not a false green — mutation proof 1 shows the neutralised
  tamper going red in a real smoke); restore not read-back verified; the brief's
  `toMatch(/--json/)` is vacuous (`--json` was already in the base file twice); the new tests do not
  pin the tamper half; `docs/engineering/ci-test-strategy.md:69-75` prose now under-describes the
  smoke's failure modes.

## Final whole-branch review (`bc6fa1e..0ba4074`, 33 commits / 51 files / +4671−254)

Report saved at `final-review.md`. Verdict: **0 Critical, 7 Important, 8 Minor — "Ready to merge?
With fixes."** The reviewer read all 7,786 diff lines in six sequential passes and named its
out-of-diff inspections; no false-green path was found (containment refuses absolute/`..`/NUL/drive
before any read, over-budget files are refused before `JSON.parse`, every `not-covered` row must be
declared).

**Ruling on the loop:** SDD allows ONE fix dispatch after the final review. Items 1–4 are code and go
into that dispatch; items 5–7 are @quality/human decisions and must NOT be self-approved by an agent:

- `Ruling: Important 5 (documentation-minimalism exempts docs/superpowers/**) is ratified, not
  reverted.` — **Why:** the user chose 「把 superpowers 工件排除出口径（推荐）」 in conversation on
  2026-09-26, which is exactly the alternative the reviewer offered ("ratify formally … or revert and
  let the plan text shed lines"). **What it costs if wrong:** a self-serving gate-scope change without
  written provenance; the mitigation is that the ruling is recorded here and the exemption goes in the
  PR body for @quality to see. The reviewer's factual half stands and is recorded: the change is
  unplanned (grep of the plan = 0 hits) and had no ledger entry until now.
- `Ruling: Important 6 (three readiness→matrix spellings) is a plan defect, deferred.` — plan:552 is
  verbatim the `report.valid` gate, so the implementer complied; aligning or pinning it is a
  contract change across `packages/ai` that this plan never scoped, and it belongs with @quality + a
  follow-up issue, not a final-mile dispatch.
- `Ruling: Important 7 (CLI 276 B blocking headroom) is not fixable by code.` — the budget was
  deliberately not self-raised; the owed artifact is an owned issue plus @quality's call, listed in
  the PR body.

Dispatch scope for the single fix round: Important 1 (spec §7 mapspec↔`spec.afterHash` recompute +
forged-pair test, red-first; reviewer classifies the omission as a **plan gap that shipped silently**,
so the plan's Task 5 sync table must gain the row), Important 2 (wire `expectedCapabilities` at
`--verify-artifacts` + threat-model bullet), Important 3 (`SKILL.md:322-335` schema-invalid literals +
a docs test validating the example against the compiled schema), Important 4 (`normaliseEvidencePayload`
onto the `./evidence` barrel + `reseal()` uses it), and the cheap Minors: doc exit-0 clause, unknown CLI
flag rejection, sourceMappingURL stripping, CHANGELOG recordId clause, `--root .` in the rehearsal,
quoting pin at `record-verify.test.ts:298`.

## Final fix round (range `0ba4074..8e35115`) — dispatched and reported

Commits: `6c68350` (fix), `d682cdc` (Biome hook's formatting, new commit not `--no-verify`),
`8e35115` (M7 rehearsal report). Report: `final-fix-report.md`. Package: `review-0ba4074..8e35115.diff`.

Fixer status DONE, claiming F1–F4 + M1–M7 closed, items 5–7 untouched. Controller verification before
accepting:
- `git diff --stat` matches the claim (13 files, +450/−29; `packages/cli/src/artifacts.ts` untouched, as
  the F2 ruling required).
- Read the `record.ts` hunk directly: `checkPackagedSpecBody` at `:673-717` folds into `DERIVATION_CLOSED`
  at `:525-536`, only on byte-matched `role === "mapspec"` artifacts (`:478`), parse failures degrade to a
  `DerivationFailed` diagnostic, and it reuses the existing `safeCanonicalHash` (`:740`) rather than
  duplicating a hash path. M2's argv loop now rejects unrecognised flags with the usage string + exit 1.
- Ran `pnpm vitest run tests/evidence tests/docs` myself: **11 files / 128 tests passed**.

Open question the re-review was told to settle (controller-raised, not the fixer's): the recompute is
conditional on the record *declaring* a `mapspec` artifact, so a record that labels its spec file under
another role, or omits it, still reports `DERIVATION_CLOSED passed`. Judge whether that is a gap this
loop must close, pre-existing and compensated by the CLI manifest cross-check, or exactly what spec §7
words require.

Ruling recorded now regardless of the answer: `plan Task 5's sync table` wording in the brief was wrong —
the plan has one sync table, and the fixer amended that one. Cost if wrong: a disclosure row in the
wrong place; the plan text remains self-consistent.

## Re-review round 1 — loop closed

`final-fix-rereview-round1.md`. Verdict **Loop can close**: F1–F4 + M1–M7 all ADDRESSED, and the
reviewer reproduced the gates rather than trusting the report (457 tests, `size:check` engine
239,763/262,144 and cli 65,260/65,536, budgets file untouched).

Two new Minors, both handled by the controller after the loop:
- **Minor-1 (fixed, `f0376ba`)**: the fixer's SKILL prose claimed *every* example value was recomputed
  from the example's own content, but the `map.json` artifact↔`afterHash` pair has no printed preimage and
  the reviewer could not reproduce it (153 B / `sha256:dd0fd659…` vs the doc's 152 B / `991cde20…`).
  Disposition: rather than delete the claim, narrow it to what is provable **and pin that**: the docs test
  now recomputes `recordId` the way `CHAIN_CLOSED` does. Can-fail proof: one corrupted hex digit →
  `skill example recordId does not re-seal from its own body`. `519e30f` removes the two non-null
  assertions Biome flagged in the same test.
  `Ruling: an unverifiable evidence claim is a defect in this branch specifically, so it is narrowed
  rather than argued.` Cost if wrong: nothing shipped claims more than the tests enforce.
- **Minor-2 (noted, not fixed)**: `--root a --root b` takes the last; `--root --json` swallows `--json`
  as a directory name. No in-repo caller uses either form and unknown flags still exit 1. Carried to the
  PR body.
- **F1 residual carried to the PR body for @quality** (reviewer judged it (b)+(c), not a loop blocker):
  the packaged-spec recompute is keyed to a *declared* `role === "mapspec"` artifact, so a record that
  omits or re-roles its spec file still reports `DERIVATION_CLOSED passed`. The omission half is
  compensated by `crossCheckEvidenceRecord`; the re-role half is caught by nothing. Closing it properly
  means deciding what a record is obliged to attest — spec territory, not a final-mile code edit.

Plan/ledger disclosure: the brief said "Task 5 sync table"; the plan has one sync table, and the fixer
amended that one (`+2` lines in `docs/superpowers/plans/2026-09-26-evidence-record.md`).
