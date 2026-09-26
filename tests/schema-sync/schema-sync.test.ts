import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ApplyCommandsToolResultSchema,
  ContextSummaryToolInputSchema,
  ContextSummaryToolResultSchema,
  DiffSpecsToolInputSchema,
  DiffSpecsToolResultSchema,
  EditSpecToolInputSchema,
  EditSpecToolResultSchema,
  EngineCapabilityMatrixContractSchema,
  ExampleAppGenerationEvidenceSummarySchema,
  ExplainSpecToolInputSchema,
  ExplainSpecToolResultSchema,
  ExportExampleAppToolInputSchema,
  ExportExampleAppToolResultSchema,
  ExportSpecToolInputSchema,
  ExportSpecToolResultSchema,
  exportExampleAppTool,
  GenerateSpecToolInputSchema,
  GenerateSpecToolResultSchema,
  GenerationEvidenceBundleInputSchema,
  GenerationEvidenceBundleSchema,
  gisEngineTools,
  InspectDataToolInputSchema,
  InspectDataToolResultSchema,
  McpToolExecutionErrorSchema,
  QueryFeaturesToolInputSchema,
  QueryFeaturesToolResultSchema,
  SnapshotSpecToolInputSchema,
  SnapshotSpecToolResultSchema,
  StyleRecommendToolInputSchema,
  StyleRecommendToolResultSchema,
  TransformDataToolInputSchema,
  TransformDataToolResultSchema,
  ValidateSpecToolInputSchema,
  ValidateSpecToolResultSchema,
} from "@gis-engine/ai";
import {
  ApplyCommandsToolInputSchema,
  CapabilityReportSchema,
  DiagnosticCodes,
  DiagnosticSchema,
  EngineCapabilityMatrixSchema,
  EvidenceRecordSchema,
  MapCommandSchema,
  MapGenerationCommandSkeletonSchema,
  MapGenerationPromptPlannerInputSchema,
  MapGenerationPromptPlanSchema,
  MapGenerationRequestSchema,
  MapSpecSchema,
  Scene3DStableRuntimeBlockerCodes,
  SceneView3DExtensionSchema,
} from "@gis-engine/engine";
import { buildEvidenceRecord, EvidenceIssueCode, type EvidenceRecordInput } from "@gis-engine/engine/evidence";
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
      EngineCapabilityMatrixContractSchema,
      SnapshotSpecToolInputSchema,
      SnapshotSpecToolResultSchema,
      ExplainSpecToolInputSchema,
      ExplainSpecToolResultSchema,
      ExportExampleAppToolInputSchema,
      ExportExampleAppToolResultSchema,
      GenerationEvidenceBundleInputSchema,
      GenerationEvidenceBundleSchema,
      EvidenceRecordSchema,
      EngineCapabilityMatrixSchema,
    ]) {
      expect(() => new Ajv({ strict: false }).compile(schema)).not.toThrow();
    }
  });

  it("publishes evidence schemas without nested $id", () => {
    for (const [name, schema] of [
      ["evidence-record.v0.1.schema.json", EvidenceRecordSchema],
      ["engine-capabilities.v0.1.schema.json", EngineCapabilityMatrixSchema],
    ] as const) {
      const serialized = JSON.stringify(schema);
      const idCount = serialized.match(/"\$id":/g)?.length ?? 0;
      expect(idCount, name).toBe(1);
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
      "diff_specs",
      "generate_spec",
      "inspect_data",
      "edit_spec",
      "query_features",
      "style_recommend",
      "transform_data",
    ]);
    expect(toolNames.every((name) => /^[a-z]+(?:_[a-z]+)*$/.test(name))).toBe(true);
    expect(toolNames).not.toContain("snapshotSpec");
    expect(toolNames).not.toContain("explainSpec");
    expect(toolNames).not.toContain("exportExampleApp");
    expect(toolNames).not.toContain("generate_map_app");
  });

  it("keeps generation evidence tool names aligned with the canonical MCP inventory", () => {
    const canonicalToolNames = gisEngineTools.map((tool) => tool.name);

    expect(
      ContextSummaryToolResultSchema.properties.capabilitySummary.properties.domains.items.properties.tools.items.enum,
    ).toEqual(canonicalToolNames);
    expect(GenerationEvidenceBundleSchema.properties.toolSequence.items.enum).toEqual(canonicalToolNames);
    expect(ExampleAppGenerationEvidenceSummarySchema.properties.toolSequence.items.enum).toEqual(canonicalToolNames);
    expect(ExportExampleAppToolInputSchema.properties.generationEvidence.properties.toolSequence.items.enum).toEqual(
      canonicalToolNames,
    );
  });

  it("keeps newly added AI tool input schemas in the MCP tool bundle", () => {
    const schemasByName = Object.fromEntries(gisEngineTools.map((tool) => [tool.name, tool.inputSchema]));

    const inputSchemas = {
      apply_commands: ApplyCommandsToolInputSchema,
      validate_spec: ValidateSpecToolInputSchema,
      export_spec: ExportSpecToolInputSchema,
      get_context_summary: ContextSummaryToolInputSchema,
      snapshot_spec: SnapshotSpecToolInputSchema,
      explain_spec: ExplainSpecToolInputSchema,
      export_example_app: ExportExampleAppToolInputSchema,
      diff_specs: DiffSpecsToolInputSchema,
      generate_spec: GenerateSpecToolInputSchema,
      inspect_data: InspectDataToolInputSchema,
      edit_spec: EditSpecToolInputSchema,
      query_features: QueryFeaturesToolInputSchema,
      style_recommend: StyleRecommendToolInputSchema,
      transform_data: TransformDataToolInputSchema,
    };

    for (const [name, inputSchema] of Object.entries(inputSchemas)) {
      const { $schema, ...descriptorSchema } = schemasByName[name] as Record<string, unknown>;
      expect($schema, `${name} should declare its MCP JSON Schema dialect`).toBe(
        "http://json-schema.org/draft-07/schema#",
      );
      expect(descriptorSchema, `${name} should preserve its public input schema`).toEqual(inputSchema);
    }
  });

  it("keeps MCP tool output schemas in the public tool bundle", () => {
    const schemasByName = Object.fromEntries(gisEngineTools.map((tool) => [tool.name, tool.outputSchema]));

    const successSchemas = {
      apply_commands: ApplyCommandsToolResultSchema,
      validate_spec: ValidateSpecToolResultSchema,
      export_spec: ExportSpecToolResultSchema,
      get_context_summary: ContextSummaryToolResultSchema,
      snapshot_spec: SnapshotSpecToolResultSchema,
      explain_spec: ExplainSpecToolResultSchema,
      export_example_app: ExportExampleAppToolResultSchema,
      diff_specs: DiffSpecsToolResultSchema,
      generate_spec: GenerateSpecToolResultSchema,
      inspect_data: InspectDataToolResultSchema,
      edit_spec: EditSpecToolResultSchema,
      query_features: QueryFeaturesToolResultSchema,
      style_recommend: StyleRecommendToolResultSchema,
      transform_data: TransformDataToolResultSchema,
    };

    for (const [name, successSchema] of Object.entries(successSchemas)) {
      const outputSchema = schemasByName[name] as { oneOf?: readonly [unknown, unknown] } | undefined;
      expect(outputSchema?.oneOf?.[0], `${name} should preserve its success schema`).toBe(successSchema);
      expect(outputSchema?.oneOf?.[1], `${name} should expose the common error schema`).toBe(
        McpToolExecutionErrorSchema,
      );
    }

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

  it("keeps MCP tool documentation in sync with actual registered tools", () => {
    const actualToolNames = new Set(gisEngineTools.map((tool) => tool.name));

    const docPath = path.resolve(__dirname, "../../docs/mcp-server-description.md");
    const docContent = readFileSync(docPath, "utf-8");

    // Extract tool names from headings like ### `tool_name`
    const documentedToolNames = new Set<string>();
    const toolHeadingPattern = /^### `(\w+)`\s*$/gm;
    let match: RegExpExecArray | null = toolHeadingPattern.exec(docContent);
    while (match !== null) {
      documentedToolNames.add(match[1]);
      match = toolHeadingPattern.exec(docContent);
    }

    const missing = [...actualToolNames].filter((name) => !documentedToolNames.has(name));
    const extra = [...documentedToolNames].filter((name) => !actualToolNames.has(name));

    expect(missing, `MCP tools missing from docs/mcp-server-description.md: ${missing.join(", ")}`).toEqual([]);
    expect(extra, `Documented tools not found in MCP server: ${extra.join(", ")}`).toEqual([]);
  });
});

