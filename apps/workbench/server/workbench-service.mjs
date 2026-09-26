import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
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
  createWorkbenchPromptHash,
  DATA_FILE_NAME_PATTERN,
  SOURCE_ID_PATTERN,
  validateWorkbenchApplyRequest,
  validateWorkbenchDataAttachmentRequest,
  validateWorkbenchDataAttachmentResult,
  validateWorkbenchPlan,
  WorkbenchDiagnosticCodes,
} from "../dist/contracts/index.js";
import { commitWorkbenchExport, previewWorkbenchExport } from "./export-service.mjs";
import {
  applyWorkbenchProject,
  createWorkbenchProject,
  openWorkbenchProject,
  restoreWorkbenchRevision,
  WorkbenchProjectStoreError,
} from "./project-store.mjs";

const DEFAULT_MAX_DATA_BYTES = 5 * 1024 * 1024;
// Defense in depth for the schema patterns; both must stay sourced from contracts.
const SAFE_DATA_FILE_PATTERN = new RegExp(DATA_FILE_NAME_PATTERN);
const SAFE_SOURCE_ID_PATTERN = new RegExp(SOURCE_ID_PATTERN);
const ARTIFACT_HASH_PATTERN = /^(?:sha256:)?([a-f0-9]{64})$/;
const PLAN_ARTIFACT_DIRECTORY = join(".gis-engine", "plans");
const EXPORT_ARTIFACT_DIRECTORY = join(".gis-engine", "exports");
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

