# @gis-engine/ai

`@gis-engine/ai` is the AI and MCP package for GIS Engine v1.1.0.

## What Lives Here

- MCP server wiring and tool descriptors
- public tool input/output schemas
- context summary, explain, snapshot, and export helpers
- generation evidence and generated-app delivery summaries
- workbench/provider-plan normalization utilities

## Reading Order

1. Use the [MCP overview](/mcp/overview) for tool behavior and workflow.
2. Use the [AI generated reference](/api/reference/ai/) for exact exports and
   types.
3. Use the release wording and feature-matrix docs for capability limits.

## Key Boundaries

- The public MCP surface is the canonical 14-tool snake_case inventory in
  `tools/list` order: `apply_commands`, `validate_spec`, `export_spec`,
  `get_context_summary`, `snapshot_spec`, `explain_spec`,
  `export_example_app`, `diff_specs`, `generate_spec`, `inspect_data`,
  `edit_spec`, `query_features`, `style_recommend`, `transform_data`.
- `export_example_app` exposes manifests and delivery evidence; it does not
  write files itself.
- Scene browsing remains extension-only delivery evidence and must not be cited
  as stable renderer proof.

## Reference

- Generated reference: [/api/reference/ai/](/api/reference/ai/)
