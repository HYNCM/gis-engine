# Task 2 review: 能力矩阵进 `get_context_summary` + `validate_spec`

Reviewed range `d017f02..57f6c24` (commits `2d47430`, `57f6c24`), 6 files, +130/-13.
Paths below are relative to `/Users/chengming/CodeXProjects/gis-engine/.worktrees/evidence-record-a/`.

## Spec Compliance

Verdict: **compliant**. The one deviation from Step 3's literal wording is judged correct — the brief's own Produces contract demanded exactly what was built, and the out-of-brief edit is the minimum necessary change. All brief-listed files were touched.

- ✅ `ContextSummaryToolResultSchema` widened: `capabilityMatrix: EngineCapabilityMatrixContractSchema` in `properties` and `"capabilityMatrix"` appended to `required` (`packages/ai/src/mcp/server.ts:493-499`), per brief Step 3.
- ✅ `ValidateSpecToolResultSchema.capabilities` required (`packages/ai/src/mcp/server.ts:243-250`), per brief Produces (brief line 11).
- ✅ Handlers populate both required fields. `validate_spec` composes `{ ...report, capabilities: buildEngineCapabilityMatrix({ readiness }) }` gated on `report.valid` (`packages/ai/src/mcp/server.ts:893-900`, verbatim from Step 4). `getContextSummary` assigns `capabilityMatrix: buildEngineCapabilityMatrix({ readiness: sourceReadinessEntries })` (`packages/ai/src/tools/contextSummary.ts:231`).
- ✅ Hand-written descriptor mirrors the engine's actual matrix shape, not an invention: `schemaVersion` const `"engine-capabilities.v0.1"` matches `ENGINE_CAPABILITY_MATRIX_SCHEMA_VERSION` (`packages/engine/src/evidence/capability-matrix.ts:6`); blocker `required: ["code","reason"]` with optional `path` matches `EngineCapabilityBlocker { code; reason; path? }` (`capability-matrix.ts:8-12`); `available: string[]`, `additionalProperties: false`, all three top-level fields required match `EngineCapabilityMatrix` (`capability-matrix.ts:14-18`).
- ✅ 14 tool names and order untouched: no hunk touches the tool list; pinned both by the unchanged hard gate `tests/schema-sync/schema-sync.test.ts:192-216` and by the new test (`tests/ai/capability-matrix-exposure.test.ts:27-44`). Widening is confined to existing `outputSchema`s.
- ✅ `EngineCapabilityMatrixContractSchema` exported from the barrel (`packages/ai/src/index.ts:10`), added to the Ajv compile inventory (`tests/schema-sync/schema-sync.test.ts:11, 77`) — brief Step 6.
- ✅ Regenerated committed schema JSON correctly absent: no committed `*.schema.json` exists outside `dist/`; `build:schema` writes to `packages/ai/dist/schema/` (`packages/ai/scripts/build-schema.mjs:15`, gitignored) and no engine TypeBox schema changed. The report's claim checks out.
- ✅ Failure envelope preserved: `validate_spec` descriptor stays `withMcpToolExecutionError(ValidateSpecToolResultSchema)` (`server.ts:779`); error branch still `toolTextResult(input.diagnostics, true)`. Draft-07 constructs only (`const` is draft-07 legal).
- ✅ Task 1 contract honored: no re-sorting of `blocked` anywhere downstream — both call sites pass the matrix through as returned (`server.ts:898`, `contextSummary.ts:231`); the only sort remains in the engine (`capability-matrix.ts:64-86`).
- ✅ Brief Step 5's "hoist, don't call twice": single `createSourceReadinessReport` call in `getContextSummary` (`contextSummary.ts:215`), consumed by `summarizeSourceReadiness(spec, sources)` (signature change, `contextSummary.ts:464-468`) and the matrix.
- ✅ Brief Files list coverage: `contextSummary.ts` interface/构造点/readiness 映射, `server.ts` three locations, `index.ts`, new test, `tests/schema-sync` — all present in the diff.
- ⚠️ Out-of-brief file touched: `packages/ai/src/tools/generationEvidence.ts` (import swap + one contract line, diff lines 344-372). Self-flagged; adjudication below.
- ⚠️ Deviation from Step 3's literal instruction (add to shared `ValidationReportSchema`). Adjudicated as correct below.
- ⚠️ `pnpm schema:diff` blind spot is real and correctly disclosed. Adjudicated below.

