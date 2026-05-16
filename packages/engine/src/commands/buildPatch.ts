import { DiagnosticCodes } from "../diagnostics/codes.js";
import type { Diagnostic, JsonPatchOperation, MapCommand, MapSpec } from "../types.js";
import { joinPath } from "../spec/patch/index.js";

export interface BuildPatchResult {
  patch: JsonPatchOperation[];
  diagnostics: Diagnostic[];
  skipped?: boolean;
}

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
      if (!spec.sources[command.sourceId]) return failed(DiagnosticCodes.SourceNotFound, `Source "${command.sourceId}" does not exist.`);
      return { patch: [{ op: "remove", path: joinPath("sources", command.sourceId) }], diagnostics: [] };

    case "addLayer": {
      if (spec.layers.some((layer) => layer.id === command.layer.id)) {
        return { patch: [], diagnostics: [], skipped: true };
      }
      const index = command.beforeLayerId ? spec.layers.findIndex((layer) => layer.id === command.beforeLayerId) : spec.layers.length;
      const insertIndex = index >= 0 ? index : spec.layers.length;
      return { patch: [{ op: "add", path: `/layers/${insertIndex}`, value: command.layer }], diagnostics: [] };
    }

    case "removeLayer": {
      const index = spec.layers.findIndex((layer) => layer.id === command.layerId);
      if (index < 0) return failed(DiagnosticCodes.LayerNotFound, `Layer "${command.layerId}" does not exist.`);
      return { patch: [{ op: "remove", path: `/layers/${index}` }], diagnostics: [] };
    }

    case "setPaint": {
      const index = spec.layers.findIndex((layer) => layer.id === command.layerId);
      if (index < 0) return failed(DiagnosticCodes.LayerNotFound, `Layer "${command.layerId}" does not exist.`);
      const layer = spec.layers[index];
      if (!layer) return failed(DiagnosticCodes.LayerNotFound, `Layer "${command.layerId}" does not exist.`);
      return { patch: patchRecordMerge(`/layers/${index}/paint`, layer.paint, command.paint), diagnostics: [] };
    }

    case "setLayout": {
      const index = spec.layers.findIndex((layer) => layer.id === command.layerId);
      if (index < 0) return failed(DiagnosticCodes.LayerNotFound, `Layer "${command.layerId}" does not exist.`);
      const layer = spec.layers[index];
      if (!layer) return failed(DiagnosticCodes.LayerNotFound, `Layer "${command.layerId}" does not exist.`);
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
      return failed(DiagnosticCodes.CommandUnsupported, `Unsupported command "${(command as { type: string }).type}".`);
  }
}

function reorderLayer(layerId: string, beforeLayerId: string | undefined, spec: MapSpec): BuildPatchResult {
  const fromIndex = spec.layers.findIndex((layer) => layer.id === layerId);
  if (fromIndex < 0) return failed(DiagnosticCodes.LayerNotFound, `Layer "${layerId}" does not exist.`);

  const layer = spec.layers[fromIndex];
  if (!layer) return failed(DiagnosticCodes.LayerNotFound, `Layer "${layerId}" does not exist.`);
  const remainingLayers = spec.layers.filter((candidate) => candidate.id !== layerId);
  const beforeIndex = beforeLayerId ? remainingLayers.findIndex((candidate) => candidate.id === beforeLayerId) : remainingLayers.length;
  const toIndex = beforeIndex >= 0 ? beforeIndex : remainingLayers.length;

  return {
    patch: [
      { op: "remove", path: `/layers/${fromIndex}` },
      { op: "add", path: `/layers/${toIndex}`, value: layer }
    ],
    diagnostics: []
  };
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

function failed(code: Diagnostic["code"], message: string): BuildPatchResult {
  return {
    patch: [],
    diagnostics: [{ severity: "error", code, message }]
  };
}