export async function attachWorkbenchData(projectRoot, input, options = {}) {
  if (!isRecord(input) || typeof input.kind !== "string") {
    return failure(WorkbenchDiagnosticCodes.DataUnsupported, "A supported data kind is required.", "/kind");
  }
  if (!["geojson", "url", "tiles", "mapspec"].includes(input.kind)) {
    return failure(
      WorkbenchDiagnosticCodes.DataUnsupported,
      `Data kind "${input.kind}" is not supported by Workbench v1.`,
      "/kind",
    );
  }
  if (input.kind !== "geojson" && input.confirmed !== true) return confirmationRequired("/confirmed");
  if (typeof input.sourceId !== "string" || !SAFE_SOURCE_ID_PATTERN.test(input.sourceId)) {
    return failure(
      WorkbenchDiagnosticCodes.UnsafePath,
      "Source id must contain only letters, numbers, underscores, and hyphens.",
      "/sourceId",
    );
  }

  const fileName = input.fileName ?? defaultAttachmentFileName(input.sourceId, input.kind);
  if (typeof fileName !== "string" || !SAFE_DATA_FILE_PATTERN.test(fileName) || fileName === "." || fileName === "..") {
    return failure(
      WorkbenchDiagnosticCodes.UnsafePath,
      "Data filename must be a single safe filename without directories.",
      "/fileName",
    );
  }

  const inspected = inspectWorkbenchData(input, options);
  if (!inspected.ok) return inspected;
  const state = await openWorkbenchProject(projectRoot);
  if (input.baseRevision !== state.project.currentRevision) {
    return revisionConflict(state.project.currentRevision, input.baseRevision);
  }
  if (Object.hasOwn(state.spec.sources ?? {}, input.sourceId)) {
    return failure(
      WorkbenchDiagnosticCodes.RevisionConflict,
      `Source "${input.sourceId}" already exists in this project.`,
      "/sourceId",
    );
  }

  const attachment = buildAttachment(input);
  if (!attachment.ok) return attachment;
  const persisted = `${JSON.stringify(attachment.fileValue, null, 2)}\n`;
  const maxBytes = positiveInteger(options.maxBytes) ?? DEFAULT_MAX_DATA_BYTES;
  const bytes = Buffer.byteLength(persisted);
  if (bytes > maxBytes) {
    return failure(
      WorkbenchDiagnosticCodes.DataTooLarge,
      `Data contains ${bytes} bytes, exceeding the ${maxBytes} byte attachment limit.`,
      "/value",
    );
  }

  const dataDirectory = join(state.root, state.project.paths.dataDirectory);
  const dataPath = join(dataDirectory, fileName);
  await mkdir(dataDirectory, { recursive: true });
  try {
    await writeFile(dataPath, persisted, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (error && typeof error === "object" && error.code === "EEXIST") {
      return failure(
        WorkbenchDiagnosticCodes.RevisionConflict,
        `Data file "${fileName}" already exists and will not be overwritten.`,
        "/fileName",
      );
    }
    throw error;
  }

  const attachedAt = (options.now ?? (() => new Date().toISOString()))();
  const sha256 = `sha256:${createHash("sha256").update(persisted).digest("hex")}`;
  const attachmentEvidence = {
    schemaVersion: "gis-engine.workbench.data-attachment.v1",
    projectId: state.project.id,
    kind: input.kind,
    sourceId: input.sourceId,
    path: `data/${fileName}`,
    bytes,
    sha256,
    attachedAt,
    diagnostics: [],
  };
  const evidenceValidation = validateWorkbenchDataAttachmentResult({
    ...attachmentEvidence,
    previousRevision: state.project.currentRevision,
    revision: state.project.currentRevision,
  });
  if (!evidenceValidation.valid) {
    await rm(dataPath, { force: true });
    return { ok: false, diagnostics: evidenceValidation.diagnostics };
  }

  const attachmentHash = createWorkbenchCanonicalHash({
    projectId: state.project.id,
    baseRevision: input.baseRevision,
    sourceId: input.sourceId,
    fileName,
    sha256,
  });
  let committed = false;
  try {
    const applied = await applyWorkbenchProject(
      projectRoot,
      {
        baseRevision: input.baseRevision,
        planHash: attachmentHash,
        commands: [
          {
            id: `attach-data-${randomUUID()}`,
            version: "0.1",
            type: "addSource",
            sourceId: input.sourceId,
            source: attachment.source,
            baseRevision: input.baseRevision,
            author: { type: "human", id: "workbench-local-user" },
            reason: `Attach data/${fileName}`,
            createdAt: attachedAt,
          },
        ],
      },
      { now: options.now },
    );
    if (!applied.ok) {
      await rm(dataPath, { force: true });
      return applied;
    }
    committed = true;
    if (applied.result.previousRevision !== input.baseRevision || applied.result.revision === input.baseRevision) {
      return failure(
        WorkbenchDiagnosticCodes.TransactionFailed,
        "The attachment committed with an unexpected revision sequence; review the project history before continuing.",
        "/revision",
      );
    }
    const attachmentRecord = {
      ...attachmentEvidence,
      previousRevision: applied.result.previousRevision,
      revision: applied.result.revision,
    };
    const resultValidation = validateWorkbenchDataAttachmentResult(attachmentRecord);
    if (!resultValidation.valid) {
      return failure(
        WorkbenchDiagnosticCodes.TransactionFailed,
        "The committed attachment failed its result contract; the data file stays because the project references it.",
        "/revision",
        resultValidation.diagnostics,
      );
    }
    return { ok: true, result: attachmentRecord, diagnostics: [] };
  } catch (error) {
    if (!committed) await rm(dataPath, { force: true });
    throw error;
  }
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
  const exportPreviews = new Map();

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
      if (request.method === "GET" && route.action === "current") return response(200, state);
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
      if (request.method === "POST" && route.action === "attach") {
        const attachmentRequest = {
          ...request.body,
          schemaVersion: request.body?.schemaVersion ?? "gis-engine.workbench.data-attachment-request.v1",
          projectId: state.project.id,
        };
        const requestValidation = validateWorkbenchDataAttachmentRequest(attachmentRequest);
        if (!requestValidation.valid) {
          const unsafeField = requestValidation.diagnostics.find(
            (item) => item.path === "/fileName" || item.path === "/sourceId",
          );
          return response(422, {
            ok: false,
            diagnostics: unsafeField
              ? [
                  {
                    severity: "error",
                    code: WorkbenchDiagnosticCodes.UnsafePath,
                    path: unsafeField.path,
                    message:
                      unsafeField.path === "/sourceId"
                        ? "Source id must contain only letters, numbers, underscores, and hyphens."
                        : "Data filename must be a single safe filename without directories.",
                  },
                ]
              : requestValidation.diagnostics,
          });
        }
        const result = await attachWorkbenchData(projectRoot, attachmentRequest, { ...options, now });
        return response(result.ok ? 200 : 409, result);
      }
      if (request.method === "POST" && route.action === "plan") {
        const result =
          typeof request.body?.prompt !== "string"
            ? createWorkbenchPlan(request.body, { now })
            : state.project.provider.kind === "openai-compatible"
              ? await createProviderWorkbenchPlan(request.body.prompt, state, options)
              : createMockWorkbenchPlan(request.body.prompt, state, { now });
        if (result.ok) {
          plans.set(result.result.planHash, result.result.plan);
          await persistJsonArtifact(
            projectRoot,
            PLAN_ARTIFACT_DIRECTORY,
            artifactFileName(result.result.planHash, "json"),
            result.result.plan,
          );
        }
        return response(result.ok ? 201 : 422, result);
      }
      if (request.method === "POST" && route.action === "preview") {
        const planArtifact = artifactFileName(route.planHash, "json");
        if (!planArtifact) return response(422, unsafeArtifactDiagnostic("/planHash"));
        const plan =
          plans.get(route.planHash) ?? (await readJsonArtifact(projectRoot, PLAN_ARTIFACT_DIRECTORY, planArtifact));
        if (!plan) return response(404, missingPlan(route.planHash));
        plans.set(route.planHash, plan);
        const result = await previewWorkbenchPlan(projectRoot, plan);
        return response(result.ok ? 200 : 409, result);
      }
      if (request.method === "POST" && route.action === "apply") {
        const planHash = request.body?.planHash;
        const planArtifact = artifactFileName(planHash, "json");
        if (!planArtifact) return response(422, unsafeArtifactDiagnostic("/planHash"));
        const plan =
          plans.get(planHash) ?? (await readJsonArtifact(projectRoot, PLAN_ARTIFACT_DIRECTORY, planArtifact));
        if (!plan) return response(404, missingPlan(request.body?.planHash));
        plans.set(planHash, plan);
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
      if (request.method === "POST" && route.action === "export-preview") {
        const result = await previewWorkbenchExport(projectRoot, request.body, { ...options, now });
        if (result.ok) exportPreviews.set(result.result.previewHash, result.result);
        return response(result.ok ? 200 : 422, result);
      }
      if (request.method === "POST" && route.action === "export-commit") {
        const previewHash = request.body?.previewHash;
        const previewArtifact = artifactFileName(previewHash, "preview.json");
        if (!previewArtifact) return response(422, unsafeArtifactDiagnostic("/previewHash"));
        const preview =
          exportPreviews.get(previewHash) ??
          (await readJsonArtifact(projectRoot, EXPORT_ARTIFACT_DIRECTORY, previewArtifact));
        if (!preview) {
          return response(
            404,
            failure(
              WorkbenchDiagnosticCodes.ExportPreviewMismatch,
              "The confirmed export preview is not available.",
              "/previewHash",
            ),
          );
        }
        exportPreviews.set(previewHash, preview);
        const result = await commitWorkbenchExport(projectRoot, preview, request.body, { now });
        return response(result.ok ? 200 : 409, result);
      }
      return response(405, failure(WorkbenchDiagnosticCodes.ProjectInvalid, "Method is not allowed.", "/method"));
    } catch (error) {
      if (isMissingProjectFile(error)) {
        if (request.method === "GET" && route.action === "current") return response(200, null);
        return response(
          404,
          failure(WorkbenchDiagnosticCodes.ProjectInvalid, "Workbench project was not found.", "/project"),
        );
      }
      if (error instanceof WorkbenchProjectStoreError) {
        return response(422, { ok: false, diagnostics: error.diagnostics });
      }
      throw error;
    }
  };
}

