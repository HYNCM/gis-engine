#!/usr/bin/env node

/**
 * AI Map Studio Server
 *
 * Production-ready server combining:
 * - GIS Engine command execution
 * - Mock AI + DeepSeek provider support
 * - SQLite map persistence
 * - Static SPA serving (production mode)
 *
 * Usage:
 *   node apps/studio/server/index.mjs
 *   STUDIO_DB_PATH=./data/maps.db node apps/studio/server/index.mjs
 */

import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { appendAuditRecord, STUDIO_AUDIT_RECORD_CAP } from "./audit.mjs";
import { createReviewDecision, STUDIO_REVIEW_DECISION_CAP } from "./review-decisions.mjs";

const provider = await import("./provider.mjs");
const maplibreCapabilities = await import("./maplibre-capabilities.mjs");

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");
const PUBLIC_DIR = join(__dirname, "..", "dist");
const _require = createRequire(import.meta.url);

const HOST = process.env.HOST || "127.0.0.1";
const PORT = parseInt(process.env.PORT || "4321", 10);

async function loadEngine() {
  const enginePath = join(ROOT, "packages/engine/dist/src/index.js");
  return import(enginePath);
}

async function _loadAi() {
  const aiPath = join(ROOT, "packages/ai/dist/index.js");
  return import(aiPath);
}

const store = await import("./store.mjs");

export function buildProviders(env = process.env) {
  const deepseekKey = env.DEEPSEEK_API_KEY?.trim();
  return [
    { id: "mock-ai", label: "Mock AI", protocol: "mock", enabled: true },
    {
      id: "deepseek",
      label: "DeepSeek",
      protocol: "openai-chat-completions",
      baseUrl: env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com",
      model: env.DEEPSEEK_MODEL?.trim() || "deepseek-v4-flash",
      enabled: Boolean(deepseekKey),
      missingCredential: !deepseekKey,
    },
  ];
}

export function publicProviderProfiles(profiles = buildProviders()) {
  return profiles.map((profile) => ({
    id: profile.id,
    label: profile.label,
    protocol: profile.protocol,
    ...(profile.model ? { model: profile.model } : {}),
    enabled: profile.enabled,
    missingCredential: Boolean(profile.missingCredential),
  }));
}

const MIME = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
]);

function sendJson(res, payload, status = 200) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

const TILE_PROXY_PREFIX = "/api/tiles";

export const BASEMAPS = {
  none: {
    id: "none",
    label: "No basemap",
    backgroundColor: "#020617",
  },
  osm: {
    id: "osm",
    label: "OSM Standard",
    tileProvider: "osm",
    tiles: [`${TILE_PROXY_PREFIX}/osm/{z}/{x}/{y}.png`],
    attribution: "© OpenStreetMap contributors",
    maxzoom: 19,
  },
  "arcgis-imagery": {
    id: "arcgis-imagery",
    label: "ArcGIS World Imagery",
    tileProvider: "arcgis-imagery",
    tiles: [`${TILE_PROXY_PREFIX}/arcgis-imagery/{z}/{x}/{y}.jpg`],
    attribution: "Esri, Maxar, Earthstar Geographics",
    maxzoom: 23,
  },
  "bing-aerial": {
    id: "bing-aerial",
    label: "Bing Aerial",
    tileProvider: "bing-aerial",
    tiles: [`${TILE_PROXY_PREFIX}/bing-aerial/{z}/{x}/{y}.jpeg`],
    attribution: "© Microsoft Bing",
    requiresEnv: "BING_MAPS_KEY",
    maxzoom: 19,
  },
};

export const DEFAULT_BASEMAP = "none";
const BASEMAP_SOURCE_ID = "basemap";
const BASEMAP_LAYER_ID = "basemap-layer";
const BASEMAP_BACKGROUND_LAYER_ID = "basemap-background";
const POINTS_LAYER_ID = "points-layer";

export function publicBasemapOptions() {
  return Object.entries(BASEMAPS).map(([id, basemap]) => {
    const availability = basemapAvailability(id);
    return {
      id,
      label: basemap.label,
      enabled: availability.enabled,
      missingCredential: availability.missingCredential || undefined,
      tileProvider: basemap.tileProvider,
    };
  });
}

export function detectBasemapFromSpec(spec) {
  const basemapTiles = spec?.sources?.[BASEMAP_SOURCE_ID]?.tiles;
  const firstTile = Array.isArray(basemapTiles) && typeof basemapTiles[0] === "string" ? basemapTiles[0] : "";
  if (firstTile.includes("/api/tiles/osm/")) return "osm";
  if (firstTile.includes("/api/tiles/arcgis-imagery/")) return "arcgis-imagery";
  if (firstTile.includes("/api/tiles/bing-aerial/")) return "bing-aerial";
  const backgroundLayer = Array.isArray(spec?.layers)
    ? spec.layers.find((layer) => layer?.id === BASEMAP_BACKGROUND_LAYER_ID)
    : null;
  if (backgroundLayer?.type === "background") return "none";
  return DEFAULT_BASEMAP;
}

function normalizeBasemapId(value) {
  const raw = typeof value === "string" ? value.toLowerCase().trim() : "";
  if (raw === "osm" || raw === "openstreetmap" || raw === "open-street-map") {
    return "osm";
  }
  if (raw === "arcgis" || raw === "esri" || raw === "satellite" || raw === "imagery" || raw === "arcgis-imagery") {
    return "arcgis-imagery";
  }
  if (raw === "bing" || raw === "bing-aerial" || raw === "bing-maps") {
    return "bing-aerial";
  }
  if (raw === "none" || raw === "no-basemap" || raw === "no basemap") {
    return "none";
  }
  return BASEMAPS[raw] ? raw : DEFAULT_BASEMAP;
}

function basemapAvailability(basemapId) {
  const basemap = BASEMAPS[basemapId] || BASEMAPS[DEFAULT_BASEMAP];
  if (basemap.requiresEnv && !process.env[basemap.requiresEnv]?.trim()) {
    return { enabled: false, missingCredential: basemap.requiresEnv };
  }
  return { enabled: true };
}

function basemapUnavailableResult(spec, basemapId) {
  const basemap = BASEMAPS[basemapId] || BASEMAPS[DEFAULT_BASEMAP];
  const availability = basemapAvailability(basemapId);
  const missing = availability.missingCredential;
  return {
    status: "blocked",
    nextSpec: spec,
    diagnostics: [
      {
        code: missing ? "STUDIO.BASEMAP_CREDENTIAL_REQUIRED" : "STUDIO.BASEMAP_UNAVAILABLE",
        severity: "error",
        path: "/basemap",
        message: missing
          ? `${basemap.label} requires ${missing} before Studio can proxy its tiles.`
          : `${basemap.label} is not available.`,
        fix: missing
          ? {
              kind: "manual",
              confidence: "high",
              message: `Set ${missing} on the Studio server, then retry the basemap change.`,
            }
          : undefined,
      },
    ],
    evidence: emptyCommandEvidence(),
  };
}

