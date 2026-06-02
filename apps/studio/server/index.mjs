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

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

// ── Load provider ──
const provider = await import("./provider.mjs");
const maplibreCapabilities = await import("./maplibre-capabilities.mjs");

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");
const PUBLIC_DIR = join(__dirname, "..", "dist");
const require = createRequire(import.meta.url);

// ── Config ──
const HOST = process.env.HOST || "127.0.0.1";
const PORT = parseInt(process.env.PORT || "4321", 10);

// ── Load engine & AI ──
async function loadEngine() {
  const enginePath = join(ROOT, "packages/engine/dist/src/index.js");
  return import(enginePath);
}

async function loadAi() {
  const aiPath = join(ROOT, "packages/ai/dist/index.js");
  return import(aiPath);
}

// ── Load store ──
const store = await import("./store.mjs");

// ── Provider profiles ──
function buildProviders() {
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
  return [
    { id: "mock-ai", label: "Mock AI", protocol: "mock", enabled: true },
    {
      id: "deepseek",
      label: "DeepSeek",
      protocol: "openai-chat-completions",
      baseUrl: process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com",
      model: process.env.DEEPSEEK_MODEL?.trim() || "deepseek-v4-flash",
      enabled: Boolean(deepseekKey),
      missingCredential: !deepseekKey,
    },
  ];
}

// ── MIME types ──
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

// ── Helpers ──
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
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

// ── Basemap presets ──
const TILE_PROXY_PREFIX = "/api/tiles";

export const BASEMAPS = {
  none: {
    id: "none", label: "No basemap",
    backgroundColor: "#020617",
  },
  osm: {
    id: "osm", label: "OSM Standard",
    tileProvider: "osm",
    tiles: [`${TILE_PROXY_PREFIX}/osm/{z}/{x}/{y}.png`],
    attribution: "© OpenStreetMap contributors",
    maxzoom: 19,
  },
  "arcgis-imagery": {
    id: "arcgis-imagery", label: "ArcGIS World Imagery",
    tileProvider: "arcgis-imagery",
    tiles: [`${TILE_PROXY_PREFIX}/arcgis-imagery/{z}/{x}/{y}.jpg`],
    attribution: "Esri, Maxar, Earthstar Geographics",
    maxzoom: 23,
  },
  "bing-aerial": {
    id: "bing-aerial", label: "Bing Aerial",
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
  return Object.entries(BASEMAPS).map(([id, bm]) => {
    const availability = basemapAvailability(id);
    return {
      id,
      label: bm.label,
      enabled: availability.enabled,
      missingCredential: availability.missingCredential || undefined,
      tileProvider: bm.tileProvider,
    };
  });
}

function normalizeBasemapId(value) {
  const raw = typeof value === "string" ? value.toLowerCase().trim() : "";
  if (raw === "osm" || raw === "openstreetmap" || raw === "open-street-map") return "osm";
  if (raw === "arcgis" || raw === "esri" || raw === "satellite" || raw === "imagery" || raw === "arcgis-imagery") return "arcgis-imagery";
  if (raw === "bing" || raw === "bing-aerial" || raw === "bing-maps") return "bing-aerial";
  if (raw === "none" || raw === "no-basemap" || raw === "no basemap") return "none";
  return BASEMAPS[raw] ? raw : DEFAULT_BASEMAP;
}

function basemapAvailability(basemapId) {
  const bm = BASEMAPS[basemapId] || BASEMAPS[DEFAULT_BASEMAP];
  if (bm.requiresEnv && !process.env[bm.requiresEnv]?.trim()) {
    return { enabled: false, missingCredential: bm.requiresEnv };
  }
  return { enabled: true };
}

function basemapUnavailableResult(spec, basemapId) {
  const bm = BASEMAPS[basemapId] || BASEMAPS[DEFAULT_BASEMAP];
  const availability = basemapAvailability(basemapId);
  const missing = availability.missingCredential;
  return {
    status: "blocked",
    nextSpec: spec,
    diagnostics: [{
      code: missing ? "STUDIO.BASEMAP_CREDENTIAL_REQUIRED" : "STUDIO.BASEMAP_UNAVAILABLE",
      severity: "error",
      path: "/basemap",
      message: missing ? `${bm.label} requires ${missing} before Studio can proxy its tiles.` : `${bm.label} is not available.`,
      fix: missing ? { kind: "manual", confidence: "high", message: `Set ${missing} on the Studio server, then retry the basemap change.` } : undefined,
    }],
    evidence: emptyCommandEvidence(),
  };
}

export function createInitialSpec(basemapId = DEFAULT_BASEMAP) {
  const bm = BASEMAPS[normalizeBasemapId(basemapId)] || BASEMAPS[DEFAULT_BASEMAP];
  const basemapSources = bm.tiles
    ? {
        [BASEMAP_SOURCE_ID]: {
          type: "raster",
          tiles: bm.tiles,
          tileSize: 256,
          attribution: bm.attribution,
          minzoom: 0,
          maxzoom: bm.maxzoom ?? 19,
        },
      }
    : {};
  const basemapLayer = bm.tiles
    ? {
        id: BASEMAP_LAYER_ID,
        type: "raster",
        source: BASEMAP_SOURCE_ID,
      }
    : {
        id: BASEMAP_BACKGROUND_LAYER_ID,
        type: "background",
        paint: { "background-color": bm.backgroundColor || "#020617" },
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
            { type: "Feature", geometry: { type: "Point", coordinates: [120.155, 30.274] }, properties: { name: "West Lake", category: "lake" } },
            { type: "Feature", geometry: { type: "Point", coordinates: [120.165, 30.245] }, properties: { name: "Leifeng Pagoda", category: "landmark" } },
            { type: "Feature", geometry: { type: "Point", coordinates: [120.145, 30.255] }, properties: { name: "Lingyin Temple", category: "temple" } },
            { type: "Feature", geometry: { type: "Point", coordinates: [120.172, 30.248] }, properties: { name: "Hangzhou Museum", category: "museum" } },
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
        paint: { "circle-radius": 8, "circle-color": "#3b82f6", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" },
      },
    ],
    view: { center: [120.155, 30.274], zoom: 13 },
  };
}

