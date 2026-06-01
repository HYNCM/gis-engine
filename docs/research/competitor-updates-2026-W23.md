---
agent: competitive-intel
period: 2026-W23
generated_at: 2026-06-01T14:16:38Z
repo_revision: "7f59f3ef6711a15dba844ee5277c3f397ef3f264"
inputs:
  - https://developers.arcgis.com/javascript/latest/agentic-apps/ai-introduction/
  - https://developers.arcgis.com/javascript/latest/release-notes/
  - https://github.com/maplibre/maplibre-gl-js/releases
  - https://docs.mapbox.com/mapbox-gl-js/example/pmtiles-vector-source/
  - https://docs.protomaps.com/pmtiles/
  - https://geoparquet.org/releases/v1.1.0/
  - https://modelcontextprotocol.io/specification/
  - command: npm view maplibre-gl version dist-tags --json
  - command: npm view mapbox-gl version dist-tags --json
  - command: npm view @modelcontextprotocol/sdk version dist-tags --json
  - command: npm view @arcgis/ai-components version dist-tags --json
  - command: npm view @arcgis/core version dist-tags --json
  - command: npm view pmtiles version dist-tags --json
  - command: npm view flatgeobuf version dist-tags --json
  - command: npm view ol version dist-tags --json
  - command: npm view cesium version dist-tags --json
  - command: npm view three version dist-tags --json
  - command: npm view 3d-tiles-renderer version dist-tags --json
  - command: npm view deck.gl version dist-tags --json
  - command: npm view echarts version dist-tags --json
owner: "@competitive-intel"
decision_level: advisory
---

# Competitor Updates: 2026-W23

Checked on 2026-06-01. This report replaces the automation-generated template
with dated package evidence from the current run plus official project/spec
sources. It is a planning input only; it does not approve package movement,
runtime source loading, production workbench hosting, or stable SceneView3D.

## Executive Summary

1. External package pressure is steady rather than urgent. `maplibre-gl`
   remains 5.24.0 with `next` at 6.0.0-11, `mapbox-gl` remains 3.24.0 with a
   3.24.0 release-candidate tag, and `@modelcontextprotocol/sdk` remains
   1.29.0. The MLD no-go decision should stand until a future package-movement
   task refreshes evidence and runs strict visual gates.
2. Agentic map-product pressure remains the strongest product signal. ArcGIS AI
   components and GIS Engine's own AI Map Workbench evidence point to a product
   boundary problem: provider credentials, review actions, durable audit,
   visual evidence, and app ownership must be designed before the workbench
   leaves `examples/`.
3. Cloud-native source pressure remains real but bounded. PMTiles, vector,
   GeoParquet, FlatGeobuf, GeoTIFF, and GeoZarr should stay readiness or
   promotion-candidate states until resource-policy, parser/query, and export
   contracts are explicit.
4. 3D ecosystem movement remains an adapter signal, not a stable runtime
   promotion signal. SceneView3D stays blocked after SRC-006.

## New Releases And Source Signals

| Project | 2026-06-01 checked signal | GIS Engine impact | Confidence |
| --- | --- | --- | --- |
| ArcGIS Maps SDK JS / AI components | `@arcgis/core` and `@arcgis/ai-components` are 5.0.19; `next` tags point at 5.2.0-next builds. Official AI docs keep agentic map apps as a product surface. | Use the AI Map Workbench as the next planning spine, but require product boundary, credential/resource, durable audit, review-action, and visual gates before promotion. | high |
| MapLibre GL JS | `maplibre-gl` is 5.24.0; `next` is 6.0.0-11. | Keep current dependency range. Future v6 work needs a separate package-movement task with official release/changelog evidence, lockfile diff, example loading scope, and strict visual evidence. | high |
| Mapbox GL JS | `mapbox-gl` is 3.24.0; `next` is 3.24.0-rc.1. Official examples continue to make PMTiles/vector loading visible. | Keep generated-app source readiness honest. Do not imply PMTiles archive parsing, vector tile decoding, or hidden fetch support. | high |
| MCP TypeScript SDK | `@modelcontextprotocol/sdk` is 1.29.0. | Keep documented GIS Engine tool names frozen and continue exposing both input and output schemas. No AMW or source-specific MCP alias is justified. | high |
| PMTiles / FlatGeobuf / OpenLayers | `pmtiles` is 4.4.1, `flatgeobuf` is 4.4.0, and `ol` is 10.9.0 with a 10.9.1 dev tag. | Cloud-native data stays a promotion-gate backlog, not a runtime parser task inside this loop. | high |
| CesiumJS / Three.js / 3DTilesRendererJS / deck.gl | `cesium` is 1.141.0, `three` is 0.184.0, `3d-tiles-renderer` is 0.4.27, and `deck.gl` is 9.3.2. | Preserve adapter-local SceneView3D evidence. Do not move stable `view.mode: "scene3d"` without a new quality-guardian/coordinator Go. | high |
| ECharts | `echarts` is 6.1.0. | Option-first visualization remains a useful UX reference for declarative, reviewable map-generation state. | medium |

