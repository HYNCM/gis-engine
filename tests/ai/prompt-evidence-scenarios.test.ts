import { describe, expect, it } from "vitest";
import {
  createMapGenerationCommandSkeleton,
  planMapGenerationRequest,
  type MapGenerationCommandSkeleton,
  type MapGenerationRequestFromSchema
} from "@gis-engine/engine";
import { createGenerationEvidenceBundle, type GenerationEvidenceBundle, type GenerationEvidenceBundleInput } from "@gis-engine/ai";

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
      },
      evidence: {
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
      },
      assertEvidence: (skeleton, evidence) => {
        expect(skeleton.status).toBe("ready");
        expect(evidence.status).toBe("ready");
        expect(evidence.commandEvidence).toMatchObject({
          usedApplyCommands: true,
          commandCount: 6,
          committed: true,
          rolledBack: false,
          diagnosticCounts: { error: 0, warning: 0, info: 0 }
        });
        expect(evidence.snapshotEvidence).toMatchObject({
          requested: true,
          renderer: "maplibre",
          passed: true,
          dataUrlPresent: true
        });
        expect(evidence.exportEvidence).toMatchObject({
          ready: true,
          sourceCount: 1,
          layerCount: 2
        });
        expect(evidence.exampleEvidence).toMatchObject({
          exampleId: "ai-map-edit",
          writesFiles: false,
          fileCount: 3
        });
        expect(findDomain(evidence, "feature-display")).toMatchObject({
          status: "supported"
        });
      }
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
      },
      assertEvidence: (skeleton, evidence) => {
        expect(skeleton.status).toBe("ready");
        expect(evidence.status).toBe("ready");
        expect(evidence.commandEvidence).toMatchObject({
          usedApplyCommands: true,
          commandCount: 2,
          committed: true,
          rolledBack: false,
          diagnosticCounts: { error: 0, warning: 0, info: 0 }
        });
        expect(evidence.snapshotEvidence).toMatchObject({
          requested: true,
          renderer: "mock",
          passed: true
        });
        expect(evidence.exportEvidence).toMatchObject({
          ready: true,
          sourceCount: 1,
          layerCount: 1
        });
        const spatial = findDomain(evidence, "spatial-analysis");
        expect(spatial.status).toBe("experimental");
        expect(spatial.supported.join(" ")).toContain("declared query capabilities: bbox, point");
        expect(spatial.blocked.join(" ")).toContain("buffer");
        expect(spatial.blocked.join(" ")).toContain("routing");
      }
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
            target: [120.15, 30.28, 0]
          },
          sources: {
            city: {
              type: "3d-tiles",
              url: "./data/city/tileset.json"
            }
          },
          layers: [
            {
              id: "city",
              type: "tileset3d",
              source: "city",
              pickable: true
            }
          ]
        }
      },
      evidence: {
        snapshot: {
          renderer: "mock"
        }
      },
      assertEvidence: (skeleton, evidence) => {
        expect(skeleton.status).toBe("ready");
        expect(skeleton.spec.view.mode).toBe("map2d");
        expect(skeleton.spec.extensions?.scene3d).toBeDefined();
        expect(evidence.status).toBe("ready");
        expect(evidence.snapshotEvidence).toMatchObject({
          requested: true,
          renderer: "mock",
          passed: true
        });
        expect(evidence.exportEvidence.ready).toBe(true);
        expect(evidence.summary.scene3d).toMatchObject({
          status: "extension-only",
          stableViewMode: false,
          runtimeSupported: false,
          sourceCount: 1,
          layerCount: 1,
          pickableLayerCount: 1,
          snapshot: {
            mockPassed: true
          },
          query: {
            pickCount: 1
          }
        });
        expect(evidence.summary.scene3d).not.toHaveProperty("rendererEvidence");
        expect(evidence.summary.scene3d).not.toHaveProperty("promotionEvidence");
        expect(findDomain(evidence, "scene-browsing")).toMatchObject({
          status: "experimental"
        });
      }
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
          mode: "scene3d"
        },
        capabilities: {
          dimensions: ["3d"],
          renderer: "scene3d"
        }
      },
      assertEvidence: (skeleton, evidence) => {
        expect(skeleton.status).toBe("blocked");
        expect(skeleton.commands).toEqual([]);
        expect(evidence.status).toBe("blocked");
        expect(evidence.commandEvidence).toMatchObject({
          usedApplyCommands: false,
          commandCount: 0,
          committed: false,
          rolledBack: false
        });
        expect(evidence.snapshotEvidence).toMatchObject({
          requested: false,
          renderer: "maplibre",
          passed: false,
          dataUrlPresent: false
        });
        expect(evidence.exportEvidence.ready).toBe(false);
        const sceneDomain = findDomain(evidence, "scene-browsing");
        expect(sceneDomain.status).toBe("experimental");
        expect(sceneDomain.blocked.join(" ")).toContain('stable view.mode: "scene3d" runtime rendering is blocked');
        expect(evidence.diagnostics).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              blockerCode: "SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED",
              path: "/view/mode"
            }),
            expect.objectContaining({
              blockerCode: "SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED",
              path: "/capabilities/renderer"
            }),
            expect.objectContaining({
              blockerCode: "SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED",
              path: "/capabilities/dimensions"
            })
          ])
        );
      }
    }
  ];

  it.each(scenarios)("$id composes prompt-to-evidence output", async (scenario) => {
    expect(scenario.prompt.length).toBeGreaterThan(0);
    const plan = planMapGenerationRequest({
      promptHash: scenario.request.promptHash,
      ...(scenario.request.traceId ? { traceId: scenario.request.traceId } : {}),
      ...(scenario.request.createdAt ? { createdAt: scenario.request.createdAt } : {}),
      intent: plannerIntentFromRequest(scenario.request)
    });
    expect(plan.status).toBe("ready");
    const skeleton = createMapGenerationCommandSkeleton(plan.request);
    const response = await createGenerationEvidenceBundle({
      promptHash: scenario.request.promptHash,
      skeleton,
      planner: { plan },
      ...(scenario.evidence ?? {})
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
      diagnosticCounts: { error: 0, warning: 0, info: 0 }
    });
    expect(response.result.toolSequence).toEqual([
      "get_context_summary",
      "validate_spec",
      "apply_commands",
      "snapshot_spec",
      "export_spec",
      "export_example_app"
    ]);
    expect(response.result.toolSequence).not.toContain("generate_map_app");

    scenario.assertEvidence(skeleton, response.result);
  });
});

function plannerIntentFromRequest(
  request: MapGenerationRequestFromSchema
): Omit<MapGenerationRequestFromSchema, "promptHash" | "traceId" | "createdAt"> {
  const { promptHash: _promptHash, traceId: _traceId, createdAt: _createdAt, ...intent } = request;
  return intent;
}

function findDomain(evidence: GenerationEvidenceBundle, domainId: "feature-display" | "spatial-analysis" | "scene-browsing") {
  const domain = evidence.summary.capabilitySummary.domains.find((entry) => entry.id === domainId);
  if (!domain) throw new Error(`Expected capability domain ${domainId}.`);
  return domain;
}
