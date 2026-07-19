export const GIS_ENGINE_TOOL_NAMES = [
  "apply_commands",
  "validate_spec",
  "export_spec",
  "get_context_summary",
  "snapshot_spec",
  "explain_spec",
  "export_example_app",
  "diff_specs",
  "generate_spec",
  "inspect_data",
  "edit_spec",
  "query_features",
  "style_recommend",
  "transform_data",
] as const;

export type GisEngineToolName = (typeof GIS_ENGINE_TOOL_NAMES)[number];

export const GisEngineToolNameSchema = {
  type: "string",
  enum: GIS_ENGINE_TOOL_NAMES,
} as const;
