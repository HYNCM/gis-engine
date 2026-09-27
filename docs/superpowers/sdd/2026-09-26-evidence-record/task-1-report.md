# Task 1 Report: engine 能力矩阵真相源 + 门禁接线

```yaml
agent: builder
period: ad-hoc
generated_at: 2026-09-26T17:05:00Z
repo_revision: "19d8b37"
inputs:
  - .superpowers/sdd/2026-09-26-evidence-record/task-1-brief.md
  - packages/engine/src/spec/scene3d-promotion-gate.ts
  - packages/engine/src/diagnostics/codes.ts
  - packages/engine/src/sources/readiness.ts
owner: "@builder"
decision_level: info
```

## What was implemented

Created the single source of truth for engine capability boundaries, derived only from
existing truth sources (no third list invented):

- `packages/engine/src/evidence/capability-matrix.ts` — `buildEngineCapabilityMatrix`
  derives:
  - scene3d blockers from `SCENE3D_BLOCKERS` keyed to
    `Scene3DStableRuntimeBlockerCodes.{ViewMode,Renderer,Dimensions}`, emitted only when
    `gate === "blocked"` (default from `DEFAULT_SCENE3D_PROMOTION_GATE`), empty at
    `"stable"`, and a non-blocking `scene3d.experimental-gate` available entry at
    `"experimental"`.
  - source capability lines from caller-supplied `SourceReadinessEntry[]`:
    `supported` → `source.<type>` in `available`; `blocked` →
    `CAPABILITY.UNSUPPORTED` blocker with path `/sources/<sourceId>`;
    `readiness-only` appears in neither (no over-claim).
  - fixed base `available`: `mapspec.validate, commands.apply, export.spec,
    snapshot.smoke-mock` plus `evidence.build`. Kept the deliberate `snapshot.smoke-mock`
    wording per the brief (smoke-level mock evidence only, not a `snapshot.ready` claim).
- `packages/engine/src/evidence/index.ts` — barrel exporting
  `buildEngineCapabilityMatrix`, `ENGINE_CAPABILITY_MATRIX_SCHEMA_VERSION`,
  `EngineCapabilityMatrix`, `EngineCapabilityBlocker`, `BuildEngineCapabilityMatrixInput`.
- Public surface: re-exported from `packages/engine/src/index.ts`.
- Gate wiring:
  - `package.json`: new `"test:evidence": "vitest run tests/evidence"` after `test:cli`,
    and inserted after `pnpm test:cli &&` in the `"test"` chain.
  - `scripts/gate-plan.mjs`: evidence path-aware gate inserted before the `packages/ai/`
    block — changes under `packages/engine/src/evidence/**` or `tests/evidence/**` now
    require `pnpm test:evidence` ("delivery evidence contract").
  - `tests/framework/agent-framework.test.ts`: new guard test
    "requires the evidence suite for evidence contract changes" asserting the mapping for
    `packages/engine/src/evidence/record.ts`.

## TDD evidence

**RED** — `pnpm vitest run tests/evidence/capability-matrix.test.ts` (before implementation):

```
FAIL  tests/evidence/capability-matrix.test.ts > buildEngineCapabilityMatrix > ...
TypeError: buildEngineCapabilityMatrix is not a function
Test Files  1 failed (1)
     Tests  5 failed (5)
```

Expected: the brief's Step 1 test imports `buildEngineCapabilityMatrix` from
`@gis-engine/engine`; the evidence module did not exist yet, so the import resolves to
`undefined` and every test fails with "is not a function".

**GREEN** — same command after implementation + exports:

```
✓ tests/evidence/capability-matrix.test.ts (5 tests) 2ms
Test Files  1 passed (1)
     Tests  5 passed (5)
```

## Test / gate results

- `pnpm build:schema` — pass (no new schema files; regeneration produced no git diff).
- `pnpm test:evidence` — 5 passed.
- `pnpm test:agent-framework` — 74 passed / 9 files (includes the new gate-mapping guard).
- `pnpm test:types` — pass.
- `pnpm check` (full: build → complete test chain incl. new `test:evidence` → `test:studio`)
  — EXIT=0 after formatting fixes; log tail confirms all suites green, documentation
  minimalism gate included and passing.

## Files changed (commit `19d8b37` on `codex/evidence-record-a`)