// ── AI command mapping ──
export function applyProviderCommands(engine, output, spec) {
  const { action, layerId, paint, layout, filter, view, bounds, layer, minzoom, maxzoom, beforeLayerId, message } = output;
  let commands = [];
  let nextBasemap = activeBasemap;

  switch (action) {
    case "setPaint":
      if (layerId && paint) commands = [studioCommand("setPaint", "set-paint", { layerId, paint })];
      break;
    case "setLayout":
      if (layerId && (layout || paint)) {
        commands = [studioCommand("setLayout", "set-layout", { layerId, layout: layout || paint })];
      }
      break;
    case "setFilter":
      if (layerId && (Array.isArray(filter) || filter === null)) commands = [studioCommand("setFilter", "set-filter", { layerId, filter })];
      break;
    case "setLayerZoomRange":
      if (layerId && Number.isFinite(minzoom) && Number.isFinite(maxzoom)) {
        commands = [studioCommand("setLayerZoomRange", "set-layer-zoom-range", { layerId, minzoom, maxzoom })];
      }
      break;
    case "setView":
      if (view?.center && view?.zoom != null) commands = [studioCommand("setView", "set-view", { view })];
      break;
    case "addLayer":
      if (layer?.id && layer?.type && layer?.source) commands = [studioCommand("addLayer", "add-layer", { layer })];
      break;
    case "removeLayer":
      if (layerId) commands = [studioCommand("removeLayer", "remove-layer", { layerId })];
      break;
    case "reorderLayer":
      if (layerId) {
        commands = [studioCommand("reorderLayer", "reorder-layer", beforeLayerId ? { layerId, beforeLayerId } : { layerId })];
      }
      break;
    case "fitBounds":
      if (isBoundsArray(bounds)) commands = [studioCommand("fitBounds", "fit-bounds", { bounds })];
      break;
    case "setBasemap": {
      const bmId = normalizeBasemapId(layerId);
      if (!basemapAvailability(bmId).enabled) return basemapUnavailableResult(spec, bmId);
      nextBasemap = bmId;
      commands = buildBasemapCommands(bmId, spec);
      break;
    }
    case "reset":
      activeBasemap = DEFAULT_BASEMAP;
      return { status: "applied", nextSpec: createInitialSpec(), diagnostics: [], evidence: manualCommandEvidence(1) };
    case "unsupported":
      return {
        status: "blocked",
        nextSpec: spec,
        diagnostics: [{
          code: "STUDIO.MAPLIBRE_CAPABILITY_UNSUPPORTED",
          severity: "error",
          path: "/providerOutput/action",
          message: message || "The requested MapLibre capability is known, but Studio does not have a safe command contract for it yet.",
        }],
        evidence: emptyCommandEvidence(),
      };
    default:
      // Fallback: try legacy intent parsing
      return applyLegacyIntent(engine, action, spec);
  }

  if (commands.length === 0) {
    return { status: "ready", nextSpec: spec, diagnostics: [], evidence: emptyCommandEvidence() };
  }

  try {
    const result = engine.applyCommands(spec, commands, { traceId: `studio.${Date.now()}` });
    const nextSpec = result.committed && !result.rolledBack ? result.spec : spec;
    const failed = (result.results || []).some((r) => r.status === "failed");
    if (!failed && result.committed && !result.rolledBack) activeBasemap = nextBasemap;
    return {
      status: failed ? "blocked" : "applied",
      nextSpec,
      diagnostics: commandDiagnostics(result),
      evidence: commandEvidence(result),
    };
  } catch (err) {
    console.error("Command apply error:", err.message);
    return { status: "blocked", nextSpec: spec, diagnostics: [], evidence: emptyCommandEvidence() };
  }
}

