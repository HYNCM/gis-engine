import { describe, expect, it } from "vitest";
import {
  applyCommands,
  applyJsonPatch,
  createMapGenerationCommandSkeleton,
  type ApplyCommandsResult,
  type MapSpec
} from "@gis-engine/engine";
import { createGenerationEvidenceBundle } from "@gis-engine/ai";

describe("minimum natural-language generation scenarios", () => {
  it("covers feature-display source, layer, style, dry-run, replay, and rollback evidence", async () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "nla-feature-display",
      promptHash: "sha256:nla-feature-display",
      traceId: "trace-nla-feature-display",
      targetDomains: ["feature-display"],
      view: {
        center: [120.15, 30.28],
        zoom: 10
      },
      sources: {
        districts: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: []
          }
        }
      },
      layers: [
        {
          id: "district-fill",
          type: "fill",
          source: "districts",
          paint: {
            "fill-color": "#22c55e"
          }
        },
        {
          id: "district-outline",
          type: "line",
          source: "districts",
          paint: {
            "line-color": "#14532d",
            "line-width": 1.5
          }
        }
      ],
      styleEdits: [
        {
          layerId: "district-fill",
          paint: {
            "fill-opacity": 0.45
          },
          layout: {
            visibility: "visible"
          }
        }
      ]
    });

    const applied = applyCommands(skeleton.baseSpec, skeleton.commands, {
      collectTrace: true,
      traceId: "trace-nla-feature-display"
    });
    const dryRun = applyCommands(skeleton.baseSpec, skeleton.commands, {
      dryRun: true,
      traceId: "trace-nla-feature-display-dry-run"
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
          targetLayers: ["district-fill", "district-outline"]
        }
      },
      exampleId: "ai-map-edit"
    });

    expect(skeleton.status).toBe("ready");
    expect(skeleton.commands.map((command) => command.type)).toEqual(["setView", "addSource", "addLayer", "addLayer", "setPaint", "setLayout"]);
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
      expect.arrayContaining(["/sources/districts", "/layers/0", "/layers/1", "/view", "/revision"])
    );
    expect(evidence.result.snapshotEvidence.passed).toBe(true);
    expect(evidence.result.exportEvidence).toMatchObject({
      ready: true,
      sourceCount: 1,
      layerCount: 2
    });
  });

  it("covers spatial-analysis point/bbox readiness and blocked geoprocessing diagnostics", async () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "nla-spatial-readiness",
      promptHash: "sha256:nla-spatial-readiness",
      traceId: "trace-nla-spatial-readiness",
      targetDomains: ["feature-display", "spatial-analysis"],
      analysis: {
        operations: ["point-query", "bbox-query"]
      },
      sources: {
        incidents: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: []
          }
        }
      },
      layers: [
        {
          id: "incident-points",
          type: "circle",
          source: "incidents",
          paint: {
            "circle-color": "#ef4444",
            "circle-radius": 5
          }
        }
      ]
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
          formats: ["data-url"]
        },
        experimental: []
      },
      snapshot: {
        renderer: "mock",
        options: {
          targetLayers: ["incident-points"]
        }
      }
    });

    expect(skeleton.status).toBe("ready");
    expect(skeleton.diagnostics).toEqual([]);
    expect(evidence.ok).toBe(true);
    if (!evidence.ok) throw new Error("Expected spatial-analysis generation evidence.");
    expect(evidence.result.status).toBe("ready");
    expect(evidence.result.diagnostics).toEqual([]);
    const spatialDomain = evidence.result.summary.capabilitySummary.domains.find((domain) => domain.id === "spatial-analysis");
    expect(spatialDomain?.status).toBe("experimental");
    expect(spatialDomain?.supported.join(" ")).toContain("declared query capabilities: bbox, point");
    expect(spatialDomain?.blocked.join(" ")).toContain("buffer");
    expect(spatialDomain?.blocked.join(" ")).toContain("routing");
    expect(evidence.result.commandEvidence).toMatchObject({
      usedApplyCommands: true,
      committed: true,
      rolledBack: false,
      diagnosticCounts: { error: 0, warning: 0, info: 0 }
    });
  });

  it("blocks unsupported spatial-analysis generation operations before evidence is accepted", async () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "nla-blocked-analysis",
      promptHash: "sha256:nla-blocked-analysis",
      traceId: "trace-nla-blocked-analysis",
      targetDomains: ["spatial-analysis"],
      analysis: {
        operations: ["buffer", "overlay", "aggregation"]
      }
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
          formats: ["data-url"]
        },
        experimental: []
      }
    });

    expect(skeleton.status).toBe("blocked");
    expect(skeleton.commands).toEqual([]);
    expect(skeleton.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "CAPABILITY.UNSUPPORTED", path: "/analysis/operations/0" }),
        expect.objectContaining({ code: "CAPABILITY.UNSUPPORTED", path: "/analysis/operations/1" }),
        expect.objectContaining({ code: "CAPABILITY.UNSUPPORTED", path: "/analysis/operations/2" })
      ])
    );
    expect(evidence.ok).toBe(true);
    if (!evidence.ok) throw new Error("Expected blocked analysis evidence bundle.");
    expect(evidence.result.status).toBe("blocked");
    expect(evidence.result.snapshotEvidence.requested).toBe(false);
    expect(evidence.result.exportEvidence.ready).toBe(false);
    expect(evidence.result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ severity: "error", code: "CAPABILITY.UNSUPPORTED", path: "/analysis/operations/0" })
      ])
    );
  });
});

function rollbackAppliedCommands(result: ApplyCommandsResult): MapSpec {
  return [...result.results].reverse().reduce((spec, commandResult) => {
    if (!commandResult.inversePatch) return spec;
    return applyJsonPatch(spec, commandResult.inversePatch);
  }, result.spec);
}
