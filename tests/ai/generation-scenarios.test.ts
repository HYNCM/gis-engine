import { createGenerationEvidenceBundle } from "@gis-engine/ai";
import {
  type ApplyCommandsResult,
  applyCommands,
  applyJsonPatch,
  createMapGenerationCommandSkeleton,
  type MapSpec,
} from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

describe("minimum natural-language generation scenarios", () => {
  it("covers feature-display source, layer, style, dry-run, replay, and rollback evidence", async () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "nla-feature-display",
      promptHash: "sha256:nla-feature-display",
      traceId: "trace-nla-feature-display",
      targetDomains: ["feature-display"],
      view: {
        center: [120.15, 30.28],
        zoom: 10,
      },
      sources: {
        districts: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        },
      },
      layers: [
        {
          id: "district-fill",
          type: "fill",
          source: "districts",
          paint: {
            "fill-color": "#22c55e",
          },
        },
        {
          id: "district-outline",
          type: "line",
          source: "districts",
          paint: {
            "line-color": "#14532d",
            "line-width": 1.5,
          },
        },
      ],
      styleEdits: [
        {
          layerId: "district-fill",
          paint: {
            "fill-opacity": 0.45,
          },
          layout: {
            visibility: "visible",
          },
        },
      ],
    });

    const applied = applyCommands(skeleton.baseSpec, skeleton.commands, {
      collectTrace: true,
      traceId: "trace-nla-feature-display",
    });
    const dryRun = applyCommands(skeleton.baseSpec, skeleton.commands, {
      dryRun: true,
      traceId: "trace-nla-feature-display-dry-run",
    });
    const rolledBack = rollbackAppliedCommands(applied);
    const evidence = await createGenerationEvidenceBundle({
      promptHash: "sha256:nla-feature-display",
      skeleton,
      snapshot: {
        renderer: "maplibre",
        options: {
          width: 320,
          height: 180,
          format: "data-url",
          targetLayers: ["district-fill", "district-outline"],
        },
      },
      exampleId: "ai-map-edit",
    });

    expect(skeleton.status).toBe("ready");
    expect(skeleton.commands.map((command) => command.type)).toEqual([
      "setView",
      "addSource",
      "addLayer",
      "addLayer",
      "setPaint",
      "setLayout",
    ]);
    expect(applied.spec).toEqual(skeleton.spec);
    expect(applied.results.every((result) => result.status === "applied")).toBe(true);
    expect(applied.traces?.map((trace) => trace.commandId)).toEqual(skeleton.commands.map((command) => command.id));
    expect(dryRun.spec).toEqual(skeleton.baseSpec);
    expect(dryRun.results.every((result) => result.patch && result.inversePatch)).toBe(true);
    expect(rolledBack).toEqual(skeleton.baseSpec);
    expect(evidence.ok).toBe(true);
    if (!evidence.ok) throw new Error("Expected feature-display generation evidence.");
    expect(evidence.result.status).toBe("ready");
    expect(evidence.result.commandEvidence.changedPaths).toEqual(
      expect.arrayContaining(["/sources/districts", "/layers/0", "/layers/1", "/view", "/revision"]),
    );
    expect(evidence.result.snapshotEvidence.passed).toBe(true);
    expect(evidence.result.exportEvidence).toMatchObject({
      ready: true,
      sourceCount: 1,
      layerCount: 2,
    });
  });

  it("covers spatial-analysis point/bbox readiness and blocked geoprocessing diagnostics", async () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "nla-spatial-readiness",
      promptHash: "sha256:nla-spatial-readiness",
      traceId: "trace-nla-spatial-readiness",
      targetDomains: ["feature-display", "spatial-analysis"],
      analysis: {
        operations: ["point-query", "bbox-query"],
      },
      sources: {
        incidents: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: { id: "incident-1" },
                geometry: { type: "Point", coordinates: [120.15, 30.28] },
              },
              {
                type: "Feature",
                properties: { id: "incident-2" },
                geometry: { type: "Point", coordinates: [120.18, 30.3] },
              },
            ],
          },
        },
      },
      layers: [
        {
          id: "incident-points",
          type: "circle",
          source: "incidents",
          paint: {
            "circle-color": "#ef4444",
            "circle-radius": 5,
          },
        },
      ],
    });

    const evidence = await createGenerationEvidenceBundle({
      promptHash: "sha256:nla-spatial-readiness",
      skeleton,
      capabilities: {
        renderer: "maplibre",
        dimensions: ["2d"],
        sources: ["geojson"],
        layers: ["circle"],
        expressions: [],
        queries: ["point", "bbox"],
        snapshot: {
          supported: true,
          formats: ["data-url"],
        },
        experimental: [],
      },
      snapshot: {
        renderer: "mock",
        options: {
          targetLayers: ["incident-points"],
        },
      },
      spatialQueries: {
        renderer: "mock",
        cases: [
          {
            id: "incident-point-hit",
            operation: "point-query",
            point: [120.15, 30.28],
            layers: ["incident-points"],
          },
          {
            id: "incident-bbox-hit",
            operation: "bbox-query",
            bbox: [120.14, 30.27, 120.19, 30.31],
            layers: ["incident-points"],
          },
        ],
      },
    });

    expect(skeleton.status).toBe("ready");
    expect(skeleton.analysisEvidence).toMatchObject({
      requested: true,
      status: "ready",
      acceptedQueryOperations: ["point-query", "bbox-query"],
    });
    expect(skeleton.diagnostics).toEqual([]);
    expect(evidence.ok).toBe(true);
    if (!evidence.ok) throw new Error("Expected spatial-analysis generation evidence.");
    expect(evidence.result.status).toBe("ready");
    expect(evidence.result.diagnostics).toEqual([]);
    expect(evidence.result.spatialQueryEvidence).toMatchObject({
      requested: true,
      ready: true,
      renderer: "mock",
      status: "ready",
      requestedOperations: ["point-query", "bbox-query"],
      acceptedQueryOperations: ["point-query", "bbox-query"],
      blockedOperations: [],
      unsupportedOperations: ["aggregation", "buffer", "intersection", "overlay", "routing"],
      capabilityQueries: ["bbox", "point"],
      queryableSourceIds: ["incidents"],
      queryableLayerIds: ["incident-points"],
      diagnosticCounts: { error: 0, warning: 0, info: 0 },
    });
    expect(evidence.result.spatialQueryEvidence.cases).toEqual([
      expect.objectContaining({
        id: "incident-point-hit",
        operation: "point-query",
        layerIds: ["incident-points"],
        sourceIds: ["incidents"],
        featureCount: 1,
        passed: true,
        diagnosticCounts: { error: 0, warning: 0, info: 0 },
      }),
      expect.objectContaining({
        id: "incident-bbox-hit",
        operation: "bbox-query",
        layerIds: ["incident-points"],
        sourceIds: ["incidents"],
        featureCount: 2,
        passed: true,
        diagnosticCounts: { error: 0, warning: 0, info: 0 },
      }),
    ]);
    const spatialDomain = evidence.result.summary.capabilitySummary.domains.find(
      (domain) => domain.id === "spatial-analysis",
    );
    expect(spatialDomain?.status).toBe("experimental");
    expect(spatialDomain?.supported.join(" ")).toContain("declared query capabilities: bbox, point");
    expect(spatialDomain?.blocked.join(" ")).toContain("buffer");
    expect(spatialDomain?.blocked.join(" ")).toContain("routing");
    expect(evidence.result.commandEvidence).toMatchObject({
      usedApplyCommands: true,
      committed: true,
      rolledBack: false,
      diagnosticCounts: { error: 0, warning: 0, info: 0 },
    });
  });

  it("blocks unsupported spatial-analysis generation operations before evidence is accepted", async () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "nla-blocked-analysis",
      promptHash: "sha256:nla-blocked-analysis",
      traceId: "trace-nla-blocked-analysis",
      targetDomains: ["spatial-analysis"],
      analysis: {
        operations: ["buffer", "overlay", "aggregation"],
      },
    });

    const evidence = await createGenerationEvidenceBundle({
      promptHash: "sha256:nla-blocked-analysis",
      skeleton,
      capabilities: {
        renderer: "maplibre",
        dimensions: ["2d"],
        sources: ["geojson"],
        layers: ["circle"],
        expressions: [],
        queries: ["point", "bbox"],
        snapshot: {
          supported: true,
          formats: ["data-url"],
        },
        experimental: [],
      },
    });

    expect(skeleton.status).toBe("blocked");
    expect(skeleton.commands).toEqual([]);
    expect(skeleton.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "CAPABILITY.UNSUPPORTED", path: "/analysis/operations/0" }),
        expect.objectContaining({ code: "CAPABILITY.UNSUPPORTED", path: "/analysis/operations/1" }),
        expect.objectContaining({ code: "CAPABILITY.UNSUPPORTED", path: "/analysis/operations/2" }),
      ]),
    );
    expect(evidence.ok).toBe(true);
    if (!evidence.ok) throw new Error("Expected blocked analysis evidence bundle.");
    expect(evidence.result.status).toBe("blocked");
    expect(evidence.result.spatialQueryEvidence).toMatchObject({
      requested: true,
      ready: false,
      status: "blocked",
      requestedOperations: ["buffer", "overlay", "aggregation"],
      acceptedQueryOperations: [],
      blockedOperations: ["buffer", "overlay", "aggregation"],
      unsupportedOperations: ["aggregation", "buffer", "intersection", "overlay", "routing"],
      cases: [],
      diagnosticCounts: { error: 3, warning: 0, info: 0 },
    });
    expect(evidence.result.snapshotEvidence.requested).toBe(false);
    expect(evidence.result.exportEvidence.ready).toBe(false);
    expect(evidence.result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ severity: "error", code: "CAPABILITY.UNSUPPORTED", path: "/analysis/operations/0" }),
      ]),
    );
  });

  it("keeps scene browsing generation extension-only in the evidence bundle", async () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "nla-scene-extension-only",
      promptHash: "sha256:nla-scene-extension-only",
      traceId: "trace-nla-scene-extension-only",
      targetDomains: ["scene-browsing"],
      scene3d: {
        camera: {
          position: [120.15, 30.28, 1200],
          target: [120.15, 30.28, 0],
        },
        sources: {
          city: {
            type: "3d-tiles",
            url: "./data/city/tileset.json",
          },
        },
        layers: [
          {
            id: "city",
            type: "tileset3d",
            source: "city",
            pickable: true,
          },
        ],
      },
    });

    const evidence = await createGenerationEvidenceBundle({
      promptHash: "sha256:nla-scene-extension-only",
      skeleton,
      snapshot: {
        renderer: "mock",
      },
    });

    expect(skeleton.status).toBe("ready");
    expect(skeleton.commands.map((command) => command.type)).toEqual([
      "setSceneCamera",
      "addSceneSource",
      "addSceneLayer",
    ]);
    expect(skeleton.spec.view.mode).toBe("map2d");
    expect(skeleton.spec.capabilities?.renderer).toBeUndefined();
    expect(skeleton.spec.extensions?.scene3d).toBeDefined();
    expect(evidence.ok).toBe(true);
    if (!evidence.ok) throw new Error("Expected extension-only scene browsing evidence.");
    expect(evidence.result.status).toBe("ready");
    expect(evidence.result.summary.scene3d).toMatchObject({
      status: "extension-only",
      stableViewMode: false,
      runtimeSupported: false,
      sourceCount: 1,
      layerCount: 1,
      pickableLayerCount: 1,
    });
    expect(evidence.result.summary.scene3d).not.toHaveProperty("rendererEvidence");
    expect(evidence.result.summary.scene3d).not.toHaveProperty("promotionEvidence");
    const sceneDomain = evidence.result.summary.capabilitySummary.domains.find(
      (domain) => domain.id === "scene-browsing",
    );
    expect(sceneDomain).toMatchObject({ status: "experimental" });
    expect(sceneDomain?.blocked.join(" ")).toContain('stable view.mode: "scene3d" runtime rendering is blocked');
    expect(evidence.result.exampleEvidence.generationEvidence?.sceneBrowsing).toMatchObject({
      requested: true,
      status: "experimental",
      extensionPresent: true,
      stableViewMode: false,
      runtimeSupported: false,
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
    });
  });

  it("blocks stable scene3d generation requests in the evidence bundle", async () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "nla-stable-scene-blocked",
      promptHash: "sha256:nla-stable-scene-blocked",
      traceId: "trace-nla-stable-scene-blocked",
      targetDomains: ["scene-browsing"],
      view: { mode: "scene3d" },
      capabilities: {
        dimensions: ["3d"],
        renderer: "scene3d",
      },
    });

    const evidence = await createGenerationEvidenceBundle({
      promptHash: "sha256:nla-stable-scene-blocked",
      skeleton,
    });

    expect(skeleton.status).toBe("blocked");
    expect(skeleton.commands).toEqual([]);
    expect(evidence.ok).toBe(true);
    if (!evidence.ok) throw new Error("Expected blocked stable scene evidence.");
    expect(evidence.result.status).toBe("blocked");
    expect(evidence.result.snapshotEvidence.requested).toBe(false);
    expect(evidence.result.exportEvidence.ready).toBe(false);
    expect(evidence.result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blockerCode: "SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED",
          path: "/view/mode",
        }),
        expect.objectContaining({
          blockerCode: "SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED",
          path: "/capabilities/renderer",
        }),
        expect.objectContaining({
          blockerCode: "SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED",
          path: "/capabilities/dimensions",
        }),
      ]),
    );
    expect(evidence.result.exampleEvidence.generationEvidence?.sceneBrowsing).toMatchObject({
      requested: true,
      status: "blocked",
      extensionPresent: false,
      stableViewMode: false,
      runtimeSupported: false,
      sourceCount: 0,
      layerCount: 0,
      sourceIds: [],
      layerIds: [],
      pickableLayerCount: 0,
      mockSnapshotPassed: false,
      mockQueryPickCount: 0,
      stableRuntimeBlockerCodes: [
        "SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED",
        "SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED",
        "SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED",
      ],
    });
  });
});

function rollbackAppliedCommands(result: ApplyCommandsResult): MapSpec {
  return [...result.results].reverse().reduce((spec, commandResult) => {
    if (!commandResult.inversePatch) return spec;
    return applyJsonPatch(spec, commandResult.inversePatch);
  }, result.spec);
}
