import { randomUUID } from "node:crypto";
import { diffSpecsTool, inspectDataTool } from "@gis-engine/ai";
import {
  applyCommands,
  defaultResourcePolicy,
  validateResourcePolicy,
  validateResourceUrl,
  validateSpec,
} from "@gis-engine/engine";
import {
  createWorkbenchCanonicalHash,
  createWorkbenchPlanHash,
  validateWorkbenchApplyRequest,
  validateWorkbenchPlan,
  WorkbenchDiagnosticCodes,
} from "../dist/contracts/index.js";
import {
  applyWorkbenchProject,
  createWorkbenchProject,
  openWorkbenchProject,
  restoreWorkbenchRevision,
  WorkbenchProjectStoreError,
} from "./project-store.mjs";

const DEFAULT_MAX_DATA_BYTES = 5 * 1024 * 1024;
const PLAN_INPUT_FIELDS = new Set([
  "goal",
  "baseRevision",
  "promptHash",
  "commands",
  "affectedPaths",
  "resourceRequests",
  "unsupportedIntents",
  "diagnostics",
]);

export function inspectWorkbenchData(input, options = {}) {
  if (!isRecord(input) || typeof input.kind !== "string") {
    return failure(WorkbenchDiagnosticCodes.DataUnsupported, "A supported data kind is required.", "/kind");
  }

  const maxBytes = positiveInteger(options.maxBytes) ?? DEFAULT_MAX_DATA_BYTES;
  const bytes = serializedBytes(input.value);
  if (bytes > maxBytes) {
    return failure(
      WorkbenchDiagnosticCodes.DataTooLarge,
      `Data contains ${bytes} bytes, exceeding the ${maxBytes} byte inspection limit.`,
      "/value",
    );
  }

  if (input.kind === "geojson") return inspectGeoJson(input.value);
  if (input.kind === "mapspec") return inspectMapSpec(input.value, input.confirmed, options.resourcePolicy);
  if (input.kind === "url") return inspectUrl(input.value, input.confirmed, options.resourcePolicy);
  if (input.kind === "tiles") return inspectTiles(input.value, input.confirmed, options.resourcePolicy);

  return failure(
    WorkbenchDiagnosticCodes.DataUnsupported,
    `Data kind "${input.kind}" is not supported by Workbench v1.`,
    "/kind",
  );
}

export function createWorkbenchPlan(input, options = {}) {
  if (!isRecord(input)) {
    return failure(WorkbenchDiagnosticCodes.PlanInvalid, "Plan input must be an object.", "/");
  }
  const unexpectedFields = Object.keys(input).filter((field) => !PLAN_INPUT_FIELDS.has(field));
  if (unexpectedFields.length > 0) {
    return failure(
      WorkbenchDiagnosticCodes.PlanInvalid,
      `Plan input contains unsupported field(s): ${unexpectedFields.join(", ")}.`,
      `/${unexpectedFields[0]}`,
    );
  }

  const now = options.now ?? (() => new Date().toISOString());
  const plan = {
    schemaVersion: "gis-engine.workbench.plan.v1",
    id: options.id ?? `plan-${randomUUID()}`,
    goal: input.goal,
    baseRevision: input.baseRevision,
    promptHash: input.promptHash,
    commands: input.commands,
    affectedPaths: input.affectedPaths ?? [],
    resourceRequests: input.resourceRequests ?? [],
    unsupportedIntents: input.unsupportedIntents ?? [],
    diagnostics: input.diagnostics ?? [],
    createdAt: now(),
  };
  const validation = validateWorkbenchPlan(plan);
  if (!validation.valid) {
    return {
      ok: false,
      diagnostics: validation.diagnostics.map((item) => ({
        ...item,
        code: WorkbenchDiagnosticCodes.PlanInvalid,
      })),
    };
  }
  return { ok: true, result: { plan, planHash: createWorkbenchPlanHash(plan) }, diagnostics: [] };
}

