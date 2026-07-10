import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Type } from "@sinclair/typebox";
import Ajv from "ajv";
import { applyProviderOutput, emptyCommandEvidence } from "./studio-command-apply";
import { type DeepSeekProviderProfile, resolveDeepSeekProvider } from "./studio-provider-guardrails";

export const config = {
  runtime: "nodejs",
};

type Req = IncomingMessage & { query?: Record<string, string | string[]>; body?: unknown; method?: string };
type Res = ServerResponse & { json: (body: unknown) => void; status: (code: number) => Res };

/**
 * POST /api/chat — Stateless AI chat endpoint.
 *
 * Request:  { message, providerId, mode, spec }
 * Response: { status, spec, style, summary, diagnostics, commandEvidence, provider }
 *
 * Stateless: client sends current spec, server returns updated spec.
 * The client-side @gis-engine/engine handles actual rendering.
 */

// ── Types ──────────────────────────────────────────────────────────────────

interface ChatBody {
  message?: string;
  providerId?: string;
  mode?: string;
  spec?: Record<string, unknown>;
}

interface ProviderOutput {
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

// ── Env helper ────────────────────────────────────────────────────────────

const env = process.env;

const ChatBodySchema = Type.Object(
  {
    message: Type.Optional(Type.String()),
    providerId: Type.Optional(Type.String()),
    mode: Type.Optional(Type.String()),
    spec: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  },
  { additionalProperties: false },
);
const validateChatBody = new Ajv({ allErrors: true }).compile(ChatBodySchema);

// ── Spec helpers ───────────────────────────────────────────────────────────

const POINTS_LAYER_ID = "points-layer";

function buildSummary(spec: Record<string, unknown>) {
  const sources = (spec.sources ?? {}) as Record<string, unknown>;
  const layers = (spec.layers ?? []) as Array<Record<string, unknown>>;
  const view = (spec.view ?? {}) as Record<string, unknown>;
  return {
    mapId: String(spec.id ?? "unknown"),
    revision: String(spec.revision ?? "0"),
    sourceCount: Object.keys(sources).length,
    layerCount: layers.length,
    center: (view.center as [number, number] | null) ?? null,
    zoom: (view.zoom as number | null) ?? null,
    bounds: (view.bounds as [number, number, number, number] | null) ?? null,
  };
}

function stateResponse(
  res: Res,
  status: string,
  spec: Record<string, unknown>,
  diagnostics: Array<Record<string, unknown>> = [],
  commandEvidence?: Record<string, unknown>,
  provider?: Record<string, unknown>,
) {
  res.status(200).json({
    status,
    spec,
    style: null,
    summary: buildSummary(spec),
    diagnostics,
    commandEvidence: commandEvidence ?? {
      commandCount: 0,
      committed: false,
      rolledBack: false,
      failed: false,
      changedPathCount: 0,
    },
    provider,
  });
}

// ── Apply provider output to spec (pure JS, no engine dependency) ──────────

function applyAction(
  spec: Record<string, unknown>,
  output: ProviderOutput,
): {
  nextSpec: Record<string, unknown>;
  changedPaths: number;
  status: string;
  diagnostics: Array<Record<string, unknown>>;
  evidence: Record<string, unknown>;
} {
  const result = applyProviderOutput(spec, output);
  const changedPaths =
    typeof result.evidence.changedPathCount === "number" ? (result.evidence.changedPathCount as number) : 0;
  return {
    nextSpec: result.nextSpec,
    changedPaths,
    status: result.status,
    diagnostics: result.diagnostics,
    evidence: result.evidence,
  };
}

// ── Mock AI: keyword-based intent parsing ──────────────────────────────────

function categoryFromPrompt(msg: string): string | null {
  if (msg.includes("landmark") || msg.includes("地标")) return "landmark";
  if (msg.includes("museum") || msg.includes("博物馆")) return "museum";
  if (msg.includes("temple") || msg.includes("寺") || msg.includes("寺庙")) return "temple";
  if (msg.includes("lake") || msg.includes("湖")) return "lake";
  return null;
}

function zoomRangeFromPrompt(msg: string): { minzoom: number; maxzoom: number } | null {
  if (
    !(
      msg.includes("zoom range") ||
      msg.includes("visible") ||
      msg.includes("hide") ||
      msg.includes("缩放") ||
      msg.includes("可见")
    )
  )
    return null;

  const between = msg.match(/(?:zoom|缩放)[^\d]*(\d+(?:\.\d+)?)[^\d]+(?:to|and|-|到|至)[^\d]*(\d+(?:\.\d+)?)/);
  if (between) {
    const a = Math.max(0, Math.min(24, Number(between[1])));
    const b = Math.max(0, Math.min(24, Number(between[2])));
    return a <= b ? { minzoom: a, maxzoom: b } : { minzoom: b, maxzoom: a };
  }

  const above = msg.match(/(?:above|after|from|over|>=|大于|超过|以上|之后)[^\d]*(\d+(?:\.\d+)?)/);
  if (above) return { minzoom: Math.max(0, Math.min(24, Number(above[1]))), maxzoom: 24 };

  const below = msg.match(/(?:below|under|before|<=|小于|低于|以下|之前)[^\d]*(\d+(?:\.\d+)?)/);
  if (below) return { minzoom: 0, maxzoom: Math.max(0, Math.min(24, Number(below[1]))) };

  return null;
}

function boundsForPointsSource(spec: Record<string, unknown>): [number, number, number, number] | null {
  const sources = spec.sources as Record<string, unknown>;
  const pointsSource = sources?.points as Record<string, unknown> | undefined;
  if (pointsSource?.type !== "geojson") return null;
  const data = pointsSource.data as Record<string, unknown>;
  if (!data || typeof data === "string") return null;

  const bounds = { west: Infinity, south: Infinity, east: -Infinity, north: -Infinity };
  collectCoords(data, bounds);
  if (!Number.isFinite(bounds.west)) return null;
  return [bounds.west, bounds.south, bounds.east, bounds.north];
}

function collectCoords(value: unknown, bounds: { west: number; south: number; east: number; north: number }) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      bounds.west = Math.min(bounds.west, value[0]);
      bounds.south = Math.min(bounds.south, value[1]);
      bounds.east = Math.max(bounds.east, value[0]);
      bounds.north = Math.max(bounds.north, value[1]);
      return;
    }
    for (const entry of value) collectCoords(entry, bounds);
    return;
  }
  const obj = value as Record<string, unknown>;
  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
    for (const f of obj.features) collectCoords(f, bounds);
    return;
  }
  if (obj.type === "Feature") {
    collectCoords(obj.geometry, bounds);
    return;
  }
  if ("coordinates" in obj) collectCoords(obj.coordinates, bounds);
}

