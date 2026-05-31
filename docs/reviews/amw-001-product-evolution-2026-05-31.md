---
agent: coordinator
period: 2026-W22
generated_at: 2026-05-31T04:48:00Z
repo_revision: "99e7944"
inputs:
  - examples/ai-map-workbench
  - docs/superpowers/specs/2026-05-31-ai-map-workbench-design.md
  - docs/superpowers/plans/2026-05-31-ai-map-workbench.md
  - tests/examples/ai-map-workbench.test.ts
  - tests/examples/examples.test.ts
  - docs/planning/task-burndown.md
owner: "@coordinator"
decision_level: advisory
---

# AMW-001 Product Evolution Review

## Decision

The AI Map Workbench is accepted as a runnable product-evolution candidate for
the generated-app review loop. It is not a production app package and not a
real model integration. Its value is the end-to-end review surface: prompt,
command-only mutation, MapLibre rendering, structured evidence, feature query,
and an immersive review mode in one browser page.

## Evidence

| Signal | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Runnable local review surface exists | `examples/ai-map-workbench`; commits `20743a8`, `8e8026e`, and `99e7944`; `pnpm check` passed after local-listen permissions were available. | Product reviewers can inspect AI map edits without reading raw JSON or standing up a separate app shell. | Keep this example as the thin review surface for the next generated-app UX iteration. | high |
| Mutation path remains engine-governed | `server.mjs` maps local mock prompts to `MapCommand` values and commits only through `applyCommands`; browser code receives returned style/evidence. | The demo exercises the AI-native command path instead of teaching a parallel browser mutation model. | Future provider work must emit structured commands or command skeletons, never free-form browser mutations. | high |
| Query evidence became visible to the user | `/api/query` routes clicks through engine adapter query behavior and the UI renders feature properties such as `West Lake`. | Spatial-readiness work is now visible in the review loop, not buried in backend tests. | Reuse the right-panel evidence pattern for generated-app review cards. | high |
| Immersive map review is supported | `99e7944` adds collapsible left/right rails; browser check observed map/canvas width expand from `497` to `775` with the chat rail collapsed and to `1053` with both rails collapsed. | Reviewers can shift between evidence-heavy inspection and map-first inspection without losing recovery controls. | Treat collapsible evidence/chat rails as a candidate interaction pattern for the generated-app review console. | medium |
| Scope remains bounded | The example uses a local mock planner only; no external model API, no new MCP tool names, no file writes from browser UI, no stable SceneView3D claim. | The demo can evolve without weakening existing schema, MCP, resource-policy, or renderer-promotion guardrails. | Open a separate provider-boundary task before wiring any real model. | high |

## Product Evolution Tasks

The next product slice should move from a local demo to a gated review-console
candidate, in this order:

1. Freeze the provider boundary: real-model output must be converted to typed
   command skeletons or `MapCommand` values before mutation, with the mock
   planner retained as deterministic fallback.
2. Add acceptance fixtures for the workbench review surface: ready, unsupported,
   command-applied, query-ready, and evidence-collapsed states.
3. Decide the promotion gate for moving the workbench from `examples/` into a
   product-facing generated-app review console.

## Verification

- `pnpm check` - passed on the AMW UI state after rerunning with local
  `127.0.0.1` listen permission.
- Browser smoke - passed at `http://127.0.0.1:4321/`: left/right collapse,
  restore, red prompt command, and `West Lake` feature query.
- `node scripts/evolution-collector.mjs --help` - ran the current collector and
  reported that the `2026-W22` evolution-ledger entry already exists, so this
  review does not hand-edit `docs/planning/evolution-ledger.md`.
