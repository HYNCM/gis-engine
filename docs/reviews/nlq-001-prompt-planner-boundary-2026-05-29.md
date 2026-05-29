---
agent: code-reviewer
period: 2026-05-29
generated_at: 2026-05-29T08:05:11Z
repo_revision: "08d20633f25a633f15366d110a3e51f52438c0ab"
inputs:
  - docs/planning/sprint-2026-W23-generation-quality-hardening.md
  - packages/engine/src/generation/promptPlanner.ts
  - packages/engine/src/spec/schemas/generation.schema.ts
  - tests/commands/map-generation-contract.test.ts
  - tests/schema-sync/schema-sync.test.ts
owner: "@engine-agent"
decision_level: advisory
---

# NLQ-001 Prompt Planner Boundary Evidence

`TASK-2026W23-NLQ-001` now has a typed prompt planner boundary. The contract is
intentionally narrow: it accepts `promptHash`, trace metadata, and structured
intent; it returns a `MapGenerationRequest`-compatible request, diagnostics,
and provenance. It does not parse raw free-form text, does not retain raw
prompt text by default, and does not add a new MCP tool name.

## Findings

### [P0] Planner Output Remains Schema-First

- Evidence: `MapGenerationPromptPlannerInputSchema` and
  `MapGenerationPromptPlanSchema` were added beside the existing generation
  request and command skeleton schemas.
- Impact: AI safety and product; future planner work can be tested as structured
  data before command generation.
- Action: `@ai-agent` can build NLQ-002 provenance/quality evidence on top of
  `planMapGenerationRequest()` without changing public MCP names.
- Confidence: high.

### [P0] Raw Prompt Retention Is Explicitly Blocked

- Evidence: `planMapGenerationRequest()` rejects `prompt`, `rawPrompt`, and
  `promptText` input fields with `SPEC.UNKNOWN_FIELD` diagnostics and preserves
  `retainedRawPrompt: false` in provenance.
- Impact: privacy and AI safety; planner evidence can carry prompt hashes and
  traces without storing user prompt text as the default contract.
- Action: any future raw-prompt retention must be a separate product/privacy
  decision and schema version.
- Confidence: high.

### [P1] Planner Result Feeds Existing Command Skeleton

- Evidence: command tests run planner output through
  `createMapGenerationCommandSkeleton()` and assert command source prompt hashes
  plus valid `MapSpec` output.
- Impact: architecture; runtime mutation remains command-only through
  `MapCommand` and `applyCommands`.
- Action: keep future planner changes coupled to command and schema-sync tests.
- Confidence: high.

## Validation

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm build:schema` | pass | public planner schemas compile and generated schema files are emitted |
| `pnpm test:commands -- tests/commands/map-generation-contract.test.ts` | pass | command suite passed with planner boundary scenarios |
| `pnpm test:schema-sync` | pass | public schema ids include planner input/result schemas |
| `pnpm --filter @gis-engine/engine build` | pass | engine TypeScript build passed |

## Next Handoff

`TASK-2026W23-NLQ-002` can now add planner quality/provenance evidence to the AI
generation bundle. It should preserve the same constraints: no MCP alias, no raw
prompt retention by default, and no stable SceneView3D runtime promotion.
