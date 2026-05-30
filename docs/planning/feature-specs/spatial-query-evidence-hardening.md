---
agent: product-strategist
period: 2026-W23
generated_at: 2026-05-30T07:12:55Z
repo_revision: "b799f7a"
inputs:
  - docs/research/competitor-updates-2026-W22.md
  - docs/research/capability-scorecard.md
  - docs/planning/feature-specs/spatial-analysis-promotion-criteria.md
  - docs/planning/feature-specs/generated-app-delivery-ux.md
  - docs/planning/feature-specs/cloud-native-source-readiness.md
  - packages/ai/src/tools/generationEvidence.ts
  - packages/engine/src/generation/commandSkeleton.ts
owner: "@product-strategist"
decision_level: advisory
---

# Spatial Query Evidence Hardening

## Product Goal

Generated-app delivery already exposes spatial-analysis readiness, but the
current point/bbox evidence can still look stronger than it is. This slice
hardens query evidence so users and agents can distinguish ready inline-GeoJSON
query evidence from follow-up, blocked source, or unsupported geoprocessing
states without reading prose diagnostics.

This is an evidence-hardening slice only. It does not add a `spatial_query` MCP
tool, does not add buffer/intersection/overlay/routing/aggregation execution,
does not fetch URL data, does not parse PMTiles/vector tiles, and does not
change stable SceneView3D runtime status.

## Scope

| Boundary | Required behavior | Must not do |
| --- | --- | --- |
| Query capability | Evidence must name adapter query capability or an explicit waiver before treating point/bbox cases as ready. | Infer query support merely because inline GeoJSON mock evidence exists. |
| Invalid inputs | Non-finite points, reversed bboxes, missing layers/sources, hidden layers, unsupported source types, and empty results get stable diagnostic codes and paths. | Hide query failures in natural-language summary text. |
| Unsupported sources | URL GeoJSON, PMTiles, vector tile, GeoParquet, FlatGeobuf, GeoTIFF, and GeoZarr query requests remain follow-up or blocked until promotion gates land. | Claim feature-query support for sources without parser/query contracts. |
| Result caps | Query evidence records result caps, feature counts, layer ids, source ids, and diagnostic counts without exposing unbounded feature payloads. | Put large feature payloads into generated-app manifests. |
| Delivery mapping | `generationEvidence.delivery.sections[].id = "data-and-analysis"` reflects ready, follow-up-required, needs-confirmation, or blocked state from query evidence. | Add new MCP aliases or parse diagnostics prose in UI contracts. |

## Acceptance Matrix

| State | Query evidence | Delivery impact |
| --- | --- | --- |
| ready | Inline GeoJSON point/bbox evidence has explicit query capability or an explicit waiver, valid inputs, bounded result counts, and no blocking diagnostics. | `data-and-analysis` can be ready. |
| follow-up-required | The request is valid but source/query support needs a future adapter, parser, or fixture hardening task. | Delivery can be follow-up-required with concrete next task ids. |
| needs-confirmation | Query evidence depends on future high-risk IO such as fetch, archive parse, worker use, or file writes. | Delivery must expose confirmation reasons before treating the app as ready. |
| blocked | The prompt asks for unsupported geoprocessing or blocked source behavior. | Delivery must stay blocked with stable diagnostic paths and operation/source ids. |

## Recommended Task Slice

1. `SQH-001`: freeze this boundary and open the sprint DAG.
2. `SQH-002`: add an explicit query capability gate to generation/query
   evidence. Completed by
   `docs/reviews/sqh-002-query-capability-gate-2026-05-30.md`.
3. `SQH-003`: harden invalid point/bbox/source diagnostics. Completed by
   `docs/reviews/sqh-003-invalid-source-diagnostics-2026-05-30.md`.
4. `SQH-004`: add result caps and deterministic fixture evidence. Completed by
   `docs/reviews/sqh-004-result-caps-fixtures-2026-05-30.md`.
5. `SQH-005`: map hardened query evidence into generated-app delivery.
   Completed by `docs/reviews/sqh-005-delivery-mapping-2026-05-31.md`.
6. `SQH-006`: run the quality gate and serialize planning closure.

## Non-Goals

- No public `spatial_query` MCP tool.
- No generated source implementation for GeoParquet, FlatGeobuf, GeoTIFF, or
  GeoZarr.
- No PMTiles archive parsing, vector tile decoding, worker startup, or URL data
  fetch.
- No buffer, intersection, overlay, routing, aggregation, or richer
  geoprocessing execution.
- No SceneView3D stable runtime promotion.
