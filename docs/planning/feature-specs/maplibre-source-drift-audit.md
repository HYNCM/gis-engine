---
agent: product-strategist
period: 2026-W22
generated_at: 2026-05-30T19:16:41Z
repo_revision: "8609e5f"
inputs:
  - docs/research/competitor-updates-2026-W22.md
  - docs/research/capability-scorecard.md
  - docs/engineering/maplibre-version-drift-audit.md
  - docs/planning/feature-specs/cloud-native-source-readiness.md
  - docs/planning/feature-specs/spatial-query-evidence-hardening.md
owner: "@product-strategist"
decision_level: advisory
---

# MapLibre Source Drift Audit

## Product Goal

Before any `maplibre-gl` dependency movement, GIS Engine needs a bounded audit
that connects current MapLibre/Mapbox package and source-format drift to the
existing schema, adapter, resource-policy, snapshot, and generated-app evidence
contracts. The goal is a Go/No-go package movement decision, not an upgrade.

## Scope

| Boundary | Required behavior | Must not do |
| --- | --- | --- |
| Package drift | Compare current stable MapLibre, visible v6 prerelease signals, and Mapbox source examples against local adapter assumptions. | Upgrade `maplibre-gl` as part of the audit. |
| Style/source compatibility | Verify transformer behavior for existing GeoJSON, raster, vector, PMTiles, and `fill-extrusion-lite` fixtures. | Add PMTiles archive parsing, vector tile decoding, or cloud-native feature queries. |
| Resource policy | Confirm URL/tile/worker/archive implications are still covered before any runtime or example movement. | Add hidden fetches, workers, range reads, or external services. |
| Snapshot evidence | Run smoke evidence and identify visual snapshot scenarios required for a future package movement. | Claim release readiness without visual evidence or a documented waiver. |
| AI delivery | Keep generated-app delivery/source readiness wording aligned with the frozen MCP tool names. | Add a new MCP alias or parse prose diagnostics for state. |

## Acceptance Matrix

| State | Evidence | Decision |
| --- | --- | --- |
| no-go | Adapter, resource, or snapshot assumptions break under the drift checklist. | Do not move packages; create follow-up fixes. |
| conditional | Deterministic gates pass but visual/release evidence is incomplete. | Keep package movement blocked until the visual gate is accepted. |
| go-candidate | Deterministic and visual gates pass with no policy gaps. | Coordinator may open a separate dependency-movement task. |

## Recommended Task Slice

1. `MLD-001`: freeze the MapLibre Source Drift Audit boundary and sprint DAG.
2. `MLD-002`: run adapter/source compatibility checks against current package
   metadata and local transformer assumptions.
3. `MLD-003`: produce resource-policy and generated-app source readiness
   evidence for PMTiles/vector compatibility boundaries.
4. `MLD-004`: run smoke/visual release gate assessment and publish Go/No-go.

## Non-Goals

- No `maplibre-gl` package upgrade in this sprint.
- No public MCP tool name changes.
- No PMTiles archive parsing, vector tile decoding, worker startup, or feature
  query implementation.
- No stable SceneView3D runtime promotion.
