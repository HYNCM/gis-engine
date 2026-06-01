---
agent: engine-agent
period: 2026-W23
generated_at: 2026-06-01T14:57:38Z
repo_revision: "824475d19d1ff1c1db523557ee163558d58cd2cb"
inputs:
  - docs/planning/feature-specs/ai-map-workbench-durable-audit.md
  - docs/planning/sprint-2026-W23-ai-map-workbench-product-boundary.md
  - docs/reviews/amw-004-promotion-gate-2026-05-31.md
  - docs/reviews/amw-007-provider-resource-admin-2026-06-01.md
  - examples/ai-map-workbench/server.mjs
  - tests/examples/ai-map-workbench.test.ts
owner: "@engine-agent @ai-agent @docs-agent"
decision_level: advisory
---

# AMW-008 Durable Audit Retention And Export

## Decision

Durable audit retention and export are accepted as a design handoff. The
current workbench already exposes bounded, in-memory, payload-free session
audit records, and AMW-008 defines the future product-mode contract for record
shape, retention, privacy, access control, export, payload caps, deletion, and
diagnostic paths.

This report satisfies `TASK-2026W23-AMW-008` as a design task. AMW-009
subsequently closed command-safe review action design and queues
`TASK-2026W23-AMW-010` for the product-promotion Go/No-go gate.

## Evidence

| Check | Result | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Current audit endpoint | accepted | `examples/ai-map-workbench/server.mjs` returns `/api/audit` from an in-memory `auditRecords` array and caps it to 50 entries. | The local example remains useful without pretending to be durable storage. | Keep latest-50 in-memory behavior until product persistence is explicitly implemented. | high |
| Payload-free record shape | accepted | `appendAuditRecord()` writes id, session id, timestamp, status, provider id, optional prompt hash, optional trace id, command count, diagnostic counts, and revision movement. | Audit records can support review without raw payload retention. | Future durable schema should preserve this compact evidence model. | high |
| Leak hardening | accepted | `tests/examples/ai-map-workbench.test.ts` asserts audit output excludes raw prompts, API keys, raw provider bodies, unsafe provider ids, and feature payload values. | AMW can define retention/export around compact evidence instead of sensitive payloads. | Add focused regression tests for any durable storage/export implementation. | high |
| Retention model | accepted as design | `docs/planning/feature-specs/ai-map-workbench-durable-audit.md` defines a default 30-day target, project caps, shorter deployment overrides, and hard-delete purge receipts. | Future product mode has bounded persistence semantics before storage code exists. | Implement retention only in a later task with schemas and tests. | medium |
| Export model | accepted as design | The AMW-008 spec defines a JSON export envelope with paginated compact records and byte/record caps. | Reviewers can receive durable audit evidence without raw prompts, provider bodies, map specs, or screenshots. | Add public schemas if an export API is implemented. | medium |
| Access and deletion | accepted as design | The AMW-008 spec defines reviewer/admin/service roles, project-scoped access, hard deletion, and payload-free deletion receipts. | Hosted/product use stays blocked until authorization is real. | Do not add browser export/delete controls before auth and schema gates. | high |

## Follow-Up Requirements

Before AI Map Workbench can add durable audit storage, a future implementation
task must:

1. Add public schemas for durable audit records, export envelopes, deletion
   receipts, and diagnostics.
2. Validate every append/export/delete payload with Ajv.
3. Preserve the no-raw-prompt, no-raw-provider-body, no-credential,
   no-feature-payload, no-screenshot, and no-full-MapSpec persistence rule.
4. Add retention, export, payload-cap, access-control, and deletion tests.
5. Keep review actions as structured decisions without direct `MapSpec`
   mutation.

## Boundaries Preserved

- No code changes in this design slice.
- No durable database implementation.
- No auth system, user-management UI, or browser export/delete control.
- No raw prompt, raw provider body, credential, feature payload, screenshot, or
  full `MapSpec` persistence.
- No browser file writes.
- No new MCP tool names.
- No product app or hosted deployment promotion.

## Verification

Required for this design handoff:

- `pnpm test:docs`
- `pnpm check`
- `git diff --check`

AMW-009 subsequently closed as command-safe review action design, so the next
queued task is `TASK-2026W23-AMW-010`.
