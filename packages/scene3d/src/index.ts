import { DiagnosticCodes, type CapabilityReport, type Diagnostic, type SceneView3DExtension } from "@gis-engine/engine";

export const scene3dPackageBoundary = {
  packageName: "@gis-engine/scene3d",
  status: "scaffold",
  stableViewMode: false,
  forbiddenCoreDependencies: ["cesium", "three", "@loaders.gl/3d-tiles", "@loaders.gl/gltf", "three-stdlib"]
} as const;

export type Scene3DPackageBoundary = typeof scene3dPackageBoundary;

export function getScene3DV1Capabilities(): CapabilityReport {
  return {
    renderer: "scene3d",
    dimensions: ["3d"],
    sources: ["terrain-raster-dem", "3d-tiles", "gltf"],
    layers: ["terrain", "tileset3d", "model"],
    expressions: [],
    queries: ["pick", "bbox3d"],
    snapshot: {
      supported: true,
      formats: ["png", "data-url"]
    },
    experimental: ["sceneview3d-v1"]
  };
}

export interface Scene3DScaffoldReport {
  supported: false;
  extension: SceneView3DExtension;
  diagnostics: Diagnostic[];
}

export function explainScene3DScaffold(extension: SceneView3DExtension): Scene3DScaffoldReport {
  return {
    supported: false,
    extension,
    diagnostics: [
      {
        severity: "info",
        code: DiagnosticCodes.CapabilityUnsupported,
        message: "SceneView3D schema and package boundary exist, but the 3D renderer runtime is not implemented yet.",
        path: "/extensions/scene3d",
        fix: {
          kind: "manual",
          confidence: "medium",
          message: "Keep SceneView3D data under extensions.scene3d until the v1 renderer package passes resource, snapshot, and query gates."
        }
      }
    ]
  };
}
