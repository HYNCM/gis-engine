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
  // Constraint 7: failures are structured diagnostics, never natural-language throws.
  if (!input || typeof input !== "object") {
    return { ok: false, diagnostics: [issue("/ must be an object.", "/")] };
  }

  // Materialise the builder-derived defaults first, then structurally validate the candidate:
  // `issuedAt`/`exclusions` are optional on the input but required on the record, and the
  // exclusions canonicalisation below is part of the hash contract.
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
    // Sorted + de-duplicated: canonical hashing preserves array order, so a caller passing the same
    // exclusion set in a different order must not get a different recordId (same ruling as Task 1's
    // `available`/`blocked` sort). Only an array is canonicalised: this literal evaluates before
    // structuralIssues runs, so spreading a non-iterable value would throw a TypeError instead of
    // returning the constraint-7 diagnostic the validator's non-array check already reports.
    exclusions: Array.isArray(input.exclusions)
      ? [...new Set(input.exclusions)].sort()
      : (input.exclusions ?? DEFAULT_EXCLUSIONS),
  };

  const diagnostics = structuralIssues(record);
  if (diagnostics.length > 0) return { ok: false, diagnostics };

  // Hash the exact bytes a consumer will re-parse, not the in-memory object: JSON.stringify drops
  // undefined-valued keys while canonicalStringify renders them as null (review I-4). Task 5's
  // verification reuses this single `normaliseEvidencePayload` expression — two spellings of the
  // same hash contract is how honest records start reporting CHAIN_BROKEN.
  const payload = normaliseEvidencePayload({ ...record, recordId: undefined });
  // Constraint 7: an unserialisable payload (cyclic graph, BigInt leaf) yields `undefined` rather
  // than throwing, and surfaces as a structured diagnostic instead of a natural-language crash.
  if (payload === undefined) {
    return {
      ok: false,
      diagnostics: [
        issue("Evidence record payload is not JSON-serialisable; refusing to hash a non-portable record.", "/"),
      ],
    };
  }
  record.recordId = canonicalHash(payload);

  if (Buffer.byteLength(canonicalStringify(record), "utf8") > MAX_EVIDENCE_RECORD_BYTES) {
    return { ok: false, diagnostics: [oversizeDiagnostic(record)] };
  }

  return { ok: true, record };
}

/**
 * The oversize rejection names what actually crossed the byte budget: the single top-level
 * section that on its own exceeds MAX_EVIDENCE_RECORD_BYTES, or `/` when only the record as a
 * whole does (review Minor: the old hardcoded `/commands` pointed at the wrong field).
 */
function oversizeDiagnostic(record: EvidenceRecord): Diagnostic {
  const message = `Evidence record exceeds the ${MAX_EVIDENCE_RECORD_BYTES} byte budget; refusing to export rather than truncating evidence fields.`;
  for (const [key, value] of Object.entries(record)) {
    if (Buffer.byteLength(canonicalStringify(value), "utf8") > MAX_EVIDENCE_RECORD_BYTES) {
      return { severity: "error", code: EvidenceIssueCode.RecordInvalid, message, path: `/${key}` };
    }
  }
  return { severity: "error", code: EvidenceIssueCode.RecordInvalid, message, path: "/" };
}

const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;
// Mirror of `Iso8601Utc` in evidence/schema.ts. record.ts may not value-import TypeBox (zero-dep
// closure for Task 6's standalone verifier), so this literal duplication is the one the plan
// allows; the shared semantics are pinned by the bidirectional violation table in
// tests/schema-sync/schema-sync.test.ts.
const ISO8601_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
// Mirror of capability-matrix.ts's ENGINE_CAPABILITY_MATRIX_SCHEMA_VERSION and the Type.Literal in
// evidence/schema.ts, pinned by the same schema-sync table plus record-build's producer test.
const ENGINE_CAPABILITY_MATRIX_SCHEMA_VERSION = "engine-capabilities.v0.1";

function issue(message: string, path: string): Diagnostic {
  return { severity: "error", code: EvidenceIssueCode.RecordInvalid, message, path };
}

