import { DiagnosticCodes } from "../diagnostics/codes.js";
import type { Diagnostic, JsonPatchOperation, MapCommand, MapCommandBase, MapSpec, SceneView3DExtension, SuggestedFix } from "../types.js";
import { joinPath } from "../spec/patch/index.js";

export interface BuildPatchResult {
  patch: JsonPatchOperation[];
  diagnostics: Diagnostic[];
  skipped?: boolean;
}

type BuildFailureDiagnostic = Omit<Diagnostic, "severity">;

export function buildPatch(command: MapCommand, spec: MapSpec): BuildPatchResult {
  switch (command.type) {
    case "addSource":
      if (spec.sources[command.sourceId]) {
        return { patch: [], diagnostics: [], skipped: true };
      }
      return {
        patch: [{ op: "add", path: joinPath("sources", command.sourceId), value: command.source }],
        diagnostics: []
      };

    case "removeSource":
      if (!spec.sources[command.sourceId]) {
        return failed({
          code: DiagnosticCodes.SourceNotFound,
          message: `Source "${command.sourceId}" does not exist.`,
          path: "/sourceId",
          relatedResources: [{ kind: "source", id: command.sourceId }],
          fix: manualFix("Check the source id or skip this removeSource command when the source is already absent.", "high")
        });
      }
      return { patch: [{ op: "remove", path: joinPath("sources", command.sourceId) }], diagnostics: [] };

    case "addLayer": {
      if (spec.layers.some((layer) => layer.id === command.layer.id)) {
        return { patch: [], diagnostics: [], skipped: true };
      }
      const insertIndex = command.beforeLayerId ? spec.layers.findIndex((layer) => layer.id === command.beforeLayerId) : spec.layers.length;
      if (insertIndex < 0) {
        return missingBeforeLayer(command.beforeLayerId, "Add the anchor layer first, or omit beforeLayerId to append the new layer.");
      }
      return { patch: [{ op: "add", path: `/layers/${insertIndex}`, value: command.layer }], diagnostics: [] };
    }

    case "removeLayer": {
      const index = spec.layers.findIndex((layer) => layer.id === command.layerId);
      if (index < 0) return missingLayer(command.layerId, "/layerId", "Check the layer id or skip this removeLayer command when the layer is already absent.");
      return { patch: [{ op: "remove", path: `/layers/${index}` }], diagnostics: [] };
    }

    case "setPaint": {
      const index = spec.layers.findIndex((layer) => layer.id === command.layerId);
      if (index < 0) return missingLayer(command.layerId, "/layerId", "Add the layer before setting paint, or update layerId to an existing layer.");
      const layer = spec.layers[index];
      if (!layer) return missingLayer(command.layerId, "/layerId", "Add the layer before setting paint, or update layerId to an existing layer.");
      return { patch: patchRecordMerge(`/layers/${index}/paint`, layer.paint, command.paint), diagnostics: [] };
    }

    case "setLayout": {
      const index = spec.layers.findIndex((layer) => layer.id === command.layerId);
      if (index < 0) return missingLayer(command.layerId, "/layerId", "Add the layer before setting layout, or update layerId to an existing layer.");
      const layer = spec.layers[index];
      if (!layer) return missingLayer(command.layerId, "/layerId", "Add the layer before setting layout, or update layerId to an existing layer.");
      return { patch: patchRecordMerge(`/layers/${index}/layout`, layer.layout, command.layout), diagnostics: [] };
    }

    case "setView":
      return { patch: [{ op: "replace", path: "/view", value: { ...spec.view, ...command.view } }], diagnostics: [] };

    case "setCapabilities":
      return {
        patch: [{ op: spec.capabilities ? "replace" : "add", path: "/capabilities", value: command.capabilities }],
        diagnostics: []
      };

    case "setInteractions":
      return {
        patch: [{ op: spec.interactions ? "replace" : "add", path: "/interactions", value: command.interactions }],
        diagnostics: []
      };

    case "fitBounds":
      return {
        patch: [
          {
            op: "replace",
            path: "/view",
            value: omitUndefined({
              mode: spec.view.mode,
              bearing: spec.view.bearing,
              pitch: spec.view.pitch,
              bounds: command.bounds
            })
          }
        ],
        diagnostics: []
      };

    case "reorderLayer":
      return reorderLayer(command.layerId, command.beforeLayerId, spec);

    case "setSceneCamera":
      return setSceneCamera(command.camera, spec);

    case "addSceneSource":
      return addSceneSource(command.sourceId, command.source, spec);

    case "removeSceneSource":
      return removeSceneSource(command.sourceId, spec);

    case "addSceneLayer":
      return addSceneLayer(command.layer, spec);

    case "removeSceneLayer":
      return removeSceneLayer(command.layerId, spec);

    case "setSceneLayerVisibility":
      return setSceneLayerVisibility(command.layerId, command.visible, spec);

    default:
      return failed({
        code: DiagnosticCodes.CommandUnsupported,
        message: `Unsupported command "${(command as MapCommandBase).type}".`,
        path: "/type",
        relatedResources: [{ kind: "command", id: (command as MapCommandBase).id }],
        fix: manualFix("Use one of the registered v0.1 command types.", "medium")
      });
  }
}