export function createInitialSpec(basemapId = DEFAULT_BASEMAP) {
  const basemap = BASEMAPS[normalizeBasemapId(basemapId)] || BASEMAPS[DEFAULT_BASEMAP];
  const basemapSources = basemap.tiles
    ? {
        [BASEMAP_SOURCE_ID]: {
          type: "raster",
          tiles: basemap.tiles,
          tileSize: 256,
          attribution: basemap.attribution,
          minzoom: 0,
          maxzoom: basemap.maxzoom ?? 19,
        },
      }
    : {};
  const basemapLayer = basemap.tiles
    ? {
        id: BASEMAP_LAYER_ID,
        type: "raster",
        source: BASEMAP_SOURCE_ID,
      }
    : {
        id: BASEMAP_BACKGROUND_LAYER_ID,
        type: "background",
        paint: {
          "background-color": basemap.backgroundColor || "#020617",
        },
      };

  return {
    version: "0.1",
    id: randomUUID(),
    revision: "0",
    sources: {
      ...basemapSources,
      points: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.155, 30.274] },
              properties: { name: "West Lake", category: "lake" },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.165, 30.245] },
              properties: { name: "Leifeng Pagoda", category: "landmark" },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.145, 30.255] },
              properties: { name: "Lingyin Temple", category: "temple" },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [120.172, 30.248] },
              properties: { name: "Hangzhou Museum", category: "museum" },
            },
          ],
        },
      },
    },
    layers: [
      basemapLayer,
      {
        id: POINTS_LAYER_ID,
        type: "circle",
        source: "points",
        paint: {
          "circle-radius": 8,
          "circle-color": "#3b82f6",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      },
    ],
    view: { center: [120.155, 30.274], zoom: 13 },
  };
}

export function applyProviderCommands(engine, output, spec) {
  const { action, layerId, paint, layout, filter, view, bounds, layer, minzoom, maxzoom, beforeLayerId, message } =
    output;
  let commands = [];
  let nextBasemap = activeBasemap;

  switch (action) {
    case "setPaint":
      if (layerId && paint) {
        commands = [studioCommand("setPaint", "set-paint", { layerId, paint })];
      }
      break;
    case "setLayout":
      if (layerId && (layout || paint)) {
        commands = [
          studioCommand("setLayout", "set-layout", {
            layerId,
            layout: layout || paint,
          }),
        ];
      }
      break;
    case "setFilter":
      if (layerId && (Array.isArray(filter) || filter === null)) {
        commands = [studioCommand("setFilter", "set-filter", { layerId, filter })];
      }
      break;
    case "setLayerZoomRange":
      if (layerId && Number.isFinite(minzoom) && Number.isFinite(maxzoom)) {
        commands = [
          studioCommand("setLayerZoomRange", "set-layer-zoom-range", {
            layerId,
            minzoom,
            maxzoom,
          }),
        ];
      }
      break;
    case "setView":
      if (view?.center && view?.zoom != null) {
        commands = [studioCommand("setView", "set-view", { view })];
      }
      break;
    case "addLayer":
      if (layer?.id && layer?.type && layer?.source) {
        commands = [studioCommand("addLayer", "add-layer", { layer })];
      }
      break;
    case "removeLayer":
      if (layerId) {
        commands = [studioCommand("removeLayer", "remove-layer", { layerId })];
      }
      break;
    case "reorderLayer":
      if (layerId) {
        commands = [
          studioCommand("reorderLayer", "reorder-layer", beforeLayerId ? { layerId, beforeLayerId } : { layerId }),
        ];
      }
      break;
    case "fitBounds":
      if (isBoundsArray(bounds)) {
        commands = [studioCommand("fitBounds", "fit-bounds", { bounds })];
      }
      break;
    case "setBasemap": {
      const basemapId = normalizeBasemapId(layerId);
      if (!basemapAvailability(basemapId).enabled) {
        return basemapUnavailableResult(spec, basemapId);
      }
      nextBasemap = basemapId;
      commands = buildBasemapCommands(basemapId, spec);
      break;
    }
    case "reset":
      activeBasemap = DEFAULT_BASEMAP;
      return {
        status: "applied",
        nextSpec: createInitialSpec(),
        diagnostics: [],
        evidence: manualCommandEvidence(1),
      };
    case "unsupported":
      return {
        status: "blocked",
        nextSpec: spec,
        diagnostics: [
          {
            code: "STUDIO.MAPLIBRE_CAPABILITY_UNSUPPORTED",
            severity: "error",
            path: "/providerOutput/action",
            message:
              message ||
              "The requested MapLibre capability is known, but Studio does not have a safe command contract for it yet.",
          },
        ],
        evidence: emptyCommandEvidence(),
      };
    default:
      return applyLegacyIntent(engine, action, spec);
  }

  if (commands.length === 0) {
    return {
      status: "ready",
      nextSpec: spec,
      diagnostics: [],
      evidence: emptyCommandEvidence(),
    };
  }

  try {
    const result = engine.applyCommands(spec, commands, {
      traceId: `studio.${Date.now()}`,
    });
    const nextSpec = result.committed && !result.rolledBack ? result.spec : spec;
    const failed = (result.results || []).some((entry) => entry.status === "failed");
    if (!failed && result.committed && !result.rolledBack) {
      activeBasemap = nextBasemap;
    }
    return {
      status: failed ? "blocked" : "applied",
      nextSpec,
      diagnostics: commandDiagnostics(result),
      evidence: commandEvidence(result),
    };
  } catch (error) {
    console.error("Command apply error:", error.message);
    return {
      status: "blocked",
      nextSpec: spec,
      diagnostics: [],
      evidence: emptyCommandEvidence(),
    };
  }
}

