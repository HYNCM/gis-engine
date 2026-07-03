import {
  applyCommands,
  type Diagnostic,
  DiagnosticCodes,
  type Expression,
  type JsonValue,
  type LayerSpec,
  type MapCommand,
  type MapSpec,
  MapSpecSchema,
  type ValidationReport,
  validateSpec,
} from "@gis-engine/engine";
import { Ajv } from "ajv/dist/ajv.js";
import { toolInputErrorsToDiagnostics } from "./schemaDiagnostics.js";

export const EditSpecToolInputSchema = {
  type: "object",
  properties: {
    spec: MapSpecSchema,
    instruction: { type: "string", minLength: 1, description: "Natural language edit instruction" },
  },
  required: ["spec", "instruction"],
  additionalProperties: false,
} as const;

export interface EditSpecToolInput {
  spec: MapSpec;
  instruction: string;
}

export interface EditSpecToolResult {
  spec: MapSpec;
  commands: MapCommand[];
  diagnostics: Diagnostic[];
  summary: string;
}

export type EditSpecToolResponse =
  | { ok: true; result: EditSpecToolResult; diagnostics: [] }
  | { ok: false; diagnostics: Diagnostic[] };

const ajv = new Ajv({ allErrors: true, strict: false });
const validateInput = ajv.compile(EditSpecToolInputSchema);

interface ParsedInstruction {
  commands: MapCommand[];
  summary: string;
}

export function editSpecTool(input: unknown): EditSpecToolResponse {
  if (!validateInput(input)) {
    return {
      ok: false,
      diagnostics: toolInputErrorsToDiagnostics(validateInput.errors, "Invalid edit_spec tool input."),
    };
  }

  const typedInput = input as EditSpecToolInput;
  const inputValidation = validateSpec(typedInput.spec);
  if (hasErrorDiagnostics(inputValidation)) {
    return {
      ok: false,
      diagnostics: validationFailureDiagnostics(inputValidation, "Input spec is invalid."),
    };
  }

  const parsed = parseInstruction(typedInput.instruction, typedInput.spec);

  if (!parsed) {
    return {
      ok: false,
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.CommandInvalidPatch,
          message: `Could not parse instruction: "${typedInput.instruction}"`,
          path: "/instruction",
        },
      ],
    };
  }

  if (parsed.commands.length === 0) {
    return {
      ok: false,
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.CommandInvalidPatch,
          message: `Could not parse instruction: "${typedInput.instruction}"`,
          path: "/instruction",
        },
      ],
    };
  }

  const result = applyCommands(typedInput.spec, parsed.commands);
  const commandDiagnostics = result.results.flatMap((commandResult) => commandResult.diagnostics);
  const hasError = commandDiagnostics.some((diagnostic) => diagnostic.severity === "error");

  if (hasError) {
    return {
      ok: false,
      diagnostics: commandDiagnostics,
    };
  }

  const validation: ValidationReport = validateSpec(result.spec);
  if (hasErrorDiagnostics(validation)) {
    return {
      ok: false,
      diagnostics: validationFailureDiagnostics(validation, "Edited spec is invalid."),
    };
  }

  return {
    ok: true,
    result: {
      spec: result.spec,
      commands: parsed.commands,
      diagnostics: validation.diagnostics,
      summary: parsed.summary,
    },
    diagnostics: [],
  };
}

