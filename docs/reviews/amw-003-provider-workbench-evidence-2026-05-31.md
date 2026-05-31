---
agent: ai-agent
period: 2026-05-31
generated_at: 2026-05-31T06:11:27Z
repo_revision: "750dd2f"
inputs:
  - docs/planning/product-architecture/ai-map-workbench-product-architecture.md
  - docs/superpowers/plans/2026-05-31-ai-map-workbench-real-system.md
  - examples/ai-map-workbench/server.mjs
  - examples/ai-map-workbench/public/app.js
  - examples/ai-map-workbench/public/index.html
  - examples/ai-map-workbench/public/styles.css
  - tests/examples/ai-map-workbench.test.ts
owner: "@ai-agent"
decision_level: advisory
---

# AMW-003 Provider Workbench Evidence

## Decision

`TASK-2026W22-AMW-003` is complete for the local provider-gated workbench slice.
The example server now accepts injected provider output, normalizes it through
the AMW-002 provider boundary, creates generation command skeletons, applies
commands through `applyCommands`, returns compact provider/generation evidence,
and records bounded payload-free session audit metadata.

This remains an example-local review-console slice. It does not add a real
external model call, credential storage, production hosting, durable audit
storage, new MCP tool names, external resources, or product promotion.

## Evidence

| Requirement | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Provider output uses the command path | `createWorkbenchServer({ plannerProvider })` normalizes provider output, builds a command skeleton, and applies `skeleton.commands` with `applyCommands`; `tests/examples/ai-map-workbench.test.ts` asserts the injected provider moves revision `1` to `2`. | Provider mode cannot bypass the engine mutation contract. | Keep any future real provider behind this injected boundary until credential/resource review lands. | high |
| Unsafe provider output is blocked | The workbench API returns `status: "blocked"` and `CAPABILITY.UNSUPPORTED` diagnostics for raw prompt plus JavaScript provider output while revision remains `1`. | Prompt/model output cannot directly mutate the map or browser. | Preserve `/providerOutput` as the stable diagnostic path. | high |
| Generation evidence is visible | Provider-mode responses include `provider.retainedRawPrompt = false`, `generationEvidence.delivery.status = "ready"`, and `generationEvidence.planner.provided = true`; the right evidence rail renders provider, confidence, delivery, and prompt-hash fields. | Reviewers can inspect acceptance evidence without parsing prose or using browser-owned state. | Expand UI scenarios only after AMW promotion gate decides whether this stays under `examples/`. | high |
| Session audit is bounded and payload-free | `/api/audit` returns recent metadata records with status, command count, diagnostic counts, trace/prompt hash when available, and revision movement; tests assert records exclude feature text and raw prompt text. | The review console gets traceability without leaking provider payloads, features, screenshots, or credentials. | Use durable storage only after security/resource-policy review. | high |

## Verification

- `pnpm vitest run tests/examples/ai-map-workbench.test.ts` - red first for
  missing provider evidence, then passed after provider mode landed.
- `pnpm vitest run tests/examples/ai-map-workbench.test.ts` - red first for
  missing `generationEvidence`, then passed after compact evidence and UI
  rendering landed.
- `pnpm vitest run tests/examples/ai-map-workbench.test.ts` - red first for
  missing `/api/audit`, then passed after bounded audit landed.
- `pnpm vitest run tests/ai/workbench-provider-plan.test.ts tests/examples/ai-map-workbench.test.ts` - passed, 2 files / 10 tests.
- `pnpm test:ai` - passed, 6 files / 53 tests.
- `pnpm test:examples` - passed, 2 files / 18 tests.
- `pnpm test:docs` - passed, 1 file / 2 tests.
- Browser smoke at `http://127.0.0.1:4322/` - passed: provider section
  rendered, mock prompt applied revision `2`, audit record rendered, right rail
  collapsed and restored, no browser console errors. Chromium emitted MapLibre
  WebGL performance warnings only.
- `git diff --check` - passed.
- `pnpm check` - passed.

## Follow-Up

`AMW-004` should decide whether the workbench remains an example, becomes a
product review-console slice, or stays blocked pending credential isolation,
resource-policy review, visual evidence, and production audit storage.
