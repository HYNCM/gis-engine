# Project Definition

Generated: 2026-08-09
Status: Confirmed product direction

## Definition

GIS Engine Workbench is the primary product: a local-first, open-source AI
development workbench for WebGIS engineers. A target user should be able to
turn data and a natural-language requirement into a reviewed, validated 2D Web
map project that can enter Git within 30 minutes.

`@gis-engine/engine`, `@gis-engine/ai`, the CLI, and the MCP server form the
shared product foundation. They are not parallel product narratives. `MapSpec`
remains the executable, schema-first map blueprint and the stable interchange
contract between Workbench, automation, and generated projects. Its generic
model remains a core contract plus extension surface,
not a hard-coded model centered on the current 2D path.

AI output is never trusted as project state. A model first proposes a
structured plan; the user previews map, file, diagnostic, snapshot, and
rollback evidence; only an explicit apply request may commit a transaction.

## Target User And Golden Path

The v1 user is a WebGIS engineer who can read code and `MapSpec`.

The golden path is:

1. Create or reopen a local project.
2. Add GeoJSON, an approved URL, vector/raster tiles, or an existing `MapSpec`.
3. Describe the desired map behavior.
4. Review the structured AI plan and its evidence.
5. Explicitly apply the plan to the current revision.
6. Preview and confirm export of a buildable TypeScript Web project.

## Product Boundaries

- Workbench is versioned independently as a `0.x` product until its own v1
  gates pass. Engine semver does not imply Workbench maturity.
- v1 promises MapLibre 2D only. 3D remains an adapter extension slot behind its
  independent promotion gate.
- The local, open-source core is the product. Cloud collaboration, hosted
  previews, and enterprise governance are optional post-v1 products and require
  explicit user demand.
- The canonical MCP inventory remains the established 14 tools in `tools/list`
  order: `apply_commands`, `validate_spec`, `export_spec`,
  `get_context_summary`, `snapshot_spec`, `explain_spec`,
  `export_example_app`, `diff_specs`, `generate_spec`, `inspect_data`,
  `edit_spec`, `query_features`, `style_recommend`, `transform_data`.
  Workbench does not add Workbench aliases or product-specific MCP tools.
- Project files are the source of truth: `gis-engine.project.json`,
  `mapspec.json`, project data, and export evidence. SQLite may index or cache
  state but may not be the only durable representation.
- AI credentials remain server-side. Export never includes credentials or raw provider
  responses. Telemetry never includes raw prompts, data, `MapSpec`, file paths,
  credentials, or raw provider responses.
- Anonymous telemetry is minimal, opt-in, and disabled until the user gives
  explicit consent.

## Success Gates

Alpha requires five target engineers, at least 80% golden-path completion in
30 minutes, buildable exports for every completed run, and no credential or raw
data leakage.

Local v1 requires at least ten target users, at least 80% golden-path success,
P90 completion no slower than 30 minutes, blocking diagnostics never reported
as success, and stable 2D visual and export gates.

## Out Of Scope

- A complete low-code GIS product.
- A MapLibre or Cesium replacement.
- Stable 3D runtime promotion as part of Workbench v1.
- Cloud-native format runtime breadth ahead of the golden path.
- An autonomous agent that applies changes without confirmation.
- Official cloud collaboration before local v1 evidence and user demand.

The detailed v1 contract and acceptance matrix live in
[`docs/planning/feature-specs/gis-engine-workbench-v1.md`](../planning/feature-specs/gis-engine-workbench-v1.md).