function parseMockIntent(message: string, spec: Record<string, unknown>): ProviderOutput {
  const msg = message.toLowerCase();
  const layers = (spec.layers ?? []) as Array<Record<string, unknown>>;
  const pointsLayer = layers.find((l) => l.id === POINTS_LAYER_ID);
  const currentRadius = ((pointsLayer?.paint as Record<string, unknown>)?.["circle-radius"] as number) ?? 8;

  // Fit bounds
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
  ].some((p) => msg.includes(p));
  if (wantsFit) {
    const bounds = boundsForPointsSource(spec);
    if (bounds) return { action: "fitBounds", bounds };
  }

  // Clear filter
  if (
    msg.includes("clear filter") ||
    msg.includes("remove filter") ||
    msg.includes("show all") ||
    msg.includes("显示全部") ||
    msg.includes("取消筛选")
  ) {
    return { action: "setFilter", layerId: POINTS_LAYER_ID, filter: null };
  }

  // Category filter
  const category = categoryFromPrompt(msg);
  if (category) {
    return {
      action: "setFilter",
      layerId: POINTS_LAYER_ID,
      filter: ["==", ["get", "category"], category],
    };
  }

  // Zoom range
  const zoomRange = zoomRangeFromPrompt(msg);
  if (zoomRange) {
    return { action: "setLayerZoomRange", layerId: POINTS_LAYER_ID, ...zoomRange };
  }

  // Color changes
  if (msg.includes("red"))
    return { action: "setPaint", layerId: POINTS_LAYER_ID, paint: { "circle-color": "#ef4444" } };
  if (msg.includes("blue"))
    return { action: "setPaint", layerId: POINTS_LAYER_ID, paint: { "circle-color": "#3b82f6" } };
  if (msg.includes("green"))
    return { action: "setPaint", layerId: POINTS_LAYER_ID, paint: { "circle-color": "#22c55e" } };

  // Size changes
  if (msg.includes("larger") || msg.includes("bigger")) {
    return {
      action: "setPaint",
      layerId: POINTS_LAYER_ID,
      paint: { "circle-radius": Math.min(30, currentRadius + 4) },
    };
  }
  if (msg.includes("smaller") || msg.includes("decrease")) {
    return { action: "setPaint", layerId: POINTS_LAYER_ID, paint: { "circle-radius": Math.max(3, currentRadius - 4) } };
  }

  // View
  if (msg.includes("hangzhou") || msg.includes("zoom")) {
    return { action: "setView", view: { center: [120.155, 30.274], zoom: 13 } };
  }

  // Reset
  if (msg.includes("reset")) return { action: "reset" };

  // Basemap switches
  if (msg.includes("osm") || msg.includes("openstreetmap")) return { action: "setBasemap", layerId: "osm" };
  if (msg.includes("arcgis") || msg.includes("esri") || msg.includes("satellite") || msg.includes("imagery"))
    return { action: "setBasemap", layerId: "arcgis-imagery" };
  if (msg.includes("bing")) return { action: "setBasemap", layerId: "bing-aerial" };
  if (msg.includes("no basemap") || msg.includes("remove basemap") || msg.includes("none basemap"))
    return { action: "setBasemap", layerId: "none" };

  return { action: "noop" };
}

