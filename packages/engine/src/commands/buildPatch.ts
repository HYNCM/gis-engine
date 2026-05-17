import { DiagnosticCodes } from "../diagnostics/codes.js";
import type { Diagnostic, JsonPatchOperation, MapCommand, MapCommandBase, MapSpec, SuggestedFix } from "../types.js";
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
