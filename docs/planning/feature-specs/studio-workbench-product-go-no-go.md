---
agent: product
period: 2026-W25
generated_at: 2026-06-10T05:35:49Z
repo_revision: "0254a8576bfe54b764e68966235b4dc7f84b4aca"
inputs:
  - docs/planning/feature-specs/ai-map-workbench-promotion-scope.md
  - docs/reviews/prod-010-ai-map-workbench-promotion-intake-2026-06-10.md
  - docs/reviews/quality-waiver-amw-p2-intake-2026-06-10.md
  - apps/studio/README.md
  - examples/ai-map-workbench/README.md
  - https://github.com/HYNCM/gis-engine/issues/13
owner: "@product @quality"
decision_level: advisory
---

# Studio And Workbench Product Go/No-Go

## Decision

Studio and AI Map Workbench remain **No-go for hosted/product promotion** in
W25. They are valid local/reference surfaces, but they are not the primary
adoption promise and must not be moved into a hosted product path without a
separate Go issue.

The W25 product surface remains SDK+CLI first.

## Current Surface Status

| Surface | Current Status | Allowed Use | Blocked Until Future Go |
| --- | --- | --- | --- |
| `packages/cli` | Primary adoption surface | SDK+CLI generation, preflight, artifact verification, provider smoke | None for W25 adoption evidence |
| `apps/studio` | Local developer surface | Local inspection and development workflows | Hosted route, durable storage, auth, product support promise |
| `examples/ai-map-workbench` | Local/reference example | Provider profile, audit, review-action, and evidence-reference behavior | Product route, browser-visible provider credentials, durable audit store |

## Go Checklist

Every row is blocking for any future hosted/product movement.

| Check | Required Evidence | Current W25 Reading |
| --- | --- | --- |
| Product owner | Product owner for route value, access model, and support policy | Named in intake, not enough for Go |
| Runtime/service owner | Deploy target, incident response, maintenance owner, and rollback owner | Named in intake, implementation absent |
| Route/module boundary | Approved product route and owning module before file movement | Candidate route exists; no movement approved |
| Auth/access control | User/project membership, denied states, and server-only credentials | Not implemented |
| Durable audit storage | Append-only compact record schema, retention, deletion receipt, and raw-payload rejection tests | Not implemented |
| Export workflow | Export endpoint/artifact boundary, size caps, and no raw prompt/provider body leakage | Not implemented |
| Review decisions | Append-only accept/block/follow-up semantics tied to compact evidence | Local/reference behavior only |
| Resource policy | URL, tile, worker, example, and external asset behavior covered by implementation/tests/docs | Must be refreshed for any route move |
| MCP contract | No new tool names; public AI behavior keeps input/output schemas and diagnostics | No new MCP work approved |
| Visual release evidence | Repeatable browser smoke plus visual snapshot or approved non-rendering waiver | Not present for hosted route |
| Rollback plan | Feature flag/route disablement, storage freeze, export/deletion plan, provider revocation | Intake describes target; no drill evidence |

## Explicit No-Go Boundaries

- Do not move Workbench files from `examples/` into a product app during W25.
- Do not expose provider API keys, base URLs, session secrets, or service
  credentials in the browser.
- Do not add a durable database or hosted route without auth/storage/export
  tests.
- Do not add MCP tool names for Studio or Workbench promotion.
- Do not turn review actions into a second `MapSpec` mutation path.
- Do not claim hosted/product readiness in README, roadmap, release notes, or
  examples before @quality accepts a future Go issue.

## Active Go Issue

Active P0 gate:

`TASK-2026W28-STUDIO-001: Review-console Workbench product route Go gate`
([#25](https://github.com/HYNCM/gis-engine/issues/25)).

It may move only a feature-flagged review-console candidate route and compact
audit/review evidence forward. Hosted GA, production auth, deployment,
monitoring, and support policy remain No-go until #25 receives a @quality
decision and a separate launch issue approves those production responsibilities.