function isMissingProjectFile(error) {
  return error && typeof error === "object" && error.code === "ENOENT";
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

function buildAttachment(input) {
  if (input.kind === "geojson") {
    const parsed = parseJsonValue(input.value);
    if (!parsed.ok || !isGeoJsonObject(parsed.value)) {
      return failure(WorkbenchDiagnosticCodes.DataUnsupported, "GeoJSON must be valid JSON.", "/value");
    }
    return { ok: true, fileValue: parsed.value, source: { type: "geojson", data: parsed.value } };
  }
  if (input.kind === "url") {
    const sourceType = input.sourceType ?? "geojson";
    if (!["geojson", "vector", "pmtiles"].includes(sourceType)) {
      return failure(
        WorkbenchDiagnosticCodes.DataUnsupported,
        "URL sources support geojson, vector, or pmtiles sourceType values.",
        "/sourceType",
      );
    }
    const source =
      sourceType === "geojson" ? { type: "geojson", data: input.value } : { type: sourceType, url: input.value };
    return { ok: true, fileValue: { kind: "url", source }, source };
  }
  if (input.kind === "tiles") {
    const source = structuredClone(input.value);
    return { ok: true, fileValue: { kind: "tiles", source }, source };
  }

  const parsed = parseJsonValue(input.value);
  const sourceEntries = parsed.ok && isRecord(parsed.value?.sources) ? Object.entries(parsed.value.sources) : [];
  const selected = input.mapSpecSourceId
    ? sourceEntries.find(([sourceId]) => sourceId === input.mapSpecSourceId)
    : sourceEntries[0];
  if (!selected) {
    return failure(
      WorkbenchDiagnosticCodes.DataUnsupported,
      "The MapSpec does not contain the requested source.",
      "/mapSpecSourceId",
    );
  }
  return { ok: true, fileValue: parsed.value, source: structuredClone(selected[1]) };
}

function defaultAttachmentFileName(sourceId, kind) {
  return kind === "geojson" ? `${sourceId}.geojson` : `${sourceId}.${kind}.json`;
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
  if (pathname === "/api/projects/current") return { action: "current" };
  const revision = pathname.match(/^\/api\/projects\/([A-Za-z0-9][A-Za-z0-9_-]{0,199})\/revisions\/([^/]+)\/restore$/);
  if (revision) return { action: "restore", projectId: revision[1], revision: decodeURIComponent(revision[2]) };
  const preview = pathname.match(
    /^\/api\/projects\/([A-Za-z0-9][A-Za-z0-9_-]{0,199})\/plans\/(sha256:[a-f0-9]{64})\/preview$/,
  );
  if (preview) return { action: "preview", projectId: preview[1], planHash: preview[2] };
  const action = pathname.match(
    /^\/api\/projects\/([A-Za-z0-9][A-Za-z0-9_-]{0,199})\/(data\/(?:inspect|attach)|plans|apply|export\/preview|export\/commit)$/,
  );
  if (action) {
    return {
      action:
        action[2] === "data/inspect"
          ? "inspect"
          : action[2] === "data/attach"
            ? "attach"
            : action[2] === "plans"
              ? "plan"
              : action[2] === "export/preview"
                ? "export-preview"
                : action[2] === "export/commit"
                  ? "export-commit"
                  : "apply",
      projectId: action[1],
    };
  }
  const read = pathname.match(/^\/api\/projects\/([A-Za-z0-9][A-Za-z0-9_-]{0,199})$/);
  return read ? { action: "read", projectId: read[1] } : null;
}

function createMockWorkbenchPlan(prompt, state, options) {
  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt) {
    return failure(WorkbenchDiagnosticCodes.PlanInvalid, "A non-empty prompt is required.", "/prompt");
  }
  const layer = state.spec.layers?.[0];
  if (!layer) {
    return failure(WorkbenchDiagnosticCodes.PlanInvalid, "The project has no editable layer.", "/prompt");
  }
  const currentPaint = isRecord(layer.paint) ? layer.paint : {};
  const color = normalizedPrompt.match(/\b(red|blue|green|orange|purple)\b/i)?.[1]?.toLowerCase();
  const colorValues = {
    red: "#dc2626",
    blue: "#2563eb",
    green: "#16a34a",
    orange: "#ea580c",
    purple: "#9333ea",
  };
  const paint = { ...currentPaint };
  if (color) paint[`${layer.type}-color`] = colorValues[color];
  if (/\b(larger|bigger|increase|large)\b/i.test(normalizedPrompt) && layer.type === "circle") {
    paint["circle-radius"] = typeof currentPaint["circle-radius"] === "number" ? currentPaint["circle-radius"] + 2 : 8;
  }
  if (Object.keys(paint).length === Object.keys(currentPaint).length && !color) {
    paint[`${layer.type}-color`] = "#dc2626";
  }
  return createWorkbenchPlan(
    {
      goal: `Update layer styling for ${layer.id}`,
      baseRevision: state.project.currentRevision,
      promptHash: createWorkbenchPromptHash(normalizedPrompt),
      commands: [
        {
          id: `mock-style-${randomUUID()}`,
          version: "0.1",
          type: "setPaint",
          layerId: layer.id,
          paint,
        },
      ],
      affectedPaths: ["mapspec.json"],
      resourceRequests: [],
      unsupportedIntents: [],
      diagnostics: [],
    },
    { now: options.now },
  );
}