// `evidence/schema.ts` (the TypeBox contract Ajv enforces for external consumers) and
// `evidence/record.ts`'s zero-dependency `structuralIssues` validator encode the same shape in
// two places. That duplication is only safe while both stay in lockstep: every property the
// schema marks required must also be rejected by the hand-written validator. These guards make
// any drift fail deterministically instead of shipping a record Ajv would reject downstream.
describe("evidence record schema/validator alignment", () => {
  // Fields the builder always derives — they are required on the record but never supplied via
  // EvidenceRecordInput, so the structural validator cannot (and must not) reject their absence.
  const DERIVED_TOP_LEVEL = ["schemaVersion", "recordId", "issuedAt", "exclusions"] as const;

  const hash = (seed: string) => `sha256:${seed.repeat(64).slice(0, 64)}`;

  const validInput = (): EvidenceRecordInput =>
    JSON.parse(
      JSON.stringify({
        project: { id: "proj-a", baseRevision: "r0", revision: "r1" },
        origin: { actor: "agent:codex", providerKind: "mcp", promptHash: hash("a") },
        commands: [
          {
            command: { id: "cmd-1", version: "0.1", type: "removeLayer", layerId: "layer-a" },
            outcome: "applied",
            diagnostics: [],
            inversePatchHash: hash("0"),
            baseRevision: "r0",
            nextRevision: "r1",
          },
        ],
        spec: { beforeHash: hash("1"), afterHash: hash("2"), diffHash: hash("3") },
        artifacts: [{ path: "map.json", role: "mapspec", bytes: 128, sha256: hash("4") }],
        capabilities: { schemaVersion: "engine-capabilities.v0.1", available: ["mapspec.validate"], blocked: [] },
        toolchain: { engineVersion: "1.5.0", nodeMajor: "22", pnpmVersion: "11.9.0" },
        issuer: "gis-engine-cli",
      }),
    ) as EvidenceRecordInput;

  // One representative violation per schema-required field that the structural validator enforces.
  // Keys are JSON-pointer-style labels used by the coverage lock below.
  const violations: Record<string, (input: Record<string, unknown>) => void> = {
    "/project": (i) => {
      delete i.project;
    },
    "/project/id": (i) => {
      (i.project as { id: string }).id = "";
    },
    "/project/baseRevision": (i) => {
      (i.project as { baseRevision: string }).baseRevision = "";
    },
    "/project/revision": (i) => {
      (i.project as { revision: string }).revision = "";
    },
    "/origin": (i) => {
      delete i.origin;
    },
    "/origin/actor": (i) => {
      (i.origin as { actor: string }).actor = "";
    },
    "/origin/providerKind": (i) => {
      (i.origin as { providerKind: string }).providerKind = "";
    },
    "/origin/promptHash": (i) => {
      (i.origin as { promptHash: string }).promptHash = "not-a-hash";
    },
    "/commands": (i) => {
      i.commands = [];
    },
    "/commands/command": (i) => {
      delete (i.commands as Record<string, unknown>[])[0].command;
    },
    "/commands/outcome": (i) => {
      (i.commands as Record<string, unknown>[])[0].outcome = "reverted";
    },
    "/commands/diagnostics": (i) => {
      (i.commands as Record<string, unknown>[])[0].diagnostics = "none";
    },
    "/commands/inversePatchHash": (i) => {
      (i.commands as Record<string, unknown>[])[0].inversePatchHash = "nope";
    },
    "/spec": (i) => {
      delete i.spec;
    },
    "/spec/beforeHash": (i) => {
      (i.spec as { beforeHash: string }).beforeHash = "nope";
    },
    "/spec/afterHash": (i) => {
      (i.spec as { afterHash: string }).afterHash = "nope";
    },
    "/spec/diffHash": (i) => {
      (i.spec as { diffHash: string }).diffHash = "nope";
    },
    "/artifacts": (i) => {
      i.artifacts = [];
    },
    "/artifacts/path": (i) => {
      (i.artifacts as Record<string, unknown>[])[0].path = "";
    },
    "/artifacts/role": (i) => {
      (i.artifacts as Record<string, unknown>[])[0].role = "";
    },
    "/artifacts/bytes": (i) => {
      (i.artifacts as Record<string, unknown>[])[0].bytes = -1;
    },
    "/artifacts/sha256": (i) => {
      (i.artifacts as Record<string, unknown>[])[0].sha256 = "nope";
    },
    "/capabilities": (i) => {
      delete i.capabilities;
    },
    "/capabilities/schemaVersion": (i) => {
      (i.capabilities as { schemaVersion: string }).schemaVersion = "";
    },
    "/capabilities/available": (i) => {
      (i.capabilities as { available: unknown }).available = "mapspec.validate";
    },
    "/capabilities/blocked": (i) => {
      (i.capabilities as { blocked: unknown }).blocked = null;
    },
    "/toolchain": (i) => {
      delete i.toolchain;
    },
    "/toolchain/engineVersion": (i) => {
      (i.toolchain as { engineVersion: string }).engineVersion = "";
    },
    "/toolchain/nodeMajor": (i) => {
      (i.toolchain as { nodeMajor: string }).nodeMajor = "";
    },
    "/toolchain/pnpmVersion": (i) => {
      (i.toolchain as { pnpmVersion: string }).pnpmVersion = "";
    },
    "/issuer": (i) => {
      i.issuer = "";
    },
  };

  it("accepts a fully valid input through both the structural validator and Ajv", () => {
    const result = buildEvidenceRecord(validInput());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const validate = new Ajv({ strict: false }).compile(EvidenceRecordSchema);
    expect(validate(result.record)).toBe(true);
    // Derived fields must actually be emitted by the builder, not merely declared required.
    for (const field of DERIVED_TOP_LEVEL) {
      expect(Object.keys(result.record), field).toContain(field);
    }
  });

  it("rejects a violation of every schema-required field the validator owns", () => {
    for (const [path, mutate] of Object.entries(violations)) {
      const input = validInput() as Record<string, unknown>;
      mutate(input);
      const result = buildEvidenceRecord(input as EvidenceRecordInput);
      expect(result.ok, path).toBe(false);
      if (result.ok) continue;
      expect(
        result.diagnostics.some((d) => d.code === "EVIDENCE.RECORD_INVALID"),
        path,
      ).toBe(true);
    }
  });

  it("keeps the schema's required fields and the validator's violation cases in lockstep", () => {
    const covered = new Set(Object.keys(violations));

    // Every required top-level field is either builder-derived or has a matching violation case.
    for (const field of EvidenceRecordSchema.required) {
      if ((DERIVED_TOP_LEVEL as readonly string[]).includes(field)) continue;
      expect(covered, `top-level required field /${field} has no structural-validator violation case`).toContain(
        `/${field}`,
      );
    }

    // Every required leaf on the objects the validator fully owns must have a violation case.
    const itemOf = (schema: { items?: unknown }) => schema.items as { required: string[] };
    const locked: Array<[string, { required: string[] }]> = [
      ["/project", EvidenceRecordSchema.properties.project],
      ["/origin", EvidenceRecordSchema.properties.origin],
      ["/spec", EvidenceRecordSchema.properties.spec],
      ["/capabilities", EvidenceRecordSchema.properties.capabilities],
      ["/toolchain", EvidenceRecordSchema.properties.toolchain],
      ["/commands", itemOf(EvidenceRecordSchema.properties.commands)],
      ["/artifacts", itemOf(EvidenceRecordSchema.properties.artifacts)],
    ];
    for (const [base, objectSchema] of locked) {
      for (const key of objectSchema.required) {
        // The MapCommand `command` leaf is validated by Ajv's command union, not field-by-field by
        // the structural validator, which only asserts its presence.
        expect(covered, `required field ${base}/${key} has no structural-validator violation case`).toContain(
          `${base}/${key}`,
        );
      }
    }
  });

  it("keeps record.ts EvidenceIssueCode literals in sync with DiagnosticCodes EVIDENCE.* codes", () => {
    const diagnosticEvidenceCodes = Object.values(DiagnosticCodes).filter((code) => code.startsWith("EVIDENCE."));
    const issueCodes = Object.values(EvidenceIssueCode);

    // record.ts may not import codes.ts (Task 6's standalone build), so the mirror must be exact:
    // the same set, or a code silently disappears from the Ajv-enforced diagnostic enum.
    expect([...issueCodes].sort()).toEqual([...diagnosticEvidenceCodes].sort());
  });
});