// ── DeepSeek / OpenAI-compatible LLM call ──────────────────────────────────

function buildSystemPrompt(summary: Record<string, unknown>, capabilityPrompt: string): string {
  const layerCount = summary.layerCount as number;
  const layerIds = ((summary as Record<string, unknown>).layerIds as string[]) ?? [];
  const layerInfo =
    layerCount > 0
      ? `There ${layerCount === 1 ? "is" : "are"} ${layerCount} layer(s). Layer IDs: ${layerIds.join(", ") || "points-layer"}.`
      : "No layers exist yet.";

  return [
    "You are a map-editing assistant for GIS Engine. You MUST return ONLY valid JSON.",
    "",
    "## Available Actions",
    "- Change point/line/fill color: set 'circle-color', 'line-color', or 'fill-color'",
    "- Change point size: set 'circle-radius' (range 3-30)",
    "- Change line width: set 'line-width' (range 0.5-10)",
    "- Change opacity: set 'circle-opacity', 'line-opacity', or 'fill-opacity'",
    "- Change layout state: action=setLayout, layerId=target layer, layout={...}; use visibility none/visible to hide or show a layer",
    "- Filter a layer: action=setFilter, layerId=target layer, filter=MapLibre boolean expression array; use null to clear",
    "- Set layer zoom visibility: action=setLayerZoomRange, layerId=target layer, minzoom/maxzoom numbers in 0-24",
    "- Reorder layers: action=reorderLayer, layerId=target layer, optional beforeLayerId=anchor layer",
    "- Fit the map to bounds: action=fitBounds, bounds=[west, south, east, north]",
    "- Change basemap: action=setBasemap, layerId=none|osm|arcgis-imagery|bing-aerial",
    "- Move camera: set view center [lng, lat] and zoom level (0-22)",
    "- Add a layer: provide layer type, source id, and paint properties",
    "- Remove a layer: provide layer id",
    "- Reset map: restore to default state",
    "",
    "## MapLibre Capability Context",
    capabilityPrompt || "No expanded MapLibre capability registry was provided.",
    "",
    `## Current Map State\n${JSON.stringify(summary, null, 2)}`,
    "",
    layerInfo,
    "",
    "## Response Format (STRICT)",
    "{",
    '  "action": "setPaint" | "setLayout" | "setFilter" | "setLayerZoomRange" | "reorderLayer" | "fitBounds" | "setView" | "addLayer" | "removeLayer" | "setBasemap" | "reset" | "unsupported",',
    '  "layerId": "target-layer-id",',
    '  "paint": { "circle-color": "#ef4444" },',
    '  "layout": { "visibility": "none" },',
    '  "filter": ["==", ["get", "category"], "landmark"],',
    '  "minzoom": 10, "maxzoom": 18,',
    '  "beforeLayerId": "labels-layer",',
    '  "bounds": [120.145, 30.245, 120.172, 30.274],',
    '  "view": { "center": [120.15, 30.28], "zoom": 13 },',
    '  "layer": { "id": "new-layer", "type": "circle", "source": "points", "paint": { "circle-radius": 8 } },',
    '  "message": "short reason when action is unsupported",',
    '  "confidence": { "score": 0.95, "level": "high" }',
    "}",
    "",
    "## Rules",
    "- ALWAYS use exact layer IDs from the current map state",
    "- For color changes, use hex colors like #ef4444, #3b82f6, #22c55e",
    "- For setView, always include both center [lng, lat] and zoom",
    "- Return ONLY the JSON object, no markdown, no explanation",
    "- If unsure about any field, set confidence to 'low'",
  ].join("\n");
}

