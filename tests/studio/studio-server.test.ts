import { describe, expect, it } from "vitest";
import * as engine from "@gis-engine/engine";
import {
  applyLegacyIntent,
  buildBasemapCommands,
  createInitialSpec,
  publicBasemapOptions,
  statePayload
} from "../../apps/studio/server/index.mjs";

function layerById(spec: ReturnType<typeof createInitialSpec>, layerId: string) {
  return spec.layers.find((layer: { id: string }) => layer.id === layerId);
}

describe("AI Map Studio server state", () => {
  it("serves a policy-safe default style without remote basemap diagnostics", () => {
    const payload = statePayload(engine, "ready", createInitialSpec());

    expect(payload.status).toBe("ready");
    expect(payload.style).toMatchObject({
      version: 8,
      sources: expect.objectContaining({ points: expect.objectContaining({ type: "geojson" }) }),
      layers: expect.arrayContaining([expect.objectContaining({ id: "basemap-background", type: "background" })])
    });
    expect(payload.spec.sources).not.toHaveProperty("basemap");
    expect(payload.diagnostics).toEqual([]);
  });

  it("exposes OSM, ArcGIS, and Bing basemap options", () => {
    const options = publicBasemapOptions();

    expect(options.map((option) => option.id)).toEqual(["none", "osm", "arcgis-imagery", "bing-aerial"]);
    expect(options.find((option) => option.id === "osm")).toMatchObject({ enabled: true });
    expect(options.find((option) => option.id === "arcgis-imagery")).toMatchObject({ enabled: true });

    const bing = options.find((option) => option.id === "bing-aerial");
    if (process.env.BING_MAPS_KEY?.trim()) {
      expect(bing).toMatchObject({ enabled: true });
    } else {
      expect(bing).toMatchObject({ enabled: false, missingCredential: "BING_MAPS_KEY" });
    }
  });

  it("keeps remote basemap sources behind policy-safe Studio proxy URLs", () => {
    for (const [basemapId, tilePath] of [
      ["osm", "/api/tiles/osm/{z}/{x}/{y}.png"],
      ["arcgis-imagery", "/api/tiles/arcgis-imagery/{z}/{x}/{y}.jpg"],
    ] as const) {
      const payload = statePayload(engine, "ready", createInitialSpec(basemapId));

      expect(payload.diagnostics).toEqual([]);
      expect(payload.style?.sources).toMatchObject({
        basemap: expect.objectContaining({ tiles: [tilePath] })
      });
    }
  });

  it("applies simple style edits through schema-shaped commands", () => {
    const result = applyLegacyIntent(engine, "make points red", createInitialSpec());

    expect(result.status).toBe("applied");
    expect(result.evidence).toMatchObject({ commandCount: 1, committed: true, rolledBack: false, failed: false });
    expect(layerById(result.nextSpec, "points-layer")?.paint).toMatchObject({ "circle-color": "#ef4444" });
    expect(result.diagnostics).toEqual([]);
  });

  it("builds basemap commands with current command schema fields", () => {
    const commands = buildBasemapCommands("osm", createInitialSpec());

    const addSource = commands.find((command: { type: string }) => command.type === "addSource");
    expect(addSource).toMatchObject({
      id: "studio-basemap-add-source",
      version: "0.1",
      type: "addSource",
      sourceId: "basemap",
      source: expect.objectContaining({ tiles: ["/api/tiles/osm/{z}/{x}/{y}.png"] })
    });
    expect(addSource?.source).not.toHaveProperty("id");

    const addLayer = commands.find((command: { type: string }) => command.type === "addLayer");
    expect(addLayer).toMatchObject({
      id: "studio-basemap-add-raster-layer",
      version: "0.1",
      beforeLayerId: "points-layer"
    });
    expect(addLayer).not.toHaveProperty("beforeId");
  });

  it("applies OSM and ArcGIS basemaps without resource-policy rollback", () => {
    for (const [message, expectedTilePath] of [
      ["switch to osm basemap", "/api/tiles/osm/{z}/{x}/{y}.png"],
      ["switch to arcgis basemap", "/api/tiles/arcgis-imagery/{z}/{x}/{y}.jpg"],
    ] as const) {
      const result = applyLegacyIntent(engine, message, createInitialSpec());
      const payload = statePayload(engine, result.status, result.nextSpec);

      expect(result.status).toBe("applied");
      expect(result.evidence).toMatchObject({ committed: true, rolledBack: false, failed: false });
      expect(payload.diagnostics).toEqual([]);
      expect(payload.style?.sources).toMatchObject({
        basemap: expect.objectContaining({ tiles: [expectedTilePath] })
      });
    }
  });

  it("surfaces a structured diagnostic when Bing is selected without a server key", () => {
    const result = applyLegacyIntent(engine, "switch to bing basemap", createInitialSpec());

    if (process.env.BING_MAPS_KEY?.trim()) {
      expect(result.status).toBe("applied");
      return;
    }

    expect(result.status).toBe("blocked");
    expect(result.evidence).toMatchObject({ commandCount: 0, committed: false, failed: false });
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "STUDIO.BASEMAP_CREDENTIAL_REQUIRED",
        severity: "error",
        path: "/basemap"
      })
    ]);
  });
});
