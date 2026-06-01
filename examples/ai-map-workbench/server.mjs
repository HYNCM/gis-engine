import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createInitialSpec } from "./initial-map.mjs";
import { planMockAiEdit } from "./mock-ai.mjs";
import { callOpenAiCompatibleProvider } from "./openai-compatible-provider.mjs";
import {
  buildProviderProfiles,
  publicProviderProfiles,
  readProviderApiKey,
  resolveProviderProfile
} from "./provider-profiles.mjs";

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
  const ai = await loadAi();
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const plannerProvider = options.plannerProvider;
  const providerProfiles = buildProviderProfiles(env);
  const sessionId = options.sessionId ?? createSessionId();
  const auditRecords = [];
  let activeSpec = createInitialSpec();

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? `${host}:${port}`}`);

      if (request.method === "GET" && url.pathname === "/api/state") {
        return sendJson(response, statePayload(engine, "ready", activeSpec));
      }

      if (request.method === "GET" && url.pathname === "/api/audit") {
        return sendJson(response, {
          sessionId,
          records: auditRecords
        });
      }

      if (request.method === "GET" && url.pathname === "/api/providers") {
        return sendJson(response, {
          providers: publicProviderProfiles(providerProfiles)
        });
      }

      if (request.method === "POST" && url.pathname === "/api/chat") {
        const body = await readJsonBody(request);
        const message = typeof body.message === "string" ? body.message : "";
        const providerId = typeof body.providerId === "string" ? body.providerId : undefined;
        const fromRevision = activeSpec.revision ?? "0";

        if (plannerProvider && !providerId) {
          const providerOutput = await plannerProvider({
            message,
            spec: structuredClone(activeSpec),
            summary: summarizeSpec(activeSpec)
          });
          const providerResult = await applyProviderOutput({
            engine,
            ai,
            activeSpec,
            providerOutput,
            sessionId,
            auditRecords,
            fromRevision
          });
          if (providerResult.activeSpec) activeSpec = providerResult.activeSpec;
          return sendJson(response, providerResult.payload);
        }

        if (providerId && providerId !== "mock-ai") {
          const providerProfile = resolveProviderProfile(providerProfiles, providerId);

          if (!providerProfile) {
            return sendProviderBlocked(response, engine, activeSpec, auditRecords, {
              sessionId,
              fromRevision,
              provider: {
                providerId,
                retainedRawPrompt: false
              },
              diagnostics: [providerDiagnostic("/providerProfile", "Selected provider profile is not configured.")]
            });
          }

          if (providerProfile.protocol !== "openai-chat-completions") {
            return sendProviderBlocked(response, engine, activeSpec, auditRecords, {
              sessionId,
              fromRevision,
              provider: blockedProviderEvidence({ providerId: providerProfile.id }),
              diagnostics: [providerDiagnostic("/providerProfile", "Selected provider protocol is not supported.")]
            });
          }

          const providerResponse = await callOpenAiCompatibleProvider({
            profile: providerProfile,
            apiKey: readProviderApiKey(providerProfile, env),
            message,
            summary: summarizeSpec(activeSpec),
            fetchImpl
          });

          if (!providerResponse.ok) {
            return sendProviderBlocked(response, engine, activeSpec, auditRecords, {
              sessionId,
              fromRevision,
              provider: providerResponse.provider,
              diagnostics: providerResponse.diagnostics
            });
          }

          const providerResult = await applyProviderOutput({
            engine,
            ai,
            activeSpec,
            providerOutput: providerResponse.providerOutput,
            sessionId,
            auditRecords,
            fromRevision
          });
          if (providerResult.activeSpec) activeSpec = providerResult.activeSpec;
          return sendJson(response, providerResult.payload);
        }

        const plan = planMockAiEdit(message);

        if (plan.status === "reset") {
          activeSpec = createInitialSpec();
          appendAuditRecord(auditRecords, {
            sessionId,
            providerId: "mock-ai",
            status: "reset",
            commandCount: 0,
            diagnostics: [],
            fromRevision,
            toRevision: activeSpec.revision ?? "0"
          });
          return sendJson(response, {
            ...statePayload(engine, "reset", activeSpec),
            plan,
            results: [],
            traces: [],
            commandEvidence: commandEvidence([], false, false)
          });
        }

        if (plan.status === "unsupported") {
          appendAuditRecord(auditRecords, {
            sessionId,
            providerId: "mock-ai",
            status: "unsupported",
            commandCount: 0,
            diagnostics: [],
            fromRevision,
            toRevision: activeSpec.revision ?? "0"
          });
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
        const status = failed ? "blocked" : "applied";
        appendAuditRecord(auditRecords, {
          sessionId,
          providerId: "mock-ai",
          promptHash: firstPromptHash(plan.commands),
          traceId: applied.traceId,
          status,
          commandCount: applied.results.length,
          diagnostics: applied.results.flatMap((result) => result.diagnostics),
          fromRevision,
          toRevision: activeSpec.revision ?? "0"
        });
        return sendJson(response, {
          ...statePayload(engine, status, activeSpec),
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

async function loadAi() {
  try {
    return await import("@gis-engine/ai");
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
    return import("../../packages/ai/dist/index.js");
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

function summarizeSpec(spec) {
  return {
    mapId: spec.id ?? "unknown",
    revision: spec.revision ?? "0",
    sourceCount: Object.keys(spec.sources).length,
    layerCount: spec.layers.length
  };
}

async function applyProviderOutput({ engine, ai, activeSpec, providerOutput, sessionId, auditRecords, fromRevision }) {
  const providerPlan = ai.normalizeWorkbenchProviderPlan(providerOutput);

  if (!providerPlan.ok) {
    const provider = blockedProviderEvidence(providerOutput);
    appendAuditRecord(auditRecords, {
      sessionId,
      providerId: provider.providerId,
      promptHash: readString(providerOutput, "promptHash"),
      traceId: readString(providerOutput, "traceId"),
      status: "blocked",
      commandCount: 0,
      diagnostics: providerPlan.diagnostics,
      fromRevision,
      toRevision: activeSpec.revision ?? "0"
    });
    return {
      payload: {
        ...statePayload(engine, "blocked", activeSpec),
        provider,
        plan: null,
        results: [],
        traces: [],
        diagnostics: providerPlan.diagnostics,
        commandEvidence: commandEvidence([], false, false)
      }
    };
  }

  const plan = providerPlan.result.plan;
  const skeleton = engine.createMapGenerationCommandSkeleton({
    ...plan.request,
    mapId: plan.request.mapId ?? activeSpec.id,
    baseSpec: activeSpec
  });

  if (skeleton.status === "blocked") {
    appendAuditRecord(auditRecords, {
      sessionId,
      providerId: providerPlan.result.provider.providerId,
      promptHash: plan.provenance.promptHash,
      traceId: skeleton.traceId,
      status: "blocked",
      commandCount: 0,
      diagnostics: skeleton.diagnostics,
      fromRevision,
      toRevision: activeSpec.revision ?? "0"
    });
    return {
      payload: {
        ...statePayload(engine, "blocked", activeSpec),
        provider: providerPlan.result.provider,
        plan,
        results: [],
        traces: [],
        diagnostics: skeleton.diagnostics,
        commandEvidence: commandEvidence([], false, false)
      }
    };
  }

  const generationEvidence = await ai.createGenerationEvidenceBundle({
    promptHash: plan.provenance.promptHash,
    skeleton,
    planner: {
      plan,
      ...(providerPlan.result.provider.confidence
        ? { confidence: plannerConfidence(providerPlan.result.provider.confidence) }
        : {})
    }
  });

  if (!generationEvidence.ok) {
    appendAuditRecord(auditRecords, {
      sessionId,
      providerId: providerPlan.result.provider.providerId,
      promptHash: plan.provenance.promptHash,
      traceId: skeleton.traceId,
      status: "blocked",
      commandCount: 0,
      diagnostics: generationEvidence.diagnostics,
      fromRevision,
      toRevision: activeSpec.revision ?? "0"
    });
    return {
      payload: {
        ...statePayload(engine, "blocked", activeSpec),
        provider: providerPlan.result.provider,
        plan,
        results: [],
        traces: [],
        diagnostics: generationEvidence.diagnostics,
        commandEvidence: commandEvidence([], false, false)
      }
    };
  }

  const applied = engine.applyCommands(activeSpec, skeleton.commands, {
    collectTrace: true,
    traceId: skeleton.traceId
  });
  const nextSpec = applied.committed && !applied.rolledBack ? applied.spec : activeSpec;

  const failed = applied.results.some((result) => result.status === "failed");
  const status = failed ? "blocked" : "applied";
  appendAuditRecord(auditRecords, {
    sessionId,
    providerId: providerPlan.result.provider.providerId,
    promptHash: plan.provenance.promptHash,
    traceId: applied.traceId,
    status,
    commandCount: applied.results.length,
    diagnostics: applied.results.flatMap((result) => result.diagnostics),
    fromRevision,
    toRevision: nextSpec.revision ?? "0"
  });
  return {
    activeSpec: nextSpec,
    payload: {
      ...statePayload(engine, status, nextSpec),
      provider: providerPlan.result.provider,
      plan,
      generationEvidence: compactGenerationEvidence(generationEvidence.result),
      results: applied.results,
      traces: applied.traces ?? [],
      commandEvidence: commandEvidence(applied.results, applied.committed, applied.rolledBack)
    }
  };
}

function sendProviderBlocked(response, engine, activeSpec, auditRecords, input) {
  appendAuditRecord(auditRecords, {
    sessionId: input.sessionId,
    providerId: input.provider.providerId,
    status: "blocked",
    commandCount: 0,
    diagnostics: input.diagnostics,
    fromRevision: input.fromRevision,
    toRevision: activeSpec.revision ?? "0"
  });
  return sendJson(response, {
    ...statePayload(engine, "blocked", activeSpec),
    provider: input.provider,
    plan: null,
    results: [],
    traces: [],
    diagnostics: input.diagnostics,
    commandEvidence: commandEvidence([], false, false)
  });
}

function providerDiagnostic(path, message) {
  return {
    severity: "error",
    code: "CAPABILITY.UNSUPPORTED",
    message,
    path,
    fix: { kind: "manual", confidence: "high", message: "Select a configured provider profile." }
  };
}

function blockedProviderEvidence(providerOutput) {
  const providerId =
    providerOutput && typeof providerOutput === "object" && typeof providerOutput.providerId === "string"
      ? providerOutput.providerId
      : "unknown-provider";
  return {
    providerId,
    retainedRawPrompt: false
  };
}

function plannerConfidence(confidence) {
  return {
    level: confidence.level,
    score: confidenceScore(confidence.level),
    reasons: confidence.reasons
  };
}

function confidenceScore(level) {
  if (level === "high") return 0.9;
  if (level === "medium") return 0.65;
  return 0.35;
}

function compactGenerationEvidence(evidence) {
  return {
    promptHash: evidence.promptHash,
    status: evidence.status,
    planner: {
      provided: evidence.plannerEvidence.provided,
      plannerId: evidence.plannerEvidence.plannerId,
      retainedRawPrompt: evidence.plannerEvidence.retainedRawPrompt,
      confidence: evidence.plannerEvidence.confidence,
      acceptedIntentFields: evidence.plannerEvidence.acceptedIntentFields,
      unsupportedIntentFields: evidence.plannerEvidence.unsupportedIntentFields,
      diagnosticCounts: evidence.plannerEvidence.diagnosticCounts
    },
    delivery: evidence.delivery,
    command: {
      usedApplyCommands: evidence.commandEvidence.usedApplyCommands,
      commandCount: evidence.commandEvidence.commandCount,
      committed: evidence.commandEvidence.committed,
      rolledBack: evidence.commandEvidence.rolledBack,
      diagnosticCounts: evidence.commandEvidence.diagnosticCounts
    },
    diagnostics: evidence.diagnostics
  };
}

function appendAuditRecord(records, input) {
  records.push({
    id: `${input.sessionId}.${records.length + 1}`,
    sessionId: input.sessionId,
    timestamp: new Date().toISOString(),
    status: input.status,
    providerId: input.providerId,
    ...(input.promptHash ? { promptHash: input.promptHash } : {}),
    ...(input.traceId ? { traceId: input.traceId } : {}),
    commandCount: input.commandCount,
    diagnosticCounts: countDiagnostics(input.diagnostics ?? []),
    fromRevision: input.fromRevision,
    toRevision: input.toRevision
  });
  if (records.length > 50) records.splice(0, records.length - 50);
}

function countDiagnostics(diagnostics) {
  return diagnostics.reduce(
    (counts, diagnostic) => {
      if (diagnostic.severity === "error" || diagnostic.severity === "warning" || diagnostic.severity === "info") {
        counts[diagnostic.severity] += 1;
      }
      return counts;
    },
    { error: 0, warning: 0, info: 0 }
  );
}

function firstPromptHash(commands) {
  return commands.find((command) => typeof command.sourcePromptHash === "string")?.sourcePromptHash;
}

function readString(input, key) {
  if (!input || typeof input !== "object") return undefined;
  const value = input[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function createSessionId() {
  return `workbench-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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
