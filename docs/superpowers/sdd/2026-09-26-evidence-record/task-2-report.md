# Task 2 report: 能力矩阵进 `get_context_summary` + `validate_spec`

```yaml
agent: builder
period: ad-hoc
generated_at: 2026-09-26T17:31:00Z
repo_revision: "57f6c24"
inputs:
  - .superpowers/sdd/2026-09-26-evidence-record/task-2-brief.md
  - packages/engine/src/evidence/capability-matrix.ts
owner: "@builder"
decision_level: info
```

## What I implemented

- `packages/ai/src/mcp/server.ts`
  - Added the hand-written `EngineCapabilityBlockerContractSchema` (private) and exported
    `EngineCapabilityMatrixContractSchema` exactly as the brief's Step 3 specifies
    (draft-07 object, `schemaVersion` const `engine-capabilities.v0.1`, `additionalProperties: false`).
  - `ValidateSpecToolResultSchema` now widens the validation report with a required top-level
    `capabilities` field.
  - `ContextSummaryToolResultSchema` gained `capabilityMatrix: EngineCapabilityMatrixContractSchema`
    in `properties` and `"capabilityMatrix"` appended to `required` (Step 3).
  - `validate_spec` handler (Step 4) composes `{ ...report, capabilities: buildEngineCapabilityMatrix({ readiness }) }`,
    gated on `report.valid` before calling `createSourceReadinessReport`, verbatim from the brief.
  - Engine import block extended with `buildEngineCapabilityMatrix` + `createSourceReadinessReport`.
- `packages/ai/src/tools/contextSummary.ts` (Step 5)
  - `ContextSummary` interface gained `capabilityMatrix: EngineCapabilityMatrix` after `capabilitySummary`.
  - Hoisted the single existing `createSourceReadinessReport(spec).sources` derivation into
    `sourceReadinessEntries` and passed it into `summarizeSourceReadiness(spec, sources)` (signature change)
    plus `buildEngineCapabilityMatrix({ readiness: sourceReadinessEntries })`. No second readiness call.
  - Per the Task 1 review ruling: no re-sorting of `blocked` anywhere in Task 2; the matrix is passed through as derived.
- `packages/ai/src/index.ts`: exported `EngineCapabilityMatrixContractSchema`.
- `tests/schema-sync/schema-sync.test.ts`: added `EngineCapabilityMatrixContractSchema` to the import list
  and the Ajv compile inventory (Step 6).
- `tests/ai/capability-matrix-exposure.test.ts`: created verbatim from the brief's Step 1, reusing the
  existing `callGisEngineTool` + Ajv-compiles-`descriptor.outputSchema` harness style. No new harness.

## Deviation from the brief (contradiction found and resolved — deliberate, not silent)

**The brief's Step 3 literal edit cannot produce Step 6's "Expected: PASS".** Step 3 says to add
`capabilities` to the shared `ValidationReportSchema` properties and change its `required` to
`["valid", "diagnostics", "stats", "capabilities"]`. But that constant is not private to `validate_spec`:

- `packages/ai/src/mcp/server.ts` `ValidateSpecToolResultSchema` was an alias of it (old line 214);
- `SnapshotSpecToolResultSchema.validation` embeds it;
- `ExplainSpecToolResultSchema.validation` embeds it;
- `packages/ai/src/tools/generationEvidence.ts:68` embeds `stripNestedIds(ValidateSpecToolResultSchema)`
  as the generation evidence bundle's `validation` contract.

All three nested consumers populate that field with a bare `validateSpec()` report (`ValidationReport` =
`{valid, diagnostics, stats}`), which has no `capabilities`. I applied the literal edit first and captured
the failure (see RED evidence below): the existing hard-gate test
`tests/ai/mcp-contract-convergence.test.ts` failed with
`data/validation must have required property 'capabilities'` for `snapshot_spec`, plus
`tests/ai/generation-evidence.test.ts > keeps generation evidence schemas strict and Ajv-compilable`.

