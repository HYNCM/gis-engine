---
agent: ai-agent
period: 2026-05-31
generated_at: 2026-05-31T05:50:54Z
repo_revision: "01636ff"
inputs:
  - docs/archive/2026-06-10/product-architecture/ai-map-workbench-product-architecture.md
  - docs/archive/2026-06-10/feature-specs/ai-map-workbench-real-system-evolution.md
  - docs/superpowers/plans/2026-05-31-ai-map-workbench-real-system.md
  - packages/ai/src/tools/workbenchProviderPlan.ts
  - packages/ai/src/index.ts
  - tests/ai/workbench-provider-plan.test.ts
owner: "@ai-agent"
decision_level: advisory
---

# AMW-002 Provider Boundary

## Decision

`TASK-2026W22-AMW-002` is complete for the provider-boundary slice. The system
now has a minimal AI package boundary that accepts structured provider intent,
routes it through the existing generation planner, and blocks unsafe provider
output before command creation.

This does not add a real external model call, server provider mode, browser UI
provider evidence, credential storage, durable audit, or product-app promotion.
Those remain queued under `AMW-003` and `AMW-004`.

## Evidence

| Requirement | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Product architecture is explicit | `docs/archive/2026-06-10/product-architecture/ai-map-workbench-product-architecture.md` defines the review-console layers, provider boundary, evidence flow, audit limits, and promotion stages. | AMW implementation has a stable architecture baseline before adding real providers. | Keep later AMW tasks aligned to this architecture document. | high |
| Structured provider intent is accepted | `normalizeWorkbenchProviderPlan` calls `planMapGenerationRequest` with `promptHash`, `traceId`, `plannerId`, and structured `intent`; `tests/ai/workbench-provider-plan.test.ts` asserts a `ready` plan. | Provider output enters existing schema-first planner contracts instead of a parallel path. | Use this normalizer when adding server provider mode in `AMW-003`. | high |
| Unsafe provider output is blocked | The normalizer rejects raw prompt, prompt text, JavaScript, direct commands, raw `MapSpec`, and patch fields with `CAPABILITY.UNSUPPORTED` at `/providerOutput`. | Real model output cannot directly mutate the browser, renderer, or map spec. | Preserve this diagnostic path when adding provider adapters. | high |
| Public AI export exists | `packages/ai/src/index.ts` exports `normalizeWorkbenchProviderPlan` and related types. | Workbench server and tests can consume the provider boundary through `@gis-engine/ai`. | Keep the API small until server and UI evidence land. | high |

## Verification

- `pnpm vitest run tests/ai/workbench-provider-plan.test.ts` - red first with
  `normalizeWorkbenchProviderPlan is not a function`, then passed after the
  normalizer/export landed.
- `pnpm build:schema` - passed.
- `pnpm test:schema-sync` - passed.
- `pnpm test:ai` - passed, including the new provider boundary test.
- `pnpm test:docs` - passed.
- `git diff --check` - passed.
- `pnpm check` - passed.
