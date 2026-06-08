# Release Wording Guardrails

This document is the public-copy guardrail for release notes, README files, AI
handoff docs, and generated-app review copy. It prevents evidence snapshots from
being promoted into user-facing capability claims before their gates pass.

## Scope

Apply these rules to:

- `README.md` and `CHANGELOG.md`.
- Package READMEs for `@gis-engine/ai`, `@gis-engine/scene3d`, and
  `@gis-engine/scene3d-three-adapter`.
- Release notes and checklists under `docs/planning/`.
- Public capability docs under `docs/engineering/` and
  `docs/planning/feature-specs/`.

## Guardrails

| Topic | Allowed wording | Forbidden wording |
| --- | --- | --- |
| SceneView3D runtime | Say `extensions.scene3d` is extension-only, mock/query evidence is readiness evidence, and stable `view.mode: "scene3d"` remains blocked until a future accepted promotion gate. | Do not claim stable SceneView3D runtime support, production 3D rendering, or stable renderer availability. |
| Generated-app export | Say `export_example_app` returns manifest and file metadata, remains side-effect free, and does not fetch, parse, or write files. | Do not describe generated-app delivery as writing, saving, persisting, or packaging files on disk. |
| Cloud-native sources | Say GeoJSON/raster/vector/PMTiles are bounded by the current source matrix, PMTiles has IO-free load-plan and source-readiness preflight for URL-compatible MapLibre vector delivery, PMTiles archive parsing and feature query are readiness-only, GeoParquet and FlatGeobuf are public `MapSpec` source contracts with runtime blocked, and GeoTIFF/GeoZarr remain blocked. | Do not claim blocked formats have runtime loaders, parsers, workers, feature queries, or export mutation support. |
| Spatial analysis | Say point/bbox query evidence is readiness evidence and buffer, intersection, overlay, routing, aggregation, and richer geoprocessing stay behind future promotion tasks. | Avoid any public copy that presents advanced geoprocessing as available capability. |

## Release Check

Before closing a release wording task:

- Run `pnpm test:docs` for the wording guardrail scan.
- Run `pnpm check` for the full deterministic gate.
- Run `pnpm test:release:scene3d` only if the wording or evidence changes any
  SceneView3D release visual claim.
- Record a dated review report that names the audited files and any remaining
  follow-up work.

## Safe Copy Examples

- "Generated-app scene browsing is extension-only and must not be cited as
  stable renderer evidence."
- "`export_example_app` is a side-effect-free manifest handoff."
- "PMTiles is URL-compatible display/export evidence, while archive parsing and
  feature query stay readiness-only."
- "PMTiles load-plan preflight checks URL policy, source-layer metadata, and
  optional archive metadata budgets without fetching or parsing the archive."
- "Source-readiness preflight reports supported, readiness-only, and blocked
  source states without fetching resources or starting workers."
- "Buffer, overlay, routing, intersection, and aggregation are blocked until
  operation-specific schemas, diagnostics, fixtures, and MCP exposure review
  exist."
