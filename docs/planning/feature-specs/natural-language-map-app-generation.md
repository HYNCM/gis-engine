---
agent: product-strategist
period: 2026-W23
generated_at: 2026-05-29T07:32:17Z
repo_revision: "7c8aabd471a20a4ec737fa82becb043a97cb27da"
inputs:
  - AGENTS.md
  - docs/research/competitor-updates-2026-W22.md
  - docs/research/capability-scorecard.md
  - docs/reviews/ai-orchestration-capability-summary-2026-05-27.md
  - docs/planning/sceneview3d-src-006-stable-runtime-decision-2026-05-29.md
  - docs/reviews/nla-002-generation-command-contract-2026-05-29.md
  - docs/reviews/nla-003-mcp-orchestration-evidence-2026-05-29.md
  - docs/reviews/nla-004-generation-scenarios-2026-05-29.md
  - docs/reviews/nla-005-scene-browsing-extension-boundary-2026-05-29.md
  - docs/reviews/nla-006-prompt-evidence-scenarios-2026-05-29.md
owner: "@product-strategist"
decision_level: advisory
---

# Natural-Language Map App Generation

## Product Goal

A user should be able to describe a map application in natural language and get
a verifiable GIS Engine output: a schema-valid `MapSpec`, command-only edit
trace, structured diagnostics, deterministic snapshot evidence, and an
exportable example app manifest.

This is a product orchestration plan. It does not add a free-form natural
language runtime, does not add MCP tool aliases, and does not enable stable
`view.mode: "scene3d"`.

## Current Decision

- Evidence: ArcGIS Maps SDK JS documents agentic mapping applications with a
  natural-language primary UI, map-scoped context, tools, and agent
  orchestration.
- Impact: product; prompt-driven map creation is now a mainstream expectation.
- Action: make GIS Engine's differentiator evidence-first generation: every
  generated output must be inspectable, replayable, and exportable.
- Confidence: high.

## User Workflow

1. User describes the desired map application.
2. AI calls `get_context_summary` or `explain_spec` and reads
   `capabilitySummary`.
3. AI classifies the request into `feature-display`, `spatial-analysis`, and
   `scene-browsing` domains.
4. AI calls `planMapGenerationRequest()` with prompt hash plus structured
   intent; raw prompt text is not retained by default.
5. AI creates a `MapGenerationCommandSkeleton` from schema-valid request data.
6. AI calls `validate_spec` before mutation is accepted.
7. AI calls `apply_commands` for command-only edits, with trace metadata.
8. AI calls `snapshot_spec`, `export_spec`, and `export_example_app` for
   evidence and delivery.
9. User reviews diagnostics, command trace, snapshot status, and export
   manifest before treating the app as generated.

## Capability Boundaries

| Domain | Status | Allowed Product Claim | Blocked Claim |
| --- | --- | --- | --- |
| `feature-display` | supported | 2D sources, layers, styles, PMTiles/vector evidence, snapshots, and example app export can be generated through schemas and commands. | AI may not bypass validation or mutate runtime state outside commands. |
| `spatial-analysis` | experimental | Current planning may use point/bbox query readiness and capability metadata. | Do not claim buffer, intersection, overlay, routing, or aggregation as public MCP tools. |
| `scene-browsing` | extension-only | `extensions.scene3d` can be planned, validated, and explained as evidence. | Stable `view.mode: "scene3d"` remains blocked after SRC-006 No-go. |
| app export | supported as evidence | `export_example_app` is the delivery exit with manifest-backed assets. | Natural language text alone is never the source of truth. |

## Generation Evidence Bundle

Every generated app handoff should name:

- prompt hash, planner confidence/provenance, and unsupported intent fields;
  raw prompt text is not retained by default;
- capability domain classification;
- `MapSpec` validation result and diagnostic counts;
- command list, dry-run/replay/rollback status when commands are used;
- snapshot summary and any visual evidence requirements;
- export manifest and example app files;
- blocked or experimental capability explanations.

## Priority Scoring

| Item | Competitor Threat | AI Operability Gain | User Value | Debt Reduction | Delivery Risk | Score | Recommendation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Natural-language generation product spec | 8 | 9 | 9 | 5 | 4 | 7.95 | P0 |
| Typed prompt planner boundary | 8 | 9 | 9 | 6 | 4 | 8.15 | P0 |
| Generation evidence bundle | 7 | 9 | 8 | 7 | 5 | 7.55 | P0 |
| Spatial-analysis readiness contract | 7 | 8 | 8 | 6 | 6 | 7.10 | P0 |
| Example app generation DX | 5 | 7 | 8 | 5 | 4 | 6.25 | P1 |
| Scene browsing boundary refresh | 5 | 7 | 6 | 5 | 5 | 5.95 | P1 |

## Acceptance Criteria

- `get_context_summary` and `explain_spec` remain the discovery path for
  supported, experimental, and blocked domains.
- Public inputs remain TypeBox-described and Ajv-validated.
- Prompt planner inputs/results remain schema-described, preserve prompt hashes
  and trace metadata, and reject raw prompt retention by default.
- Runtime mutations go only through `MapCommand` and `applyCommands`.
- Public MCP tool descriptors continue to expose `inputSchema` and
  `outputSchema`.
- Stable `view.mode: "scene3d"` remains blocked unless a future
  `quality-guardian` gate and `coordinator` decision record a Go.

## Implementation Evidence

- `TASK-2026W23-NLA-002` adds the engine-side generation command skeleton:
  `MapGenerationRequestSchema`, `MapGenerationCommandSkeletonSchema`, and
  `createMapGenerationCommandSkeleton()`.
- Generated capability, view, source, layer, interaction, and extension-only
  SceneView3D edits are represented as `MapCommand[]` and replayed through
  `applyCommands`.
- `TASK-2026W23-NLA-003` adds `GenerationEvidenceBundleSchema` and
  `createGenerationEvidenceBundle()` so existing MCP tool results can be
  handed off as one structured evidence package without adding new tool names.
- `TASK-2026W23-NLA-004` adds minimum generated scenarios for feature display
  and spatial-analysis readiness, including generated style edits, dry-run,
  replay, rollback, query readiness, and blocked analysis diagnostics.
- `TASK-2026W23-NLA-005` keeps scene browsing under `extensions.scene3d`,
  rejects stable `view.mode: "scene3d"` generation, and verifies that renderer
  dependencies stay outside engine and AI packages.
- `TASK-2026W23-NLA-006` adds prompt-level evidence scenarios that compose
  command replay, snapshot, export, and example evidence for feature display,
  spatial-analysis readiness, scene browsing extension-only, and stable 3D
  blocked prompts.
- `TASK-2026W23-NLQ-001` adds the typed planner boundary:
  `MapGenerationPromptPlannerInputSchema`, `MapGenerationPromptPlanSchema`, and
  `planMapGenerationRequest()` convert prompt hashes plus structured intent
  into `MapGenerationRequest`-compatible handoff data without retaining raw
  prompt text by default.
- `TASK-2026W23-NLQ-002` adds `plannerEvidence` to
  `GenerationEvidenceBundleSchema` so handoff output includes planner
  confidence, prompt/trace provenance, accepted/unsupported intent fields,
  source prompt hashes, and planner diagnostics.
- Spatial-analysis requests remain readiness-only, and stable
  `view.mode: "scene3d"` generation remains blocked with structured blocker
  diagnostics.
