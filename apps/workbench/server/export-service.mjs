import { createHash, randomUUID } from "node:crypto";
import { access, lstat, mkdir, mkdtemp, readdir, readFile, realpath, rename, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { verifyArtifacts, writeMapProjectDelivery } from "@gis-engine/cli";
import {
  createWorkbenchCanonicalHash,
  validateWorkbenchExportPreview,
  validateWorkbenchExportReceipt,
  WorkbenchDiagnosticCodes,
} from "../dist/contracts/index.js";
import { openWorkbenchProject } from "./project-store.mjs";

export async function previewWorkbenchExport(projectRoot, input, options = {}) {
  const target = await resolveExportTarget(projectRoot, input?.targetRelativePath);
  if (!target.ok) return target;
  const state = await openWorkbenchProject(projectRoot);
  const now = options.now ?? (() => new Date().toISOString());
  const createdAt = now();
  const stagingRoot = await mkdtemp(join(tmpdir(), "gis-engine-workbench-export-preview-"));

  try {
    writeMapProjectDelivery({
      outputDir: stagingRoot,
      projectName: state.project.name,
      spec: state.spec,
      generatedAt: createdAt,
      providerKind: state.project.provider.kind,
    });
    const verification = verifyArtifacts({ projectDir: stagingRoot });
    if (!verification.ok) {
      return failure(
        WorkbenchDiagnosticCodes.TransactionFailed,
        "The export staging manifest did not pass artifact verification.",
        "/files",
        verification.diagnostics,
      );
    }

    const files = await describeFiles(stagingRoot, target.targetPath);
    const collision = (await pathExists(target.targetPath)) || files.some((file) => file.collision);
    const diagnostics = collision
      ? [
          diagnostic(
            WorkbenchDiagnosticCodes.ExportCollision,
            "The selected export target already exists; Workbench will not overwrite it.",
            "/targetRelativePath",
          ),
        ]
      : [];
    const previewBase = {
      schemaVersion: "gis-engine.workbench.export-preview.v1",
      projectId: state.project.id,
      targetRelativePath: target.relativePath,
      files,
      preflightCommands: ["pnpm install", "pnpm build"],
      diagnostics,
      createdAt,
    };
    const preview = {
      ...previewBase,
      previewHash: createWorkbenchCanonicalHash(previewBase),
    };
    const validation = validateWorkbenchExportPreview(preview);
    if (!validation.valid) return { ok: false, diagnostics: validation.diagnostics };
    return { ok: true, result: preview, diagnostics: [] };
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }
}

export async function commitWorkbenchExport(projectRoot, preview, confirmation, options = {}) {
  const previewValidation = validateWorkbenchExportPreview(preview);
  if (!previewValidation.valid) return { ok: false, diagnostics: previewValidation.diagnostics };
  if (confirmation?.previewHash !== preview.previewHash) {
    return failure(
      WorkbenchDiagnosticCodes.ExportPreviewMismatch,
      "Export confirmation does not match the reviewed preview.",
      "/previewHash",
    );
  }
  if (preview.diagnostics.length > 0 || preview.files.some((file) => file.collision)) {
    return failure(
      WorkbenchDiagnosticCodes.ExportCollision,
      "Resolve export collisions and create a new preview before confirming.",
      "/targetRelativePath",
    );
  }

  const target = await resolveExportTarget(projectRoot, preview.targetRelativePath);
  if (!target.ok) return target;
  if (await pathExists(target.targetPath)) {
    return failure(
      WorkbenchDiagnosticCodes.ExportCollision,
      "The export target changed after preview and will not be overwritten.",
      "/targetRelativePath",
    );
  }

  const state = await openWorkbenchProject(projectRoot);
  if (state.project.id !== preview.projectId) {
    return failure(
      WorkbenchDiagnosticCodes.ProjectInvalid,
      "The export preview belongs to another project.",
      "/projectId",
    );
  }

  const targetParent = resolve(target.targetPath, "..");
  await mkdir(targetParent, { recursive: true });
  const stagingRoot = join(targetParent, `.gis-engine-export-${randomUUID()}`);
  try {
    writeMapProjectDelivery({
      outputDir: stagingRoot,
      projectName: state.project.name,
      spec: state.spec,
      generatedAt: preview.createdAt,
      providerKind: state.project.provider.kind,
    });
    const verification = verifyArtifacts({ projectDir: stagingRoot });
    if (!verification.ok) {
      return failure(
        WorkbenchDiagnosticCodes.TransactionFailed,
        "The confirmed export failed artifact verification.",
        "/files",
        verification.diagnostics,
      );
    }

    const stagedFiles = await describeFiles(stagingRoot, target.targetPath, false);
    if (!samePreviewFiles(preview.files, stagedFiles)) {
      return failure(
        WorkbenchDiagnosticCodes.ExportPreviewMismatch,
        "Generated export files no longer match the reviewed preview.",
        "/files",
      );
    }
    await rename(stagingRoot, target.targetPath);

    const committedAt = (options.now ?? (() => new Date().toISOString()))();
    const manifest = stagedFiles.find((file) => file.path === "artifact-manifest.json");
    const receipt = {
      schemaVersion: "gis-engine.workbench.export-receipt.v1",
      projectId: state.project.id,
      previewHash: preview.previewHash,
      targetRelativePath: target.relativePath,
      writtenFiles: stagedFiles.map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 })),
      manifestHash: manifest?.sha256 ?? createWorkbenchCanonicalHash(null),
      diagnostics: [],
      committedAt,
    };
    const validation = validateWorkbenchExportReceipt(receipt);
    if (!validation.valid) return { ok: false, diagnostics: validation.diagnostics };
    return { ok: true, result: receipt, diagnostics: [] };
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }
}

