---
agent: product
period: 2026-06-10
generated_at: 2026-06-09T16:48:15Z
repo_revision: "7ca08513bada13b127bf22cee101546329c266e7"
inputs:
  - docs/research/competitor-updates-2026-W24.md
  - docs/research/capability-scorecard.md
  - docs/planning/active-execution-queue-2026-06-09.md
  - https://github.com/HYNCM/gis-engine/issues/6
owner: "@product @orchestrator"
decision_level: advisory
---

# PROD-011 External Signal Refresh

## Decision

`TASK-2026W24-PROD-011` is complete for W25 planning input. Current npm,
GitHub release, and official-source checks do not change W25 roadmap
priorities.

SDK+CLI-first remains the productization default. The source-promotion plan
stays bounded, and AI Map Workbench remains No-go for hosted/product movement
until a future Go issue consumes the promotion intake.

## Evidence Summary

| Signal | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| MapLibre / Mapbox | `maplibre-gl` `5.24.0`, `next: 6.0.0-13`; `mapbox-gl` `3.24.0`, `next: 3.25.0-rc.1`; latest release pages reachable. | Stable package pressure is unchanged. | No package movement without a dedicated visual-gated task. | high |
| MCP contracts | `@modelcontextprotocol/sdk` `1.29.0`; official tools page exposes schema contract language. | GIS Engine tool surface should remain stable. | Keep seven documented snake_case tools with input/output schemas. | high |
| AI map tooling | ArcGIS core and AI components stay `5.0.19` with advancing `next` tags; agentic app docs reachable. | Product pressure supports Workbench intake, not hosted promotion. | Require owner/auth/storage/export/visual Go before movement. | high |
| Cloud-native data | PMTiles, FlatGeobuf, GeoParquet, GeoTIFF, and GeoZarr sources were refreshed with dated package or official-source evidence. | Source readiness remains important but must stay contract-first. | Keep parser/query/runtime promotion separate from metadata and fixture evidence. | high |
| 3D / visualization | `3d-tiles-renderer` moved to `0.4.28`; Cesium, Three, deck.gl, and ECharts stable signals did not alter gates. | 3D ecosystem movement remains adapter evidence, not stable runtime proof. | Keep SceneView3D stable runtime blocked. | high |

## Gate Evidence

| Gate | Result | Notes |
| --- | --- | --- |
| Updated dated research report | PASS | `docs/research/competitor-updates-2026-W24.md` records checked timestamps, commands, source URLs, package versions, and roadmap outcome. |
| Capability scorecard | PASS | `docs/research/capability-scorecard.md` records the 2026-06-10 no-score-change addendum from current evidence. |
| No stale-current claims | PASS | All new current claims include checked dates, commands, source URLs, or explicit weak-signal status. |

## Roadmap Outcome

No priority change for W25. Keep:

- SDK+CLI-first launch surface.
- AI Map Workbench as local/reference plus product-promotion intake only.
- PMTiles as bounded display/load-plan and deterministic fixture evidence, not
  archive parsing or hidden IO.
- GeoTIFF/GeoZarr as watch items until resource-policy, fixture, and runtime
  contracts exist.
- SceneView3D as adapter-local evidence with stable runtime blocked.
