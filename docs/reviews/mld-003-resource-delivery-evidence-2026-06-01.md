---
agent: docs-agent
period: 2026-06-01
generated_at: 2026-06-01T13:50:38Z
repo_revision: "7273745b8b024e1c839b34c2a22ccc9a14984304"
inputs:
  - docs/reviews/mld-002-maplibre-drift-audit-2026-05-31.md
  - docs/planning/feature-specs/cloud-native-source-readiness.md
  - docs/planning/feature-specs/generated-app-delivery-ux.md
  - docs/engineering/maplibre-version-drift-audit.md
  - packages/ai/src/tools/generationEvidence.ts
  - packages/ai/src/tools/exportExampleApp.ts
  - packages/engine/src/spec/resource-policy.ts
  - packages/engine/src/sources/contract.ts
owner: "@engine-agent @ai-agent @docs-agent"
decision_level: advisory
---

# MLD-003 Resource And Delivery Evidence

## Decision

The MapLibre source drift resource and generated-app delivery boundary is
accepted for this sprint. The current implementation keeps PMTiles and vector
tile sources in display/export/readiness evidence only, preserves resource
policy ownership, and does not introduce package movement, PMTiles archive
parsing, vector tile decoding, hidden fetches, new MCP aliases, or stable
SceneView3D runtime support.

`SourceLoader` is present as an exported engine-level contract in
`packages/engine/src/sources/contract.ts`, but it remains contract-only. It
does not own fetch, decode, worker, archive, feature-query, or runtime loading
behavior in this batch.

## Evidence

| Check | Result | Evidence | Impact | Action | Confidence |
| --- | --- | --- | --- | --- | --- |
| PMTiles boundary | pass | `docs/planning/feature-specs/cloud-native-source-readiness.md` keeps PMTiles URL-compatible display/export supported and archive parsing, metadata, range access, mutation/export handoff, and feature query readiness-only. | AI delivery can show PMTiles as inspectable source evidence without claiming archive runtime support. | Keep future PMTiles archive metadata or feature-query work as separate promotion tasks. | high |
| Vector tile boundary | pass | `docs/planning/feature-specs/cloud-native-source-readiness.md` keeps vector URL display/export supported while headless feature query remains unsupported until decode/source-layer semantics exist. | Generated apps can reference vector URL examples without promising deterministic query support. | Require tile decode, source-layer, feature id, extent, and ordering contracts before query promotion. | high |
| Delivery mapping | pass | `packages/ai/src/tools/generationEvidence.ts` builds `delivery.sourceReadiness`, confirmation reasons, follow-up tasks, and `delivery.spatialQueryReadiness` from structured evidence fields. | Review UI and agents do not need prose parsing to distinguish ready, needs-confirmation, follow-up-required, and blocked states. | Preserve the current `generationEvidence.delivery` shape unless a schema-first task changes it. | high |
| Resource policy | pass | `docs/engineering/maplibre-version-drift-audit.md`, `packages/engine/src/spec/resource-policy.ts`, and resource tests keep URL/tile/worker/archive implications explicit before package movement. | Source drift cannot silently add hidden network or worker behavior. | Re-run resource-policy tests for every future URL, worker, archive, or example asset change. | high |
| SourceLoader state | pass | `packages/engine/src/sources/contract.ts` exports `SourceLoader`, `SourceLoaderFactory`, `SourceCapabilitySummary`, and `SOURCE_CAPABILITY_PRESETS` as advisory contract-only surface. | Architecture docs should no longer list SourceLoader as unstarted, but runtime source loading is not implemented. | Keep runtime loading delegated to adapters until a separate SourceLoader implementation task exists. | high |
| MCP contract | pass | Existing MCP tool names remain `validate_spec`, `apply_commands`, `export_spec`, `get_context_summary`, `snapshot_spec`, `explain_spec`, and `export_example_app`. | Source readiness can be exposed through existing evidence without alias sprawl. | Do not add a source drift or spatial query MCP alias in this batch. | high |

## Boundaries Preserved

- No `maplibre-gl` upgrade or lockfile dependency movement.
- No new public `SourceSpec` type beyond the existing GeoJSON, raster, PMTiles,
  and vector source contracts.
- No PMTiles archive open, metadata read, range request, or worker startup.
- No vector tile decode, feature query, or source-layer query semantics.
- No browser-side fetch hidden behind generated-app export.
- No stable `view.mode: "scene3d"` promotion.

## Verification

Required for the implementation handoff:

- `pnpm -s test:resources`
- `pnpm -s test:ai`
- `pnpm -s test:docs`
- `pnpm -s check`
- `git diff --check`

This report satisfies `TASK-2026W22-MLD-003`. The next MLD task is the
quality-guardian/coordinator Go-No-go gate for package movement.
