---
agent: engine-agent
period: 2026-W23
generated_at: 2026-06-01T16:07:24Z
repo_revision: "cf604412f0159bf605dd5dd6de376bc28ab3607c"
inputs:
  - docs/planning/feature-specs/ai-map-workbench-review-actions.md
  - docs/planning/feature-specs/ai-map-workbench-product-boundary.md
  - docs/planning/feature-specs/ai-map-workbench-durable-audit.md
  - docs/planning/sprint-2026-W23-ai-map-workbench-product-boundary.md
  - docs/reviews/amw-004-promotion-gate-2026-05-31.md
  - examples/ai-map-workbench/server.mjs
  - examples/ai-map-workbench/public/app.js
  - tests/examples/ai-map-workbench.test.ts
owner: "@engine-agent @ai-agent @qa-agent"
decision_level: advisory
---

# AMW-009 Command-Safe Review Actions

## Decision

Command-safe review actions are accepted as a design handoff. AMW-009 defines
accept, block, and follow-up-required decisions as compact evidence records that
reference audit, provider, delivery, command, diagnostic, source-readiness, and
spatial-query evidence without directly mutating `MapSpec`, writing browser
files, retaining raw provider payloads, or adding MCP tool names.

This report satisfies `TASK-2026W23-AMW-009` as a design task and queues
`TASK-2026W23-AMW-010` for the product-promotion Go/No-go gate.

## Evidence

| Check | Result | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Current mutation path | accepted | `examples/ai-map-workbench/server.mjs` applies mock and provider plans only through `applyCommands`; blocked provider paths keep `commandCount: 0`. | Review decisions can reference command evidence without becoming a second mutation path. | Future review-action implementation must keep action handling append-only. | high |
| Current evidence display | accepted | `examples/ai-map-workbench/public/app.js` renders provider, generation, command, diagnostics, query, and audit evidence but has no action controls. | AMW-009 can specify the missing decision layer without claiming UI implementation. | Add UI smoke or visual evidence only in a future implementation or promotion gate. | high |
| Audit alignment | accepted | `docs/planning/feature-specs/ai-map-workbench-durable-audit.md` reserves `reviewOutcome` after AMW-009 while keeping audit payload-free. | Review outcomes can attach to compact audit records without expanding raw-payload retention. | Durable storage/export still requires a separate schema and authorization task. | high |
| Outcome semantics | accepted as design | `docs/planning/feature-specs/ai-map-workbench-review-actions.md` defines `accepted`, `blocked`, and `follow-up-required` outcome rules. | Review-console users get decision semantics before product promotion. | Reuse generated-app delivery states rather than adding MCP aliases. | high |
| Payload and leak rules | accepted as design | The AMW-009 spec caps review decision JSON, reason codes, diagnostic pairs, follow-up task ids, and optional notes; it forbids raw prompts, provider bodies, command bodies, patches, full specs, screenshots, and credentials. | Review records stay safe for future durable audit/export work. | Add regression tests before runtime implementation. | high |
| Diagnostic paths | accepted as design | The AMW-009 spec reserves `/reviewAction/*` and `/reviewDecision/*` diagnostic paths. | Future implementation can return stable diagnostics instead of prose-only action failures. | Add TypeBox/Ajv schemas and tests if the contract becomes public. | medium |

## Follow-Up Requirements

Before review actions become runtime behavior, a future implementation task must:

1. Add TypeBox/Ajv schemas for review action input and review decision output if
   exposed as a public API.
2. Validate outcome, reason codes, evidence references, payload caps, and
   authorization server-side.
3. Add tests for accepted, blocked, follow-up-required, stale evidence,
   leak-hardening, payload caps, and no direct `MapSpec` mutation.
4. Keep browser clients from writing generated files, planning markdown, issue
   tracker state, command bodies, or raw provider payloads.
5. Add repeatable UI smoke or visual evidence before any product-promotion Go
   decision.

## Boundaries Preserved

- No code changes in this design slice.
- No review action endpoint or UI implementation.
- No durable database, export endpoint, auth system, or browser file write.
- No raw prompt, raw provider body, credential, feature payload, screenshot, full
  `MapSpec`, command body, or patch retention.
- No product app or hosted deployment promotion.
- No new MCP tool names.

## Verification

Required for this design handoff:

- `pnpm test:docs`
- `pnpm check`
- `git diff --check`

The next queued task is `TASK-2026W23-AMW-010`.
