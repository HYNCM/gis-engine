import {
  ApplyCommandsToolResultSchema,
  ContextSummaryToolInputSchema,
  ContextSummaryToolResultSchema,
  EditSpecToolInputSchema,
  EditSpecToolResultSchema,
  ExplainSpecToolInputSchema,
  ExplainSpecToolResultSchema,
  ExportExampleAppToolInputSchema,
  ExportExampleAppToolResultSchema,
  ExportSpecToolInputSchema,
  ExportSpecToolResultSchema,
  exportExampleAppTool,
  GenerationEvidenceBundleInputSchema,
  GenerationEvidenceBundleSchema,
  gisEngineTools,
  InspectDataToolInputSchema,
  InspectDataToolResultSchema,
  SnapshotSpecToolInputSchema,
  SnapshotSpecToolResultSchema,
  ValidateSpecToolInputSchema,
  ValidateSpecToolResultSchema,
} from "@gis-engine/ai";
import {
  ApplyCommandsToolInputSchema,
  CapabilityReportSchema,
  DiagnosticCodes,
  DiagnosticSchema,
  MapCommandSchema,
  MapGenerationCommandSkeletonSchema,
  MapGenerationPromptPlannerInputSchema,
  MapGenerationPromptPlanSchema,
  MapGenerationRequestSchema,
  MapSpecSchema,
  Scene3DStableRuntimeBlockerCodes,
  SceneView3DExtensionSchema,
} from "@gis-engine/engine";
import Ajv from "ajv";
import { describe, expect, it } from "vitest";
import scene3dExtensionSpec from "../fixtures/specs/valid/scene3d-extension.map.json";