/**
 * Zero-dependency structural check (no Ajv, no TypeBox). Scope per the review I-1/I-2 ruling: it
 * pins exactly the fields Task 5's recomputation reads (`recordId`, `exclusions`,
 * `capabilities.*`, `issuedAt`, `artifacts[].sha256/bytes`, `commands[].inversePatchHash/outcome`).
 * It deliberately does NOT deep-validate `MapCommand`/`MapSpec` shapes — that is Ajv's public
 * contract, and re-spelling it here would create a second truth source.
 */
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
    if (input.capabilities.schemaVersion !== ENGINE_CAPABILITY_MATRIX_SCHEMA_VERSION) {
      diagnostics.push(
        issue(
          `/capabilities/schemaVersion must be "${ENGINE_CAPABILITY_MATRIX_SCHEMA_VERSION}".`,
          "/capabilities/schemaVersion",
        ),
      );
    }
    if (Array.isArray(input.capabilities.available)) {
      input.capabilities.available.forEach((entry, index) => {
        if (typeof entry !== "string" || entry.length === 0) {
          diagnostics.push(
            issue(`/capabilities/available/${index} must be a non-empty string.`, `/capabilities/available/${index}`),
          );
        }
      });
    } else {
      diagnostics.push(issue("/capabilities/available must be an array.", "/capabilities/available"));
    }
    if (Array.isArray(input.capabilities.blocked)) {
      input.capabilities.blocked.forEach((entry, index) => {
        const path = `/capabilities/blocked/${index}`;
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
          diagnostics.push(issue(`${path} must be an object.`, path));
          return;
        }
        for (const key of ["code", "reason"] as const) {
          if (typeof entry[key] !== "string" || entry[key].length === 0) {
            diagnostics.push(issue(`${path}/${key} must be a non-empty string.`, `${path}/${key}`));
          }
        }
        if (entry.path !== undefined && typeof entry.path !== "string") {
          diagnostics.push(issue(`${path}/path must be a string when present.`, `${path}/path`));
        }
      });
    } else {
      diagnostics.push(issue("/capabilities/blocked must be an array.", "/capabilities/blocked"));
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
  // Task 5 reads exclusions to decide "not-covered" rows, so an out-of-vocabulary or absent member
  // would silently delete an assertion from the verdict instead of failing the record.
  if (!Array.isArray(input.exclusions) || input.exclusions.length === 0) {
    diagnostics.push(issue("/exclusions must be a non-empty array.", "/exclusions"));
  } else {
    input.exclusions.forEach((entry, index) => {
      if (!Object.values(EvidenceExclusionId).includes(entry)) {
        diagnostics.push(issue(`/exclusions/${index} is not a known exclusion id.`, `/exclusions/${index}`));
      }
    });
  }
  if (typeof input.issuedAt !== "string" || !ISO8601_UTC_PATTERN.test(input.issuedAt)) {
    diagnostics.push(issue("/issuedAt must be an ISO-8601 UTC timestamp.", "/issuedAt"));
  }

  return diagnostics;
}

export type EvidenceAssertionStatus = "passed" | "failed" | "not-covered";

export interface EvidenceAssertion {
  id: EvidenceAssertionId;
  status: EvidenceAssertionStatus;
  detail: string;
}

export interface EvidenceVerificationResult {
  /**
   * Green only when no assertion failed AND no `severity: "error"` diagnostic exists — i.e. the six
   * rows say the record holds up and the verifier never had to say "I cannot read this" (unsupported
   * schema version, malformed field, capability drift). Consumers must branch on `ok`, not on the
   * assertions array alone.
   */
  ok: boolean;
  assertions: EvidenceAssertion[];
  diagnostics: Diagnostic[];
}

export interface VerifyEvidenceRecordOptions {
  readArtifact: (path: string) => Promise<Uint8Array>;
  expectedCapabilities?: EvidenceRecordCapabilities;
}

const UNSUPPORTED_VERSION_MESSAGE = "Evidence record schemaVersion is newer than this verifier supports.";

/**
 * The one normalisation expression both builder and verifier hash: a JSON round trip reproduces
 * exactly what the transport does with `undefined`-valued keys (Task 4 review I-4). `buildEvidenceRecord`
 * calls this too — two spellings of the same hash contract is how honest records start
 * reporting CHAIN_BROKEN. Unserialisable input (cyclic graph, BigInt leaf) yields `undefined`
 * instead of throwing: constraint 7 requires failures to be structured diagnostics, and Task 4's
 * round-2 ruling totalises it here once rather than in two try/catch sites.
 */
export function normaliseEvidencePayload<T>(value: T): T | undefined {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return undefined;
  }
}

/**
 * Recomputes every trust-tier assertion from the record's own fields, after re-running the structural
 * check the builder applied. It never executes commands and never throws (constraint 7): malformed,
 * hostile, cyclic or `undefined`-laden input comes back as a structured diagnostic and/or a
 * `failed`/`not-covered` assertion, so a third party can re-verify a record without trusting anything
 * except the bytes in it.
 */
