import { createHash } from "node:crypto";
import type { Diagnostic, MapCommand } from "../types.js";
import { canonicalStringify } from "./canonical-stringify.js";

/**
 * Node-only hashing entry. Reachable through `@gis-engine/engine/evidence`, never from the
 * browser-facing root barrel, because `node:crypto` must stay out of bundleable engine code.
 */
export function canonicalHash(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalStringify(value)).digest("hex")}`;
}

export const EVIDENCE_RECORD_SCHEMA_VERSION = "evidence-record.v0.1";
export const MAX_EVIDENCE_RECORD_BYTES = 1_048_576;

export const EvidenceAssertionId = {
  ChainClosed: "CHAIN_CLOSED",
  ArtifactsMatch: "ARTIFACTS_MATCH",
  DerivationClosed: "DERIVATION_CLOSED",
  ToolchainRecorded: "TOOLCHAIN_RECORDED",
  VisualConsistency: "VISUAL_CONSISTENCY",
  OfflineReplay: "OFFLINE_REPLAY",
} as const;
export type EvidenceAssertionId = (typeof EvidenceAssertionId)[keyof typeof EvidenceAssertionId];

export const EvidenceExclusionId = {
  VisualConsistency: "VISUAL_CONSISTENCY",
  OfflineReplay: "OFFLINE_REPLAY",
} as const;
export type EvidenceExclusionId = (typeof EvidenceExclusionId)[keyof typeof EvidenceExclusionId];

// Duplicated string literals of DiagnosticCodes' EVIDENCE.* entries are intentional:
// record.ts must stay import-free besides node:crypto so its compiled output can be the
// standalone verifier. tests/schema-sync/schema-sync.test.ts pins the two sets in sync.
export const EvidenceIssueCode = {
  RecordInvalid: "EVIDENCE.RECORD_INVALID",
  ChainBroken: "EVIDENCE.CHAIN_BROKEN",
  ArtifactMismatch: "EVIDENCE.ARTIFACT_MISMATCH",
  DerivationFailed: "EVIDENCE.DERIVATION_FAILED",
  SchemaVersionUnsupported: "EVIDENCE.SCHEMA_VERSION_UNSUPPORTED",
  CapabilityDrift: "EVIDENCE.CAPABILITY_DRIFT",
} as const;
export type EvidenceIssueCode = (typeof EvidenceIssueCode)[keyof typeof EvidenceIssueCode];

export interface EvidenceRecordArtifact {
  path: string;
  role: string;
  bytes: number;
  sha256: string;
}

export interface EvidenceRecordCommand {
  command: MapCommand;
  outcome: "applied" | "skipped" | "failed";
  diagnostics: Diagnostic[];
  inversePatchHash: string;
  baseRevision?: string;
  nextRevision?: string;
}

export interface EvidenceRecordCapabilities {
  schemaVersion: string;
  available: string[];
  blocked: Array<{ code: string; reason: string; path?: string }>;
}

export interface EvidenceRecord {
  schemaVersion: string;
  recordId: string;
  project: { id: string; baseRevision: string; revision: string };
  origin: { actor: string; providerKind: string; promptHash?: string; planHash?: string };
  commands: EvidenceRecordCommand[];
  spec: { beforeHash: string; afterHash: string; diffHash: string };
  artifacts: EvidenceRecordArtifact[];
  capabilities: EvidenceRecordCapabilities;
  toolchain: { engineVersion: string; nodeMajor: string; pnpmVersion: string };
  issuedAt: string;
  issuer: string;
  exclusions: EvidenceExclusionId[];
}

export interface EvidenceRecordInput {
  project: EvidenceRecord["project"];
  origin: EvidenceRecord["origin"];
  commands: EvidenceRecordCommand[];
  spec: EvidenceRecord["spec"];
  artifacts: EvidenceRecordArtifact[];
  capabilities: EvidenceRecordCapabilities;
  toolchain: EvidenceRecord["toolchain"];
  issuer: string;
  issuedAt?: string;
  exclusions?: EvidenceExclusionId[];
}

export type BuildEvidenceRecordResult = { ok: true; record: EvidenceRecord } | { ok: false; diagnostics: Diagnostic[] };

const DEFAULT_EXCLUSIONS: EvidenceExclusionId[] = [
  EvidenceExclusionId.OfflineReplay,
  EvidenceExclusionId.VisualConsistency,
];

export function buildEvidenceRecord(input: EvidenceRecordInput): BuildEvidenceRecordResult {
  const diagnostics = structuralIssues(input);
  if (diagnostics.length > 0) return { ok: false, diagnostics };

  const record: EvidenceRecord = {
    schemaVersion: EVIDENCE_RECORD_SCHEMA_VERSION,
    recordId: "sha256:" + "0".repeat(64),
    project: input.project,
    origin: input.origin,
    commands: input.commands,
    spec: input.spec,
    artifacts: input.artifacts,
    capabilities: input.capabilities,
    toolchain: input.toolchain,
    issuedAt: input.issuedAt ?? new Date().toISOString(),
    issuer: input.issuer,
    exclusions: input.exclusions ?? [...DEFAULT_EXCLUSIONS],
  };

  record.recordId = canonicalHash({ ...record, recordId: undefined });

  if (Buffer.byteLength(canonicalStringify(record), "utf8") > MAX_EVIDENCE_RECORD_BYTES) {
    return {
      ok: false,
      diagnostics: [
        {
          severity: "error",
          code: EvidenceIssueCode.RecordInvalid,
          message: `Evidence record exceeds the ${MAX_EVIDENCE_RECORD_BYTES} byte budget; refusing to export rather than truncating evidence fields.`,
          path: "/commands",
        },
      ],
    };
  }

  return { ok: true, record };
}

const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;

function issue(message: string, path: string): Diagnostic {
  return { severity: "error", code: EvidenceIssueCode.RecordInvalid, message, path };
}

function structuralIssues(input: EvidenceRecordInput): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const requireObject = (value: unknown, path: string): value is Record<string, unknown> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      diagnostics.push(issue(`${path} is required and must be an object.`, path));
      return false;
    }
    return true;
  };

  if (requireObject(input.project, "/project")) {
    for (const key of ["id", "baseRevision", "revision"] as const) {
      if (typeof input.project[key] !== "string" || input.project[key].length === 0) {
        diagnostics.push(issue(`/project/${key} must be a non-empty string.`, `/project/${key}`));
      }
    }
  }
  if (requireObject(input.origin, "/origin")) {
    if (typeof input.origin.actor !== "string" || input.origin.actor.length === 0) {
      diagnostics.push(issue("/origin/actor must be a non-empty string.", "/origin/actor"));
    }
    if (typeof input.origin.providerKind !== "string" || input.origin.providerKind.length === 0) {
      diagnostics.push(issue("/origin/providerKind must be a non-empty string.", "/origin/providerKind"));
    }
    for (const key of ["promptHash", "planHash"] as const) {
      const value = input.origin[key];
      if (value !== undefined && !SHA256_PATTERN.test(value)) {
        diagnostics.push(issue(`/origin/${key} must match sha256:<hex64>.`, `/origin/${key}`));
      }
    }
  }
  if (!Array.isArray(input.commands) || input.commands.length === 0) {
    diagnostics.push(issue("/commands must be a non-empty array.", "/commands"));
  } else {
    input.commands.forEach((entry, index) => {
      const path = `/commands/${index}`;
      if (!entry || typeof entry !== "object") {
        diagnostics.push(issue(`${path} is required.`, path));
        return;
      }
      if (!entry.command || typeof entry.command !== "object")
        diagnostics.push(issue(`${path}/command is required.`, `${path}/command`));
      if (!["applied", "skipped", "failed"].includes(entry.outcome))
        diagnostics.push(issue(`${path}/outcome is invalid.`, `${path}/outcome`));
      if (!Array.isArray(entry.diagnostics))
        diagnostics.push(issue(`${path}/diagnostics must be an array.`, `${path}/diagnostics`));
      if (typeof entry.inversePatchHash !== "string" || !SHA256_PATTERN.test(entry.inversePatchHash)) {
        diagnostics.push(issue(`${path}/inversePatchHash must match sha256:<hex64>.`, `${path}/inversePatchHash`));
      }
    });
  }
  if (requireObject(input.spec, "/spec")) {
    for (const key of ["beforeHash", "afterHash", "diffHash"] as const) {
      if (typeof input.spec[key] !== "string" || !SHA256_PATTERN.test(input.spec[key])) {
        diagnostics.push(issue(`/spec/${key} must match sha256:<hex64>.`, `/spec/${key}`));
      }
    }
  }
  if (!Array.isArray(input.artifacts) || input.artifacts.length === 0) {
    diagnostics.push(issue("/artifacts must be a non-empty array.", "/artifacts"));
  } else {
    input.artifacts.forEach((entry, index) => {
      const path = `/artifacts/${index}`;
      if (typeof entry?.path !== "string" || entry.path.length === 0)
        diagnostics.push(issue(`${path}/path is required.`, `${path}/path`));
      if (typeof entry?.role !== "string" || entry.role.length === 0)
        diagnostics.push(issue(`${path}/role is required.`, `${path}/role`));
      if (!Number.isInteger(entry?.bytes) || entry.bytes < 0)
        diagnostics.push(issue(`${path}/bytes must be a non-negative integer.`, `${path}/bytes`));
      if (typeof entry?.sha256 !== "string" || !SHA256_PATTERN.test(entry.sha256)) {
        diagnostics.push(issue(`${path}/sha256 must match sha256:<hex64>.`, `${path}/sha256`));
      }
    });
  }
  if (requireObject(input.capabilities, "/capabilities")) {
    if (!Array.isArray(input.capabilities.available))
      diagnostics.push(issue("/capabilities/available must be an array.", "/capabilities/available"));
    if (!Array.isArray(input.capabilities.blocked))
      diagnostics.push(issue("/capabilities/blocked must be an array.", "/capabilities/blocked"));
    if (typeof input.capabilities.schemaVersion !== "string" || input.capabilities.schemaVersion.length === 0) {
      diagnostics.push(issue("/capabilities/schemaVersion is required.", "/capabilities/schemaVersion"));
    }
  }
  if (requireObject(input.toolchain, "/toolchain")) {
    for (const key of ["engineVersion", "nodeMajor", "pnpmVersion"] as const) {
      if (typeof input.toolchain[key] !== "string" || input.toolchain[key].length === 0) {
        diagnostics.push(issue(`/toolchain/${key} must be a non-empty string.`, `/toolchain/${key}`));
      }
    }
  }
  if (typeof input.issuer !== "string" || input.issuer.length === 0) {
    diagnostics.push(issue("/issuer must be a non-empty string.", "/issuer"));
  }

  return diagnostics;
}
