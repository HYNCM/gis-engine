---
agent: product
period: 2026-W29
generated_at: 2026-07-13T15:54:58Z
repo_revision: "bdd71e24a6cacc88cef578211943685a23890e38"
inputs:
  - docs/research/competitor-updates-2026-W29.md
  - docs/research/competitor-updates-2026-W24.md
  - package.json
  - packages/ai/src/mcp/server.ts
  - packages/engine/src/sources/pmtiles-loader.ts
  - packages/scene3d-three-adapter/README.md
  - docs/planning/feature-specs/current-product-definition.md
  - docs/planning/feature-specs/pmtiles-runtime-query-promotion-boundary.md
  - docs/planning/feature-specs/review-console-workbench-go-gate.md
owner: "@product"
decision_level: advisory
status: ready-for-planning
---

# Capability Scorecard

This is the current advisory product snapshot, not a release approval. Scores
use a 0-10 scale and are calibrated against the dated official evidence in
`competitor-updates-2026-W29.md`. A high schema/evidence score does not convert
an experimental or blocked runtime into supported product behavior.

## GIS Engine Current Scores

| Dimension | W29 score | W24 score | Delta | Evidence note | Confidence |
| --- | ---: | ---: | ---: | --- | --- |
| AI operability | **8.3/10** | 9.6 | -1.3 | Fourteen tested snake_case tools each declare input/output schemas, and command/diagnostic evidence remains strong. The score is recalibrated because AGENTS and the Phase 1 spec approve seven public names while runtime exposes 14, and handlers return text rather than MCP `structuredContent` despite declaring `outputSchema`. MCP `2025-11-25` makes that conformance/governance gap material. | high |
| 2D performance | **6.8/10** | 6.6 | +0.2 | MapLibre 5.24 is pinned; deterministic smoke/visual scenarios and v1.5 perf budgets exist. MapLibre v6 event/camera drift and Mapbox 3.25/3.26 ESM, model, vector, and terrain movement prevent a larger increase until a current dual-version compatibility run and sustained measurements exist. | high |
| 3D readiness | **4.8/10** | 5.4 | -0.6 | SceneView3D has schemas, lifecycle/resource contracts, snapshot/query evidence shapes, and promotion diagnostics, but the adapter explicitly has no Three.js/3DTilesRendererJS dependency, no graphics context, and no real renderer. The lower score corrects earlier evidence-readiness inflation while Cesium adds MVT/picking/metadata capabilities. | high |
| Developer experience | **8.3/10** | 8.2 | +0.1 | SDK/CLI first-run, generated artifact verification, API docs, and a feature-flagged review-console candidate route improve adoption. Hosted Workbench remains No-go without auth, deployment, monitoring, and support policy, so reference UX is not counted as GA product UX. | high |
| Ecosystem and data readiness | **6.8/10** | 7.2 | -0.4 | Seven source types and resource-policy/readiness contracts exist, and a PMTiles range-IO loader is publicly exported. The score is reduced because active product/planning state still says runtime query is No-go, the loader documents simplified archive/tile-id behavior, and FlatGeobuf/GeoParquet/GeoTIFF still lack accepted end-to-end runtime promotion. | high |

The simple mean of the five W29 dimensions is **7.0/10**. The arithmetic is
descriptive only; planning priority must use the weighted formula in the W29
competitor report.

## External Benchmark Signals

Scores below measure only the named capability, not the whole product. Every
score includes its evidence note so it can be challenged or refreshed.