export async function previewWorkbenchPlan(projectRoot, plan) {
  const validated = validatedPlan(plan);
  if (!validated.ok) return validated;
  const state = await openWorkbenchProject(projectRoot);
  if (state.project.currentRevision !== plan.baseRevision) {
    return revisionConflict(state.project.currentRevision, plan.baseRevision);
  }

  const unconfirmed = plan.resourceRequests.find((request) => request.confirmed !== true);
  if (unconfirmed) {
    return failure(
      WorkbenchDiagnosticCodes.NetworkConfirmationRequired,
      `Resource request "${unconfirmed.resource}" requires explicit confirmation.`,
      "/resourceRequests",
    );
  }

  const applied = applyCommands(state.spec, plan.commands, {
    transaction: "atomic",
    collectTrace: true,
  });
  const diagnostics = applied.results.flatMap((result) => result.diagnostics);
  if (applied.rolledBack || !applied.committed || applied.results.some((result) => result.status === "failed")) {
    return failure(
      WorkbenchDiagnosticCodes.TransactionFailed,
      "The plan cannot be applied atomically; the project was not changed.",
      "/commands",
      diagnostics,
    );
  }

  const diff = diffSpecsTool({ before: state.spec, after: applied.spec });
  const affectedPaths = Array.from(
    new Set(applied.results.flatMap((result) => result.changedPaths ?? []).map(topLevelPath)),
  ).sort();
  const planHash = createWorkbenchPlanHash(plan);
  return {
    ok: true,
    result: {
      schemaVersion: "gis-engine.workbench.plan-preview.v1",
      projectId: state.project.id,
      planHash,
      baseRevision: plan.baseRevision,
      previewRevision: applied.spec.revision,
      canApply: true,
      affectedPaths,
      diff: diff.ok ? diff.result.summary : null,
      diagnostics,
      snapshot: {
        beforeHash: createWorkbenchCanonicalHash(state.spec),
        afterHash: createWorkbenchCanonicalHash(applied.spec),
        reversible: applied.results.every((result) => Array.isArray(result.inversePatch)),
      },
      spec: applied.spec,
    },
    diagnostics: [],
  };
}

export async function applyWorkbenchPlan(projectRoot, plan, request, options = {}) {
  const validated = validatedPlan(plan);
  if (!validated.ok) return validated;
  const requestValidation = validateWorkbenchApplyRequest(request);
  if (!requestValidation.valid) {
    return {
      ok: false,
      diagnostics: requestValidation.diagnostics.map((item) => ({
        ...item,
        code: WorkbenchDiagnosticCodes.PlanInvalid,
      })),
    };
  }

  const planHash = createWorkbenchPlanHash(plan);
  if (request.planHash !== planHash) {
    return failure(
      WorkbenchDiagnosticCodes.PlanHashMismatch,
      "The apply request does not match the reviewed plan.",
      "/planHash",
    );
  }
  if (request.baseRevision !== plan.baseRevision) {
    return revisionConflict(plan.baseRevision, request.baseRevision);
  }

  const state = await openWorkbenchProject(projectRoot);
  if (request.projectId !== state.project.id) {
    return failure(WorkbenchDiagnosticCodes.ProjectInvalid, "The apply request targets another project.", "/projectId");
  }

  return applyWorkbenchProject(
    projectRoot,
    {
      baseRevision: request.baseRevision,
      planHash,
      commands: plan.commands,
    },
    options,
  );
}

export function createWorkbenchApiRouter(options) {
  const projectRoot = options?.projectRoot;
  const now = options?.now;
  const plans = new Map();

  return async function routeWorkbenchApi(request) {
    const route = parseProjectApiRoute(request.pathname);
    if (!route) return { handled: false };

    try {
      if (request.method === "POST" && route.action === "create") {
        const state = await createWorkbenchProject(
          {
            root: projectRoot,
            id: request.body?.id,
            name: request.body?.name,
            initialSpec: request.body?.initialSpec,
            provider: request.body?.provider,
            telemetryConsent: request.body?.telemetryConsent,
          },
          { now },
        );
        return response(201, state);
      }

      const state = await openWorkbenchProject(projectRoot);
      if (route.projectId !== state.project.id) {
        return response(
          404,
          failure(WorkbenchDiagnosticCodes.ProjectInvalid, "Workbench project was not found.", "/projectId"),
        );
      }

      if (request.method === "GET" && route.action === "read") return response(200, state);
      if (request.method === "POST" && route.action === "inspect") {
        const result = inspectWorkbenchData(request.body, options);
        return response(result.ok ? 200 : 422, result);
      }
      if (request.method === "POST" && route.action === "plan") {
        const result = createWorkbenchPlan(request.body, { now });
        if (result.ok) plans.set(result.result.planHash, result.result.plan);
        return response(result.ok ? 201 : 422, result);
      }
      if (request.method === "POST" && route.action === "preview") {
        const plan = plans.get(route.planHash);
        if (!plan) return response(404, missingPlan(route.planHash));
        const result = await previewWorkbenchPlan(projectRoot, plan);
        return response(result.ok ? 200 : 409, result);
      }
      if (request.method === "POST" && route.action === "apply") {
        const plan = plans.get(request.body?.planHash);
        if (!plan) return response(404, missingPlan(request.body?.planHash));
        const result = await applyWorkbenchPlan(projectRoot, plan, request.body, { now });
        return response(result.ok ? 200 : 409, result);
      }
      if (request.method === "POST" && route.action === "restore") {
        const result = await restoreWorkbenchRevision(
          projectRoot,
          { baseRevision: request.body?.baseRevision, targetRevision: route.revision },
          { now },
        );
        return response(result.ok ? 200 : 409, result);
      }
      return response(405, failure(WorkbenchDiagnosticCodes.ProjectInvalid, "Method is not allowed.", "/method"));
    } catch (error) {
      if (error instanceof WorkbenchProjectStoreError) {
        return response(422, { ok: false, diagnostics: error.diagnostics });
      }
      throw error;
    }
  };
}

