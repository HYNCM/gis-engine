---
agent: product-strategist
period: 2026-W23
generated_at: 2026-06-01T16:43:00Z
repo_revision: "0cb58c0d3f5d1a77a6b965cc0d87cc9cd5252ec4"
inputs:
  - docs/reviews/amw-010-product-promotion-go-no-go-2026-06-02.md
  - docs/planning/feature-specs/ai-map-workbench-product-boundary.md
  - docs/planning/feature-specs/ai-map-workbench-provider-administration.md
  - docs/planning/feature-specs/ai-map-workbench-durable-audit.md
  - docs/planning/feature-specs/ai-map-workbench-review-actions.md
  - docs/research/competitor-updates-2026-W23.md
owner: "@product-strategist @task-distributor"
decision_level: advisory
---

# AI Map Workbench Product Implementation

## Purpose

Open the fresh implementation planning loop required after the AMW-010
product-promotion No-go. This spec turns the accepted blockers into bounded
tasks with disjoint owners. It does not promote `examples/ai-map-workbench` into
a product app, deploy a hosted service, add auth, add a durable database, or add
new MCP tool names.

## Accepted Starting State

- The local provider-gated example remains Go under `examples/ai-map-workbench`.
- Product app movement and hosted promotion remain No-go.
- Provider credentials stay server-only.
- Browser requests send only prompt text and provider id.
- Provider output still normalizes into planner intent before mutation.
- Runtime mutation still goes through `applyCommands`.
- Current audit records remain latest-50, in-memory, bounded, and payload-free.
- Review actions are design-only; there is no review decision UI or endpoint.
- Browser smoke exists for the local example, but not release-grade product
  workflow visual evidence.

## Product Implementation Boundary

The first implementation loop may harden the local example and its future
product contract, but it must not silently cross into production hosting.

Allowed:

- Server-side provider base URL validation and blocked-resource diagnostics.
- Provider request timeout, abort, and response byte-cap enforcement.
- Browser-safe provider metadata hardening.
- Append-only review decision schemas and local UI/API controls, after provider
  enforcement is in place.
- Durable audit contract and authorized export planning, followed by a scoped
  implementation task only if access-control semantics are explicit.
- Repeatable UI smoke or visual evidence for provider selector, evidence rails,
  audit, and review-action states.

Blocked until a later Go decision:

- Moving the workbench out of `examples/`.
- Hosted deployment, auth, user accounts, secret manager, or product admin UI.
- Browser-configured provider URLs or browser-visible credentials.
- Raw prompt, raw provider body, command body, patch, screenshot, feature
  payload, or full `MapSpec` retention.
- Direct provider commands or browser-side `MapSpec` mutation.
- New MCP tool aliases.
- MapLibre package movement or stable SceneView3D runtime promotion.

## Task Slices

1. `AWP-001`: freeze this product implementation boundary and sprint DAG.
2. `AWP-002`: implement provider resource enforcement and request limits.
3. `AWP-003`: define product app ownership, route/module boundary, and project
   model before any file movement.
4. `AWP-004`: implement or scaffold authorized durable audit/export only after
   access-control and retention semantics are explicit.
5. `AWP-005`: implement command-safe review decisions as append-only evidence,
   not as a second map mutation path.
6. `AWP-006`: add repeatable UI smoke or visual evidence for provider,
   evidence, audit, and review-action states.
7. `AWP-007`: run a quality-guardian/coordinator product implementation
   Go/No-go gate.

## AWP-002 Acceptance

The next executable task is provider resource enforcement because it reduces
the highest security and AI-safety risk without requiring product promotion.

`AWP-002` must prove:

- Custom provider base URLs are validated server-side before a profile is
  enabled.
- Non-HTTPS provider URLs are blocked outside local test fixtures.
- Private network, localhost, link-local, file, data, and blob targets are
  blocked for product-mode custom providers.
- Provider HTTP requests have deterministic timeout/abort behavior.
- Provider response bodies are byte-capped before JSON parsing.
- Diagnostics use stable paths: `/providerProfile/baseUrl`,
  `/providerRequest/timeout`, `/providerRequest`, and `/providerResponse/size`.
- Browser-visible provider metadata still excludes base URLs, credential
  variable names, credentials, request headers, raw prompts, raw bodies, and
  provider error bodies.
- Failed or blocked provider paths do not mutate the active `MapSpec`.
- Focused tests cover ready, missing credential, blocked resource, timeout,
  oversized response, provider failure, unsafe output, stale revision, and no
  leak regressions.

## Promotion Rule

Passing `AWP-002` does not make product promotion Go. Product movement requires
the later `AWP-007` gate to accept provider enforcement, durable authorized
audit, review-action runtime, product ownership, and repeatable visual evidence.

## AWP-003 Acceptance

`AWP-003` must document product ownership before durable audit or review-action
runtime work:

- `@product-strategist` owns the product contract and review-console alignment.
- `@coordinator` owns single-writer planning state and promotion gate language.
- `@docs-agent` owns public wording alignment after user-facing behavior
  changes.
- Runtime/service ownership is still unassigned, so hosted/product movement
  remains blocked.
- Future product movement, if approved by `AWP-007`, is reserved for
  `apps/review-console` with route shape `/review-console/workbench/:projectId`.
- Current implementation remains under `examples/ai-map-workbench`.
- Future project identity must use opaque `projectId`, session, map revision,
  payload-free audit cursor, and append-only review decision references, not raw
  prompts, provider bodies, command bodies, feature payloads, screenshots, or
  full `MapSpec` retention.

## 2026-06-02 AWP-002 Addendum

`AWP-002` is captured in
`docs/reviews/awp-002-provider-resource-enforcement-2026-06-02.md`. Provider
resource enforcement is now implemented in the local example boundary:
server-side base URL policy blocks unsafe targets before fetch, provider
requests use timeout/abort behavior, provider responses are byte-capped before
JSON parsing, and browser-visible provider metadata remains credential- and
URL-free. Product promotion remains No-go. The next task is `AWP-003` product
app ownership and project model definition.

## 2026-06-02 AWP-003 Addendum

`AWP-003` is captured in
`docs/reviews/awp-003-product-ownership-project-model-2026-06-02.md`. Product
ownership, future route/module boundary, project identity semantics, and No-go
language are documented without moving files or promoting hosted use. The next
task is `AWP-004` authorized durable audit contract.
