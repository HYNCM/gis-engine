---
agent: quality-guardian
period: 2026-W23
generated_at: 2026-06-01T16:25:25Z
repo_revision: "8cdbca0ca96badc2e83c48340b969dda9c23e59e"
inputs:
  - docs/planning/feature-specs/ai-map-workbench-product-boundary.md
  - docs/planning/feature-specs/ai-map-workbench-provider-administration.md
  - docs/planning/feature-specs/ai-map-workbench-durable-audit.md
  - docs/planning/feature-specs/ai-map-workbench-review-actions.md
  - docs/reviews/amw-004-promotion-gate-2026-05-31.md
  - docs/reviews/amw-007-provider-resource-admin-2026-06-01.md
  - docs/reviews/amw-008-durable-audit-retention-export-2026-06-01.md
  - docs/reviews/amw-009-command-safe-review-actions-2026-06-02.md
  - examples/ai-map-workbench
  - tests/examples/ai-map-workbench.test.ts
owner: "@quality-guardian @coordinator @qa-agent"
decision_level: blocking
---

# AMW-010 Product-Promotion Go-No-go

## Decision

AI Map Workbench remains **Go as a provider-gated local example** under
`examples/ai-map-workbench`, but product-app movement and hosted promotion are
**No-go** for this batch.

This is a hold, not a rollback. AMW-007, AMW-008, and AMW-009 closed the
provider administration, durable audit, and command-safe review action designs.
The current runtime still lacks product app ownership, review-action controls or
endpoint, durable authorized audit storage, product-mode provider resource
controls, and release-grade visual evidence for review actions. Those gaps block
promotion out of `examples/`.

This report satisfies `TASK-2026W23-AMW-010` and closes the AMW product-boundary
planning batch as **done / no-go**. Future product work should start from a fresh
planning loop or a new follow-up task, not by silently moving the example.

## Gate Result

| Gate | Decision | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Provider-gated local example | pass | `pnpm check` passed outside the localhost-restricted sandbox; browser smoke at `http://127.0.0.1:4323/` loaded the workbench, showed one MapLibre canvas, provider selector, command/audit/diagnostic panels, and no console errors. | The example remains useful as the local review surface. | Keep it under `examples/ai-map-workbench`. | high |
| Product app movement | no-go | No product app route/module boundary, owner, product project model, or app release surface exists. | Moving files now would promote an example without ownership or release criteria. | Open a future product-app boundary implementation task if promotion is still desired. | high |
| Hosted or production use | no-go | AMW-007 is a design handoff; timeout/abort, response byte caps, base URL scheme/host policy, auth, and product credential administration remain future work. | Hosted use would expose external IO and secret/resource risks before enforcement exists. | Implement provider resource controls and authorization before hosted use. | high |
| Durable audit and export | no-go | AMW-008 defines retention/export/privacy only as design; no durable storage, export endpoint, authorization, deletion, or payload-cap tests exist. | Product review history would not be durable, scoped, or export-safe. | Add schemas, access control, retention, export, deletion, and leak tests in a future task. | high |
| Review actions | no-go | AMW-009 defines review decisions as design; the current UI has no accept/block/follow-up controls and no review-decision endpoint. | Reviewers still cannot turn evidence into tracked runtime decisions. | Implement review-action schemas, server validation, UI controls, and tests before promotion. | high |
| Visual/release evidence | hold | Current browser smoke verifies map framing and existing evidence rails, but there is no release visual snapshot fixture for review-action states. | The product surface lacks repeatable visual evidence for the workflow it would promote. | Add deterministic UI smoke or visual snapshot coverage for provider selector, evidence rails, and review actions. | medium |
| MCP contract | pass / unchanged | AMW-010 adds no MCP tool names and preserves the existing documented snake_case tool set. | Product gate does not create AI tool contract drift. | Keep any future review-action public exposure schema-first and do not add aliases without a new task. | high |

## Browser Smoke Evidence

Run:

```txt
PORT=4323 pnpm example:ai-map-workbench
```

Observed through the in-app browser:

- Page title: `AI Map Workbench`.
- Map container: `717 x 441` CSS pixels.
- MapLibre canvas: one canvas, `1434 x 882` backing pixels.
- Provider options: enabled `mock-ai`; disabled `deepseek` with missing
  credential state.
- Existing panels present: `Command trail`, `Provider`, `Diagnostics`,
  `Session audit`, and `Last command`.
- UI prompt smoke: clicking `Red` changed status to `Applied`, recorded
  `commandEvidence.commandCount: 1` in the last command, showed audit
  `applied / 1 command(s)` and `1 -> 2 / mock-ai`, and kept diagnostics at
  `No diagnostics.`
- Browser console errors: none.

This smoke supports local example usability only. It is not release-grade visual
snapshot evidence and does not cover review-action controls because those controls
do not exist yet.

## Required Before Future Product Go

1. Name product app ownership, route/module boundary, project model, and release
   surface.
2. Implement review-action input/output schemas, server validation, UI controls,
   stale-evidence handling, leak-hardening, and no-direct-`MapSpec` mutation
   tests.
3. Implement durable audit storage/export/deletion with authorization, retention,
   payload caps, and regression tests.
4. Implement provider resource enforcement for base URL policy, timeout/abort,
   response size cap, credential/resource states, and product-mode denial paths.
5. Add repeatable UI smoke or visual snapshot coverage for map framing, evidence
   rails, provider selector, and review-action states.
6. Rerun `pnpm test:docs`, `pnpm check`, browser smoke or visual evidence, and
   `git diff --check` before any future Go decision.

## Boundaries Preserved

- No product app movement in this gate.
- No hosted deployment, auth system, database, export endpoint, or browser file
  write.
- No raw prompt, raw provider body, credential, feature payload, screenshot, full
  `MapSpec`, command body, or patch retention.
- No new MCP tool names.
- No MapLibre package movement or stable SceneView3D runtime promotion.

## Verification

- `pnpm test:docs` - passed.
- `pnpm check` - sandbox run failed with `listen EPERM 127.0.0.1`; external
  permission rerun passed with all deterministic suites, including
  `tests/examples/ai-map-workbench.test.ts`.
- Browser smoke at `http://127.0.0.1:4323/` - passed for current local example
  usability and no console errors.
- `git diff --check` - passed after AMW-010 report and planning ledger edits.