export function applyLegacyIntent(engine, intent, spec) {
  const message = (intent || "").toLowerCase();
  const pointsLayer = spec.layers.find((layer) => layer.id === POINTS_LAYER_ID);
  let plan = null;
  const category = categoryFromPrompt(message);
  const zoomRange = zoomRangeFromPrompt(message);
  const layerBounds = boundsFromPrompt(message, spec);

  if (layerBounds) {
    plan = { intent: "fitBounds", bounds: layerBounds };
  } else if (
    message.includes("clear filter") ||
    message.includes("remove filter") ||
    message.includes("show all") ||
    message.includes("显示全部") ||
    message.includes("取消筛选")
  ) {
    plan = { intent: "setFilter", layerId: POINTS_LAYER_ID, filter: null };
  } else if (category) {
    plan = {
      intent: "setFilter",
      layerId: POINTS_LAYER_ID,
      filter: ["==", ["get", "category"], category],
    };
  } else if (zoomRange) {
    plan = { intent: "setLayerZoomRange", layerId: POINTS_LAYER_ID, ...zoomRange };
  } else if (message.includes("red")) {
    plan = {
      intent: "setPaint",
      layerId: POINTS_LAYER_ID,
      paint: { "circle-color": "#ef4444" },
    };
  } else if (message.includes("blue")) {
    plan = {
      intent: "setPaint",
      layerId: POINTS_LAYER_ID,
      paint: { "circle-color": "#3b82f6" },
    };
  } else if (message.includes("green")) {
    plan = {
      intent: "setPaint",
      layerId: POINTS_LAYER_ID,
      paint: { "circle-color": "#22c55e" },
    };
  } else if (message.includes("larger") || message.includes("bigger")) {
    plan = {
      intent: "setPaint",
      layerId: POINTS_LAYER_ID,
      paint: {
        "circle-radius": Math.min(30, (pointsLayer?.paint?.["circle-radius"] || 8) + 4),
      },
    };
  } else if (message.includes("smaller") || message.includes("decrease")) {
    plan = {
      intent: "setPaint",
      layerId: POINTS_LAYER_ID,
      paint: {
        "circle-radius": Math.max(3, (pointsLayer?.paint?.["circle-radius"] || 8) - 4),
      },
    };
  } else if (message.includes("hangzhou") || message.includes("zoom")) {
    plan = { intent: "setView", view: { center: [120.155, 30.274], zoom: 13 } };
  } else if (message.includes("reset")) {
    plan = { intent: "reset" };
  } else if (message.includes("osm") || message.includes("openstreetmap")) {
    plan = { intent: "setBasemap", layerId: "osm" };
  } else if (
    message.includes("arcgis") ||
    message.includes("esri") ||
    message.includes("satellite") ||
    message.includes("imagery")
  ) {
    plan = { intent: "setBasemap", layerId: "arcgis-imagery" };
  } else if (message.includes("bing")) {
    plan = { intent: "setBasemap", layerId: "bing-aerial" };
  } else if (message.includes("no basemap") || message.includes("remove basemap") || message.includes("none basemap")) {
    plan = { intent: "setBasemap", layerId: "none" };
  }

  if (!plan) {
    return {
      status: "ready",
      nextSpec: spec,
      diagnostics: [],
      evidence: emptyCommandEvidence(),
    };
  }
  if (plan.intent === "reset") {
    activeBasemap = DEFAULT_BASEMAP;
    return {
      status: "applied",
      nextSpec: createInitialSpec(),
      diagnostics: [],
      evidence: manualCommandEvidence(1),
    };
  }

  let commands = [];
  let nextBasemap = activeBasemap;
  if (plan.intent === "setBasemap") {
    const basemapId = normalizeBasemapId(plan.layerId);
    if (!basemapAvailability(basemapId).enabled) {
      return basemapUnavailableResult(spec, basemapId);
    }
    nextBasemap = basemapId;
    commands = buildBasemapCommands(basemapId, spec);
  } else if (plan.intent === "setPaint") {
    commands = [
      studioCommand("setPaint", "legacy-set-paint", {
        layerId: plan.layerId,
        paint: plan.paint,
      }),
    ];
  } else if (plan.intent === "setFilter") {
    commands = [
      studioCommand("setFilter", "legacy-set-filter", {
        layerId: plan.layerId,
        filter: plan.filter,
      }),
    ];
  } else if (plan.intent === "setLayerZoomRange") {
    commands = [
      studioCommand("setLayerZoomRange", "legacy-set-layer-zoom-range", {
        layerId: plan.layerId,
        minzoom: plan.minzoom,
        maxzoom: plan.maxzoom,
      }),
    ];
  } else if (plan.intent === "fitBounds") {
    commands = [studioCommand("fitBounds", "legacy-fit-bounds", { bounds: plan.bounds })];
  } else if (plan.intent === "setView") {
    commands = [studioCommand("setView", "legacy-set-view", { view: plan.view })];
  }

  if (commands.length === 0) {
    return {
      status: "ready",
      nextSpec: spec,
      diagnostics: [],
      evidence: emptyCommandEvidence(),
    };
  }

  const result = engine.applyCommands(spec, commands, {
    traceId: `studio.legacy.${Date.now()}`,
  });
  const nextSpec = result.committed && !result.rolledBack ? result.spec : spec;
  const failed = (result.results || []).some((entry) => entry.status === "failed");
  if (!failed && result.committed && !result.rolledBack) {
    activeBasemap = nextBasemap;
  }
  return {
    status: failed ? "blocked" : "applied",
    nextSpec,
    diagnostics: commandDiagnostics(result),
    evidence: commandEvidence(result),
  };
}

export function buildBasemapCommands(basemapId, spec) {
  const basemap = BASEMAPS[basemapId] || BASEMAPS[DEFAULT_BASEMAP];
  const commands = [];

  if (spec.layers.some((layer) => layer.id === BASEMAP_LAYER_ID)) {
    commands.push(
      studioCommand("removeLayer", "basemap-remove-raster-layer", {
        layerId: BASEMAP_LAYER_ID,
      }),
    );
  }
  if (spec.layers.some((layer) => layer.id === BASEMAP_BACKGROUND_LAYER_ID)) {
    commands.push(
      studioCommand("removeLayer", "basemap-remove-background-layer", {
        layerId: BASEMAP_BACKGROUND_LAYER_ID,
      }),
    );
  }
  if (spec.sources[BASEMAP_SOURCE_ID]) {
    commands.push(
      studioCommand("removeSource", "basemap-remove-source", {
        sourceId: BASEMAP_SOURCE_ID,
      }),
    );
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

function studioCommand(type, idPart, body) {
  return {
    id: `studio-${idPart}`,
    version: "0.1",
    type,
    author: { type: "agent", id: "studio" },
    ...body,
  };
}

function commandDiagnostics(result) {
  return (result.results || []).flatMap((entry) => entry.diagnostics || []);
}

function commandEvidence(result) {
  const results = result.results || [];
  const failed = results.some((entry) => entry.status === "failed");
  return {
    commandCount: results.length,
    committed: result.committed || false,
    rolledBack: result.rolledBack || false,
    failed,
    changedPathCount: results.reduce((count, entry) => count + (entry.changedPaths?.length || 0), 0),
  };
}

function emptyCommandEvidence() {
  return {
    commandCount: 0,
    committed: false,
    rolledBack: false,
    failed: false,
    changedPathCount: 0,
  };
}

function manualCommandEvidence(changedPathCount) {
  return {
    commandCount: 1,
    committed: true,
    rolledBack: false,
    failed: false,
    changedPathCount,
  };
}

function categoryFromPrompt(message) {
  if (message.includes("landmark") || message.includes("地标")) return "landmark";
  if (message.includes("museum") || message.includes("博物馆")) return "museum";
  if (message.includes("temple") || message.includes("寺") || message.includes("寺庙")) return "temple";
  if (message.includes("lake") || message.includes("湖")) return "lake";
  return null;
}

function zoomRangeFromPrompt(message) {
  if (
    !(
      message.includes("zoom range") ||
      message.includes("visible") ||
      message.includes("hide") ||
      message.includes("缩放") ||
      message.includes("可见")
    )
  ) {
    return null;
  }

  const between = message.match(/(?:zoom|缩放)[^\d]*(\d+(?:\.\d+)?)[^\d]+(?:to|and|-|到|至)[^\d]*(\d+(?:\.\d+)?)/);
  if (between) {
    return normalizeZoomRange(Number(between[1]), Number(between[2]));
  }

  const above = message.match(/(?:above|after|from|over|>=|大于|超过|以上|之后)[^\d]*(\d+(?:\.\d+)?)/);
  if (above) return normalizeZoomRange(Number(above[1]), 24);

  const below = message.match(/(?:below|under|before|<=|小于|低于|以下|之前)[^\d]*(\d+(?:\.\d+)?)/);
  if (below) return normalizeZoomRange(0, Number(below[1]));

  return null;
}

function normalizeZoomRange(minzoom, maxzoom) {
  const min = Math.max(0, Math.min(24, minzoom));
  const max = Math.max(0, Math.min(24, maxzoom));
  return min <= max ? { minzoom: min, maxzoom: max } : { minzoom: max, maxzoom: min };
}

function boundsFromPrompt(message, spec) {
  const wantsFit = [
    "show all points",
    "zoom to all points",
    "fit points",
    "fit to points",
    "fit bounds",
    "显示所有点",
    "显示全部点",
    "缩放到全部点",
    "适配全部点",
  ].some((pattern) => message.includes(pattern));
  if (!wantsFit) return null;
  return boundsForLayer(spec, POINTS_LAYER_ID);
}

function boundsForLayer(spec, layerId) {
  const layer = spec.layers.find((candidate) => candidate.id === layerId);
  if (!layer?.source) return null;
  return boundsForSource(spec.sources?.[layer.source]);
}

function boundsForSource(source) {
  if (source?.type !== "geojson" || typeof source.data === "string") return null;
  const bounds = {
    west: Infinity,
    south: Infinity,
    east: -Infinity,
    north: -Infinity,
  };
  collectCoordinatesFromGeoJson(source.data, bounds);
  if (
    !Number.isFinite(bounds.west) ||
    !Number.isFinite(bounds.south) ||
    !Number.isFinite(bounds.east) ||
    !Number.isFinite(bounds.north)
  ) {
    return null;
  }
  return [bounds.west, bounds.south, bounds.east, bounds.north];
}

function collectCoordinatesFromGeoJson(value, bounds) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      const lng = value[0];
      const lat = value[1];
      bounds.west = Math.min(bounds.west, lng);
      bounds.south = Math.min(bounds.south, lat);
      bounds.east = Math.max(bounds.east, lng);
      bounds.north = Math.max(bounds.north, lat);
      return;
    }
    for (const entry of value) collectCoordinatesFromGeoJson(entry, bounds);
    return;
  }
  if (value.type === "FeatureCollection" && Array.isArray(value.features)) {
    for (const feature of value.features) {
      collectCoordinatesFromGeoJson(feature, bounds);
    }
    return;
  }
  if (value.type === "Feature") {
    collectCoordinatesFromGeoJson(value.geometry, bounds);
    return;
  }
  if (Object.hasOwn(value, "coordinates")) {
    collectCoordinatesFromGeoJson(value.coordinates, bounds);
  }
}

