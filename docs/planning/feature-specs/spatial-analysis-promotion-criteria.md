---
agent: qa-agent
period: 2026-W22
generated_at: 2026-05-30T05:05:17Z
repo_revision: "40655ce798d4bbad5067a4ecafab915c45456392"
inputs:
  - docs/planning/feature-specs/spatial-analysis-readiness.md
  - packages/engine/src/spec/schemas/generation.schema.ts
  - packages/engine/src/generation/commandSkeleton.ts
  - packages/engine/src/renderer/queryGeoJson.ts
  - packages/ai/src/tools/generationEvidence.ts
  - tests/commands/map-generation-contract.test.ts
  - tests/ai/generation-evidence.test.ts
owner: "@qa-agent"
decision_level: advisory
---

# Spatial Analysis Promotion Criteria

This is the `TASK-2026W22-AIN-004` promotion plan. It keeps spatial analysis in
the current readiness/evidence lane until each future operation has schema,
semantics, diagnostics, fixtures, and AI exposure review. It does not add a new
MCP tool name and does not implement geoprocessing.

## Current Baseline

| Capability | Current Claim | Evidence |
| --- | --- | --- |
| Point query readiness | supported as deterministic evidence for inline GeoJSON layers | `analysisEvidence.acceptedQueryOperations`, `spatialQueryEvidence.cases`, `queryInlineGeoJsonFeatures()` |
| Bbox query readiness | supported as deterministic evidence for inline GeoJSON layers | bbox case counts, hidden/missing layer diagnostics, AI evidence tests |
| Buffer/intersection/overlay/routing/aggregation | blocked | `MapGenerationAnalysisOperationSchema`, command skeleton diagnostics, capability summary blocked copy |

## Promotion Gate Matrix

| Operation | Schema Gate | Semantics Gate | Diagnostics Gate | Fixture Gate | MCP Exposure Assessment | Finish Gates |
| --- | --- | --- | --- | --- | --- | --- |
| Point query hardening | keep operation input stable; add output evidence schema only if result payloads become public | read-only evidence only; no command mutation | invalid point, missing layer/source, hidden layer, unsupported source, empty result | inline GeoJSON point, multipoint, polygon hit, duplicate id, empty result | stay inside `GenerationEvidenceBundle` unless a future query tool is approved | `pnpm test:commands`; `pnpm test:ai`; `pnpm check` |
| Bbox query hardening | keep bbox tuple stable; add result caps if payloads become public | read-only evidence only; no command mutation | invalid bbox, reversed bounds, missing source, unsupported source, large result cap | inline GeoJSON bbox, boundary touch, polygon overlap, empty extent | stay inside generation evidence; no public query MCP alias yet | `pnpm test:commands`; `pnpm test:ai`; `pnpm check` |
| Buffer | operation-specific input schema with distance, units, source/layer target, output mode | command semantics required if output creates layers; read-only evidence if only previewing | invalid distance/units, CRS unknown, unsupported geometry, oversized output | deterministic point/line/polygon fixtures with CRS note and result count | explicit assessment before any MCP tool; default is blocked planner intent | schema sync, command replay tests, AI contract tests, snapshot if output layer renders |
| Intersection | input schema for source/layer pairs, predicates, output mode | read-only evidence first; command semantics only for materialized result layers | missing layer/source, incompatible geometry, empty intersection, result cap | polygon/polygon, line/polygon, point/polygon fixtures | keep as blocked until output schema and diagnostics are stable | command/AI tests, fixture determinism, snapshot if materialized |
| Overlay | input schema for operation type, source order, attribute merge policy | command semantics required for generated layers; provenance required for merge policy | unsupported merge policy, geometry mismatch, attribute conflict, result cap | union/difference-style fixtures only after semantics freeze | requires MCP exposure review because output shape can be large | schema sync, command replay/rollback, AI tests, visual smoke if rendered |
| Routing | input schema for graph source, waypoints, mode, constraints | read-only evidence first; no hidden network/service calls | missing graph, unsupported mode, unreachable route, external service blocked | local graph fixture with deterministic route id and distance | no public MCP route tool until resource policy and graph contract exist | resource-policy tests, command/AI tests, perf smoke for graph size |
| Aggregation | input schema for grouping, bins, metrics, output style | read-only summary first; command semantics if creating layers | unsupported metric, invalid bin, empty group, large result cap | point grid/bin fixtures with deterministic counts | may remain generation evidence until payload contracts are stable | AI tests, snapshot if rendered, perf smoke for result size |

## Acceptance Checklist Before Any Operation Promotion

- TypeBox input and output schemas exist, or the operation remains explicitly
  blocked in `MapGenerationAnalysisOperationSchema`.
- Runtime mutation, if any, goes through `MapCommand` and has replay, rollback,
  conflict, and changed-path evidence.
- Read-only operations return deterministic evidence with stable layer/source
  ids, result caps, and diagnostic counts.
- Every failure path has a stable diagnostic code and JSON pointer path.
- Resource policy covers URLs, workers, graph data, archive reads, remote
  services, and timeout/byte budgets before any IO occurs.
- MCP exposure is assessed through the existing tool list first; a new public
  tool name requires a separate approved contract task.
- Generated-app delivery can show blocked or follow-up state without parsing
  natural-language diagnostics.

## Point / Bbox Hardening Addendum

`point-query` and `bbox-query` are the only operations eligible for near-term
hardening, but promotion still needs stronger QA evidence before they can be
described as more than readiness evidence:

- Adapter query capability must be explicit. A future promotion cannot infer
  support merely because inline GeoJSON mock evidence succeeded; the fixture
  must either provide `capabilities.queries` with the required query mode or
  record an explicit waiver.
- Invalid input fixtures must cover non-finite coordinates, reversed bbox,
  missing layers, missing sources, hidden layers, URL GeoJSON, PMTiles, vector
  sources, large result caps, and empty results.
- Unsupported source diagnostics must keep stable paths such as
  `/sources/{id}/data`, `/sources/{id}/url`, or `/sources/{id}` so AI tools can
  map failures back to generated-app delivery sections.
- These hardening tasks still do not authorize buffer, intersection, overlay,
  routing, aggregation, or a public query MCP tool.

## Recommended Next Tasks

| id | Title | Priority | Exit Evidence |
| --- | --- | --- | --- |
| TASK-2026W22-AIN-004A | Harden point/bbox query evidence fixtures | P1 | Explicit adapter query capability gate, invalid point/bbox/source fixtures, result caps, and no new MCP alias. |
| TASK-2026W22-AIN-004B | Specify buffer output semantics | P1 | Schema/command/diagnostic proposal with rollback and snapshot strategy before implementation. |
| TASK-2026W22-AIN-004C | Specify overlay/intersection semantics | P2 | Geometry and attribute merge contract with deterministic fixtures. |
| TASK-2026W22-AIN-004D | Specify routing resource contract | P2 | Local graph schema, resource-policy paths, and no hidden network service rule. |
| TASK-2026W22-AIN-004E | Specify aggregation result contract | P2 | Metric/bin/output schema with result caps and generated-app delivery states. |
