import { describe, expect, it } from "vitest";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import commands from "../fixtures/commands/replay/style-update/commands.json";
import vectorTileUrl from "../fixtures/specs/valid/vector-tile-url.map.json";
import type { MapSpec } from "@gis-engine/engine";
import { callGisEngineTool, createGisEngineMcpServer, listGisEngineTools } from "@gis-engine/ai";

describe("MCP Server Integration", () => {
  it("defines the expected v0.1 tools without starting stdio", async () => {
    const server = createGisEngineMcpServer();
    const { tools } = await listGisEngineTools();

    expect(server).toBeDefined();
    expect(tools.map((tool) => tool.name)).toEqual([
      "apply_commands",
      "validate_spec",
      "export_spec",
      "get_context_summary",
      "snapshot_spec",
      "explain_spec",
      "export_example_app"
    ]);
    expect(tools.map((tool) => tool.name)).not.toContain("snapshotSpec");
    expect(tools.map((tool) => tool.name)).not.toContain("explainSpec");
    expect(tools.map((tool) => tool.name)).not.toContain("exportExampleApp");
    expect(tools.every((tool) => !/[A-Z]/.test(tool.name))).toBe(true);
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

  it("returns structured diagnostics for invalid validate_spec tool input", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "validate_spec",
        arguments: {}
      }
    });

    const diagnostics = JSON.parse(result.content[0]!.text) as Array<{ code: string; path?: string }>;
    expect(result.isError).toBe(true);
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: "SPEC.MISSING_FIELD", path: "/" }));
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

  it("validates export_spec input and spec before exporting", async () => {
    const invalidSpec = { ...before, view: { ...before.view, center: [200, 100] } };

    const invalidSpecResult = await callGisEngineTool({
      params: {
        name: "export_spec",
        arguments: { spec: invalidSpec }
      }
    });
    const validationDiagnostics = JSON.parse(invalidSpecResult.content[0]!.text) as Array<{ code: string; path?: string }>;
    expect(invalidSpecResult.isError).toBe(true);
    expect(validationDiagnostics).toContainEqual(expect.objectContaining({ code: "GEO.INVALID_COORDINATES", path: "/view/center" }));

    const invalidCommandResult = await callGisEngineTool({
      params: {
        name: "export_spec",
        arguments: {
          spec: before,
          commands: [{ id: "cmd-view", version: "0.1", type: "setView", view: { zoom: 8 }, unexpected: true }]
        }
      }
    });
    const commandDiagnostics = JSON.parse(invalidCommandResult.content[0]!.text) as Array<{ code: string }>;
    expect(invalidCommandResult.isError).toBe(true);
    expect(commandDiagnostics).toContainEqual(expect.objectContaining({ code: "SPEC.UNKNOWN_FIELD" }));
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

  it("covers v0.2 vector tile and expression contracts through MCP tools", async () => {
    const validateResult = await callGisEngineTool({
      params: {
        name: "validate_spec",
        arguments: { spec: vectorTileUrl }
      }
    });
    const validation = JSON.parse(validateResult.content[0]!.text) as { valid: boolean; diagnostics: Array<{ code: string }> };
    expect(validateResult.isError).toBeUndefined();
    expect(validation.valid).toBe(true);
    expect(validation.diagnostics).toEqual([]);

    const explainResult = await callGisEngineTool({
      params: {
        name: "explain_spec",
        arguments: {
          spec: vectorTileUrl,
          capabilities: {
            renderer: "maplibre",
            dimensions: ["2d"],
            sources: ["geojson", "vector"],
            layers: ["fill", "line"],
            expressions: ["case", "match", "zoom", "to-number", "to-string"],
            queries: ["point"],
            snapshot: { supported: true, formats: ["data-url"] },
            experimental: []
          }
        }
      }
    });
    const explanation = JSON.parse(explainResult.content[0]!.text) as {
      summary: {
        sources: Array<{ id: string; type: string }>;
        layers: Array<{ id: string; type: string; source?: string }>;
        capabilities?: { sources: string[]; expressions: string[] };
      };
      validation: { valid: boolean };
    };
    expect(explainResult.isError).toBeUndefined();
    expect(explanation.validation.valid).toBe(true);
    expect(explanation.summary.sources).toEqual([{ id: "local-parcels", type: "vector" }]);
    expect(explanation.summary.layers.map((layer) => layer.id)).toEqual(["parcel-fill", "parcel-outline"]);
    expect(explanation.summary.capabilities?.sources).toContain("vector");
    expect(explanation.summary.capabilities?.expressions).toEqual(expect.arrayContaining(["case", "match", "zoom", "to-number", "to-string"]));

    const snapshotResult = await callGisEngineTool({
      params: {
        name: "snapshot_spec",
        arguments: {
          spec: vectorTileUrl,
          renderer: "maplibre",
          snapshot: { width: 320, height: 180, format: "data-url", targetLayers: ["parcel-fill"] }
        }
      }
    });
    const snapshot = JSON.parse(snapshotResult.content[0]!.text) as { passed: boolean; dataUrl?: string; validation: { valid: boolean } };
    expect(snapshotResult.isError).toBeUndefined();
    expect(snapshot.validation.valid).toBe(true);
    expect(snapshot.passed).toBe(true);
    expect(snapshot.dataUrl).toMatch(/^data:image\/png;base64,/);

    const exportResult = await callGisEngineTool({
      params: {
        name: "export_spec",
        arguments: { spec: vectorTileUrl }
      }
    });
    const exported = JSON.parse(exportResult.content[0]!.text) as typeof vectorTileUrl;
    expect(exportResult.isError).toBeUndefined();
    expect(exported.sources["local-parcels"].type).toBe("vector");
    expect(exported.layers[0]?.metadata?.["source-layer"]).toBe("parcels");
  });

  it("rejects invalid MCP capability reports with structured diagnostics", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "get_context_summary",
        arguments: {
          spec: vectorTileUrl,
          capabilities: {
            renderer: "maplibre",
            dimensions: ["4d"],
            sources: ["vector"],
            layers: ["fill"],
            expressions: ["case"],
            queries: ["point"],
            snapshot: { supported: true, formats: ["gif"] },
            experimental: [],
            unexpected: true
          }
        }
      }
    });
    const diagnostics = JSON.parse(result.content[0]!.text) as Array<{ code: string; path?: string }>;
    expect(result.isError).toBe(true);
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SPEC.UNKNOWN_FIELD", path: "/capabilities" }),
        expect.objectContaining({ code: "SPEC.INVALID_TYPE", path: "/capabilities/dimensions/0" }),
        expect.objectContaining({ code: "SPEC.INVALID_TYPE", path: "/capabilities/snapshot/formats/0" })
      ])
    );
  });

  it("returns stable expression diagnostics for invalid v0.2 expressions through MCP", async () => {
    const invalidSpec = structuredClone(vectorTileUrl) as MapSpec;
    invalidSpec.layers[0] = {
      ...invalidSpec.layers[0]!,
      paint: {
        "fill-color": ["match", ["get", "class"], { bad: "label" }, "#22c55e", "#f97316"],
        "fill-opacity": ["case", "not-boolean", 0.4, 0.2]
      }
    };

    const result = await callGisEngineTool({
      params: {
        name: "validate_spec",
        arguments: { spec: invalidSpec }
      }
    });
    const report = JSON.parse(result.content[0]!.text) as { valid: boolean; diagnostics: Array<{ code: string; path?: string }> };
    expect(result.isError).toBeUndefined();
    expect(report.valid).toBe(false);
    expect(report.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "EXPR.TYPE_MISMATCH", path: "/layers/0/paint/fill-color/2" }),
        expect.objectContaining({ code: "EXPR.TYPE_MISMATCH", path: "/layers/0/paint/fill-opacity/1" })
      ])
    );
  });

  it("returns structured diagnostics for invalid context and unknown tool requests", async () => {
    const contextResult = await callGisEngineTool({
      params: {
        name: "get_context_summary",
        arguments: { spec: before, unexpected: true }
      }
    });
    const contextDiagnostics = JSON.parse(contextResult.content[0]!.text) as Array<{ code: string }>;
    expect(contextResult.isError).toBe(true);
    expect(contextDiagnostics).toContainEqual(expect.objectContaining({ code: "SPEC.UNKNOWN_FIELD" }));

    const unknownToolResult = await callGisEngineTool({
      params: {
        name: "missing_tool",
        arguments: {}
      }
    });
    const unknownToolDiagnostics = JSON.parse(unknownToolResult.content[0]!.text) as Array<{ code: string }>;
    expect(unknownToolResult.isError).toBe(true);
    expect(unknownToolDiagnostics).toContainEqual(expect.objectContaining({ code: "COMMAND.UNSUPPORTED" }));
  });

  it("snapshots a valid spec with a headless MapLibre adapter", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "snapshot_spec",
        arguments: {
          spec: before,
          renderer: "maplibre",
          snapshot: { width: 320, height: 180, format: "data-url" }
        }
      }
    });

    const snapshot = JSON.parse(result.content[0]!.text) as {
      passed: boolean;
      renderer: string;
      dataUrl?: string;
      diagnostics: Array<{ code: string }>;
      validation: { valid: boolean; diagnostics: Array<{ code: string }> };
    };
    expect(result.isError).toBeUndefined();
    expect(snapshot.passed).toBe(true);
    expect(snapshot.renderer).toBe("maplibre");
    expect(snapshot.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(snapshot.diagnostics).toEqual([]);
    expect(snapshot.validation).toMatchObject({ valid: true, diagnostics: [] });
  });

  it("returns validation diagnostics when snapshot_spec receives an invalid spec", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "snapshot_spec",
        arguments: {
          spec: {
            ...before,
            view: { ...before.view, center: [200, 100] }
          },
          renderer: "mock"
        }
      }
    });

    const snapshot = JSON.parse(result.content[0]!.text) as {
      passed: boolean;
      validation: { valid: boolean };
      diagnostics: Array<{ code: string; path?: string }>;
    };
    expect(result.isError).toBeUndefined();
    expect(snapshot.passed).toBe(false);
    expect(snapshot.validation.valid).toBe(false);
    expect(snapshot.diagnostics).toContainEqual(expect.objectContaining({ code: "GEO.INVALID_COORDINATES", path: "/view/center" }));
  });

  it("explains a spec with context summary and full validation diagnostics", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "explain_spec",
        arguments: {
          spec: {
            ...before,
            layers: [
              ...before.layers,
              {
                id: "broken-layer",
                type: "circle",
                source: "missing-source"
              }
            ]
          }
        }
      }
    });

    const explanation = JSON.parse(result.content[0]!.text) as {
      summary: {
        id?: string;
        validation: { valid: boolean; diagnosticCounts: { error: number } };
        layers: Array<{ id: string }>;
      };
      validation: { valid: boolean };
      diagnostics: Array<{ code: string }>;
    };
    expect(result.isError).toBeUndefined();
    expect(explanation.summary.id).toBe("style-update");
    expect(explanation.summary.layers.map((layer) => layer.id)).toContain("broken-layer");
    expect(explanation.summary.validation).toMatchObject({ valid: false, diagnosticCounts: { error: 1 } });
    expect(explanation.validation.valid).toBe(false);
    expect(explanation.diagnostics).toContainEqual(expect.objectContaining({ code: "SRC.NOT_FOUND" }));
  });

  it("exports example manifests as file lists without writing file contents", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "export_example_app",
        arguments: { exampleId: "pmtiles-local" }
      }
    });

    const manifest = JSON.parse(result.content[0]!.text) as {
      exampleId: string;
      writesFiles: boolean;
      files: Array<Record<string, unknown>>;
      notes: string[];
    };
    expect(result.isError).toBeUndefined();
    expect(manifest).toMatchObject({ exampleId: "pmtiles-local", writesFiles: false });
    expect(manifest.files.map((file) => file.path)).toEqual(["examples/pmtiles-local/map.json"]);
    expect(manifest.files.every((file) => !("content" in file))).toBe(true);
    expect(manifest.notes.join(" ")).toContain("does not parse PMTiles binaries");
  });
});