function setSceneCamera(camera: SceneView3DExtension["camera"], spec: MapSpec): BuildPatchResult {
  const scene = getSceneExtension(spec);
  if (!spec.extensions) {
    return {
      patch: [{ op: "add", path: "/extensions", value: { scene3d: { camera } } }],
      diagnostics: []
    };
  }
  if (!scene) {
    return {
      patch: [{ op: "add", path: "/extensions/scene3d", value: { camera } }],
      diagnostics: []
    };
  }
  return {
    patch: [{ op: Object.hasOwn(scene, "camera") ? "replace" : "add", path: "/extensions/scene3d/camera", value: camera }],
    diagnostics: []
  };
}

function addSceneSource(sourceId: string, source: NonNullable<SceneView3DExtension["sources"]>[string], spec: MapSpec): BuildPatchResult {
  const scene = getSceneExtension(spec);
  if (!scene) return missingSceneExtension("Run setSceneCamera before adding SceneView3D sources.");
  if (scene.sources?.[sourceId]) return { patch: [], diagnostics: [], skipped: true };

  if (!scene.sources) {
    return {
      patch: [{ op: "add", path: "/extensions/scene3d/sources", value: { [sourceId]: source } }],
      diagnostics: []
    };
  }

  return {
    patch: [{ op: "add", path: joinPath("extensions", "scene3d", "sources", sourceId), value: source }],
    diagnostics: []
  };
}

function removeSceneSource(sourceId: string, spec: MapSpec): BuildPatchResult {
  const scene = getSceneExtension(spec);
  if (!scene?.sources?.[sourceId]) {
    return failed({
      code: DiagnosticCodes.SourceNotFound,
      message: `Scene source "${sourceId}" does not exist.`,
      path: "/sourceId",
      relatedResources: [{ kind: "source", id: sourceId }],
      fix: manualFix("Check the scene source id or skip this removeSceneSource command when the source is already absent.", "high")
    });
  }
  if (scene.layers?.some((layer) => layer.source === sourceId)) {
    return failed({
      code: DiagnosticCodes.LayerSourceIncompatible,
      message: `Scene source "${sourceId}" is still referenced by one or more scene layers.`,
      path: "/sourceId",
      relatedResources: [{ kind: "source", id: sourceId }],
      fix: manualFix("Remove or retarget scene layers before removing this scene source.", "high")
    });
  }
  return { patch: [{ op: "remove", path: joinPath("extensions", "scene3d", "sources", sourceId) }], diagnostics: [] };
}

function addSceneLayer(layer: NonNullable<SceneView3DExtension["layers"]>[number], spec: MapSpec): BuildPatchResult {
  const scene = getSceneExtension(spec);
  if (!scene) return missingSceneExtension("Run setSceneCamera before adding SceneView3D layers.");
  if (!scene.sources?.[layer.source]) {
    return failed({
      code: DiagnosticCodes.SourceNotFound,
      message: `Scene layer "${layer.id}" references missing scene source "${layer.source}".`,
      path: "/layer/source",
      relatedResources: [
        { kind: "layer", id: layer.id },
        { kind: "source", id: layer.source }
      ],
      fix: manualFix("Add the scene source before adding this scene layer.", "high")
    });
  }
  if (scene.layers?.some((candidate) => candidate.id === layer.id)) return { patch: [], diagnostics: [], skipped: true };

  if (!scene.layers) {
    return { patch: [{ op: "add", path: "/extensions/scene3d/layers", value: [layer] }], diagnostics: [] };
  }

  return { patch: [{ op: "add", path: `/extensions/scene3d/layers/${scene.layers.length}`, value: layer }], diagnostics: [] };
}

function removeSceneLayer(layerId: string, spec: MapSpec): BuildPatchResult {
  const scene = getSceneExtension(spec);
  const index = scene?.layers?.findIndex((layer) => layer.id === layerId) ?? -1;
  if (index < 0) return missingLayer(layerId, "/layerId", "Check the scene layer id or skip this removeSceneLayer command when the layer is already absent.");
  return { patch: [{ op: "remove", path: `/extensions/scene3d/layers/${index}` }], diagnostics: [] };
}