export async function verifyEvidenceRecord(
  record: EvidenceRecord,
  options: VerifyEvidenceRecordOptions,
): Promise<EvidenceVerificationResult> {
  const diagnostics: Diagnostic[] = [];

  if (!record || typeof record !== "object") {
    diagnostics.push({
      severity: "error",
      code: EvidenceIssueCode.RecordInvalid,
      message: "Evidence record must be an object before it can be verified.",
      path: "/",
    });
    return { ok: false, assertions: unverifiableAssertions(), diagnostics };
  }

  // The verifier never assumes `buildEvidenceRecord` ran: it re-applies the same zero-dependency
  // structural check that lives in this file (constraint 3 untouched) and folds the result in. Without
  // this a hand-forged record whose fields are garbage but whose bytes are self-consistent would sail
  // through every recomputation below.
  diagnostics.push(...structuralIssues(record));

  if (record.schemaVersion !== EVIDENCE_RECORD_SCHEMA_VERSION) {
    diagnostics.push({
      severity: "error",
      code: EvidenceIssueCode.SchemaVersionUnsupported,
      message: `${UNSUPPORTED_VERSION_MESSAGE} Found ${String(record.schemaVersion)}.`,
      path: "/schemaVersion",
    });
  }

  const chainPayload = normaliseEvidencePayload({ ...record, recordId: undefined });
  const chainClosed =
    chainPayload !== undefined &&
    typeof record.recordId === "string" &&
    record.recordId === canonicalHash(chainPayload);
  if (!chainClosed) {
    diagnostics.push({
      severity: "error",
      code: EvidenceIssueCode.ChainBroken,
      message: "recordId does not match the recomputed canonical hash of the record body.",
      path: "/recordId",
    });
  }

  // Constraint 7 in its options form, too: a caller that passes no options object must get an honest
  // "artifact matching could not run" verdict, not a TypeError halfway through the recomputation.
  const readArtifact = options && typeof options.readArtifact === "function" ? options.readArtifact : undefined;
  const expectedCapabilities = options ? options.expectedCapabilities : undefined;

  const artifactEntries = Array.isArray(record.artifacts) ? record.artifacts : [];
  const artifactIssues: Diagnostic[] = [];
  let matched = 0;
  if (!readArtifact) {
    artifactIssues.push({
      severity: "error",
      code: EvidenceIssueCode.ArtifactMismatch,
      message: "options.readArtifact was not supplied, so no artifact byte could be re-hashed.",
      path: "/artifacts",
    });
  } else {
    for (const [index, artifact] of artifactEntries.entries()) {
      const path = `/artifacts/${index}`;
      const declaredPath = artifact && typeof artifact.path === "string" ? artifact.path : "";
      const declaredSha = artifact && typeof artifact.sha256 === "string" ? artifact.sha256 : "";
      const declaredBytes = artifact && typeof artifact.bytes === "number" ? artifact.bytes : Number.NaN;
      let bytes: Uint8Array;
      try {
        bytes = await readArtifact(declaredPath);
      } catch (error) {
        artifactIssues.push({
          severity: "error",
          code: EvidenceIssueCode.ArtifactMismatch,
          message: `Artifact "${declaredPath}" could not be read: ${error instanceof Error ? error.message : String(error)}`,
          path,
        });
        continue;
      }
      const actual = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
      if (actual === declaredSha && bytes.byteLength === declaredBytes) {
        matched += 1;
        continue;
      }
      artifactIssues.push({
        severity: "error",
        code: EvidenceIssueCode.ArtifactMismatch,
        message: `Artifact "${declaredPath}" hash or size does not match the evidence record.`,
        path,
        relatedResources: [{ kind: "source", path: declaredPath }],
      });
    }
  }
  diagnostics.push(...artifactIssues);

  const lineageIssue = checkLineage(record);
  if (lineageIssue) diagnostics.push(lineageIssue);

  const inverseIssue = checkInversePatchHashes(record);
  if (inverseIssue) diagnostics.push(inverseIssue);

  if (expectedCapabilities) {
    const driftIssue = checkCapabilityDrift(record.capabilities, expectedCapabilities);
    if (driftIssue) diagnostics.push(driftIssue);
  }

  const toolchain = record.toolchain;
  const toolchainRecorded =
    !!toolchain &&
    (["engineVersion", "nodeMajor", "pnpmVersion"] as const).every(
      (key) => typeof toolchain[key] === "string" && toolchain[key].length > 0,
    );

  const assertions: EvidenceAssertion[] = [
    {
      id: EvidenceAssertionId.ArtifactsMatch,
      // The builder guarantees a non-empty artifact list, so "0 of 0 matched" only ever describes a
      // hand-forged record with nothing to verify — a vacuous pass would smuggle it toward `ok`.
      status: artifactEntries.length > 0 && artifactIssues.length === 0 ? "passed" : "failed",
      detail: `${matched} of ${artifactEntries.length} artifacts matched`,
    },
    {
      id: EvidenceAssertionId.ChainClosed,
      status: chainClosed ? "passed" : "failed",
      detail: chainClosed ? "recordId matches the canonical body" : "recordId does not match the canonical body",
    },
    {
      id: EvidenceAssertionId.DerivationClosed,
      status: lineageIssue || inverseIssue ? "failed" : "passed",
      detail: lineageIssue ? lineageIssue.message : inverseIssue ? inverseIssue.message : "revision lineage closed",
    },
    exclusionAssertion(
      EvidenceAssertionId.OfflineReplay,
      record.exclusions,
      "excluded: requires referenced replay outside the trust tier",
    ),
    {
      id: EvidenceAssertionId.ToolchainRecorded,
      status: toolchainRecorded ? "passed" : "failed",
      detail: toolchain
        ? `engine ${toolchain.engineVersion} / node ${toolchain.nodeMajor} / pnpm ${toolchain.pnpmVersion}`
        : "engine / node / pnpm",
    },
    exclusionAssertion(
      EvidenceAssertionId.VisualConsistency,
      record.exclusions,
      "excluded: visual consistency is deferred",
    ),
  ];
  // Sorted as a separate statement (not chained onto the literal) so `EvidenceAssertion[]` stays the
  // contextual type of each element — a chained `.sort()` would widen the `status` literals to `string`.
  assertions.sort((left, right) => left.id.localeCompare(right.id));

  // L-2: the six assertion rows are not the whole verdict. `ok` is the flag Task 7's CLI and Task 8's
  // third-party recompute branch on, so it must stay down whenever the verifier itself says it cannot
  // read the record (SCHEMA_VERSION_UNSUPPORTED, RECORD_INVALID, CAPABILITY_DRIFT …). The severity test
  // rather than `diagnostics.length === 0` so a future informational diagnostic cannot block by accident.
  const blockingDiagnostic = diagnostics.some((entry) => entry.severity === "error");

  return {
    ok: assertions.every((entry) => entry.status !== "failed") && !blockingDiagnostic,
    assertions,
    diagnostics,
  };
}

