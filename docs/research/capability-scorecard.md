---
agent: product
period: 2026-W32
generated_at: 2026-08-05T16:11:14Z
repo_revision: "5fbd6d01263da06ef48a9178ce4399f2817f6245"
inputs:
  - docs/research/competitor-updates-2026-W32.md
  - docs/reviews/maplibre-5.24-6.1-builder-evidence-2026-08-03.md
  - docs/reviews/maplibre-6.1-quality-decision-2026-08-03.md
  - docs/reviews/mcp-2026-07-28-quality-decision-2026-08-03.md
  - docs/reviews/geoparquet-version-boundary-quality-decision-2026-08-03.md
  - docs/reviews/pmtiles-capability-truth-quality-decision-2026-07-20.md
  - https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.1.0
  - https://github.com/modelcontextprotocol/modelcontextprotocol/releases/tag/2026-07-28
  - https://modelcontextprotocol.io/specification/2026-07-28/changelog
  - https://github.com/opengeospatial/geoparquet/releases/tag/v2.0.0-rc.1
  - https://github.com/protomaps/PMTiles/blob/main/spec/v3/spec.md
owner: "@product"
decision_level: advisory
evidence_kind: specialist
status: ready-for-planning
---

# Capability Scorecard

This is the current advisory product snapshot, not a merge, release, dependency,
or runtime-promotion approval. Scores use a 0-10 scale. External evidence was
checked on **2026-08-06** and is limited to the W32 signals recorded in
`competitor-updates-2026-W32.md`; stale W29 competitor facts are not presented
as current.

## GIS Engine Current Scores

| Dimension | W32 score | W29 score | Delta | Evidence note | Confidence |
| --- | ---: | ---: | ---: | --- | --- |
| AI operability | **9.1/10** | 8.3 | +0.8 | The ordered 14-tool inventory, draft-07 input/output descriptors, schema-conforming `structuredContent`, structured diagnostic envelope, and legacy JSON fallback are now converged and tested on MCP `2025-11-25`. A dedicated `2026-07-28` matrix fails closed on the unimplemented v2 lifecycle, so no latest-protocol credit is awarded. | high |
| 2D performance | **7.5/10** | 6.8 | +0.7 | Exact native MapLibre `5.24.0` and stable `6.1.0` consumers pass strict types, ESM build, Chromium lifecycle/query, worker/resource observation, and strict pixels. One local timing sample and unchanged `5.24.0` default prevent an adoption or sustained-performance claim. | high |
| 3D readiness | **4.8/10** | 4.8 | 0.0 | No W32 work changed the adapter promotion boundary, and no current 3D competitor research was performed in this run. Stable SceneView3D promotion therefore receives no additional credit. | high |
| Developer experience | **8.5/10** | 8.3 | +0.2 | Exact-version compatibility evidence, explicit worker/CSP constraints, migration guardrails, and fail-closed version diagnostics reduce adoption ambiguity. Hosted Workbench remains outside GA, and package/runtime defaults did not move. | high |
| Ecosystem and data readiness | **7.4/10** | 6.8 | +0.6 | PMTiles capability truth is aligned across engine/AI/CLI surfaces, and GeoParquet now has a version-discriminated 1.1/2.0-RC metadata contract with stable diagnostics. Both formats still lack accepted archive/Parquet runtime load and feature-query promotion. | high |

The simple mean of the five W32 dimensions is **7.5/10** (37.3 / 5, rounded
to one decimal). Planning priority must use the weighted formula in the W32
competitor report rather than this descriptive mean.

## Current External Benchmarks

Scores below cover only sources checked on 2026-08-06 and only the named
capability. They are not whole-product ratings.

