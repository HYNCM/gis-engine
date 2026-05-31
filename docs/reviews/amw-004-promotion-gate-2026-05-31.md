---
agent: quality-guardian
period: 2026-05-31
generated_at: 2026-05-31T08:46:46Z
repo_revision: "4d0c236"
inputs:
  - docs/planning/product-architecture/ai-map-workbench-product-architecture.md
  - docs/reviews/amw-001-product-evolution-2026-05-31.md
  - docs/reviews/amw-002-provider-boundary-2026-05-31.md
  - docs/reviews/amw-003-provider-workbench-evidence-2026-05-31.md
  - docs/planning/task-burndown.md
  - examples/ai-map-workbench
owner: "@quality-guardian"
decision_level: blocking
---

# AMW-004 Promotion Gate

## Decision

AI Map Workbench passes the `Provider-gated local system` stage gate and should
remain under `examples/ai-map-workbench` for now. It is not approved for
promotion to a product app boundary or hosted real-system deployment.

This is a deliberate hold, not a failure. The current workbench is useful as a
local review-console candidate with mock mode, injected provider fixtures,
command-only mutation, compact generation evidence, feature query, collapsible
evidence rails, and bounded payload-free audit records. Product promotion needs
separate app ownership, visual/release evidence, credential isolation, resource
policy review, durable audit design, and explicit review actions.

## Gate Result

| Gate | Decision | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Provider-gated local system | pass | AMW-002 normalizer and AMW-003 server/UI/audit evidence are complete; `pnpm check` passed in the AMW-003 report. | The example can be used as the local provider-gated review surface without bypassing GIS Engine contracts. | Keep the workbench in `examples/` as the reference implementation for the next review-console design. | high |
| Product app promotion | hold | No `apps/review-console` boundary, route model, persisted project model, or app ownership document exists yet. | Moving now would turn an example into product surface without ownership or release criteria. | Create a product-app boundary spec before moving files out of `examples/`. | high |
| Real provider integration | hold | Provider runtime is dependency-injected only; no credential, rate-limit, audit, or resource-policy review has landed. | Real model calls would introduce secrets and external IO not covered by current gates. | Add provider adapter and credential isolation tasks only after security/resource-policy review. | high |
| Visual/release evidence | hold | AMW-003 has browser smoke evidence but no release visual snapshot fixture for the workbench UI. | A product app would need repeatable visual evidence for rail layout, map framing, and evidence panels. | Add deterministic UI smoke or visual checks before product promotion. | medium |
| Durable audit | hold | `/api/audit` is bounded in-memory metadata only. | Hosted or product usage needs retention, export, privacy, and access-control rules. | Design durable audit storage separately from this example. | high |
| Review workflow actions | hold | The UI displays evidence but does not offer accept/block/follow-up actions. | Review-console users cannot yet convert evidence into tracked decisions. | Define command-safe review actions and task-state handoff before promotion. | medium |

## Required Before Product Promotion

1. Write a product-app boundary spec for a generated-app review console.
2. Add credential/resource-policy review for any real provider adapter.
3. Define durable audit retention, privacy, and export behavior.
4. Add repeatable UI smoke or visual snapshot coverage for the workbench layout.
5. Define explicit review actions for accept, block, and follow-up-required
   outcomes without introducing browser-side `MapSpec` mutation.
6. Decide whether task state remains in planning markdown or moves to an issue
   tracker before durable review workflows land.

## Verification

This gate consumes the AMW-003 verification record and reruns deterministic
documentation/repository gates for the AMW-004 decision:

- `pnpm vitest run tests/ai/workbench-provider-plan.test.ts tests/examples/ai-map-workbench.test.ts` - passed.
- `pnpm test:ai` - passed.
- `pnpm test:examples` - passed.
- Browser smoke at `http://127.0.0.1:4322/` - passed with no browser console errors.
- `git diff --check` - passed.
- `pnpm check` - passed.
- `pnpm test:docs` - passed after the AMW-004 report and planning updates.
- `git diff --check` - passed after the AMW-004 report and planning updates.
- `pnpm check` - passed after the AMW-004 report and planning updates.
