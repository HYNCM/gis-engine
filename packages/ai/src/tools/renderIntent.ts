import {
  type ApplyCommandsResult,
  applyCommands,
  type Diagnostic,
  DiagnosticCodes,
  type MapCommand,
  type MapSpec,
} from "@gis-engine/engine";

/**
 * Structured rendering intent — the bridge between AI provider output
 * and the GIS Engine command system.
 *
 * Modeled after the Google Maps Agentic UI Toolkit pattern:
 * an LLM produces a structured intent, and renderIntent()
 * deterministically converts it into engine commands and applies them.
 */
export interface RenderIntent {
  action: string;
  layerId?: string | null;
  paint?: Record<string, unknown> | null;
  layout?: Record<string, unknown> | null;
  filter?: unknown;
  view?: {
    center?: [number, number];
    zoom?: number;
    bearing?: number;
    pitch?: number;
  } | null;
  bounds?: [number, number, number, number];
  layer?: {
    id?: string;
    type?: string;
    source?: string;
    paint?: Record<string, unknown>;
    layout?: Record<string, unknown>;
    filter?: unknown;
  } | null;
  minzoom?: number;
  maxzoom?: number;
  beforeLayerId?: string;
  sourceId?: string;
  source?: Record<string, unknown>;
  interactions?: Record<string, boolean>;
  capabilities?: Record<string, unknown>;
}

export interface RenderIntentOptions {
  /** Apply commands as dry-run (no spec mutation). */
  dryRun?: boolean;
  /** Transaction mode. */
  transaction?: "atomic" | "best-effort";
  /** Collect command trace. */
  collectTrace?: boolean;
  /** Trace ID for audit. */
  traceId?: string;
}

export interface RenderIntentResult {
  ok: boolean;
  spec: MapSpec;
  commands: MapCommand[];
  applyResult?: ApplyCommandsResult;
  diagnostics: Diagnostic[];
  /** Number of paths changed. */
  changedPathCount: number;
}

/**
 * Convert a structured AI rendering intent into MapCommands,
 * apply them to the given MapSpec, and return the result.
 *
 * This is the core Agentic Bridge function: it enables an LLM
 * to directly manipulate the map state through a deterministic,
 * auditable command pipeline.
 */
export function renderIntent(
  spec: MapSpec,
  intent: RenderIntent,
  options: RenderIntentOptions = {},
): RenderIntentResult {
  const commands = intentToCommands(intent, spec);

  if (commands.length === 0) {
    return {
      ok: false,
      spec,
      commands: [],
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.CommandUnsupported,
          message: `Unable to convert action "${intent.action}" into engine commands.`,
          path: "/",
        },
      ],
      changedPathCount: 0,
    };
  }

  const applyResult = applyCommands(spec, commands, {
    dryRun: options.dryRun ?? false,
    ...(options.transaction ? { transaction: options.transaction } : {}),
    ...(options.collectTrace ? { collectTrace: true } : {}),
    ...(options.traceId ? { traceId: options.traceId } : {}),
  });

  const allDiagnostics = applyResult.results.flatMap((result) => result.diagnostics);
  const hasErrors = allDiagnostics.some((diagnostic) => diagnostic.severity === "error");
  const changedPathCount = applyResult.results.reduce(
    (total, result) => total + (result.status === "applied" ? result.changedPaths.length : 0),
    0,
  );

  return {
    ok: !hasErrors,
    spec: applyResult.spec,
    commands,
    applyResult,
    diagnostics: allDiagnostics,
    changedPathCount,
  };
}

/**
 * Convert a RenderIntent into an array of MapCommands.
 * Each action type maps to one or more engine commands.
 */