| Benchmark | Capability | Score | Evidence note | Confidence |
| --- | --- | ---: | --- | --- |
| MapLibre GL JS `6.1.0` | 2D rendering/performance | **9.1/10** | Current stable/npm-latest line includes terrain/globe/raster correctness work and builds on the `5.24.0` GPU optimization baseline. GIS Engine's exact dual-version browser evidence passed, but one sample does not establish a durable performance delta. | high |
| MapLibre GL JS `6.1.0` | Public API / DX | **8.7/10** | Stable v6 exposes an ESM package and explicit worker/shared assets; `6.1.0` adds decoded image updates, cluster-option access, global-state expressions, and interaction-speed controls. ESM/worker/CSP migration cost remains material. | high |
| MCP `2026-07-28` | AI tool interoperability | **9.7/10** | The stable latest revision combines schema-described tools with stateless discovery, per-request protocol/capability metadata, required result types, cache metadata, subscriptions, and explicit extension governance. The migration burden is substantial for 1.x servers. | high |
| GeoParquet `1.1.0` / `2.0.0-rc.1` | Portable analytical data | **9.1/10** | Stable 1.1 provides bbox-covering/GeoArrow options; the 2.0 RC pivots to native Parquet geospatial types and row-group spatial statistics. The score reflects format direction, while the RC/final boundary remains explicit. | high |
| PMTiles v3 | Portable tile delivery | **9.0/10** | The current v3 single-file archive supports object-storage delivery with a normative header/directory/compression/range contract and established JavaScript consumption. This does not reduce the implementation burden for a new reader/query engine. | high |

Benchmarks carried in W29 for Mapbox, Cesium, Three.js,
3DTilesRendererJS, deck.gl, OpenLayers, ArcGIS AI components, and OpenAI
Structured Outputs were **not refreshed in this run** and are deliberately not
listed as current W32 evidence.

## W29-To-W32 Interpretation

- **AI operability:** The W29 14-vs-7 and text-vs-schema gaps are closed. The
  score rises for a truthful canonical contract, while MCP `2026-07-28`
  adoption stays explicitly blocked on lifecycle conformance.
- **2D performance:** Stable v6 compatibility is now executable evidence rather
  than prerelease inference. Default adoption and sustained performance remain
  separate decisions.
- **3D readiness:** No relevant product boundary changed, so the score is held.
- **Developer experience:** Consumers now have clearer exact-version, ESM,
  worker, CSP, and rollback evidence. This is a modest gain, not hosted-product
  maturity.
- **Ecosystem/data:** GeoParquet version truth joins the earlier PMTiles
  capability truth. Metadata and negative evidence improve agent decisions, but
  no runtime support is implied.

## Planning Implications

| Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- |
| MCP `2026-07-28` is stable and the official TypeScript SDK v2 line is split-package/stateless | Latest-client interoperability now requires a different lifecycle | Prioritize a bounded v2 discovery/transport conformance issue; keep the `2025-11-25` default until HOC-N3 accepts promotion | high |
| Exact MapLibre `5.24.0`/`6.1.0` compatibility passes | The technical compatibility question is closed, but deployment/performance adoption risk remains | Do not rerun #38 as unfinished work; open an adoption-only issue only if default movement is desired | high |
| GeoParquet 2.0 remains `rc.1`, while local metadata supports the reviewed boundary | Final schema drift could invalidate a widened contract | Watch for `2.0.0` final and reconcile exact deltas before runtime or schema expansion | high |
| PMTiles v3 format obligations remain unchanged and runtime remains blocked | Display evidence can still be mistaken for archive/query support | Keep the capability split; require a new spec-correct runtime gate before any promotion | high |

The factor scores, recommendation ownership, official source ledger, and HOC-N1
handoff are in `docs/research/competitor-updates-2026-W32.md`.

## Guardrails

- Keep MapLibre `5.24.0` as the current default until a separate adoption gate
  passes; `6.1.0` compatibility is not dependency approval.
- Keep MCP `2025-11-25` as the current default and the canonical 14-tool
  descriptor/result contract frozen during v2 research.
- Do not treat the GeoParquet RC's raw `geo.version = 2.0.0` as a final-release
  identity or a runtime capability.
- Do not claim PMTiles runtime archive load/query from URL-compatible display,
  load-plan, or caller-supplied fixture evidence.
- Do not promote stable SceneView3D or hosted Workbench from this scorecard.
- Recheck official sources in the run that consumes these scores for a public
  default, capability, roadmap, or release decision.