function isBoundsArray(value) {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((entry) => typeof entry === "number" && Number.isFinite(entry))
  );
}

let activeSpec = createInitialSpec();
let activeBasemap = DEFAULT_BASEMAP;
let _activeEpoch = 0;
const sessionId = `studio.${randomUUID()}`;
const projectId = normalizeProjectId(process.env.STUDIO_PROJECT_ID);
const reviewPrincipal = { role: "reviewer", projectIds: [projectId] };
const auditRecords = [];
const reviewDecisions = [];
export const STUDIO_LOCAL_HANDOFF_VERSION = "studio.local-handoff.v1";
export const STUDIO_LOCAL_REVIEW_LEDGER_VERSION = "studio.review-ledger.v1";
export const STUDIO_LOCAL_REVIEW_EXPORT_VERSION = "studio.review-export.v1";
const REVIEW_LEDGER_AUDIT_STATUSES = new Set(["all", "applied", "blocked", "ready", "reviewed"]);
const REVIEW_LEDGER_REVIEW_OUTCOMES = new Set(["all", "accepted", "blocked", "follow-up-required"]);
const REVIEW_EXPORT_KINDS = new Set(["all", "audit", "review"]);
const REVIEW_EXPORT_STATUSES = new Set([
  "all",
  "applied",
  "blocked",
  "ready",
  "reviewed",
  "accepted",
  "follow-up-required",
]);

function replaceActiveSpec(next) {
  activeSpec = next;
  _activeEpoch++;
}

function replaceBoundedRecords(target, nextRecords, cap) {
  target.splice(0, target.length);
  const normalized = Array.isArray(nextRecords) ? nextRecords.slice(-cap) : [];
  target.push(...normalized);
}

function replaceSessionEvidence(nextAuditRecords, nextReviewDecisions) {
  replaceBoundedRecords(auditRecords, nextAuditRecords, STUDIO_AUDIT_RECORD_CAP);
  replaceBoundedRecords(reviewDecisions, nextReviewDecisions, STUDIO_REVIEW_DECISION_CAP);
}

export function statePayload(engine, status, spec) {
  const validation = engine.validateSpec(spec);
  const transform = engine.transformMapSpecToMapLibreStyle(spec);
  const diagnostics = [...(validation.diagnostics || []), ...(transform.diagnostics || [])];
  return {
    status,
    spec,
    style: transform.style ?? null,
    summary: {
      mapId: spec.id,
      revision: spec.revision || "0",
      sourceCount: Object.keys(spec.sources || {}).length,
      layerCount: (spec.layers || []).length,
      center: spec.view?.center || null,
      zoom: spec.view?.zoom || null,
      bounds: spec.view?.bounds || null,
    },
    diagnostics,
  };
}

export function parseMapRoute(pathname) {
  const loadMatch = pathname.match(/^\/api\/maps\/([a-zA-Z0-9-]+)\/load$/);
  if (loadMatch) {
    return { action: "load", mapId: loadMatch[1] };
  }

  const reviewExportMatch = pathname.match(/^\/api\/maps\/([a-zA-Z0-9-]+)\/review-export$/);
  if (reviewExportMatch) {
    return { action: "review-export", mapId: reviewExportMatch[1] };
  }

  const reviewLedgerMatch = pathname.match(/^\/api\/maps\/([a-zA-Z0-9-]+)\/review-ledger$/);
  if (reviewLedgerMatch) {
    return { action: "review-ledger", mapId: reviewLedgerMatch[1] };
  }

  const handoffMatch = pathname.match(/^\/api\/maps\/([a-zA-Z0-9-]+)\/handoff$/);
  if (handoffMatch) {
    return { action: "handoff", mapId: handoffMatch[1] };
  }

  const mapMatch = pathname.match(/^\/api\/maps\/([a-zA-Z0-9-]+)$/);
  if (mapMatch) {
    return { action: "item", mapId: mapMatch[1] };
  }

  return null;
}

function withCommandDiagnostics(payload, diagnostics = []) {
  return {
    ...payload,
    diagnostics: [...(payload.diagnostics || []), ...diagnostics],
  };
}

export function savedWorkspaceHandoffStatus(reviewHistory = []) {
  const latestDecision = Array.isArray(reviewHistory) ? reviewHistory[reviewHistory.length - 1] : null;
  if (!latestDecision?.outcome) return "needs-review";
  return latestDecision.outcome;
}