function inspectGeoJson(value) {
  const parsed = parseJsonValue(value);
  if (!parsed.ok) {
    return failure(WorkbenchDiagnosticCodes.DataUnsupported, "GeoJSON must be valid JSON.", "/value");
  }
  const inspected = inspectDataTool({ geojson: parsed.value, sampleSize: 1 });
  if (!inspected.ok || !isGeoJsonObject(parsed.value)) {
    return failure(
      WorkbenchDiagnosticCodes.DataUnsupported,
      "The supplied value is not supported GeoJSON.",
      "/value",
      inspected.diagnostics,
    );
  }
  return {
    ok: true,
    result: {
      kind: "geojson",
      bytes: serializedBytes(value),
      featureCount: inspected.result.featureCount,
      propertySchema: inspected.result.propertySchema.map(({ name, types }) => ({ name, types })),
      geometryTypes: inspected.result.geometryTypes,
      bounds: inspected.result.bounds,
      suggestions: inspected.result.suggestions,
    },
    diagnostics: [],
  };
}

function inspectMapSpec(value, confirmed, policy = defaultResourcePolicy) {
  const parsed = parseJsonValue(value);
  if (!parsed.ok) {
    return failure(WorkbenchDiagnosticCodes.DataUnsupported, "MapSpec must be valid JSON.", "/value");
  }
  const validation = validateSpec(parsed.value);
  if (!validation.valid) return { ok: false, diagnostics: validation.diagnostics };
  const resources = collectSpecResources(parsed.value);
  if (resources.length > 0 && confirmed !== true) return confirmationRequired("/confirmed");
  const resourceDiagnostics = validateResourcePolicy(parsed.value, policy);
  if (resourceDiagnostics.length > 0) return { ok: false, diagnostics: resourceDiagnostics };
  return {
    ok: true,
    result: {
      kind: "mapspec",
      bytes: serializedBytes(value),
      revision: parsed.value.revision ?? "0",
      sourceCount: Object.keys(parsed.value.sources).length,
      layerCount: parsed.value.layers.length,
      resourceCount: resources.length,
    },
    diagnostics: [],
  };
}

function inspectUrl(value, confirmed, policy = defaultResourcePolicy) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return failure(WorkbenchDiagnosticCodes.DataUnsupported, "A resource URL is required.", "/value");
  }
  if (confirmed !== true) return confirmationRequired("/confirmed");
  const diagnostics = validateResourceUrl(value, "/value", policy);
  if (diagnostics.length > 0) return { ok: false, diagnostics };
  return {
    ok: true,
    result: { kind: "url", bytes: Buffer.byteLength(value), resource: value },
    diagnostics: [],
  };
}

