---
agent: product
period: 2026-W32
generated_at: 2026-08-05T16:11:14Z
repo_revision: "5fbd6d01263da06ef48a9178ce4399f2817f6245"
inputs:
  - https://github.com/maplibre/maplibre-gl-js/releases/tag/v5.24.0
  - https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.1.0
  - https://registry.npmjs.org/maplibre-gl/latest
  - https://github.com/modelcontextprotocol/modelcontextprotocol/releases/tag/2026-07-28
  - https://modelcontextprotocol.io/specification/2026-07-28/changelog
  - https://modelcontextprotocol.io/specification/2026-07-28/server/tools
  - https://modelcontextprotocol.io/specification/2025-11-25/server/tools
  - https://github.com/modelcontextprotocol/typescript-sdk
  - https://github.com/opengeospatial/geoparquet/releases/tag/v1.1.0
  - https://github.com/opengeospatial/geoparquet/releases/tag/v2.0.0-rc.1
  - https://github.com/protomaps/PMTiles
  - https://github.com/protomaps/PMTiles/blob/main/spec/v3/spec.md
owner: "@product"
decision_level: advisory
evidence_kind: specialist
status: ready-for-planning
---

# Competitor Updates: 2026-W32

## Product Decision

The W29-W32 evidence tasks closed real contract gaps, but they do not justify
silent default or runtime promotion. Keep MapLibre GL JS `5.24.0` and MCP
`2025-11-25` as GIS Engine defaults, keep GeoParquet and PMTiles runtime
load/query No-go, and treat the now-stable upstream MapLibre `6.1.0` and MCP
`2026-07-28` lines as separate adoption programs with explicit quality gates.

This conclusion is based on official sources checked on **2026-08-06** and the
repository evidence at the revision in the front matter. It is advisory product
input, not a release or dependency-movement approval.

## Material Changes Since W29

| Signal | Official evidence checked 2026-08-06 | Product impact | Current GIS Engine boundary | Confidence |
| --- | --- | --- | --- | --- |
| MapLibre GL JS | `6.1.0` is a non-prerelease release published 2026-07-30 and npm `latest`; `5.24.0` remains the exact GIS Engine lockfile baseline. The `6.1.0` notes add decoded-image updates, cluster-option inspection, global-state expressions, input-speed controls, and terrain/globe/raster fixes. | v6 is now a stable ecosystem baseline rather than prerelease research. The ESM-only package shape and explicit worker/shared-module delivery remain adoption concerns. | Exact `5.24.0`/`6.1.0` browser, query, worker, and strict-visual compatibility passed. Keep `5.24.0`; compatibility proof is not a bump approval. | high |
| MCP | `2026-07-28` is the stable latest revision, superseding `2025-11-25`. It removes protocol sessions and initialization, adds `server/discover`, moves protocol/capability context to per-request `_meta`, requires `resultType`, cache metadata, and subscription-listen behavior, and moves tasks to an extension. | The migration is architectural, not a version-string update. Current tool schemas and structured results remain valuable, but a 1.x server cannot claim the new lifecycle. | Keep the canonical ordered 14-tool, draft-07, `structuredContent`, diagnostic-envelope, and JSON-fallback contract on `2025-11-25`. The current compatibility decision remains No-go for default promotion or dual-revision claims. | high |
| GeoParquet | `1.1.0` remains the stable production specification. `2.0.0-rc.1`, published 2026-07-19, explicitly remains a release candidate even though file metadata uses `geo.version = 2.0.0`; it moves to native Parquet `GEOMETRY`/`GEOGRAPHY`, row-group spatial statistics, and removes the 1.1 GeoArrow/covering model. No `v2.0.0` final tag was present. | Readers must distinguish release identity from embedded metadata version and must not merge 1.1 and 2.0 semantics. | The version-discriminated metadata-readiness contract is accepted. Runtime fetch, parse, WASM, worker, display, and query remain No-go until final-spec review and a separate implementation gate. | high |
| PMTiles | The official repository still identifies PMTiles v3 as the current single-file tiled-archive specification; npm `pmtiles` is `4.4.1`. The v3 format requires a fixed header, root/leaf directories, compression and offset semantics, range-addressable sections, and explicit tile types. | A URL-compatible renderer path does not prove a spec-correct archive reader or feature-query engine. | Preserve URL-compatible vector display and IO-free load-plan Go; keep runtime archive load and feature query No-go. No current upstream signal removes the existing parser, resource-policy, budget, cancellation, cache, or query-semantics gates. | high |

## Competitive Interpretation

### MapLibre: Compatibility Is Closed, Adoption Is Not