describe("schema sync gate", () => {
  it("compiles all public schemas with Ajv", () => {
    for (const schema of [
      MapSpecSchema,
      MapCommandSchema,
      CapabilityReportSchema,
      SceneView3DExtensionSchema,
      DiagnosticSchema,
      MapGenerationRequestSchema,
      MapGenerationPromptPlannerInputSchema,
      MapGenerationPromptPlanSchema,
      MapGenerationCommandSkeletonSchema,
      ApplyCommandsToolInputSchema,
      ApplyCommandsToolResultSchema,
      ValidateSpecToolInputSchema,
      ValidateSpecToolResultSchema,
      ExportSpecToolInputSchema,
      ExportSpecToolResultSchema,
      ContextSummaryToolInputSchema,
      ContextSummaryToolResultSchema,
      SnapshotSpecToolInputSchema,
      SnapshotSpecToolResultSchema,
      ExplainSpecToolInputSchema,
      ExplainSpecToolResultSchema,
      ExportExampleAppToolInputSchema,
      ExportExampleAppToolResultSchema,
      GenerationEvidenceBundleInputSchema,
      GenerationEvidenceBundleSchema,
    ]) {
      expect(() => new Ajv({ strict: false }).compile(schema)).not.toThrow();
    }
  });

  it("keeps apply_commands tool schema aligned with ApplyOptions", () => {
    expect(ApplyCommandsToolInputSchema.properties).toHaveProperty("spec");
    expect(ApplyCommandsToolInputSchema.properties).toHaveProperty("commands");
    expect(ApplyCommandsToolInputSchema.properties).toHaveProperty("dryRun");
    expect(ApplyCommandsToolInputSchema.properties).toHaveProperty("transaction");
    expect(ApplyCommandsToolInputSchema.properties).toHaveProperty("collectTrace");
    expect(ApplyCommandsToolInputSchema.properties).toHaveProperty("traceId");
  });

  it("rejects unknown public command fields", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validateCommand = ajv.compile(MapCommandSchema);

    expect(validateCommand({ id: "cmd-view", version: "0.1", type: "setView", view: { zoom: 8 } })).toBe(true);
    expect(
      validateCommand({
        id: "cmd-capabilities",
        version: "0.1",
        type: "setCapabilities",
        capabilities: { dimensions: ["2d"], renderer: "maplibre" },
      }),
    ).toBe(true);
    expect(
      validateCommand({
        id: "cmd-interactions",
        version: "0.1",
        type: "setInteractions",
        interactions: { hover: true, click: true },
      }),
    ).toBe(true);
    expect(
      validateCommand({
        id: "cmd-filter",
        version: "0.1",
        type: "setFilter",
        layerId: "points",
        filter: ["==", ["get", "category"], "museum"],
      }),
    ).toBe(true);
    expect(
      validateCommand({
        id: "cmd-zoom-range",
        version: "0.1",
        type: "setLayerZoomRange",
        layerId: "points",
        minzoom: 9,
        maxzoom: 18,
      }),
    ).toBe(true);
    expect(
      validateCommand({ id: "cmd-view", version: "0.1", type: "setView", view: { zoom: 8 }, unexpected: true }),
    ).toBe(false);
    expect(validateCommand.errors?.some((error) => error.keyword === "additionalProperties")).toBe(true);
  });

  it("keeps SceneView3D command schemas strict", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validateCommand = ajv.compile(MapCommandSchema);

    expect(
      validateCommand({
        id: "cmd-scene-camera",
        version: "0.1",
        type: "setSceneCamera",
        camera: {
          position: [120.15, 30.28, 1200],
          target: [120.15, 30.28, 0],
        },
      }),
    ).toBe(true);
    expect(
      validateCommand({
        id: "cmd-scene-source",
        version: "0.1",
        type: "addSceneSource",
        sourceId: "city",
        source: { type: "3d-tiles", url: "./data/city/tileset.json" },
        unexpected: true,
      }),
    ).toBe(false);
    expect(validateCommand.errors?.some((error) => error.keyword === "additionalProperties")).toBe(true);
  });

  it("locks diagnostic schema to registered diagnostic codes", () => {
    const diagnosticCodeSchema = DiagnosticSchema.properties.code;
    const schemaText = JSON.stringify(diagnosticCodeSchema);

    for (const code of Object.values(DiagnosticCodes)) {
      expect(schemaText).toContain(code);
    }
  });

  it("locks SceneView3D stable-runtime blocker codes into diagnostics", () => {
    const blockerCodeSchema = DiagnosticSchema.properties.blockerCode;
    const schemaText = JSON.stringify(blockerCodeSchema);

    for (const code of Object.values(Scene3DStableRuntimeBlockerCodes)) {
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
      "export_example_app",
      "inspect_data",
      "edit_spec",
    ]);
    expect(toolNames.every((name) => /^[a-z]+(?:_[a-z]+)*$/.test(name))).toBe(true);
    expect(toolNames).not.toContain("snapshotSpec");
    expect(toolNames).not.toContain("explainSpec");
    expect(toolNames).not.toContain("exportExampleApp");
    expect(toolNames).not.toContain("generate_map_app");
  });

  it("keeps newly added AI tool input schemas in the MCP tool bundle", () => {
    const schemasByName = Object.fromEntries(gisEngineTools.map((tool) => [tool.name, tool.inputSchema]));

    expect(schemasByName.validate_spec).toBe(ValidateSpecToolInputSchema);
    expect(schemasByName.export_spec).toBe(ExportSpecToolInputSchema);
    expect(schemasByName.get_context_summary).toBe(ContextSummaryToolInputSchema);
    expect(schemasByName.snapshot_spec).toBe(SnapshotSpecToolInputSchema);
    expect(schemasByName.explain_spec).toBe(ExplainSpecToolInputSchema);
    expect(schemasByName.export_example_app).toBe(ExportExampleAppToolInputSchema);
    expect(schemasByName.inspect_data).toBe(InspectDataToolInputSchema);
    expect(schemasByName.edit_spec).toBe(EditSpecToolInputSchema);
  });

  it("keeps MCP tool output schemas in the public tool bundle", () => {
    const schemasByName = Object.fromEntries(gisEngineTools.map((tool) => [tool.name, tool.outputSchema]));

    expect(schemasByName.apply_commands).toBe(ApplyCommandsToolResultSchema);
    expect(schemasByName.validate_spec).toBe(ValidateSpecToolResultSchema);
    expect(schemasByName.export_spec).toBe(ExportSpecToolResultSchema);
    expect(schemasByName.get_context_summary).toBe(ContextSummaryToolResultSchema);
    expect(schemasByName.snapshot_spec).toBe(SnapshotSpecToolResultSchema);
    expect(schemasByName.explain_spec).toBe(ExplainSpecToolResultSchema);
    expect(schemasByName.export_example_app).toBe(ExportExampleAppToolResultSchema);
    expect(schemasByName.inspect_data).toBe(InspectDataToolResultSchema);
    expect(schemasByName.edit_spec).toBe(EditSpecToolResultSchema);

    for (const tool of gisEngineTools) {
      expect(() => new Ajv({ strict: false }).compile(tool.inputSchema)).not.toThrow();
      expect(() => new Ajv({ strict: false }).compile(tool.outputSchema)).not.toThrow();
    }
  });

  it("exposes SceneView3D context in MCP output schemas behind the extension boundary", () => {
    expect(ContextSummaryToolResultSchema.properties).toHaveProperty("scene3d");
    expect(ContextSummaryToolResultSchema.properties).toHaveProperty("capabilitySummary");
    expect(ContextSummaryToolResultSchema.properties).toHaveProperty("sourceReadiness");
    expect(ContextSummaryToolResultSchema.required).toContain("capabilitySummary");
    expect(ContextSummaryToolResultSchema.required).toContain("sourceReadiness");
    expect(ExplainSpecToolResultSchema.properties.summary).toBe(ContextSummaryToolResultSchema);
  });

  it("keeps capability reports strict for MCP context tools", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validateCapabilityReport = ajv.compile(CapabilityReportSchema);

    expect(
      validateCapabilityReport({
        renderer: "maplibre",
        dimensions: ["2d"],
        sources: ["geojson", "vector"],
        layers: ["fill", "line"],
        expressions: ["case", "match", "zoom"],
        queries: ["point"],
        snapshot: { supported: true, formats: ["data-url"] },
        experimental: [],
      }),
    ).toBe(true);
    expect(
      validateCapabilityReport({
        renderer: "maplibre",
        dimensions: ["4d"],
        sources: [],
        layers: [],
        expressions: [],
        queries: [],
        snapshot: { supported: true, formats: ["gif"] },
        experimental: [],
        unexpected: true,
      }),
    ).toBe(false);
    expect(
      validateCapabilityReport.errors?.some(
        (error) => error.keyword === "additionalProperties" || error.keyword === "enum",
      ),
    ).toBe(true);
  });

  it("keeps export_example_app side-effect free and scoped to examples", () => {
    for (const exampleId of [
      "basic-geojson",
      "ai-map-edit",
      "raster-basemap",
      "pmtiles-local",
      "vector-tile-url",
      "fill-extrusion-lite",
    ]) {
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
    expect(SceneView3DExtensionSchema.$id).toBe("https://gis-engine.dev/schemas/sceneview3d.v1.schema.json");
    expect(DiagnosticSchema.$id).toBe("https://gis-engine.dev/schemas/diagnostics.v0.1.schema.json");
    expect(MapGenerationRequestSchema.$id).toBe(
      "https://gis-engine.dev/schemas/map-generation-request.v0.1.schema.json",
    );
    expect(MapGenerationPromptPlannerInputSchema.$id).toBe(
      "https://gis-engine.dev/schemas/map-generation-prompt-planner-input.v0.1.schema.json",
    );
    expect(MapGenerationPromptPlanSchema.$id).toBe(
      "https://gis-engine.dev/schemas/map-generation-prompt-plan.v0.1.schema.json",
    );
    expect(MapGenerationCommandSkeletonSchema.$id).toBe(
      "https://gis-engine.dev/schemas/map-generation-command-skeleton.v0.1.schema.json",
    );
    expect(ApplyCommandsToolInputSchema.$id).toBe("https://gis-engine.dev/schemas/ai-tools.v0.1.schema.json");
  });

  it("validates the reserved SceneView3D extension without enabling scene3d runtime", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validateScene = ajv.compile(SceneView3DExtensionSchema);

    expect(validateScene(scene3dExtensionSpec.extensions.scene3d)).toBe(true);
    expect(
      validateScene({
        ...scene3dExtensionSpec.extensions.scene3d,
        unexpected: true,
      }),
    ).toBe(false);
    expect(validateScene.errors?.some((error) => error.keyword === "additionalProperties")).toBe(true);
  });
});
