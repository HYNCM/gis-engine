---
agent: product-strategist
period: 2026-W22
generated_at: 2026-05-30T05:32:28Z
repo_revision: "374248689630327c1df2360fbcea684eaadc2c31"
inputs:
  - docs/research/competitor-updates-2026-W22.md
  - docs/research/capability-scorecard.md
  - docs/planning/feature-specs/generated-app-delivery-ux.md
  - docs/planning/feature-specs/cloud-native-source-promotion-candidates.md
  - docs/planning/feature-specs/spatial-analysis-promotion-criteria.md
  - docs/archive/2026-06-07/reviews/ain-001-002-generated-app-delivery-acceptance-2026-05-30.md
  - docs/archive/2026-06-07/reviews/ain-003-004-promotion-criteria-2026-05-30.md
  - docs/archive/2026-06-07/reviews/ain-005-scene-browsing-delivery-copy-2026-05-30.md
owner: "@product-strategist"
decision_level: advisory
---

# Generated App Review Console

## Product Goal

Give users and agents an inspectable handoff after a natural-language map app
generation run. The console should answer four questions without relying on
free-form prose:

1. Is the generated app ready, blocked, waiting for confirmation, or waiting for
   follow-up work?
2. Which evidence proves that answer?
3. Which sources, analysis requests, and scene-browsing intents are only
   readiness or blocked states?
4. Which existing tool or follow-up task should run next?

This is a product layer over the existing evidence spine. It must not create a
new MCP public tool, write files from `export_example_app`, add cloud-native
loaders, add spatial geoprocessing operations, or promote stable
`view.mode: "scene3d"`.

## Users

- Developer using an AI assistant to generate a GIS web app.
- QA reviewer checking whether an AI-generated app is safe to accept.
- Agent orchestrator deciding which next tool call, confirmation, or follow-up
  task is allowed.

## Review Sections

| Section | Required evidence fields | Ready state | Blocked or confirmation state |
| --- | --- | --- | --- |
| Delivery summary | `generationEvidence.delivery.status`, `generationEvidence.delivery.acceptance`, diagnostic counts | `ready` only when validation, command replay, snapshot/export evidence, and required sections agree | `blocked`, `needs-confirmation`, or `follow-up-required` when diagnostics, source readiness, spatial readiness, file-write, network, or scene blockers exist |
| Files and export | `export_example_app` manifest, file list, side-effect note | Manifest is inspectable and contains no side-effect writes | File write, network fetch, archive parsing, or worker execution requires explicit confirmation or follow-up task |
| Map edits | command skeleton, command trace, validation evidence | Edits are expressible through `MapCommand` and `applyCommands` | Any mutation outside commands is blocked |
| Data and sources | source readiness summary, resource-policy result, source diagnostics | GeoJSON/raster/vector/PMTiles states match existing policy and examples | GeoParquet/FlatGeobuf standalone schema-policy contracts, GeoTIFF, GeoZarr, and new PMTiles archive behavior remain readiness-only or blocked until promotion gates land |
| Spatial analysis | `analysisEvidence`, `spatialQueryEvidence`, blocked-operation diagnostics | Point and bbox query readiness is deterministic and read-only | Buffer, intersection, overlay, routing, and aggregation stay blocked until schema, command/read-only semantics, diagnostics, fixtures, and MCP exposure assessment exist |
| Scene browsing | `sceneBrowsing.state`, `stableRuntimeBlocked`, blocker codes | Extension-only context is visible | Stable `view.mode: "scene3d"` and `snapshot.renderer: "scene3d"` remain blocked after SRC-006 |

## Acceptance Rules

- `ready`: all required sections are ready, no blocking diagnostics remain, and
  no confirmation boundary is pending.
- `needs-confirmation`: the generated app is structurally valid, but a user must
  approve network fetch, archive parsing, worker use, file write, or another
  high-risk action before handoff.
- `follow-up-required`: the generated app has a valid partial handoff, but a
  future task is required before it can be accepted as complete.
- `blocked`: the generated app cannot be accepted because one or more required
  contracts fail validation or are unsupported.

The console should render these states from structured evidence only. It should
not parse diagnostic messages or natural-language summaries to infer acceptance.

## Source Readiness Cards

The `Data and sources` review section should render one card per source intent
or generated source. Each card must show the source id or planned format, the
readiness state, the accepted `MapSpec` shape when one exists, the
resource-policy result, query readiness, export/manifest behavior, and the next
allowed action. The section-level state is the most restrictive card state:
`blocked` wins over `needs-confirmation`, which wins over `follow-up-required`,
which wins over `ready`.

