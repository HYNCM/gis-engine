import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createInitialSpec } from "./initial-map.mjs";
import { planMockAiEdit } from "./mock-ai.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicRoot = resolve(__dirname, "public");
const require = createRequire(import.meta.url);
const maplibreDist = join(dirname(require.resolve("maplibre-gl/package.json")), "dist");

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"]
]);

export async function createWorkbenchServer(options = {}) {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 4321;
  const engine = await loadEngine();
  let activeSpec = createInitialSpec();

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? `${host}:${port}`}`);

      if (request.method === "GET" && url.pathname === "/api/state") {
        return sendJson(response, statePayload(engine, "ready", activeSpec));
      }

      if (request.method === "POST" && url.pathname === "/api/chat") {
        const body = await readJsonBody(request);
        const message = typeof body.message === "string" ? body.message : "";
        const plan = planMockAiEdit(message);

        if (plan.status === "reset") {
          activeSpec = createInitialSpec();
          return sendJson(response, {
            ...statePayload(engine, "reset", activeSpec),
            plan,
            results: [],
            traces: [],
            commandEvidence: commandEvidence([], false, false)
          });
        }

        if (plan.status === "unsupported") {
          return sendJson(response, {
            ...statePayload(engine, "unsupported", activeSpec),
            plan,
            results: [],
            traces: [],
            commandEvidence: commandEvidence([], false, false)
          });
        }

        const applied = engine.applyCommands(activeSpec, plan.commands, {
          collectTrace: true,
          traceId: `workbench.${plan.intent}.${activeSpec.revision ?? "0"}`
        });
        if (applied.committed && !applied.rolledBack) {
          activeSpec = applied.spec;
        }

        const failed = applied.results.some((result) => result.status === "failed");
        return sendJson(response, {
          ...statePayload(engine, failed ? "blocked" : "applied", activeSpec),
          plan,
          results: applied.results,
          traces: applied.traces ?? [],
          commandEvidence: commandEvidence(applied.results, applied.committed, applied.rolledBack)
        });
      }

      if (request.method === "POST" && url.pathname === "/api/query") {
        const body = await readJsonBody(request);
        const query = await queryActiveFeatures(engine, activeSpec, {
          point: body.point,
          bbox: body.bbox,
          layers: Array.isArray(body.layers) ? body.layers : ["poi-circles"]
        });
        return sendJson(response, {
          status: query.diagnostics.some((diagnostic) => diagnostic.severity === "error") ? "blocked" : "queried",
          query,
          summary: statePayload(engine, "ready", activeSpec).summary
        });
      }

      if (request.method === "POST" && url.pathname === "/api/reset") {
        activeSpec = createInitialSpec();
        return sendJson(response, statePayload(engine, "reset", activeSpec));
      }

      if (request.method === "GET" && url.pathname.startsWith("/vendor/")) {
        return serveVendor(url.pathname, response);
      }

      if (request.method === "GET") {
        return serveStatic(url.pathname, response);
      }

      sendJson(response, { error: "Method not allowed." }, 405);
    } catch (error) {
      sendJson(
        response,
        {
          error: error instanceof Error ? error.message : "Workbench server error."
        },
        500
      );
    }
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(port, host, () => {
      server.off("error", rejectListen);
      resolveListen();
    });
  });

  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  const url = `http://${host}:${actualPort}`;

  return {
    url,
    port: actualPort,
    close: () =>
      new Promise((resolveClose, rejectClose) => {
        server.close((error) => (error ? rejectClose(error) : resolveClose()));
      })
  };
}

async function loadEngine() {
  try {
    return await import("@gis-engine/engine");
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
    return import("../../packages/engine/dist/src/index.js");
  }
}

function statePayload(engine, status, spec) {
  const validation = engine.validateSpec(spec);
  const transform = engine.transformMapSpecToMapLibreStyle(spec);
  const diagnostics = [...validation.diagnostics, ...transform.diagnostics];
  return {
    status,
    spec,
    style: transform.style ?? null,
    validation,
    diagnostics,
    summary: {
      mapId: spec.id ?? "unknown",
      revision: spec.revision ?? "0",
      sourceCount: Object.keys(spec.sources).length,
      layerCount: spec.layers.length,
      center: spec.view.center ?? null,
      zoom: spec.view.zoom ?? null
    }
  };
}

function commandEvidence(results, committed, rolledBack) {
  return {
    commandCount: results.length,
    committed,
    rolledBack,
    failed: results.some((result) => result.status === "failed"),
    changedPathCount: results.reduce((count, result) => count + result.changedPaths.length, 0)
  };
}

async function queryActiveFeatures(engine, spec, options) {
  const adapter = new engine.MapLibreAdapter();
  await adapter.load(spec, { container: {} });
  return adapter.queryFeatures(options);
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function serveVendor(pathname, response) {
  const filename = pathname.replace("/vendor/", "");
  const allowed = new Map([
    ["maplibre-gl.js", "maplibre-gl.js"],
    ["maplibre-gl.css", "maplibre-gl.css"]
  ]);
  const asset = allowed.get(filename);
  if (!asset) return sendJson(response, { error: "Vendor asset not found." }, 404);
  return sendFile(response, join(maplibreDist, asset));
}

async function serveStatic(pathname, response) {
  const normalized = pathname === "/" ? "/index.html" : pathname;
  const filePath = resolve(publicRoot, `.${normalized}`);
  if (!filePath.startsWith(publicRoot)) {
    return sendJson(response, { error: "Static path is outside the public root." }, 403);
  }
  return sendFile(response, filePath);
}

async function sendFile(response, filePath) {
  try {
    const data = await readFile(filePath);
    response.writeHead(200, {
      "content-type": mimeTypes.get(extname(filePath)) ?? "application/octet-stream"
    });
    response.end(data);
  } catch {
    sendJson(response, { error: "File not found." }, 404);
  }
}

function sendJson(response, payload, statusCode = 200) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const portArg = Number.parseInt(process.env.PORT ?? "4321", 10);
  const server = await createWorkbenchServer({
    port: Number.isSafeInteger(portArg) ? portArg : 4321
  });
  console.log(`AI Map Workbench running at ${server.url}`);
}
