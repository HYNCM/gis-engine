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
  - docs/reviews/ain-001-002-generated-app-delivery-acceptance-2026-05-30.md
  - docs/reviews/ain-003-004-promotion-criteria-2026-05-30.md
  - docs/reviews/ain-005-scene-browsing-delivery-copy-2026-05-30.md
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
| Data and sources | source readiness summary, resource-policy result, source diagnostics | GeoJSON/raster/vector/PMTiles states match existing policy and examples | GeoParquet, FlatGeobuf, GeoTIFF, GeoZarr, and new PMTiles archive behavior remain readiness-only or blocked until promotion gates land |
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
4. `GIR-004`: map spatial-analysis readiness into review sections.
5. `GIR-005`: add prompt-to-delivery QA scenarios.
6. `GIR-006`: audit docs and release wording.