Observed package versions from `npm view` on 2026-06-01:
`maplibre-gl` 5.24.0, `mapbox-gl` 3.24.0, `@modelcontextprotocol/sdk` 1.29.0,
`@arcgis/core` 5.0.19, `@arcgis/ai-components` 5.0.19, `pmtiles` 4.4.1,
`flatgeobuf` 4.4.0, `ol` 10.9.0, `cesium` 1.141.0, `three` 0.184.0,
`3d-tiles-renderer` 0.4.27, `deck.gl` 9.3.2, and `echarts` 6.1.0.

## API / Spec Changes That Matter

### AI Map Review Is Now A Product Boundary Problem

- Evidence: ArcGIS AI components keep agentic map applications visible, while
  GIS Engine AMW-004 and AMW-005 hold promotion on app ownership, credential
  policy, durable audit, visual evidence, and review actions.
- Impact: product and AI safety. Provider profiles are useful only if reviewers
  can accept, block, or route follow-up work without turning examples into an
  uncontrolled hosted product.
- Action: open an AI Map Workbench product-boundary sprint before any product
  app move or hosted deployment.
- Confidence: high.

### MapLibre Package Movement Remains Blocked

- Evidence: `maplibre-gl` stable and `next` tags are unchanged from the MLD
  decision pattern, and MLD-004 explicitly blocks package movement in this
  batch.
- Impact: architecture and release safety. A package move would affect visual
  and example runtime loading, so a docs-only planning loop cannot approve it.
- Action: keep future package movement as a separate task with refreshed
  official evidence and strict visual snapshot acceptance.
- Confidence: high.

### Source Promotion Still Needs Resource Gates

- Evidence: PMTiles, Mapbox PMTiles examples, GeoParquet 1.1, FlatGeobuf, and
  OpenLayers cloud-native signals remain active, but GIS Engine source states
  are intentionally readiness-only or blocked outside current inline/query
  contracts.
- Impact: security and user trust. Generated apps must not hide range requests,
  workers, archive parsing, or cloud-native feature queries.
- Action: keep source promotion candidates behind schema, resource-policy,
  query, export, and fixture gates.
- Confidence: high.

## Recommended Follow-Up Tasks

### [P0] Freeze AI Map Workbench Product-App Boundary

- Evidence: AMW-004 promotion gate and AMW-005 provider-profile review both
  hold product promotion pending app ownership and safety design.
- Impact: product, AI safety, security, and developer experience.
- Action: `@coordinator`, `@product-strategist`, and `@task-distributor` should
  publish a product-boundary spec and sprint DAG before more implementation.
- Confidence: high.

### [P0] Design Provider Credential And Resource Administration

- Evidence: Provider profiles keep keys server-only today, but product usage
  needs explicit admin UX, credential lookup rules, and resource/abuse review.
- Impact: security and AI safety.
- Action: `@ai-agent`, `@engine-agent`, and `@docs-agent` should define
  provider profile lifecycle, allowed protocols, denial cases, and audit-safe
  metadata before hosted or product app movement.
- Confidence: high.

### [P1] Design Durable Audit And Review Actions

- Evidence: Current AMW audit is bounded in memory and payload-free; the UI
  displays evidence but does not yet create accept, block, or follow-up
  decisions.
- Impact: user value and traceability.
- Action: `@engine-agent`, `@ai-agent`, `@qa-agent`, and `@docs-agent` should
  design retention, export, privacy, and command-safe review-action semantics.
- Confidence: high.

### [P1] Require Visual Evidence Before Product Promotion

- Evidence: Browser smoke exists for the example, but AMW-004 records no
  release visual fixture for a product app boundary.
- Impact: release quality and UX stability.
- Action: `@qa-agent` and `@quality-guardian` should require deterministic UI
  smoke or visual evidence before any workbench product-promotion Go.
- Confidence: medium.

## 2026-06-02 Post-AMW-010 Addendum

Checked package signals again on 2026-06-02 after the AMW-010 No-go. The
signals are unchanged from the W23 planning refresh for the packages relevant to
this decision:

- `@arcgis/core` 5.0.19, with `next` at 5.2.0-next.4.
- `@arcgis/ai-components` 5.0.19, with `next` at 5.2.0-next.4.
- `@modelcontextprotocol/sdk` 1.29.0.
- `maplibre-gl` 5.24.0, with `next` at 6.0.0-11.
- `mapbox-gl` 3.24.0, with `next` at 3.24.0-rc.1.

The planning impact is focused: external signals still support AI Map Workbench
product hardening, but they do not justify MapLibre package movement, MCP tool
aliases, hosted deployment, or product promotion. The next bounded workstream is
`AWP-001` through `AWP-007`, starting with provider resource enforcement under
`TASK-2026W23-AWP-002`.