async function resolveExportTarget(projectRoot, targetRelativePath) {
  if (
    typeof targetRelativePath !== "string" ||
    targetRelativePath.length === 0 ||
    isAbsolute(targetRelativePath) ||
    targetRelativePath.includes("\\") ||
    targetRelativePath.split(/[\\/]/).includes("..")
  ) {
    return failure(
      WorkbenchDiagnosticCodes.UnsafePath,
      "Export target must be a relative path inside the selected project root.",
      "/targetRelativePath",
    );
  }
  const root = await realpath(resolve(projectRoot));
  const targetPath = resolve(root, targetRelativePath);
  const relativePath = relative(root, targetPath).split("\\").join("/");
  if (!relativePath || relativePath.startsWith("../") || isAbsolute(relativePath)) {
    return failure(
      WorkbenchDiagnosticCodes.UnsafePath,
      "Export target resolves outside the selected project root.",
      "/targetRelativePath",
    );
  }
  const segments = relativePath.split("/").slice(0, -1);
  let ancestor = root;
  for (const segment of segments) {
    ancestor = join(ancestor, segment);
    try {
      if ((await lstat(ancestor)).isSymbolicLink()) {
        return failure(
          WorkbenchDiagnosticCodes.UnsafePath,
          "Export target must not traverse a symbolic link.",
          "/targetRelativePath",
        );
      }
    } catch (error) {
      if (error && typeof error === "object" && error.code === "ENOENT") break;
      throw error;
    }
  }
  return { ok: true, targetPath, relativePath };
}

async function describeFiles(root, targetPath, checkCollisions = true) {
  const paths = await listFiles(root);
  return Promise.all(
    paths.map(async (path) => {
      const filePath = join(root, path);
      const bytes = (await stat(filePath)).size;
      return {
        path,
        role: fileRole(path),
        bytes,
        sha256: `sha256:${createHash("sha256")
          .update(await readFile(filePath))
          .digest("hex")}`,
        collision: checkCollisions ? await pathExists(join(targetPath, path)) : false,
      };
    }),
  );
}

async function listFiles(root, relativeRoot = "") {
  const entries = await readdir(join(root, relativeRoot), { withFileTypes: true });
  const paths = await Promise.all(
    entries.map(async (entry) => {
      const path = relativeRoot ? `${relativeRoot}/${entry.name}` : entry.name;
      return entry.isDirectory() ? listFiles(root, path) : [path];
    }),
  );
  return paths.flat().sort();
}

function fileRole(path) {
  if (path === "artifact-manifest.json") return "manifest";
  if (path === "README.md") return "documentation";
  if (path === ".env.example" || path.endsWith("config.json")) return "configuration";
  if (path === "mapspec.json") return "data";
  if (path === "preflight.json" || path === "delivery-summary.json") return "evidence";
  return "application";
}

function samePreviewFiles(previewFiles, stagedFiles) {
  const comparable = (file) => ({ path: file.path, role: file.role, bytes: file.bytes, sha256: file.sha256 });
  return JSON.stringify(previewFiles.map(comparable)) === JSON.stringify(stagedFiles.map(comparable));
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function failure(code, message, path, relatedDiagnostics = []) {
  return { ok: false, diagnostics: [diagnostic(code, message, path), ...relatedDiagnostics] };
}

function diagnostic(code, message, path) {
  return { severity: "error", code, message, path };
}