## Concern 1: the Step 3 contradiction — resolution judged correct

**Is the decoupling what the contract demanded?** Yes. The brief's Produces block (brief line 11) names exactly two widened fields: `ContextSummaryToolResultSchema.capabilityMatrix (required)` and `ValidateSpecToolResultSchema.capabilities (required)`. It does not require `capabilities` on the shared `ValidationReportSchema` or on any nested `validation` field. Step 3's instruction to edit the shared constant would have silently enlarged four published contracts (validate_spec, `snapshot_spec.validation` at `server.ts:509`, `explain_spec.validation` at `server.ts:519`, the bundle's `validation`) and made Step 6's "Expected: PASS" unreachable — all three nested consumers populate their `validation` field with a bare `validateSpec()` report (`snapshotSpec.ts:68`, `explainSpec.ts:51`, `generationEvidence.ts:628`), which by engine typing has no `capabilities`. Step 3's wording is the defective part; the implementer verified this empirically (RED #2) rather than assuming it, and the captured failure text (`data/validation must have required property 'capabilities'`) matches the exact aliasing structure I confirmed in the file. The chosen resolution is the closest satisfier of the stated Produces contract.

**Is the out-of-brief edit the minimum necessary?** Yes. `generationEvidence.ts` previously embedded `stripNestedIds(ValidateSpecToolResultSchema)` — when that name was an alias of the bare schema, the bundle's published `validation` shape was bare. Once `ValidateSpecToolResultSchema` becomes the widened object, the only way to keep the bundle byte-identical is to point it at the bare base; the change is one imported symbol plus one line (`generationEvidence.ts:39, 60`). Exporting the module-internal `ValidationReportSchema` (`server.ts:154`) for that reuse — without re-exporting it from the `@gis-engine/ai` barrel (confirmed: `packages/ai/src/index.ts` diff adds only `EngineCapabilityMatrixContractSchema`) — is the minimal, non-API-widening route.

**Any place where a required field is now unpopulated at runtime?** No. Exhaustive check of `ValidateSpecToolResultSchema` references repo-wide: it is now consumed only by the `validate_spec` descriptor (`server.ts:779`) whose handler populates `capabilities` (`server.ts:893-900`), the barrel export, and `schema-sync` compile/identity assertions — no other tool embeds it. Every consumer of `ContextSummaryToolResultSchema` (the `get_context_summary` handler `server.ts:931`; `explainSpec.ts:55`; `generationEvidence.ts:629`) constructs via `getContextSummary`, which always assigns `capabilityMatrix`. `snapshot_spec`/`explain_spec` `validation` slots keep the bare schema with bare reports, exactly as before this task.

## Concern 2: schema:diff blind spot — disclosure judged sufficient

Verified: `scripts/schema-diff.mjs:23` sets `SCHEMA_DIR = "packages/engine/src/spec/schemas/"`, so hand-written MCP descriptors are structurally invisible to it. The "No schema file changes" output is truthful, not concealing. Nothing in this diff silently changed a published committed schema file: no generated JSON is committed outside `dist/` (checked repo-wide), and no engine TypeBox source was touched. The report's substitute evidence — an itemized delta of both widened envelopes plus the transitive `GenerationEvidenceBundleSchema.summary` / `export_example_app` widen via the context-summary embed (which I confirmed: `schema-sync.test.ts:300` pins `ExplainSpecToolResultSchema.properties.summary` identity with `ContextSummaryToolResultSchema`), with an explicit refusal to self-certify as non-breaking — is exactly what @quality needs to rule. The tooling gap itself is worth a follow-up note to @orchestrator (schema:diff should scan MCP descriptors), but fixing it is outside this task's brief.

## Strengths

- Genuine TDD trail: RED (missing fields), RED #2 (the brief contradiction proven by captured gate failure, not by argument), GREEN — and the deviation was surfaced loudly in the report rather than quietly absorbed.
- The new test verifies real MCP behavior, not schema restatement: it compiles the actual `descriptor.outputSchema` with Ajv and validates the actual `structuredContent` returned by `callGisEngineTool` (`capability-matrix-exposure.test.ts:12-24`), then pins `content.capabilities` deep-equal to the live `buildEngineCapabilityMatrix()` output (`:46-48`) and pins matrix content/order through `get_context_summary` (`:51-61`). Reuses the established harness style per the brief; no new harness.
- The three-descriptions drift risk the controller flagged is better bounded than feared: the combination of `additionalProperties: false` + `required` + `const` in the descriptor, Ajv validation of the real payload, and `toEqual(engine-function-output)` fails today if the engine adds, removes, renames, or re-typifies any field it emits under the default gate — a real runtime tripwire between the engine type (`capability-matrix.ts:8-18`) and the hand-written descriptor; the TS-typed `ContextSummary.capabilityMatrix: EngineCapabilityMatrix` (`contextSummary.ts:152`) adds a compile-time link on the context-summary path. The TypeBox third description is explicitly deferred to Task 4 by the brief itself.
- Clean composition over duplication: `ValidateSpecToolResultSchema` spreads the base rather than copying it; `summarizeSourceReadiness` was refactored to consume a hoisted derivation instead of the brief's "call it twice" trap.
- Self-review honesty is accurate on every point I could verify (redundant cast, comment overlap, non-barrel export, deferred breaking-call judgement).

## Issues

### Critical (Must Fix)

None.

### Important (Should Fix)

None. The Step 3 deviation, judged against the brief's own Produces contract and the empirically demonstrated impossibility of the literal edit, is the correct implementation of the requirement, not a violation of it.

### Minor (Nice to Have)

1. **Readiness-driven matrix rows never exercised through an MCP envelope.** Both test specs are `sources: {}` (`capability-matrix-exposure.test.ts:5-11`), so the `source.<type>` available rows and `CAPABILITY.UNSUPPORTED` blocked rows (with `escapePathSegment`-ed paths) produced by non-empty readiness (`capability-matrix.ts:64-80`) are not validated against `descriptor.outputSchema` at runtime. Also, the descriptor's optional-`path` branch is never exercised with a path-less blocker because the engine currently always sets `path` — the descriptor being looser than runtime is the safe direction, but a source-bearing spec case would close the loop. Coverage broadening only; Task 1's engine tests cover the derivation itself.
2. **Redundant `input.input.spec as MapSpec` cast** (`server.ts:894`) — mandated verbatim by the brief Step 4; correct (spec is `MapSpec`-typed and `report.valid` guarantees validity), but dead type noise. Plan-mandated, not implementer-introduced.
3. **Two overlapping explanatory comments** at `server.ts:152-153` and `server.ts:241-242`. Each guards a distinct decision and the report acknowledges the redundancy; acceptable.
4. **`server.ts` now exceeds 1100 lines**; the report's suggestion to split hand-written MCP contract schemas into a sibling module is reasonable future work, out of scope here.
5. **Reported-output noise:** two pre-existing Biome `useOptionalChain` warnings in `transformData.ts` noted in the report; not introduced by this diff.
6. Process (not this task's code): consider a follow-up so `schema:diff` scans hand-written MCP descriptors, or so PR tooling annotates descriptor widenings — this task showed the detector cannot see the most contract-relevant changes in an AI-package diff.

## Assessment

**Task quality:** Approved

**Reasoning:** Every Produces-contract element is present and verified in the diff — both descriptors widened, both handlers populate the required fields, the descriptor mirrors the engine's real matrix shape, the 14-tool inventory is untouched, and schema-sync gates register the new schema. The Step 3 deviation is the correct reading of the brief's own contract (the literal edit demonstrably broke three un-named nested consumers), the single out-of-brief line is the minimum needed to keep a published contract stable, and no required field is left unpopulated at any construction site. Remaining items are coverage and polish only; the breaking-vs-non-breaking ruling on the two widened `outputSchema`s is properly routed to @quality with sufficient itemized evidence.
