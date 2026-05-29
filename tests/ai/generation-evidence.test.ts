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
