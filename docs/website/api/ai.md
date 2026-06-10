# @gis-engine/ai

`@gis-engine/ai` is the AI and MCP package for GIS Engine v1.0.0.

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

- The public MCP surface remains seven snake_case tools.
- `export_example_app` exposes manifests and delivery evidence; it does not
  write files itself.
- Scene browsing remains extension-only delivery evidence and must not be cited
  as stable renderer proof.

## Reference

- Generated reference: [/api/reference/ai/](/api/reference/ai/)