function hasErrorDiagnostics(validation: ValidationReport): boolean {
  return !validation.valid || validation.diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

function validationFailureDiagnostics(validation: ValidationReport, message: string): Diagnostic[] {
  if (validation.diagnostics.length > 0) return validation.diagnostics;
  return [
    {
      severity: "error",
      code: DiagnosticCodes.SpecInvalidType,
      message,
      path: "/spec",
    },
  ];
}

function createCommandIdFactory(seed: string): () => string {
  const prefix = stableHash(seed);
  let sequence = 0;
  return () => `edit-${prefix}-${sequence++}`;
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function parseInstruction(instruction: string, spec: MapSpec): ParsedInstruction | null {
  const trimmed = instruction.trim();
  const nextCommandId = createCommandIdFactory(trimmed);

  const removeLayerMatch = /^(?:remove|delete)\s+(?:layer\s+)?(?:"([^"]+)"|(\S+))$/i.exec(trimmed);
  if (removeLayerMatch) {
    const layerId = removeLayerMatch[1] ?? removeLayerMatch[2];
    if (!layerId) return null;
    return {
      commands: [
        {
          id: nextCommandId(),
          version: "0.1",
          type: "removeLayer",
          layerId,
        },
      ],
      summary: `Removed layer "${layerId}".`,
    };
  }

  const addLayerMatch =
    /^add\s+(?:(a|an)\s+)?(background|raster|fill|line|circle|symbol|symbol-lite|fill-extrusion-lite|heatmap)(?:\s+layer)?(?:\s+(?:"([^"]+)"|(\S+)))?(?:\s+for\s+source\s+(?:"([^"]+)"|(\S+)))?$/i.exec(
      trimmed,
    );
  if (addLayerMatch) {
    const layerType = addLayerMatch[2] as
      | "background"
      | "raster"
      | "fill"
      | "line"
      | "circle"
      | "symbol"
      | "symbol-lite"
      | "fill-extrusion-lite"
      | "heatmap";
    const layerId = addLayerMatch[3] ?? addLayerMatch[4] ?? `${layerType}-${spec.layers.length}`;
    const sourceId = addLayerMatch[5] ?? addLayerMatch[6];

    const layer: LayerSpec = {
      id: layerId,
      type: layerType,
      ...(layerType !== "background" && sourceId ? { source: sourceId } : {}),
      ...(layerType === "heatmap"
        ? {
            paint: {
              "heatmap-weight": ["coalesce", ["get", "intensity"], 1],
              "heatmap-intensity": 1,
              "heatmap-radius": 24,
              "heatmap-opacity": 0.8,
            },
          }
        : {}),
      ...(layerType === "symbol" || layerType === "symbol-lite"
        ? {
            layout: { "text-field": ["get", "name"] },
            paint: { "text-color": "#111827" },
          }
        : {}),
    };

    return {
      commands: [
        {
          id: nextCommandId(),
          version: "0.1",
          type: "addLayer",
          layer,
        },
      ],
      summary: `Added ${layerType} layer "${layerId}"${sourceId ? ` for source "${sourceId}"` : ""}.`,
    };
  }

  const setLayoutMatch =
    /^(?:set)\s+(?:"([^"]+)"|(\S+))\s+(text-field|text-font|text-size|text-anchor|text-allow-overlap|text-ignore-placement|symbol-placement|icon-image|icon-size|icon-allow-overlap|visibility)\s+(?:to\s+)(.+)$/i.exec(
      trimmed,
    );
  if (setLayoutMatch) {
    const layerId = setLayoutMatch[1] ?? setLayoutMatch[2];
    const property = setLayoutMatch[3];
    const rawValue = setLayoutMatch[4];
    if (!layerId || !property || !rawValue) return null;
    const value = parseValue(rawValue.trim());

    return {
      commands: [
        {
          id: nextCommandId(),
          version: "0.1",
          type: "setLayout",
          layerId,
          layout: { [property]: value },
        },
      ],
      summary: `Set ${layerId} ${property} layout to ${JSON.stringify(value)}.`,
    };
  }

  const setPaintMatch =
    /^(?:change|set)\s+(?:"([^"]+)"|(\S+))\s+(fill-color|line-color|circle-color|fill-opacity|line-width|circle-radius|fill-outline-color|background-color|raster-opacity|circle-opacity|circle-stroke-color|circle-stroke-width|line-opacity|line-dasharray)\s+(?:to\s+)(.+)$/i.exec(
      trimmed,
    );
  if (setPaintMatch) {
    const layerId = setPaintMatch[1] ?? setPaintMatch[2];
    const property = setPaintMatch[3];
    const rawValue = setPaintMatch[4];
    if (!layerId || !property || !rawValue) return null;
    const value = parseValue(rawValue.trim());

    return {
      commands: [
        {
          id: nextCommandId(),
          version: "0.1",
          type: "setPaint",
          layerId,
          paint: { [property]: value },
        },
      ],
      summary: `Set ${layerId} ${property} to ${JSON.stringify(value)}.`,
    };
  }

  const setFilterMatch1 =
    /^add\s+filter\s+to\s+(?:"([^"]+)"|(\S+)):\s*(.+)$/i.exec(trimmed) ??
    /^filter\s+(?:"([^"]+)"|(\S+))\s+where\s+(.+)$/i.exec(trimmed);
  if (setFilterMatch1) {
    const layerId = setFilterMatch1[1] ?? setFilterMatch1[2];
    const filterExpression = setFilterMatch1[3];
    if (!layerId || !filterExpression) return null;

    const filter = parseFilterExpression(filterExpression.trim());
    return {
      commands: [
        {
          id: nextCommandId(),
          version: "0.1",
          type: "setFilter",
          layerId,
          filter,
        },
      ],
      summary: `Set filter on layer "${layerId}".`,
    };
  }

  const setCenterMatch = /^set\s+center\s+to\s+\[?\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*\]?$/i.exec(trimmed);
  if (setCenterMatch) {
    const lon = Number.parseFloat(setCenterMatch[1] ?? "");
    const lat = Number.parseFloat(setCenterMatch[2] ?? "");
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;

    return {
      commands: [
        {
          id: nextCommandId(),
          version: "0.1",
          type: "setView",
          view: { center: [lon, lat] },
        },
      ],
      summary: `Set view center to [${lon}, ${lat}].`,
    };
  }

  const setZoomMatch = /^set\s+zoom\s+to\s+([-+]?\d*\.?\d+)$/i.exec(trimmed);
  if (setZoomMatch) {
    const zoom = Number.parseFloat(setZoomMatch[1] ?? "");
    if (!Number.isFinite(zoom)) return null;

    return {
      commands: [
        {
          id: nextCommandId(),
          version: "0.1",
          type: "setView",
          view: { zoom },
        },
      ],
      summary: `Set view zoom to ${zoom}.`,
    };
  }

  const renameSourceMatch = /^rename\s+source\s+(?:"([^"]+)"|(\S+))\s+to\s+(?:"([^"]+)"|(\S+))$/i.exec(trimmed);
  if (renameSourceMatch) {
    const oldId = renameSourceMatch[1] ?? renameSourceMatch[2];
    const newId = renameSourceMatch[3] ?? renameSourceMatch[4];
    if (!oldId || !newId) return null;

    const source = spec.sources[oldId];
    if (!source) return null;

    const commands: MapCommand[] = [
      {
        id: nextCommandId(),
        version: "0.1",
        type: "addSource",
        sourceId: newId,
        source,
      },
    ];

    for (const layer of spec.layers) {
      if (layer.source === oldId) {
        commands.push({
          id: nextCommandId(),
          version: "0.1",
          type: "removeLayer",
          layerId: layer.id,
        });
        commands.push({
          id: nextCommandId(),
          version: "0.1",
          type: "addLayer",
          layer: { ...layer, source: newId },
        });
      }
    }

    commands.push({
      id: nextCommandId(),
      version: "0.1",
      type: "removeSource",
      sourceId: oldId,
    });

    return {
      commands,
      summary: `Renamed source "${oldId}" to "${newId}".`,
    };
  }

  return null;
}