| Card state | Console presentation | Acceptance effect |
| --- | --- | --- |
| `supported` | Normal source card with schema/resource evidence, export notes, and any query limitation called out as structured evidence. | May contribute to `ready` when no card needs confirmation or follow-up. |
| `readiness-only` | Warning card that can appear in planning, manifest notes, or source-readiness evidence, but must state that runtime parsing, archive access, or feature query behavior is not implemented. | Sets the source section to `follow-up-required` unless the unresolved behavior needs user approval, in which case it becomes `needs-confirmation`. |
| `blocked` | Blocking card with the unsupported format or operation, diagnostic path/code, owner or follow-up contract, and no generated `MapSpec` source using that blocked type. | Sets `Data and sources` and the delivery summary to `blocked`. |

Required source-format cards:

| Format | Review-console card | Blocking or follow-up semantics |
| --- | --- | --- |
| PMTiles | Supported URL-compatible source card for existing `sources.*.type: "pmtiles"` display/export evidence, with a readiness-only substate for archive parsing, metadata extraction, range access, mutation/export handoff, and PMTiles feature query. | Existing URL-compatible display/export evidence may be reviewed, but archive parsing or query claims must produce `follow-up-required` or `needs-confirmation`; no runtime loader/parser is implied. |
| URL GeoJSON | Supported display/export card for `sources.*.type: "geojson"` with string `data`; query row remains readiness-only for headless evidence. | Valid resource-policy URLs may appear in manifests without fetches; headless query must stay blocked with `CAPABILITY.UNSUPPORTED` until an inline-data or fetch/cache contract exists. |
| GeoParquet | Blocked source-intent card only. | Do not generate a GeoParquet `SourceSpec`; standalone schema/policy evidence may be cited, but the card must point to future public `MapSpec`, resource-policy path, adapter/runtime blocker, diagnostics, and read-only query gates. |
| FlatGeobuf | Blocked source-intent card only. | Do not generate a FlatGeobuf `SourceSpec`; standalone schema/policy evidence may be cited, but the card must point to future public `MapSpec`, resource-policy path, streaming/index diagnostic, and fixture gates. |
| GeoTIFF | Blocked source-intent card only. | Do not generate a GeoTIFF `SourceSpec`; card must point to future raster schema, byte/range policy, band/CRS/no-data diagnostics, sampling, and snapshot gates. |
| GeoZarr | Blocked source-intent card only. | Do not generate a GeoZarr `SourceSpec`; card must point to future array-store schema, chunk/range policy, CRS/time/band diagnostics, worker budgets, and query/snapshot gates. |

## PRD Summary

### Problem

GIS Engine can already produce structured generation evidence, but a user still
needs a consistent review surface to decide whether a generated app is ready to
accept. Without that surface, agentic mapping can look successful while hiding
source readiness, spatial-analysis, export, or SceneView3D blockers.

### Proposed Experience

The next implementation batch should create a review-console contract and
fixtures. A generated-app handoff should show the delivery status, evidence
sections, blocker codes, confirmation reasons, follow-up tasks, and allowed next
tool calls. The first version can be a schema/test/docs contract and example
manifest shape, not a rendered application UI.

### Non-Goals

- No new MCP public tool names.
- No stable SceneView3D runtime promotion.
- No `snapshot_spec` support for `renderer: "scene3d"`.
- No side-effect file writes from `export_example_app`.
- No GeoParquet, FlatGeobuf, GeoTIFF, GeoZarr, parser, worker, or decoder
  runtime implementation.
- No buffer, intersection, overlay, routing, or aggregation execution.

## Promotion Gates

| Gate | Required before acceptance |
| --- | --- |
| AI contract | Delivery review fixtures cover `ready`, `blocked`, `needs-confirmation`, and `follow-up-required` |
| Schema sync | Any public schema change is regenerated and Ajv-validated |
| Command safety | All generated map edits are still routed through `MapCommand` and `applyCommands` |
| Source readiness | Source cards map to existing resource-policy diagnostics and do not claim unsupported runtime behavior |
| Spatial readiness | Point/bbox cards remain read-only; blocked operations expose stable diagnostic codes and paths |
| Scene browsing | Extension-only scene intent and stable blocker codes remain visible |
| Docs wording | Public docs avoid claims of stable 3D, side-effect export writes, advanced geoprocessing, or unsupported source runtime |

## Recommended Task Slice

1. `GIR-001`: freeze this feature spec and add it to the planning queue.
2. `GIR-002`: add delivery-review acceptance fixtures and tests.
3. `GIR-003`: map source-readiness states into review sections.
4. `GIR-004`: spatial-analysis readiness mapping is complete.
5. `GIR-005`: prompt-to-delivery QA scenarios are complete.
6. `GIR-006`: docs and release wording guardrails are complete.
