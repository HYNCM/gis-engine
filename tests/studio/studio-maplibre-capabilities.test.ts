import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildMapLibreCapabilityPrompt,
  MAPLIBRE_CAPABILITY_REGISTRY,
} from "../../apps/studio/server/maplibre-capabilities.mjs";
import { callOpenAiCompatibleProvider } from "../../apps/studio/server/provider.mjs";

const rootDir = fileURLToPath(new URL("../..", import.meta.url));

describe("Studio MapLibre capability registry", () => {
  it("tracks the installed MapLibre package version and broad renderer surface", () => {
    const packageJson = JSON.parse(readFileSync(join(rootDir, "node_modules/maplibre-gl/package.json"), "utf8"));
    const registry = MAPLIBRE_CAPABILITY_REGISTRY;

    expect(registry.packageVersion).toBe(packageJson.version);
    expect(registry.styleSpec.rootProperties).toEqual(
      expect.arrayContaining(["sources", "layers", "terrain", "projection", "sky", "light"]),
    );
    expect(registry.styleSpec.sourceTypes).toEqual(
      expect.arrayContaining(["vector", "raster", "raster-dem", "geojson", "video", "image"]),
    );
    expect(registry.styleSpec.runtimeSourceTypes).toContain("canvas");
    expect(registry.styleSpec.layerTypes).toEqual(
      expect.arrayContaining(["heatmap", "fill-extrusion", "hillshade", "color-relief"]),
    );
    expect(registry.styleSpec.runtimeLayerTypes).toContain("custom");
    expect(registry.styleSpec.expressionOperators).toEqual(
      expect.arrayContaining(["global-state", "feature-state", "elevation", "within", "split", "join"]),
    );
    expect(registry.styleSpec.expressionOperators).toHaveLength(87);
  });

  it("describes every AI-facing MapLibre capability group with invocation status", () => {
    const registry = MAPLIBRE_CAPABILITY_REGISTRY;

    expect(registry.groups.map((group) => group.id)).toEqual([
      "style-document",
      "sources",
      "layers",
      "expressions",
      "camera",
      "interaction-controls",
      "query-state",
      "terrain-projection-3d",
      "overlays-assets",
      "events-lifecycle",
      "performance-network",
    ]);
    for (const group of registry.groups) {
      expect(group.naturalLanguage.length).toBeGreaterThan(0);
      expect(group.aiInvocation.status).toMatch(/implemented|not-yet-commanded/);
    }
  });

  it("builds a compact prompt that tells providers what is known versus commanded", () => {
    const prompt = buildMapLibreCapabilityPrompt();

    expect(prompt).toContain("MapLibre GL JS package: 5.24.0");
    expect(prompt).toContain("Expression operators (87)");
    expect(prompt).toContain("terrain-projection-3d");
    expect(prompt).toContain("not-yet-commanded");
    expect(prompt).toContain("do not invent browser-side mutations");
  });

  it("injects the capability registry into provider prompts", async () => {
    let requestBody: { messages?: Array<{ role: string; content: string }> } | undefined;
    const fetchImpl = async (_url: string, init: { body?: string }) => {
      requestBody = JSON.parse(init.body || "{}");
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({ action: "unsupported", message: "Terrain needs a command contract." }),
              },
            },
          ],
        }),
      };
    };

    const result = await callOpenAiCompatibleProvider({
      profile: { id: "fixture-provider", baseUrl: "https://example.invalid", model: "fixture-model" },
      apiKey: "sk-test",
      message: "turn on terrain",
      summary: { sources: [], layers: 0, layerIds: [], view: {} },
      capabilityPrompt: buildMapLibreCapabilityPrompt(),
      fetchImpl,
    });

    expect(requestBody?.messages?.[0]?.content).toContain("MapLibre Capability Context");
    expect(requestBody?.messages?.[0]?.content).toContain("terrain-projection-3d");
    expect(result).toMatchObject({
      ok: true,
      providerOutput: {
        action: "unsupported",
        message: "Terrain needs a command contract.",
      },
    });
  });

  it("normalizes provider filter and layer zoom-range outputs", async () => {
    const fetchImpl = async (_url: string, init: { body?: string }) => {
      const requestBody = JSON.parse(init.body || "{}");
      expect(requestBody.messages?.[0]?.content).toContain("setFilter");
      expect(requestBody.messages?.[0]?.content).toContain("setLayerZoomRange");
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "setFilter",
                  layerId: "points-layer",
                  filter: ["==", ["get", "category"], "museum"],
                  minzoom: 8,
                  maxzoom: 16,
                  confidence: { score: 0.9 },
                }),
              },
            },
          ],
        }),
      };
    };

    const result = await callOpenAiCompatibleProvider({
      profile: { id: "fixture-provider", baseUrl: "https://example.invalid", model: "fixture-model" },
      apiKey: "sk-test",
      message: "show only museums between zoom 8 and 16",
      summary: {
        sources: ["points"],
        layers: 1,
        layerIds: ["points-layer"],
        sourceProperties: { points: ["category", "name"] },
        view: {},
      },
      capabilityPrompt: buildMapLibreCapabilityPrompt(),
      fetchImpl,
    });

    expect(result).toMatchObject({
      ok: true,
      providerOutput: {
        action: "setFilter",
        layerId: "points-layer",
        filter: ["==", ["get", "category"], "museum"],
        minzoom: 8,
        maxzoom: 16,
        confidence: { score: 0.9, level: "high" },
      },
    });
  });

  it("normalizes provider layout and reorder outputs", async () => {
    const fetchImpl = async (_url: string, init: { body?: string }) => {
      const requestBody = JSON.parse(init.body || "{}");
      expect(requestBody.messages?.[0]?.content).toContain("setLayout");
      expect(requestBody.messages?.[0]?.content).toContain("reorderLayer");
      expect(requestBody.messages?.[0]?.content).toContain("beforeLayerId");
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "reorderLayer",
                  layerId: "labels-layer",
                  beforeLayerId: "points-layer",
                  layout: { visibility: "none" },
                  confidence: { score: 0.8 },
                }),
              },
            },
          ],
        }),
      };
    };

    const result = await callOpenAiCompatibleProvider({
      profile: { id: "fixture-provider", baseUrl: "https://example.invalid", model: "fixture-model" },
      apiKey: "sk-test",
      message: "hide labels and move them behind points",
      summary: {
        sources: ["points"],
        layers: 2,
        layerIds: ["points-layer", "labels-layer"],
        layerDetails: [
          { id: "points-layer", type: "circle", source: "points" },
          { id: "labels-layer", type: "symbol-lite", source: "points", minzoom: 10 },
        ],
        sourceProperties: { points: ["category", "name"] },
        view: {},
      },
      capabilityPrompt: buildMapLibreCapabilityPrompt(),
      fetchImpl,
    });

    expect(result).toMatchObject({
      ok: true,
      providerOutput: {
        action: "reorderLayer",
        layerId: "labels-layer",
        beforeLayerId: "points-layer",
        layout: { visibility: "none" },
        confidence: { score: 0.8, level: "high" },
      },
    });
  });

  it("normalizes provider fitBounds outputs", async () => {
    const fetchImpl = async (_url: string, init: { body?: string }) => {
      const requestBody = JSON.parse(init.body || "{}");
      expect(requestBody.messages?.[0]?.content).toContain("fitBounds");
      expect(requestBody.messages?.[0]?.content).toContain("[west, south, east, north]");
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "fitBounds",
                  bounds: [120.145, 30.245, 120.172, 30.274],
                  confidence: { score: 0.88 },
                }),
              },
            },
          ],
        }),
      };
    };

    const result = await callOpenAiCompatibleProvider({
      profile: { id: "fixture-provider", baseUrl: "https://example.invalid", model: "fixture-model" },
      apiKey: "sk-test",
      message: "show all points",
      summary: {
        sources: ["points"],
        layers: 1,
        layerIds: ["points-layer"],
        sourceProperties: { points: ["category", "name"] },
        view: {},
      },
      capabilityPrompt: buildMapLibreCapabilityPrompt(),
      fetchImpl,
    });

    expect(result).toMatchObject({
      ok: true,
      providerOutput: {
        action: "fitBounds",
        bounds: [120.145, 30.245, 120.172, 30.274],
        confidence: { score: 0.88, level: "high" },
      },
    });
  });
});
