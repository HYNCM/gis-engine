import { describe, expect, it } from "vitest";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import commands from "../fixtures/commands/replay/style-update/commands.json";
import { callGisEngineTool, createGisEngineMcpServer, listGisEngineTools } from "@gis-engine/ai";

describe("MCP Server Integration", () => {
  it("defines the expected v0.1 tools without starting stdio", async () => {
    const server = createGisEngineMcpServer();
    const { tools } = await listGisEngineTools();

    expect(server).toBeDefined();
    expect(tools.map((tool) => tool.name)).toEqual(["apply_commands", "validate_spec", "export_spec", "get_context_summary"]);
  });

  it("handles validate_spec through a pure handler", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "validate_spec",
        arguments: {
          spec: {
            version: "0.1",
            view: { center: [200, 100] },
            sources: {},
            layers: []
          }
        }
      }
    });

    const report = JSON.parse(result.content[0]!.text) as { valid: boolean; diagnostics: Array<{ code: string }> };
    expect(report.valid).toBe(false);
    expect(report.diagnostics.some((diagnostic) => diagnostic.code === "GEO.INVALID_COORDINATES")).toBe(true);
  });

  it("exports a command-modified spec through a pure handler", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "export_spec",
        arguments: {
          spec: before,
          commands
        }
      }
    });

    const spec = JSON.parse(result.content[0]!.text) as { revision?: string };
    expect(spec.revision).toBe("2");
  });

  it("returns compact context summaries for AI planning", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "get_context_summary",
        arguments: { spec: before }
      }
    });

    const summary = JSON.parse(result.content[0]!.text) as {
      id?: string;
      revision?: string;
      sources: Array<{ id: string; type: string }>;
      layers: Array<{ id: string; visibility: string }>;
      validation: { valid: boolean; diagnosticCounts: { error: number } };
    };
    expect(summary.id).toBe("style-update");
    expect(summary.revision).toBe("1");
    expect(summary.sources).toEqual([{ id: "districts", type: "geojson" }]);
    expect(summary.layers[0]).toMatchObject({ id: "district-fill", visibility: "visible" });
    expect(summary.validation).toMatchObject({ valid: true, diagnosticCounts: { error: 0 } });
  });
});
