---
agent: product
period: 2026-W24
generated_at: 2026-06-09T16:46:38Z
repo_revision: "7ca08513bada13b127bf22cee101546329c266e7"
inputs:
  - docs/archive/2026-06-10/feature-specs/ai-map-workbench-real-system-evolution.md
  - docs/archive/2026-06-10/feature-specs/ai-map-workbench-product-boundary.md
  - docs/archive/2026-06-10/feature-specs/ai-map-workbench-product-implementation.md
  - docs/archive/2026-06-10/planning/next-stage-goals-2026-06-06.md
  - ../../reviews/full-project-review-2026-06-05.md
  - docs/archive/2026-06-10/reviews/awp-007-product-implementation-go-no-go-2026-06-02.md
  - docs/planning/active-execution-queue-2026-06-09.md
  - https://github.com/HYNCM/gis-engine/issues/4
owner: "@product @orchestrator @quality"
decision_level: blocking
---

# AI Map Workbench Promotion Scope

## Purpose

Freeze the next promotion scope for AI Map Workbench without changing the
current `examples/ai-map-workbench` product boundary. This spec completes the
planning step required by the next-stage queue: it defines what must exist
before any future product or hosted movement is even considered.

It does not approve promotion. It does not move files, add auth, add a durable
database, add a new MCP tool, or change the no-go status of hosted/product use.

## Promotion Goal

Create a future product-promotion task that can later evaluate whether the
workbench should move from local/example scope to a product-owned review
surface. The scope must stay explicit and narrow:

- runtime/service ownership;
- route and module boundary;
- durable storage, auth, and export scope;
- release-grade visual evidence;
- review-action semantics tied to compact audit evidence.

## Required Boundary

| Boundary | Must Exist Before Promotion | Must Not Do |
| --- | --- | --- |
| Ownership | Name the runtime/service owner and the product owner separately. | Leave product/hosted movement implicit or ownerless. |
| Route/module | Define the future product route and module boundary. | Move files into a product app before the boundary is approved. |
| Storage/auth/export | State durable storage, access control, retention, and export scope. | Treat the current local audit shape as production storage. |
| Visual evidence | Provide repeatable browser smoke or release-grade visual evidence. | Promote on ad-hoc inspection only. |
| Review actions | Keep accept/block/follow-up semantics append-only and command-safe. | Reintroduce a second `MapSpec` mutation path. |

## Acceptance Rules

- The scope is accepted only as a planning freeze.
- The scope must reference the existing provider, audit, and review-action
  contracts instead of inventing new public APIs.
- The scope must preserve command-only mutation, schema-first inputs, and
  payload-free audit rules.
- The scope must keep hosted deployment, durable storage, and browser-visible
  secrets blocked until a separate promotion gate approves them.

## Non-Goals

- No hosted deployment.
- No durable database implementation.
- No browser-side provider URLs or credentials.
- No new MCP tool names.
- No stable SceneView3D runtime promotion.
- No MapLibre package movement.

## Recommended Follow-Up Task

1. Create a fresh product-promotion task that consumes this scope and the
   existing product-boundary docs.
2. Keep cloud-native source promotion and performance trend work on their own
   tracks so the promotion scope does not become a catch-all.

## 2026-06-06 Addendum

This freeze is now accepted as the P0 planning outcome for the next-stage
loop. It closes the scope-definition step only. Product and hosted promotion
remain No-go until a separate promotion gate approves runtime/service
ownership, durable storage/auth/export scope, and release-grade visual
evidence. The current workbench now surfaces source promotion candidates in
the evidence rail so the frozen scope is visible in product UI, not just in
planning docs.

## 2026-06-07 Productization Checklist

This checklist is the intake contract for `TASK-2026W24-PROD-006`. It does not
approve product movement; it defines what a future promotion request must bring
before @quality can issue a Go decision.

| Check | Required Evidence | Blocking If Missing |
| --- | --- | --- |
| Runtime and service owner | Named owner for app runtime, deploy target, incident response, and follow-up maintenance | Yes |
| Product route and module boundary | Approved route such as `/review-console/workbench/:projectId` plus module ownership; no file movement before approval | Yes |
| Auth and access control | User/project access model, denied-state behavior, and no browser-visible provider credentials or base URLs | Yes |
| Durable audit storage | Retention, deletion receipt, export limits, compact record schema, and raw-payload rejection tests | Yes |
| Export workflow | Explicit export endpoint or artifact boundary with size caps and no raw prompt/provider body leakage | Yes |
| Review decisions | Append-only accept/block/follow-up semantics tied to compact audit evidence; no direct MapSpec mutation path | Yes |
| Visual release evidence | Repeatable browser smoke plus release-grade visual snapshot or explicit quality waiver for non-rendering scope | Yes |
| Resource policy | URL, worker, tile, and external asset behavior checked against resource-policy implementation/tests/docs | Yes |
| MCP contract | No new tool names; any public AI behavior keeps inputSchema/outputSchema and structured diagnostics | Yes |
| Rollback plan | Clear rollback or de-promotion path if hosted/product rollout exposes credential, storage, or rendering defects | Yes |

Until every blocking row has current evidence, AI Map Workbench remains
local/example-scoped under `examples/ai-map-workbench`.

## 2026-06-08 No-Go Reaffirmation

The SDK+CLI release runner, packed install smoke, and PMTiles display/load-plan
promotion do not change AI Map Workbench scope. `TASK-2026W24-PROD-006`
remains No-go for hosted/product movement until the productization checklist
above has current evidence for runtime/service ownership, auth, durable
storage, export scope, release-grade visual evidence, and rollback.

## 2026-06-10 Product-Promotion Intake Closure

