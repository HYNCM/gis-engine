---
agent: engine-agent
period: 2026-W23
generated_at: 2026-05-29T06:35:38Z
repo_revision: "4b1f3b1152937fa9e54f84b24acfd53b37c39f4d"
inputs:
  - docs/planning/sprint-2026-W23-ai-map-app-generation.md
  - docs/planning/feature-specs/natural-language-map-app-generation.md
  - packages/engine/src/spec/schemas/map-spec.schema.ts
  - packages/engine/src/spec/schemas/command.schema.ts
  - packages/engine/src/commands/applyCommands.ts
owner: "@engine-agent"
decision_level: advisory
---

# NLA-002 Generation Command Contract

## Summary

`TASK-2026W23-NLA-002` now has an engine-level command skeleton contract for
natural-language app generation. The contract accepts structured generation
intent, validates it with TypeBox/Ajv, emits auditable `MapCommand` sequences,
and derives the generated `MapSpec` only through `applyCommands`.

This is not a natural-language parser and does not add an MCP tool alias. It
defines the safe handoff shape that an AI planner can target before the
`NLA-003` MCP orchestration slice.

## Contract Delta

- Evidence: `MapGenerationRequestSchema` and
  `MapGenerationCommandSkeletonSchema` were added under engine schemas.
- Impact: public generation inputs and outputs are schema-first and Ajv
  compilable.
- Action: use `createMapGenerationCommandSkeleton()` as the engine-side
  conversion step from classified generation intent to `MapCommand[]`.
- Confidence: high.

- Evidence: `setCapabilities` and `setInteractions` were added to
  `MapCommandSchema`, `MapCommand`, `buildPatch()`, and command matrix replay
  tests.
- Impact: generation no longer needs to mutate `capabilities` or
  `interactions` by directly editing a `MapSpec`.
- Action: AI-generated app drafts should express those edits as commands before
  export or snapshot evidence is accepted.
- Confidence: high.

- Evidence: generation tests cover feature-display command skeletons,
  spatial-analysis readiness warnings, extension-only SceneView3D skeletons,
  stable `view.mode: "scene3d"` blockers, and result schema validation.
- Impact: failures remain structured diagnostics instead of prompt text.
- Action: `NLA-003` can now compose existing MCP tools around this engine
  contract without adding tool aliases.
- Confidence: high.

## Boundaries Preserved

- Stable `view.mode: "scene3d"` generation remains blocked with
  `SCENE3D.STABLE_RUNTIME_*` blocker codes.
- Scene browsing generation can only attach camera/source/layer evidence under
  `extensions.scene3d`; renderer promotion evidence remains out of this engine
  contract.
- Spatial analysis is readiness-only and returns a warning diagnostic for
  buffer, overlay, routing, aggregation, and other geoprocessing claims.
- Runtime state changes still go through `MapCommand` and `applyCommands`.

## Gate Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm test:commands` | pass | 4 command files, 38 tests |
| `pnpm test:schema-sync` | pass | public schemas compile; new generation schema ids locked |
| `pnpm --filter @gis-engine/engine build` | pass | TypeScript engine build |
| `pnpm build:schema` | pass | engine, scene3d, and AI schema builds |

## Next Handoff

`TASK-2026W23-NLA-003` should keep the seven documented MCP tools unchanged and
wrap this contract into a generation evidence bundle through existing
`get_context_summary`, `validate_spec`, `apply_commands`, `snapshot_spec`,
`export_spec`, and `export_example_app` calls.
