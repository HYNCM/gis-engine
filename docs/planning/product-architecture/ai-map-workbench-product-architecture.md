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
