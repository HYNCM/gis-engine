---
agent: product-strategist
period: 2026-W22
generated_at: 2026-05-31T05:05:00Z
repo_revision: "01636ff"
inputs:
  - docs/planning/feature-specs/ai-map-workbench-real-system-evolution.md
  - docs/reviews/amw-001-product-evolution-2026-05-31.md
  - docs/planning/feature-specs/generated-app-review-console.md
  - packages/engine/src/generation/promptPlanner.ts
  - packages/engine/src/generation/commandSkeleton.ts
  - packages/ai/src/tools/generationEvidence.ts
  - examples/ai-map-workbench
owner: "@product-strategist"
decision_level: advisory
---

# AI Map Workbench Product Architecture

## Product Positioning

AI Map Workbench should become the first productized review surface for
AI-assisted GIS generation. It is not a direct chat-to-map mutator. It is a
review console that lets a human or agent inspect prompt intent, provider
normalization, command replay, diagnostics, spatial query readiness, delivery
status, and audit history before accepting a generated map state.

The product architecture keeps the current `examples/ai-map-workbench` as the
prototype shell until the promotion gate decides whether to create a dedicated
product app. The first productized phase is provider-gated and local: real model
providers are optional server-side inputs, while mock mode remains the default
test oracle.

## Architecture Principles

- Schema first: provider output must normalize into the existing generation
  planner schema before command creation.
- Command-only mutation: all committed map changes go through `MapCommand` and
  `applyCommands`.
- Evidence as product surface: readiness, diagnostics, command trace, query
  evidence, and delivery state are rendered from structured fields.
- Provider isolation: model adapters never return browser JavaScript, raw
  `MapSpec` patches, hidden network fetches, or direct renderer mutations.
- Payload-free audit: session history stores trace metadata and counts, not raw
  prompts, raw feature payloads, screenshots, or credentials.
- Adapter boundary: rendering remains behind MapLibre and future adapter
  contracts; stable SceneView3D runtime stays blocked until a separate gate.

## Logical Components

| Component | Owner | Responsibility | Boundary |
| --- | --- | --- | --- |
| Review Console UI | `@docs-agent`, `@qa-agent` | Prompt entry, map review, evidence cards, query inspection, acceptance status, session timeline. | No direct `MapSpec` or MapLibre mutation beyond rendering returned state. |
| Workbench Orchestrator API | `@ai-agent`, `@engine-agent` | Session state, provider selection, prompt hash, command transaction, query endpoint, evidence assembly, audit log. | Does not store provider credentials in browser-visible state. |
| Provider Boundary | `@ai-agent` | Normalize provider output into planner input, reject unsafe output, expose provider evidence. | No raw prompt retention by default; no free-form mutation output. |
| GIS Generation Core | `@engine-agent` | `planMapGenerationRequest`, `createMapGenerationCommandSkeleton`, `applyCommands`, validation, diagnostics. | No renderer-specific dependencies in core contracts. |
| Evidence And Delivery | `@ai-agent`, `@qa-agent` | `createGenerationEvidenceBundle`, delivery status, source readiness, spatial query readiness, export/snapshot evidence. | No prose parsing for acceptance decisions. |
| Resource And Credential Policy | `@engine-agent`, `@quality-guardian` | Server-only provider configuration, URL/resource checks, confirmation boundaries, release gates. | No hidden IO or browser-side secrets. |

## End-To-End Flow

```txt
user prompt
  -> Workbench Orchestrator creates promptHash and traceId
  -> Provider Boundary selects mock or configured provider
  -> Provider output normalizes to MapGenerationPromptPlannerInputSchema
  -> planMapGenerationRequest returns a structured plan or diagnostics
  -> createMapGenerationCommandSkeleton builds commands and candidate spec
  -> applyCommands commits or rejects the transaction
  -> createGenerationEvidenceBundle records planner, command, query, delivery, snapshot, and export evidence
  -> Review Console renders map state, diagnostics, evidence, and audit timeline
```

## Product Stages

| Stage | Scope | Exit Gate |
| --- | --- | --- |
| Prototype example | Current `examples/ai-map-workbench` with mock planner, MapLibre map, query panel, and collapsible review rails. | AMW-001 accepted with browser and `pnpm check` evidence. |
| Provider-gated local system | Add provider normalizer, injected provider mode, provider evidence, and bounded session audit. | AMW-002/AMW-003/AMW-004 gates pass; no direct mutation or raw prompt retention. |
| Generated-app review console | Promote stable interaction patterns into a product app boundary with acceptance states and review sections. | Quality gate decides example-to-product promotion and required visual/resource checks. |
| Hosted real system | Add auth, projects, persistent audit, provider configuration, credential isolation, observability, and deployment. | Separate security/resource policy review and release gate. |

## AMW-002 Product Contract

AMW-002 owns the provider boundary only. It should add:

- a provider output normalizer in `packages/ai`;
- AI contract tests for structured provider intent and unsafe provider output;
- exports from `@gis-engine/ai` for the normalizer and types;
- planning/review docs that keep the next server/UI/audit work queued.

