---
agent: engine-agent
period: 2026-W23
generated_at: 2026-06-01T14:57:38Z
repo_revision: "824475d19d1ff1c1db523557ee163558d58cd2cb"
inputs:
  - docs/planning/feature-specs/ai-map-workbench-product-boundary.md
  - docs/planning/feature-specs/ai-map-workbench-provider-administration.md
  - docs/reviews/amw-004-promotion-gate-2026-05-31.md
  - docs/reviews/amw-007-provider-resource-admin-2026-06-01.md
  - examples/ai-map-workbench/server.mjs
  - examples/ai-map-workbench/README.md
  - tests/examples/ai-map-workbench.test.ts
owner: "@engine-agent @ai-agent @docs-agent"
decision_level: advisory
---

# AI Map Workbench Durable Audit

## Purpose

Define the durable audit retention and export boundary required by
`TASK-2026W23-AMW-008`. This is a design contract for future implementation,
not approval to add a database, hosted deployment, browser file export, or
product-app promotion.

The current workbench remains under `examples/ai-map-workbench`. Its in-memory
audit endpoint is useful local evidence, but it must not be treated as product
persistence.

## Current Accepted State

- `/api/audit` returns the current session id and the latest in-memory audit
  records for the local Node process.
- Audit records are bounded to the latest 50 entries per server session.
- Records include only compact evidence fields: id, session id, timestamp,
  status, provider id, optional prompt hash, optional trace id, command count,
  diagnostic counts, and revision movement.
- Tests already cover that audit responses do not retain raw prompts, provider
  raw bodies, API keys, feature payloads such as source properties, or unsafe
  request-controlled provider ids.
- No disk, database, object storage, screenshot storage, browser state
  retention, or export endpoint exists in this slice.

## Durable Record Model

Future durable audit records should be an evidence index, not a payload store.
The durable schema should preserve only fields needed to replay the decision
trail through bounded commands, diagnostics, and hashes.

| Field | Required | Persistence Rule |
| --- | --- | --- |
| `recordVersion` | yes | Stable literal such as `amw.audit.v1`. |
| `projectId` | yes for product mode | Product-owned id; not free-form browser text. |
| `sessionId` | yes | Server-generated opaque id. |
| `recordId` | yes | Server-generated opaque id or monotonic session id. |
| `createdAt` | yes | Server timestamp in ISO-8601 UTC. |
| `status` | yes | Enum: `applied`, `blocked`, `unsupported`, `reset`, or future review outcome. |
| `providerId` | yes | Validated public provider id only. |
| `promptHash` | optional | `sha256:*` hash only; never raw prompt. |
| `traceId` | optional | Bounded safe trace token only. |
| `commandCount` | yes | Integer count, no command bodies. |
| `diagnosticCounts` | yes | Count by severity. |
| `diagnosticCodes` | optional | Bounded stable codes and paths only, no provider body or stack trace. |
| `fromRevision` / `toRevision` | yes | Map revision movement only. |
| `reviewOutcome` | after AMW-009 | Structured accept/block/follow-up decision as defined in `ai-map-workbench-review-actions.md`, no direct `MapSpec` mutation. |

Never persist raw prompts, raw provider request or response bodies, API keys,
credential environment variable names, base URLs, request headers, feature
payloads, full `MapSpec` documents, patches, screenshots, browser state, stack
traces, account ids, organization ids, quota bodies, or provider error bodies.

## Retention Model

The local example keeps the current latest-50 in-memory behavior. Product mode
must define retention before storage is implemented:

- Default retention target: 30 days for standard audit evidence.
- Maximum product-project target: 10,000 records or the configured retention
  window, whichever is smaller.
- Retention must be configurable to a shorter window per deployment.
- Expired records are hard-deleted by the server-side retention job.
- Retention jobs emit only a compact purge receipt: timestamp, actor or job id,
  filter summary, deleted count, and reason code.
- Retention must not preserve a hidden archive of deleted raw or compact audit
  records unless a separate legal-hold design is approved.

## Privacy And Access Control

Durable audit access is server-authorized and project-scoped:

- Browser clients may request records only for the active authorized project or
  session.
- Export and deletion require server-side authorization; browser-supplied
  project ids, session ids, or filters are validated against the authenticated
  principal.
- Reviewer role can list and export compact records for an authorized project.
- Admin role can run deletion and retention operations.
- Service role can append records from command/provider execution paths only.
- Public provider metadata rules still apply: no base URL, credential variable,
  API key, request header, or raw provider body is exposed by audit APIs.

## Export Contract

The first durable export format should be a JSON envelope. NDJSON can be added
later only after the JSON contract is stable.

```json
{
  "auditExportVersion": "amw.audit.export.v1",
  "generatedAt": "2026-06-01T00:00:00Z",
  "projectId": "project_123",
  "filters": {
    "from": "2026-06-01T00:00:00Z",
    "to": "2026-06-02T00:00:00Z",
    "status": ["applied", "blocked"]
  },
  "records": [],
  "nextCursor": null
}
```

Exported records use the durable record model. They do not include prompts,
provider bodies, feature payloads, screenshots, generated app files, map specs,
or raw diagnostics. Exports should be paginated and capped to 500 records or
1 MiB per page before compression.

## Payload Caps

Future implementation must enforce caps before product promotion:

| Surface | Cap | Diagnostic |
| --- | ---: | --- |
| Audit record JSON | 2 KiB | `/auditPayload` |
| Diagnostic code/path entries | 20 entries | `/auditPayload/diagnostics` |
| Export page | 500 records or 1 MiB | `/auditExport/size` |
| Retention query window | configured retention window | `/auditRetention` |
| Deletion batch | 10,000 records | `/auditDeletion/size` |

If a field exceeds its cap, the server should omit or summarize the field and
return a structured diagnostic rather than storing raw fallback text.

## Deletion Behavior

Deletion is a server-side operation, not a browser file write:

- Delete by project, session, time range, status, or specific record id.
- Require an admin actor, reason code, and bounded filter.
- Hard-delete matching records and return a deletion receipt.
- Keep the receipt payload-free; do not include deleted record contents.
- If a record is removed because it accidentally contained sensitive material,
  export APIs must no longer return it, and follow-up should add a regression
  test for the leak class.

## Diagnostic Path Rules

- `/auditAccess`: unauthorized project, session, export, or deletion request.
- `/auditRetention`: invalid or unsupported retention window.
- `/auditExport`: invalid export filter, cursor, or format.
- `/auditExport/size`: export page would exceed record or byte caps.
- `/auditPayload`: record contains a disallowed field or exceeds caps.
- `/auditDeletion`: invalid deletion filter or unauthorized deletion request.

## Non-Goals

- No durable database implementation in AMW-008.
- No auth system or user-management UI.
- No export endpoint implementation.
- No browser file writes.
- No raw prompt, raw provider body, credential, feature payload, screenshot, or
  full `MapSpec` persistence.
- No new MCP tool names.
- No runtime review action implementation; `AMW-009` is a design-only handoff.
- No product app or hosted deployment promotion.

## 2026-06-02 AMW-009 Addendum

`AMW-009` defines the future `reviewOutcome` shape as a compact review decision
record. Durable audit storage must still stay payload-free: review outcomes may
reference audit record ids, prompt hashes, trace ids, provider ids, command
evidence, diagnostic counts, reason codes, and follow-up task ids, but must not
persist raw prompts, provider bodies, command bodies, patches, full map specs,
feature payloads, screenshots, credentials, or browser state.
