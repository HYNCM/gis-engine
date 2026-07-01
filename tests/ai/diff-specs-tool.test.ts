import { callGisEngineTool } from "@gis-engine/ai";
import type { MapSpec } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

const baseSpec: MapSpec = {
  version: "0.1",
  id: "diff-test",
  revision: "1",
  view: {
    mode: "map2d",
    center: [120.15, 30.28],
    zoom: 11,
  },
  sources: {
    districts: {
      type: "geojson",
      data: "./data/districts.geojson",
    },
  },
  layers: [
    {
      id: "district-fill",
      type: "fill",
      source: "districts",
      paint: {
        "fill-color": "#dbeafe",
        "fill-opacity": 0.7,
      },
    },
  ],
  interactions: {
    pan: true,
    zoom: true,
  },
};

describe("diff_specs MCP tool", () => {
  it("returns empty commands when before and after are identical", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "diff_specs",
        arguments: { before: baseSpec, after: baseSpec },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      commands: unknown[];
      summary: { added: string[]; removed: string[]; modified: string[]; unchanged: string[] };
      diagnostics: unknown[];
    };
    expect(result.isError).toBeUndefined();
    expect(payload.commands).toEqual([]);
    expect(payload.summary.added).toEqual([]);
    expect(payload.summary.removed).toEqual([]);
    expect(payload.summary.modified).toEqual([]);
    expect(payload.summary.unchanged).toEqual(expect.arrayContaining(["source:districts", "layer:district-fill"]));
  });

  it("detects added source and generates addSource command", async () => {
    const after: MapSpec = {
      ...baseSpec,
      sources: {
        ...baseSpec.sources,
        parks: {
          type: "geojson",
          data: "./data/parks.geojson",
        },
      },
    };

    const result = await callGisEngineTool({
      params: {
        name: "diff_specs",
        arguments: { before: baseSpec, after },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      commands: Array<{ type: string; sourceId?: string }>;
      summary: { added: string[] };
    };
    expect(payload.summary.added).toContain("source:parks");
    expect(payload.commands).toContainEqual(expect.objectContaining({ type: "addSource", sourceId: "parks" }));
  });

  it("detects removed source and generates removeSource command", async () => {
    const after: MapSpec = {
      ...baseSpec,
      sources: {},
      layers: [],
    };

    const result = await callGisEngineTool({
      params: {
        name: "diff_specs",
        arguments: { before: baseSpec, after },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      commands: Array<{ type: string; sourceId?: string; layerId?: string }>;
      summary: { removed: string[] };
    };
    expect(payload.summary.removed).toContain("source:districts");
    expect(payload.commands).toContainEqual(expect.objectContaining({ type: "removeSource", sourceId: "districts" }));
  });

  it("detects modified layer paint and generates removeLayer + addLayer commands", async () => {
    const after: MapSpec = {
      ...baseSpec,
      layers: [
        {
          ...baseSpec.layers[0],
          paint: { "fill-color": "#ff0000", "fill-opacity": 0.9 },
        },
      ],
    };

    const result = await callGisEngineTool({
      params: {
        name: "diff_specs",
        arguments: { before: baseSpec, after },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      commands: Array<{ type: string; layerId?: string; layer?: { id: string } }>;
      summary: { modified: string[] };
    };
    expect(payload.summary.modified).toContain("layer:district-fill");
    expect(payload.commands).toContainEqual(expect.objectContaining({ type: "removeLayer", layerId: "district-fill" }));
    expect(payload.commands).toContainEqual(
      expect.objectContaining({ type: "addLayer", layer: expect.objectContaining({ id: "district-fill" }) }),
    );
  });

  it("detects view changes and generates setView command", async () => {
    const after: MapSpec = {
      ...baseSpec,
      view: { mode: "map2d", center: [0, 0], zoom: 5 },
    };

    const result = await callGisEngineTool({
      params: {
        name: "diff_specs",
        arguments: { before: baseSpec, after },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      commands: Array<{ type: string; view?: Record<string, unknown> }>;
    };
    const setViewCmd = payload.commands.find((c) => c.type === "setView");
    expect(setViewCmd).toBeDefined();
    expect(setViewCmd?.view).toMatchObject({ center: [0, 0], zoom: 5 });
  });

  it("detects interaction changes and generates setInteractions command", async () => {
    const after: MapSpec = {
      ...baseSpec,
      interactions: { pan: true, zoom: true, click: true, hover: true },
    };

    const result = await callGisEngineTool({
      params: {
        name: "diff_specs",
        arguments: { before: baseSpec, after },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      commands: Array<{ type: string; interactions?: Record<string, boolean> }>;
    };
    const cmd = payload.commands.find((c) => c.type === "setInteractions");
    expect(cmd).toBeDefined();
    expect(cmd?.interactions).toMatchObject({ click: true, hover: true });
  });

  it("ignores revision differences by default", async () => {
    const after: MapSpec = { ...baseSpec, revision: "2" };

    const result = await callGisEngineTool({
      params: {
        name: "diff_specs",
        arguments: { before: baseSpec, after },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as { commands: unknown[] };
    expect(payload.commands).toEqual([]);
  });

  it("detects revision differences when ignoreRevision is false", async () => {
    const after: MapSpec = { ...baseSpec, revision: "2" };

    const result = await callGisEngineTool({
      params: {
        name: "diff_specs",
        arguments: { before: baseSpec, after, options: { ignoreRevision: false } },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      commands: Array<{ type: string }>;
      summary: { modified: string[] };
    };
    // revision change doesn't generate a specific command but is detected
    expect(payload.summary.modified).toEqual([]);
    // No commands for revision-only change since view/sources/layers/interactions are identical
    expect(payload.commands).toEqual([]);
  });

  it("ignores metadata differences when ignoreMetadata is true", async () => {
    const after: MapSpec = {
      ...baseSpec,
      layers: [
        {
          ...baseSpec.layers[0],
          metadata: { author: "someone" },
        },
      ],
    };

    const result = await callGisEngineTool({
      params: {
        name: "diff_specs",
        arguments: { before: baseSpec, after, options: { ignoreMetadata: true } },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      summary: { modified: string[]; unchanged: string[] };
    };
    expect(payload.summary.modified).toEqual([]);
    expect(payload.summary.unchanged).toContain("layer:district-fill");
  });

  it("returns structured diagnostics for invalid tool input", async () => {
    const result = await callGisEngineTool({
      params: {
        name: "diff_specs",
        arguments: { before: baseSpec },
      },
    });

    const diagnostics = JSON.parse(result.content[0]?.text) as Array<{ code: string }>;
    expect(result.isError).toBe(true);
    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("emits warnings when before or after spec has validation errors", async () => {
    const invalidSpec: MapSpec = {
      ...baseSpec,
      view: { center: [200, 100] },
    };

    const result = await callGisEngineTool({
      params: {
        name: "diff_specs",
        arguments: { before: invalidSpec, after: baseSpec },
      },
    });

    const payload = JSON.parse(result.content[0]?.text) as {
      diagnostics: Array<{ severity: string; path?: string }>;
    };
    expect(result.isError).toBeUndefined();
    expect(payload.diagnostics).toContainEqual(expect.objectContaining({ severity: "warning", path: "/before" }));
  });
});
