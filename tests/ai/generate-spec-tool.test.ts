import { callGisEngineTool } from "@gis-engine/ai";
import { describe, expect, it } from "vitest";

describe("generate_spec MCP tool", () => {
  it("generates a basic GeoJSON MapSpec from a simple description", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: { description: "展示中国各省 GDP 数据" },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: {
        version: string;
        view: { center: [number, number]; zoom: number };
        sources: Record<string, { type: string }>;
        layers: Array<{ id: string; type: string; source: string }>;
        interactions?: { pan: boolean; zoom: boolean };
      };
      suggestions: string[];
      diagnostics: unknown[];
    };

    expect(result.isError).toBeUndefined();
    expect(payload.spec.version).toBe("0.1");
    expect(payload.spec.view.center[0]).toBeCloseTo(104.1954, 0);
    expect(payload.spec.view.center[1]).toBeCloseTo(35.8617, 0);
    expect(Object.keys(payload.spec.sources)).toEqual(["primary-source"]);
    expect(payload.spec.sources["primary-source"].type).toBe("geojson");
    expect(payload.spec.layers.length).toBeGreaterThanOrEqual(1);
    expect(payload.spec.layers[0].type).toBe("fill");
    expect(payload.spec.interactions).toMatchObject({ pan: true, zoom: true });
    expect(payload.suggestions.length).toBeGreaterThan(0);
  });

  it("generates a raster spec for satellite imagery description", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: { description: "Display satellite imagery of Tokyo", dataType: "raster" },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: {
        sources: Record<string, { type: string; tiles: string[] }>;
        layers: Array<{ type: string }>;
      };
    };

    expect(payload.spec.sources["primary-source"].type).toBe("raster");
    expect(payload.spec.sources["primary-source"].tiles.length).toBeGreaterThan(0);
    expect(payload.spec.layers[0].type).toBe("raster");
  });

  it("generates a line spec for route descriptions", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: { description: "Show road network routes in Beijing" },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: {
        layers: Array<{ type: string }>;
      };
    };

    expect(payload.spec.layers[0].type).toBe("line");
  });

  it("generates a circle spec for point data descriptions", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: { description: "Show city locations across Asia" },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: {
        layers: Array<{ type: string }>;
      };
    };

    expect(payload.spec.layers[0].type).toBe("circle");
  });

  it("respects explicit center and zoom", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: {
            description: "A map of something",
            center: [-74.006, 40.7128],
            zoom: 12,
          },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: { view: { center: [number, number]; zoom: number } };
    };

    expect(payload.spec.view.center).toEqual([-74.006, 40.7128]);
    expect(payload.spec.view.zoom).toBe(12);
  });

  it("applies dark theme colors to fill layers", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: { description: "Show regions", theme: "dark" },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: { layers: Array<{ paint: Record<string, unknown> }> };
    };

    const fillLayer = payload.spec.layers[0];
    expect(fillLayer.paint["fill-color"]).toBe("#1e40af");
  });

  it("omits interactions when includeInteractions is false", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: { description: "A simple map" },
          options: { includeInteractions: false },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: { interactions?: unknown };
    };

    expect(payload.spec.interactions).toBeUndefined();
  });

  it("omits metadata when includeMetadata is false", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: { description: "A simple map" },
          options: { includeMetadata: false },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: { metadata?: unknown };
    };

    expect(payload.spec.metadata).toBeUndefined();
  });

  it("returns structured diagnostics for missing description", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: { intent: {} },
      },
    });

    const diagnostics = JSON.parse(result.content[0]?.text) as Array<{ code: string }>;
    expect(result.isError).toBe(true);
    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("returns structured diagnostics for invalid input", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {},
      },
    });

    expect(result.isError).toBe(true);
    const diagnostics = JSON.parse(result.content[0]?.text) as Array<{ code: string }>;
    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("includes vector-tiles source when description mentions vector tiles", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: { description: "Display vector tile parcels with fill layers" },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: { sources: Record<string, { type: string }> };
    };

    expect(payload.spec.sources["primary-source"].type).toBe("vector");
  });
});
