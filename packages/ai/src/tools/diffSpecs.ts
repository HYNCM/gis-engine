import {
  type Diagnostic,
  DiagnosticCodes,
  type InteractionSpec,
  type LayerSpec,
  type MapCommand,
  type MapSpec,
  type SourceSpec,
  type ViewSpec,
  validateSpec,
} from "@gis-engine/engine";
import { Ajv } from "ajv/dist/ajv.js";
import { toolInputErrorsToDiagnostics } from "./schemaDiagnostics.js";

const MapSpecInputSchema = {
  type: "object",
  properties: {
    version: { type: "string" },
    id: { type: "string" },
    revision: { type: "string" },
    view: { type: "object" },
    sources: { type: "object" },
    layers: { type: "array" },
    interactions: { type: "object" },
    metadata: { type: "object" },
    extensions: { type: "object" },
    capabilities: { type: "object" },
  },
  required: ["version", "view", "sources", "layers"],
  additionalProperties: true,
} as const;

export const DiffSpecsToolInputSchema = {
  type: "object",
  properties: {
    before: MapSpecInputSchema,
    after: MapSpecInputSchema,
    options: {
      type: "object",
      properties: {
        ignoreMetadata: { type: "boolean" },
        ignoreRevision: { type: "boolean" },
      },
      additionalProperties: false,
    },
  },
  required: ["before", "after"],
  additionalProperties: false,
} as const;

export interface DiffSpecsToolInput {
  before: MapSpec;
  after: MapSpec;
  options?: {
    ignoreMetadata?: boolean;
    ignoreRevision?: boolean;
  };
}

export interface DiffSpecsSummary {
  added: string[];
  removed: string[];
  modified: string[];
  unchanged: string[];
}

export interface DiffSpecsToolResult {
  commands: MapCommand[];
  summary: DiffSpecsSummary;
  diagnostics: Diagnostic[];
}

export type DiffSpecsToolResponse =
  | { ok: true; result: DiffSpecsToolResult; diagnostics: [] }
  | { ok: false; diagnostics: Diagnostic[] };

const ajv = new Ajv({ allErrors: true, strict: false });
const validateInput = ajv.compile(DiffSpecsToolInputSchema);