function setSceneLayerVisibility(layerId: string, visible: boolean, spec: MapSpec): BuildPatchResult {
  const scene = getSceneExtension(spec);
  const index = scene?.layers?.findIndex((layer) => layer.id === layerId) ?? -1;
  if (index < 0) {
    return missingLayer(layerId, "/layerId", "Add the scene layer before setting visibility, or update layerId to an existing scene layer.");
  }
  const layer = scene?.layers?.[index];
  if (!layer) {
    return missingLayer(layerId, "/layerId", "Add the scene layer before setting visibility, or update layerId to an existing scene layer.");
  }
  return {
    patch: [{ op: Object.hasOwn(layer, "visible") ? "replace" : "add", path: `/extensions/scene3d/layers/${index}/visible`, value: visible }],
    diagnostics: []
  };
}

function getSceneExtension(spec: MapSpec): SceneView3DExtension | undefined {
  const scene = spec.extensions?.scene3d;
  return scene && typeof scene === "object" && !Array.isArray(scene) ? (scene as SceneView3DExtension) : undefined;
}

function missingSceneExtension(fixMessage: string): BuildPatchResult {
  return failed({
    code: DiagnosticCodes.SpecMissingField,
    message: "SceneView3D extension is missing.",
    path: "/extensions/scene3d",
    relatedResources: [{ kind: "schema", id: "sceneview3d" }],
    fix: manualFix(fixMessage, "high")
  });
}

function reorderLayer(layerId: string, beforeLayerId: string | undefined, spec: MapSpec): BuildPatchResult {
  const fromIndex = spec.layers.findIndex((layer) => layer.id === layerId);
  if (fromIndex < 0) return missingLayer(layerId, "/layerId", "Add the layer before reordering it, or update layerId to an existing layer.");
  if (beforeLayerId === layerId) return { patch: [], diagnostics: [], skipped: true };

  const layer = spec.layers[fromIndex];
  if (!layer) return missingLayer(layerId, "/layerId", "Add the layer before reordering it, or update layerId to an existing layer.");
  const remainingLayers = spec.layers.filter((candidate) => candidate.id !== layerId);
  const toIndex = beforeLayerId ? remainingLayers.findIndex((candidate) => candidate.id === beforeLayerId) : remainingLayers.length;
  if (toIndex < 0) return missingBeforeLayer(beforeLayerId, "Use an existing beforeLayerId, or omit beforeLayerId to move the layer to the end.");

  const nextLayers = [...remainingLayers.slice(0, toIndex), layer, ...remainingLayers.slice(toIndex)];
  if (hasSameLayerOrder(spec.layers, nextLayers)) return { patch: [], diagnostics: [], skipped: true };

  return {
    patch: [
      { op: "remove", path: `/layers/${fromIndex}` },
      { op: "add", path: `/layers/${toIndex}`, value: layer }
    ],
    diagnostics: []
  };
}

function hasSameLayerOrder(current: MapSpec["layers"], next: MapSpec["layers"]): boolean {
  return current.length === next.length && current.every((layer, index) => layer.id === next[index]?.id);
}

function patchRecordMerge(path: string, current: Record<string, unknown> | undefined, next: Record<string, unknown>): JsonPatchOperation[] {
  if (!current) return [{ op: "add", path, value: next }];
  return Object.entries(next).map(([key, value]) => ({
    op: Object.hasOwn(current, key) ? "replace" : "add",
    path: `${path}/${escapePathSegment(key)}`,
    value
  }));
}

function escapePathSegment(segment: string): string {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}

function omitUndefined<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined));
}

function missingLayer(layerId: string, path: string, fixMessage: string): BuildPatchResult {
  return failed({
    code: DiagnosticCodes.LayerNotFound,
    message: `Layer "${layerId}" does not exist.`,
    path,
    relatedResources: [{ kind: "layer", id: layerId }],
    fix: manualFix(fixMessage, "high")
  });
}

function missingBeforeLayer(layerId: string | undefined, fixMessage: string): BuildPatchResult {
  return missingLayer(layerId ?? "unknown", "/beforeLayerId", fixMessage);
}

function manualFix(message: string, confidence: SuggestedFix["confidence"]): SuggestedFix {
  return {
    kind: "manual",
    confidence,
    message
  };
}

function failed(diagnostic: BuildFailureDiagnostic): BuildPatchResult {
  return {
    patch: [],
    diagnostics: [{ severity: "error", ...diagnostic }]
  };
}
