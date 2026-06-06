import { DiagnosticCodes, type MapSpec, type SceneView3DExtension, validateSpec } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import { defaultSceneResourceLoadPolicy, validateSceneResourceLoadPlan } from "../../packages/scene3d/src/index.js";
import scene3dExtensionSpec from "../fixtures/specs/valid/scene3d-extension.map.json";

describe("SceneView3D loader resource policy", () => {
  it("accepts a loader resource plan that stays within SceneResourcePolicy budgets", () => {
    const report = validateSceneResourceLoadPlan(scene3dExtension(), {
      workerCount: 1,
      resources: [
        {
          kind: "tileset-json",
          sourceId: "city-tiles",
          url: "./data/city/tileset.json",
          byteLength: 512_000,
          elapsedMs: 120,
        },
        {
          kind: "model",
          sourceId: "station-model",
          url: "./data/models/station.glb",
          byteLength: 1_048_576,
          elapsedMs: 300,
        },
        { kind: "texture", sourceId: "station-model", textureCount: 4, textureBytes: 2_097_152 },
        { kind: "worker", workerCount: 1 },
      ],
    });

    expect(report.valid).toBe(true);
    expect(report.diagnostics).toEqual([]);
    expect(report.policy.maxWorkers).toBe(2);
    expect(report.policy.maxTilesetJsonBytes).toBe(1_048_576);
    expect(report.totals).toEqual({
      tilesetJsonBytes: 512_000,
      modelBytes: 1_048_576,
      textureCount: 4,
      textureBytes: 2_097_152,
      workers: 2,
      timedOutResources: 0,
    });
  });

  it("returns structured diagnostics for loader-level SceneResourcePolicy failures", () => {
    const extension = scene3dExtension();
    extension.resourcePolicy = {
      ...extension.resourcePolicy,
      maxTilesetJsonBytes: 100,
      maxModelBytes: 200,
      maxTextureCount: 1,
      maxTextureBytes: 300,
      maxWorkers: 1,
      timeoutMs: 50,
    };

    const report = validateSceneResourceLoadPlan(extension, {
      workerCount: 1,
      resources: [
        { kind: "tileset-json", sourceId: "city-tiles", url: "./data/city/tileset.json", byteLength: 101 },
        { kind: "model", sourceId: "station-model", url: "./data/models/station.glb", byteLength: 201, elapsedMs: 51 },
        { kind: "texture", sourceId: "station-model", textureCount: 2, textureBytes: 301 },
        { kind: "worker", workerCount: 1 },
        { kind: "draco-mesh", sourceId: "station-model", url: "./data/models/station.drc" },
        { kind: "model", sourceId: "missing-model", url: "./data/models/missing.glb", byteLength: 10 },
      ],
    });

    expect(report.valid).toBe(false);
    expect(report.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: DiagnosticCodes.SecurityResourceTooLarge,
          path: "/extensions/scene3d/sources/city-tiles/url",
        }),
        expect.objectContaining({
          code: DiagnosticCodes.SecurityResourceTooLarge,
          path: "/extensions/scene3d/sources/station-model/url",
        }),
        expect.objectContaining({
          code: DiagnosticCodes.SecurityResourceTimeout,
          path: "/extensions/scene3d/sources/station-model/url",
        }),
        expect.objectContaining({
          code: DiagnosticCodes.SecurityResourceTooLarge,
          path: "/extensions/scene3d/resourcePolicy/maxTextureCount",
        }),
        expect.objectContaining({
          code: DiagnosticCodes.SecurityResourceTooLarge,
          path: "/extensions/scene3d/resourcePolicy/maxTextureBytes",
        }),
        expect.objectContaining({
          code: DiagnosticCodes.SecurityResourceTooLarge,
          path: "/extensions/scene3d/resourcePolicy/maxWorkers",
        }),
        expect.objectContaining({
          code: DiagnosticCodes.SecurityUnsupportedAssetType,
          path: "/extensions/scene3d/sources/station-model/url",
        }),
        expect.objectContaining({
          code: DiagnosticCodes.SourceNotFound,
          path: "/extensions/scene3d/sources/missing-model/url",
        }),
      ]),
    );
  });

  it("uses conservative default budgets when the extension omits optional policy fields", () => {
    const extension = scene3dExtension();
    extension.resourcePolicy = { allowRelativeUrls: true };

    const report = validateSceneResourceLoadPlan(extension, { resources: [] });

    expect(report.valid).toBe(true);
    expect(report.policy).toEqual(defaultSceneResourceLoadPolicy);
  });

  it("requires external renderer asset URLs to pass SceneView3D resource policy before loader evidence is accepted", () => {
    const spec = scene3dSpec();
    const scene = spec.extensions?.scene3d!;
    scene.sources!["city-tiles"]!.url = "https://cdn.example.com/city/tileset.json";
    scene.sources!["station-model"]!.url = "https://assets.example.com/models/station.glb";

    const blocked = validateSpec(spec);

    expect(blocked.valid).toBe(false);
    expect(blocked.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: DiagnosticCodes.SecurityUrlBlocked,
          path: "/extensions/scene3d/sources/city-tiles/url",
        }),
        expect.objectContaining({
          code: DiagnosticCodes.SecurityUrlBlocked,
          path: "/extensions/scene3d/sources/station-model/url",
        }),
      ]),
    );

    scene.resourcePolicy!.allowedHosts = ["cdn.example.com", "assets.example.com"];
    const allowlisted = validateSpec(spec);

    expect(allowlisted.diagnostics).not.toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.SecurityUrlBlocked,
        path: "/extensions/scene3d/sources/city-tiles/url",
      }),
    );
    expect(allowlisted.diagnostics).not.toContainEqual(
      expect.objectContaining({
        code: DiagnosticCodes.SecurityUrlBlocked,
        path: "/extensions/scene3d/sources/station-model/url",
      }),
    );
  });
});

function scene3dExtension(): SceneView3DExtension {
  return structuredClone(scene3dExtensionSpec.extensions.scene3d) as SceneView3DExtension;
}

function scene3dSpec(): MapSpec {
  return structuredClone(scene3dExtensionSpec) as MapSpec;
}
