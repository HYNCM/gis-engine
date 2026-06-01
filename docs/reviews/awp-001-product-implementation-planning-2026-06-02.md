---
agent: coordinator
period: 2026-W23
generated_at: 2026-06-01T16:43:00Z
repo_revision: "0cb58c0d3f5d1a77a6b965cc0d87cc9cd5252ec4"
inputs:
  - docs/reviews/amw-010-product-promotion-go-no-go-2026-06-02.md
  - docs/planning/feature-specs/ai-map-workbench-product-implementation.md
  - docs/planning/sprint-2026-W23-ai-map-workbench-product-implementation.md
  - command: npm view @arcgis/core version dist-tags --json
  - command: npm view @arcgis/ai-components version dist-tags --json
  - command: npm view @modelcontextprotocol/sdk version dist-tags --json
  - command: npm view maplibre-gl version dist-tags --json
  - command: npm view mapbox-gl version dist-tags --json
owner: "@coordinator @product-strategist @task-distributor"
decision_level: advisory
---

# AWP-001 Product Implementation Planning

## Decision

Open a new AI Map Workbench Product Implementation batch under `AWP-*` task ids.
This is the fresh planning loop requested by AMW-010. It does not reverse the
AMW-010 No-go: the workbench stays in `examples/ai-map-workbench`, and product
app movement or hosted deployment remains blocked until a later gate accepts
provider enforcement, product ownership, durable audit, review-action runtime,
and repeatable visual evidence.

The next executable task is `TASK-2026W23-AWP-002` provider resource
enforcement.

## Evidence

| Check | Result | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| AMW-010 gate | accepted | `docs/reviews/amw-010-product-promotion-go-no-go-2026-06-02.md` records local example Go and product promotion No-go. | Fresh tasks must close blockers rather than moving files or hosting. | Open AWP implementation planning, starting with provider enforcement. | high |
| Current npm signal | accepted | 2026-06-02 local check: `@arcgis/core` 5.0.19, `@arcgis/ai-components` 5.0.19, `@modelcontextprotocol/sdk` 1.29.0, `maplibre-gl` 5.24.0, and `mapbox-gl` 3.24.0. | External pressure remains steady and does not justify package movement or MCP tool aliases. | Keep scope on AMW product blockers. | high |
| Provider risk | blocking for promotion | AMW-007 defines base URL policy, timeout/abort, response byte caps, and diagnostic paths as future work. | Hosted or product use is unsafe before provider IO is bounded and leak-hardened. | Assign `AWP-002` to provider resource enforcement. | high |
| Durable audit risk | blocking for promotion | AMW-008 is design-only and current audit remains in-memory latest-50. | Product review history is not durable, authorized, or export-safe. | Queue `AWP-004` after product ownership is explicit. | high |
| Review workflow risk | blocking for promotion | AMW-009 is design-only and current UI has no review decision endpoint or controls. | Reviewers still cannot create tracked decisions. | Queue `AWP-005` after provider enforcement and product ownership. | high |
| Visual evidence risk | hold | AMW-010 browser smoke covers the local example, but not release-grade review-action states. | Product workflow claims need repeatable UI evidence. | Queue `AWP-006` before the implementation gate. | medium |

## Boundaries Preserved

- No product app movement.
- No hosted deployment, auth system, user accounts, secret manager, database, or
  product provider admin UI.
- No browser-visible provider base URL, credential variable, credential,
  request header, raw prompt, raw provider body, command body, patch,
  screenshot, feature payload, or full `MapSpec` retention.
- No direct provider commands or browser-side `MapSpec` mutation.
- No new MCP tool names.
- No MapLibre package movement.
- No stable SceneView3D runtime promotion.

## Verification

Required for this planning-only slice:

- `pnpm test:docs`
- `pnpm check`
- `git diff --check`

This report satisfies `TASK-2026W23-AWP-001`; the planning ledgers now point to
`TASK-2026W23-AWP-002` as the next queued task.
