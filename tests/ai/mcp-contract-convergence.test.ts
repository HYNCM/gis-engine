import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import {
  callGisEngineTool,
  createGisEngineMcpServer,
  GIS_ENGINE_MCP_PROTOCOL_VERSION,
  gisEngineTools,
  listGisEngineTools,
} from "@gis-engine/ai";
import Ajv from "ajv";
import { describe, expect, it } from "vitest";

const requireFromAiPackage = createRequire(new URL("../../packages/ai/package.json", import.meta.url));
const { CallToolResultSchema, ErrorCode, ListToolsResultSchema, SUPPORTED_PROTOCOL_VERSIONS } = requireFromAiPackage(
  "@modelcontextprotocol/sdk/types.js",
) as {
  CallToolResultSchema: { safeParse(value: unknown): { success: boolean } };
  ErrorCode: { InvalidParams: number };
  ListToolsResultSchema: { safeParse(value: unknown): { success: boolean } };
  SUPPORTED_PROTOCOL_VERSIONS: string[];
};
const { Client } = requireFromAiPackage("@modelcontextprotocol/sdk/client/index.js") as {
  Client: new (implementation: {
    name: string;
    version: string;
  }) => {
    callTool(params: { name: string; arguments?: unknown }): Promise<unknown>;
    close(): Promise<void>;
    connect(transport: unknown): Promise<void>;
    getServerVersion(): { name: string; version: string } | undefined;
    listTools(): Promise<unknown>;
  };
};
const { InMemoryTransport } = requireFromAiPackage("@modelcontextprotocol/sdk/inMemory.js") as {
  InMemoryTransport: {
    createLinkedPair(): [
      {
        close(): Promise<void>;
        onmessage?: (message: unknown) => void;
        send(message: unknown): Promise<void>;
        start(): Promise<void>;
      },
      unknown,
    ];
  };
};

const MCP_JSON_SCHEMA_DIALECT = "http://json-schema.org/draft-07/schema#";
const { version: aiPackageVersion } = requireFromAiPackage("./package.json") as { version: string };

const minimalSpec = {
  version: "0.1",
  view: { center: [0, 0], zoom: 2 },
  sources: {},
  layers: [],
};

const minimalGeoJson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { name: "test", value: 42 },
    },
  ],
};

const successfulCalls = [
  { name: "apply_commands", arguments: { spec: minimalSpec, commands: [] } },
  { name: "validate_spec", arguments: { spec: minimalSpec } },
  { name: "export_spec", arguments: { spec: minimalSpec } },
  { name: "get_context_summary", arguments: { spec: minimalSpec } },
  { name: "snapshot_spec", arguments: { spec: minimalSpec, renderer: "mock" } },
  { name: "explain_spec", arguments: { spec: minimalSpec } },
  { name: "export_example_app", arguments: { exampleId: "basic-geojson" } },
  { name: "diff_specs", arguments: { before: minimalSpec, after: minimalSpec } },
  { name: "generate_spec", arguments: { intent: { description: "A minimal world map" } } },
  { name: "inspect_data", arguments: { geojson: minimalGeoJson } },
  { name: "edit_spec", arguments: { spec: minimalSpec, instruction: "Set zoom to 3" } },
  { name: "query_features", arguments: { geojson: minimalGeoJson, point: [0, 0] } },
  { name: "style_recommend", arguments: { geojson: minimalGeoJson } },
  {
    name: "transform_data",
    arguments: {
      geojson: minimalGeoJson,
      operations: [{ type: "filter", property: "value", operator: ">", value: 10 }],
    },
  },
] as const;

