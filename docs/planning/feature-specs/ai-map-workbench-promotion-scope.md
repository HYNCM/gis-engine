---
agent: product-strategist
period: 2026-W24
generated_at: 2026-06-05T16:36:16Z
repo_revision: "8a59577"
inputs:
  - docs/planning/feature-specs/ai-map-workbench-real-system-evolution.md
  - docs/planning/feature-specs/ai-map-workbench-product-boundary.md
  - docs/planning/feature-specs/ai-map-workbench-product-implementation.md
  - docs/planning/next-stage-goals-2026-06-06.md
  - docs/planning/technical-debt-report.md
owner: "@product-strategist @orchestrator"
decision_level: advisory
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
