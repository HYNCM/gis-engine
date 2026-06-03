import { describe, expect, it } from "vitest";
import * as engine from "@gis-engine/engine";
import {
  applyProviderCommands,
  applyLegacyIntent,
  buildSavedMapHandoff,
  buildBasemapCommands,
  buildProviders,
  createInitialSpec,
  detectBasemapFromSpec,
  parseMapRoute,
  publicProviderProfiles,
  publicBasemapOptions,
  savedWorkspaceHandoffStatus,
  statePayload
} from "../../apps/studio/server/index.mjs";
import { appendAuditRecord } from "../../apps/studio/server/audit.mjs";
import { createReviewDecision } from "../../apps/studio/server/review-decisions.mjs";

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

  it("keeps provider public metadata credential- and URL-free", () => {
    const profiles = buildProviders({
      DEEPSEEK_API_KEY: "sk-secret-provider-key",
      DEEPSEEK_BASE_URL: "https://secret-provider.example",
      DEEPSEEK_MODEL: "deepseek-test-model"
    });
    const publicProfiles = publicProviderProfiles(profiles);

    expect(publicProfiles.find((profile: { id: string }) => profile.id === "deepseek")).toMatchObject({
      id: "deepseek",
      label: "DeepSeek",
      protocol: "openai-chat-completions",
      model: "deepseek-test-model",
      enabled: true,
      missingCredential: false
    });
    const serialized = JSON.stringify(publicProfiles);
    expect(serialized).not.toContain("sk-secret-provider-key");
    expect(serialized).not.toContain("secret-provider.example");
    expect(serialized).not.toContain("DEEPSEEK_API_KEY");
    expect(serialized).not.toContain("baseUrl");
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

  it("applies layer filters and zoom ranges through schema-shaped commands", () => {
    const filtered = applyLegacyIntent(engine, "show only landmarks", createInitialSpec());

    expect(filtered.status).toBe("applied");
    expect(filtered.evidence).toMatchObject({ commandCount: 1, committed: true, rolledBack: false, failed: false });
    expect(layerById(filtered.nextSpec, "points-layer")?.filter).toEqual(["==", ["get", "category"], "landmark"]);
    expect(statePayload(engine, filtered.status, filtered.nextSpec).style?.layers.find((layer: { id: string }) => layer.id === "points-layer")).toMatchObject({
      filter: ["==", ["get", "category"], "landmark"]
    });

    const ranged = applyLegacyIntent(engine, "make points visible above zoom 12", filtered.nextSpec);
    expect(ranged.status).toBe("applied");
    expect(layerById(ranged.nextSpec, "points-layer")).toMatchObject({ minzoom: 12, maxzoom: 24 });
  });

  it("fits the current demo points into view through fitBounds commands", () => {
    const result = applyLegacyIntent(engine, "show all points", createInitialSpec());

    expect(result.status).toBe("applied");
    expect(result.nextSpec.view).toMatchObject({ bounds: [120.145, 30.245, 120.172, 30.274] });
    expect(statePayload(engine, result.status, result.nextSpec).summary).toMatchObject({
      center: null,
      zoom: null,
      bounds: [120.145, 30.245, 120.172, 30.274]
    });
  });

  it("accepts provider setFilter and setLayerZoomRange actions", () => {
    const filtered = applyProviderCommands(engine, {
      action: "setFilter",
      layerId: "points-layer",
      filter: ["==", ["get", "category"], "museum"]
    }, createInitialSpec());

    expect(filtered.status).toBe("applied");
    expect(layerById(filtered.nextSpec, "points-layer")?.filter).toEqual(["==", ["get", "category"], "museum"]);

    const ranged = applyProviderCommands(engine, {
      action: "setLayerZoomRange",
      layerId: "points-layer",
      minzoom: 8,
      maxzoom: 16
    }, filtered.nextSpec);

    expect(ranged.status).toBe("applied");
    expect(layerById(ranged.nextSpec, "points-layer")).toMatchObject({ minzoom: 8, maxzoom: 16 });
  });

  it("accepts provider fitBounds actions", () => {
    const fit = applyProviderCommands(engine, {
      action: "fitBounds",
      bounds: [120.145, 30.245, 120.172, 30.274]
    }, createInitialSpec());

    expect(fit.status).toBe("applied");
    expect(fit.nextSpec.view).toMatchObject({ bounds: [120.145, 30.245, 120.172, 30.274] });
  });

  it("accepts provider reorderLayer actions and layout visibility objects", () => {
    const spec = {
      ...createInitialSpec(),
      layers: [
        ...createInitialSpec().layers,
        {
          id: "labels-layer",
          type: "symbol-lite",
          source: "points",
          layout: { visibility: "visible" }
        }
      ]
    };

    const hidden = applyProviderCommands(engine, {
      action: "setLayout",
      layerId: "labels-layer",
      layout: { visibility: "none" }
    }, spec);

    expect(hidden.status).toBe("applied");
    expect(layerById(hidden.nextSpec, "labels-layer")?.layout).toMatchObject({ visibility: "none" });

    const reordered = applyProviderCommands(engine, {
      action: "reorderLayer",
      layerId: "points-layer"
    }, hidden.nextSpec);

    expect(reordered.status).toBe("applied");
    expect(reordered.nextSpec.layers.map((layer: { id: string }) => layer.id)).toEqual([
      "basemap-background",
      "labels-layer",
      "points-layer"
    ]);
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

  it("parses saved map item and load routes without overlap", () => {
    expect(parseMapRoute("/api/maps/demo-map")).toEqual({
      action: "item",
      mapId: "demo-map",
    });
    expect(parseMapRoute("/api/maps/demo-map/handoff")).toEqual({
      action: "handoff",
      mapId: "demo-map",
    });
    expect(parseMapRoute("/api/maps/demo-map/load")).toEqual({
      action: "load",
      mapId: "demo-map",
    });
  });

  it("detects the active basemap from saved Studio specs", () => {
    expect(detectBasemapFromSpec(createInitialSpec("none"))).toBe("none");
    expect(detectBasemapFromSpec(createInitialSpec("osm"))).toBe("osm");
    expect(detectBasemapFromSpec(createInitialSpec("arcgis-imagery"))).toBe(
      "arcgis-imagery",
    );
  });

  it("derives handoff status from the latest review decision", () => {
    expect(savedWorkspaceHandoffStatus([])).toBe("needs-review");
    expect(
      savedWorkspaceHandoffStatus([{ outcome: "accepted" }]),
    ).toBe("accepted");
    expect(
      savedWorkspaceHandoffStatus([
        { outcome: "accepted" },
        { outcome: "follow-up-required" },
      ]),
    ).toBe("follow-up-required");
  });

  it("builds a compact Studio local handoff envelope", () => {
    const spec = createInitialSpec("osm");
    const handoff = buildSavedMapHandoff({
      id: "map-1",
      name: "Studio Handoff",
      revision: "4",
      basemapId: "osm",
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-03T00:05:00Z",
      spec,
      auditRecords: [
        {
          id: "studio.test.1",
          sessionId: "studio.test",
          status: "applied",
          providerId: "mock-ai",
          commandCount: 2,
          diagnosticCounts: { error: 0, warning: 0, info: 0 },
          fromRevision: "3",
          toRevision: "4",
        },
      ],
      reviewDecisions: [
        {
          decisionId: "review-1",
          outcome: "accepted",
          reasonCodes: ["review-accepted"],
        },
      ],
    });

    expect(handoff).toMatchObject({
      handoffVersion: "studio.local-handoff.v1",
      workspace: {
        mapId: "map-1",
        name: "Studio Handoff",
        revision: "4",
        basemapId: "osm",
        sourceCount: 2,
        layerCount: 2,
      },
      handoff: {
        status: "accepted",
        latestReviewDecisionId: "review-1",
        latestReviewOutcome: "accepted",
        reasonCodes: ["review-accepted"],
      },
      evidence: {
        auditRecordCount: 1,
        reviewDecisionCount: 1,
      },
    });
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

  it("blocks known MapLibre capabilities that do not have a command contract yet", () => {
    const result = applyProviderCommands(engine, {
      action: "unsupported",
      message: "Terrain needs a command contract."
    }, createInitialSpec());

    expect(result.status).toBe("blocked");
    expect(result.evidence).toMatchObject({ commandCount: 0, committed: false });
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "STUDIO.MAPLIBRE_CAPABILITY_UNSUPPORTED",
        path: "/providerOutput/action",
        message: "Terrain needs a command contract."
      })
    ]);
  });

  it("creates compact Studio audit records for command evidence", () => {
    const records: unknown[] = [];
    const record = appendAuditRecord(records, {
      sessionId: "studio.test",
      status: "applied",
      providerId: "mock-ai",
      promptHash: "sha256:studio-test",
      traceId: "trace-studio-test",
      commandCount: 1,
      diagnostics: [],
      fromRevision: "1",
      toRevision: "2"
    });

    expect(records).toHaveLength(1);
    expect(record).toMatchObject({
      recordVersion: "studio.audit.v1",
      status: "applied",
      providerId: "mock-ai",
      commandCount: 1,
      fromRevision: "1",
      toRevision: "2"
    });
    const serialized = JSON.stringify(record);
    expect(serialized).not.toMatch(/make points red|West Lake|MapSpec|commandBody|patch|baseUrl|apiKey/i);
  });

  it("records Studio review decisions without mutating map state", () => {
    const auditRecord = appendAuditRecord([], {
      sessionId: "studio.test",
      status: "applied",
      providerId: "mock-ai",
      promptHash: "sha256:studio-test",
      traceId: "trace-studio-test",
      commandCount: 1,
      diagnostics: [],
      fromRevision: "1",
      toRevision: "2"
    });

    const review = createReviewDecision({
      request: { outcome: "accepted", reasonCodes: ["review-accepted"] },
      evidence: auditRecord,
      principal: { role: "reviewer", projectIds: ["project_studio"] },
      projectId: "project_studio",
      decisionId: "review-1",
      createdAt: "2026-06-03T00:00:00Z"
    });

    expect(review.ok).toBe(true);
    if (!review.ok) throw new Error("Expected review decision to be accepted.");
    expect(review.decision).toMatchObject({
      recordVersion: "studio.review.v1",
      outcome: "accepted",
      auditRecordId: auditRecord.id,
      providerId: "mock-ai",
      commandEvidence: expect.objectContaining({ commandCount: 1, committed: true })
    });
    expect(JSON.stringify(review.decision)).not.toMatch(/MapSpec|commandBody|patch|rawPrompt|West Lake/i);
  });

  it("blocks Studio review decisions that attempt direct map mutation", () => {
    const auditRecord = appendAuditRecord([], {
      sessionId: "studio.test",
      status: "applied",
      providerId: "mock-ai",
      commandCount: 1,
      diagnostics: [],
      fromRevision: "1",
      toRevision: "2"
    });

    const review = createReviewDecision({
      request: {
        outcome: "blocked",
        reasonCodes: ["manual-review-blocked"],
        rawPrompt: "make points red",
        commands: [{ type: "setPaint" }],
        spec: { id: "unsafe" }
      },
      evidence: auditRecord,
      principal: { role: "reviewer", projectIds: ["project_studio"] },
      projectId: "project_studio",
      decisionId: "review-1",
      createdAt: "2026-06-03T00:00:00Z"
    });

    expect(review.ok).toBe(false);
    expect(review.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "STUDIO.REVIEW_CONTRACT_VIOLATION",
        path: "/reviewAction/commandSafety"
      })
    );
    expect(JSON.stringify(review)).not.toContain("make points red");
  });
});
