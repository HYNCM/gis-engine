import {
  type ApplyCommandsResult,
  applyCommands,
  type MapCommand,
  type MapSpec,
  validateSpec,
} from "@gis-engine/engine";

export interface ProviderOutput {
  action: string;
  layerId?: string | null;
  paint?: Record<string, unknown> | null;
  layout?: Record<string, unknown> | null;
  filter?: unknown;
  view?: { center: [number, number]; zoom: number } | null;
  bounds?: [number, number, number, number];
  layer?: Record<string, unknown> | null;
  minzoom?: number;
  maxzoom?: number;
  beforeLayerId?: string;
  message?: string | null;
  confidence?: { score: number; level: string };
}

export interface StudioCommandApplyResult {
  nextSpec: Record<string, unknown>;
  status: string;
  diagnostics: Array<Record<string, unknown>>;
  evidence: Record<string, unknown>;
}

const BASEMAP_SOURCE_ID = "basemap";
const BASEMAP_LAYER_ID = "basemap-layer";
const BASEMAP_BACKGROUND_LAYER_ID = "basemap-background";
const TILE_PROXY_PREFIX = "/api/tiles";

const BASEMAPS: Record<
  string,
  {
    tiles?: string[];
    attribution?: string;
    maxzoom?: number;
    backgroundColor?: string;
  }
> = {
  none: { backgroundColor: "#020617" },
  osm: {
    tiles: [`${TILE_PROXY_PREFIX}/osm/{z}/{x}/{y}.png`],
    attribution: "© OpenStreetMap contributors",
    maxzoom: 19,
  },
  "arcgis-imagery": {
    tiles: [`${TILE_PROXY_PREFIX}/arcgis-imagery/{z}/{x}/{y}.jpg`],
    attribution: "Esri, Maxar, Earthstar Geographics",
    maxzoom: 23,
  },
  "bing-aerial": {
    tiles: [`${TILE_PROXY_PREFIX}/bing-aerial/{z}/{x}/{y}.jpeg`],
    attribution: "© Microsoft Bing",
    maxzoom: 19,
  },
};

export function applyProviderOutput(spec: Record<string, unknown>, output: ProviderOutput): StudioCommandApplyResult {
  if (output.action === "unsupported") {
    return {
      nextSpec: spec,
      status: "blocked",
      diagnostics: [
        {
          code: "STUDIO.MAPLIBRE_CAPABILITY_UNSUPPORTED",
          severity: "error",
          path: "/providerOutput/action",
          message:
            output.message ||
            "The requested MapLibre capability is known, but Studio does not have a safe command contract for it yet.",
        },
      ],
      evidence: emptyCommandEvidence(),
    };
  }

  const validation = validateSpec(spec as MapSpec);
  if (!validation.valid) {
    return {
      nextSpec: spec,
      status: "blocked",
      diagnostics: validation.diagnostics,
      evidence: emptyCommandEvidence(),
    };
  }

  const commands = providerOutputToCommands(output, spec as MapSpec);
  if (commands.length === 0) {
    return {
      nextSpec: spec,
      status: "ready",
      diagnostics: [],
      evidence: emptyCommandEvidence(),
    };
  }

  const result = applyCommands(spec as MapSpec, commands, {
    collectTrace: true,
    traceId: `studio.serverless.${Date.now()}`,
  });
  const failed = result.results.some((entry) => entry.status === "failed");
  return {
    nextSpec: result.committed && !result.rolledBack ? result.spec : spec,
    status: failed ? "blocked" : result.committed ? "applied" : "ready",
    diagnostics: result.results.flatMap((entry) => entry.diagnostics || []),
    evidence: commandEvidence(result),
  };
}

export function emptyCommandEvidence(): Record<string, unknown> {
  return {
    commandCount: 0,
    committed: false,
    rolledBack: false,
    failed: false,
    changedPathCount: 0,
  };
}

