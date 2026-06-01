---
agent: engine-agent
period: 2026-W23
generated_at: 2026-06-01T17:22:00Z
repo_revision: "65e4d4ecef734a22bd65e2deacb19c23b2398c1c"
inputs:
  - docs/planning/feature-specs/ai-map-workbench-durable-audit.md
  - docs/reviews/amw-008-durable-audit-retention-export-2026-06-01.md
  - docs/reviews/awp-003-product-ownership-project-model-2026-06-02.md
  - examples/ai-map-workbench/audit-contract.mjs
  - tests/examples/ai-map-workbench.test.ts
owner: "@engine-agent @ai-agent @docs-agent"
decision_level: advisory
---

# AWP-004 Authorized Durable Audit Contract

## Decision

`TASK-2026W23-AWP-004` is implemented as a contract scaffold, not as durable
storage. The current `/api/audit` endpoint remains local, in-memory, latest-50,
and payload-free. No database, export endpoint, auth system, browser file write,
hosted deployment, product app movement, or new MCP tool name is added.

The next queued task is `TASK-2026W23-AWP-005` command-safe review decisions.

## Evidence

| Check | Result | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| Durable record contract | implemented | `examples/ai-map-workbench/audit-contract.mjs` creates `amw.audit.v1` records with project id, session id, record id, timestamp, status, provider id, prompt hash, trace id, command count, diagnostic counts/codes, and revisions only. | Future storage has a compact shape before persistence exists. | Keep raw payloads out of every append path. | high |
| Project-scoped access | implemented | `authorizeAuditOperation()` permits reviewer list/export, service append, and admin deletion/retention only for authorized project ids. | Future export/delete work cannot be treated as public browser state. | Wire any future endpoint through this role/project contract. | high |
| Export caps | implemented | `createAuditExportEnvelope()` enforces project-matching records, 500-record cap, and 1 MiB envelope cap. | Export remains bounded and payload-free. | Add public schemas only if an export endpoint is introduced. | high |
| Deletion receipt | implemented | `createAuditDeletionReceipt()` requires admin role, actor id, reason code, bounded filter, and deletion count cap; it returns no deleted record contents. | Retention/deletion evidence is auditable without preserving sensitive data. | Use receipt shape for future retention jobs. | high |
| Leak hardening | implemented | Focused tests reject raw prompt/provider/spec fields and overlong diagnostic lists with `AUDIT.CONTRACT_VIOLATION`. | Accidental raw retention becomes a deterministic failure. | Extend the disallowed-field set when new leak classes appear. | high |
| Boundary preservation | preserved | No server route, persistent store, auth UI, export endpoint, browser write, product app movement, or MCP alias was added. | AWP-004 closes the contract blocker without product promotion. | Keep runtime implementation behind future schema/gate work. | high |

## Boundaries Preserved

- No durable database implementation.
- No auth system, user-management UI, or product provider admin UI.
- No `/api/audit/export`, deletion endpoint, browser file write, or hosted
  deployment.
- No raw prompt, raw provider body, credential, feature payload, screenshot,
  browser state, command body, patch, or full `MapSpec` persistence.
- No direct `MapSpec` mutation, direct provider commands, or new MCP tool names.
- No product app movement out of `examples/ai-map-workbench`.

## Verification

- `pnpm vitest run tests/examples/ai-map-workbench.test.ts` - passed, 70 tests.
- `pnpm test:examples` - passed, 2 files / 80 tests.
- `pnpm test:docs` - passed, 1 file / 2 tests.
- `pnpm check` - passed.
- `git diff --check` - passed.
