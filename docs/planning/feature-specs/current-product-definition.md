---
agent: product
period: 2026-W25
generated_at: 2026-06-14T00:00:00Z
repo_revision: "unknown"
inputs:
  - README.md
  - packages/cli/README.md
  - packages/engine/README.md
  - packages/ai/README.md
  - docs/planning/monthly-roadmap.md
  - docs/planning/weekly-digest.md
  - docs/planning/issues-snapshot.md
  - docs/planning/feature-specs/pmtiles-runtime-query-promotion-boundary.md
  - docs/planning/feature-specs/studio-workbench-product-go-no-go.md
owner: "@product"
decision_level: advisory
---

# Current Product Definition

## Objective

GIS Engine is an AI-native, schema-first map SDK + CLI product line. The
current product surface is the developer adoption path: validate a `MapSpec`,
apply commands, generate a reviewable bundle, preflight the result, and verify
generated artifacts with deterministic evidence.

This repo does not currently define itself as a hosted Workbench product, a
stable SceneView3D runtime, or a full cloud-native data runtime. Those remain
bounded by explicit no-go or promotion-gate docs.

## Current Product Surface

| Surface | Status | What It Is For | What It Is Not For |
| --- | --- | --- | --- |
| `@gis-engine/engine` | primary | schema-first runtime, command application, diagnostics, snapshots, adapter contracts | renderer replacement, hidden state mutation, ad hoc runtime edits |
| `@gis-engine/ai` | primary | MCP tools, generation evidence, structured handoff data | new tool aliases, renderer internals, free-form prompt parsing |
| `@gis-engine/cli` | primary | scaffold, generate, preflight, artifact verification, first-run acceptance | hosted product route, opaque generate output, unverified artifact delivery |
| `apps/studio` / `examples/ai-map-workbench` | reference | local example and review surface | hosted/product promotion in the current cycle |
| `scene3d` / PMTiles query / cloud-native data runtime | bounded | evidence and promotion gates | stable runtime claims without a dedicated future issue |

## Success Criteria

- A developer can start from the CLI, generate a project, and build the
  generated app.
- The generated app path stays reviewable with preflight, manifest, snapshot,
  and raw-prompt-retention checks.
- First-run and provider smoke evidence remain repeatable and machine-readable.
- Product boundaries remain explicit in docs so the team does not confuse
  reference surfaces with the primary adoption surface.

## Boundaries

- Always: keep schema-first validation, command-only mutation, structured diagnostics, and deterministic smoke evidence.
- Ask first: any new public tool, hosted route, runtime parser/query promise, or resource-policy expansion.
- Never: promote Studio/Workbench hosted movement, stable `view.mode: "scene3d"`, or PMTiles runtime query without a dedicated gate.

## Open Questions

- Which next adoption friction is most important to reduce: first-run reporting,
  generated-app review UX, or provider smoke clarity?
- Should the next execution slice focus on docs/report structure or on CLI
  behavior that makes the reports easier to consume?
