---
agent: qa-agent
period: 2026-05-30
generated_at: 2026-05-30T08:01:47Z
repo_revision: "e760ccc"
inputs:
  - packages/ai/src/tools/generationEvidence.ts
  - tests/ai/generation-evidence.test.ts
  - packages/ai/README.md
  - docs/planning/sprint-2026-W23-spatial-query-hardening.md
owner: "@qa-agent"
decision_level: advisory
---

# SQH-004 Result Caps And Fixtures

## Summary

`TASK-2026W23-SQH-004` adds capped result metadata and deterministic fixture
evidence to point/bbox spatial query cases. Each case now records
`resultLimit`, `resultTruncated`, and `fixtureHash` alongside `featureCount`,
`layerIds`, `sourceIds`, and diagnostic counts.

## Findings

| Finding | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Result cap metadata is explicit | `GenerationSpatialQueryCaseEvidence` and `SpatialQueryCaseEvidenceSchema` include `resultLimit` and `resultTruncated`. | Review surfaces can see when a deterministic case matched more features than the evidence cap without receiving payloads. | Keep the cap internal unless a future public query API is designed. | high |
| Fixture identity is deterministic | `fixtureHash` is derived from case id, operation, query geometry, requested layers, selected layer/source ids, and the result cap. | Repeated runs can compare fixture identity without storing feature payloads. | Preserve payload-free hashing when SQH-005 maps delivery state. | high |
| Feature payloads remain absent | `tests/ai/generation-evidence.test.ts` asserts case evidence has no `features` property and generated-app summary does not contain `FeatureCollection`. | Generated app manifests stay bounded and reviewable. | Do not add sample feature payloads without a separate output schema. | high |
| MCP and source boundaries stay frozen | The change stays inside generation evidence; it does not add `spatial_query`, PMTiles/vector parsing, URL fetching, or geoprocessing. | Existing AI clients keep the documented tool surface and blocked source behavior. | Move next to SQH-005 delivery mapping. | high |

## Verification

- `pnpm exec vitest run tests/ai/generation-evidence.test.ts` - passed
- `pnpm --filter @gis-engine/ai build` - passed
- `pnpm test:schema-sync` - passed
- `pnpm build:schema` - passed
- `pnpm test:ai` - passed
- `pnpm test:commands` - passed
- `pnpm check` - passed
- `git diff --check` - passed
