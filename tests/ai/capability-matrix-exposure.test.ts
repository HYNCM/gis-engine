import { callGisEngineTool, gisEngineTools } from "@gis-engine/ai";
import { buildEngineCapabilityMatrix } from "@gis-engine/engine";
import Ajv from "ajv";
import { describe, expect, it } from "vitest";

const minimalSpec = {
  version: "0.1",
  view: { center: [0, 0], zoom: 2 },
  sources: {},
  layers: [],
};

async function structuredContentOf(name: string, args: unknown): Promise<Record<string, unknown>> {
  const descriptor = gisEngineTools.find((tool) => tool.name === name);
  if (!descriptor) throw new Error(`Missing MCP descriptor for ${name}.`);

  const result = await callGisEngineTool({ params: { name, arguments: args } });
  const validate = new Ajv({ strict: false }).compile(descriptor.outputSchema as object);

  expect(result.isError, `${name} should succeed`).toBeUndefined();
  expect(validate(result.structuredContent), `${name} structuredContent must match outputSchema`).toBe(true);

  return result.structuredContent as Record<string, unknown>;
}

describe("capability matrix exposure", () => {
  it("keeps the canonical 14-tool inventory unchanged", () => {
    expect(gisEngineTools.map((tool) => tool.name)).toEqual([
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
    ]);
  });

  it("validate_spec reports exactly the matrix the engine derives", async () => {
    const content = await structuredContentOf("validate_spec", { spec: minimalSpec });

    expect(content.capabilities).toEqual(buildEngineCapabilityMatrix());
  });

  it("get_context_summary reports the matrix alongside capabilitySummary", async () => {
    const content = await structuredContentOf("get_context_summary", { spec: minimalSpec });
    const matrix = content.capabilityMatrix as ReturnType<typeof buildEngineCapabilityMatrix>;

    expect(matrix.available).toContain("evidence.build");
    // Order follows SCENE3D_BLOCKERS in capability-matrix.ts: view mode, renderer, dimensions.
    expect(matrix.blocked.map((entry) => entry.code)).toEqual([
      "SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED",
      "SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED",
      "SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED",
    ]);
  });
});
