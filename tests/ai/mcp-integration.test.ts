import { callGisEngineTool, createGisEngineMcpServer, listGisEngineTools } from "@gis-engine/ai";
import type { MapSpec } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import pmtilesLocalSpec from "../../examples/pmtiles-local/map.json";
import before from "../fixtures/commands/replay/style-update/before.map.json";
import commands from "../fixtures/commands/replay/style-update/commands.json";
import scene3dExtensionSpec from "../fixtures/specs/valid/scene3d-extension.map.json";
import vectorTileUrl from "../fixtures/specs/valid/vector-tile-url.map.json";

function manifestDeliverySummary(status: "ready" | "blocked" | "needs-confirmation" | "follow-up-required" = "ready") {
  return {
    status,
    acceptance: {
      state: status,
      ready: status === "ready",
      blocked: status === "blocked",
      needsConfirmation: status === "needs-confirmation",
      followUpRequired: status === "follow-up-required",
    },
    sections: [
      {
        id: "readiness",
        status,
        blockerCount: status === "blocked" ? 1 : 0,
        confirmationRequired: status === "needs-confirmation",
        followUpCount: status === "follow-up-required" ? 1 : 0,
      },
      { id: "files", status: "ready", blockerCount: 0, confirmationRequired: false, followUpCount: 0 },
      {
        id: "map-edits",
        status: status === "blocked" ? "blocked" : "ready",
        blockerCount: status === "blocked" ? 1 : 0,
        confirmationRequired: false,
        followUpCount: 0,
      },
      {
        id: "data-and-analysis",
        status: status === "needs-confirmation" ? "needs-confirmation" : "ready",
        blockerCount: 0,
        confirmationRequired: status === "needs-confirmation",
        followUpCount: 0,
      },
      {
        id: "scene-browsing",
        status: status === "follow-up-required" ? "follow-up-required" : "ready",
        blockerCount: 0,
        confirmationRequired: false,
        followUpCount: status === "follow-up-required" ? 1 : 0,
      },
    ],
    confirmations: [
      {
        reason: "external-resource",
        required: status === "needs-confirmation",
        target: "MapSpec.sources URL-bearing entries",
      },
      { reason: "network-fetch", required: false, target: "future resource loader fetch" },
      { reason: "archive-parsing", required: false, target: "future archive parser or range reader" },
      { reason: "worker-use", required: false, target: "future worker-backed data decode" },
      { reason: "file-write", required: false, target: "export_example_app manifest output" },
    ],
    confirmationRequired: status === "needs-confirmation",
    followUps: [],
    sourceReadiness: [],
    spatialQueryReadiness: {
      requested: false,
      state: "not-requested",
      status: "not-requested",
      capabilityGateStatus: "passed",
      requiredQueries: [],
      providedQueries: [],
      caseCount: 0,
      passedCaseCount: 0,
      failedCaseCount: 0,
      resultLimit: 100,
      resultTruncated: false,
      blockerCount: 0,
      followUpCount: 0,
      followUpTaskIds: [],
      queryableLayerIds: [],
      queryableSourceIds: [],
      unsupportedSourceIds: [],
      missingSourceIds: [],
      hiddenLayerIds: [],
      blockedOperations: [],
      cases: [],
    },
  };
}

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
      "export_example_app",
      "diff_specs",
      "generate_spec",
      "inspect_data",
      "edit_spec",
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
            layers: [],
          },
        },
      },
    });

    const report = JSON.parse(result.content[0]?.text) as { valid: boolean; diagnostics: Array<{ code: string }> };
    expect(report.valid).toBe(false);
    expect(report.diagnostics.some((diagnostic) => diagnostic.code === "GEO.INVALID_COORDINATES")).toBe(true);
  });

  it("returns structured diagnostics for invalid validate_spec tool input", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "validate_spec",
        arguments: {},
      },
    });

    const diagnostics = JSON.parse(result.content[0]?.text) as Array<{ code: string; path?: string }>;
    expect(result.isError).toBe(true);
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: "SPEC.MISSING_FIELD", path: "/" }));
  });

  it("exports a command-modified spec through a pure handler", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "export_spec",
        arguments: {
          spec: before,
          commands,
        },
      },
    });

    const spec = JSON.parse(result.content[0]?.text) as { revision?: string };
    expect(spec.revision).toBe("2");
  });

  it("returns command audit traces through apply_commands", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "apply_commands",
        arguments: {
          spec: before,
          commands,
          collectTrace: true,
          traceId: "mcp-audit-1",
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      traceId: string;
      traces?: Array<{ traceId: string; commandId: string; status: string; changedPaths: string[] }>;
    };
    expect(result.isError).toBeUndefined();
    expect(payload.traceId).toBe("mcp-audit-1");
    expect(payload.traces?.[0]).toMatchObject({
      traceId: "mcp-audit-1",
      commandId: "cmd-style-districts",
      status: "applied",
      changedPaths: ["/layers/0/paint/fill-color", "/layers/0/paint/fill-opacity", "/revision"],
    });
  });

  it("validates export_spec input and spec before exporting", async () => {
    const invalidSpec = { ...before, view: { ...before.view, center: [200, 100] } };

    const invalidSpecResult = await callGisEngineTool({
      params: {
        name: "export_spec",
        arguments: { spec: invalidSpec },
      },
    });
    const validationDiagnostics = JSON.parse(invalidSpecResult.content[0]?.text) as Array<{
      code: string;
      path?: string;
    }>;
    expect(invalidSpecResult.isError).toBe(true);
    expect(validationDiagnostics).toContainEqual(
      expect.objectContaining({ code: "GEO.INVALID_COORDINATES", path: "/view/center" }),
    );

    const invalidCommandResult = await callGisEngineTool({
      params: {
        name: "export_spec",
        arguments: {
          spec: before,
          commands: [{ id: "cmd-view", version: "0.1", type: "setView", view: { zoom: 8 }, unexpected: true }],
        },
      },
    });
    const commandDiagnostics = JSON.parse(invalidCommandResult.content[0]?.text) as Array<{ code: string }>;
    expect(invalidCommandResult.isError).toBe(true);
    expect(commandDiagnostics).toContainEqual(expect.objectContaining({ code: "SPEC.UNKNOWN_FIELD" }));
  });

  it("returns compact context summaries for AI planning", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "get_context_summary",
        arguments: { spec: before },
      },
    });

    const summary = JSON.parse(result.content[0]?.text) as {
      id?: string;
      revision?: string;
      sources: Array<{ id: string; type: string }>;
      sourceReadiness: Array<{
        sourceId: string;
        type: string;
        state: string;
        queryReady: boolean;
        resourcePolicy: string;
      }>;
      layers: Array<{ id: string; visibility: string }>;
      validation: { valid: boolean; diagnosticCounts: { error: number } };
      capabilitySummary: { domains: Array<{ id: string; status: string; tools: string[]; blocked: string[] }> };
    };
    expect(summary.id).toBe("style-update");
    expect(summary.revision).toBe("1");
    expect(summary.sources).toEqual([{ id: "districts", type: "geojson" }]);
    expect(summary.layers[0]).toMatchObject({ id: "district-fill", visibility: "visible" });
    expect(summary.sourceReadiness).toContainEqual(
      expect.objectContaining({
        sourceId: "districts",
        type: "geojson",
        state: "readiness-only",
        queryReady: false,
        resourcePolicy: "passed",
      }),
    );
    expect(summary.validation).toMatchObject({ valid: true, diagnosticCounts: { error: 0 } });
    expect(summary.capabilitySummary.domains.map((domain) => domain.id)).toEqual([
      "feature-display",
      "spatial-analysis",
      "scene-browsing",
    ]);
    expect(summary.capabilitySummary.domains.find((domain) => domain.id === "feature-display")).toMatchObject({
      status: "supported",
    });
    expect(
      summary.capabilitySummary.domains.find((domain) => domain.id === "feature-display")?.tools.join(" "),
    ).toContain("apply_commands");
    expect(
      summary.capabilitySummary.domains.find((domain) => domain.id === "spatial-analysis")?.blocked.join(" "),
    ).toContain("buffer");
  });

  it("surfaces PMTiles archive contract status in context summaries", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "get_context_summary",
        arguments: { spec: pmtilesLocalSpec },
      },
    });

    const summary = JSON.parse(result.content[0]?.text) as {
      validation: { valid: boolean };
      sources: Array<{
        id: string;
        type: string;
        sourceContract?: {
          kind: string;
          state: string;
          metadataFields: string[];
          policyFields: string[];
        };
      }>;
      sourceReadiness: Array<{
        sourceId: string;
        type: string;
        state: string;
        queryReady: boolean;
        resourcePolicy: string;
        sourceContract?: {
          kind: string;
          state: string;
          metadataFields: string[];
          policyFields: string[];
        };
        archiveContract?: {
          state: string;
          metadataFields: string[];
          policyFields: string[];
        };
        runtimeLoadPlan?: {
          status: string;
          sourceLayerIds: string[];
          requirements: {
            archiveParsing: boolean;
            featureQuery: boolean;
          };
        };
      }>;
    };
    expect(result.isError).toBeUndefined();
    expect(summary.validation.valid).toBe(true);
    expect(summary.sources).toContainEqual(
      expect.objectContaining({
        id: "local-parcels",
        type: "pmtiles",
        sourceContract: expect.objectContaining({
          kind: "archive",
          state: "explicit",
          metadataFields: expect.arrayContaining(["specVersion", "archiveBytes", "rootDirectoryLength"]),
          policyFields: expect.arrayContaining(["maxArchiveBytes", "allowRangeRequests", "timeoutMs"]),
        }),
      }),
    );
    expect(summary.sourceReadiness).toContainEqual(
      expect.objectContaining({
        sourceId: "local-parcels",
        type: "pmtiles",
        state: "readiness-only",
        queryReady: false,
        resourcePolicy: "passed",
        sourceContract: expect.objectContaining({
          kind: "archive",
          state: "explicit",
          metadataFields: expect.arrayContaining(["specVersion", "archiveBytes", "rootDirectoryLength"]),
          policyFields: expect.arrayContaining(["maxArchiveBytes", "allowRangeRequests", "timeoutMs"]),
        }),
        archiveContract: expect.objectContaining({
          state: "explicit",
          metadataFields: expect.arrayContaining(["specVersion", "archiveBytes", "rootDirectoryLength"]),
          policyFields: expect.arrayContaining(["maxArchiveBytes", "allowRangeRequests", "timeoutMs"]),
        }),
        runtimeLoadPlan: expect.objectContaining({
          status: "ready",
          sourceLayerIds: ["parcels"],
          requirements: expect.objectContaining({
            archiveParsing: false,
            featureQuery: false,
          }),
        }),
      }),
    );
  });

  it("surfaces FlatGeobuf source contract and readiness-only state in context summaries", async () => {
    const flatGeobufSpec: MapSpec = {
      version: "0.1",
      id: "flatgeobuf-review",
      revision: "1",
      view: { center: [0, 0], zoom: 4 },
      sources: {
        parcels: {
          type: "flatgeobuf",
          url: "./data/parcels.fgb",
          hasIndex: true,
          featureCount: 42,
          geometryType: "Polygon",
        },
      },
      layers: [],
    };

    const result = await callGisEngineTool({
      params: {
        name: "get_context_summary",
        arguments: { spec: flatGeobufSpec },
      },
    });

    const summary = JSON.parse(result.content[0]?.text) as {
      validation: { valid: boolean };
      sources: Array<{
        id: string;
        type: string;
        sourceContract?: {
          kind: string;
          state: string;
          metadataFields: string[];
          policyFields: string[];
        };
      }>;
      sourceReadiness: Array<{
        sourceId: string;
        type: string;
        state: string;
        queryReady: boolean;
        resourcePolicy: string;
        sourceContract?: {
          kind: string;
          state: string;
          metadataFields: string[];
          policyFields: string[];
        };
      }>;
    };

    expect(result.isError).toBeUndefined();
    expect(summary.validation.valid).toBe(true);
    expect(summary.sources).toContainEqual(
      expect.objectContaining({
        id: "parcels",
        type: "flatgeobuf",
        sourceContract: expect.objectContaining({
          kind: "schema",
          state: "explicit",
          metadataFields: expect.arrayContaining(["type", "url", "hasIndex", "featureCount"]),
          policyFields: expect.arrayContaining(["maxFileBytes", "maxFeatureCount", "indexRequired"]),
        }),
      }),
    );
    expect(summary.sourceReadiness).toContainEqual(
      expect.objectContaining({
        sourceId: "parcels",
        type: "flatgeobuf",
        state: "readiness-only",
        queryReady: false,
        resourcePolicy: "passed",
        sourceContract: expect.objectContaining({
          kind: "schema",
          state: "explicit",
          metadataFields: expect.arrayContaining(["type", "url", "hasIndex", "featureCount"]),
          policyFields: expect.arrayContaining(["maxFileBytes", "maxFeatureCount", "indexRequired"]),
        }),
      }),
    );
  });

  it("surfaces GeoParquet source contract and readiness-only state in context summaries", async () => {
    const geoParquetSpec: MapSpec = {
      version: "0.1",
      id: "geoparquet-review",
      revision: "1",
      view: { center: [0, 0], zoom: 4 },
      sources: {
        parcels: {
          type: "geoparquet",
          url: "./data/parcels.parquet",
          crs: { authority: "EPSG", code: "4326" },
          encoding: "WKB",
          rowCount: 42,
          bbox: [-123, 37, -122, 38],
        },
      },
      layers: [],
    };

    const result = await callGisEngineTool({
      params: {
        name: "get_context_summary",
        arguments: { spec: geoParquetSpec },
      },
    });

    const summary = JSON.parse(result.content[0]?.text) as {
      validation: { valid: boolean };
      sources: Array<{
        id: string;
        type: string;
        sourceContract?: {
          kind: string;
          state: string;
          metadataFields: string[];
          policyFields: string[];
        };
      }>;
      sourceReadiness: Array<{
        sourceId: string;
        type: string;
        state: string;
        queryReady: boolean;
        resourcePolicy: string;
        sourceContract?: {
          kind: string;
          state: string;
          metadataFields: string[];
          policyFields: string[];
        };
      }>;
    };

    expect(result.isError).toBeUndefined();
    expect(summary.validation.valid).toBe(true);
    expect(summary.sources).toContainEqual(
      expect.objectContaining({
        id: "parcels",
        type: "geoparquet",
        sourceContract: expect.objectContaining({
          kind: "schema",
          state: "explicit",
          metadataFields: expect.arrayContaining(["type", "url", "crs", "encoding", "rowCount"]),
          policyFields: expect.arrayContaining(["maxFileBytes", "maxRowCount", "workerBudget"]),
        }),
      }),
    );
    expect(summary.sourceReadiness).toContainEqual(
      expect.objectContaining({
        sourceId: "parcels",
        type: "geoparquet",
        state: "readiness-only",
        queryReady: false,
        resourcePolicy: "passed",
        sourceContract: expect.objectContaining({
          kind: "schema",
          state: "explicit",
          metadataFields: expect.arrayContaining(["type", "url", "crs", "encoding", "rowCount"]),
          policyFields: expect.arrayContaining(["maxFileBytes", "maxRowCount", "workerBudget"]),
        }),
      }),
    );
  });

  it("surfaces GeoTIFF source contract and readiness-only state in context summaries", async () => {
    const geoTiffSpec: MapSpec = {
      version: "0.1",
      id: "geotiff-review",
      revision: "1",
      view: { center: [0, 0], zoom: 4 },
      sources: {
        orthophoto: {
          type: "geotiff",
          url: "./data/orthophoto.tif",
          crs: { authority: "EPSG", code: "4326" },
          bbox: [-123, 37, -122, 38],
          width: 1024,
          height: 512,
          bandCount: 3,
          bands: [
            { index: 1, name: "red", dataType: "uint16", noData: 0 },
            { index: 2, name: "green", dataType: "uint16", noData: 0 },
            { index: 3, name: "blue", dataType: "uint16", noData: 0 },
          ],
          fileBytes: 1_000_000,
        },
      },
      layers: [],
    };

    const result = await callGisEngineTool({
      params: {
        name: "get_context_summary",
        arguments: { spec: geoTiffSpec },
      },
    });

    const summary = JSON.parse(result.content[0]?.text) as {
      validation: { valid: boolean };
      sources: Array<{
        id: string;
        type: string;
        sourceContract?: {
          kind: string;
          state: string;
          metadataFields: string[];
          policyFields: string[];
        };
      }>;
      sourceReadiness: Array<{
        sourceId: string;
        type: string;
        state: string;
        queryReady: boolean;
        resourcePolicy: string;
        sourceContract?: {
          kind: string;
          state: string;
          metadataFields: string[];
          policyFields: string[];
        };
      }>;
    };

    expect(result.isError).toBeUndefined();
    expect(summary.validation.valid).toBe(true);
    expect(summary.sources).toContainEqual(
      expect.objectContaining({
        id: "orthophoto",
        type: "geotiff",
        sourceContract: expect.objectContaining({
          kind: "schema",
          state: "explicit",
          metadataFields: expect.arrayContaining(["type", "url", "crs", "bandCount", "bands"]),
          policyFields: expect.arrayContaining(["maxFileBytes", "maxPixels", "maxBandCount", "workerBudget"]),
        }),
      }),
    );
    expect(summary.sourceReadiness).toContainEqual(
      expect.objectContaining({
        sourceId: "orthophoto",
        type: "geotiff",
        state: "readiness-only",
        queryReady: false,
        resourcePolicy: "passed",
        sourceContract: expect.objectContaining({
          kind: "schema",
          state: "explicit",
          metadataFields: expect.arrayContaining(["type", "url", "crs", "bandCount", "bands"]),
          policyFields: expect.arrayContaining(["maxFileBytes", "maxPixels", "maxBandCount", "workerBudget"]),
        }),
      }),
    );
  });

  it("exposes gated SceneView3D context without enabling stable 3D runtime", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "get_context_summary",
        arguments: { spec: scene3dExtensionSpec },
      },
    });

    const summary = JSON.parse(result.content[0]?.text) as {
      scene3d?: {
        status: string;
        stableViewMode: boolean;
        runtimeSupported: boolean;
        sourceCount: number;
        layerCount: number;
        pickableLayerCount: number;
        snapshot: { mockPassed: boolean; pendingSourceIds: string[] };
        query: { pickCount: number };
        capabilities: { renderer: string; dimensions: string[] };
      };
      capabilitySummary: { domains: Array<{ id: string; status: string; blocked: string[]; evidence: string[] }> };
      validation: { valid: boolean };
    };

    expect(result.isError).toBeUndefined();
    expect(summary.validation.valid).toBe(true);
    expect(summary.scene3d).toMatchObject({
      status: "extension-only",
      stableViewMode: false,
      runtimeSupported: false,
      sourceCount: 3,
      layerCount: 3,
      pickableLayerCount: 2,
      snapshot: { mockPassed: true, pendingSourceIds: [] },
      query: { pickCount: 2 },
      capabilities: { renderer: "scene3d", dimensions: ["3d"] },
    });
    expect(summary.scene3d).not.toHaveProperty("rendererEvidence");
    expect(summary.scene3d).not.toHaveProperty("promotionEvidence");
    const sceneDomain = summary.capabilitySummary.domains.find((domain) => domain.id === "scene-browsing");
    expect(sceneDomain).toMatchObject({ status: "experimental" });
    expect(sceneDomain?.blocked.join(" ")).toContain('stable view.mode: "scene3d" runtime rendering is blocked');
    expect(sceneDomain?.evidence).toEqual(
      expect.arrayContaining(["scene3d.status=extension-only", "scene3d.stableViewMode=false"]),
    );
  });

  it("covers v0.2 vector tile and expression contracts through MCP tools", async () => {
    const validateResult = await callGisEngineTool({
      params: {
        name: "validate_spec",
        arguments: { spec: vectorTileUrl },
      },
    });
    const validation = JSON.parse(validateResult.content[0]?.text) as {
      valid: boolean;
      diagnostics: Array<{ code: string }>;
    };
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
            experimental: [],
          },
        },
      },
    });
    const explanation = JSON.parse(explainResult.content[0]?.text) as {
      summary: {
        sources: Array<{ id: string; type: string }>;
        layers: Array<{ id: string; type: string; source?: string }>;
        capabilities?: { sources: string[]; expressions: string[] };
        capabilitySummary: { domains: Array<{ id: string; supported: string[] }> };
      };
      validation: { valid: boolean };
    };
    expect(explainResult.isError).toBeUndefined();
    expect(explanation.validation.valid).toBe(true);
    expect(explanation.summary.sources).toEqual([{ id: "local-parcels", type: "vector" }]);
    expect(explanation.summary.layers.map((layer) => layer.id)).toEqual(["parcel-fill", "parcel-outline"]);
    expect(explanation.summary.capabilities?.sources).toContain("vector");
    expect(explanation.summary.capabilities?.expressions).toEqual(
      expect.arrayContaining(["case", "match", "zoom", "to-number", "to-string"]),
    );
    expect(
      explanation.summary.capabilitySummary.domains
        .find((domain) => domain.id === "spatial-analysis")
        ?.supported.join(" "),
    ).toContain("declared query capabilities: point");

    const snapshotResult = await callGisEngineTool({
      params: {
        name: "snapshot_spec",
        arguments: {
          spec: vectorTileUrl,
          renderer: "maplibre",
          snapshot: { width: 320, height: 180, format: "data-url", targetLayers: ["parcel-fill"] },
        },
      },
    });
    const imageContent = snapshotResult.content[0];
    expect(imageContent?.type).toBe("image");
    if (imageContent?.type === "image") {
      expect(imageContent.mimeType).toBe("image/png");
      expect(imageContent.data.length).toBeGreaterThan(0);
    }
    const textContent = snapshotResult.content[1];
    expect(textContent?.type).toBe("text");
    const snapshot = JSON.parse(textContent?.text ?? "{}") as {
      passed: boolean;
      validation: { valid: boolean };
    };
    expect(snapshotResult.isError).toBeUndefined();
    expect(snapshot.validation.valid).toBe(true);
    expect(snapshot.passed).toBe(true);

    const exportResult = await callGisEngineTool({
      params: {
        name: "export_spec",
        arguments: { spec: vectorTileUrl },
      },
    });
    const exported = JSON.parse(exportResult.content[0]?.text) as typeof vectorTileUrl;
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
            unexpected: true,
          },
        },
      },
    });
    const diagnostics = JSON.parse(result.content[0]?.text) as Array<{ code: string; path?: string }>;
    expect(result.isError).toBe(true);
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SPEC.UNKNOWN_FIELD", path: "/capabilities" }),
        expect.objectContaining({ code: "SPEC.INVALID_TYPE", path: "/capabilities/dimensions/0" }),
        expect.objectContaining({ code: "SPEC.INVALID_TYPE", path: "/capabilities/snapshot/formats/0" }),
      ]),
    );
  });

  it("returns stable expression diagnostics for invalid v0.2 expressions through MCP", async () => {
    const invalidSpec = structuredClone(vectorTileUrl) as MapSpec;
    invalidSpec.layers[0] = {
      ...firstLayer(invalidSpec),
      paint: {
        "fill-color": ["match", ["get", "class"], { bad: "label" }, "#22c55e", "#f97316"],
        "fill-opacity": ["case", "not-boolean", 0.4, 0.2],
      },
    };

    const result = await callGisEngineTool({
      params: {
        name: "validate_spec",
        arguments: { spec: invalidSpec },
      },
    });
    const report = JSON.parse(result.content[0]?.text) as {
      valid: boolean;
      diagnostics: Array<{ code: string; path?: string }>;
    };
    expect(result.isError).toBeUndefined();
    expect(report.valid).toBe(false);
    expect(report.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "EXPR.TYPE_MISMATCH", path: "/layers/0/paint/fill-color/2" }),
        expect.objectContaining({ code: "EXPR.TYPE_MISMATCH", path: "/layers/0/paint/fill-opacity/1" }),
      ]),
    );
  });

  it("returns structured diagnostics for invalid context and unknown tool requests", async () => {
    const contextResult = await callGisEngineTool({
      params: {
        name: "get_context_summary",
        arguments: { spec: before, unexpected: true },
      },
    });
    const contextDiagnostics = JSON.parse(contextResult.content[0]?.text) as Array<{ code: string }>;
    expect(contextResult.isError).toBe(true);
    expect(contextDiagnostics).toContainEqual(expect.objectContaining({ code: "SPEC.UNKNOWN_FIELD" }));

    const unknownToolResult = await callGisEngineTool({
      params: {
        name: "missing_tool",
        arguments: {},
      },
    });
    const unknownToolDiagnostics = JSON.parse(unknownToolResult.content[0]?.text) as Array<{ code: string }>;
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
          snapshot: { width: 320, height: 180, format: "data-url" },
        },
      },
    });

    const imageContent = result.content[0];
    expect(imageContent?.type).toBe("image");
    if (imageContent?.type === "image") {
      expect(imageContent.mimeType).toBe("image/png");
      expect(imageContent.data.length).toBeGreaterThan(0);
    }
    const textContent = result.content[1];
    expect(textContent?.type).toBe("text");
    const snapshot = JSON.parse(textContent?.text ?? "{}") as {
      passed: boolean;
      renderer: string;
      diagnostics: Array<{ code: string }>;
      validation: { valid: boolean; diagnostics: Array<{ code: string }> };
    };
    expect(result.isError).toBeUndefined();
    expect(snapshot.passed).toBe(true);
    expect(snapshot.renderer).toBe("maplibre");
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
            view: { ...before.view, center: [200, 100] },
          },
          renderer: "mock",
        },
      },
    });

    const snapshot = JSON.parse(result.content[0]?.text) as {
      passed: boolean;
      validation: { valid: boolean };
      diagnostics: Array<{ code: string; path?: string }>;
    };
    expect(result.isError).toBeUndefined();
    expect(snapshot.passed).toBe(false);
    expect(snapshot.validation.valid).toBe(false);
    expect(snapshot.diagnostics).toContainEqual(
      expect.objectContaining({ code: "GEO.INVALID_COORDINATES", path: "/view/center" }),
    );
  });

  it("rejects scene3d snapshot requests through the MCP schema", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "snapshot_spec",
        arguments: {
          spec: before,
          renderer: "scene3d",
        },
      },
    });

    const diagnostics = JSON.parse(result.content[0]?.text) as Array<{ code: string; path?: string }>;
    expect(result.isError).toBe(true);
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: "SPEC.INVALID_TYPE", path: "/renderer" }));
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
                source: "missing-source",
              },
            ],
          },
        },
      },
    });

    const explanation = JSON.parse(result.content[0]?.text) as {
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
        arguments: {
          exampleId: "pmtiles-local",
          generationEvidence: {
            promptHash: "sha256:manifest-summary",
            status: "ready",
            delivery: manifestDeliverySummary(),
            targetDomains: ["feature-display", "spatial-analysis"],
            toolSequence: [
              "get_context_summary",
              "validate_spec",
              "apply_commands",
              "snapshot_spec",
              "export_spec",
              "export_example_app",
            ],
            diagnosticCounts: { error: 0, warning: 0, info: 0 },
            command: {
              usedApplyCommands: true,
              commandCount: 2,
              committed: true,
              rolledBack: false,
            },
            planner: {
              provided: true,
              confidenceLevel: "high",
              unsupportedIntentCount: 0,
            },
            spatialQuery: {
              requested: true,
              ready: true,
              status: "ready",
              caseCount: 2,
              blockedOperations: [],
            },
            sceneBrowsing: {
              requested: false,
              status: "not-requested",
              extensionPresent: false,
              stableViewMode: false,
              runtimeSupported: false,
              stableRuntimeBlocked: true,
              state: "not-requested",
              sourceCount: 0,
              layerCount: 0,
              sourceIds: [],
              layerIds: [],
              pickableLayerCount: 0,
              mockSnapshotPassed: false,
              mockQueryPickCount: 0,
              stableRuntimeBlockerCodes: [],
            },
            snapshot: {
              requested: true,
              renderer: "mock",
              passed: true,
            },
            export: {
              ready: true,
              sourceCount: 1,
              layerCount: 1,
            },
          },
        },
      },
    });

    const manifest = JSON.parse(result.content[0]?.text) as {
      exampleId: string;
      writesFiles: boolean;
      files: Array<Record<string, unknown>>;
      notes: string[];
      generationEvidence?: {
        status: string;
        spatialQuery: { caseCount: number };
        sceneBrowsing: {
          requested: boolean;
          stableRuntimeBlockerCodes: string[];
        };
        snapshot: { renderer: string; passed: boolean };
      };
    };
    expect(result.isError).toBeUndefined();
    expect(manifest).toMatchObject({ exampleId: "pmtiles-local", writesFiles: false });
    expect(manifest.files.map((file) => file.path)).toEqual(["examples/pmtiles-local/map.json"]);
    expect(manifest.files.every((file) => !("content" in file))).toBe(true);
    expect(manifest.notes.join(" ")).toContain("does not parse archives");
    expect(manifest.notes.join(" ")).toContain("perform hidden fetches");
    expect(manifest.notes.join(" ")).toContain("runtime feature-query support");
    expect(manifest.notes.join(" ")).toContain("writes no files");
    expect(manifest.generationEvidence).toMatchObject({
      status: "ready",
      spatialQuery: { caseCount: 2 },
      sceneBrowsing: {
        requested: false,
        stableRuntimeBlockerCodes: [],
      },
      snapshot: { renderer: "mock", passed: true },
    });
  });

  it("round-trips scene browsing blocker evidence through export_example_app", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "export_example_app",
        arguments: {
          exampleId: "ai-map-edit",
          generationEvidence: {
            promptHash: "sha256:scene-manifest-summary",
            status: "ready",
            delivery: manifestDeliverySummary("follow-up-required"),
            targetDomains: ["scene-browsing"],
            toolSequence: [
              "get_context_summary",
              "validate_spec",
              "apply_commands",
              "snapshot_spec",
              "export_spec",
              "export_example_app",
            ],
            diagnosticCounts: { error: 0, warning: 0, info: 0 },
            command: {
              usedApplyCommands: true,
              commandCount: 3,
              committed: true,
              rolledBack: false,
            },
            planner: {
              provided: true,
              confidenceLevel: "medium",
              unsupportedIntentCount: 0,
            },
            spatialQuery: {
              requested: false,
              ready: false,
              status: "not-requested",
              caseCount: 0,
              blockedOperations: [],
            },
            sceneBrowsing: {
              requested: true,
              status: "experimental",
              extensionPresent: true,
              stableViewMode: false,
              runtimeSupported: false,
              stableRuntimeBlocked: true,
              state: "extension-only",
              sourceCount: 1,
              layerCount: 1,
              sourceIds: ["city"],
              layerIds: ["city"],
              pickableLayerCount: 1,
              mockSnapshotPassed: true,
              mockQueryPickCount: 1,
              stableRuntimeBlockerCodes: [
                "SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED",
                "SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED",
                "SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED",
              ],
            },
            snapshot: {
              requested: true,
              renderer: "mock",
              passed: true,
            },
            export: {
              ready: true,
              sourceCount: 0,
              layerCount: 0,
            },
          },
        },
      },
    });

    const manifest = JSON.parse(result.content[0]?.text) as {
      writesFiles: boolean;
      generationEvidence?: {
        sceneBrowsing: {
          requested: boolean;
          extensionPresent: boolean;
          stableViewMode: boolean;
          runtimeSupported: boolean;
          sourceIds: string[];
          layerIds: string[];
          stableRuntimeBlockerCodes: string[];
        };
      };
    };
    expect(result.isError).toBeUndefined();
    expect(manifest.writesFiles).toBe(false);
    expect(manifest.generationEvidence?.sceneBrowsing).toMatchObject({
      requested: true,
      extensionPresent: true,
      stableViewMode: false,
      runtimeSupported: false,
      sourceIds: ["city"],
      layerIds: ["city"],
      stableRuntimeBlockerCodes: [
        "SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED",
        "SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED",
        "SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED",
      ],
    });
  });
});

function firstLayer(spec: MapSpec): MapSpec["layers"][number] {
  const layer = spec.layers[0];
  if (!layer) throw new Error("Expected first layer fixture.");
  return layer;
}