The competitor signal changed materially: v6 is stable and `6.1.0` is npm
`latest`. GIS Engine also has stronger evidence than at W29 because exact native
installs of `5.24.0` and `6.1.0` passed strict public types, generated ESM build,
real Chromium lifecycle/query behavior, server-observed tile and worker paths,
and strict pixels. The remaining question is therefore an explicit product and
operations choice: whether ESM-only packaging, worker asset deployment, CSP,
repeat performance, rollback, and downstream adoption justify moving the
default. The completed compatibility issue must not be reopened as if evidence
were missing.

### MCP: The Stable Revision Requires A New Runtime Shape

MCP `2026-07-28` is final, not the RC tracked in W29. Its tool-result schema
continues to support `outputSchema` and `structuredContent`, and the specification
now loosens structured content to any JSON value while adding `$ref` resolution
and composition-resource requirements. The larger change is lifecycle:
stateless requests, `server/discover`, per-request version/capability metadata,
required `resultType`, cache fields, and `subscriptions/listen`. The official
TypeScript SDK now identifies split v2 packages as its stable line. GIS Engine's
current SDK 1.x server has explicit negative evidence for those surfaces, so
protocol adoption remains No-go even though the existing 14-tool content
contract is internally converged.

### GeoParquet: Model The RC, Do Not Pretend It Is Final

The upstream release notes support the repository's two-field model:
`releaseIdentity = 2.0.0-rc.1` identifies the reviewed artifact while raw
`geo.version = 2.0.0` reflects file metadata. The RC replaces 1.1's optional
GeoArrow encodings and bbox covering with native Parquet geospatial logical
types and row-group statistics. That is enough to justify fail-closed metadata
readiness, but not enough to widen the runtime. The next trigger is either a
`2.0.0` final artifact or an explicitly approved experimental reader issue;
neither may silently reinterpret the accepted 1.1 contract.

### PMTiles: Mature Format, Unchanged Runtime Burden

PMTiles remains a strong portable-delivery benchmark, but its v3 specification
continues to prove why a simplified loader is unsafe: directory compression,
leaf traversal, offsets, range requests, tile typing, and budgets are part of
the contract. No W32 source justifies changing GIS Engine's accepted split
between URL-compatible display/load-plan evidence and blocked archive
load/query behavior.

## Priority Recommendations

Formula from `AGENTS.md`:

```text
priority =
  competitor_threat * 0.35 +
  ai_operability_gain * 0.30 +
  user_value * 0.20 +
  technical_debt_reduction * 0.10 -
  delivery_risk * 0.05
```

Each factor is scored 0-10. The scores rank follow-up evidence work; they do
not override the No-go boundaries above.

| Rank | Candidate direction | Threat | AI gain | User value | Debt reduction | Delivery risk | Priority |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | MCP `2026-07-28` v2 migration evidence | 9 | 9 | 8 | 7 | 8 | **7.75** |
| 2 | GeoParquet 2.0 final-watch and contract reconciliation | 8 | 6 | 8 | 7 | 8 | **6.50** |
| 3 | PMTiles spec-correct runtime promotion gate | 7 | 6 | 9 | 8 | 9 | **6.40** |
| 4 | MapLibre `6.1.0` default-adoption decision | 8 | 4 | 8 | 7 | 6 | **6.00** |

Factor rationale:

- MCP scores highest because the ecosystem stable line now has a different
  lifecycle and SDK package shape; migration would materially improve current
  interoperability, but transport, cache, subscription, and fallback work make
  delivery risk high.
- GeoParquet has strong user and ecosystem value, but the reviewed artifact is
  still an RC and runtime implementation would add parser/resource complexity.
- PMTiles has direct browser-delivery value and reduces a long-lived capability
  gap, while its archive/query correctness and resource-security burden remains
  the highest in this set.
- MapLibre stable-v6 pressure is real, but exact compatibility is already
  proven; the remaining adoption decision yields less AI-operability gain than
  MCP or data-runtime work.

## Recommendations With Ownership

