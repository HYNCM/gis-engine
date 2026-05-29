---
agent: competitive-intel
period: 2026-W22
generated_at: 2026-05-29T06:07:24Z
repo_revision: "60d5d52301016a446f49fe12bd42256e3f87ca4d"
inputs:
  - docs/research/competitor-updates-2026-W22.md
  - docs/reviews/ai-orchestration-capability-summary-2026-05-27.md
  - docs/reviews/sceneview3d-src-006-stable-runtime-gate-2026-05-29.md
  - docs/planning/sceneview3d-src-006-stable-runtime-decision-2026-05-29.md
  - docs/planning/feature-specs/sceneview3d-stable-renderer-contract.md
  - docs/reviews/sceneview3d-stable-renderer-gate-2026-05-25.md
  - packages/scene3d-three-adapter/src/index.ts
  - tests/adapter/scene3d-three-adapter.test.ts
owner: "@competitive-intel"
decision_level: advisory
---

# Capability Scorecard

| Dimension | GIS Engine Score | Current External Benchmark | Evidence Note | Confidence |
| --- | ---: | --- | --- | --- |
| AI operability | 8.7/10 | ArcGIS agentic mapping docs; MCP tool input/output schema contracts | GIS Engine now exposes `capabilitySummary` for feature display, spatial analysis, and scene browsing while keeping schema-first tools, structured diagnostics, command replay, and MCP `outputSchema` as gates. | high |
| 2D performance | 6.3/10 | Mapbox PMTiles source example; MapLibre v5/v6 release drift | Generic vector source, PMTiles-compatible resource policy, MapLibre transformer, and visual/smoke evidence exist; missing next step remains explicit version-drift audit before MapLibre upgrades. | medium |
| 3D readiness | 5.2/10 | CesiumJS monthly 3D cadence; Three.js and 3DTilesRendererJS adapter ecosystem | SceneView3D SRC-001 through SRC-005 prerequisites are accepted and SRC-006 is a recorded No-go; this improves governance clarity while stable runtime remains blocked. | high |
| Developer experience | 6.9/10 | ArcGIS agentic app UX, OpenLayers/deck.gl examples, ArcGIS 5.0 platform breadth | The next DX opportunity is a documented natural-language generation flow that returns validation, trace, snapshot, and export evidence, not just a generated app skeleton. | medium |
| Cloud-native data ecosystem | 6.6/10 | Mapbox PMTiles direct source; PMTiles package ecosystem | GIS Engine has portable vector source contracts and resource policy evidence; GeoParquet/FlatGeobuf remain future compatibility items. | high |

## W22 Delta

- AI operability increases from 8.1 to 8.7 because current work adds stable
  lifecycle diagnostic paths and an AI-facing `capabilitySummary`, while current
  ArcGIS AI component docs validate natural-language map orchestration as a
  competitive product surface.
- 2D performance increases from 5.5 to 6.3 because Mapbox's PMTiles signal is
  matched by existing GIS Engine vector source evidence; the open gap is
  compatibility drift, not first implementation.
- 3D readiness increases from 3.5 to 5.2 because the repo now has stable
  renderer contract, dependency boundary, lifecycle/snapshot/query QA evidence,
  release gate evidence, and a dedicated SRC-006 No-go decision. This is not a
  stable runtime approval.
- Developer experience increases from 6.0 to 6.9 because the next product loop
  can now describe prompt-driven generation using explicit validation, trace,
  snapshot, and export artifacts.
- Cloud-native data increases from 5.8 to 6.6 because PMTiles/vector tile
  behavior is already covered by schema, examples, transformer, resource policy,
  and snapshots.

## Next Scorecard Update Requirements

- Verify external releases again in the current run before changing scores.
- Keep stable `view.mode: "scene3d"` scored as blocked after the SRC-006 No-go
  until a future task has an accepted quality-guardian and coordinator Go
  decision.
- Treat MapLibre/Mapbox package upgrades as evidence work: adapter tests,
  resource-policy tests, and visual runner notes must accompany any score bump.
