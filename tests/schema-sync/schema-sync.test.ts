import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import {
  ApplyCommandsToolInputSchema,
  DiagnosticCodes,
  DiagnosticSchema,
  MapCommandSchema,
  MapSpecSchema
} from "@gis-engine/engine";
import {
  ExplainSpecToolInputSchema,
  ExportExampleAppToolInputSchema,
  SnapshotSpecToolInputSchema,
  exportExampleAppTool,
  gisEngineTools
} from "@gis-engine/ai";

describe("schema sync gate", () => {
  it("compiles all public schemas with Ajv", () => {
    const ajv = new Ajv({ strict: false });

    expect(() => ajv.compile(MapSpecSchema)).not.toThrow();
    expect(() => ajv.compile(MapCommandSchema)).not.toThrow();
    expect(() => ajv.compile(DiagnosticSchema)).not.toThrow();
    expect(() => ajv.compile(ApplyCommandsToolInputSchema)).not.toThrow();
    expect(() => ajv.compile(SnapshotSpecToolInputSchema)).not.toThrow();
    expect(() => ajv.compile(ExplainSpecToolInputSchema)).not.toThrow();
    expect(() => ajv.compile(ExportExampleAppToolInputSchema)).not.toThrow();
  });

  it("keeps apply_commands tool schema aligned with ApplyOptions", () => {
    expect(ApplyCommandsToolInputSchema.properties).toHaveProperty("spec");
    expect(ApplyCommandsToolInputSchema.properties).toHaveProperty("commands");
    expect(ApplyCommandsToolInputSchema.properties).toHaveProperty("dryRun");
    expect(ApplyCommandsToolInputSchema.properties).toHaveProperty("transaction");
    expect(ApplyCommandsToolInputSchema.properties).toHaveProperty("traceId");
  });

  it("locks diagnostic schema to registered diagnostic codes", () => {
    const diagnosticCodeSchema = DiagnosticSchema.properties.code;
    const schemaText = JSON.stringify(diagnosticCodeSchema);

    for (const code of Object.values(DiagnosticCodes)) {
      expect(schemaText).toContain(code);
    }
  });

  it("keeps MCP tool names snake_case without camelCase aliases", () => {
    const toolNames = gisEngineTools.map((tool) => tool.name);

    expect(toolNames).toEqual([
      "apply_commands",
      "validate_spec",
      "export_spec",
      "get_context_summary",
      "snapshot_spec",
      "explain_spec",
      "export_example_app"
    ]);
    expect(toolNames.every((name) => /^[a-z]+(?:_[a-z]+)*$/.test(name))).toBe(true);
    expect(toolNames).not.toContain("snapshotSpec");
    expect(toolNames).not.toContain("explainSpec");
    expect(toolNames).not.toContain("exportExampleApp");
  });

  it("keeps newly added AI tool input schemas in the MCP tool bundle", () => {
    const schemasByName = Object.fromEntries(gisEngineTools.map((tool) => [tool.name, tool.inputSchema]));

    expect(schemasByName.snapshot_spec).toBe(SnapshotSpecToolInputSchema);
    expect(schemasByName.explain_spec).toBe(ExplainSpecToolInputSchema);
    expect(schemasByName.export_example_app).toBe(ExportExampleAppToolInputSchema);
  });

  it("keeps export_example_app side-effect free and scoped to examples", () => {
    for (const exampleId of ["basic-geojson", "ai-map-edit", "raster-basemap", "pmtiles-local"]) {
      const result = exportExampleAppTool({ exampleId });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("Expected export_example_app to accept bundled example ids.");
      expect(result.result.writesFiles).toBe(false);
      for (const file of result.result.files) {
        expect(file.path.startsWith("examples/")).toBe(true);
        expect(Object.keys(file)).not.toContain("content");
      }
    }
  });

  it("keeps public schema ids versioned", () => {
    expect(MapSpecSchema.$id).toBe("https://gis-engine.dev/schemas/mapspec.v0.1.schema.json");
    expect(MapCommandSchema.$id).toBe("https://gis-engine.dev/schemas/commands.v0.1.schema.json");
    expect(DiagnosticSchema.$id).toBe("https://gis-engine.dev/schemas/diagnostics.v0.1.schema.json");
    expect(ApplyCommandsToolInputSchema.$id).toBe("https://gis-engine.dev/schemas/ai-tools.v0.1.schema.json");
  });
});
