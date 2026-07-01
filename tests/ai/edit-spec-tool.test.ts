import { editSpecTool } from "@gis-engine/ai";
import type { MapSpec } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

function baseSpec(): MapSpec {
  return {
    version: "0.1",
    id: "test-spec",
    revision: "1",
    view: {
      mode: "map2d",
      center: [120.15, 30.28],
      zoom: 11,
    },
    sources: {
      cities: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.15, 30.28] },
              properties: { name: "Hangzhou", population: 10000000 },
            },
          ],
        },
      },
    },
    layers: [
      {
        id: "city-points",
        type: "circle",
        source: "cities",
        paint: {
          "circle-color": "#ff0000",
          "circle-radius": 5,
        },
      },
    ],
  };
}

describe("edit_spec MCP tool", () => {
  it("adds a layer by instruction", () => {
    const result = editSpecTool({
      spec: baseSpec(),
      instruction: "add fill layer parks for source cities",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.spec.layers).toHaveLength(2);
      expect(result.result.spec.layers[1]?.id).toBe("parks");
      expect(result.result.spec.layers[1]?.type).toBe("fill");
      expect(result.result.commands).toHaveLength(1);
    }
  });

  it("changes fill color", () => {
    const result = editSpecTool({
      spec: baseSpec(),
      instruction: 'set city-points fill-color to "#00ff00"',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.summary).toContain("city-points");
      expect(result.result.commands[0]?.type).toBe("setPaint");
    }
  });

  it("removes a layer", () => {
    const result = editSpecTool({
      spec: baseSpec(),
      instruction: "remove layer city-points",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.spec.layers).toHaveLength(0);
      expect(result.result.summary).toContain("Removed");
    }
  });

  it("sets view center", () => {
    const result = editSpecTool({
      spec: baseSpec(),
      instruction: "set center to [116.4, 39.9]",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.spec.view.center).toEqual([116.4, 39.9]);
      expect(result.result.summary).toContain("center");
    }
  });

  it("sets zoom level", () => {
    const result = editSpecTool({
      spec: baseSpec(),
      instruction: "set zoom to 8",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.spec.view.zoom).toBe(8);
      expect(result.result.summary).toContain("zoom");
    }
  });

  it("adds filter to layer", () => {
    const result = editSpecTool({
      spec: baseSpec(),
      instruction: "filter city-points where type equals city",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.commands[0]?.type).toBe("setFilter");
      expect(result.result.summary).toContain("filter");
    }
  });

  it("returns error for unparseable instruction", () => {
    const result = editSpecTool({
      spec: baseSpec(),
      instruction: "do something magical",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics[0]?.message).toContain("Could not parse instruction");
    }
  });

  it("validates result spec", () => {
    const result = editSpecTool({
      spec: baseSpec(),
      instruction: "set zoom to 5",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.diagnostics).toBeDefined();
      expect(Array.isArray(result.result.diagnostics)).toBe(true);
    }
  });

  it("returns commands and summary", () => {
    const result = editSpecTool({
      spec: baseSpec(),
      instruction: "delete city-points",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.commands.length).toBeGreaterThan(0);
      expect(typeof result.result.summary).toBe("string");
      expect(result.result.summary.length).toBeGreaterThan(0);
    }
  });

  it("handles rename source instruction", () => {
    const result = editSpecTool({
      spec: baseSpec(),
      instruction: "rename source cities to places",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.spec.sources.places).toBeDefined();
      expect(result.result.spec.sources.cities).toBeUndefined();
      expect(result.result.summary).toContain("Renamed");
    }
  });

  it("adds circle layer with default source", () => {
    const result = editSpecTool({
      spec: baseSpec(),
      instruction: "add a circle layer markers for source cities",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const newLayer = result.result.spec.layers.find((layer) => layer.id === "markers");
      expect(newLayer).toBeDefined();
      expect(newLayer?.type).toBe("circle");
    }
  });

  it("sets layout property", () => {
    const result = editSpecTool({
      spec: baseSpec(),
      instruction: 'set city-points visibility to none',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.commands[0]?.type).toBe("setLayout");
    }
  });
});