describe("MCP 2025-11-25 contract convergence", () => {
  it("pins the SDK contract tests to the stable protocol revision", () => {
    const serverSource = readFileSync(new URL("../../packages/ai/src/mcp/server.ts", import.meta.url), "utf8");

    expect(serverSource).toContain('export const GIS_ENGINE_MCP_PROTOCOL_VERSION = "2025-11-25"');
    expect(serverSource).not.toContain("GIS_ENGINE_MCP_PROTOCOL_VERSION = LATEST_PROTOCOL_VERSION");
    expect(SUPPORTED_PROTOCOL_VERSIONS).toContain(GIS_ENGINE_MCP_PROTOCOL_VERSION);
    expect(GIS_ENGINE_MCP_PROTOCOL_VERSION).toBe("2025-11-25");
  });

  it("negotiates the frozen stable protocol revision", async () => {
    const server = createGisEngineMcpServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const response = new Promise<Record<string, unknown>>((resolve) => {
      clientTransport.onmessage = (message) => resolve(message as Record<string, unknown>);
    });

    try {
      await server.connect(serverTransport as Parameters<typeof server.connect>[0]);
      await clientTransport.start();
      await clientTransport.send({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: GIS_ENGINE_MCP_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: "gis-engine-protocol-contract-test", version: "1.0.0" },
        },
      });

      await expect(response).resolves.toMatchObject({
        result: { protocolVersion: GIS_ENGINE_MCP_PROTOCOL_VERSION },
      });
    } finally {
      await clientTransport.close();
      await server.close();
    }
  });

  it("returns a tools/list payload accepted by the MCP SDK", async () => {
    const result = await listGisEngineTools();

    expect(ListToolsResultSchema.safeParse(result).success).toBe(true);
    expect(result.tools.every((tool) => tool.outputSchema?.type === "object")).toBe(true);
  });

  it("declares the JSON Schema dialect for every public descriptor", async () => {
    const { tools } = await listGisEngineTools();

    for (const tool of tools) {
      expect(tool.inputSchema.$schema, `${tool.name} input dialect`).toBe(MCP_JSON_SCHEMA_DIALECT);
      expect(tool.outputSchema.$schema, `${tool.name} output dialect`).toBe(MCP_JSON_SCHEMA_DIALECT);
      expect(() => new Ajv({ strict: false }).compile(tool.inputSchema)).not.toThrow();
      expect(() => new Ajv({ strict: false }).compile(tool.outputSchema)).not.toThrow();
    }
  });

  it("serves valid results and rejects unknown tools over a real MCP transport", async () => {
    const server = createGisEngineMcpServer();
    const client = new Client({ name: "gis-engine-contract-test", version: "1.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    try {
      await server.connect(serverTransport as Parameters<typeof server.connect>[0]);
      await client.connect(clientTransport);
      expect(client.getServerVersion()).toEqual({ name: "gis-engine", version: aiPackageVersion });

      const listedTools = await client.listTools();
      expect(ListToolsResultSchema.safeParse(listedTools).success).toBe(true);
      for (const call of successfulCalls) {
        const result = await client.callTool(call);
        expect(CallToolResultSchema.safeParse(result).success, `${call.name} transport result`).toBe(true);
      }
      await expect(client.callTool({ name: "missing_tool", arguments: {} })).rejects.toMatchObject({
        code: ErrorCode.InvalidParams,
      });
    } finally {
      await client.close();
      await server.close();
    }
  });

  it("returns schema-conforming structured content and JSON text for every public tool", async () => {
    expect(successfulCalls.map((call) => call.name)).toEqual(gisEngineTools.map((tool) => tool.name));

    for (const call of successfulCalls) {
      const descriptor = gisEngineTools.find((tool) => tool.name === call.name);
      if (!descriptor) throw new Error(`Missing MCP descriptor for ${call.name}.`);

      const result = await callGisEngineTool({ params: call });
      const validateOutput = new Ajv({ strict: false }).compile(descriptor.outputSchema);
      const textContent = result.content.find((content) => content.type === "text");

      expect(result.isError, `${call.name} should succeed`).toBeUndefined();
      expect(CallToolResultSchema.safeParse(result).success, `${call.name} should be a valid MCP result`).toBe(true);
      expect(result.structuredContent, `${call.name} should return structuredContent`).toBeDefined();
      expect(validateOutput(result.structuredContent), `${call.name} structuredContent should match outputSchema`).toBe(
        true,
      );
      expect(textContent?.text, `${call.name} should retain a JSON text block`).toBeDefined();
      expect(JSON.parse(textContent?.text ?? "null")).toEqual(result.structuredContent);
    }
  });

  it("returns schema-conforming structured diagnostics while retaining legacy error text", async () => {
    for (const descriptor of gisEngineTools) {
      const result = await callGisEngineTool({
        params: { name: descriptor.name, arguments: {} },
      });
      const validateOutput = new Ajv({ strict: false }).compile(descriptor.outputSchema);
      const textContent = result.content.find((content) => content.type === "text");
      const legacyDiagnostics = JSON.parse(textContent?.text ?? "null");

      expect(result.isError, `${descriptor.name} should reject empty input`).toBe(true);
      expect(
        CallToolResultSchema.safeParse(result).success,
        `${descriptor.name} error should be a valid MCP result`,
      ).toBe(true);
      expect(result.structuredContent).toEqual({ diagnostics: legacyDiagnostics });
      expect(validateOutput(result.structuredContent), `${descriptor.name} error should match outputSchema`).toBe(true);
    }
  });
});
