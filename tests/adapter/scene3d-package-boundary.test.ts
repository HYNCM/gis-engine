import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import scene3dExtensionSpec from "../fixtures/specs/valid/scene3d-extension.map.json";
import { explainScene3DScaffold, getScene3DV1Capabilities, scene3dPackageBoundary } from "../../packages/scene3d/src/index.js";
import type { SceneView3DExtension } from "@gis-engine/engine";

describe("SceneView3D package boundary", () => {
  it("exposes v1 3D capabilities without claiming stable runtime support", () => {
    const capabilities = getScene3DV1Capabilities();

    expect(capabilities.renderer).toBe("scene3d");
    expect(capabilities.dimensions).toEqual(["3d"]);
    expect(capabilities.sources).toEqual(["terrain-raster-dem", "3d-tiles", "gltf"]);
    expect(capabilities.layers).toEqual(["terrain", "tileset3d", "model"]);
    expect(capabilities.experimental).toEqual(["sceneview3d-v1"]);
    expect(scene3dPackageBoundary.stableViewMode).toBe(false);
  });

  it("keeps the scaffold explicit until a renderer package exists", () => {
    const report = explainScene3DScaffold(scene3dExtensionSpec.extensions.scene3d as SceneView3DExtension);

    expect(report.supported).toBe(false);
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "info",
        code: "CAPABILITY.UNSUPPORTED",
        path: "/extensions/scene3d"
      })
    );
  });

  it("does not introduce 3D renderer dependencies into the core package", () => {
    const enginePackage = readPackageJson("packages/engine/package.json");
    const scene3dPackage = readPackageJson("packages/scene3d/package.json");
    const forbidden = scene3dPackageBoundary.forbiddenCoreDependencies;

    for (const dependency of forbidden) {
      expect(enginePackage.dependencies ?? {}).not.toHaveProperty(dependency);
      expect(enginePackage.devDependencies ?? {}).not.toHaveProperty(dependency);
      expect(scene3dPackage.dependencies ?? {}).not.toHaveProperty(dependency);
    }
  });
});

function readPackageJson(path: string) {
  return JSON.parse(readFileSync(resolve(path), "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
}