export function applyLegacyIntent(engine, intent, spec) {
  const msg = (intent || "").toLowerCase();
  const pointsLayer = spec.layers.find((layer) => layer.id === POINTS_LAYER_ID);
  let plan = null;
  const category = categoryFromPrompt(msg);
  const zoomRange = zoomRangeFromPrompt(msg);
  const layerBounds = boundsFromPrompt(msg, spec);
  if (layerBounds) {
    plan = { intent: "fitBounds", bounds: layerBounds };
  } else if (msg.includes("clear filter") || msg.includes("remove filter") || msg.includes("show all") || msg.includes("显示全部") || msg.includes("取消筛选")) {
    plan = { intent: "setFilter", layerId: POINTS_LAYER_ID, filter: null };
  } else if (category) {
    plan = { intent: "setFilter", layerId: POINTS_LAYER_ID, filter: ["==", ["get", "category"], category] };
  } else if (zoomRange) {
    plan = { intent: "setLayerZoomRange", layerId: POINTS_LAYER_ID, ...zoomRange };
  } else if (msg.includes("red")) plan = { intent: "setPaint", layerId: POINTS_LAYER_ID, paint: { "circle-color": "#ef4444" } };
  else if (msg.includes("blue")) plan = { intent: "setPaint", layerId: POINTS_LAYER_ID, paint: { "circle-color": "#3b82f6" } };
  else if (msg.includes("green")) plan = { intent: "setPaint", layerId: POINTS_LAYER_ID, paint: { "circle-color": "#22c55e" } };
  else if (msg.includes("larger") || msg.includes("bigger")) plan = { intent: "setPaint", layerId: POINTS_LAYER_ID, paint: { "circle-radius": Math.min(30, (pointsLayer?.paint?.["circle-radius"] || 8) + 4) } };
  else if (msg.includes("smaller") || msg.includes("decrease")) plan = { intent: "setPaint", layerId: POINTS_LAYER_ID, paint: { "circle-radius": Math.max(3, (pointsLayer?.paint?.["circle-radius"] || 8) - 4) } };
  else if (msg.includes("hangzhou") || msg.includes("zoom")) plan = { intent: "setView", view: { center: [120.155, 30.274], zoom: 13 } };
  else if (msg.includes("reset")) plan = { intent: "reset" };
  // Basemap
  else if (msg.includes("osm") || msg.includes("openstreetmap")) plan = { intent: "setBasemap", layerId: "osm" };
  else if (msg.includes("arcgis") || msg.includes("esri") || msg.includes("satellite") || msg.includes("imagery")) plan = { intent: "setBasemap", layerId: "arcgis-imagery" };
  else if (msg.includes("bing")) plan = { intent: "setBasemap", layerId: "bing-aerial" };
  else if (msg.includes("no basemap") || msg.includes("remove basemap") || msg.includes("none basemap")) plan = { intent: "setBasemap", layerId: "none" };

  if (!plan) return { status: "ready", nextSpec: spec, diagnostics: [], evidence: emptyCommandEvidence() };
  if (plan.intent === "reset") {
    activeBasemap = DEFAULT_BASEMAP;
    return { status: "applied", nextSpec: createInitialSpec(), diagnostics: [], evidence: manualCommandEvidence(1) };
  }

  let commands = [];
  let nextBasemap = activeBasemap;
  if (plan.intent === "setBasemap") {
    const bmId = normalizeBasemapId(plan.layerId);
    if (!basemapAvailability(bmId).enabled) return basemapUnavailableResult(spec, bmId);
    nextBasemap = bmId;
    commands = buildBasemapCommands(bmId, spec);
  } else if (plan.intent === "setPaint") {
    commands = [studioCommand("setPaint", "legacy-set-paint", { layerId: plan.layerId, paint: plan.paint })];
  } else if (plan.intent === "setFilter") {
    commands = [studioCommand("setFilter", "legacy-set-filter", { layerId: plan.layerId, filter: plan.filter })];
  } else if (plan.intent === "setLayerZoomRange") {
    commands = [studioCommand("setLayerZoomRange", "legacy-set-layer-zoom-range", { layerId: plan.layerId, minzoom: plan.minzoom, maxzoom: plan.maxzoom })];
  } else if (plan.intent === "fitBounds") {
    commands = [studioCommand("fitBounds", "legacy-fit-bounds", { bounds: plan.bounds })];
  } else if (plan.intent === "setView") {
    commands = [studioCommand("setView", "legacy-set-view", { view: plan.view })];
  }
  if (commands.length === 0) return { status: "ready", nextSpec: spec, diagnostics: [], evidence: emptyCommandEvidence() };

  const result = engine.applyCommands(spec, commands, { traceId: `studio.legacy.${Date.now()}` });
  const nextSpec = result.committed && !result.rolledBack ? result.spec : spec;
  const failed = (result.results || []).some((r) => r.status === "failed");
  if (!failed && result.committed && !result.rolledBack) activeBasemap = nextBasemap;
  return { status: failed ? "blocked" : "applied", nextSpec, diagnostics: commandDiagnostics(result), evidence: commandEvidence(result) };
}

