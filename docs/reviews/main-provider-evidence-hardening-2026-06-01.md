---
agent: code-reviewer
period: 2026-06-01
generated_at: 2026-06-01T10:09:14Z
repo_revision: "1bf23003ba105e9c26d2995453d4e335ecbdb2d5"
inputs:
  - packages/ai/src/tools/workbenchProviderPlan.ts
  - examples/ai-map-workbench/server.mjs
  - examples/ai-map-workbench/README.md
  - tests/ai/workbench-provider-plan.test.ts
  - tests/examples/ai-map-workbench.test.ts
owner: "@code-reviewer"
decision_level: advisory
---

# Main Provider Evidence Hardening Review

## Finding

### [P1] Provider evidence accepted free-form identity fields

- Evidence: `normalizeWorkbenchProviderPlan()` accepted provider-owned
  `providerId` and `traceId` directly into planner evidence, while blocked and
  stale workbench paths copied provider-owned `promptHash` and `traceId` into
  audit records.
- Impact: provider-returned free text could become browser-visible evidence or
  payload-free audit metadata, weakening the provider leak-hardening boundary.
- Required fix: normalize evidence-facing provider ids, omit unsafe trace ids,
  require prompt hashes to use the bounded `sha256:*` evidence shape, and cover
  successful plus blocked workbench paths with regressions.
- Owner: `@ai-agent`

## Applied Optimization

- `packages/ai/src/tools/workbenchProviderPlan.ts` now normalizes provider ids,
  validates prompt hash shape before creating planner evidence, and drops
  unsafe trace ids so the engine generates a safe default trace.
- `examples/ai-map-workbench/server.mjs` now uses the same bounded evidence
  policy for blocked and stale audit records.
- `examples/ai-map-workbench/README.md` documents the provider evidence token
  boundary.

## Focused Verification

- `pnpm vitest run tests/ai/workbench-provider-plan.test.ts -t "unsafe provider ids|unsafe prompt hash"` passed.
- `pnpm vitest run tests/examples/ai-map-workbench.test.ts -t "unsafe provider output|unsafe injected provider ids"` passed with localhost permissions enabled.