export function buildSavedMapHandoff(map) {
  const sourceCount = Object.keys(map?.spec?.sources || {}).length;
  const layerCount = Array.isArray(map?.spec?.layers) ? map.spec.layers.length : 0;
  const latestReviewDecision =
    Array.isArray(map?.reviewDecisions) && map.reviewDecisions.length > 0
      ? map.reviewDecisions[map.reviewDecisions.length - 1]
      : null;
  return {
    handoffVersion: STUDIO_LOCAL_HANDOFF_VERSION,
    exportedAt: new Date().toISOString(),
    workspace: {
      mapId: map.id,
      name: map.name,
      revision: map.revision,
      basemapId: map.basemapId || detectBasemapFromSpec(map.spec),
      sourceCount,
      layerCount,
      createdAt: map.createdAt,
      updatedAt: map.updatedAt,
    },
    handoff: {
      status: savedWorkspaceHandoffStatus(map.reviewDecisions),
      latestReviewDecisionId: latestReviewDecision?.decisionId || null,
      latestReviewOutcome: latestReviewDecision?.outcome || null,
      followUpTaskIds: latestReviewDecision?.followUpTaskIds || [],
      reasonCodes: latestReviewDecision?.reasonCodes || [],
    },
    spec: map.spec,
    evidence: {
      auditRecordCount: Array.isArray(map.auditRecords) ? map.auditRecords.length : 0,
      reviewDecisionCount: Array.isArray(map.reviewDecisions) ? map.reviewDecisions.length : 0,
      auditRecords: Array.isArray(map.auditRecords) ? map.auditRecords : [],
      reviewDecisions: Array.isArray(map.reviewDecisions) ? map.reviewDecisions : [],
    },
  };
}

function summarizeAuditStatuses(auditRecords = []) {
  return auditRecords.reduce(
    (counts, record) => {
      if (
        record?.status === "applied" ||
        record?.status === "blocked" ||
        record?.status === "ready" ||
        record?.status === "reviewed"
      ) {
        counts[record.status] += 1;
      }
      return counts;
    },
    { applied: 0, blocked: 0, ready: 0, reviewed: 0 },
  );
}

function summarizeReviewOutcomes(reviewDecisions = []) {
  return reviewDecisions.reduce(
    (counts, decision) => {
      if (decision?.outcome === "accepted") counts.accepted += 1;
      if (decision?.outcome === "blocked") counts.blocked += 1;
      if (decision?.outcome === "follow-up-required") {
        counts.followUpRequired += 1;
      }
      return counts;
    },
    { accepted: 0, blocked: 0, followUpRequired: 0 },
  );
}

function sumDiagnosticCounts(auditRecords = []) {
  return auditRecords.reduce(
    (counts, record) => ({
      error: counts.error + (record?.diagnosticCounts?.error ?? 0),
      warning: counts.warning + (record?.diagnosticCounts?.warning ?? 0),
      info: counts.info + (record?.diagnosticCounts?.info ?? 0),
    }),
    { error: 0, warning: 0, info: 0 },
  );
}

function parseLedgerAuditStatus(value) {
  const normalized =
    typeof value === "string"
      ? value
          .trim()
          .toLowerCase()
          .replace(/[_\s]+/g, "-")
      : "";
  return REVIEW_LEDGER_AUDIT_STATUSES.has(normalized) ? normalized : "all";
}

function parseLedgerReviewOutcome(value) {
  const normalized =
    typeof value === "string"
      ? value
          .trim()
          .toLowerCase()
          .replace(/[_\s]+/g, "-")
      : "";
  return REVIEW_LEDGER_REVIEW_OUTCOMES.has(normalized) ? normalized : "all";
}

function parseLedgerLimit(value) {
  const parsed = Number.parseInt(value ?? "", 10);
  return clampInteger(parsed, 25, 1, 50);
}

function filterLedgerRecords(records, field, selected, limit) {
  const allRecords = Array.isArray(records) ? records : [];
  const matchingRecords = selected === "all" ? allRecords : allRecords.filter((record) => record?.[field] === selected);
  return {
    totalCount: allRecords.length,
    matchingCount: matchingRecords.length,
    returnedRecords: matchingRecords.slice(-limit),
  };
}

export function buildSavedMapReviewLedger(map, options = {}) {
  const auditStatus = parseLedgerAuditStatus(options.auditStatus);
  const reviewOutcome = parseLedgerReviewOutcome(options.reviewOutcome);
  const limit = parseLedgerLimit(options.limit);
  const auditSelection = filterLedgerRecords(map.auditRecords, "status", auditStatus, limit);
  const reviewSelection = filterLedgerRecords(map.reviewDecisions, "outcome", reviewOutcome, limit);
  const latestAuditRecord =
    Array.isArray(map?.auditRecords) && map.auditRecords.length > 0
      ? map.auditRecords[map.auditRecords.length - 1]
      : null;
  const latestReviewDecision =
    Array.isArray(map?.reviewDecisions) && map.reviewDecisions.length > 0
      ? map.reviewDecisions[map.reviewDecisions.length - 1]
      : null;

  return {
    reviewLedgerVersion: STUDIO_LOCAL_REVIEW_LEDGER_VERSION,
    exportedAt: new Date().toISOString(),
    workspace: {
      mapId: map.id,
      name: map.name,
      revision: map.revision,
      basemapId: map.basemapId || detectBasemapFromSpec(map.spec),
      createdAt: map.createdAt,
      updatedAt: map.updatedAt,
    },
    handoff: {
      status: savedWorkspaceHandoffStatus(map.reviewDecisions),
      latestReviewDecisionId: latestReviewDecision?.decisionId || null,
      latestReviewOutcome: latestReviewDecision?.outcome || null,
      followUpTaskIds: latestReviewDecision?.followUpTaskIds || [],
      reasonCodes: latestReviewDecision?.reasonCodes || [],
    },
    filters: {
      auditStatus,
      reviewOutcome,
      limit,
    },
    summary: {
      auditStatusCounts: summarizeAuditStatuses(map.auditRecords),
      reviewOutcomeCounts: summarizeReviewOutcomes(map.reviewDecisions),
      diagnosticTotals: sumDiagnosticCounts(map.auditRecords),
      latestAuditRecordId: latestAuditRecord?.id || null,
      latestReviewDecisionId: latestReviewDecision?.decisionId || null,
      matchingAuditRecordCount: auditSelection.matchingCount,
      matchingReviewDecisionCount: reviewSelection.matchingCount,
      returnedAuditRecordCount: auditSelection.returnedRecords.length,
      returnedReviewDecisionCount: reviewSelection.returnedRecords.length,
    },
    audit: {
      recordCount: auditSelection.totalCount,
      matchingRecordCount: auditSelection.matchingCount,
      returnedRecordCount: auditSelection.returnedRecords.length,
      records: auditSelection.returnedRecords,
    },
    review: {
      decisionCount: reviewSelection.totalCount,
      matchingDecisionCount: reviewSelection.matchingCount,
      returnedDecisionCount: reviewSelection.returnedRecords.length,
      decisions: reviewSelection.returnedRecords,
    },
  };
}

