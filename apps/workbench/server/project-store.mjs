import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, realpath, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { diffSpecsTool } from "@gis-engine/ai";
import { applyCommands, validateSpec } from "@gis-engine/engine";
import initSqlJs from "sql.js";
import {
  createWorkbenchCanonicalHash,
  validateWorkbenchProject,
  WorkbenchDiagnosticCodes,
} from "../dist/contracts/index.js";

const PROJECT_FILE = "gis-engine.project.json";
const MAP_SPEC_FILE = "mapspec.json";
const REVISION_DIRECTORY = join(".gis-engine", "revisions");
const REVISION_SCHEMA_VERSION = "gis-engine.workbench.revision.v1";

export class WorkbenchProjectStoreError extends Error {
  constructor(message, diagnostics) {
    super(message);
    this.name = "WorkbenchProjectStoreError";
    this.diagnostics = diagnostics;
  }
}

export async function createWorkbenchProject(input, options = {}) {
  const now = options.now ?? (() => new Date().toISOString());
  const root = await prepareProjectRoot(input.root);
  const existingCanonicalFiles = await Promise.all([
    readOptional(join(root, PROJECT_FILE)),
    readOptional(join(root, MAP_SPEC_FILE)),
  ]);
  if (existingCanonicalFiles.some((value) => value !== null)) {
    throw new WorkbenchProjectStoreError("Refusing to overwrite an existing Workbench project.", [
      diagnostic(
        WorkbenchDiagnosticCodes.RevisionConflict,
        "Open or migrate the existing project instead of creating over it.",
        "/root",
      ),
    ]);
  }
  const createdAt = now();
  const initialSpec = structuredClone(input.initialSpec);
  initialSpec.revision ??= "0";

  const validation = validateSpec(initialSpec);
  if (!validation.valid) {
    throw new WorkbenchProjectStoreError("Initial MapSpec is invalid.", validation.diagnostics);
  }

  const project = {
    schemaVersion: "gis-engine.workbench.project.v1",
    id: input.id,
    name: input.name,
    currentRevision: initialSpec.revision,
    paths: {
      mapSpec: MAP_SPEC_FILE,
      dataDirectory: "data",
      revisionsDirectory: REVISION_DIRECTORY,
      exportsDirectory: "exports",
    },
    provider: input.provider ?? { kind: "mock" },
    telemetryConsent: input.telemetryConsent ?? false,
    createdAt,
    updatedAt: createdAt,
  };
  assertProject(project);

  await mkdir(join(root, "data"), { recursive: true });
  await mkdir(join(root, REVISION_DIRECTORY), { recursive: true });
  const receipt = createRevisionReceipt({
    sequence: 0,
    revision: initialSpec.revision,
    previousRevision: null,
    kind: "create",
    createdAt,
    commands: [],
    commandResults: [],
    spec: initialSpec,
  });
  await commitProjectState(root, project, initialSpec, receipt, { create: true });

  return { root, project, spec: initialSpec, history: [receipt] };
}

export async function openWorkbenchProject(projectRoot) {
  const root = await resolveExistingProjectRoot(projectRoot);
  const [project, spec, history] = await Promise.all([
    readJson(join(root, PROJECT_FILE)),
    readJson(join(root, MAP_SPEC_FILE)),
    readRevisionHistory(root),
  ]);
  assertProject(project);

  const validation = validateSpec(spec);
  if (!validation.valid) {
    throw new WorkbenchProjectStoreError("Stored MapSpec is invalid.", validation.diagnostics);
  }
  if (spec.revision !== project.currentRevision) {
    throw new WorkbenchProjectStoreError("Project and MapSpec revisions do not match.", [
      diagnostic(
        WorkbenchDiagnosticCodes.RevisionConflict,
        "Project metadata and mapspec.json point to different revisions.",
        "/currentRevision",
      ),
    ]);
  }
  if (!history.some((receipt) => receipt.revision === project.currentRevision)) {
    throw new WorkbenchProjectStoreError("Current revision receipt is missing.", [
      diagnostic(
        WorkbenchDiagnosticCodes.RevisionConflict,
        "The current revision has no immutable receipt.",
        "/currentRevision",
      ),
    ]);
  }

  return { root, project, spec, history };
}

export async function applyWorkbenchProject(projectRoot, input, options = {}) {
  const state = await openWorkbenchProject(projectRoot);
  return applyProjectTransaction(state, input, {
    now: options.now,
    kind: "apply",
  });
}