export function buildBasemapCommands(basemapId, spec) {
  const bm = BASEMAPS[basemapId] || BASEMAPS[DEFAULT_BASEMAP];
  const commands = [];
  if (spec.layers.some((layer) => layer.id === BASEMAP_LAYER_ID)) {
    commands.push(studioCommand("removeLayer", "basemap-remove-raster-layer", { layerId: BASEMAP_LAYER_ID }));
  }
  if (spec.layers.some((layer) => layer.id === BASEMAP_BACKGROUND_LAYER_ID)) {
    commands.push(studioCommand("removeLayer", "basemap-remove-background-layer", { layerId: BASEMAP_BACKGROUND_LAYER_ID }));
  }
  if (spec.sources[BASEMAP_SOURCE_ID]) {
    commands.push(studioCommand("removeSource", "basemap-remove-source", { sourceId: BASEMAP_SOURCE_ID }));
  }

  const beforeLayerId = spec.layers.find((layer) => layer.id !== BASEMAP_LAYER_ID && layer.id !== BASEMAP_BACKGROUND_LAYER_ID)?.id;
  if (bm.tiles) {
    commands.push({
      ...studioCommand("addSource", "basemap-add-source", {
        sourceId: BASEMAP_SOURCE_ID,
        source: { type: "raster", tiles: bm.tiles, tileSize: 256, attribution: bm.attribution, minzoom: 0, maxzoom: bm.maxzoom ?? 19 },
      }),
    });
    commands.push({
      ...studioCommand("addLayer", "basemap-add-raster-layer", {
        layer: { id: BASEMAP_LAYER_ID, type: "raster", source: BASEMAP_SOURCE_ID },
        beforeLayerId,
      }),
    });
    return commands;
  }

  commands.push({
    ...studioCommand("addLayer", "basemap-add-background-layer", {
      layer: { id: BASEMAP_BACKGROUND_LAYER_ID, type: "background", paint: { "background-color": bm.backgroundColor || "#020617" } },
      beforeLayerId,
    }),
  });
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
  return { commandCount: 0, committed: false, rolledBack: false, failed: false, changedPathCount: 0 };
}