Checked at `2026-06-09T16:46:38Z` (`2026-06-10` Asia/Shanghai) for
`TASK-2026W24-PROD-010` / GitHub issue
[#4](https://github.com/HYNCM/gis-engine/issues/4).

Decision: the product-promotion intake is complete as a planning artifact.
Product app movement, hosted deployment, durable storage implementation, auth
implementation, and file movement remain No-go until a future Go issue consumes
this intake and passes @quality.

### Named Owners

| Responsibility | Owner | Scope Before Promotion | Status |
| --- | --- | --- | --- |
| Product owner | `@product` | Owns product requirements, route value, access model, audit/export policy, and W25 priority recommendation. | Named |
| Runtime/service owner | `@builder` | Owns future service implementation, deploy target, incident response hooks, rollback mechanics, and follow-up maintenance for any product route. | Named |
| Release gate owner | `@quality` | Owns future Go/No-go, visual evidence acceptance, resource-policy review, MCP contract review, and waiver approval. | Named |
| Planning/state owner | `@orchestrator` | Serializes accepted promotion state into planning docs or GitHub Issues; no execution agent writes planning state directly. | Named |

### Route and Module Boundary

The approved future boundary for a separate promotion request is a
product-owned review surface at `/review-console/workbench/:projectId`, backed
by a future module under `apps/review-console/workbench` or an equivalent
product app boundary approved by @orchestrator before file movement.

`examples/ai-map-workbench` remains the local reference implementation. No file
may be moved from the example into a product app during intake closure. A
future movement task must name the owning package, route, server module,
browser bundle, storage migration boundary, and rollback target before the
first code move.

### Auth, Access Control, and Secret Policy

Any future product route must use authenticated user identity plus
project-scoped membership. The minimum roles are:

| Role | Allowed Actions |
| --- | --- |
| Viewer | Read compact review evidence and exported non-sensitive manifests for authorized projects. |
| Reviewer | Create append-only review decisions for authorized projects. |
| Admin | Manage project membership, retention settings, export caps, and deletion requests. |

Denied and unauthenticated states must be explicit UI/API states. Provider
base URLs, API keys, session secrets, and service credentials must stay
server-only. Browser metadata may expose provider id, display label, timeout
class, and resource-policy status, but not credentials or raw endpoint details.

### Durable Audit, Retention, Deletion, and Export

Future durable storage must be append-only and compact. The minimum record
shape is:

| Field | Purpose | Raw Payload Rule |
| --- | --- | --- |
| `record_id` | Stable audit id | Generated id only |
| `project_id` | Access-control scope | No project secret |
| `review_session_id` | Groups prompt-to-review evidence | Id only |
| `created_at` | Audit ordering | Timestamp only |
| `actor_ref` | Reviewer/user reference | Stable reference or hash; no personal free text |
| `decision_type` | `accept`, `block`, or `follow_up_required` | Enum only |
| `evidence_refs` | Links to compact manifest/audit ids | References only |
| `command_refs` | Links to command evidence ids | References only; no command body |
| `diagnostic_codes` | Structured blocker/status codes | Codes only |
| `map_spec_hash` | MapSpec identity under review | Hash only; no full `MapSpec` |

Retention defaults to 90 days for review records unless a product issue records
a shorter legal/security requirement. Increasing retention beyond 180 days
requires a separate @quality review. Deletion requests must return a deletion
receipt with receipt id, project id, requester reference, requested/completed
timestamps, deleted record count, retained tombstone hash, and policy version.

Export is capped to compact records only: default maximum `10_000` records or
10 MB per request, paginated JSONL plus a manifest hash. Exports must reject
raw prompt text, provider raw response bodies, credentials, screenshots, full
`MapSpec` payloads, command bodies, patches, and feature payload dumps.

### Review Decision Semantics

Review decisions stay append-only. `accept`, `block`, and
`follow_up_required` records may reference compact evidence and command ids,
but they must not mutate `MapSpec` directly. Any future map change triggered
after a review decision must still be expressed as `MapCommand` input and
applied through `applyCommands` with the existing validation and diagnostics
path.

### Visual Evidence and Quality Waiver

Waiver `QUALITY-WAIVER-AMW-P2-INTAKE-2026-06-10` applies only to this
planning-only intake closure and is recorded in
`docs/reviews/quality-waiver-amw-p2-intake-2026-06-10.md`. The scope changes
docs and issue evidence only; it does not touch renderer adapters, examples,
browser routes, resources, styles, snapshot fixtures, or UI code, so visual
output cannot change.

The waiver expires before any product route, file movement, auth/storage/export
implementation, external resource behavior, or visual presentation change.
That future movement must provide release-grade visual evidence or a fresh
@quality waiver.

### Resource Policy, MCP, and Rollback

- Resource policy: any future URL, tile, worker, provider, example asset, or
  external resource behavior must be checked against
  `packages/engine/src/spec/resource-policy.ts`,
  `tests/schema/resource-policy.test.ts`, and
  `docs/engineering/ci-test-strategy.md`.
- MCP contract: no new tool names are approved. Any future public AI behavior
  must keep the documented snake_case tool names and expose both
  `inputSchema` and `outputSchema`.
- Browser secret safety: no browser-side provider secrets, base URLs, raw
  provider responses, or raw prompts.
- Rollback/de-promotion: disable the product route feature flag, remove route
  navigation, freeze durable writes, export/delete compact records according to
  policy, revoke provider profiles, and keep
  `examples/ai-map-workbench` as the fallback reference surface.

Exit state: issue #4 may close for intake completion only. A future product Go
requires a new issue with implementation scope, owners, storage/auth/export
design, resource-policy evidence, MCP contract evidence, and release-grade
visual evidence.
