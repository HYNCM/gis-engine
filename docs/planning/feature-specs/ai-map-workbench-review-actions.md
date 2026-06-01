---
agent: engine-agent
period: 2026-W23
generated_at: 2026-06-01T16:07:24Z
repo_revision: "cf604412f0159bf605dd5dd6de376bc28ab3607c"
inputs:
  - docs/planning/feature-specs/ai-map-workbench-product-boundary.md
  - docs/planning/feature-specs/ai-map-workbench-provider-administration.md
  - docs/planning/feature-specs/ai-map-workbench-durable-audit.md
  - docs/reviews/amw-004-promotion-gate-2026-05-31.md
  - docs/reviews/amw-008-durable-audit-retention-export-2026-06-01.md
  - examples/ai-map-workbench/server.mjs
  - examples/ai-map-workbench/public/app.js
  - tests/examples/ai-map-workbench.test.ts
owner: "@engine-agent @ai-agent @qa-agent"
decision_level: advisory
---

# AI Map Workbench Review Actions

## Purpose

Define the command-safe review action contract required by
`TASK-2026W23-AMW-009`. This is a design handoff for future implementation, not
approval to add review-action UI, a durable database, browser file writes, a
hosted service, product-app promotion, or new MCP tool names.

Review actions are decisions about already-produced evidence. They do not apply
map edits. Runtime map mutation remains on the existing provider-normalization,
generation-command-skeleton, and `applyCommands` path.

## Current Accepted State

- `POST /api/chat` accepts browser `message` plus optional `providerId`; mock and
  provider paths apply map changes only through `applyCommands`.
- Provider output is normalized before any command skeleton is built; unsafe,
  stale, or unsupported output is blocked with structured diagnostics and
  `commandCount: 0`.
- `POST /api/query` is read-only feature evidence against the active spec.
- `/api/audit` is a latest-50, in-memory, payload-free session evidence endpoint.
- The browser displays provider, generation, command, diagnostic, query, and
  audit evidence, but it does not yet offer accept, block, or follow-up actions.

## Review Decision Model

Future review actions should append compact review decisions. A review decision
references evidence; it must not copy raw prompt text, provider request/response
bodies, command bodies, patches, full `MapSpec` documents, feature payloads,
screenshots, browser state, credentials, base URLs, account ids, stack traces, or
provider error bodies.

| Field | Required | Rule |
| --- | --- | --- |
| `recordVersion` | yes | Stable literal such as `amw.review.v1`. |
| `decisionId` | yes | Server-generated opaque id. |
| `createdAt` | yes | Server timestamp in ISO-8601 UTC. |
| `projectId` | product mode | Product-owned id; never unvalidated browser free text. |
| `sessionId` | yes | Server-issued session id. |
| `auditRecordId` | recommended | Points at the compact audit record under review when available. |
| `outcome` | yes | `accepted`, `blocked`, or `follow-up-required`. |
| `providerId` | yes | Validated public provider id only. |
| `promptHash` | optional | `sha256:*` hash only; never raw prompt text. |
| `traceId` | optional | Bounded safe trace token. |
| `deliveryStatus` | optional | Existing delivery state: `ready`, `blocked`, `needs-confirmation`, or `follow-up-required`. |
| `commandEvidence` | yes | Count and status summary only: command count, committed, rolled back, failed, changed path count. |
| `diagnosticCounts` | yes | Count by severity. |
| `diagnosticCodes` | optional | Up to 20 stable code/path pairs; no diagnostic prose copied from provider bodies. |
| `sourceReadiness` | optional | Compact readiness counts or ids only, aligned to generated-app delivery evidence. |
| `spatialQueryReadiness` | optional | Compact state and follow-up task ids only; no feature payloads. |
| `reasonCodes` | yes | Bounded enum values chosen by the reviewer or server policy. |
| `followUpTaskIds` | outcome-specific | Required for `follow-up-required`; omitted or empty for `accepted`. |

## Outcome Rules