async function createProviderWorkbenchPlan(prompt, state, options) {
  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt) {
    return failure(WorkbenchDiagnosticCodes.PlanInvalid, "A non-empty prompt is required.", "/prompt");
  }
  const configured = options.openAiProvider;
  if (
    !configured?.profile ||
    typeof configured.call !== "function" ||
    !configured.apiKey ||
    configured.profile.id !== state.project.provider.profileId
  ) {
    return failure(
      WorkbenchDiagnosticCodes.ProviderUnavailable,
      "The selected server-held provider credential is not configured.",
      "/provider",
    );
  }

  const providerResult = await configured.call({
    profile: configured.profile,
    apiKey: configured.apiKey,
    message: normalizedPrompt,
    summary: summarizeProjectForProvider(state.spec),
    capabilityPrompt: options.capabilityPrompt ?? "",
  });
  if (!providerResult?.ok) {
    return failure(
      WorkbenchDiagnosticCodes.ProviderUnavailable,
      "The configured provider could not produce a plan.",
      "/provider",
    );
  }

  const promptHash = createWorkbenchPromptHash(normalizedPrompt);
  const command = providerOutputToCommand(providerResult.providerOutput, promptHash, configured.profile.id);
  if (!command) {
    return failure(
      WorkbenchDiagnosticCodes.PlanInvalid,
      "The provider response did not map to a supported Workbench command.",
      "/providerResponse/action",
    );
  }
  return createWorkbenchPlan(
    {
      goal: `Review ${command.type} for the current map`,
      baseRevision: state.project.currentRevision,
      promptHash,
      commands: [command],
      affectedPaths: ["mapspec.json"],
      resourceRequests: [],
      unsupportedIntents: [],
      diagnostics: [],
    },
    { now: options.now },
  );
}

