import { describe, expect, it } from "vitest";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import commands from "../fixtures/commands/replay/style-update/commands.json";
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
