---
agent: ai-agent
period: 2026-W23
generated_at: 2026-05-29T06:47:19Z
repo_revision: "36099f4966f7028b092f3d2f3a1327825b32686f"
inputs:
  - docs/planning/sprint-2026-W23-ai-map-app-generation.md
  - docs/reviews/nla-002-generation-command-contract-2026-05-29.md
  - packages/ai/src/mcp/server.ts
  - packages/ai/src/tools/contextSummary.ts
owner: "@ai-agent"
decision_level: advisory
---

# NLA-003 MCP Orchestration Evidence

## Summary

`TASK-2026W23-NLA-003` now has an AI-side generation evidence bundle contract.
It composes the existing MCP-facing tools into one testable handoff shape
without registering a new tool, alias, or natural-language runtime.

The public MCP tool list remains:
`validate_spec`, `apply_commands`, `export_spec`, `get_context_summary`,
`snapshot_spec`, `explain_spec`, and `export_example_app`.

## Contract Delta

- Evidence: `createGenerationEvidenceBundle()` accepts a prompt hash and the
  `NLA-002` command skeleton, then summarizes context, validation, command
  replay, snapshot, export, and example evidence.
- Impact: AI-generated app handoff can be audited as a structured bundle
  instead of a prose claim.
- Action: use this bundle as the `NLA-004` / `NLA-006` test target for
  prompt-to-evidence scenarios.
- Confidence: high.

- Evidence: `GenerationEvidenceBundleInputSchema` and
  `GenerationEvidenceBundleSchema` are Ajv-compiled and exported from
  `@gis-engine/ai`; the AI schema build writes
  `generation-evidence-bundle.v0.1.schema.json`.
- Impact: output changes remain schema-first even though no MCP tool descriptor
  changed.
- Action: keep future generation handoffs under this schema or version it
  deliberately.
- Confidence: high.

- Evidence: tests assert the bundle uses only documented snake_case tool names
  and explicitly excludes `generate_map_app`.
- Impact: MCP compatibility stays stable for existing clients and agents.
- Action: do not add aliases unless a future coordinator decision changes the
  public MCP contract.
- Confidence: high.

## Boundaries Preserved

- No new MCP tool descriptor was added.
- Natural-language text is represented by `promptHash`; generated state still
  comes from `MapCommand[]` replay.
- The bundle blocks evidence when `skeleton.spec` does not match replaying
  `skeleton.commands` through `apply_commands`.
- Stable `view.mode: "scene3d"` remains governed by the engine diagnostics and
  SceneView3D No-go decision.

## Gate Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm test:ai` | pass | generation evidence tests plus existing MCP tests |
| `pnpm --filter @gis-engine/ai build` | pass | TypeScript AI package build |
| `pnpm test:schema-sync` | pass | generation evidence schemas compile; MCP tools unchanged |
| `pnpm build:schema` | pass | AI schema bundle includes generation evidence schema |

## Next Handoff

`TASK-2026W23-NLA-004` should use the `NLA-002` skeleton and `NLA-003`
evidence bundle to define minimum feature-display and spatial-analysis
generated scenarios, including dry-run/replay/rollback and blocked analysis
diagnostics.