export async function restoreWorkbenchRevision(projectRoot, input, options = {}) {
  const state = await openWorkbenchProject(projectRoot);
  if (state.project.currentRevision !== input.baseRevision) {
    return revisionConflict(state.project.currentRevision, input.baseRevision);
  }

  const target = state.history.find((receipt) => receipt.revision === input.targetRevision);
  if (!target) {
    return failure(
      WorkbenchDiagnosticCodes.RevisionConflict,
      `Revision "${input.targetRevision}" does not exist in this project.`,
      "/targetRevision",
    );
  }

  const diff = diffSpecsTool({ before: state.spec, after: target.spec });
  if (!diff.ok || diff.result.commands.length === 0) {
    return failure(
      WorkbenchDiagnosticCodes.TransactionFailed,
      "The target revision cannot be restored through the current command contract.",
      "/targetRevision",
      diff.diagnostics,
    );
  }

  return applyProjectTransaction(
    state,
    {
      baseRevision: input.baseRevision,
      planHash: createWorkbenchCanonicalHash({
        operation: "restore",
        projectId: state.project.id,
        baseRevision: input.baseRevision,
        targetRevision: input.targetRevision,
      }),
      commands: diff.result.commands,
    },
    {
      now: options.now,
      kind: "restore",
      restoredFromRevision: input.targetRevision,
      expectedSpec: target.spec,
    },
  );
}

export async function replayWorkbenchProject(projectRoot) {
  const state = await openWorkbenchProject(projectRoot);
  const [initial, ...receipts] = state.history;
  if (!initial) {
    return failure(
      WorkbenchDiagnosticCodes.TransactionFailed,
      "The project has no initial revision receipt.",
      "/history",
    );
  }

  let spec = structuredClone(initial.spec);
  for (const receipt of receipts) {
    const replay = applyCommands(spec, receipt.commands, { transaction: "atomic" });
    if (replay.rolledBack || replay.results.some((result) => result.status === "failed")) {
      return failure(
        WorkbenchDiagnosticCodes.TransactionFailed,
        `Revision "${receipt.revision}" could not be replayed.`,
        "/history",
        replay.results.flatMap((result) => result.diagnostics),
      );
    }
    spec = replay.spec;
    if (!sameSpec(spec, receipt.spec)) {
      return failure(
        WorkbenchDiagnosticCodes.TransactionFailed,
        `Revision "${receipt.revision}" replay did not match its receipt.`,
        "/history",
      );
    }
  }

  if (!sameSpec(spec, state.spec)) {
    return failure(
      WorkbenchDiagnosticCodes.TransactionFailed,
      "Replayed history does not match mapspec.json.",
      "/history",
    );
  }
  return { ok: true, spec };
}

export async function exportLegacyWorkbenchProjects(databasePath) {
  const bytes = await readFile(resolve(databasePath));
  const SQL = await initSqlJs();
  const database = new SQL.Database(bytes);
  try {
    const result = database.exec(
      "SELECT id, name, spec, revision, basemap_id, audit_records, review_decisions, created_at, updated_at FROM maps ORDER BY updated_at DESC",
    );
    if (result.length === 0) return [];
    const [{ columns, values }] = result;
    return values.map((row) => {
      const record = Object.fromEntries(columns.map((column, index) => [column, row[index]]));
      return {
        id: String(record.id),
        name: String(record.name),
        revision: String(record.revision),
        basemapId: String(record.basemap_id ?? "none"),
        spec: parseJson(record.spec, null),
        auditRecords: parseJson(record.audit_records, []),
        reviewDecisions: parseJson(record.review_decisions, []),
        createdAt: String(record.created_at),
        updatedAt: String(record.updated_at),
      };
    });
  } finally {
    database.close();
  }
}

async function applyProjectTransaction(state, input, options) {
  if (state.project.currentRevision !== input.baseRevision) {
    return revisionConflict(state.project.currentRevision, input.baseRevision);
  }
  if (!Array.isArray(input.commands) || input.commands.length === 0) {
    return failure(
      WorkbenchDiagnosticCodes.PlanInvalid,
      "A project transaction requires at least one command.",
      "/commands",
    );
  }

  const applied = applyCommands(state.spec, input.commands, {
    transaction: "atomic",
    collectTrace: true,
  });
  const commandDiagnostics = applied.results.flatMap((result) => result.diagnostics);
  if (applied.rolledBack || applied.results.some((result) => result.status === "failed") || !applied.committed) {
    return failure(
      WorkbenchDiagnosticCodes.TransactionFailed,
      "The command transaction failed; the project was not changed.",
      "/commands",
      commandDiagnostics,
    );
  }
  if (options.expectedSpec && !sameSpecIgnoringRevision(applied.spec, options.expectedSpec)) {
    return failure(
      WorkbenchDiagnosticCodes.TransactionFailed,
      "The restore commands did not reproduce the requested revision.",
      "/targetRevision",
    );
  }

  const now = options.now ?? (() => new Date().toISOString());
  const appliedAt = now();
  const nextProject = {
    ...state.project,
    currentRevision: applied.spec.revision,
    updatedAt: appliedAt,
  };
  const receipt = createRevisionReceipt({
    sequence: state.history.length,
    revision: applied.spec.revision,
    previousRevision: state.project.currentRevision,
    kind: options.kind,
    restoredFromRevision: options.restoredFromRevision,
    planHash: input.planHash,
    createdAt: appliedAt,
    commands: input.commands,
    commandResults: applied.results,
    spec: applied.spec,
  });
  await commitProjectState(state.root, nextProject, applied.spec, receipt);

  return {
    ok: true,
    result: {
      schemaVersion: "gis-engine.workbench.apply-result.v1",
      projectId: state.project.id,
      planHash: input.planHash,
      previousRevision: state.project.currentRevision,
      revision: applied.spec.revision,
      appliedCommandIds: applied.results
        .filter((result) => result.status === "applied")
        .map((result) => result.commandId),
      receiptHash: receipt.receiptHash,
      diagnostics: commandDiagnostics,
      appliedAt,
    },
  };
}

