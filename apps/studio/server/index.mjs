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
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

// ── Load provider ──
const provider = await import("./provider.mjs");

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

function createInitialSpec() {
  return {
    version: "0.1",
    id: randomUUID(),
    revision: "0",
    sources: {
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
      {
        id: "points-layer",
        type: "circle",
        source: "points",
        paint: { "circle-radius": 8, "circle-color": "#3b82f6", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" },
      },
    ],
    view: { center: [120.155, 30.274], zoom: 13 },
  };
}

// ── AI command mapping ──
function applyProviderCommands(engine, output, spec) {
  const { action, layerId, paint, view, layer } = output;
  let commands = [];

  switch (action) {
    case "setPaint":
      if (layerId && paint) commands = [{ type: "setPaint", layerId, paint }];
      break;
    case "setLayout":
      if (layerId && paint) commands = [{ type: "setLayout", layerId, layout: paint }];
      break;
    case "setView":
      if (view?.center && view?.zoom != null) commands = [{ type: "setView", view }];
      break;
    case "addLayer":
      if (layer?.id && layer?.type && layer?.source) commands = [{ type: "addLayer", layer }];
      break;
    case "removeLayer":
      if (layerId) commands = [{ type: "removeLayer", layerId }];
      break;
    case "reset":
      return { status: "applied", nextSpec: createInitialSpec(), evidence: { committed: true, rolledBack: false, changedPathCount: 1 } };
    default:
      // Fallback: try legacy intent parsing
      return applyLegacyIntent(engine, action, spec);
  }

  if (commands.length === 0) {
    return { status: "ready", nextSpec: spec, evidence: { committed: false, rolledBack: false, changedPathCount: 0 } };
  }

  const result = engine.applyCommands(spec, commands, { collectTrace: true });
  const nextSpec = result.committed && !result.rolledBack ? result.spec : spec;
  const failed = (result.results || []).some((r) => r.status === "failed");
  return {
    status: failed ? "blocked" : "applied",
    nextSpec,
    evidence: { committed: result.committed || false, rolledBack: result.rolledBack || false, changedPathCount: result.results?.filter((r) => r.status === "applied").length || 0 },
  };
}

function applyLegacyIntent(engine, intent, spec) {
  const msg = (intent || "").toLowerCase();
  let plan = null;
  if (msg.includes("red")) plan = { intent: "setPaint", layerId: "points-layer", paint: { "circle-color": "#ef4444" } };
  else if (msg.includes("blue")) plan = { intent: "setPaint", layerId: "points-layer", paint: { "circle-color": "#3b82f6" } };
  else if (msg.includes("green")) plan = { intent: "setPaint", layerId: "points-layer", paint: { "circle-color": "#22c55e" } };
  else if (msg.includes("larger") || msg.includes("bigger")) plan = { intent: "setPaint", layerId: "points-layer", paint: { "circle-radius": Math.min(30, (spec.layers[0]?.paint?.["circle-radius"] || 8) + 4) } };
  else if (msg.includes("smaller") || msg.includes("decrease")) plan = { intent: "setPaint", layerId: "points-layer", paint: { "circle-radius": Math.max(3, (spec.layers[0]?.paint?.["circle-radius"] || 8) - 4) } };
  else if (msg.includes("hangzhou") || msg.includes("zoom")) plan = { intent: "setView", view: { center: [120.155, 30.274], zoom: 13 } };
  else if (msg.includes("reset")) plan = { intent: "reset" };

  if (!plan) return { status: "ready", nextSpec: spec, evidence: { committed: false, rolledBack: false, changedPathCount: 0 } };
  if (plan.intent === "reset") return { status: "applied", nextSpec: createInitialSpec(), evidence: { committed: true, rolledBack: false, changedPathCount: 1 } };

  const commands = plan.intent === "setPaint" ? [{ type: "setPaint", layerId: plan.layerId, paint: plan.paint }]
    : plan.intent === "setView" ? [{ type: "setView", view: plan.view }] : [];
  if (commands.length === 0) return { status: "ready", nextSpec: spec, evidence: { committed: false, rolledBack: false, changedPathCount: 0 } };

  const result = engine.applyCommands(spec, commands, { collectTrace: true });
  const nextSpec = result.committed && !result.rolledBack ? result.spec : spec;
  const failed = (result.results || []).some((r) => r.status === "failed");
  return { status: failed ? "blocked" : "applied", nextSpec, evidence: { committed: result.committed || false, rolledBack: result.rolledBack || false, changedPathCount: result.results?.filter((r) => r.status === "applied").length || 0 } };
}

// ── State ──
let activeSpec = createInitialSpec();
let activeEpoch = 0;
const auditRecords = [];

function replaceActiveSpec(next) { activeSpec = next; activeEpoch++; }

function statePayload(engine, status, spec) {
  const validation = engine.validateSpec(spec);
  const transform = engine.transformMapSpecToMapLibreStyle(spec);
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
    },
    diagnostics: [...(validation.diagnostics || []), ...(transform.diagnostics || [])],
  };
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
            view: activeSpec.view,
          };
          const result = await provider.callOpenAiCompatibleProvider({ profile: ds, apiKey, message, summary });

          if (!result.ok) {
            return sendJson(res, { ...statePayload(engine, "ready", activeSpec), diagnostics: [{ code: "PROVIDER.ERROR", severity: "error", message: result.error || "Provider error" }], provider: { providerId: "deepseek" } });
          }

          // Parse AI action into commands (new structured format)
          const cmdResult = applyProviderCommands(engine, result.providerOutput, activeSpec);
          const nextSpec = cmdResult.nextSpec;
          const status = cmdResult.status;
          if (status === "applied") replaceActiveSpec(nextSpec);

          return sendJson(res, {
            ...statePayload(engine, status, status === "applied" ? nextSpec : activeSpec),
            commandEvidence: cmdResult.evidence,
            provider: { providerId: "deepseek", confidence: result.providerOutput.confidence },
          });
        }

        // Mock AI
        const legacyResult = applyLegacyIntent(engine, message, activeSpec);
        if (legacyResult.status === "applied") replaceActiveSpec(legacyResult.nextSpec);

        return sendJson(res, {
          ...statePayload(engine, legacyResult.status, legacyResult.status === "applied" ? legacyResult.nextSpec : activeSpec),
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

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