function clampInteger(value, fallback, min, max) {
  if (!Number.isInteger(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function parseExportCursor(value) {
  const parsed = Number.parseInt(value ?? "", 10);
  return clampInteger(parsed, 0, 0, 10_000);
}

function parseExportLimit(value) {
  const parsed = Number.parseInt(value ?? "", 10);
  return clampInteger(parsed, 10, 1, 25);
}

function parseExportKind(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return REVIEW_EXPORT_KINDS.has(normalized) ? normalized : "all";
}

function parseExportStatus(value) {
  const normalized =
    typeof value === "string"
      ? value
          .trim()
          .toLowerCase()
          .replace(/[_\s]+/g, "-")
      : "";
  return REVIEW_EXPORT_STATUSES.has(normalized) ? normalized : "all";
}

function buildAuditExportEvent(record) {
  return {
    kind: "audit",
    eventId: record.id,
    timestamp: record.timestamp,
    status: record.status,
    providerId: record.providerId,
    ...(record.promptHash ? { promptHash: record.promptHash } : {}),
    ...(record.traceId ? { traceId: record.traceId } : {}),
    commandCount: record.commandCount,
    diagnosticCounts: record.diagnosticCounts,
    ...(record.diagnosticCodes ? { diagnosticCodes: record.diagnosticCodes } : {}),
    fromRevision: record.fromRevision,
    toRevision: record.toRevision,
  };
}

function buildReviewExportEvent(decision) {
  return {
    kind: "review",
    eventId: decision.decisionId,
    timestamp: decision.createdAt,
    status: decision.outcome,
    providerId: decision.providerId,
    ...(decision.promptHash ? { promptHash: decision.promptHash } : {}),
    ...(decision.traceId ? { traceId: decision.traceId } : {}),
    deliveryStatus: decision.deliveryStatus,
    commandEvidence: decision.commandEvidence,
    diagnosticCounts: decision.diagnosticCounts,
    ...(decision.diagnosticCodes ? { diagnosticCodes: decision.diagnosticCodes } : {}),
    reasonCodes: decision.reasonCodes,
    ...(decision.followUpTaskIds ? { followUpTaskIds: decision.followUpTaskIds } : {}),
  };
}

function buildReviewExportTimeline(map) {
  const auditEvents = Array.isArray(map?.auditRecords)
    ? map.auditRecords.map((record) => buildAuditExportEvent(record))
    : [];
  const reviewEvents = Array.isArray(map?.reviewDecisions)
    ? map.reviewDecisions.map((decision) => buildReviewExportEvent(decision))
    : [];

  return [...auditEvents, ...reviewEvents].sort((left, right) => {
    return Date.parse(right.timestamp) - Date.parse(left.timestamp);
  });
}

function eventMatchesReviewExportFilters(event, filters) {
  if (filters.kind !== "all" && event.kind !== filters.kind) {
    return false;
  }
  if (filters.status !== "all" && event.status !== filters.status) {
    return false;
  }
  return true;
}

function countEventsByKind(events, kind) {
  return events.reduce((count, event) => (event?.kind === kind ? count + 1 : count), 0);
}

export function buildSavedMapReviewExport(map, options = {}) {
  const cursor = parseExportCursor(options.cursor);
  const limit = parseExportLimit(options.limit);
  const kind = parseExportKind(options.kind);
  const status = parseExportStatus(options.status);
  const timeline = buildReviewExportTimeline(map);
  const filteredTimeline = timeline.filter((event) => eventMatchesReviewExportFilters(event, { kind, status }));
  const events = filteredTimeline.slice(cursor, cursor + limit);
  const nextCursor = cursor + events.length < filteredTimeline.length ? cursor + events.length : null;

  return {
    reviewExportVersion: STUDIO_LOCAL_REVIEW_EXPORT_VERSION,
    generatedAt: new Date().toISOString(),
    workspace: {
      mapId: map.id,
      name: map.name,
      revision: map.revision,
      basemapId: map.basemapId || detectBasemapFromSpec(map.spec),
      createdAt: map.createdAt,
      updatedAt: map.updatedAt,
    },
    handoff: {
      status: savedWorkspaceHandoffStatus(map.reviewDecisions),
      latestReviewDecisionId:
        Array.isArray(map?.reviewDecisions) && map.reviewDecisions.length > 0
          ? map.reviewDecisions[map.reviewDecisions.length - 1]?.decisionId || null
          : null,
      latestReviewOutcome:
        Array.isArray(map?.reviewDecisions) && map.reviewDecisions.length > 0
          ? map.reviewDecisions[map.reviewDecisions.length - 1]?.outcome || null
          : null,
    },
    filters: {
      cursor,
      limit,
      kind,
      status,
    },
    summary: {
      totalEventCount: timeline.length,
      matchingEventCount: filteredTimeline.length,
      auditEventCount: Array.isArray(map?.auditRecords) ? map.auditRecords.length : 0,
      reviewEventCount: Array.isArray(map?.reviewDecisions) ? map.reviewDecisions.length : 0,
      matchingAuditEventCount: countEventsByKind(filteredTimeline, "audit"),
      matchingReviewEventCount: countEventsByKind(filteredTimeline, "review"),
      returnedEventCount: events.length,
      pageNewestEventAt: events[0]?.timestamp || null,
      pageOldestEventAt: events.at(-1)?.timestamp || null,
    },
    events,
    nextCursor,
  };
}

const TILE_PROVIDERS = {
  osm: {
    contentType: "image/png",
    maxzoom: 19,
    resolveUrl: ({ z, x, y }) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
  },
  "arcgis-imagery": {
    contentType: "image/jpeg",
    maxzoom: 23,
    resolveUrl: ({ z, x, y }) =>
      `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
  },
  "bing-aerial": {
    contentType: "image/jpeg",
    maxzoom: 19,
    resolveUrl: resolveBingTileUrl,
  },
};

let bingMetadataCache = null;

async function proxyBasemapTile(res, providerId, zValue, xValue, yValue) {
  const tileProvider = TILE_PROVIDERS[providerId];
  if (!tileProvider) {
    return sendJson(res, { error: "Unknown tile provider" }, 404);
  }

  const coords = parseTileCoords(zValue, xValue, yValue, tileProvider.maxzoom);
  if (!coords) return sendJson(res, { error: "Invalid tile coordinates" }, 400);

  try {
    const upstreamUrl = await tileProvider.resolveUrl(coords);
    const upstream = await fetch(upstreamUrl, {
      headers: {
        "user-agent": "GIS Engine Studio/0.1 (explicit user-selected basemap proxy)",
      },
    });
    if (!upstream.ok) {
      return sendJson(res, { error: `Tile provider returned HTTP ${upstream.status}` }, 502);
    }

    const body = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(200, {
      "Content-Type": upstream.headers.get("content-type") || tileProvider.contentType,
      "Cache-Control": "public, max-age=3600",
      "Content-Length": body.byteLength,
    });
    res.end(body);
    return undefined;
  } catch (error) {
    return sendJson(res, { error: error instanceof Error ? error.message : "Tile proxy failed" }, 503);
  }
}

function parseTileCoords(zValue, xValue, yValue, maxzoom) {
  const z = Number.parseInt(zValue, 10);
  const x = Number.parseInt(xValue, 10);
  const y = Number.parseInt(yValue, 10);
  if (![z, x, y].every(Number.isInteger)) return null;
  if (z < 0 || z > maxzoom) return null;
  const limit = 2 ** z;
  if (x < 0 || y < 0 || x >= limit || y >= limit) return null;
  return { z, x, y };
}

async function resolveBingTileUrl({ z, x, y }) {
  const key = process.env.BING_MAPS_KEY?.trim();
  if (!key) throw new Error("Bing Aerial requires BING_MAPS_KEY.");

  const metadata = await loadBingMetadata(key);
  const subdomains = metadata.subdomains.length > 0 ? metadata.subdomains : ["t0"];
  const subdomain = subdomains[Math.abs(x + y) % subdomains.length];
  return metadata.imageUrl
    .replace("{quadkey}", tileQuadKey(x, y, z))
    .replace("{subdomain}", subdomain)
    .replace("{culture}", "en-US");
}

async function loadBingMetadata(key) {
  const now = Date.now();
  if (bingMetadataCache?.key === key && bingMetadataCache.expiresAt > now) {
    return bingMetadataCache.value;
  }

  const metadataUrl = new URL("https://dev.virtualearth.net/REST/V1/Imagery/Metadata/Aerial");
  metadataUrl.searchParams.set("output", "json");
  metadataUrl.searchParams.set("include", "ImageryProviders");
  metadataUrl.searchParams.set("key", key);

  const response = await fetch(metadataUrl);
  if (!response.ok) {
    throw new Error(`Bing metadata returned HTTP ${response.status}.`);
  }
  const payload = await response.json();
  const resource = payload?.resourceSets?.[0]?.resources?.[0];
  if (!resource?.imageUrl) {
    throw new Error("Bing metadata did not include an imageUrl template.");
  }

  const value = {
    imageUrl: String(resource.imageUrl).replace(/^http:/, "https:"),
    subdomains: Array.isArray(resource.imageUrlSubdomains) ? resource.imageUrlSubdomains.map(String) : [],
  };
  bingMetadataCache = { key, value, expiresAt: now + 60 * 60 * 1000 };
  return value;
}

function tileQuadKey(x, y, z) {
  let quadKey = "";
  for (let level = z; level > 0; level -= 1) {
    let digit = 0;
    const mask = 1 << (level - 1);
    if ((x & mask) !== 0) digit += 1;
    if ((y & mask) !== 0) digit += 2;
    quadKey += String(digit);
  }
  return quadKey;
}

function sourcePropertiesSummary(spec) {
  return Object.fromEntries(
    Object.entries(spec.sources || {}).map(([sourceId, source]) => [sourceId, collectGeoJsonPropertyKeys(source)]),
  );
}

function collectGeoJsonPropertyKeys(source) {
  if (source?.type !== "geojson" || typeof source.data === "string") return [];
  const features =
    source.data?.type === "FeatureCollection" && Array.isArray(source.data.features)
      ? source.data.features
      : source.data?.type === "Feature"
        ? [source.data]
        : [];
  return Array.from(new Set(features.flatMap((feature) => Object.keys(feature?.properties || {})))).sort();
}

function appendStudioAudit(input) {
  return appendAuditRecord(auditRecords, {
    sessionId,
    providerId: input.providerId,
    status: input.status,
    promptHash: input.promptHash,
    traceId: input.traceId,
    commandCount: input.commandEvidence?.commandCount ?? 0,
    diagnostics: input.diagnostics ?? [],
    fromRevision: input.fromRevision,
    toRevision: input.toRevision,
  });
}

function normalizeProjectId(value) {
  return typeof value === "string" && /^project_[A-Za-z0-9][A-Za-z0-9_-]{0,62}$/.test(value) ? value : "project_studio";
}

function hashPrompt(message) {
  return `sha256:${createHash("sha256").update(message).digest("hex").slice(0, 16)}`;
}

async function main() {
  const engine = await loadEngine();
  console.log("✅ Engine loaded");

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

      if (req.method === "GET" && url.pathname === "/api/state") {
        return sendJson(res, statePayload(engine, "ready", activeSpec));
      }

      if (req.method === "GET" && url.pathname === "/api/providers") {
        return sendJson(res, { providers: publicProviderProfiles(buildProviders()) });
      }

      if (req.method === "GET" && url.pathname === "/api/basemaps") {
        return sendJson(res, {
          current: activeBasemap,
          options: publicBasemapOptions(),
        });
      }

      if (req.method === "GET" && url.pathname === "/api/maplibre-capabilities") {
        return sendJson(res, maplibreCapabilities.MAPLIBRE_CAPABILITY_REGISTRY);
      }

      if (req.method === "GET" && url.pathname === "/api/review-decisions") {
        return sendJson(res, { sessionId, projectId, decisions: reviewDecisions });
      }

      if (req.method === "POST" && url.pathname === "/api/review-decision") {
        const body = await readJsonBody(req);
        const reviewResult = createReviewDecision({
          request: body,
          evidence: auditRecords.at(-1),
          principal: reviewPrincipal,
          projectId,
          decisionId: `review-${reviewDecisions.length + 1}`,
          createdAt: new Date().toISOString(),
        });

        if (!reviewResult.ok) {
          return sendJson(res, {
            status: "blocked",
            summary: statePayload(engine, "ready", activeSpec).summary,
            decision: null,
            decisions: reviewDecisions,
            diagnostics: reviewResult.diagnostics,
            commandEvidence: emptyCommandEvidence(),
          });
        }

        reviewDecisions.push(reviewResult.decision);
        if (reviewDecisions.length > STUDIO_REVIEW_DECISION_CAP) {
          reviewDecisions.splice(0, reviewDecisions.length - STUDIO_REVIEW_DECISION_CAP);
        }
        return sendJson(res, {
          status: "reviewed",
          summary: statePayload(engine, "ready", activeSpec).summary,
          decision: reviewResult.decision,
          decisions: reviewDecisions,
          diagnostics: [],
          commandEvidence: emptyCommandEvidence(),
        });
      }

      const tileMatch = url.pathname.match(/^\/api\/tiles\/([a-z0-9-]+)\/(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg)$/i);
      if (req.method === "GET" && tileMatch) {
        return proxyBasemapTile(res, tileMatch[1], tileMatch[2], tileMatch[3], tileMatch[4]);
      }

      if (req.method === "POST" && url.pathname === "/api/chat") {
        const body = await readJsonBody(req);
        const message = typeof body.message === "string" ? body.message.trim() : "";
        const providerId = typeof body.providerId === "string" ? body.providerId : "mock-ai";
        const fromRevision = activeSpec.revision || "0";

        if (!message) {
          return sendJson(
            res,
            {
              ...statePayload(engine, "ready", activeSpec),
              diagnostics: [
                {
                  code: "INPUT.EMPTY",
                  severity: "error",
                  message: "Empty message",
                },
              ],
            },
            400,
          );
        }

        if (providerId === "deepseek") {
          const profiles = buildProviders();
          const deepseekProfile = profiles.find((profile) => profile.id === "deepseek");
          const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
          if (!deepseekProfile?.enabled || !apiKey) {
            const diagnostics = [
              {
                code: "PROVIDER.UNAVAILABLE",
                severity: "error",
                path: "/providerProfile",
                message: "DeepSeek API key not configured. Set DEEPSEEK_API_KEY.",
              },
            ];
            appendStudioAudit({
              providerId: "deepseek",
              status: "blocked",
              commandEvidence: emptyCommandEvidence(),
              diagnostics,
              fromRevision,
              toRevision: activeSpec.revision || "0",
            });
            return sendJson(res, {
              ...statePayload(engine, "ready", activeSpec),
              diagnostics,
            });
          }

          const summary = {
            sources: Object.keys(activeSpec.sources || {}),
            layers: (activeSpec.layers || []).length,
            layerIds: (activeSpec.layers || []).map((layer) => layer.id),
            layerDetails: (activeSpec.layers || []).map((layer) => ({
              id: layer.id,
              type: layer.type,
              source: layer.source,
              filter: layer.filter,
              minzoom: layer.minzoom,
              maxzoom: layer.maxzoom,
            })),
            sourceProperties: sourcePropertiesSummary(activeSpec),
            view: activeSpec.view,
          };
          const result = await provider.callOpenAiCompatibleProvider({
            profile: deepseekProfile,
            apiKey,
            message,
            summary,
            capabilityPrompt: maplibreCapabilities.buildMapLibreCapabilityPrompt(),
          });
          console.log("DeepSeek result:", JSON.stringify(result).slice(0, 300));

          if (!result.ok) {
            const diagnostics = [
              {
                code: "PROVIDER.ERROR",
                severity: "error",
                path: "/providerResponse",
                message: result.error || "Provider error",
              },
            ];
            appendStudioAudit({
              providerId: "deepseek",
              status: "blocked",
              commandEvidence: emptyCommandEvidence(),
              diagnostics,
              fromRevision,
              toRevision: activeSpec.revision || "0",
            });
            return sendJson(res, {
              ...statePayload(engine, "ready", activeSpec),
              diagnostics,
              provider: { providerId: "deepseek" },
            });
          }

          const commandResult = applyProviderCommands(engine, result.providerOutput, activeSpec);
          const nextSpec = commandResult.nextSpec;
          const status = commandResult.status;
          if (status === "applied") replaceActiveSpec(nextSpec);
          const diagnostics = commandResult.diagnostics;
          appendStudioAudit({
            providerId: "deepseek",
            status,
            promptHash: result.providerOutput.promptHash,
            traceId: result.providerOutput.traceId,
            commandEvidence: commandResult.evidence,
            diagnostics,
            fromRevision,
            toRevision: (status === "applied" ? nextSpec : activeSpec).revision || "0",
          });

          return sendJson(res, {
            ...withCommandDiagnostics(
              statePayload(engine, status, status === "applied" ? nextSpec : activeSpec),
              diagnostics,
            ),
            commandEvidence: commandResult.evidence,
            provider: {
              providerId: "deepseek",
              confidence: result.providerOutput.confidence,
              promptHash: result.providerOutput.promptHash,
              traceId: result.providerOutput.traceId,
            },
          });
        }

        const legacyResult = applyLegacyIntent(engine, message, activeSpec);
        if (legacyResult.status === "applied") {
          replaceActiveSpec(legacyResult.nextSpec);
        }
        const promptHash = hashPrompt(message);
        appendStudioAudit({
          providerId: "mock-ai",
          status: legacyResult.status,
          promptHash,
          traceId: `studio.mock.${Date.now()}`,
          commandEvidence: legacyResult.evidence,
          diagnostics: legacyResult.diagnostics,
          fromRevision,
          toRevision: (legacyResult.status === "applied" ? legacyResult.nextSpec : activeSpec).revision || "0",
        });

        return sendJson(res, {
          ...withCommandDiagnostics(
            statePayload(
              engine,
              legacyResult.status,
              legacyResult.status === "applied" ? legacyResult.nextSpec : activeSpec,
            ),
            legacyResult.diagnostics,
          ),
          commandEvidence: legacyResult.evidence,
          provider: { providerId: "mock-ai", promptHash },
        });
      }

      if (req.method === "POST" && url.pathname === "/api/maps/save") {
        const body = await readJsonBody(req);
        const id = body.id || randomUUID();
        const name = body.name || "Untitled Map";
        const result = await store.saveMap({
          id,
          name,
          spec: activeSpec,
          revision: activeSpec.revision || "0",
          basemapId: activeBasemap,
          auditRecords,
          reviewDecisions,
        });
        return sendJson(res, { ok: true, ...result });
      }

      if (req.method === "GET" && url.pathname === "/api/maps") {
        return sendJson(res, { maps: await store.listMaps() });
      }

      const mapRoute = parseMapRoute(url.pathname);
      if (req.method === "POST" && mapRoute?.action === "load") {
        const map = await store.loadMap(mapRoute.mapId);
        if (!map) return sendJson(res, { error: "Not found" }, 404);
        replaceActiveSpec(map.spec);
        activeBasemap = normalizeBasemapId(map.basemapId || detectBasemapFromSpec(map.spec));
        replaceSessionEvidence(map.auditRecords, map.reviewDecisions);
        return sendJson(res, {
          ...statePayload(engine, "ready", activeSpec),
          loaded: map.name,
          basemapId: activeBasemap,
          auditRecords,
          reviewDecisions,
        });
      }

      if (req.method === "GET" && mapRoute?.action === "handoff") {
        const map = await store.loadMap(mapRoute.mapId);
        if (!map) return sendJson(res, { error: "Not found" }, 404);
        return sendJson(res, buildSavedMapHandoff(map));
      }

      if (req.method === "GET" && mapRoute?.action === "review-ledger") {
        const map = await store.loadMap(mapRoute.mapId);
        if (!map) return sendJson(res, { error: "Not found" }, 404);
        return sendJson(
          res,
          buildSavedMapReviewLedger(map, {
            auditStatus: url.searchParams.get("audit_status"),
            reviewOutcome: url.searchParams.get("review_outcome"),
            limit: url.searchParams.get("limit"),
          }),
        );
      }

      if (req.method === "GET" && mapRoute?.action === "review-export") {
        const map = await store.loadMap(mapRoute.mapId);
        if (!map) return sendJson(res, { error: "Not found" }, 404);
        return sendJson(
          res,
          buildSavedMapReviewExport(map, {
            cursor: url.searchParams.get("cursor"),
            limit: url.searchParams.get("limit"),
            kind: url.searchParams.get("kind"),
            status: url.searchParams.get("status"),
          }),
        );
      }

      if (req.method === "GET" && mapRoute?.action === "item") {
        const map = await store.loadMap(mapRoute.mapId);
        if (!map) return sendJson(res, { error: "Not found" }, 404);
        return sendJson(res, map);
      }

      if (req.method === "DELETE" && mapRoute?.action === "item") {
        await store.deleteMap(mapRoute.mapId);
        return sendJson(res, { ok: true });
      }

      if (req.method === "GET" && url.pathname === "/api/audit") {
        return sendJson(res, { sessionId, projectId, records: auditRecords.slice(-50) });
      }

      if (req.method === "GET") {
        const filePath = url.pathname === "/" ? "/index.html" : url.pathname;
        try {
          const fullPath = join(PUBLIC_DIR, filePath);
          const content = await readFile(fullPath);
          const ext = extname(filePath);
          res.writeHead(200, {
            "Content-Type": MIME.get(ext) || "application/octet-stream",
          });
          res.end(content);
        } catch {
          try {
            const indexContent = await readFile(join(PUBLIC_DIR, "index.html"));
            res.writeHead(200, {
              "Content-Type": "text/html; charset=utf-8",
            });
            res.end(indexContent);
          } catch {
            res.writeHead(404);
            res.end("Not Found");
          }
        }
        return;
      }

      res.writeHead(404);
      res.end("Not Found");
    } catch (error) {
      console.error("Server error:", error);
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  });

  server.listen(PORT, HOST, () => {
    console.log("\n🚀 AI Map Studio Server");
    console.log(`   http://${HOST}:${PORT}`);
    console.log(`   DB: ${store.resolveStorePath()}`);
    console.log(`   API: http://${HOST}:${PORT}/api/state`);
    console.log(`   Maps: http://${HOST}:${PORT}/api/maps\n`);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}
