# Contract Freeze Checklist

This file records the public API freeze boundary for the v0.1 base, the
2026-05-17 v0.2 checkpoint additions, and the 2026-05-18 SceneView3D v1
preparation surface. Changes to these areas require an explicit
breaking/non-breaking note in the PR summary.

## Frozen Boundary

- `packages/engine/src/types.ts`
- `packages/engine/src/spec/schemas/*.ts`
- `packages/engine/src/index.ts`
- `packages/ai/src/tools/*`
- `packages/scene3d/src/index.ts`
- MCP tool names, input schema, output schema, and JSON result shape

## Current v0.1 Contract Additions

- `ApplyOptions.traceId`
- `ApplyCommandsResult.transaction`
- `ApplyCommandsResult.dryRun`
- `ApplyCommandsResult.committed`
- `ApplyCommandsResult.rolledBack`
- `ApplyCommandsResult.traceId`
- `CommandResult.sequenceId`
- `get_context_summary` MCP tool

## Current v0.2 Checkpoint Additions

- `vector` source contract with `tiles[]` or `url` and optional `sourceLayer`, `minzoom`, `maxzoom`, `attribution`.
- `CapabilityReportSchema` as a public schema artifact.
- MCP tool descriptors with `outputSchema` for every public tool.
- Strict `CapabilityReportSchema` validation for context/explain tool inputs.
- Expanded expression contract: `case`, `match`, `zoom`, `to-number`, `to-string`.
- `fill-extrusion-lite` experimental gate.
- Reserved `scene3d` unsupported diagnostics.

## Current SceneView3D v1 Prep Additions

- `SceneView3DExtensionSchema` as the public v1 3D extension schema for
  `extensions.scene3d`.
- Scene source URL policy diagnostics under
  `/extensions/scene3d/sources/{sourceId}/url`.
- Scene layer-source reference diagnostics while 3D data remains under
  `extensions.scene3d`.
- SceneView3D preparation commands: `setSceneCamera`, `addSceneSource`,
  `removeSceneSource`, `addSceneLayer`, `removeSceneLayer`, and
  `setSceneLayerVisibility`.
- `@gis-engine/scene3d` package boundary scaffold, including capability report
  shape, unsupported scaffold diagnostics, and dependency guard expectations.
- `validateSceneResourceLoadPlan` as the loader-level 3D resource policy gate
  for 3D Tiles JSON bytes, model bytes, texture budgets, worker cap, timeout,
  missing source, and unsupported asset type diagnostics.
- `SECURITY.UNSUPPORTED_ASSET_TYPE` diagnostic code.
- `snapshotScene3DMock` and `queryScene3DMock` as mock-level 3D snapshot/query
  contracts.
- `SNAPSHOT.RESOURCE_PENDING` diagnostic code.
- SceneView3D context summary shape in `get_context_summary` and
  `explain_spec` output schemas.
- `evaluateScene3DReleaseVisualGate` as the release-runner 3D visual gate for
  mock snapshot/query evidence, optional renderer visual evidence, and
  coordinator waiver enforcement.
- `view.mode: "scene3d"`, `capabilities.renderer: "scene3d"`, and
  `capabilities.dimensions: ["3d"]` remain reserved unsupported runtime
  requests until the v1 renderer package passes resource, snapshot, query, and
  release visual gates.

## Current v0.2 GA Additions

- `@gis-engine/cli` package with `create-gis-map` bin, `static-html`, `vite-ts`,
  and `mapspec` templates, and `generate` pipeline (prompt hash → provider plan
  → `planMapGenerationRequest()` → command skeleton → `applyCommands()` →
  `validateSpec()` → evidence bundle).
- `@gis-engine/engine` `maplibre-gl` optional `peerDependency` (`^5.0.0 || ^6.0.0`).
- `@gis-engine/cli` exports: `main()`, `parseArgs()`, `getTemplate()`,
  `TEMPLATES`, `createProviderDiagnostics()`, `generate()`.
- CDN root ESM entry reads each package's `exports["."].import` for browser-side
  `import { ... } from "https://unpkg.com/@gis-engine/engine"` usage.
- `@gis-engine/scene3d` included in CDN coverage; `scene3d-three-adapter`
  remains internal/experimental and is not part of the GA publish workflow.
- All published packages use `files` whitelist: `["dist", "README.md"]`
  (CLI adds `"templates"`).
- Bundle budgets: engine < 130KB gzipped, cli < 35KB gzipped.
- MCP tool names remain frozen: `validate_spec`, `apply_commands`,
  `export_spec`, `get_context_summary`, `snapshot_spec`, `explain_spec`,
  `export_example_app`. No `generate_map_app` or `spatial_query` alias.

## RFC-QC Fast Track

Use an `RFC-QC-*` note for contract-quality-control changes that are narrow, urgent, and easy to review without reopening the full architecture process.

Eligible changes:

- Clarify ambiguous public contract text without changing runtime behavior.
- Add diagnostics, metadata, or examples that do not require existing callers to change.
- Tighten validation for states that were already invalid or unsupported.
- Document known limitations, operational requirements, or migration notes.

Not eligible for fast track:

- Remove, rename, or retype a public field, command, schema, or MCP result property.
- Change default runtime behavior in a way existing callers can observe.
- Introduce a new required field or new required caller workflow.
- Expand the frozen boundary without an owner-approved freeze note.

## Approval SLA

- `RFC-QC-*` fast-track review target: 1 business day from PR ready-for-review.
- Standard non-breaking contract review target: 2 business days.
- Breaking contract review target: 3 business days and requires an explicit migration note.
- If the SLA expires without review, the author must refresh the PR summary with current risk, test evidence, and whether the change is still time-sensitive before merging.

## Breaking vs Non-Breaking Rules

Breaking changes include:

- Removing, renaming, or changing the type or meaning of a public schema field.
- Changing command, patch, transaction, diagnostic, or MCP result shapes in a way that can break existing integrations.
- Making an optional public field required.
- Changing error codes, trace semantics, revision conflict behavior, or export shape without backward compatibility.

Non-breaking changes include:

- Adding optional fields with documented defaults or absence semantics.
- Adding new diagnostic codes while preserving existing codes and result shape.
- Clarifying docs, examples, or supported-feature notes.
- Tightening validation only for inputs already documented as invalid or unsupported.

When in doubt, treat the change as breaking until the reviewer explicitly records why it is compatible.

## Review Gate

- Run `pnpm check`.
- Run `pnpm build:schema` when schema files change.
- Update README/docs when implementation status or supported features change.
- Public schema field changes must include a changelog or version-policy note.