/**
 * The two trust-tier claims a data-only verifier can never check (replay needs execution, visual
 * consistency needs a renderer). They are honest `not-covered` rows ONLY when the record itself
 * declares the exclusion; otherwise the claim was supposed to run and cannot be backed up, so the
 * row is `failed` and holds `ok` down — a `not-covered` verdict must never smuggle an assertion that
 * should have executed into a green result.
 */
function exclusionAssertion(id: EvidenceAssertionId, exclusions: unknown, excludedDetail: string): EvidenceAssertion {
  const declared = Array.isArray(exclusions) && (exclusions as readonly string[]).includes(id);
  return declared
    ? { id, status: "not-covered", detail: excludedDetail }
    : {
        id,
        status: "failed",
        detail: `${id} is not declared as an exclusion, but this data-only verifier cannot check it.`,
      };
}

function unverifiableAssertions(): EvidenceAssertion[] {
  return (Object.values(EvidenceAssertionId) as EvidenceAssertionId[])
    .map((id) => ({ id, status: "failed" as const, detail: "record is not a verifiable object" }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

/**
 * L-1: the lineage claim is about runtime state, and only `applied` entries move runtime state, so the
 * chain is recomputed over exactly those entries — in record order, anchored at `project.baseRevision`
 * and required to end at `project.revision`. Deliberately not keyed to the `commands` array indexes: a
 * leading `skipped` entry has no before/after and must not become the expected predecessor.
 *
 * Every unreadable piece of lineage data is a `DerivationFailed` diagnostic rather than a silent skip:
 * a missing/non-string revision pair on an applied entry, a malformed revision on a non-applied one, a
 * non-string project anchor, or a project revision that moved while nothing was applied. The old shape
 * skipped absent fields and could report "revision lineage closed" having checked nothing.
 */
function checkLineage(record: EvidenceRecord): Diagnostic | undefined {
  const failed = (message: string, path = "/commands"): Diagnostic => ({
    severity: "error",
    code: EvidenceIssueCode.DerivationFailed,
    message,
    path,
  });
  const commands = Array.isArray(record.commands) ? record.commands : [];
  const project = record.project;
  const baseRevision = project ? project.baseRevision : undefined;
  const revision = project ? project.revision : undefined;
  if (typeof baseRevision !== "string") {
    return failed(
      "project.baseRevision must be a string: the revision lineage has no starting point.",
      "/project/baseRevision",
    );
  }
  if (typeof revision !== "string") {
    return failed("project.revision must be a string: the revision lineage has no end point.", "/project/revision");
  }

  const applied: Array<{ index: number; base: string; next: string }> = [];
  for (const [index, entry] of commands.entries()) {
    const base = entry?.baseRevision;
    const next = entry?.nextRevision;
    if ((base !== undefined && typeof base !== "string") || (next !== undefined && typeof next !== "string")) {
      return failed(
        `commands[${index}] carries a revision field that is not a string; refusing to infer lineage from malformed data.`,
        `/commands/${index}`,
      );
    }
    if (entry?.outcome !== "applied") continue;
    if (typeof base !== "string" || typeof next !== "string") {
      return failed(
        `commands[${index}] is applied but carries no string baseRevision/nextRevision pair, so its revision step is unverifiable.`,
        `/commands/${index}`,
      );
    }
    applied.push({ index, base, next });
  }

  if (applied.length === 0) {
    // Nothing claims a state change, so lineage is closed only if the project revision stood still.
    return baseRevision === revision
      ? undefined
      : failed(`project revision moved from "${baseRevision}" to "${revision}" without any applied command.`);
  }

  let expected = baseRevision;
  let finalIndex = 0;
  for (const step of applied) {
    if (step.base !== expected) {
      return failed(
        `commands[${step.index}].baseRevision does not continue the revision lineage.`,
        `/commands/${step.index}`,
      );
    }
    expected = step.next;
    finalIndex = step.index;
  }
  if (expected !== revision) {
    return failed("The final command revision does not match project.revision.", `/commands/${finalIndex}`);
  }
  return undefined;
}

function checkInversePatchHashes(record: EvidenceRecord): Diagnostic | undefined {
  const commands = Array.isArray(record.commands) ? record.commands : [];
  for (const [index, entry] of commands.entries()) {
    // Narrow shape read only for record-internal consistency: MapCommand's discriminated union puts
    // the patch field in different places, and the public schema already bounds it via MapCommandSchema.
    const patch = (entry?.command as { inversePatch?: unknown } | undefined)?.inversePatch;
    if (patch === undefined) continue;
    const recomputed = safeCanonicalHash(patch);
    if (recomputed === undefined || recomputed !== entry?.inversePatchHash) {
      return {
        severity: "error",
        code: EvidenceIssueCode.DerivationFailed,
        message: `commands[${index}].inversePatchHash does not match the canonical hash of its inverse patch.`,
        path: `/commands/${index}/inversePatchHash`,
      };
    }
  }
  return undefined;
}

function safeCanonicalHash(value: unknown): string | undefined {
  try {
    return canonicalHash(value);
  } catch {
    return undefined;
  }
}

/**
 * Compares BOTH capability lists as sorted sets, not only the blockers: an engine that gained a
 * capability the record still claims is unavailable is just as much drift as a blocker that moved, and
 * a record that over-claims `available` is the one a downstream consumer would act on. Only runs when
 * the caller supplies `expectedCapabilities` — there is no second truth source here.
 */
function checkCapabilityDrift(
  recorded: EvidenceRecordCapabilities,
  expected: EvidenceRecordCapabilities,
): Diagnostic | undefined {
  const drift = (message: string, path: string): Diagnostic => ({
    severity: "error",
    code: EvidenceIssueCode.CapabilityDrift,
    message,
    path,
  });
  if (!sameNames(availableNames(recorded), availableNames(expected))) {
    return drift(
      "Recorded capability available list differs from the engine's current available capabilities.",
      "/capabilities/available",
    );
  }
  if (!sameNames(blockedCodes(recorded), blockedCodes(expected))) {
    return drift("Recorded capability blockers differ from the engine's current blockers.", "/capabilities/blocked");
  }
  return undefined;
}

function availableNames(capabilities: EvidenceRecordCapabilities): string[] {
  const available = capabilities && Array.isArray(capabilities.available) ? capabilities.available : [];
  return available.map((entry) => (typeof entry === "string" ? entry : "")).sort();
}

function sameNames(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((name, index) => name === right[index]);
}

function blockedCodes(capabilities: EvidenceRecordCapabilities): string[] {
  const blocked = capabilities && Array.isArray(capabilities.blocked) ? capabilities.blocked : [];
  return blocked.map((entry) => (entry && typeof entry.code === "string" ? entry.code : "")).sort();
}