function providerOutputToCommands(output: ProviderOutput, spec: MapSpec): MapCommand[] {
  switch (output.action) {
    case "setPaint":
      return output.layerId && output.paint
        ? [studioCommand("setPaint", "provider-set-paint", { layerId: output.layerId, paint: output.paint })]
        : [];
    case "setLayout": {
      const layout = output.layout ?? output.paint;
      return output.layerId && layout
        ? [studioCommand("setLayout", "provider-set-layout", { layerId: output.layerId, layout })]
        : [];
    }
    case "setFilter":
      return output.layerId
        ? [
            studioCommand("setFilter", "provider-set-filter", {
              layerId: output.layerId,
              filter: output.filter ?? null,
            }),
          ]
        : [];
    case "setLayerZoomRange":
      return output.layerId && Number.isFinite(output.minzoom) && Number.isFinite(output.maxzoom)
        ? [
            studioCommand("setLayerZoomRange", "provider-set-zoom-range", {
              layerId: output.layerId,
              minzoom: output.minzoom,
              maxzoom: output.maxzoom,
            }),
          ]
        : [];
    case "setView":
      return output.view ? [studioCommand("setView", "provider-set-view", { view: output.view })] : [];
    case "addLayer":
      return output.layer?.id && output.layer?.type
        ? [studioCommand("addLayer", "provider-add-layer", { layer: output.layer })]
        : [];
    case "removeLayer":
      return output.layerId ? [studioCommand("removeLayer", "provider-remove-layer", { layerId: output.layerId })] : [];
    case "reorderLayer":
      return output.layerId
        ? [
            studioCommand("reorderLayer", "provider-reorder-layer", {
              layerId: output.layerId,
              beforeLayerId: output.beforeLayerId,
            }),
          ]
        : [];
    case "fitBounds":
      return Array.isArray(output.bounds) && output.bounds.length === 4
        ? [studioCommand("fitBounds", "provider-fit-bounds", { bounds: output.bounds })]
        : [];
    case "setBasemap":
      return buildBasemapCommands(normalizeBasemapId(output.layerId || "none"), spec);
    case "reset":
      return buildBasemapCommands("none", spec);
    default:
      return [];
  }
}

function buildBasemapCommands(basemapId: string, spec: MapSpec): MapCommand[] {
  const basemap = BASEMAPS[basemapId] || BASEMAPS.none;
  const commands: MapCommand[] = [];

  if (spec.layers.some((layer) => layer.id === BASEMAP_LAYER_ID)) {
    commands.push(studioCommand("removeLayer", "basemap-remove-raster-layer", { layerId: BASEMAP_LAYER_ID }));
  }
  if (spec.layers.some((layer) => layer.id === BASEMAP_BACKGROUND_LAYER_ID)) {
    commands.push(
      studioCommand("removeLayer", "basemap-remove-background-layer", { layerId: BASEMAP_BACKGROUND_LAYER_ID }),
    );
  }
  if (spec.sources[BASEMAP_SOURCE_ID]) {
    commands.push(studioCommand("removeSource", "basemap-remove-source", { sourceId: BASEMAP_SOURCE_ID }));
  }

  const beforeLayerId = spec.layers.find(
    (layer) => layer.id !== BASEMAP_LAYER_ID && layer.id !== BASEMAP_BACKGROUND_LAYER_ID,
  )?.id;

  if (basemap.tiles) {
    commands.push(
      studioCommand("addSource", "basemap-add-source", {
        sourceId: BASEMAP_SOURCE_ID,
        source: {
          type: "raster",
          tiles: basemap.tiles,
          tileSize: 256,
          attribution: basemap.attribution,
          minzoom: 0,
          maxzoom: basemap.maxzoom ?? 19,
        },
      }),
    );
    commands.push(
      studioCommand("addLayer", "basemap-add-raster-layer", {
        layer: {
          id: BASEMAP_LAYER_ID,
          type: "raster",
          source: BASEMAP_SOURCE_ID,
        },
        beforeLayerId,
      }),
    );
    return commands;
  }

  commands.push(
    studioCommand("addLayer", "basemap-add-background-layer", {
      layer: {
        id: BASEMAP_BACKGROUND_LAYER_ID,
        type: "background",
        paint: {
          "background-color": basemap.backgroundColor || "#020617",
        },
      },
      beforeLayerId,
    }),
  );
  return commands;
}

function studioCommand(type: MapCommand["type"], idPart: string, body: Record<string, unknown>): MapCommand {
  return {
    id: `studio-${idPart}`,
    version: "0.1",
    type,
    author: { type: "agent", id: "studio" },
    ...body,
  } as MapCommand;
}

function commandEvidence(result: ApplyCommandsResult): Record<string, unknown> {
  const failed = result.results.some((entry) => entry.status === "failed");
  return {
    commandCount: result.results.length,
    committed: result.committed || false,
    rolledBack: result.rolledBack || false,
    failed,
    changedPathCount: result.results.reduce((count, entry) => count + (entry.changedPaths?.length || 0), 0),
    traceId: result.traceId,
    results: result.results.map((entry) => ({
      commandId: entry.commandId,
      status: entry.status,
      changedPathCount: entry.changedPaths.length,
    })),
  };
}

function normalizeBasemapId(value: string): string {
  const raw = value.toLowerCase().trim();
  if (raw === "osm" || raw === "openstreetmap" || raw === "open-street-map") return "osm";
  if (raw === "arcgis" || raw === "esri" || raw === "satellite" || raw === "imagery" || raw === "arcgis-imagery")
    return "arcgis-imagery";
  if (raw === "bing" || raw === "bing-aerial" || raw === "bing-maps") return "bing-aerial";
  if (raw === "none" || raw === "no-basemap" || raw === "no basemap") return "none";
  return BASEMAPS[raw] ? raw : "none";
}