function intentToCommands(intent: RenderIntent, _spec: MapSpec): MapCommand[] {
  const commands: MapCommand[] = [];
  const commandId = () => `intent-${Date.now().toString(36)}-${commands.length}`;

  switch (intent.action) {
    case "setPaint": {
      if (!intent.layerId || !intent.paint) break;
      commands.push({
        id: commandId(),
        version: "0.1",
        type: "setPaint",
        layerId: intent.layerId,
        paint: intent.paint,
      });
      break;
    }

    case "setLayout": {
      if (!intent.layerId || !intent.layout) break;
      commands.push({
        id: commandId(),
        version: "0.1",
        type: "setLayout",
        layerId: intent.layerId,
        layout: intent.layout,
      });
      break;
    }

    case "setFilter": {
      if (!intent.layerId) break;
      const filterValue = intent.filter ?? null;
      commands.push({
        id: commandId(),
        version: "0.1",
        type: "setFilter",
        layerId: intent.layerId,
        filter: filterValue as MapCommand extends { type: "setFilter"; filter: infer F } ? F : never,
      });
      break;
    }

    case "setLayerZoomRange": {
      if (!intent.layerId || intent.minzoom === undefined || intent.maxzoom === undefined) break;
      commands.push({
        id: commandId(),
        version: "0.1",
        type: "setLayerZoomRange",
        layerId: intent.layerId,
        minzoom: intent.minzoom,
        maxzoom: intent.maxzoom,
      });
      break;
    }

    case "setView": {
      if (!intent.view) break;
      commands.push({
        id: commandId(),
        version: "0.1",
        type: "setView",
        view: intent.view,
      });
      break;
    }

    case "fitBounds": {
      if (intent.bounds?.length !== 4) break;
      commands.push({
        id: commandId(),
        version: "0.1",
        type: "fitBounds",
        bounds: intent.bounds,
      });
      break;
    }

    case "addLayer": {
      if (!intent.layer?.id || !intent.layer?.type) break;
      const layerSpec: Record<string, unknown> = {
        id: intent.layer.id,
        type: intent.layer.type,
      };
      if (intent.layer.source) layerSpec.source = intent.layer.source;
      if (intent.layer.paint) layerSpec.paint = intent.layer.paint;
      if (intent.layer.layout) layerSpec.layout = intent.layer.layout;
      if (intent.layer.filter !== undefined && intent.layer.filter !== null) layerSpec.filter = intent.layer.filter;
      commands.push({
        id: commandId(),
        version: "0.1",
        type: "addLayer",
        layer: layerSpec as unknown as MapSpec["layers"][number],
        ...(intent.beforeLayerId ? { beforeLayerId: intent.beforeLayerId } : {}),
      });
      break;
    }

    case "removeLayer": {
      if (!intent.layerId) break;
      commands.push({
        id: commandId(),
        version: "0.1",
        type: "removeLayer",
        layerId: intent.layerId,
      });
      break;
    }

    case "addSource": {
      if (!intent.sourceId || !intent.source) break;
      commands.push({
        id: commandId(),
        version: "0.1",
        type: "addSource",
        sourceId: intent.sourceId,
        source: intent.source as unknown as MapSpec["sources"][string],
      });
      break;
    }

    case "removeSource": {
      if (!intent.sourceId) break;
      commands.push({
        id: commandId(),
        version: "0.1",
        type: "removeSource",
        sourceId: intent.sourceId,
      });
      break;
    }

    case "reorderLayer": {
      if (!intent.layerId) break;
      commands.push({
        id: commandId(),
        version: "0.1",
        type: "reorderLayer",
        layerId: intent.layerId,
        ...(intent.beforeLayerId ? { beforeLayerId: intent.beforeLayerId } : {}),
      });
      break;
    }

    case "setInteractions": {
      if (!intent.interactions) break;
      commands.push({
        id: commandId(),
        version: "0.1",
        type: "setInteractions",
        interactions: intent.interactions as NonNullable<MapSpec["interactions"]>,
      });
      break;
    }

    case "setCapabilities": {
      if (!intent.capabilities) break;
      commands.push({
        id: commandId(),
        version: "0.1",
        type: "setCapabilities",
        capabilities: intent.capabilities as NonNullable<MapSpec["capabilities"]>,
      });
      break;
    }

    default:
      break;
  }

  return commands;
}