**Resolution chosen** (closest to the brief's stated Produces contract — only
`ContextSummaryToolResultSchema.capabilityMatrix` and `ValidateSpecToolResultSchema.capabilities` become
required; names/count of tools unchanged; snapshot/explain/generation-bundle envelopes untouched):

1. `ValidationReportSchema` keeps its bare shape and is now exported (module-internal, not barrel-exported).
2. `ValidateSpecToolResultSchema` becomes its own extended object (spread of the base + `capabilities`,
   `required` includes `"capabilities"`), so the brief's Produces line `ValidateSpecToolResultSchema.capabilities (required)` holds.
3. `generationEvidence.ts` (a file **not in the brief's file list** — flagged change) switched its embedded
   contract from `stripNestedIds(ValidateSpecToolResultSchema)` to `stripNestedIds(ValidationReportSchema)`,
   keeping the published generation-evidence bundle's `validation` shape byte-identical to before this task.

Alternative considered and rejected: making the bundle's `validation` carry `capabilities` too would change a
third published contract beyond the brief's scope and require widening the `ValidationReport`-typed TS interface.

The `summary` field of the generation evidence bundle does change (it embeds `ContextSummaryToolResultSchema`,
which now requires `capabilityMatrix`) — this is an unavoidable, intended consequence of Step 3/5; the bundle
builder populates it via `getContextSummary`, so payloads conform and all tests pass.

## TDD evidence

### RED (Step 2)

Command: `pnpm vitest run tests/ai/capability-matrix-exposure.test.ts` (after `pnpm build`)

```
FAIL  tests/ai/capability-matrix-exposure.test.ts > capability matrix exposure > validate_spec reports exactly the matrix the engine derives
AssertionError: expected undefined to deeply equal { schemaVersion: 'engine-capabilities.v0.1', … }
+ Received: undefined
 ❯ tests/ai/capability-matrix-exposure.test.ts:49:34

 FAIL  tests/ai/capability-matrix-exposure.test.ts > capability matrix exposure > get_context_summary reports the matrix alongside capabilitySummary
TypeError: Cannot read properties of undefined (reading 'available')
 ❯ tests/ai/capability-matrix-exposure.test.ts:56:19

 Test Files  1 failed (1)
      Tests  2 failed | 1 passed (3)
```

Expected failure: the envelopes had no `capabilities` / `capabilityMatrix` fields yet; the 14-tool inventory
pin passed already (as it must — this task adds no tools).

### RED #2 (brief-contradiction evidence, literal Step 3 applied)

Commands: `pnpm --filter @gis-engine/ai build && pnpm vitest run tests/ai`

```
FAIL  tests/ai/mcp-contract-convergence.test.ts > ... > serves valid results and rejects unknown tools over a real MCP transport
McpError: MCP error -32602: Structured content does not match the tool's output schema:
  data/validation must have required property 'capabilities', ...
FAIL  tests/ai/mcp-contract-convergence.test.ts > ... > returns schema-conforming structured content and JSON text for every public tool
AssertionError: snapshot_spec structuredContent should match outputSchema: expected false to be true
FAIL  tests/ai/generation-evidence.test.ts > generation evidence bundle > keeps generation evidence schemas strict and Ajv-compilable
```

This is the empirical proof that the literal Step 3 edit breaks existing hard-gate contracts for tools the
brief's Produces section does not list — hence the decoupling resolution above.

### GREEN

- `pnpm vitest run tests/ai tests/schema-sync` → `Test Files 16 passed (16) / Tests 321 passed (321)`
- `pnpm build:schema` → exit 0
- `pnpm test:evidence` → `Tests 8 passed (8)`
- `pnpm check` (full gate: build + all suites + studio) → exit 0
- Post-commit focused re-run: `pnpm vitest run tests/ai/capability-matrix-exposure.test.ts` → `3 passed`

## pnpm schema:diff output (verbatim)

Run before commit:

```
$ node scripts/schema-diff.mjs
## Schema Change Report

> Base: `main` → Head: `HEAD`
> Generated: 2026-09-26T17:28:29.456Z

_No schema file changes detected._
```

Run again after commit (`57f6c24`), identical:

```
$ node scripts/schema-diff.mjs
## Schema Change Report

> Base: `main` → Head: `HEAD`
> Generated: 2026-09-26T17:30:28.466Z

_No schema file changes detected._
```

**Important for @quality:** `schema-diff.mjs` only scans `packages/engine/src/spec/schemas/` (TypeBox
contracts). The published change in this task lives in the hand-written MCP descriptors in
`packages/ai/src/mcp/server.ts` and is therefore **not visible to schema:diff**. The actual outputSchema
delta @quality must judge:

- `validate_spec` success envelope: + required top-level `capabilities` (object, additionalProperties false).
- `get_context_summary` success envelope: + required `capabilityMatrix` (same shape).
- `GenerationEvidenceBundleSchema.summary` / `export_example_app` transitive widen via the context summary embed.
- Input schemas, tool names, tool count, and every other tool's envelope unchanged.

I do not self-certify this as non-breaking.

## Files changed

- `packages/ai/src/mcp/server.ts`
- `packages/ai/src/tools/contextSummary.ts`
- `packages/ai/src/tools/generationEvidence.ts` (out-of-brief, see deviation section)
- `packages/ai/src/index.ts`
- `tests/schema-sync/schema-sync.test.ts`
- `tests/ai/capability-matrix-exposure.test.ts` (new)

Commits on `codex/evidence-record-a`:
- `2d47430` feat(ai): surface engine capability matrix through validate_spec and get_context_summary
- `57f6c24` style(ai): collapse server import list per Biome formatting (the pre-commit hook reformatted
  an import after the commit blob was computed; committed as a follow-up, no amend)

Regenerated schema JSON from `pnpm build:schema` lands in `packages/*/dist/schema/` only (gitignored), so
there are no committed schema artifacts to include in the commit.

## Self-review findings

- Verified `blocked` is not re-sorted anywhere in Task 2 (Task 1 ruling; matrix passed through verbatim into
  both envelopes) — Task 4 canonical hashing stays safe.
- Verified the handler gates `createSourceReadinessReport` on `report.valid`, so an invalid spec never enters
  the readiness/escapePathSegment path (brief Step 4 constraint honored).
- Verified single `createSourceReadinessReport` call in `getContextSummary` (hoisted variable consumed twice).
- The `input.input.spec as MapSpec` cast is redundant (`ValidateSpecToolInput.spec` is already `MapSpec`) but
  kept verbatim from the brief; neither tsc nor Biome flags it.
- Two slightly overlapping explanatory comments around `ValidationReportSchema` / `ValidateSpecToolResultSchema`
  in server.ts; kept because each guards a different decision (why the base stays bare / why validate_spec widens).
- `ValidationReportSchema` is now module-exported from server.ts but not re-exported from the `@gis-engine/ai`
  barrel, so it does not join the public API surface.
- Pre-existing unrelated Biome warnings in `packages/ai/src/tools/transformData.ts` (useOptionalChain ×2) —
  untouched, not introduced here.

## Issues or concerns

1. **Brief contradiction (resolved, documented above):** Step 3's literal shared-schema edit is incompatible
   with Step 6's expected PASS because `ValidationReportSchema` is reused by `snapshot_spec`, `explain_spec`,
   and the generation evidence bundle. If the plan author actually intended those three nested `validation`
   fields to also require `capabilities`, this implementation must be revisited — that reading would enlarge
   three more published contracts and is not what the brief's Produces section states.
2. **File outside the brief touched:** `packages/ai/src/tools/generationEvidence.ts` (one import + one contract
   line) — minimal edit to keep the generation-evidence bundle's published `validation` shape unchanged.
3. **`pnpm check` is green** so the documentation-budget gate passed without edits; no concerns there.
4. Size note: `packages/ai/src/mcp/server.ts` grows past 1100 lines; I followed its existing descriptor
   patterns, but a future split of hand-written MCP contract schemas into a sibling module may be worth
   scheduling — not done here (out of brief scope).
5. Breaking-vs-non-breaking classification of the two widened `outputSchema` envelopes is deferred to
   @quality per the plan constraint.
