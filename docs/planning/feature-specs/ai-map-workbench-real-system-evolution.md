---
agent: product-strategist
period: 2026-W22
generated_at: 2026-05-31T04:54:14Z
repo_revision: "55fbff4"
inputs:
  - docs/reviews/amw-001-product-evolution-2026-05-31.md
  - examples/ai-map-workbench
  - packages/engine/src/generation/promptPlanner.ts
  - packages/engine/src/generation/commandSkeleton.ts
  - packages/ai/src/tools/generationEvidence.ts
  - docs/planning/feature-specs/generated-app-review-console.md
owner: "@product-strategist"
decision_level: advisory
---

# AI Map Workbench Real-System Evolution

## Product Goal

Move AI Map Workbench from a local mock demo toward a real AI-assisted review
system without weakening GIS Engine contracts. The first real-system phase adds
a provider boundary, structured planner normalization, generation evidence, and
session auditability while keeping all map mutation behind `MapCommand` and
`applyCommands`.

This spec does not add a new MCP tool name, does not store provider
credentials, does not call a real model by default, does not write files from
the browser, and does not promote stable `view.mode: "scene3d"`.

## Users

- Product reviewer testing whether an AI map edit is safe to accept.
- Developer wiring a real model provider into a local or hosted workbench.
- QA agent verifying prompt, command, query, snapshot, and delivery evidence.
- Coordinator deciding whether the workbench can graduate from `examples/` to a
  generated-app review-console slice.

## Phase 1 Boundary

The first phase is a provider-gated local system, not production SaaS. It may
accept a provider implementation through server configuration or dependency
injection, but the provider must return structured intent that validates against
the existing generation planner schemas before any command is built.

Required flow:

```txt
user prompt
  -> promptHash + traceId
  -> provider output normalization
  -> MapGenerationPromptPlannerInputSchema
  -> planMapGenerationRequest
  -> createMapGenerationCommandSkeleton
  -> applyCommands
  -> createGenerationEvidenceBundle
  -> workbench review UI
```

The model provider is never allowed to return browser JavaScript, raw
`MapSpec` patches, direct style mutations, hidden network fetches, or file
writes. Unsupported provider output becomes structured diagnostics and leaves
the active map spec unchanged.

## System Components

| Component | Responsibility | Must Not Do |
| --- | --- | --- |
| Provider normalizer | Validate provider output against the existing prompt-planner input contract and produce a `MapGenerationPromptPlan`. | Retain raw prompt text by default or accept free-form command text as mutation evidence. |
| Workbench server | Own session state, provider selection, command application, query endpoint, and generation evidence assembly. | Let browser code mutate `MapSpec` directly or commit failed command replays. |
| Review UI | Show provider state, prompt hash, planner confidence, command evidence, diagnostics, query evidence, and delivery readiness. | Infer readiness from prose or hide blocker diagnostics behind an "applied" state. |
| Session audit log | Keep bounded in-memory records for prompt hash, trace id, provider id, command count, diagnostics, and revision transitions. | Store secrets, raw prompts, raw feature payloads, or screenshot data URLs. |

## Acceptance Rules

- Provider output must validate before command skeleton creation.
- The mock planner remains the deterministic fallback and test oracle.
- Every committed edit must pass through `applyCommands`.
- Diagnostics must use stable codes and paths; unsupported provider output must
  not become a natural-language-only error.
- The UI must show delivery and provider evidence from structured fields.
- Session audit records must be bounded and payload-free.
- Any future external provider call must be behind explicit server
  configuration and resource/credential review.

## Promotion Gates

| Gate | Required before phase completion |
| --- | --- |
| Schema and planner | Provider normalizer is covered by Ajv-backed planner schema tests. |
| Command safety | Provider-planned edits replay through `MapCommand` and `applyCommands`; failed replay does not commit. |
| AI evidence | `createGenerationEvidenceBundle` captures planner provenance, command evidence, query readiness, delivery status, and follow-up tasks. |
| Example server | `examples/ai-map-workbench` can run in mock mode and injected-provider mode. |
| UI review | Browser UI shows provider/evidence state and preserves collapsible map review. |
| Resource and credential policy | No provider key is stored in repo or browser; external calls remain opt-in server behavior. |
| Docs and wording | Docs state local/provider-gated support only and avoid production or stable 3D claims. |

## Non-Goals

- No hosted deployment or auth system in Phase 1.
- No durable database; audit log is bounded in memory.
- No raw prompt retention by default.
- No external model default; real providers are opt-in.
- No new MCP aliases.
- No generated app file writes.
- No new source loaders, geoprocessing execution, or stable SceneView3D runtime.

## Recommended Task Slice

1. `AMW-002`: implement provider output normalization and AI contract tests.
2. `AMW-003`: add injected-provider server mode, generation evidence, and UI
   review states.
3. `AMW-004`: add bounded session audit records and run the promotion gate that
   decides whether the workbench remains an example or graduates to the
   generated-app review console.

## 2026-06-01 Addendum

AMW-002 through AMW-005 are complete. AMW-005 added server-side provider
profiles while keeping credentials and provider calls on the server and keeping
the workbench under `examples/ai-map-workbench`.

The next slice is not direct promotion. `AMW-006` froze the product-boundary
plan in `docs/planning/feature-specs/ai-map-workbench-product-boundary.md` and
`docs/planning/sprint-2026-W23-ai-map-workbench-product-boundary.md`; `AMW-007`
completed provider credential/resource administration as a planning handoff.
Future code work must add base URL policy, timeout/abort, response size caps,
and identity-field validation before hosted or product use.

2026-06-01 AMW-008 update: durable audit retention/export design is complete as
a planning handoff. Future product-mode storage must keep audit records compact,
retention-bound, access-controlled, export-capped, and free of raw prompts,
provider bodies, credentials, feature payloads, screenshots, and full map specs.
At that point, the next planning task was `AMW-009` command-safe review action
design.

2026-06-02 AMW-009 update: command-safe review action design is complete as a
planning handoff. Future review decisions must stay compact, evidence-linked,
and free of direct `MapSpec` mutation, browser file writes, raw provider
payloads, command bodies, patches, screenshots, and new MCP tool names. The next
planning task is `AMW-010` product-promotion Go/No-go.
