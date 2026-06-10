import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

export interface VerifyArtifactsOptions {
  projectDir: string;
}

export interface VerifyArtifactDiagnostic {
  severity: "error" | "warning" | "info";
  code: string;
  path?: string;
  message: string;
}

export interface VerifyArtifactFileResult {
  path: string;
  role?: string;
  required?: boolean;
  status: "verified" | "missing" | "byte-mismatch" | "hash-mismatch" | "invalid";
  expectedBytes?: number;
  actualBytes?: number;
  expectedSha256?: string;
  actualSha256?: string;
}

export interface VerifyArtifactsResult {
  ok: boolean;
  mode: "artifact-manifest-verify";
  status: "verified" | "blocked";
  projectDir: string;
  manifestPath: string;
  summary: {
    manifestFileCount: number;
    verifiedFileCount: number;
    requiredFileCount: number;
    missingFileCount: number;
    byteMismatchCount: number;
    hashMismatchCount: number;
  };
  files: VerifyArtifactFileResult[];
  diagnostics: VerifyArtifactDiagnostic[];
}

type ManifestFileEntry = {
  path?: unknown;
  role?: unknown;
  required?: unknown;
  bytes?: unknown;
  sha256?: unknown;
};

type ArtifactManifestShape = {
  files?: unknown;
  requiredReviewFiles?: unknown;
};

const MANIFEST_FILE = "artifact-manifest.json";
const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/i;

export function verifyArtifacts(options: VerifyArtifactsOptions): VerifyArtifactsResult {
  const projectDir = resolve(options.projectDir);
  const manifestPath = join(projectDir, MANIFEST_FILE);
  const diagnostics: VerifyArtifactDiagnostic[] = [];
  const files: VerifyArtifactFileResult[] = [];

  const manifest = readManifest(manifestPath, diagnostics);
  if (!manifest) {
    return buildVerifyResult(projectDir, manifestPath, files, diagnostics);
  }

  const manifestFiles = Array.isArray(manifest.files) ? manifest.files : undefined;
  if (!manifestFiles) {
    diagnostics.push({
      severity: "error",
      code: "ARTIFACT_MANIFEST.INVALID_FILES",
      path: MANIFEST_FILE,
      message: "artifact-manifest.json must contain a files array.",
    });
    return buildVerifyResult(projectDir, manifestPath, files, diagnostics);
  }

  if (manifest.requiredReviewFiles !== undefined && !Array.isArray(manifest.requiredReviewFiles)) {
    diagnostics.push({
      severity: "error",
      code: "ARTIFACT_MANIFEST.INVALID_REQUIRED_REVIEW_FILES",
      path: "requiredReviewFiles",
      message: "artifact-manifest.json requiredReviewFiles must be an array when present.",
    });
  }

  const requiredReviewFiles = Array.isArray(manifest.requiredReviewFiles)
    ? manifest.requiredReviewFiles.flatMap((requiredPath, index) => {
        if (typeof requiredPath === "string") return [requiredPath];
        diagnostics.push({
          severity: "error",
          code: "ARTIFACT_MANIFEST.INVALID_REQUIRED_REVIEW_FILE",
          path: `requiredReviewFiles[${index}]`,
          message: "Required review file entries must be strings.",
        });
        return [];
      })
    : [];
  const manifestPaths = new Set<string>();

  for (const [index, entry] of manifestFiles.entries()) {
    const result = verifyManifestFileEntry(projectDir, entry, index, diagnostics);
    files.push(result);
    manifestPaths.add(result.path);
  }

  if (manifestPaths.has(MANIFEST_FILE)) {
    diagnostics.push({
      severity: "error",
      code: "ARTIFACT_MANIFEST.SELF_REFERENCE",
      path: MANIFEST_FILE,
      message: "artifact-manifest.json must not include itself in the files list.",
    });
  }

  for (const requiredPath of requiredReviewFiles) {
    if (!manifestPaths.has(requiredPath)) {
      diagnostics.push({
        severity: "error",
        code: "ARTIFACT_MANIFEST.REQUIRED_ENTRY_MISSING",
        path: requiredPath,
        message: `Required review file "${requiredPath}" is not listed in artifact-manifest.json.`,
      });
    }
  }

  return buildVerifyResult(projectDir, manifestPath, files, diagnostics);
}