function summarizeProjectForProvider(spec) {
  return {
    sources: Object.keys(spec.sources ?? {}),
    layers: spec.layers?.length ?? 0,
    layerIds: (spec.layers ?? []).map((layer) => layer.id),
    layerDetails: (spec.layers ?? []).map((layer) => ({
      id: layer.id,
      type: layer.type,
      source: layer.source,
      filter: layer.filter,
      minzoom: layer.minzoom,
      maxzoom: layer.maxzoom,
    })),
    view: spec.view,
  };
}

function providerOutputToCommand(output, promptHash, providerId) {
  if (!isRecord(output) || typeof output.action !== "string") return null;
  const command = {
    id: `provider-${randomUUID()}`,
    version: "0.1",
    author: { type: "agent", id: providerId },
    sourcePromptHash: promptHash,
  };
  if (output.action === "setPaint" && typeof output.layerId === "string" && isRecord(output.paint)) {
    return { ...command, type: "setPaint", layerId: output.layerId, paint: output.paint };
  }
  if (output.action === "setLayout" && typeof output.layerId === "string" && isRecord(output.layout)) {
    return { ...command, type: "setLayout", layerId: output.layerId, layout: output.layout };
  }
  if (output.action === "setFilter" && typeof output.layerId === "string") {
    return { ...command, type: "setFilter", layerId: output.layerId, filter: output.filter ?? null };
  }
  if (
    output.action === "setLayerZoomRange" &&
    typeof output.layerId === "string" &&
    typeof output.minzoom === "number" &&
    typeof output.maxzoom === "number"
  ) {
    return {
      ...command,
      type: "setLayerZoomRange",
      layerId: output.layerId,
      minzoom: output.minzoom,
      maxzoom: output.maxzoom,
    };
  }
  if (output.action === "reorderLayer" && typeof output.layerId === "string") {
    return {
      ...command,
      type: "reorderLayer",
      layerId: output.layerId,
      ...(typeof output.beforeLayerId === "string" ? { beforeLayerId: output.beforeLayerId } : {}),
    };
  }
  if (output.action === "fitBounds" && Array.isArray(output.bounds)) {
    return { ...command, type: "fitBounds", bounds: output.bounds };
  }
  if (output.action === "setView" && isRecord(output.view)) {
    return { ...command, type: "setView", view: output.view };
  }
  if (output.action === "addLayer" && isRecord(output.layer)) {
    return {
      ...command,
      type: "addLayer",
      layer: output.layer,
      ...(typeof output.beforeLayerId === "string" ? { beforeLayerId: output.beforeLayerId } : {}),
    };
  }
  if (output.action === "removeLayer" && typeof output.layerId === "string") {
    return { ...command, type: "removeLayer", layerId: output.layerId };
  }
  return null;
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

function artifactFileName(hash, suffix) {
  if (typeof hash !== "string") return null;
  const matched = ARTIFACT_HASH_PATTERN.exec(hash);
  return matched ? `${matched[1]}.${suffix}` : null;
}

function unsafeArtifactDiagnostic(path) {
  return failure(WorkbenchDiagnosticCodes.UnsafePath, "The artifact identifier must be a sha256 hash.", path);
}

async function persistJsonArtifact(projectRoot, directory, fileName, value) {
  const artifactDirectory = join(projectRoot, directory);
  await mkdir(artifactDirectory, { recursive: true });
  try {
    await writeFile(join(artifactDirectory, fileName), `${JSON.stringify(value, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
  } catch (error) {
    if (!error || typeof error !== "object" || error.code !== "EEXIST") throw error;
  }
}

async function readJsonArtifact(projectRoot, directory, fileName) {
  try {
    return JSON.parse(await readFile(join(projectRoot, directory, fileName), "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    if (error && typeof error === "object" && (error.code === "ENOENT" || error.code === "ENOTDIR")) return null;
    throw error;
  }
}
