import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import { createMapGenerationCommandSkeleton, planMapGenerationRequest, type MapGenerationCommandSkeleton } from "@gis-engine/engine";
import {
  GenerationEvidenceBundleInputSchema,
  GenerationEvidenceBundleSchema,
  createGenerationEvidenceBundle
} from "@gis-engine/ai";

describe("generation evidence bundle", () => {
  it("composes existing MCP tool contracts without adding tool aliases", async () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "nla-evidence",
      promptHash: "sha256:nla-evidence",
      traceId: "trace-nla-evidence",
      targetDomains: ["feature-display"],
      view: {
        center: [120.15, 30.28],
        zoom: 11
      },
      sources: {
        services: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: []
          }
        }
      },
      layers: [
        {
          id: "service-points",
          type: "circle",
          source: "services",
          paint: {
            "circle-color": "#2563eb",
            "circle-radius": 6
          }
        }
      ]
    });

    const response = await createGenerationEvidenceBundle({
      promptHash: "sha256:nla-evidence",
      skeleton,
      snapshot: {
        renderer: "maplibre",
        options: {
          width: 320,
          height: 180,
          format: "data-url",
          targetLayers: ["service-points"]
        }
      },
      exampleId: "ai-map-edit"
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected generation evidence bundle to succeed.");

    expect(response.result.status).toBe("ready");
    expect(response.result.delivery).toMatchObject({
      status: "ready",
      acceptance: {
        state: "ready",
        ready: true,
        blocked: false,
        needsConfirmation: false,
        followUpRequired: false
      },
      confirmationRequired: false,
      sourceReadiness: [
        expect.objectContaining({
          sourceId: "services",
          type: "geojson",
          state: "supported",
          queryReady: true
        })
      ]
    });
    expect(response.result.toolSequence).toEqual([
      "get_context_summary",
      "validate_spec",
      "apply_commands",
      "snapshot_spec",
      "export_spec",
      "export_example_app"
    ]);
    expect(response.result.toolSequence.every((tool) => /^[a-z]+(?:_[a-z]+)*$/.test(tool))).toBe(true);
    expect(response.result.toolSequence).not.toContain("generate_map_app");
    expect(response.result.commandEvidence).toMatchObject({
      usedApplyCommands: true,
      traceId: "trace-nla-evidence",
      commandCount: 3,
      committed: true,
      rolledBack: false,
      diagnosticCounts: { error: 0, warning: 0, info: 0 }
    });
    expect(response.result.plannerEvidence).toMatchObject({
      provided: false,
      plannerId: "unreported",
      promptHash: "sha256:nla-evidence",
      traceId: "trace-nla-evidence",
      commandTraceId: "trace-nla-evidence",
      retainedRawPrompt: false,
      confidence: {
        level: "unknown",
        score: 0
      }
    });
    expect(response.result.snapshotEvidence).toMatchObject({
      requested: true,
      renderer: "maplibre",
      passed: true,
      dataUrlPresent: true
    });
    expect(response.result.exportEvidence).toMatchObject({
      ready: true,
      sourceCount: 1,
      layerCount: 1
    });
    expect(response.result.exampleEvidence).toMatchObject({
      exampleId: "ai-map-edit",
      writesFiles: false,
      fileCount: 3,
      generationEvidence: {
        status: "ready",
        delivery: {
          status: "ready",
          confirmationRequired: false
        },
        targetDomains: ["feature-display"],
        diagnosticCounts: { error: 0, warning: 0, info: 0 },
        command: {
          usedApplyCommands: true,
          commandCount: 3,
          committed: true,
          rolledBack: false
        },
        planner: {
          provided: false,
          confidenceLevel: "unknown",
          unsupportedIntentCount: 0
        },
        spatialQuery: {
          requested: false,
          ready: false,
          status: "not-requested",
          caseCount: 0,
          blockedOperations: []
        },
        snapshot: {
          requested: true,
          renderer: "maplibre",
          passed: true
        },
        export: {
          ready: true,
          sourceCount: 1,
          layerCount: 1
        }
      }
    });
    expect(response.result.summary.capabilitySummary.domains.map((domain) => domain.id)).toEqual([
      "feature-display",
      "spatial-analysis",
      "scene-browsing"
    ]);
  });

  it("blocks evidence when a skeleton spec bypasses command replay", async () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "tampered-evidence",
      promptHash: "sha256:tampered-evidence",
      traceId: "trace-tampered-evidence",
      view: { zoom: 8 }
    });
    const tampered: MapGenerationCommandSkeleton = {
      ...skeleton,
      spec: {
        ...skeleton.spec,
        view: {
          ...skeleton.spec.view,
          zoom: 99
        }
      }
    };

    const response = await createGenerationEvidenceBundle({
      promptHash: "sha256:tampered-evidence",
      skeleton: tampered
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected generation evidence bundle to return structured evidence.");
    expect(response.result.status).toBe("blocked");
    expect(response.result.delivery).toMatchObject({
      status: "blocked",
      acceptance: {
        state: "blocked",
        blocked: true
      }
    });
    expect(response.result.commandEvidence.diagnosticCounts.error).toBe(1);
    expect(response.result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "COMMAND.INVALID_PATCH",
        path: "/skeleton/spec"
      })
    );
  });

  it("exposes planner provenance, confidence, and command trace evidence", async () => {
    const plan = planMapGenerationRequest({
      promptHash: "sha256:planner-evidence",
      traceId: "trace-planner-evidence",
      intent: {
        mapId: "planner-evidence",
        targetDomains: ["feature-display"],
        sources: {
          services: {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: []
            }
          }
        },
        layers: [
          {
            id: "service-points",
            type: "circle",
            source: "services",
            paint: {
              "circle-color": "#0f766e"
            }
          }
        ]
      }
    });
    const skeleton = createMapGenerationCommandSkeleton(plan.request);

    const response = await createGenerationEvidenceBundle({
      promptHash: "sha256:planner-evidence",
      skeleton,
      planner: {
        plan,
        confidence: {
          level: "high",
          score: 0.96,
          reasons: ["Structured intent matched the supported feature-display planner boundary."]
        }
      }
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected planner evidence bundle to succeed.");
    expect(response.result.status).toBe("ready");
    expect(response.result.plannerEvidence).toMatchObject({
      provided: true,
      plannerId: "structured-intent-v0.1",
      promptHash: "sha256:planner-evidence",
      traceId: "trace-planner-evidence",
      commandTraceId: "trace-planner-evidence",
      retainedRawPrompt: false,
      confidence: {
        level: "high",
        score: 0.96,
        reasons: ["Structured intent matched the supported feature-display planner boundary."]
      },
      acceptedIntentFields: ["layers", "mapId", "sources", "targetDomains"],
      unsupportedIntentFields: [],
      sourcePromptHashes: ["sha256:planner-evidence"],
      diagnosticCounts: { error: 0, warning: 0, info: 0 }
    });
    expect(response.result.commandEvidence).toMatchObject({
      usedApplyCommands: true,
      traceId: "trace-planner-evidence",
      commandCount: 2
    });
    expect(response.result.toolSequence).not.toContain("generate_map_app");
  });

  it("records spatial query evidence for accepted point and bbox readiness cases", async () => {
    const plan = planMapGenerationRequest({
      promptHash: "sha256:spatial-query-evidence",
      traceId: "trace-spatial-query-evidence",
      intent: {
        mapId: "spatial-query-evidence",
        targetDomains: ["feature-display", "spatial-analysis"],
        analysis: {
          operations: ["point-query", "bbox-query"]
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
                  geometry: { type: "Point", coordinates: [120.15, 30.28] }
                },
                {
                  type: "Feature",
                  properties: { id: "incident-2" },
                  geometry: { type: "Point", coordinates: [120.18, 30.3] }
                }
              ]
            }
          }
        },
        layers: [
          {
            id: "incident-points",
            type: "circle",
            source: "incidents",
            paint: {
              "circle-color": "#dc2626"
            }
          }
        ]
      }
    });
    const skeleton = createMapGenerationCommandSkeleton(plan.request);

    const response = await createGenerationEvidenceBundle({
      promptHash: "sha256:spatial-query-evidence",
      skeleton,
      planner: { plan },
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
      spatialQueries: {
        renderer: "mock",
        cases: [
          {
            id: "incident-point",
            operation: "point-query",
            point: [120.15, 30.28],
            layers: ["incident-points"]
          },
          {
            id: "incident-bbox",
            operation: "bbox-query",
            bbox: [120.14, 30.27, 120.19, 30.31],
            layers: ["incident-points"]
          }
        ]
      }
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected spatial query evidence bundle to succeed.");
    expect(response.result.status).toBe("ready");
    expect(response.result.spatialQueryEvidence).toMatchObject({
      requested: true,
      ready: true,
      renderer: "mock",
      status: "ready",
      requestedOperations: ["point-query", "bbox-query"],
      acceptedQueryOperations: ["point-query", "bbox-query"],
      blockedOperations: [],
      unsupportedOperations: ["aggregation", "buffer", "intersection", "overlay", "routing"],
      capabilityQueries: ["bbox", "point"],
      capabilityGate: {
        status: "passed",
        requiredQueries: ["bbox", "point"],
        providedQueries: ["bbox", "point"]
      },
      queryableSourceIds: ["incidents"],
      queryableLayerIds: ["incident-points"],
      hiddenLayerIds: [],
      unsupportedSourceIds: [],
      missingSourceIds: [],
      diagnosticCounts: { error: 0, warning: 0, info: 0 }
    });
    expect(response.result.spatialQueryEvidence.cases).toEqual([
      expect.objectContaining({
        id: "incident-point",
        operation: "point-query",
        layerIds: ["incident-points"],
        sourceIds: ["incidents"],
        featureCount: 1,
        passed: true,
        diagnosticCounts: { error: 0, warning: 0, info: 0 }
      }),
      expect.objectContaining({
        id: "incident-bbox",
        operation: "bbox-query",
        layerIds: ["incident-points"],
        sourceIds: ["incidents"],
        featureCount: 2,
        passed: true,
        diagnosticCounts: { error: 0, warning: 0, info: 0 }
      })
    ]);
    expect(response.result.exampleEvidence.generationEvidence).toMatchObject({
      status: "ready",
      planner: {
        provided: true,
        confidenceLevel: "high",
        unsupportedIntentCount: 0
      },
      spatialQuery: {
        requested: true,
        ready: true,
        status: "ready",
        caseCount: 2,
        blockedOperations: []
      },
      snapshot: {
        requested: true,
        renderer: "maplibre",
        passed: true
      },
      export: {
        ready: true,
        sourceCount: 1,
        layerCount: 1
      }
    });
    expect(response.result.toolSequence).not.toContain("spatial_query");
  });

  it("blocks spatial query evidence when adapter query capabilities are not declared", async () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "missing-query-capability",
      promptHash: "sha256:missing-query-capability",
      traceId: "trace-missing-query-capability",
      targetDomains: ["feature-display", "spatial-analysis"],
      analysis: {
        operations: ["point-query"]
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
                geometry: { type: "Point", coordinates: [120.15, 30.28] }
              }
            ]
          }
        }
      },
      layers: [
        {
          id: "incident-points",
          type: "circle",
          source: "incidents"
        }
      ]
    });

    const response = await createGenerationEvidenceBundle({
      promptHash: "sha256:missing-query-capability",
      skeleton,
      spatialQueries: {
        renderer: "mock",
        cases: [
          {
            id: "incident-point",
            operation: "point-query",
            point: [120.15, 30.28],
            layers: ["incident-points"]
          }
        ]
      }
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected missing capability evidence to return structured diagnostics.");
    expect(response.result.status).toBe("blocked");
    expect(response.result.spatialQueryEvidence).toMatchObject({
      requested: true,
      ready: false,
      status: "blocked",
      acceptedQueryOperations: ["point-query"],
      capabilityQueries: [],
      capabilityGate: {
        status: "blocked",
        requiredQueries: ["point"],
        providedQueries: []
      },
      cases: [],
      diagnosticCounts: { error: 1, warning: 0, info: 0 }
    });
    expect(response.result.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/capabilities/queries"
      })
    );
  });

  it("allows spatial query evidence with an explicit capability waiver", async () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "waived-query-capability",
      promptHash: "sha256:waived-query-capability",
      traceId: "trace-waived-query-capability",
      targetDomains: ["feature-display", "spatial-analysis"],
      analysis: {
        operations: ["point-query"]
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
                geometry: { type: "Point", coordinates: [120.15, 30.28] }
              }
            ]
          }
        }
      },
      layers: [
        {
          id: "incident-points",
          type: "circle",
          source: "incidents"
        }
      ]
    });

    const response = await createGenerationEvidenceBundle({
      promptHash: "sha256:waived-query-capability",
      skeleton,
      spatialQueries: {
        renderer: "mock",
        capabilityWaiver: {
          reason: "Adapter query capability report is tracked by a follow-up hardening task.",
          approvedBy: "@quality-guardian",
          followUpTaskId: "TASK-2026W23-SQH-003"
        },
        cases: [
          {
            id: "incident-point",
            operation: "point-query",
            point: [120.15, 30.28],
            layers: ["incident-points"]
          }
        ]
      }
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected waived capability evidence bundle to succeed.");
    expect(response.result.status).toBe("ready");
    expect(response.result.spatialQueryEvidence).toMatchObject({
      requested: true,
      ready: true,
      status: "ready",
      acceptedQueryOperations: ["point-query"],
      capabilityQueries: [],
      capabilityGate: {
        status: "waived",
        requiredQueries: ["point"],
        providedQueries: [],
        waiver: {
          reason: "Adapter query capability report is tracked by a follow-up hardening task.",
          approvedBy: "@quality-guardian",
          followUpTaskId: "TASK-2026W23-SQH-003"
        }
      },
      diagnosticCounts: { error: 0, warning: 0, info: 0 }
    });
    expect(response.result.spatialQueryEvidence.cases).toEqual([
      expect.objectContaining({
        id: "incident-point",
        operation: "point-query",
        featureCount: 1,
        passed: true
      })
    ]);
  });

  it("blocks spatial query evidence when no deterministic query cases are provided", async () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "missing-query-cases",
      promptHash: "sha256:missing-query-cases",
      traceId: "trace-missing-query-cases",
      targetDomains: ["feature-display", "spatial-analysis"],
      analysis: {
        operations: ["point-query"]
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
          source: "incidents"
        }
      ]
    });

    const response = await createGenerationEvidenceBundle({
      promptHash: "sha256:missing-query-cases",
      skeleton,
      capabilities: {
        renderer: "maplibre",
        dimensions: ["2d"],
        sources: ["geojson"],
        layers: ["circle"],
        expressions: [],
        queries: ["point"],
        snapshot: {
          supported: true,
          formats: ["data-url"]
        },
        experimental: []
      }
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected missing case evidence to return structured diagnostics.");
    expect(response.result.status).toBe("blocked");
    expect(response.result.spatialQueryEvidence).toMatchObject({
      requested: true,
      ready: false,
      status: "blocked",
      acceptedQueryOperations: ["point-query"],
      capabilityGate: {
        status: "passed",
        requiredQueries: ["point"],
        providedQueries: ["point"]
      },
      cases: [],
      diagnosticCounts: { error: 1, warning: 0, info: 0 }
    });
    expect(response.result.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/spatialQueries/cases"
      })
    );
  });

  it("blocks generation evidence when planner diagnostics expose unsupported prompt intent", async () => {
    const plan = planMapGenerationRequest({
      promptHash: "sha256:raw-prompt",
      traceId: "trace-raw-prompt",
      rawPrompt: "keep this prompt in the evidence",
      intent: {
        mapId: "raw-prompt"
      }
    });
    const skeleton = createMapGenerationCommandSkeleton(plan.request);

    const response = await createGenerationEvidenceBundle({
      promptHash: "sha256:raw-prompt",
      skeleton,
      planner: {
        plan
      }
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected blocked planner evidence bundle to be structured.");
    expect(response.result.status).toBe("blocked");
    expect(response.result.plannerEvidence).toMatchObject({
      provided: true,
      retainedRawPrompt: false,
      unsupportedIntentFields: expect.arrayContaining(["rawPrompt"]),
      diagnosticCounts: { error: 1, warning: 0, info: 0 },
      confidence: {
        level: "low",
        score: 0
      }
    });
    expect(response.result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SPEC.UNKNOWN_FIELD",
          path: "/rawPrompt"
        })
      ])
    );
  });

  it("marks URL and archive-backed sources as needs-confirmation without fetching resources", async () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "pmtiles-delivery",
      promptHash: "sha256:pmtiles-delivery",
      traceId: "trace-pmtiles-delivery",
      targetDomains: ["feature-display"],
      sources: {
        parcels: {
          type: "pmtiles",
          url: "pmtiles://local/parcels.pmtiles"
        }
      },
      layers: [
        {
          id: "parcel-fills",
          type: "fill",
          source: "parcels"
        }
      ]
    });

    const response = await createGenerationEvidenceBundle({
      promptHash: "sha256:pmtiles-delivery",
      skeleton,
      exampleId: "pmtiles-local"
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected PMTiles delivery evidence to succeed.");
    expect(response.result.status).toBe("ready");
    expect(response.result.delivery).toMatchObject({
      status: "needs-confirmation",
      acceptance: {
        state: "needs-confirmation",
        needsConfirmation: true,
        ready: false,
        blocked: false
      },
      confirmationRequired: true,
      sourceReadiness: [
        expect.objectContaining({
          sourceId: "parcels",
          type: "pmtiles",
          state: "readiness-only",
          queryReady: false,
          confirmationReasons: ["external-resource", "archive-parsing"]
        })
      ]
    });
    expect(response.result.delivery.confirmations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reason: "external-resource",
          required: true,
          sourceIds: ["parcels"]
        }),
        expect.objectContaining({
          reason: "archive-parsing",
          required: true,
          sourceIds: ["parcels"]
        }),
        expect.objectContaining({
          reason: "file-write",
          required: false,
          target: "export_example_app manifest output"
        })
      ])
    );
    expect(response.result.exampleEvidence).toMatchObject({
      exampleId: "pmtiles-local",
      writesFiles: false,
      generationEvidence: {
        delivery: {
          status: "needs-confirmation",
          confirmationRequired: true
        }
      }
    });
  });

  it("marks extension-only scene browsing as follow-up-required without stable runtime promotion", async () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "scene-delivery",
      promptHash: "sha256:scene-delivery",
      traceId: "trace-scene-delivery",
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
    });

    const response = await createGenerationEvidenceBundle({
      promptHash: "sha256:scene-delivery",
      skeleton
    });

    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected scene delivery evidence to succeed.");
    expect(response.result.status).toBe("ready");
    expect(response.result.delivery).toMatchObject({
      status: "follow-up-required",
      acceptance: {
        state: "follow-up-required",
        followUpRequired: true,
        needsConfirmation: false,
        blocked: false
      }
    });
    expect(response.result.delivery.followUps).toContainEqual(
      expect.objectContaining({
        id: "scene-browsing.stable-runtime-gate",
        owner: "@quality-guardian",
        blockerCode: "SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED"
      })
    );
    expect(response.result.exampleEvidence.generationEvidence?.sceneBrowsing).toMatchObject({
      requested: true,
      status: "experimental",
      state: "extension-only",
      stableRuntimeBlocked: true,
      stableViewMode: false,
      runtimeSupported: false,
      stableRuntimeBlockerCodes: [
        "SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED",
        "SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED",
        "SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED"
      ]
    });
  });

  it("derives delivery-review acceptance states from structured evidence", async () => {
    const readySkeleton = createMapGenerationCommandSkeleton({
      mapId: "delivery-ready",
      promptHash: "sha256:delivery-ready",
      traceId: "trace-delivery-ready",
      targetDomains: ["feature-display"],
      sources: {
        services: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: []
          }
        }
      },
      layers: [
        {
          id: "service-points",
          type: "circle",
          source: "services"
        }
      ]
    });
    const blockedBaseSkeleton = createMapGenerationCommandSkeleton({
      mapId: "delivery-blocked",
      promptHash: "sha256:delivery-blocked",
      traceId: "trace-delivery-blocked",
      view: { zoom: 8 }
    });
    const blockedSkeleton: MapGenerationCommandSkeleton = {
      ...blockedBaseSkeleton,
      spec: {
        ...blockedBaseSkeleton.spec,
        view: {
          ...blockedBaseSkeleton.spec.view,
          zoom: 99
        }
      }
    };
    const confirmationSkeleton = createMapGenerationCommandSkeleton({
      mapId: "delivery-confirmation",
      promptHash: "sha256:delivery-confirmation",
      traceId: "trace-delivery-confirmation",
      targetDomains: ["feature-display"],
      sources: {
        parcels: {
          type: "pmtiles",
          url: "pmtiles://local/parcels.pmtiles"
        }
      },
      layers: [
        {
          id: "parcel-fills",
          type: "fill",
          source: "parcels"
        }
      ]
    });
    const followUpSkeleton = createMapGenerationCommandSkeleton({
      mapId: "delivery-follow-up",
      promptHash: "sha256:delivery-follow-up",
      traceId: "trace-delivery-follow-up",
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
    });

    const [ready, blocked, needsConfirmation, followUpRequired] = await Promise.all([
      createGenerationEvidenceBundle({
        promptHash: "sha256:delivery-ready",
        skeleton: readySkeleton
      }),
      createGenerationEvidenceBundle({
        promptHash: "sha256:delivery-blocked",
        skeleton: blockedSkeleton
      }),
      createGenerationEvidenceBundle({
        promptHash: "sha256:delivery-confirmation",
        skeleton: confirmationSkeleton
      }),
      createGenerationEvidenceBundle({
        promptHash: "sha256:delivery-follow-up",
        skeleton: followUpSkeleton
      })
    ]);

    expect(ready.ok).toBe(true);
    expect(blocked.ok).toBe(true);
    expect(needsConfirmation.ok).toBe(true);
    expect(followUpRequired.ok).toBe(true);
    if (!ready.ok || !blocked.ok || !needsConfirmation.ok || !followUpRequired.ok) {
      throw new Error("Expected delivery-review acceptance fixtures to return structured evidence.");
    }

    const section = (bundle: typeof ready.result, id: string) => bundle.delivery.sections.find((entry) => entry.id === id);

    expect(ready.result.delivery).toMatchObject({
      status: "ready",
      acceptance: {
        state: "ready",
        ready: true,
        blocked: false,
        needsConfirmation: false,
        followUpRequired: false
      },
      confirmationRequired: false,
      confirmations: expect.arrayContaining([
        expect.objectContaining({ reason: "external-resource", required: false }),
        expect.objectContaining({ reason: "file-write", required: false })
      ]),
      followUps: []
    });
    expect(section(ready.result, "readiness")).toMatchObject({
      status: "ready",
      blockerCount: 0,
      confirmationRequired: false,
      followUpCount: 0
    });
    expect(section(ready.result, "data-and-analysis")).toMatchObject({
      status: "ready",
      blockerCount: 0,
      confirmationRequired: false,
      followUpCount: 0
    });
    expect(ready.result.delivery.sourceReadiness).toContainEqual(
      expect.objectContaining({
        sourceId: "services",
        state: "supported",
        confirmationReasons: []
      })
    );

    expect(blocked.result.delivery).toMatchObject({
      status: "blocked",
      acceptance: {
        state: "blocked",
        ready: false,
        blocked: true,
        needsConfirmation: false,
        followUpRequired: false
      },
      confirmationRequired: false
    });
    expect(section(blocked.result, "readiness")).toMatchObject({
      status: "blocked",
      blockerCount: 1,
      confirmationRequired: false
    });
    expect(section(blocked.result, "map-edits")).toMatchObject({
      status: "blocked",
      blockerCount: 1
    });
    expect(blocked.result.commandEvidence).toMatchObject({
      usedApplyCommands: true,
      diagnosticCounts: { error: 1, warning: 0, info: 0 }
    });
    expect(blocked.result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "COMMAND.INVALID_PATCH",
        path: "/skeleton/spec"
      })
    );

    expect(needsConfirmation.result.delivery).toMatchObject({
      status: "needs-confirmation",
      acceptance: {
        state: "needs-confirmation",
        ready: false,
        blocked: false,
        needsConfirmation: true,
        followUpRequired: false
      },
      confirmationRequired: true,
      confirmations: expect.arrayContaining([
        expect.objectContaining({
          reason: "external-resource",
          required: true,
          sourceIds: ["parcels"]
        }),
        expect.objectContaining({
          reason: "archive-parsing",
          required: true,
          sourceIds: ["parcels"]
        })
      ])
    });
    expect(section(needsConfirmation.result, "readiness")).toMatchObject({
      status: "needs-confirmation",
      confirmationRequired: true
    });
    expect(section(needsConfirmation.result, "data-and-analysis")).toMatchObject({
      status: "needs-confirmation",
      blockerCount: 0,
      confirmationRequired: true,
      followUpCount: 1
    });
    expect(needsConfirmation.result.delivery.sourceReadiness).toContainEqual(
      expect.objectContaining({
        sourceId: "parcels",
        type: "pmtiles",
        state: "readiness-only",
        confirmationReasons: ["external-resource", "archive-parsing"]
      })
    );

    expect(followUpRequired.result.delivery).toMatchObject({
      status: "follow-up-required",
      acceptance: {
        state: "follow-up-required",
        ready: false,
        blocked: false,
        needsConfirmation: false,
        followUpRequired: true
      },
      confirmationRequired: false,
      followUps: expect.arrayContaining([
        expect.objectContaining({
          id: "scene-browsing.stable-runtime-gate",
          owner: "@quality-guardian",
          blockerCode: "SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED"
        })
      ])
    });
    expect(section(followUpRequired.result, "readiness")).toMatchObject({
      status: "follow-up-required",
      confirmationRequired: false,
      followUpCount: 1
    });
    expect(section(followUpRequired.result, "scene-browsing")).toMatchObject({
      status: "follow-up-required",
      blockerCount: 0,
      confirmationRequired: false,
      followUpCount: 1
    });
    expect(followUpRequired.result.exampleEvidence.generationEvidence?.sceneBrowsing).toMatchObject({
      requested: true,
      status: "experimental",
      state: "extension-only",
      stableRuntimeBlocked: true,
      stableViewMode: false
    });
  });

  it("keeps generation evidence schemas strict and Ajv-compilable", async () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validateInput = ajv.compile(GenerationEvidenceBundleInputSchema);
    const validateBundle = ajv.compile(GenerationEvidenceBundleSchema);
    const skeleton = createMapGenerationCommandSkeleton({ mapId: "schema-evidence" });
    const response = await createGenerationEvidenceBundle({
      promptHash: "sha256:schema-evidence",
      skeleton
    });

    expect(validateInput({ promptHash: "sha256:schema-evidence", skeleton, unexpected: true })).toBe(false);
    expect(validateInput.errors?.some((error) => error.keyword === "additionalProperties")).toBe(true);
    expect(
      validateInput({
        promptHash: "sha256:schema-evidence",
        skeleton,
        snapshot: { renderer: "scene3d" }
      })
    ).toBe(false);
    expect(validateInput.errors?.some((error) => error.instancePath === "/snapshot/renderer")).toBe(true);
    expect(response.ok).toBe(true);
    if (!response.ok) throw new Error("Expected generation evidence bundle to succeed.");
    expect(validateBundle(response.result)).toBe(true);
  });
});