export function formatVerifyArtifactsText(result: VerifyArtifactsResult): string {
  const lines = [
    "Artifact manifest verification",
    `  Directory:  ${result.projectDir}`,
    `  Manifest:   ${result.manifestPath}`,
    `  Status:     ${result.status}`,
    `  Files:      ${result.summary.verifiedFileCount}/${result.summary.manifestFileCount} verified`,
    `  Required:   ${result.summary.requiredFileCount}`,
    `  Missing:    ${result.summary.missingFileCount}`,
    `  Bytes:      ${result.summary.byteMismatchCount} mismatches`,
    `  Hashes:     ${result.summary.hashMismatchCount} mismatches`,
  ];

  if (result.status === "blocked") {
    lines.push("  Next step:  restore the missing or changed generated review artifacts, then rerun verification.");
  }

  for (const diagnostic of result.diagnostics) {
    lines.push(`  - [${diagnostic.severity}] ${diagnostic.code} ${diagnostic.path ?? "/"}: ${diagnostic.message}`);
  }

  return `${lines.join("\n")}\n`;
}

function readManifest(
  manifestPath: string,
  diagnostics: VerifyArtifactDiagnostic[],
): ArtifactManifestShape | undefined {
  try {
    const parsed = JSON.parse(readFileSync(manifestPath, "utf-8")) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      diagnostics.push({
        severity: "error",
        code: "ARTIFACT_MANIFEST.INVALID_JSON",
        path: MANIFEST_FILE,
        message: "artifact-manifest.json must contain a JSON object.",
      });
      return undefined;
    }
    return parsed as ArtifactManifestShape;
  } catch (error) {
    diagnostics.push({
      severity: "error",
      code: "ARTIFACT_MANIFEST.READ_FAILED",
      path: MANIFEST_FILE,
      message: `Could not read artifact-manifest.json: ${error instanceof Error ? error.message : String(error)}`,
    });
    return undefined;
  }
}