| Outcome | Meaning | Required Evidence | Must Not Do |
| --- | --- | --- | --- |
| `accepted` | Reviewer accepts the current evidence for handoff. | Referenced audit or response evidence has no blocking diagnostics, command evidence shows the mutation path used `applyCommands`, and delivery state is not blocked. | Treat acceptance as a new map mutation, file export, hosted deployment, or product promotion. |
| `blocked` | Reviewer rejects the handoff. | At least one stable diagnostic path, blocker category, or policy reason is recorded. | Store provider raw bodies, raw prompts, screenshots, or free-form failure dumps. |
| `follow-up-required` | Reviewer keeps the evidence visible but requires bounded follow-up before handoff. | One or more follow-up task ids or owner targets are recorded with reason codes. | Mark the app ready, create hidden task state, write files, or bypass product-promotion gates. |

Recommended initial `reasonCodes`:

- `provider-output-blocked`
- `provider-resource-follow-up`
- `audit-retention-follow-up`
- `visual-evidence-required`
- `delivery-needs-confirmation`
- `spatial-query-follow-up`
- `scene3d-extension-only`
- `product-promotion-required`

## Command-Safety Rules

- Review actions are append-only decision records; they do not mutate `MapSpec`.
- Any future action that changes map state must create explicit `MapCommand`
  entries and pass through `applyCommands` before a separate review decision is
  recorded.
- Browser clients may request an outcome and reason codes only; the server owns
  ids, timestamps, project/session authorization, and evidence lookup.
- Review decisions reference compact command evidence and diagnostic summaries,
  never command bodies, JSON patches, or full trace payloads.
- A blocked or follow-up-required decision can name future tasks, but it must not
  write issue-tracker or planning markdown state directly from the browser.
- MCP tool names remain frozen; review actions must reuse existing evidence
  surfaces unless a future schema-first task explicitly adds a public contract.

## Payload Caps

| Surface | Cap | Diagnostic |
| --- | ---: | --- |
| Review decision JSON | 2 KiB | `/reviewDecision/payload` |
| Reason codes | 8 entries | `/reviewDecision/reasons` |
| Diagnostic code/path pairs | 20 entries | `/reviewDecision/diagnostics` |
| Follow-up task ids | 10 entries | `/reviewDecision/followUps` |
| Optional reviewer note, if later approved | 280 chars | `/reviewDecision/note` |

If an implementation exceeds a cap, it must omit or summarize the field and
return a structured diagnostic. It must not store raw fallback text.

## Diagnostic Path Rules

- `/reviewAction/outcome`: missing or unsupported outcome.
- `/reviewAction/evidence`: missing, stale, unauthorized, or mismatched evidence
  reference.
- `/reviewAction/commandSafety`: action attempts direct `MapSpec`, patch, file,
  or command-body mutation.
- `/reviewAction/followUp`: missing required follow-up owner or task id.
- `/reviewDecision/payload`: decision payload includes a disallowed or oversized
  field.
- `/reviewDecision/authorization`: reviewer cannot decide for the project,
  session, or evidence record.

## Future Implementation Requirements

Before review actions become runtime behavior, a future implementation task must:

1. Add TypeBox/Ajv schemas for review action input, review decision output, and
   diagnostics if the contract becomes public.
2. Validate all browser input server-side and derive ids, timestamps, evidence
   references, and authorization server-side.
3. Add tests for accepted, blocked, follow-up-required, stale evidence, payload
   cap, leak-hardening, and no-direct-`MapSpec` mutation cases.
4. Preserve latest-50 in-memory audit behavior unless durable storage is opened
   by a separate task.
5. Add UI smoke or visual evidence for action controls before product promotion.

## Non-Goals

- No review action endpoint or UI implementation in AMW-009.
- No durable review-decision database.
- No issue-tracker integration or markdown task-state writes from browser UI.
- No export, download, or browser file write.
- No raw prompt, raw provider body, credential, feature payload, screenshot, full
  `MapSpec`, command body, or patch persistence.
- No hosted deployment, product app movement, or product-promotion Go decision.
- No new MCP tool names.
