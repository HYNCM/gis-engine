---
agent: product
period: 2026-06-10
generated_at: 2026-06-09T16:46:38Z
repo_revision: "7ca08513bada13b127bf22cee101546329c266e7"
inputs:
  - docs/planning/feature-specs/ai-map-workbench-promotion-scope.md
  - docs/reviews/awp-007-product-implementation-go-no-go-2026-06-02.md
  - docs/planning/active-execution-queue-2026-06-09.md
  - https://github.com/HYNCM/gis-engine/issues/4
owner: "@product @orchestrator @quality"
decision_level: blocking
---

# PROD-010 AI Map Workbench Promotion Intake

## Decision

`TASK-2026W24-PROD-010` is complete for product-promotion intake. It does not
approve product app movement, hosted deployment, auth implementation, durable
storage implementation, export endpoints, or file movement.

AI Map Workbench remains local/example-scoped until a future Go issue passes
@quality with release-grade visual evidence or a fresh waiver.

## Intake Evidence

| Requirement | Current Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Runtime/service owner | `@builder` is named for future runtime/service implementation and incident/rollback mechanics. | Product movement is no longer ownerless. | Require this owner on any future implementation issue. | high |
| Product owner | `@product` is named for product scope, route value, access model, audit/export policy, and W25 priority recommendation. | Promotion scope has a single product decision owner. | Keep @orchestrator as serialized planning writer. | high |
| Route/module boundary | Future route is `/review-console/workbench/:projectId`; future module is `apps/review-console/workbench` or an equivalent approved product app boundary. | File movement is blocked until the boundary is consumed by a new Go issue. | Keep `examples/ai-map-workbench` as reference. | high |
| Auth/access control | Future route requires authenticated user identity, project membership, viewer/reviewer/admin roles, explicit denied states, and server-only provider secrets. | Hosted credential leakage remains blocked. | Add implementation tests only when auth code exists. | high |
| Durable audit/export/deletion | Intake specifies compact append-only record fields, 90-day default retention, deletion receipts, 10,000-record or 10 MB export caps, and raw-payload rejection. | Product storage can be evaluated without preserving raw prompts or full specs. | Future storage work must include raw-payload rejection tests. | high |
| Review decisions | Decisions stay append-only and may reference compact evidence/command ids only; MapSpec mutation still goes through `MapCommand` and `applyCommands`. | No second mutation path is introduced. | Keep review actions separate from command application. | high |
| Visual evidence | Waiver `QUALITY-WAIVER-AMW-P2-INTAKE-2026-06-10` is explicit for docs-only intake. | No visual gate is required for this non-rendering closure. | Waiver expires before route, UI, resource, or file movement. | high |
| Resource/MCP/secret safety | Future resource changes must pass resource-policy review; no new MCP tool names are approved; browser secrets remain blocked. | Public AI and network contracts stay stable. | Treat any future MCP/resource change as a separate gate. | high |
| Rollback/de-promotion | Intake defines route disablement, nav removal, durable write freeze, compact export/deletion, provider revocation, and example fallback. | Future product movement has a rollback target before implementation. | Require rollback drill evidence before hosted Go. | medium |

## Gate Evidence

| Gate | Result | Notes |
| --- | --- | --- |
| Product-promotion checklist | PASS | `docs/planning/feature-specs/ai-map-workbench-promotion-scope.md` now records owners, route/module boundary, auth/storage/export, review semantics, waiver, resource/MCP safety, and rollback. |
| Example behavior gate | Not required | This closure does not change `examples/ai-map-workbench` behavior. `pnpm test:examples` remains the required gate if future work changes example behavior. |
| Visual evidence | Waived | `QUALITY-WAIVER-AMW-P2-INTAKE-2026-06-10` covers docs-only/non-rendering intake and expires before product movement. |
| Browser secret audit | PASS by scope | No runtime code, browser bundle, provider profile, or URL handling changed. |

## Non-Goals

- No hosted deployment.
- No product app movement.
- No durable database, export endpoint, or auth implementation.
- No new MCP tool names.
- No browser-visible provider secrets or base URLs.
- No MapSpec mutation outside `MapCommand` and `applyCommands`.
