---
agent: competitive-intel
period: 2026-W22
generated_at: 2026-05-29T07:51:47Z
repo_revision: "704104dfc92719ca73481b8f79d85d527c9a73da"
inputs:
  - docs/research/competitor-updates-2026-W22.md
  - docs/planning/sprint-2026-W23-ai-map-app-generation.md
  - docs/reviews/nla-002-generation-command-contract-2026-05-29.md
  - docs/reviews/nla-003-mcp-orchestration-evidence-2026-05-29.md
  - docs/reviews/nla-006-prompt-evidence-scenarios-2026-05-29.md
  - docs/reviews/nla-008-serialized-planning-handoff-2026-05-29.md
  - docs/planning/sceneview3d-src-006-stable-runtime-decision-2026-05-29.md
owner: "@competitive-intel"
decision_level: advisory
---

# Capability Scorecard

Scores are advisory product signals, not release approvals. Every external
benchmark below was refreshed on 2026-05-29 from official sources recorded in
`competitor-updates-2026-W22.md`.

| Dimension | GIS Engine Score | Current External Benchmark | Evidence Note | Confidence |
| --- | ---: | --- | --- | --- |
| AI operability | 9.0/10 | ArcGIS AI components; MCP tools and structured-output schema contracts | GIS Engine now has the prompt evidence skeleton, `capabilitySummary`, command-only generation, MCP output schemas, diagnostics, snapshot/export/example evidence, and prompt QA scenarios. The open gap is a typed free-form prompt planner/parser contract. | high |
| 2D performance | 6.5/10 | MapLibre v5/v6 drift; Mapbox style spec and PMTiles examples | Generic vector sources, PMTiles-compatible URL policy, MapLibre transformation, and visual/smoke evidence exist. The next score bump requires a version-drift audit and generated-style compatibility checks before dependency movement. | high |
| 3D readiness | 5.4/10 | CesiumJS, Three.js, 3DTilesRendererJS, deck.gl WebGPU/3D Tiles movement | SceneView3D has adapter contract, dependency boundary, lifecycle, snapshot/query, browser evidence, release-gate rules, and SRC-006 No-go. This remains evidence readiness, not stable runtime support. | high |
| Developer experience | 7.2/10 | ArcGIS natural-language map UX; Mapbox/MapLibre examples; ECharts option-first visualization | Docs now explain evidence-first generation, but a user-facing generated-app export package still needs clearer manifest/evidence surfacing. | medium |
| Ecosystem and data readiness | 6.8/10 | PMTiles v3, GeoParquet 1.1, FlatGeobuf range access, OpenLayers GeoZarr/GeoTIFF | GIS Engine has resource policy and portable vector-source foundations. GeoParquet/FlatGeobuf/GeoZarr remain readiness and diagnostics work, not implemented source support. | high |

## W22 Delta

- AI operability rises from 8.7 to 9.0 because NLA-002 through NLA-008 closed:
  generated app evidence is now schema-first, command-only, MCP-compatible, and
  covered by prompt QA. It does not reach 10 because free-form prompt parsing is
  not yet a typed public contract.
- 2D performance rises from 6.3 to 6.5 because this refresh adds MapLibre v6
  prerelease drift and Mapbox style-spec/PMTiles evidence as explicit future
  audit targets. No package movement happened in this cycle.
- 3D readiness rises from 5.2 to 5.4 because the NLA evidence loop preserves
  SceneView3D blocker visibility after SRC-006. Stable `view.mode: "scene3d"`
  remains blocked and must not be scored as runtime support.
- Developer experience rises from 6.9 to 7.2 because docs, examples, and
  changelog wording now describe the evidence-first generation loop. The next
  DX gap is export package polish.
- Ecosystem/data readiness rises from 6.6 to 6.8 because this refresh adds
  GeoParquet and FlatGeobuf evidence to the planning surface. These are not yet
  source implementations.

## Next Scorecard Update Requirements

- Verify external releases again in the current run before changing scores.
- Do not raise 3D readiness for stable runtime until a future quality-guardian
  and coordinator Go decision accepts real renderer evidence.
- Treat MapLibre, Mapbox, deck.gl, Three.js, and 3DTilesRendererJS package
  movement as evidence work: adapter tests, resource policy, smoke snapshots,
  and visual runner notes must accompany any dependency score bump.
- Treat GeoParquet, FlatGeobuf, GeoZarr, or PMTiles behavior changes as
  resource-policy/data-readiness work before implementation claims.