function parseValue(raw: string): unknown {
  const trimmed = raw.replace(/^["']|["']$/g, "");

  if (/^-?\d+$/.test(trimmed)) {
    const num = Number.parseInt(trimmed, 10);
    if (Number.isFinite(num)) return num;
  }

  if (/^-?\d*\.\d+$/.test(trimmed)) {
    const num = Number.parseFloat(trimmed);
    if (Number.isFinite(num)) return num;
  }

  if (/^true$/i.test(trimmed)) return true;
  if (/^false$/i.test(trimmed)) return false;
  if (/^null$/i.test(trimmed)) return null;

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

function parseFilterExpression(raw: string): Expression {
  const eqMatch = /^(\S+)\s+equals?\s+(.+)$/i.exec(raw);
  if (eqMatch) {
    const field = eqMatch[1] ?? "";
    const value = parseValue((eqMatch[2] ?? "").trim());
    return ["==", ["get", field], value] as JsonValue[] as Expression;
  }

  const neqMatch = /^(\S+)\s+not\s+equals?\s+(.+)$/i.exec(raw);
  if (neqMatch) {
    const field = neqMatch[1] ?? "";
    const value = parseValue((neqMatch[2] ?? "").trim());
    return ["!=", ["get", field], value] as JsonValue[] as Expression;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Expression;
  } catch {
    // fall through
  }

  return ["==", ["get", raw], true] as JsonValue[] as Expression;
}
