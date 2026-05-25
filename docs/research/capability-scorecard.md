---
agent: competitive-intel
period: 2026-W22
generated_at: 2026-05-25T01:57:26Z
repo_revision: "d3c0137"
inputs:
  - docs/research/competitor-updates-2026-W22.md
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
| AI operability | 8.4/10 | MCP tool input/output schema contracts | GIS Engine already requires schema-first public tools, structured diagnostics, command replay, and MCP `outputSchema`; W22 lifecycle diagnostics now add stable runtime paths for adapter failure states. | high |
| 2D performance | 6.2/10 | Mapbox PMTiles source example; MapLibre v5/v6 release drift | Generic vector source, PMTiles-compatible resource policy, MapLibre transformer, and visual/smoke evidence exist; missing next step is explicit version-drift audit before MapLibre upgrades. | medium |
| 3D readiness | 5.1/10 | CesiumJS monthly 3D cadence; Three.js and 3DTilesRendererJS adapter ecosystem | SceneView3D schema, resource gates, mock snapshot/query, release visual gate, adapter handoff, dependency boundary, and lifecycle diagnostics exist; stable runtime remains correctly blocked. | high |
| Developer experience | 6.6/10 | OpenLayers/deck.gl examples and ArcGIS 5.0 platform breadth | Docs and examples are stronger than W20, but the next DX gain is upgrade guidance and stable failure explanations for 3D lifecycle states. | medium |
| Cloud-native data ecosystem | 6.5/10 | Mapbox PMTiles direct source; PMTiles package ecosystem | GIS Engine has portable vector source contracts and resource policy evidence; GeoParquet/FlatGeobuf still remain future compatibility items. | high |

## W22 Delta

- AI operability increases from 8.1 to 8.4 because current work adds stable
  lifecycle diagnostic paths for SceneView3D adapter pre-load/post-destroy
  states, reducing string-parsing pressure for AI tooling.
- 2D performance increases from 5.5 to 6.2 because Mapbox's PMTiles signal is
  now matched by existing GIS Engine vector source evidence; the open gap is
  compatibility drift, not first implementation.
- 3D readiness increases from 3.5 to 5.1 because the repo now has stable
  renderer contract, dependency boundary, lifecycle/snapshot/query QA evidence,
  release gate evidence, and explicit no-go rules for stable runtime promotion.
- Developer experience increases from 6.0 to 6.6 because adapter docs and
  failure diagnostics now explain a safer path, though public upgrade guides are
  still thin.
- Cloud-native data increases from 5.8 to 6.5 because PMTiles/vector tile
  behavior is already covered by schema, examples, transformer, resource policy,
  and snapshots.

## Next Scorecard Update Requirements

- Verify external releases again in the current run before changing scores.
- Keep stable `view.mode: "scene3d"` scored as blocked until SRC-006 has an
  accepted quality-guardian and coordinator decision.
- Treat MapLibre/Mapbox package upgrades as evidence work: adapter tests,
  resource-policy tests, and visual runner notes must accompany any score bump.