function createRevisionReceipt(input) {
  const receipt = {
    schemaVersion: REVISION_SCHEMA_VERSION,
    sequence: input.sequence,
    revision: input.revision,
    previousRevision: input.previousRevision,
    kind: input.kind,
    createdAt: input.createdAt,
    commands: structuredClone(input.commands),
    commandResults: structuredClone(input.commandResults),
    spec: structuredClone(input.spec),
  };
  if (input.planHash) receipt.planHash = input.planHash;
  if (input.restoredFromRevision) receipt.restoredFromRevision = input.restoredFromRevision;
  return { ...receipt, receiptHash: createWorkbenchCanonicalHash(receipt) };
}

async function commitProjectState(root, project, spec, receipt, options = {}) {
  assertProject(project);
  const validation = validateSpec(spec);
  if (!validation.valid) {
    throw new WorkbenchProjectStoreError("Refusing to persist an invalid MapSpec.", validation.diagnostics);
  }

  const receiptPath = join(root, REVISION_DIRECTORY, `${receipt.revision}.json`);
  if (!options.create) {
    const existing = await readOptional(receiptPath);
    if (existing !== null) {
      throw new WorkbenchProjectStoreError("Refusing to overwrite an immutable revision receipt.", [
        diagnostic(
          WorkbenchDiagnosticCodes.RevisionConflict,
          `Revision receipt "${receipt.revision}" already exists.`,
          "/revision",
        ),
      ]);
    }
  }

  const stagedReceipt = await stageJson(receiptPath, receipt);
  const stagedSpec = await stageJson(join(root, MAP_SPEC_FILE), spec);
  const stagedProject = await stageJson(join(root, PROJECT_FILE), project);
  await rename(stagedReceipt, receiptPath);
  await rename(stagedSpec, join(root, MAP_SPEC_FILE));
  await rename(stagedProject, join(root, PROJECT_FILE));
}

async function stageJson(targetPath, value) {
  await mkdir(dirname(targetPath), { recursive: true });
  const stagedPath = `${targetPath}.${randomUUID()}.tmp`;
  await writeFile(stagedPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  return stagedPath;
}

async function readRevisionHistory(root) {
  const directory = join(root, REVISION_DIRECTORY);
  const entries = await readdir(directory, { withFileTypes: true });
  const receipts = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => readJson(join(directory, entry.name))),
  );
  return receipts.sort((left, right) => left.sequence - right.sequence);
}

async function prepareProjectRoot(projectRoot) {
  if (typeof projectRoot !== "string" || projectRoot.trim().length === 0) {
    throw new WorkbenchProjectStoreError("Project root is required.", [
      diagnostic(WorkbenchDiagnosticCodes.UnsafePath, "Project root is required.", "/root"),
    ]);
  }
  const resolved = resolve(projectRoot);
  await mkdir(resolved, { recursive: true });
  return realpath(resolved);
}

async function resolveExistingProjectRoot(projectRoot) {
  const resolved = resolve(projectRoot);
  try {
    return await realpath(resolved);
  } catch {
    throw new WorkbenchProjectStoreError("Project root does not exist.", [
      diagnostic(WorkbenchDiagnosticCodes.UnsafePath, "Project root does not exist.", "/root"),
    ]);
  }
}

function assertProject(project) {
  const validation = validateWorkbenchProject(project);
  if (!validation.valid) {
    throw new WorkbenchProjectStoreError("Workbench project metadata is invalid.", validation.diagnostics);
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function readOptional(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return null;
    throw error;
  }
}

function parseJson(value, fallback) {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function revisionConflict(currentRevision, requestedRevision) {
  return failure(
    WorkbenchDiagnosticCodes.RevisionConflict,
    `Base revision "${requestedRevision}" does not match current revision "${currentRevision}".`,
    "/baseRevision",
  );
}

function failure(code, message, path, relatedDiagnostics = []) {
  return {
    ok: false,
    diagnostics: [diagnostic(code, message, path), ...relatedDiagnostics],
  };
}

function diagnostic(code, message, path) {
  return { severity: "error", code, message, path };
}

function sameSpec(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sameSpecIgnoringRevision(left, right) {
  const { revision: _leftRevision, ...leftRest } = left;
  const { revision: _rightRevision, ...rightRest } = right;
  return sameSpec(leftRest, rightRest);
}
