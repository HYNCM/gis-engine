---
agent: engine-agent
period: 2026-05-29
generated_at: 2026-05-29T08:54:30Z
repo_revision: "5f523d1853ec78fa1e1dca7c3bf206936bf9a3c0"
inputs:
  - docs/planning/sprint-2026-W23-generation-quality-hardening.md
  - docs/planning/feature-specs/spatial-analysis-readiness.md
  - packages/engine/src/generation/commandSkeleton.ts
  - packages/ai/src/tools/generationEvidence.ts
owner: "@engine-agent"
decision_level: advisory
---

# NLQ-003 Spatial Query Evidence

`TASK-2026W23-NLQ-003` now has structured point/bbox query readiness evidence
inside the generation handoff path. The slice keeps spatial analysis
readiness-only: no geoprocessing command, MCP tool, or stable SceneView3D
runtime support was added.

## Evidence

| Finding | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Skeleton carries analysis intent | `MapGenerationCommandSkeletonSchema` includes `analysisEvidence`; `createMapGenerationCommandSkeleton()` records requested operations, accepted point/bbox query operations, blocked operations, and diagnostics. | AI evidence no longer has to infer spatial intent from summary text alone. | Keep `analysisEvidence` in future generation contracts when analysis fields expand. | high |
| Query evidence is executable but bounded | `GenerationEvidenceBundleSchema` includes `spatialQueryEvidence`; `createGenerationEvidenceBundle()` can run deterministic point/bbox cases through mock or MapLibre headless adapters and only exposes counts, layer ids, source ids, and diagnostic counts. | AI handoff output can prove query readiness without exporting feature data or adding a new public query tool. | NLQ-004 export manifest can summarize this evidence without writing files. | high |
| Geoprocessing remains blocked | Unsupported operations still emit `CAPABILITY.UNSUPPORTED` at `/analysis/operations/{index}`; evidence exposes `unsupportedOperations` for aggregation, buffer, intersection, overlay, and routing. | A schema-valid `MapSpec` cannot hide unsupported spatial-analysis intent. | Future buffer/overlay/routing work needs separate schemas, diagnostics, tests, and MCP contract review. | high |
| MCP tool surface stayed frozen | Tests continue to assert only `validate_spec`, `apply_commands`, `export_spec`, `get_context_summary`, `snapshot_spec`, `explain_spec`, and `export_example_app`. | Existing AI clients do not see a surprise `spatial_query` or `generate_map_app` tool. | Keep spatial query evidence inside generation handoff until a public query tool is explicitly designed. | high |

## Gates

- `pnpm --filter @gis-engine/engine build`
- `pnpm --filter @gis-engine/ai build`
- `pnpm test:commands -- tests/commands/map-generation-contract.test.ts`
- `pnpm test:ai -- tests/ai/generation-evidence.test.ts tests/ai/generation-scenarios.test.ts tests/ai/prompt-evidence-scenarios.test.ts`
- `pnpm build:schema`

## Next Handoff

`TASK-2026W23-NLQ-004` should consume `spatialQueryEvidence` in generated-app
export summaries. It must remain side-effect free and avoid adding a new MCP
tool name.
