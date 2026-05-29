import { describe, expect, it } from "vitest";
import {
  createMapGenerationCommandSkeleton,
  MapGenerationCommandSkeletonSchema,
  MapGenerationRequestSchema,
  validateSpec,
  type MapGenerationRequestFromSchema
} from "@gis-engine/engine";
import Ajv from "ajv";

describe("map generation command skeleton contract", () => {
  it("turns feature-display generation input into auditable commands and a valid MapSpec", () => {
    const request: MapGenerationRequestFromSchema = {
      mapId: "nla-city-services",
      promptHash: "sha256:nla-city-services",
      createdAt: "2026-05-29T00:00:00.000Z",
      traceId: "trace-nla-city-services",
      targetDomains: ["feature-display", "spatial-analysis"],
      capabilities: {
        dimensions: ["2d"],
        renderer: "maplibre"
      },
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
      ],
      interactions: {
        hover: true,
        click: true,
        popup: true
      }
    };

    const skeleton = createMapGenerationCommandSkeleton(request);

    expect(skeleton.status).toBe("ready");
    expect(skeleton.traceId).toBe("trace-nla-city-services");
    expect(skeleton.commands.map((command) => command.type)).toEqual([
      "setCapabilities",
      "setView",
      "addSource",
      "addLayer",
      "setInteractions"
    ]);
    expect(skeleton.commands.every((command) => command.sourcePromptHash === "sha256:nla-city-services")).toBe(true);
    expect(skeleton.spec.id).toBe("nla-city-services");
    expect(skeleton.spec.revision).toBe("5");
    expect(skeleton.spec.sources.services?.type).toBe("geojson");
    expect(skeleton.spec.layers.map((layer) => layer.id)).toEqual(["service-points"]);
    expect(skeleton.spec.interactions).toMatchObject({ click: true, popup: true });
    expect(validateSpec(skeleton.spec).valid).toBe(true);
    expect(skeleton.diagnostics).toEqual([
      expect.objectContaining({
        severity: "warning",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/targetDomains"
      })
    ]);
  });

  it("blocks stable scene3d runtime requests instead of generating stable view commands", () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "bad-scene",
      targetDomains: ["scene-browsing"],
      view: { mode: "scene3d" },
      capabilities: {
        dimensions: ["3d"],
        renderer: "scene3d"
      }
    });

    expect(skeleton.status).toBe("blocked");
    expect(skeleton.commands).toEqual([]);
    expect(skeleton.spec.view.mode).toBe("map2d");
    expect(skeleton.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "CAPABILITY.UNSUPPORTED",
          blockerCode: "SCENE3D.STABLE_RUNTIME_VIEW_MODE_BLOCKED",
          path: "/view/mode"
        }),
        expect.objectContaining({
          code: "CAPABILITY.UNSUPPORTED",
          blockerCode: "SCENE3D.STABLE_RUNTIME_RENDERER_BLOCKED",
          path: "/capabilities/renderer"
        }),
        expect.objectContaining({
          code: "CAPABILITY.UNSUPPORTED",
          blockerCode: "SCENE3D.STABLE_RUNTIME_DIMENSIONS_BLOCKED",
          path: "/capabilities/dimensions"
        })
      ])
    );
  });

  it("turns generation style edits into setPaint and setLayout commands", () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "nla-style-edits",
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

    expect(skeleton.status).toBe("ready");
    expect(skeleton.commands.map((command) => command.type)).toEqual(["addSource", "addLayer", "setPaint", "setLayout"]);
    expect(skeleton.spec.layers[0]?.paint).toEqual({
      "fill-color": "#22c55e",
      "fill-opacity": 0.45
    });
    expect(skeleton.spec.layers[0]?.layout).toEqual({
      visibility: "visible"
    });
  });

  it("blocks unsupported spatial-analysis operations with stable diagnostics", () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "blocked-analysis",
      targetDomains: ["spatial-analysis"],
      analysis: {
        operations: ["point-query", "buffer", "routing"]
      }
    });

    expect(skeleton.status).toBe("blocked");
    expect(skeleton.commands).toEqual([]);
    expect(skeleton.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "error",
          code: "CAPABILITY.UNSUPPORTED",
          path: "/analysis/operations/1"
        }),
        expect.objectContaining({
          severity: "error",
          code: "CAPABILITY.UNSUPPORTED",
          path: "/analysis/operations/2"
        })
      ])
    );
  });

  it("keeps scene browsing generation under extensions.scene3d command evidence", () => {
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "scene-extension-only",
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

    expect(skeleton.status).toBe("ready");
    expect(skeleton.commands.map((command) => command.type)).toEqual(["setSceneCamera", "addSceneSource", "addSceneLayer"]);
    expect(skeleton.spec.view.mode).toBe("map2d");
    expect(skeleton.spec.extensions?.scene3d).toMatchObject({
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
    });
  });

  it("exposes generation schemas that reject unknown fields and validate results", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validateRequest = ajv.compile(MapGenerationRequestSchema);
    const validateSkeleton = ajv.compile(MapGenerationCommandSkeletonSchema);
    const skeleton = createMapGenerationCommandSkeleton({
      mapId: "schema-check",
      sources: {},
      layers: []
    });

    expect(validateRequest({ mapId: "schema-check", unexpected: true })).toBe(false);
    expect(validateRequest.errors?.some((error) => error.keyword === "additionalProperties")).toBe(true);
    expect(validateSkeleton(skeleton)).toBe(true);
  });
});
