---
agent: qa-agent
period: 2026-05-30
generated_at: 2026-05-30T14:56:00Z
repo_revision: "033b5f9"
inputs:
  - tests/ai/prompt-evidence-scenarios.test.ts
  - tests/ai/generation-evidence.test.ts
  - docs/planning/feature-specs/generated-app-review-console.md
  - docs/planning/feature-specs/generated-app-delivery-ux.md
  - packages/ai/src/tools/generationEvidence.ts
owner: "@qa-agent"
decision_level: advisory
---

# GIR-005 Prompt-to-Delivery QA Scenarios

`TASK-2026W22-GIR-005` is now represented by prompt-level QA coverage. The
prompt evidence suite directly exercises delivery summaries for `ready`,
`needs-confirmation`, `follow-up-required`, and `blocked` states instead of
only checking lower-level evidence.

## Evidence

| Requirement | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Ready delivery from prompt flow is asserted | `tests/ai/prompt-evidence-scenarios.test.ts` now checks `delivery.status = "ready"` and all five delivery sections for the feature-display prompt. | Prompt-level QA can validate the full handoff, not just command replay. | Keep the section mapping aligned with the review-console contract. | high |
| Spatial prompt flow carries delivery-ready analysis state | The spatial-analysis prompt scenario now asserts `delivery.status = "ready"` and `data-and-analysis` / `scene-browsing` section states. | Spatial readiness is visible in the user-facing handoff. | Preserve the `data-and-analysis` section semantics in future evidence work. | high |
| Needs-confirmation prompt flow is covered | A new pmtiles prompt scenario asserts `delivery.status = "needs-confirmation"` and validates the readiness-only source handoff. | Confirmation boundaries stay visible at prompt level. | Keep archive parsing and external-resource prompts behind the same boundary. | high |
| Follow-up-required and blocked prompt flows are covered | Extension-only scene browsing now asserts `delivery.status = "follow-up-required"`; stable scene3d prompt asserts `delivery.status = "blocked"`. | Review-console status no longer depends on prose to explain the difference between partial handoff and hard block. | Preserve the follow-up and blocker sections in the delivery summary. | high |
| Regression coverage is in place | `tests/ai/generation-evidence.test.ts` continues to cover the same delivery states, while the prompt suite now checks the prompt-to-delivery shape directly. | The new prompt scenarios are backed by the existing evidence spine. | Treat future prompt-console changes as contract changes, not ad hoc UI tweaks. | high |

## Gate Output

| Command | Result | Notes |
| --- | --- | --- |
| `git diff --check` | pass | No whitespace or patch formatting issues. |
| `pnpm vitest run tests/ai/prompt-evidence-scenarios.test.ts tests/ai/generation-evidence.test.ts` | pass | 15 tests passed across the prompt and generation evidence suites. |
| `pnpm test:ai` | pass | 43 tests passed across AI contract and evidence suites. |
| `pnpm test:examples` | pass | 9 example tests passed. |
| `pnpm check` | pass | Full build and deterministic test suite passed after rerunning outside the sandbox so Chromium could complete the SceneView3D smoke visual gate. |

## Decision

`TASK-2026W22-GIR-005` is complete. The next queued task should advance to
`GIR-006`.