- `packages/engine/src/evidence/capability-matrix.ts` (new)
- `packages/engine/src/evidence/index.ts` (new)
- `tests/evidence/capability-matrix.test.ts` (new)
- `packages/engine/src/index.ts` (evidence export block)
- `package.json` (`test:evidence` + `test` chain)
- `scripts/gate-plan.mjs` (evidence gate mapping)
- `tests/framework/agent-framework.test.ts` (gate-mapping guard test)

## Self-review findings / deviations from the brief

1. **Brief internal conflict — `available` ordering (resolved in favor of the test).**
   The brief's Step 3 code returns `[...available].sort()` (alphabetical →
   `commands.apply` first), but its Step 1 verbatim test asserts
   `["mapspec.validate", "commands.apply", "export.spec", "snapshot.smoke-mock",
   "evidence.build"]` (insertion order), and Step 5 requires 5 passed. The two cannot
   both hold. I implemented the test's contract: `available: [...available]` without
   `.sort()`. Order is still fully deterministic (Set insertion order from fixed
   `BASE_AVAILABLE` + input-iteration order). Flagging for the controller: if Task 2/4
   consumers need lexicographic stability independent of readiness input order, either
   the test or a follow-up sort decision should be revisited — I did not reorder
   `blocked[]` and did not touch the verbatim test.
2. **Biome placement of the index.ts export block.** I inserted it literally before
   `export { MockAdapter }` as instructed; the pre-commit/`biome check --write`
   organize-imports assist relocated it to the repo's sorted-export position (after
   `./diagnostics/codes.js`). It remains before `MockAdapter` in file order and matches
   the alphabetical convention of the file.
3. **Minor formatting normalizations by Biome** (semantics unchanged): the gate-plan
   insertion collapsed to one line; the test's long `readiness: [...]` array literal was
   joined to fit the line width.
4. **`path: /sources/${entry.sourceId}` is not escaped** with `escapePathSegment`
   (which `readiness.ts` uses). This is verbatim from the brief; a source id containing
   `~` or `/` would produce an ambiguous JSON-Pointer-ish path. Noted as a potential
   follow-up for Task 4/5, not changed unilaterally.
5. `GIS_ENGINE_TOOL_NAMES` untouched (no MCP tool changes); no renderer/visual surface
   touched, so no snapshot baseline implications. Working tree clean after commit.

## Issues or concerns

- Only item 1 above is substantive: it defines the public `available` ordering contract
  that Task 2 (MCP outputSchema) and Task 4 (EvidenceRecord.capabilities) will consume.
  It is deterministic and test-pinned as written; if a later task assumes sorted output
  (e.g., a verifier comparing sorted arrays), align there.
- No blockers. `pnpm check` fully green including `test:agent-framework` per constraint 10.

---

## Fix round 1 (applied by the controller, not the implementer)

This harness exposes no subagent resume/messaging tool, so the controller applied the two
Important findings directly on top of `19d8b37`. Commits: `3c4d13c` (sorted `available`, plan
amended), `04b5bbe` (canonical blocked ordering + escaped paths + new test cases).

Changes:
- `available: [...available].sort()` with the recordId rationale comment; the ordering test renamed
  to "lists only capabilities with a truth source behind them, in canonical order".
- `blocked[]`: readiness rows are sorted by `sourceId`, then `type`, before the loop, so scene3d
  literal order is preserved and source blockers no longer track spec key order.
- Blocker `path` now uses `escapePathSegment(entry.sourceId)`, matching `readiness.ts` /
  `spec/cloud-native/validate.ts`.
- Tests: `as never` casts replaced with a typed `readinessEntry()` helper; added the
  readiness-only-in-neither-set case, the blocked-ordering case, and the escaping case.
- The plan file's Task 1 code blocks were updated in the same commits so a re-run regenerates the
  corrected brief.

Covering tests:

```
$ pnpm test:evidence
 ✓ tests/evidence/capability-matrix.test.ts (8 tests) 2ms
 Test Files  1 passed (1)
      Tests  8 passed (8)

$ pnpm check        # full gate chain, exit 0
...
 ✓ tests/framework/agent-framework.test.ts (32 tests) 545ms
 ✓ tests/framework/smoke-report-contract.test.ts (5 tests) 53ms
```

`pnpm check` exit code 0 across build + all test layers + studio.
