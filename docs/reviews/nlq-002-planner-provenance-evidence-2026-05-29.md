---
agent: code-reviewer
period: 2026-05-29
generated_at: 2026-05-29T08:20:23Z
repo_revision: "b0ccfd9342d8d737fdde676399dc5059f8c13293"
inputs:
  - docs/planning/sprint-2026-W23-generation-quality-hardening.md
  - docs/reviews/nlq-001-prompt-planner-boundary-2026-05-29.md
  - packages/ai/src/tools/generationEvidence.ts
  - tests/ai/generation-evidence.test.ts
  - tests/ai/prompt-evidence-scenarios.test.ts
owner: "@ai-agent"
decision_level: advisory
---

# NLQ-002 Planner Provenance Evidence

`TASK-2026W23-NLQ-002` connects the typed prompt planner boundary to the AI
generation evidence bundle. The bundle now exposes planner provenance and
quality evidence while keeping the public MCP tool names unchanged.

## Findings

### [P0] Planner Evidence Is A First-Class Bundle Field

- Evidence: `GenerationEvidenceBundleSchema` now includes `plannerEvidence`
  with planner id, prompt hash, trace id, command trace id, raw prompt retention
  state, confidence, accepted/unsupported intent fields, source prompt hashes,
  and diagnostic counts.
- Impact: AI operability; generated app handoff can explain how the planner
  produced the command skeleton before snapshot/export evidence is trusted.
- Action: future prompt planner improvements should extend this evidence field
  or version the schema rather than adding an MCP alias.
- Confidence: high.

### [P0] Unsupported Planner Intent Blocks Readiness

- Evidence: planner diagnostics are included in the public bundle diagnostics,
  and planner errors make the bundle return `status: "blocked"`.
- Impact: AI safety; unsupported prompt intent such as raw prompt retention
  cannot be hidden behind a schema-valid `MapSpec`.
- Action: NLQ-003 spatial query evidence should follow the same pattern for
  blocked geoprocessing operations.
- Confidence: high.

### [P1] Command Trace Provenance Stays Connected

- Evidence: planner evidence records `commandTraceId` and command
  `sourcePromptHash` values; mismatched prompt hashes or trace ids produce
  structured diagnostics.
- Impact: auditability; generated map mutations stay traceable from prompt hash
  to command replay.
- Action: keep `collectTrace` and source prompt hash checks in future planner
  quality tests.
- Confidence: high.

## Validation

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm build:schema` | pass | AI generation evidence schema includes `plannerEvidence` |
| `pnpm test:schema-sync` | pass | public AI schemas compile with planner evidence |
| `pnpm --filter @gis-engine/engine build && pnpm --filter @gis-engine/ai build` | pass | engine and AI TypeScript builds passed |
| `pnpm test:commands -- tests/commands/map-generation-contract.test.ts` | pass | planner boundary command tests still pass |
| `pnpm test:ai -- tests/ai/generation-evidence.test.ts tests/ai/prompt-evidence-scenarios.test.ts` | pass | AI suite passed with planner evidence scenarios and prompt QA matrix |
| `pnpm check` | pass | full deterministic workspace gate passed |

## Next Handoff

`TASK-2026W23-NLQ-003` can now design spatial query evidence using the same
pattern: structured evidence, stable diagnostics, no MCP alias, and no
geoprocessing claim before public command contracts exist.