function makeCommandId(): string {
  return `diff-cmd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function diffSpecsTool(input: unknown): DiffSpecsToolResponse {
  if (!validateInput(input)) {
    return {
      ok: false,
      diagnostics: toolInputErrorsToDiagnostics(validateInput.errors, "Invalid diff_specs tool input."),
    };
  }

  const typedInput = input as DiffSpecsToolInput;
  const { before, after, options } = typedInput;
  const ignoreMetadata = options?.ignoreMetadata ?? false;
  // ignoreRevision is part of the API contract but revision differences
  // are not included in the command output (revision is auto-managed)
  const _ignoreRevision = options?.ignoreRevision ?? true;

  const diagnostics: Diagnostic[] = [];

  const beforeValidation = validateSpec(before);
  const afterValidation = validateSpec(after);

  if (!beforeValidation.valid) {
    diagnostics.push({
      severity: "warning",
      code: DiagnosticCodes.SpecInvalidType,
      message: "The 'before' spec has validation errors; diff results may be incomplete.",
      path: "/before",
    });
  }

  if (!afterValidation.valid) {
    diagnostics.push({
      severity: "warning",
      code: DiagnosticCodes.SpecInvalidType,
      message: "The 'after' spec has validation errors; diff results may be incomplete.",
      path: "/after",
    });
  }

  const summary: DiffSpecsSummary = { added: [], removed: [], modified: [], unchanged: [] };
  const commands: MapCommand[] = [];

  const beforeSources = before.sources ?? {};
  const afterSources = after.sources ?? {};
  const beforeLayers = before.layers ?? [];
  const afterLayers = after.layers ?? [];

  const sourceDiff = diffSources(beforeSources, afterSources);
  const layerDiff = diffLayers(beforeLayers, afterLayers, ignoreMetadata);

  for (const id of sourceDiff.added) summary.added.push(`source:${id}`);
  for (const id of sourceDiff.removed) summary.removed.push(`source:${id}`);
  for (const id of sourceDiff.modified) summary.modified.push(`source:${id}`);
  for (const id of sourceDiff.unchanged) summary.unchanged.push(`source:${id}`);

  for (const id of layerDiff.added) summary.added.push(`layer:${id}`);
  for (const id of layerDiff.removed) summary.removed.push(`layer:${id}`);
  for (const id of layerDiff.modified) summary.modified.push(`layer:${id}`);
  for (const id of layerDiff.unchanged) summary.unchanged.push(`layer:${id}`);

  // 1. Remove layers that are gone or modified (before removing sources)
  for (const layerId of layerDiff.removed) {
    commands.push({
      id: makeCommandId(),
      version: "0.1",
      type: "removeLayer",
      layerId,
    });
  }
  for (const layerId of layerDiff.modified) {
    commands.push({
      id: makeCommandId(),
      version: "0.1",
      type: "removeLayer",
      layerId,
    });
  }

  // 2. Remove sources that are gone or modified
  for (const sourceId of sourceDiff.removed) {
    commands.push({
      id: makeCommandId(),
      version: "0.1",
      type: "removeSource",
      sourceId,
    });
  }
  for (const sourceId of sourceDiff.modified) {
    commands.push({
      id: makeCommandId(),
      version: "0.1",
      type: "removeSource",
      sourceId,
    });
  }

  // 3. Add new/modified sources
  for (const sourceId of sourceDiff.added) {
    const source = afterSources[sourceId];
    if (source) {
      commands.push({
        id: makeCommandId(),
        version: "0.1",
        type: "addSource",
        sourceId,
        source,
      });
    }
  }
  for (const sourceId of sourceDiff.modified) {
    const source = afterSources[sourceId];
    if (source) {
      commands.push({
        id: makeCommandId(),
        version: "0.1",
        type: "addSource",
        sourceId,
        source,
      });
    }
  }

  // 4. Add new/modified layers
  for (const layerId of layerDiff.added) {
    const layer = afterLayers.find((l) => l.id === layerId);
    if (layer) {
      commands.push({
        id: makeCommandId(),
        version: "0.1",
        type: "addLayer",
        layer,
      });
    }
  }
  for (const layerId of layerDiff.modified) {
    const layer = afterLayers.find((l) => l.id === layerId);
    if (layer) {
      commands.push({
        id: makeCommandId(),
        version: "0.1",
        type: "addLayer",
        layer,
      });
    }
  }

  // 5. Reorder layers if the surviving layers have a different order
  const beforeLayerOrder = beforeLayers.filter((l) => !layerDiff.removed.includes(l.id)).map((l) => l.id);
  const afterLayerOrder = afterLayers.filter((l) => !layerDiff.added.includes(l.id)).map((l) => l.id);
  const reorderCommands = buildReorderCommands(beforeLayerOrder, afterLayerOrder);
  commands.push(...reorderCommands);

  // 6. View changes
  const viewCommands = diffView(before.view, after.view);
  commands.push(...viewCommands);

  // 7. Interaction changes
  const interactionCommands = diffInteractions(before.interactions, after.interactions);
  commands.push(...interactionCommands);

  return {
    ok: true,
    result: { commands, summary, diagnostics },
    diagnostics: [],
  };
}

interface SetDiff {
  added: string[];
  removed: string[];
  modified: string[];
  unchanged: string[];
}

function diffSources(before: Record<string, SourceSpec>, after: Record<string, SourceSpec>): SetDiff {
  const result: SetDiff = { added: [], removed: [], modified: [], unchanged: [] };
  const beforeIds = new Set(Object.keys(before));
  const afterIds = new Set(Object.keys(after));

  for (const id of afterIds) {
    if (!beforeIds.has(id)) {
      result.added.push(id);
    }
  }

  for (const id of beforeIds) {
    if (!afterIds.has(id)) {
      result.removed.push(id);
    }
  }

  for (const id of beforeIds) {
    if (afterIds.has(id)) {
      if (deepEqual(before[id], after[id])) {
        result.unchanged.push(id);
      } else {
        result.modified.push(id);
      }
    }
  }

  return result;
}

function diffLayers(before: LayerSpec[], after: LayerSpec[], ignoreMetadata: boolean): SetDiff {
  const result: SetDiff = { added: [], removed: [], modified: [], unchanged: [] };
  const beforeMap = new Map(before.map((l) => [l.id, l]));
  const afterMap = new Map(after.map((l) => [l.id, l]));

  for (const [id] of afterMap) {
    if (!beforeMap.has(id)) {
      result.added.push(id);
    }
  }

  for (const [id] of beforeMap) {
    if (!afterMap.has(id)) {
      result.removed.push(id);
    }
  }

  for (const [id, beforeLayer] of beforeMap) {
    const afterLayer = afterMap.get(id);
    if (afterLayer) {
      const a = ignoreMetadata ? stripMetadata(beforeLayer) : beforeLayer;
      const b = ignoreMetadata ? stripMetadata(afterLayer) : afterLayer;
      if (deepEqual(a, b)) {
        result.unchanged.push(id);
      } else {
        result.modified.push(id);
      }
    }
  }

  return result;
}

function stripMetadata(layer: LayerSpec): Omit<LayerSpec, "metadata"> {
  const { metadata: _metadata, ...rest } = layer;
  return rest;
}

function diffView(before: ViewSpec, after: ViewSpec): MapCommand[] {
  const viewDiff: Partial<ViewSpec> = {};
  let hasChanges = false;

  for (const key of ["mode", "center", "zoom", "bearing", "pitch", "bounds"] as Array<keyof ViewSpec>) {
    const bv = before[key];
    const av = after[key];
    if (!deepEqual(bv, av)) {
      (viewDiff as Record<string, unknown>)[key] = av;
      hasChanges = true;
    }
  }

  if (!hasChanges) return [];

  return [
    {
      id: makeCommandId(),
      version: "0.1",
      type: "setView",
      view: viewDiff,
    },
  ];
}

function diffInteractions(before: InteractionSpec | undefined, after: InteractionSpec | undefined): MapCommand[] {
  if (deepEqual(before, after)) return [];
  if (!after) return [];

  return [
    {
      id: makeCommandId(),
      version: "0.1",
      type: "setInteractions",
      interactions: after,
    },
  ];
}

function buildReorderCommands(beforeOrder: string[], afterOrder: string[]): MapCommand[] {
  if (beforeOrder.length === 0) return [];
  if (deepEqual(beforeOrder, afterOrder)) return [];

  // Only reorder layers that exist in both orders
  const commonBefore = beforeOrder.filter((id) => afterOrder.includes(id));
  const commonAfter = afterOrder.filter((id) => beforeOrder.includes(id));

  if (deepEqual(commonBefore, commonAfter)) return [];

  const commands: MapCommand[] = [];
  const currentOrder = [...commonBefore];

  for (let i = 0; i < commonAfter.length; i++) {
    const targetId = commonAfter[i];
    if (!targetId) continue;
    const currentIndex = currentOrder.indexOf(targetId);
    if (currentIndex !== i) {
      const beforeLayerId = i > 0 ? commonAfter[i - 1] : undefined;
      commands.push({
        id: makeCommandId(),
        version: "0.1",
        type: "reorderLayer",
        layerId: targetId,
        ...(beforeLayerId ? { beforeLayerId } : {}),
      });
      // Update current order
      currentOrder.splice(currentIndex, 1);
      currentOrder.splice(i, 0, targetId);
    }
  }

  return commands;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return a === b;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj).sort();
    const bKeys = Object.keys(bObj).sort();
    if (!deepEqual(aKeys, bKeys)) return false;
    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
  }
  return false;
}