function manualCommandEvidence(changedPathCount) {
  return { commandCount: 1, committed: true, rolledBack: false, failed: false, changedPathCount };
}

function categoryFromPrompt(message) {
  if (message.includes("landmark") || message.includes("地标")) return "landmark";
  if (message.includes("museum") || message.includes("博物馆")) return "museum";
  if (message.includes("temple") || message.includes("寺") || message.includes("寺庙")) return "temple";
  if (message.includes("lake") || message.includes("湖")) return "lake";
  return null;
}

function zoomRangeFromPrompt(message) {
  if (!(message.includes("zoom range") || message.includes("visible") || message.includes("hide") || message.includes("缩放") || message.includes("可见"))) {
    return null;
  }

  const between = message.match(/(?:zoom|缩放)[^\d]*(\d+(?:\.\d+)?)[^\d]+(?:to|and|-|到|至)[^\d]*(\d+(?:\.\d+)?)/);
  if (between) return normalizeZoomRange(Number(between[1]), Number(between[2]));

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
  const bounds = { west: Infinity, south: Infinity, east: -Infinity, north: -Infinity };
  collectCoordinatesFromGeoJson(source.data, bounds);
  if (!Number.isFinite(bounds.west) || !Number.isFinite(bounds.south) || !Number.isFinite(bounds.east) || !Number.isFinite(bounds.north)) {
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
    for (const feature of value.features) collectCoordinatesFromGeoJson(feature, bounds);
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
  return Array.isArray(value) && value.length === 4 && value.every((entry) => typeof entry === "number" && Number.isFinite(entry));
}

// ── State ──
let activeSpec = createInitialSpec();
let activeBasemap = DEFAULT_BASEMAP;
let activeEpoch = 0;
const auditRecords = [];

function replaceActiveSpec(next) { activeSpec = next; activeEpoch++; }

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

function withCommandDiagnostics(payload, diagnostics = []) {
  return {
    ...payload,
    diagnostics: [...(payload.diagnostics || []), ...diagnostics],
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
    resolveUrl: ({ z, x, y }) => `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
  },
  "bing-aerial": {
    contentType: "image/jpeg",
    maxzoom: 19,
    resolveUrl: resolveBingTileUrl,
  },
};

let bingMetadataCache = null;

async function proxyBasemapTile(res, providerId, zValue, xValue, yValue) {
  const provider = TILE_PROVIDERS[providerId];
  if (!provider) return sendJson(res, { error: "Unknown tile provider" }, 404);

  const coords = parseTileCoords(zValue, xValue, yValue, provider.maxzoom);
  if (!coords) return sendJson(res, { error: "Invalid tile coordinates" }, 400);

  try {
    const upstreamUrl = await provider.resolveUrl(coords);
    const upstream = await fetch(upstreamUrl, {
      headers: {
        "user-agent": "GIS Engine Studio/0.1 (explicit user-selected basemap proxy)",
      },
    });
    if (!upstream.ok) return sendJson(res, { error: `Tile provider returned HTTP ${upstream.status}` }, 502);

    const body = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(200, {
      "Content-Type": upstream.headers.get("content-type") || provider.contentType,
      "Cache-Control": "public, max-age=3600",
      "Content-Length": body.byteLength,
    });
    res.end(body);
    return undefined;
  } catch (err) {
    return sendJson(res, { error: err instanceof Error ? err.message : "Tile proxy failed" }, 503);
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
  if (bingMetadataCache?.key === key && bingMetadataCache.expiresAt > now) return bingMetadataCache.value;

  const metadataUrl = new URL("https://dev.virtualearth.net/REST/V1/Imagery/Metadata/Aerial");
  metadataUrl.searchParams.set("output", "json");
  metadataUrl.searchParams.set("include", "ImageryProviders");
  metadataUrl.searchParams.set("key", key);

  const response = await fetch(metadataUrl);
  if (!response.ok) throw new Error(`Bing metadata returned HTTP ${response.status}.`);
  const payload = await response.json();
  const resource = payload?.resourceSets?.[0]?.resources?.[0];
  if (!resource?.imageUrl) throw new Error("Bing metadata did not include an imageUrl template.");

  const value = {
    imageUrl: String(resource.imageUrl).replace(/^http:/, "https:"),
    subdomains: Array.isArray(resource.imageUrlSubdomains) ? resource.imageUrlSubdomains.map(String) : [],
  };
  bingMetadataCache = { key, value, expiresAt: now + 60 * 60 * 1000 };
  return value;
}

function tileQuadKey(x, y, z) {
  let quadKey = "";
  for (let i = z; i > 0; i -= 1) {
    let digit = 0;
    const mask = 1 << (i - 1);
    if ((x & mask) !== 0) digit += 1;
    if ((y & mask) !== 0) digit += 2;
    quadKey += String(digit);
  }
  return quadKey;
}

function sourcePropertiesSummary(spec) {
  return Object.fromEntries(Object.entries(spec.sources || {}).map(([sourceId, source]) => [sourceId, collectGeoJsonPropertyKeys(source)]));
}

function collectGeoJsonPropertyKeys(source) {
  if (source?.type !== "geojson" || typeof source.data === "string") return [];
  const features = source.data?.type === "FeatureCollection" && Array.isArray(source.data.features)
    ? source.data.features
    : source.data?.type === "Feature"
      ? [source.data]
      : [];
  return Array.from(new Set(features.flatMap((feature) => Object.keys(feature?.properties || {})))).sort();
}

// ── Server ──
async function main() {
  const engine = await loadEngine();
  console.log("✅ Engine loaded");

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

      // ── API Routes ──

      // GET /api/state
      if (req.method === "GET" && url.pathname === "/api/state") {
        return sendJson(res, statePayload(engine, "ready", activeSpec));
      }

      // GET /api/providers
      if (req.method === "GET" && url.pathname === "/api/providers") {
        const profiles = buildProviders();
        return sendJson(res, { providers: profiles.map((p) => ({ id: p.id, label: p.label, protocol: p.protocol, enabled: p.enabled })) });
      }

      // GET /api/basemaps
      if (req.method === "GET" && url.pathname === "/api/basemaps") {
        return sendJson(res, {
          current: activeBasemap,
          options: publicBasemapOptions(),
        });
      }

      if (req.method === "GET" && url.pathname === "/api/maplibre-capabilities") {
        return sendJson(res, maplibreCapabilities.MAPLIBRE_CAPABILITY_REGISTRY);
      }

      const tileMatch = url.pathname.match(/^\/api\/tiles\/([a-z0-9-]+)\/(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg)$/i);
      if (req.method === "GET" && tileMatch) {
        return proxyBasemapTile(res, tileMatch[1], tileMatch[2], tileMatch[3], tileMatch[4]);
      }

      // POST /api/chat
      if (req.method === "POST" && url.pathname === "/api/chat") {
        const body = await readJsonBody(req);
        const message = typeof body.message === "string" ? body.message.trim() : "";
        const providerId = typeof body.providerId === "string" ? body.providerId : "mock-ai";
        if (!message) return sendJson(res, { ...statePayload(engine, "ready", activeSpec), diagnostics: [{ code: "INPUT.EMPTY", severity: "error", message: "Empty message" }] }, 400);

        // DeepSeek / OpenAI-compatible provider
        if (providerId === "deepseek") {
          const profiles = buildProviders();
          const ds = profiles.find((p) => p.id === "deepseek");
          const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
          if (!ds?.enabled || !apiKey) {
            return sendJson(res, { ...statePayload(engine, "ready", activeSpec), diagnostics: [{ code: "PROVIDER.UNAVAILABLE", severity: "error", message: "DeepSeek API key not configured. Set DEEPSEEK_API_KEY." }] });
          }

          const summary = {
            sources: Object.keys(activeSpec.sources || {}),
            layers: (activeSpec.layers || []).length,
            layerIds: (activeSpec.layers || []).map((l) => l.id),
            layerDetails: (activeSpec.layers || []).map((l) => ({
              id: l.id,
              type: l.type,
              source: l.source,
              filter: l.filter,
              minzoom: l.minzoom,
              maxzoom: l.maxzoom,
            })),
            sourceProperties: sourcePropertiesSummary(activeSpec),
            view: activeSpec.view,
          };
          const result = await provider.callOpenAiCompatibleProvider({
            profile: ds,
            apiKey,
            message,
            summary,
            capabilityPrompt: maplibreCapabilities.buildMapLibreCapabilityPrompt(),
          });
          console.log("DeepSeek result:", JSON.stringify(result).slice(0, 300));

          if (!result.ok) {
            return sendJson(res, { ...statePayload(engine, "ready", activeSpec), diagnostics: [{ code: "PROVIDER.ERROR", severity: "error", message: result.error || "Provider error" }], provider: { providerId: "deepseek" } });
          }

          // Parse AI action into commands (new structured format)
          const cmdResult = applyProviderCommands(engine, result.providerOutput, activeSpec);
          const nextSpec = cmdResult.nextSpec;
          const status = cmdResult.status;
          if (status === "applied") replaceActiveSpec(nextSpec);

          return sendJson(res, {
            ...withCommandDiagnostics(statePayload(engine, status, status === "applied" ? nextSpec : activeSpec), cmdResult.diagnostics),
            commandEvidence: cmdResult.evidence,
            provider: { providerId: "deepseek", confidence: result.providerOutput.confidence },
          });
        }

        // Mock AI
        const legacyResult = applyLegacyIntent(engine, message, activeSpec);
        if (legacyResult.status === "applied") replaceActiveSpec(legacyResult.nextSpec);

        return sendJson(res, {
          ...withCommandDiagnostics(statePayload(engine, legacyResult.status, legacyResult.status === "applied" ? legacyResult.nextSpec : activeSpec), legacyResult.diagnostics),
          commandEvidence: legacyResult.evidence,
          provider: { providerId: "mock-ai" },
        });
      }

      // POST /api/maps/save
      if (req.method === "POST" && url.pathname === "/api/maps/save") {
        const body = await readJsonBody(req);
        const id = body.id || randomUUID();
        const name = body.name || "Untitled Map";
        const result = await store.saveMap(id, name, activeSpec, activeSpec.revision || "0");
        return sendJson(res, { ok: true, ...result });
      }

      // GET /api/maps
      if (req.method === "GET" && url.pathname === "/api/maps") {
        return sendJson(res, { maps: await store.listMaps() });
      }

      // GET /api/maps/:id
      const mapMatch = url.pathname.match(/^\/api\/maps\/([a-zA-Z0-9-]+)$/);
      if (req.method === "GET" && mapMatch) {
        const map = await store.loadMap(mapMatch[1]);
        if (!map) return sendJson(res, { error: "Not found" }, 404);
        return sendJson(res, map);
      }

      // DELETE /api/maps/:id
      if (req.method === "DELETE" && mapMatch) {
        await store.deleteMap(mapMatch[1]);
        return sendJson(res, { ok: true });
      }

      // POST /api/maps/:id/load
      if (req.method === "POST" && mapMatch && url.pathname.endsWith("/load")) {
        const map = await store.loadMap(mapMatch[1]);
        if (!map) return sendJson(res, { error: "Not found" }, 404);
        replaceActiveSpec(map.spec);
        return sendJson(res, { ...statePayload(engine, "ready", activeSpec), loaded: map.name });
      }

      // GET /api/audit
      if (req.method === "GET" && url.pathname === "/api/audit") {
        return sendJson(res, { records: auditRecords.slice(-50) });
      }

      // ── Static files (production) ──
      if (req.method === "GET") {
        let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
        try {
          const fullPath = join(PUBLIC_DIR, filePath);
          const content = await readFile(fullPath);
          const ext = extname(filePath);
          res.writeHead(200, { "Content-Type": MIME.get(ext) || "application/octet-stream" });
          res.end(content);
        } catch {
          // SPA fallback
          try {
            const indexContent = await readFile(join(PUBLIC_DIR, "index.html"));
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
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
    } catch (err) {
      console.error("Server error:", err);
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`\n🚀 AI Map Studio Server`);
    console.log(`   http://${HOST}:${PORT}`);
    console.log(`   DB: ${process.env.STUDIO_DB_PATH || "in-memory"}`);
    console.log(`   API: http://${HOST}:${PORT}/api/state`);
    console.log(`   Maps: http://${HOST}:${PORT}/api/maps\n`);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
