import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import type { SceneView3DExtension } from "@gis-engine/engine";
import { describe, expect, it } from "vitest";
import {
  explainScene3DScaffold,
  getScene3DV1Capabilities,
  scene3dPackageBoundary,
} from "../../packages/scene3d/src/index.js";
import scene3dExtensionSpec from "../fixtures/specs/valid/scene3d-extension.map.json";

const rendererDependencies = [
  "three",
  "cesium",
  "3d-tiles-renderer",
  "@loaders.gl/3d-tiles",
  "@loaders.gl/gltf",
  "@loaders.gl/core",
  "three-stdlib",
];

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
        path: "/extensions/scene3d",
      }),
    );
  });

  it("does not introduce 3D renderer dependencies into the core package", () => {
    const enginePackage = readPackageJson("packages/engine/package.json");
    const scene3dPackage = readPackageJson("packages/scene3d/package.json");
    const forbidden = new Set([...scene3dPackageBoundary.forbiddenCoreDependencies, ...rendererDependencies]);

    for (const dependency of forbidden) {
      expect(
        packageDependencyNames(enginePackage),
        `packages/engine/package.json must not depend on ${dependency}`,
      ).not.toContain(dependency);
      expect(
        packageDependencyNames(scene3dPackage),
        `packages/scene3d/package.json must not depend on ${dependency}`,
      ).not.toContain(dependency);
    }
  });

  it("keeps renderer implementation imports out of engine and scene3d source", () => {
    const rendererModule =
      "(?:three|cesium|3d-tiles-renderer|@loaders\\.gl/(?:3d-tiles|gltf|core)|three-stdlib)(?:/[^\"']*)?";
    const importPatterns = [
      new RegExp(`\\bfrom\\s+["']${rendererModule}["']`),
      new RegExp(`\\bimport\\s+["']${rendererModule}["']`),
      new RegExp(`\\bimport\\s*\\(\\s*["']${rendererModule}["']\\s*\\)`),
    ];

    for (const sourcePath of sourceFiles("packages/engine/src", "packages/scene3d/src")) {
      const source = readFileSync(sourcePath, "utf8");
      for (const importPattern of importPatterns) {
        expect(source, sourcePath).not.toMatch(importPattern);
      }
    }
  });
});

function readPackageJson(path: string) {
  return JSON.parse(readFileSync(resolve(path), "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
  };
}

function packageDependencyNames(packageJson: {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}): string[] {
  return [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
    ...Object.keys(packageJson.optionalDependencies ?? {}),
  ];
}

function sourceFiles(...roots: string[]): string[] {
  const files: string[] = [];

  for (const root of roots.map((path) => resolve(path))) {
    for (const entry of readdirSync(root)) {
      const entryPath = resolve(root, entry);
      const stats = statSync(entryPath);
      if (stats.isDirectory()) {
        files.push(...sourceFiles(entryPath));
      } else if (/\.[cm]?tsx?$/.test(entryPath)) {
        files.push(entryPath);
      }
    }
  }

  return files;
}