AMW-002 should not add a real external provider call, provider credentials,
browser-visible secrets, hosted deployment, durable storage, or product app
promotion.

## Open Decisions

| Decision | Default For AMW-002 | Future Promotion Question |
| --- | --- | --- |
| App boundary | Stay under `examples/ai-map-workbench`. | Move to `apps/review-console` only after provider, UI evidence, audit, and quality gates land. |
| Provider runtime | Dependency-injected provider contract, mock default. | Add real provider adapters only after credential/resource review. |
| Audit storage | Bounded in-memory records. | Add durable storage with retention, export, and privacy policy. |
| Acceptance workflow | Evidence-only display. | Add explicit accept/block/follow-up actions after review-console promotion. |
| Deployment | Local server. | Hosted service requires auth, rate limit, observability, and security review. |

## AMW-004 Gate Decision

The 2026-05-31 promotion gate accepts AI Map Workbench as a provider-gated local
system and keeps it under `examples/ai-map-workbench`. It is not promoted to a
product app, hosted service, or real-provider integration yet. Promotion requires
a separate app boundary spec, credential/resource-policy review, durable audit
design, repeatable visual evidence, and explicit accept/block/follow-up review
actions.

## 2026-06-01 AMW-006 Addendum

AMW-005 added optional server-side OpenAI-compatible provider profiles while
preserving the local/example boundary: browser code sees safe provider metadata
and sends only `providerId`; the server owns credential lookup, provider calls,
normalization, command application, and payload-free audit evidence.

AMW-006 opened the product-boundary planning batch, AMW-007 completed provider
credential/resource administration as a design handoff, AMW-008 completed
durable audit retention/export as a design handoff, AMW-009 completed
command-safe review action design as a design handoff, and AMW-010 closed the
promotion gate as No-go. The workbench remains under
`examples/ai-map-workbench`; future product movement requires a fresh planning
loop before any product app boundary, hosted deployment, persistent audit
storage, or review-action runtime is implemented.

AWP-001 opens that fresh planning loop in
`docs/planning/feature-specs/ai-map-workbench-product-implementation.md` and
`docs/planning/sprint-2026-W23-ai-map-workbench-product-implementation.md`.
The first executable task is provider resource enforcement, not product app
movement: server-side base URL policy, timeout/abort, response byte caps,
stable diagnostics, and leak regression tests must land before durable audit or
review-action runtime work.

AWP-002 implements that provider resource enforcement inside the current example
boundary. It fed AWP-003 product ownership, route/module boundary, project
identity model, and non-go language before any product app movement or hosted
deployment.

## 2026-06-02 AWP-003 Addendum

AWP-003 defines product ownership and project identity in
`docs/reviews/awp-003-product-ownership-project-model-2026-06-02.md`. The
current implementation remains under `examples/ai-map-workbench`; future product
movement, if approved by AWP-007, is reserved for `apps/review-console` with
route shape `/review-console/workbench/:projectId`. The minimum project model
uses an opaque `projectId`, session id, map id, revision, payload-free audit
cursor, and append-only review decision references. Runtime/service ownership is
still unassigned, so hosted deployment remains No-go.

## 2026-06-02 AWP-004 Addendum

AWP-004 adds `examples/ai-map-workbench/audit-contract.mjs` as a pure durable
audit contract scaffold. It defines compact record/export/deletion shapes,
project-scoped role authorization, export and deletion caps, and raw-payload
rejection without changing `/api/audit` storage behavior. Durable database,
export endpoint, auth UI, and hosted deployment remain No-go.

## 2026-06-01 AMW-007 Addendum

AMW-007 defines provider credential/resource administration in
`docs/planning/feature-specs/ai-map-workbench-provider-administration.md`. The
design records current server-only profile behavior and reserves future gates
for base URL policy, timeout/abort behavior, response size caps, and public
metadata validation. Product promotion remains blocked; the next product
architecture gap has advanced to command-safe review action design after
AMW-008.

## 2026-06-01 AMW-008 Addendum

AMW-008 defines durable audit retention/export in
`docs/planning/feature-specs/ai-map-workbench-durable-audit.md`. The design
keeps the current local audit endpoint as latest-50 in-memory evidence and
reserves future product-mode gates for retention windows, privacy rules,
project-scoped access, JSON export shape, payload caps, hard deletion, and
payload-free deletion receipts. Product promotion remains blocked; the next
product architecture gap is command-safe accept/block/follow-up review actions.

## 2026-06-02 AMW-009 Addendum

AMW-009 defines command-safe review actions in
`docs/planning/feature-specs/ai-map-workbench-review-actions.md`. Accept, block,
and follow-up-required outcomes are product decisions over compact evidence, not
map mutations, browser file writes, durable storage implementation, or hosted
promotion. Product promotion remains blocked until `AMW-010` runs a
quality-guardian/coordinator Go/No-go gate with the required visual, provider,
audit, and review-action evidence.
