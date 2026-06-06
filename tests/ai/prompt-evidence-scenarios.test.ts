import {
  createGenerationEvidenceBundle,
  type GenerationEvidenceBundle,
  type GenerationEvidenceBundleInput,
} from "@gis-engine/ai";
import {
  createMapGenerationCommandSkeleton,
  type MapGenerationCommandSkeleton,
  type MapGenerationRequestFromSchema,
  planMapGenerationRequest,
} from "@gis-engine/engine";
import { describe, expect, it } from "vitest";

interface PromptEvidenceScenario {
  id: string;
  prompt: string;
  request: MapGenerationRequestFromSchema;
  evidence?: Omit<GenerationEvidenceBundleInput, "promptHash" | "skeleton">;
  assertEvidence: (skeleton: MapGenerationCommandSkeleton, evidence: GenerationEvidenceBundle) => void;
}

describe("prompt-level generation evidence scenarios", () => {
  const scenarios: PromptEvidenceScenario[] = [
    {
      id: "feature-display",
      prompt: "Show service districts with a visible fill, outline, and snapshot evidence.",
      request: {
        mapId: "prompt-feature-display",
        promptHash: "sha256:prompt-feature-display",
        traceId: "trace-prompt-feature-display",
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
      },
      evidence: {
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
      },
      assertEvidence: (skeleton, evidence) => {
        expect(skeleton.status).toBe("ready");
        expect(evidence.status).toBe("ready");
        expect(evidence.commandEvidence).toMatchObject({
          usedApplyCommands: true,
          commandCount: 6,
          committed: true,
          rolledBack: false,
          diagnosticCounts: { error: 0, warning: 0, info: 0 },
        });
        expect(evidence.snapshotEvidence).toMatchObject({
          requested: true,
          renderer: "maplibre",
          passed: true,
          dataUrlPresent: true,
        });
        expect(evidence.exportEvidence).toMatchObject({
          ready: true,
          sourceCount: 1,
          layerCount: 2,
        });
        expect(evidence.exampleEvidence).toMatchObject({
          exampleId: "ai-map-edit",
          writesFiles: false,
          fileCount: 3,
          generationEvidence: {
            status: "ready",
            targetDomains: ["feature-display"],
            command: {
              usedApplyCommands: true,
              commandCount: 6,
              committed: true,
              rolledBack: false,
            },
            snapshot: {
              requested: true,
              renderer: "maplibre",
              passed: true,
            },
            export: {
              ready: true,
              sourceCount: 1,
              layerCount: 2,
            },
          },
        });
        expect(evidence.delivery).toMatchObject({
          status: "ready",
          acceptance: {
            state: "ready",
            ready: true,
            blocked: false,
            needsConfirmation: false,
            followUpRequired: false,
          },
          confirmationRequired: false,
        });
        expect(evidence.delivery.sections).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: "readiness", status: "ready" }),
            expect.objectContaining({ id: "files", status: "ready" }),
            expect.objectContaining({ id: "map-edits", status: "ready" }),
            expect.objectContaining({ id: "data-and-analysis", status: "ready" }),
            expect.objectContaining({ id: "scene-browsing", status: "ready" }),
          ]),
        );
        expect(findDomain(evidence, "feature-display")).toMatchObject({
          status: "supported",
        });
      },
    },
    {
      id: "spatial-analysis-readiness",
      prompt: "Prepare incident points for point and bbox query planning, but do not run unsupported geoprocessing.",
      request: {
        mapId: "prompt-spatial-readiness",
        promptHash: "sha256:prompt-spatial-readiness",
        traceId: "trace-prompt-spatial-readiness",
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
      },
      evidence: {
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
              id: "prompt-incident-point",
              operation: "point-query",
              point: [120.15, 30.28],
              layers: ["incident-points"],
            },
            {
              id: "prompt-incident-bbox",
              operation: "bbox-query",
              bbox: [120.14, 30.27, 120.19, 30.31],
              layers: ["incident-points"],
            },
          ],
        },
      },
      assertEvidence: (skeleton, evidence) => {
        expect(skeleton.status).toBe("ready");
        expect(skeleton.analysisEvidence).toMatchObject({
          requested: true,
          status: "ready",
          acceptedQueryOperations: ["point-query", "bbox-query"],
        });
        expect(evidence.status).toBe("ready");
        expect(evidence.commandEvidence).toMatchObject({
          usedApplyCommands: true,
          commandCount: 2,
          committed: true,
          rolledBack: false,
          diagnosticCounts: { error: 0, warning: 0, info: 0 },
        });
        expect(evidence.snapshotEvidence).toMatchObject({
          requested: true,
          renderer: "mock",
          passed: true,
        });
        expect(evidence.spatialQueryEvidence).toMatchObject({
          requested: true,
          ready: true,
          renderer: "mock",
          status: "ready",
          acceptedQueryOperations: ["point-query", "bbox-query"],
          blockedOperations: [],
          queryableSourceIds: ["incidents"],
          queryableLayerIds: ["incident-points"],
          diagnosticCounts: { error: 0, warning: 0, info: 0 },
        });
        expect(
          evidence.spatialQueryEvidence.cases.map((entry) => [
            entry.id,
            entry.operation,
            entry.featureCount,
            entry.passed,
          ]),
        ).toEqual([
          ["prompt-incident-point", "point-query", 1, true],
          ["prompt-incident-bbox", "bbox-query", 2, true],
        ]);
        expect(evidence.exampleEvidence.generationEvidence).toMatchObject({
          status: "ready",
          spatialQuery: {
            requested: true,
            ready: true,
            status: "ready",
            caseCount: 2,
            blockedOperations: [],
          },
          snapshot: {
            requested: true,
            renderer: "mock",
            passed: true,
          },
        });
        expect(evidence.delivery).toMatchObject({
          status: "ready",
          acceptance: {
            state: "ready",
            ready: true,
            blocked: false,
            needsConfirmation: false,
            followUpRequired: false,
          },
          confirmationRequired: false,
          spatialQueryReadiness: {
            requested: true,
            state: "ready",
            status: "ready",
            caseCount: 2,
            passedCaseCount: 2,
            failedCaseCount: 0,
            blockerCount: 0,
            followUpCount: 0,
            queryableLayerIds: ["incident-points"],
            queryableSourceIds: ["incidents"],
          },
        });
        expect(evidence.delivery.sections).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: "readiness", status: "ready" }),
            expect.objectContaining({ id: "files", status: "ready" }),
            expect.objectContaining({ id: "map-edits", status: "ready" }),
            expect.objectContaining({ id: "data-and-analysis", status: "ready" }),
            expect.objectContaining({ id: "scene-browsing", status: "ready" }),
          ]),
        );
        expect(evidence.exportEvidence).toMatchObject({
          ready: true,
          sourceCount: 1,
          layerCount: 1,
        });
        const spatial = findDomain(evidence, "spatial-analysis");
        expect(spatial.status).toBe("experimental");
        expect(spatial.supported.join(" ")).toContain("declared query capabilities: bbox, point");
        expect(spatial.blocked.join(" ")).toContain("buffer");
        expect(spatial.blocked.join(" ")).toContain("routing");
      },
    },
    {
      id: "delivery-needs-confirmation",
      prompt: "Prepare a parcel archive handoff for review without fetching or parsing the archive yet.",
      request: {
        mapId: "prompt-delivery-needs-confirmation",
        promptHash: "sha256:prompt-delivery-needs-confirmation",
        traceId: "trace-prompt-delivery-needs-confirmation",
        targetDomains: ["feature-display"],
        sources: {
          parcels: {
            type: "pmtiles",
            url: "pmtiles://local/parcels.pmtiles",
          },
        },
        layers: [
          {
            id: "parcel-fills",
            type: "fill",
            source: "parcels",
          },
        ],
      },
      evidence: {
        exampleId: "pmtiles-local",
      },
      assertEvidence: (skeleton, evidence) => {
        expect(skeleton.status).toBe("ready");
        expect(evidence.status).toBe("ready");
        expect(evidence.delivery).toMatchObject({
          status: "needs-confirmation",
          acceptance: {
            state: "needs-confirmation",
            ready: false,
            blocked: false,
            needsConfirmation: true,
            followUpRequired: false,
          },
          confirmationRequired: true,
        });
        expect(evidence.delivery.sections).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: "readiness", status: "needs-confirmation" }),
            expect.objectContaining({ id: "files", status: "ready" }),
            expect.objectContaining({ id: "map-edits", status: "ready" }),
            expect.objectContaining({ id: "data-and-analysis", status: "needs-confirmation" }),
            expect.objectContaining({ id: "scene-browsing", status: "ready" }),
          ]),
        );
        expect(evidence.exampleEvidence.generationEvidence).toMatchObject({
          status: "ready",
          delivery: {
            status: "needs-confirmation",
            confirmationRequired: true,
          },
        });
        expect(evidence.exampleEvidence.generationEvidence?.delivery?.sourceReadiness).toContainEqual(
          expect.objectContaining({
            sourceId: "parcels",
            type: "pmtiles",
            state: "readiness-only",
            resourcePolicy: "passed",
            archiveContract: expect.objectContaining({
              state: "explicit",
              metadataFields: expect.arrayContaining(["specVersion", "archiveBytes"]),
              policyFields: expect.arrayContaining(["maxArchiveBytes", "timeoutMs"]),
            }),
            confirmationReasons: ["external-resource", "archive-parsing"],
          }),
        );
        expect(evidence.exampleEvidence.generationEvidence?.delivery?.sourcePromotionCandidates).toContainEqual(
          expect.objectContaining({
            candidateId: "source-promotion.pmtiles.parcels",
            format: "pmtiles",
            state: "readiness-only",
            resourcePolicy: "passed",
            archiveContract: expect.objectContaining({ state: "explicit" }),
            target: "PMTiles archive metadata promotion gate",
          }),
        );
        expect(findDomain(evidence, "feature-display")).toMatchObject({
          status: "supported",
        });
      },
    },
    {
      id: "scene-browsing-extension-only",
      prompt: "Attach a 3D city browsing scene as extension evidence without enabling stable scene3d rendering.",
      request: {
        mapId: "prompt-scene-extension-only",
        promptHash: "sha256:prompt-scene-extension-only",
        traceId: "trace-prompt-scene-extension-only",
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
      },
      evidence: {
        snapshot: {
          renderer: "mock",
        },
      },
      assertEvidence: (skeleton, evidence) => {
        expect(skeleton.status).toBe("ready");
        expect(skeleton.spec.view.mode).toBe("map2d");
        expect(skeleton.spec.extensions?.scene3d).toBeDefined();
        expect(evidence.status).toBe("ready");
        expect(evidence.snapshotEvidence).toMatchObject({
          requested: true,
          renderer: "mock",
          passed: true,
        });
        expect(evidence.exportEvidence.ready).toBe(true);
        expect(evidence.delivery).toMatchObject({
          status: "follow-up-required",
          acceptance: {
            state: "follow-up-required",
            ready: false,
            blocked: false,
            needsConfirmation: false,
            followUpRequired: true,
          },
          confirmationRequired: false,
        });
        expect(evidence.delivery.sections).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: "readiness", status: "follow-up-required" }),
            expect.objectContaining({ id: "files", status: "ready" }),
            expect.objectContaining({ id: "map-edits", status: "ready" }),
            expect.objectContaining({ id: "data-and-analysis", status: "ready" }),
            expect.objectContaining({ id: "scene-browsing", status: "follow-up-required" }),
          ]),
        );
        expect(evidence.summary.scene3d).toMatchObject({
          status: "extension-only",
          stableViewMode: false,
          runtimeSupported: false,
          sourceCount: 1,
          layerCount: 1,
          pickableLayerCount: 1,
          snapshot: {
            mockPassed: true,
          },
          query: {
            pickCount: 1,
          },
        });
        expect(evidence.summary.scene3d).not.toHaveProperty("rendererEvidence");
        expect(evidence.summary.scene3d).not.toHaveProperty("promotionEvidence");
        expect(evidence.exampleEvidence.generationEvidence?.sceneBrowsing).toMatchObject({
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
        expect(findDomain(evidence, "scene-browsing")).toMatchObject({
          status: "experimental",
        });
      },
    },
    {
      id: "scene-browsing-stable-blocked",
      prompt: "Request stable scene3d runtime output and receive blocker diagnostics instead of renderer evidence.",
      request: {
        mapId: "prompt-scene-stable-blocked",
        promptHash: "sha256:prompt-scene-stable-blocked",
        traceId: "trace-prompt-scene-stable-blocked",
        targetDomains: ["scene-browsing"],
        view: {
          mode: "scene3d",
        },
        capabilities: {
          dimensions: ["3d"],
          renderer: "scene3d",
        },
      },
      assertEvidence: (skeleton, evidence) => {
        expect(skeleton.status).toBe("blocked");
        expect(skeleton.commands).toEqual([]);
        expect(evidence.status).toBe("blocked");
        expect(evidence.commandEvidence).toMatchObject({
          usedApplyCommands: false,
          commandCount: 0,
          committed: false,
          rolledBack: false,
        });
        expect(evidence.snapshotEvidence).toMatchObject({
          requested: false,
          renderer: "maplibre",
          passed: false,
          dataUrlPresent: false,
        });
        expect(evidence.exportEvidence.ready).toBe(false);
        expect(evidence.delivery).toMatchObject({
          status: "blocked",
          acceptance: {
            state: "blocked",
            ready: false,
            blocked: true,
            needsConfirmation: false,
            followUpRequired: false,
          },
        });
        expect(evidence.delivery.sections).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: "readiness", status: "blocked" }),
            expect.objectContaining({ id: "files", status: "ready" }),
            expect.objectContaining({ id: "map-edits", status: "ready" }),
            expect.objectContaining({ id: "data-and-analysis", status: "ready" }),
            expect.objectContaining({ id: "scene-browsing", status: "blocked" }),
          ]),
        );
        const sceneDomain = findDomain(evidence, "scene-browsing");
        expect(sceneDomain.status).toBe("experimental");
        expect(sceneDomain.blocked.join(" ")).toContain('stable view.mode: "scene3d" runtime rendering is blocked');
        expect(evidence.diagnostics).toEqual(
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
        expect(evidence.exampleEvidence.generationEvidence?.sceneBrowsing).toMatchObject({
          requested: true,
          status: "blocked",
          extensionPresent: false,
          stableViewMode: false,
          runtimeSupported: false,
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
      },
    },
  ];

  it.each(scenarios)("$id composes prompt-to-evidence output", async (scenario) => {
    expect(scenario.prompt.length).toBeGreaterThan(0);
    const plan = planMapGenerationRequest({
      promptHash: scenario.request.promptHash,
      ...(scenario.request.traceId ? { traceId: scenario.request.traceId } : {}),
      ...(scenario.request.createdAt ? { createdAt: scenario.request.createdAt } : {}),
      intent: plannerIntentFromRequest(scenario.request),
    });
    expect(plan.status).toBe("ready");
    const skeleton = createMapGenerationCommandSkeleton(plan.request);
    const response = await createGenerationEvidenceBundle({
      promptHash: scenario.request.promptHash,
      skeleton,
      planner: { plan },
      ...(scenario.evidence ?? {}),
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error(`Expected ${scenario.id} evidence to be generated.`);
    expect(response.result.promptHash).toBe(scenario.request.promptHash);
    expect(response.result.targetDomains).toEqual(scenario.request.targetDomains);
    expect(response.result.validation.valid).toBe(true);
    expect(response.result.plannerEvidence).toMatchObject({
      provided: true,
      promptHash: scenario.request.promptHash,
      traceId: scenario.request.traceId,
      retainedRawPrompt: false,
      diagnosticCounts: { error: 0, warning: 0, info: 0 },
    });
    expect(response.result.toolSequence).toEqual([
      "get_context_summary",
      "validate_spec",
      "apply_commands",
      "snapshot_spec",
      "export_spec",
      "export_example_app",
    ]);
    expect(response.result.toolSequence).not.toContain("generate_map_app");

    scenario.assertEvidence(skeleton, response.result);
  });
});

function plannerIntentFromRequest(
  request: MapGenerationRequestFromSchema,
): Omit<MapGenerationRequestFromSchema, "promptHash" | "traceId" | "createdAt"> {
  const { promptHash: _promptHash, traceId: _traceId, createdAt: _createdAt, ...intent } = request;
  return intent;
}

function findDomain(
  evidence: GenerationEvidenceBundle,
  domainId: "feature-display" | "spatial-analysis" | "scene-browsing",
) {
  const domain = evidence.summary.capabilitySummary.domains.find((entry) => entry.id === domainId);
  if (!domain) throw new Error(`Expected capability domain ${domainId}.`);
  return domain;
}