function verifyManifestFileEntry(
  projectDir: string,
  entry: unknown,
  index: number,
  diagnostics: VerifyArtifactDiagnostic[],
): VerifyArtifactFileResult {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    diagnostics.push({
      severity: "error",
      code: "ARTIFACT_MANIFEST.INVALID_ENTRY",
      path: `files[${index}]`,
      message: "Manifest file entries must be JSON objects.",
    });
    return { path: `files[${index}]`, status: "invalid" };
  }

  const manifestEntry = entry as ManifestFileEntry;
  const path = typeof manifestEntry.path === "string" ? manifestEntry.path : "";
  const role = typeof manifestEntry.role === "string" ? manifestEntry.role : undefined;
  const required = typeof manifestEntry.required === "boolean" ? manifestEntry.required : undefined;
  const expectedBytes =
    typeof manifestEntry.bytes === "number" && Number.isInteger(manifestEntry.bytes) ? manifestEntry.bytes : undefined;
  const expectedSha256 = typeof manifestEntry.sha256 === "string" ? manifestEntry.sha256 : undefined;
  const base = {
    path: path || "<invalid>",
    ...(role !== undefined ? { role } : {}),
    ...(required !== undefined ? { required } : {}),
    ...(expectedBytes !== undefined ? { expectedBytes } : {}),
    ...(expectedSha256 !== undefined ? { expectedSha256 } : {}),
  };

  if (!path || isAbsolute(path) || !isInsideProject(projectDir, path)) {
    diagnostics.push({
      severity: "error",
      code: "ARTIFACT_MANIFEST.INVALID_PATH",
      path: path || "<invalid>",
      message: "Manifest file paths must be relative paths inside the project directory.",
    });
    return { ...base, status: "invalid" };
  }

  if (expectedBytes === undefined || expectedBytes < 0) {
    diagnostics.push({
      severity: "error",
      code: "ARTIFACT_MANIFEST.INVALID_BYTES",
      path,
      message: "Manifest file entries must include a non-negative integer byte count.",
    });
    return { ...base, status: "invalid" };
  }

  if (!expectedSha256 || !SHA256_PATTERN.test(expectedSha256)) {
    diagnostics.push({
      severity: "error",
      code: "ARTIFACT_MANIFEST.INVALID_SHA256",
      path,
      message: "Manifest file entries must include sha256:<64-hex> hashes.",
    });
    return { ...base, status: "invalid" };
  }

  const filePath = join(projectDir, path);
  if (!existsSync(filePath)) {
    diagnostics.push({
      severity: "error",
      code: "ARTIFACT_MANIFEST.FILE_MISSING",
      path,
      message: `Generated file "${path}" is missing.`,
    });
    return { ...base, status: "missing" };
  }

  const fileStats = lstatSync(filePath);
  if (!fileStats.isFile()) {
    diagnostics.push({
      severity: "error",
      code: "ARTIFACT_MANIFEST.NOT_FILE",
      path,
      message: `Generated artifact "${path}" must be a regular file.`,
    });
    return { ...base, status: "invalid" };
  }

  if (!isRealFileInsideProject(projectDir, filePath)) {
    diagnostics.push({
      severity: "error",
      code: "ARTIFACT_MANIFEST.PATH_ESCAPE",
      path,
      message: `Generated artifact "${path}" resolves outside the project directory.`,
    });
    return { ...base, status: "invalid" };
  }

  const actualBytes = statSync(filePath).size;
  const actualSha256 = hashFileSha256(filePath);
  if (actualBytes !== expectedBytes) {
    diagnostics.push({
      severity: "error",
      code: "ARTIFACT_MANIFEST.BYTE_MISMATCH",
      path,
      message: `Generated file "${path}" has ${actualBytes} bytes; expected ${expectedBytes}.`,
    });
    return { ...base, status: "byte-mismatch", actualBytes, actualSha256 };
  }

  if (actualSha256 !== expectedSha256) {
    diagnostics.push({
      severity: "error",
      code: "ARTIFACT_MANIFEST.HASH_MISMATCH",
      path,
      message: `Generated file "${path}" sha256 does not match artifact-manifest.json.`,
    });
    return { ...base, status: "hash-mismatch", actualBytes, actualSha256 };
  }

  return { ...base, status: "verified", actualBytes, actualSha256 };
}

function isInsideProject(projectDir: string, path: string): boolean {
  const absolute = resolve(projectDir, path);
  const relativePath = relative(projectDir, absolute);
  return relativePath !== "" && !relativePath.startsWith("..") && !isAbsolute(relativePath);
}

function isRealFileInsideProject(projectDir: string, filePath: string): boolean {
  const projectRoot = realpathSync(projectDir);
  const realFilePath = realpathSync(filePath);
  const relativePath = relative(projectRoot, realFilePath);
  return relativePath !== "" && !relativePath.startsWith("..") && !isAbsolute(relativePath);
}

function buildVerifyResult(
  projectDir: string,
  manifestPath: string,
  files: VerifyArtifactFileResult[],
  diagnostics: VerifyArtifactDiagnostic[],
): VerifyArtifactsResult {
  const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === "error").length;
  return {
    ok: errorCount === 0,
    mode: "artifact-manifest-verify",
    status: errorCount === 0 ? "verified" : "blocked",
    projectDir,
    manifestPath,
    summary: {
      manifestFileCount: files.length,
      verifiedFileCount: files.filter((file) => file.status === "verified").length,
      requiredFileCount: files.filter((file) => file.required === true).length,
      missingFileCount: files.filter((file) => file.status === "missing").length,
      byteMismatchCount: files.filter((file) => file.status === "byte-mismatch").length,
      hashMismatchCount: files.filter((file) => file.status === "hash-mismatch").length,
    },
    files,
    diagnostics,
  };
}

function hashFileSha256(filePath: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(filePath)).digest("hex")}`;
}
