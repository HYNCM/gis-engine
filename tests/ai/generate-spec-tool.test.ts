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
    expect(fillLayer.paint["fill-color"]).toBe("#4a90d9");
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

  it("generates choropleth with fill + interpolate expression", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: { description: "Show population choropleth of Chinese provinces" },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: { layers: Array<{ id: string; type: string; paint: Record<string, unknown> }> };
    };

    const fillLayer = payload.spec.layers.find((l) => l.id === "choropleth-fill");
    expect(fillLayer).toBeDefined();
    expect(fillLayer!.type).toBe("fill");
    const fillColor = fillLayer!.paint["fill-color"] as unknown[];
    expect(fillColor[0]).toBe("interpolate");
    // Should use 'population' property detected from description
    const getExpr = fillColor[2] as unknown[];
    expect(getExpr[0]).toBe("get");
    expect(getExpr[1]).toBe("population");

    const outlineLayer = payload.spec.layers.find((l) => l.id === "choropleth-outline");
    expect(outlineLayer).toBeDefined();
    expect(outlineLayer!.type).toBe("line");
  });

  it("generates graduated-circle with circle-radius interpolate", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: { description: "Show earthquake magnitude as bubble proportional chart" },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: { layers: Array<{ id: string; type: string; paint: Record<string, unknown> }> };
    };

    const layer = payload.spec.layers[0];
    expect(layer.type).toBe("circle");
    const radius = layer.paint["circle-radius"] as unknown[];
    expect(radius[0]).toBe("interpolate");
    const getExpr = radius[2] as unknown[];
    expect(getExpr[0]).toBe("get");
    expect(getExpr[1]).toBe("magnitude");
  });

  it("generates heatmap with heatmap-color ramp", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: { description: "Show crime density heatmap in New York" },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: { layers: Array<{ id: string; type: string; paint: Record<string, unknown> }> };
    };

    const layer = payload.spec.layers[0];
    expect(layer.type).toBe("heatmap");
    const heatColor = layer.paint["heatmap-color"] as unknown[];
    expect(heatColor[0]).toBe("interpolate");
    expect(heatColor.length).toBeGreaterThan(4); // 4-stop ramp
  });

  it("generates symbol layer with text-field get expression", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: { description: "Add label annotations for points of interest in Tokyo" },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: {
        layers: Array<{
          id: string;
          type: string;
          layout: Record<string, unknown>;
          paint: Record<string, unknown>;
        }>;
      };
    };

    const layer = payload.spec.layers[0];
    expect(layer.type).toBe("symbol");
    const textField = layer.layout["text-field"] as unknown[];
    expect(textField[0]).toBe("get");
    expect(textField[1]).toBe("name");
    // Check text-halo
    expect(layer.paint["text-halo-width"]).toBe(2);
  });

  it("generates multi-layer composition with 3+ layers", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: {
            description: "地图包含道路、建筑区域和兴趣点标注",
            multiLayer: true,
          },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: { layers: Array<{ type: string }> };
    };

    // Should have at least 3 layers (line + fill + symbol)
    expect(payload.spec.layers.length).toBeGreaterThanOrEqual(3);
    const types = payload.spec.layers.map((l) => l.type);
    expect(types).toContain("line");
    expect(types).toContain("fill");
    expect(types).toContain("symbol");
  });

  it("applies ocean theme palette", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: { description: "Show ocean currents", theme: "ocean" },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: { layers: Array<{ paint: Record<string, unknown> }> };
    };

    // fill layer uses ocean palette fill color
    const layer = payload.spec.layers[0];
    expect(layer.paint["fill-color"]).toBe("#48cae4");
  });

  it("applies forest theme palette", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: { description: "Show forest coverage", theme: "forest" },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: { layers: Array<{ paint: Record<string, unknown> }> };
    };

    expect(payload.spec.layers[0].paint["fill-color"]).toBe("#52b788");
  });

  it("applies warm theme palette", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: { description: "Show temperature distribution", theme: "warm" },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: { layers: Array<{ paint: Record<string, unknown> }> };
    };

    expect(payload.spec.layers[0].paint["fill-color"]).toBe("#ff6b6b");
  });

  it("uses explicit dataProperty in generated expressions", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: {
            description: "Show choropleth map of regions",
            dataProperty: "income",
          },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: { layers: Array<{ id: string; paint: Record<string, unknown> }> };
    };

    const fillLayer = payload.spec.layers.find((l) => l.id === "choropleth-fill");
    expect(fillLayer).toBeDefined();
    const fillColor = fillLayer!.paint["fill-color"] as unknown[];
    const getExpr = fillColor[2] as unknown[];
    expect(getExpr[1]).toBe("income");
  });

  it("detects Chinese province location from description", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "generate_spec",
        arguments: {
          intent: { description: "北京市人口分布" },
        },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      spec: { view: { center: [number, number]; zoom: number } };
    };

    expect(payload.spec.view.center[0]).toBeCloseTo(116.4074, 0);
    expect(payload.spec.view.center[1]).toBeCloseTo(39.9042, 0);
    expect(payload.spec.view.zoom).toBe(10);
  });
});