| Recommendation | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- |
| Define an MCP v2 migration intake, not a default bump | Official stable release/changelog; official TypeScript SDK v2 line; local No-go matrix for discovery, per-request lifecycle, result type, cache metadata, and subscriptions | AI interoperability, public contract, transport security, and rollback | `@orchestrator` may open one bounded discovery/transport conformance issue owned by `@builder` (AI focus). `@quality` must keep default promotion blocked until both revision matrices pass with the frozen 14-tool content contract. | high |
| Watch GeoParquet 2.0 final and reconcile exact schema deltas before runtime work | Official 1.1 release, official `2.0.0-rc.1` release, and local version-discriminated metadata gate | Data compatibility and truthful capability reporting | `@product` rechecks the official tag/schema when final appears; `@orchestrator` opens a new contract-delta issue only then. Keep runtime unsupported and do not silently widen the RC union. | high |
| Keep PMTiles runtime promotion independently gated | Official v3 specification and local capability-truth decision | Cloud-native workflow value, resource security, and product trust | Do not reopen the completed capability-truth issue. A new implementation issue must prove spec-correct directory traversal, caller-controlled range IO, budgets, cancellation, cache, decode ownership, adapter query semantics, and diagnostics before `@quality` considers Go. | high |
| Separate MapLibre adoption from completed compatibility evidence | Official `5.24.0`/`6.1.0` releases, npm latest, and exact dual-version browser matrix | Primary renderer packaging, CSP/worker delivery, performance, and rollback | Keep `5.24.0`. If dependency movement is desired, `@orchestrator` opens a small adoption-only issue for repeated performance, downstream package/example compatibility, worker asset deployment, rollback, and release evidence. | high |

## HOC-N1 Handoff: @product -> @orchestrator

**Status:** `ready-for-planning`

Accepted inputs:

1. `docs/research/competitor-updates-2026-W32.md`
2. `docs/research/capability-scorecard.md`

Planning intake:

- Preserve the four existing boundaries: MapLibre `5.24.0` default, MCP
  `2025-11-25` default, GeoParquet runtime No-go, and PMTiles archive/query
  No-go.
- Treat the completed MapLibre, MCP compatibility, and GeoParquet metadata
  issues as evidence inputs, not unfinished implementation work.
- Rank MCP v2 conformance research first. Trigger GeoParquet reconciliation on
  a final `2.0.0` artifact. Schedule PMTiles runtime or MapLibre default
  adoption only through separately approved gates.
- Merge this advisory handoff with fresh HOC-N3 evidence before changing a
  public default, capability status, or release claim.

## Official Source Ledger

All external entries were checked on **2026-08-06** (Asia/Shanghai).

| Area | Official source | Observed evidence |
| --- | --- | --- |
| MapLibre baseline | https://github.com/maplibre/maplibre-gl-js/releases/tag/v5.24.0 | Non-prerelease `5.24.0`, published 2026-04-23; glyph/halo and matrix/GPU-stall optimizations. |
| MapLibre current | https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.1.0 and https://registry.npmjs.org/maplibre-gl/latest | Non-prerelease `6.1.0`, published 2026-07-30, and npm `latest`; ESM export shape plus the release features/fixes summarized above. |
| MCP releases | https://github.com/modelcontextprotocol/modelcontextprotocol/releases/tag/2026-07-28 | `2026-07-28` is a stable release; the official latest-spec redirect resolves to this revision. |
| MCP revision delta | https://modelcontextprotocol.io/specification/2026-07-28/changelog | Stateless lifecycle, discovery, MRTR/result types, subscriptions, cache metadata, schema changes, and deprecations relative to `2025-11-25`. |
| MCP tools | https://modelcontextprotocol.io/specification/2025-11-25/server/tools and https://modelcontextprotocol.io/specification/2026-07-28/server/tools | Both define tool schemas/structured results; the new revision adds per-request metadata, deterministic list guidance, result/cache fields, MRTR, and subscription behavior. |
| MCP SDK | https://github.com/modelcontextprotocol/typescript-sdk and https://registry.npmjs.org/@modelcontextprotocol/server/latest | Official README identifies split v2 packages as the stable `2026-07-28` line; server package is `2.0.0`. |
| GeoParquet 1.1 | https://github.com/opengeospatial/geoparquet/releases/tag/v1.1.0 | Stable 1.1 specification with optional bbox covering and GeoArrow-native encodings. |
| GeoParquet 2.0 RC | https://github.com/opengeospatial/geoparquet/releases/tag/v2.0.0-rc.1 | Published 2026-07-19; explicitly a release candidate, with native Parquet geospatial types and row-group statistics; no final `v2.0.0` tag was listed. |
| PMTiles | https://github.com/protomaps/PMTiles and https://github.com/protomaps/PMTiles/blob/main/spec/v3/spec.md | README identifies v3 as current; v3 specifies the single-file header/directory/metadata/tile-data contract. npm `pmtiles` latest is `4.4.1`. |

## Guardrails

- Do not claim latest-version support from compatibility or metadata evidence.
- Do not turn a stable upstream release into an automatic GIS Engine default.
- Do not treat GeoParquet `geo.version = 2.0.0` in the RC as proof that a final
  `2.0.0` release exists.
- Do not infer PMTiles runtime archive load/query from URL-compatible MapLibre
  display or caller-supplied fixture evidence.
- Recheck the official sources in the run that proposes any default, schema,
  runtime, roadmap, or release change.