function inspectTiles(value, confirmed, policy = defaultResourcePolicy) {
  if (!isRecord(value) || !["vector", "raster"].includes(value.type) || !Array.isArray(value.tiles)) {
    return failure(
      WorkbenchDiagnosticCodes.DataUnsupported,
      "Tile data must declare a vector or raster type and a tiles array.",
      "/value",
    );
  }
  if (value.tiles.length === 0 || value.tiles.some((url) => typeof url !== "string")) {
    return failure(WorkbenchDiagnosticCodes.DataUnsupported, "Tile URLs must be non-empty strings.", "/value/tiles");
  }
  if (confirmed !== true) return confirmationRequired("/confirmed");
  const diagnostics = value.tiles.flatMap((url, index) => validateResourceUrl(url, `/value/tiles/${index}`, policy));
  if (diagnostics.length > 0) return { ok: false, diagnostics };
  return {
    ok: true,
    result: {
      kind: "tiles",
      bytes: serializedBytes(value),
      tileType: value.type,
      resourceCount: value.tiles.length,
    },
    diagnostics: [],
  };
}

function validatedPlan(plan) {
  const validation = validateWorkbenchPlan(plan);
  if (validation.valid) return { ok: true };
  return {
    ok: false,
    diagnostics: validation.diagnostics.map((item) => ({ ...item, code: WorkbenchDiagnosticCodes.PlanInvalid })),
  };
}

function confirmationRequired(path) {
  return failure(
    WorkbenchDiagnosticCodes.NetworkConfirmationRequired,
    "External resource access requires explicit user confirmation.",
    path,
  );
}

function revisionConflict(currentRevision, requestedRevision) {
  return failure(
    WorkbenchDiagnosticCodes.RevisionConflict,
    `Base revision "${requestedRevision}" does not match current revision "${currentRevision}".`,
    "/baseRevision",
  );
}

function failure(code, message, path, relatedDiagnostics = []) {
  return { ok: false, diagnostics: [{ severity: "error", code, message, path }, ...relatedDiagnostics] };
}

function parseJsonValue(value) {
  if (typeof value !== "string") return { ok: true, value };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false };
  }
}

function serializedBytes(value) {
  if (typeof value === "string") return Buffer.byteLength(value);
  try {
    return Buffer.byteLength(JSON.stringify(value));
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function positiveInteger(value) {
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isGeoJsonObject(value) {
  if (!isRecord(value) || typeof value.type !== "string") return false;
  if (value.type === "FeatureCollection") return Array.isArray(value.features);
  return value.type === "Feature" || isRecord(value.geometry) || Object.hasOwn(value, "coordinates");
}

function collectSpecResources(spec) {
  const resources = [];
  for (const source of Object.values(spec.sources)) {
    if (!isRecord(source)) continue;
    if (typeof source.data === "string") resources.push(source.data);
    if (typeof source.url === "string") resources.push(source.url);
    if (Array.isArray(source.tiles)) resources.push(...source.tiles.filter((entry) => typeof entry === "string"));
  }
  return resources;
}

function topLevelPath(path) {
  const [, segment] = path.split("/");
  return segment ? `/${segment}` : "/";
}

function parseProjectApiRoute(pathname) {
  if (pathname === "/api/projects") return { action: "create" };
  const revision = pathname.match(/^\/api\/projects\/([A-Za-z0-9][A-Za-z0-9_-]{0,199})\/revisions\/([^/]+)\/restore$/);
  if (revision) return { action: "restore", projectId: revision[1], revision: decodeURIComponent(revision[2]) };
  const preview = pathname.match(
    /^\/api\/projects\/([A-Za-z0-9][A-Za-z0-9_-]{0,199})\/plans\/(sha256:[a-f0-9]{64})\/preview$/,
  );
  if (preview) return { action: "preview", projectId: preview[1], planHash: preview[2] };
  const action = pathname.match(/^\/api\/projects\/([A-Za-z0-9][A-Za-z0-9_-]{0,199})\/(data\/inspect|plans|apply)$/);
  if (action) {
    return {
      action: action[2] === "data/inspect" ? "inspect" : action[2] === "plans" ? "plan" : "apply",
      projectId: action[1],
    };
  }
  const read = pathname.match(/^\/api\/projects\/([A-Za-z0-9][A-Za-z0-9_-]{0,199})$/);
  return read ? { action: "read", projectId: read[1] } : null;
}

function missingPlan(planHash) {
  return failure(
    WorkbenchDiagnosticCodes.PlanHashMismatch,
    `Reviewed plan "${String(planHash ?? "")}" is not available.`,
    "/planHash",
  );
}

function response(status, body) {
  return { handled: true, status, body };
}
