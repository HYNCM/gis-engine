---
agent: ai-agent
period: 2026-05-31
generated_at: 2026-05-30T19:04:43Z
repo_revision: "24edb76"
inputs:
  - packages/ai/src/tools/generationEvidence.ts
  - packages/ai/src/tools/exportExampleApp.ts
  - tests/ai/generation-evidence.test.ts
  - tests/ai/prompt-evidence-scenarios.test.ts
  - packages/ai/README.md
owner: "@ai-agent"
decision_level: advisory
---

# SQH-005 Delivery Mapping

## Summary

`TASK-2026W23-SQH-005` maps hardened point/bbox query evidence into
`generationEvidence.delivery.spatialQueryReadiness` and the
`data-and-analysis` delivery section. The mapping stays inside the AI delivery
handoff and does not add a public `spatial_query` MCP tool, source parsing,
geoprocessing execution, or SceneView3D promotion.

## Findings

| Finding | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Query delivery state is schema-testable | `ExampleAppDeliverySummarySchema.spatialQueryReadiness` records requested/status/state, capability gate status, case counts, result limits, blocked operations, layer/source ids, and follow-up task ids. | Review UIs and agents can distinguish ready, follow-up-required, and blocked query states without parsing prose diagnostics. | Keep future query delivery fields in this structured summary. | high |
| Waivers produce explicit follow-up state | Capability waivers add a `spatial-query.capability-waiver.*` follow-up and make `data-and-analysis` `follow-up-required`. | Adapter query support waivers remain auditable instead of looking like fully complete support. | Close waiver follow-ups through a future quality gate before stronger claims. | high |
| Feature payloads remain out of delivery | Delivery query cases include counts, result caps, fixture hashes, and ids, but not feature arrays. | Generated-app manifests stay bounded and reviewable. | Do not add raw features without a separate output schema. | high |
| Public MCP surface stays frozen | The regression asserts `toolSequence` still does not include `spatial_query`. | Existing AI clients keep the documented tool names. | Continue SQH-006 as quality gate and closure only. | high |

## Verification

- `pnpm exec vitest run tests/ai/generation-evidence.test.ts` - passed
- `pnpm exec vitest run tests/ai/prompt-evidence-scenarios.test.ts` - passed
- `pnpm exec vitest run tests/ai/mcp-integration.test.ts` - passed
- `pnpm --filter @gis-engine/ai build` - passed
- `pnpm test:ai` - passed
- `pnpm build:schema` - passed
- `pnpm test:schema-sync` - passed
- `pnpm test:docs` - passed
- `pnpm check` - passed