| Benchmark | Capability | Score | Evidence note |
| --- | --- | ---: | --- |
| MapLibre GL JS | 2D rendering/performance | **9.0/10** | Official v5.24 notes report glyph/halo single-pass and matrix/GPU-stall optimizations; v6 prereleases continue terrain performance work. Stable remains 5.24, so the score does not assume v6 production stability. |
| MapLibre GL JS | Public API / DX | **8.3/10** | v6 is actively strengthening event types and public camera boundaries, but the prerelease also removes internals and changes event classes, creating migration cost. |
| Mapbox GL JS | 2D/3D convergence | **9.2/10** | Official 3.25/3.26 notes cover named-export ESM, lazy loading, model/symbol/vector performance, layer-level setters, terrain raycasting, and model LOD. |
| CesiumJS | 3D readiness | **9.6/10** | 1.142 provides MVT-as-3D-Tiles with styling, feature picking, and structural metadata; 1.143 adds meshopt-compressed glTF support. |
| Three.js + 3DTilesRendererJS | Extensible 3D adapter stack | **8.8/10** | r185 continues WebGPU/runtime work; 3DTilesRendererJS documents Three/Babylon adapters, metadata, PMTiles vector overlays, provider integrations, and resource loaders, while still publishing an incomplete-feature milestone. |
| deck.gl | Declarative visualization | **8.8/10** | The official 9.3 release highlights widget, controller, and WebGPU improvements; 9.3.6 is current. This score does not imply GIS-specific authoring or command audit semantics. |
| OpenLayers | Cloud-native browser data | **9.2/10** | 10.9 adds substantial GeoZarr/GeoTIFF metadata, custom fetch, concurrent range coalescing, tile-loading efficiency, and WebGL precision/performance evidence. |
| PMTiles + GeoParquet | Portable data formats | **9.0/10** | PMTiles v3 is a documented single-file object-storage format; GeoParquet 1.1 standardizes CRS, bbox covering, and optional native GeoArrow encodings. The score measures format maturity, not one JavaScript package's full runtime. |
| ArcGIS AI components | Agentic map UX | **8.5/10** | Official docs package navigation, data exploration, help, custom agents, and orchestration behind an assistant UI, but explicitly label the components beta and warn of nondeterministic inaccuracies. |
| MCP + schema-constrained outputs | AI tool interoperability | **9.5/10** | MCP stable `2025-11-25` defines input/output schemas and structured result content; OpenAI official docs recommend schema-constrained Structured Outputs over JSON mode and advise preventing type/schema divergence. |

## W24-to-W29 Interpretation

- **AI operability:** The implementation gained useful tools, but the approved
  public-tool contract and runtime inventory diverged. The score now values
  contract clarity and protocol-native results, not raw tool count.
- **2D performance:** v1.5 evidence and budgets justify a small gain. External
  baselines also moved, so no package-upgrade credit is awarded.
- **3D readiness:** The score now distinguishes a detailed handoff contract
  from an actual renderer. Stable `view.mode: "scene3d"` remains blocked.
- **Developer experience:** CLI maturity and the candidate Workbench route
  improve the review path, but hosted operations are excluded.
- **Ecosystem/data:** PMTiles code is more advanced than W24, but product truth
  is less coherent because exported behavior and active No-go state conflict.
  Runtime support receives no credit until the promotion decision is explicit.

## Planning Implications

1. Close MCP/public-tool contract convergence before adding any AI tool.
2. Reconcile PMTiles code, tests, docs, resource policy, and promotion status
   before starting another cloud-native runtime implementation.
3. Run a MapLibre 5.24/v6 compatibility matrix before dependency movement.
4. Keep hosted Workbench launch and real SceneView3D rendering as separate,
   independently reversible gates.

The ranked factor scores, recommendation evidence, and HOC-N1 handoff are in
`docs/research/competitor-updates-2026-W29.md`.

## Guardrails

- Do not treat this scorecard as merge, release, hosted-GA, or stable-runtime
  approval.
- Do not claim the seven-name or 14-name MCP inventory is canonical until the
  repository contract is reconciled by `@orchestrator` and accepted by
  `@quality`.
- Do not claim PMTiles runtime query support from the exported loader alone.
- Do not claim FlatGeobuf, GeoParquet, or GeoTIFF accepted runtime support.
- Do not promote stable `view.mode: "scene3d"` or move renderer dependencies
  into core packages.
- Recheck official releases and standards in the run that consumes these
  scores; competitor facts should not be carried forward as current by memory.