function parseLLMJsonResponse(content: string): ProviderOutput | null {
  try {
    const stripped = content
      .replace(/^```(?:json)?\s*/, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(stripped);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const action = parsed.action || parsed.intent;
    if (!action || typeof action !== "string") return null;

    return {
      action,
      layerId: parsed.layerId || null,
      paint: parsed.paint || null,
      layout: parsed.layout || null,
      filter: "filter" in parsed ? parsed.filter : undefined,
      view: parsed.view || null,
      bounds: Array.isArray(parsed.bounds) && parsed.bounds.length === 4 ? parsed.bounds : undefined,
      layer: parsed.layer || null,
      minzoom: typeof parsed.minzoom === "number" ? parsed.minzoom : undefined,
      maxzoom: typeof parsed.maxzoom === "number" ? parsed.maxzoom : undefined,
      beforeLayerId: typeof parsed.beforeLayerId === "string" ? parsed.beforeLayerId : undefined,
      message: typeof parsed.message === "string" ? parsed.message : null,
      confidence: parsed.confidence,
    };
  } catch {
    return null;
  }
}

async function callDeepSeek(
  provider: Extract<DeepSeekProviderProfile, { ok: true }>,
  spec: Record<string, unknown>,
  message: string,
): Promise<{ ok: true; output: ProviderOutput } | { ok: false; error: string }> {
  const layers = (spec.layers ?? []) as Array<Record<string, unknown>>;
  const summary: Record<string, unknown> = {
    sources: Object.keys((spec.sources ?? {}) as Record<string, unknown>),
    layers: layers.length,
    layerIds: layers.map((l) => l.id),
    layerDetails: layers.map((l) => ({
      id: l.id,
      type: l.type,
      source: l.source,
      filter: l.filter,
      minzoom: l.minzoom,
      maxzoom: l.maxzoom,
    })),
    view: spec.view,
  };

  const systemPrompt = buildSystemPrompt(summary, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(`${provider.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${provider.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: provider.model,
          temperature: 0,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return { ok: false, error: `Provider returned HTTP ${response.status}.` };
      }

      const payload = (await response.json()) as Record<string, unknown>;
      const choices = payload.choices as Array<Record<string, unknown>> | undefined;
      const content = (choices?.[0]?.message as Record<string, unknown>)?.content as string | undefined;
      if (typeof content !== "string") {
        return { ok: false, error: "No message content in response." };
      }

      const output = parseLLMJsonResponse(content);
      if (!output) {
        return { ok: false, error: "Response must be a JSON object with an 'action' field." };
      }

      return { ok: true, output };
    } finally {
      clearTimeout(timeout);
    }
  } catch (err: unknown) {
    const reason =
      err instanceof DOMException && err.name === "AbortError"
        ? "Provider request timed out (30s)."
        : "Provider request failed.";
    return { ok: false, error: reason };
  }
}

// ── Main handler ───────────────────────────────────────────────────────────

export default async function handler(req: Req, res: Res): Promise<void> {
  applyCorsHeaders(req, res);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (isBodyTooLarge(req)) {
    res.status(413).json({
      status: "blocked",
      diagnostics: [
        {
          code: "INPUT.BODY_TOO_LARGE",
          severity: "error",
          path: "/",
          message: "Request body exceeds the serverless chat size limit.",
        },
      ],
    });
    return;
  }

  let body: ChatBody;
  try {
    body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as ChatBody;
  } catch {
    stateResponse(res, "blocked", {}, [{ code: "INPUT.PARSE_ERROR", severity: "error", message: "Invalid JSON body" }]);
    return;
  }
  if (!validateChatBody(body)) {
    stateResponse(res, "blocked", {}, [
      {
        code: "INPUT.SCHEMA_INVALID",
        severity: "error",
        path: "/",
        message: "Chat request body does not match the serverless chat schema.",
        errors: validateChatBody.errors,
      },
    ]);
    return;
  }

  const message = (body.message ?? "").trim();
  const providerId = body.providerId ?? "mock-ai";
  const spec = (body.spec ?? {}) as Record<string, unknown>;

  if (!message) {
    stateResponse(res, "ready", spec, [{ code: "INPUT.EMPTY", severity: "error", message: "Empty message" }]);
    return;
  }

  // Ensure spec has minimal structure
  const safeSpec: Record<string, unknown> = {
    version: spec.version ?? "0.1",
    id: spec.id ?? randomUUID(),
    revision: spec.revision ?? "0",
    sources: spec.sources ?? {},
    layers: spec.layers ?? [],
    view: spec.view ?? { center: [120.155, 30.274], zoom: 13 },
  };

  // ── DeepSeek provider ──────────────────────────────────────────────────
  if (providerId === "deepseek") {
    const provider = resolveDeepSeekProvider(env);
    if (!provider.ok) {
      stateResponse(res, provider.code === "PROVIDER.UNAVAILABLE" ? "ready" : "blocked", safeSpec, [
        {
          code: provider.code,
          severity: "error",
          path: "/providerProfile",
          message: provider.message,
        },
      ]);
      return;
    }

    const result = await callDeepSeek(provider, safeSpec, message);
    if (!result.ok) {
      stateResponse(
        res,
        "blocked",
        safeSpec,
        [
          {
            code: "PROVIDER.ERROR",
            severity: "error",
            path: "/providerResponse",
            message: (result as { ok: false; error: string }).error,
          },
        ],
        undefined,
        { providerId: "deepseek" },
      );
      return;
    }

    const applied = applyAction(safeSpec, result.output);
    stateResponse(res, applied.status, applied.nextSpec, applied.diagnostics, applied.evidence, {
      providerId: "deepseek",
      confidence: result.output.confidence,
    });
    return;
  }

  // ── Mock AI provider (default) ─────────────────────────────────────────
  const intent = parseMockIntent(message, safeSpec);

  if (intent.action === "noop") {
    stateResponse(res, "ready", safeSpec, [], emptyCommandEvidence(), { providerId: "mock-ai" });
    return;
  }

  const applied = applyAction(safeSpec, intent);
  stateResponse(res, applied.status, applied.nextSpec, applied.diagnostics, applied.evidence, {
    providerId: "mock-ai",
  });
}

function applyCorsHeaders(req: Req, res: Res): void {
  const origin = getHeader(req, "origin");
  const allowedOrigins = (env.GIS_ENGINE_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  res.setHeader("Vary", "Origin");
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
}

function isBodyTooLarge(req: Req): boolean {
  const limit = Number.parseInt(env.GIS_ENGINE_CHAT_BODY_LIMIT_BYTES ?? "65536", 10);
  const maxBytes = Number.isSafeInteger(limit) && limit > 0 ? limit : 65536;
  const contentLength = Number.parseInt(getHeader(req, "content-length") ?? "", 10);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return true;
  if (typeof req.body === "string" && Buffer.byteLength(req.body, "utf8") > maxBytes) return true;
  if (req.body && typeof req.body === "object" && Buffer.byteLength(JSON.stringify(req.body), "utf8") > maxBytes) {
    return true;
  }
  return false;
}

function getHeader(req: Req, name: string): string | undefined {
  const value = req.headers[name] ?? req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}
