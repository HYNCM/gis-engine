---
agent: ai-agent
period: 2026-05-30
generated_at: 2026-05-30T07:34:50Z
repo_revision: "f32b131"
inputs:
  - packages/ai/src/tools/generationEvidence.ts
  - tests/ai/generation-evidence.test.ts
  - packages/ai/README.md
  - docs/planning/sprint-2026-W23-spatial-query-hardening.md
owner: "@ai-agent"
decision_level: advisory
---

# SQH-002 Query Capability Gate

## Summary

`TASK-2026W23-SQH-002` adds an explicit capability gate to prompt-level spatial
query evidence. Point/bbox query cases now record `capabilityGate.status` as
`passed`, `blocked`, or `waived` before `spatialQueryEvidence` can be treated as
ready.

## Findings

| Finding | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Query readiness now requires declared capability or waiver | `GenerationEvidenceBundleSchema.spatialQueryEvidence.capabilityGate`; `GenerationEvidenceBundleInputSchema.spatialQueries.capabilityWaiver` | Inline mock query evidence no longer silently implies adapter query support. | Keep SQH-003 focused on invalid input/source diagnostics, not public MCP expansion. | high |
| Missing capability blocks ready evidence | `tests/ai/generation-evidence.test.ts` covers no `capabilities.queries`, `CAPABILITY.UNSUPPORTED`, and path `/capabilities/queries`. | Agents and generated-app review surfaces get a stable diagnostic instead of a ready state. | Preserve the diagnostic path when SQH-003 adds more query cases. | high |
| Explicit waiver remains auditable | `tests/ai/generation-evidence.test.ts` covers `capabilityWaiver.reason`, `approvedBy`, and `followUpTaskId` in output. | Quality or coordinator waivers can unblock a bounded handoff without hiding the missing capability proof. | Use waivers only with follow-up tasks. | high |
| MCP surface stays frozen | The implementation changes generation evidence only; it does not add a `spatial_query` tool. | Existing AI clients keep the documented snake_case tool set. | Continue to assert no `spatial_query` alias in AI tests. | high |

## Verification

- `pnpm exec vitest run tests/ai/generation-evidence.test.ts` - passed
- `pnpm --filter @gis-engine/ai build` - passed
- `pnpm build:schema` - passed
- `pnpm test:commands` - passed
- `pnpm test:ai` - passed
- `pnpm test:schema-sync` - passed
- `pnpm check` - passed
- `git diff --check` - passed
