export const AUDIT_RECORD_VERSION = "amw.audit.v1";
export const AUDIT_EXPORT_VERSION = "amw.audit.export.v1";
export const AUDIT_DELETION_RECEIPT_VERSION = "amw.audit.deletion.v1";
export const AUDIT_RECORD_BYTE_CAP = 2 * 1024;
export const AUDIT_EXPORT_RECORD_CAP = 500;
export const AUDIT_EXPORT_BYTE_CAP = 1024 * 1024;
export const AUDIT_DELETION_RECORD_CAP = 10_000;

export const REVIEW_DECISION_VERSION = "amw.review.v1";
export const REVIEW_DECISION_BYTE_CAP = 2 * 1024;
export const REVIEW_REASON_CAP = 8;
export const REVIEW_DIAGNOSTIC_CAP = 20;
export const REVIEW_FOLLOW_UP_CAP = 10;

const AUDIT_DIAGNOSTIC_CODE = "AUDIT.CONTRACT_VIOLATION";
const REVIEW_DIAGNOSTIC_CODE = "REVIEW.CONTRACT_VIOLATION";
const VALID_AUDIT_STATUSES = new Set([
  "applied",
  "blocked",
  "unsupported",
  "reset",
  "accepted",
  "follow-up-required",
  "ready",
  "reviewed",
]);
const VALID_AUDIT_OPERATIONS = new Set(["append", "list", "export", "delete", "retention"]);
const TOKEN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
const PROJECT_ID_PATTERN = /^project_[A-Za-z0-9][A-Za-z0-9_-]{0,62}$/;
const PROMPT_HASH_PATTERN = /^sha256:[a-f0-9]{16,64}$/;
const VALID_REVIEW_OUTCOMES = new Set(["accepted", "blocked", "follow-up-required"]);
const VALID_REVIEW_ROLES = new Set(["admin", "reviewer"]);
const VALID_REASON_CODES = new Set([
  "review-accepted",
  "manual-review-blocked",
  "provider-output-blocked",
  "provider-resource-follow-up",
  "audit-retention-follow-up",
  "visual-evidence-required",
  "delivery-needs-confirmation",
  "spatial-query-follow-up",
  "scene3d-extension-only",
  "product-promotion-required",
]);
const COMMAND_SAFETY_KEYS = new Set([
  "command",
  "commandbody",
  "commands",
  "file",
  "files",
  "mapspec",
  "patch",
  "rawprompt",
  "rawproviderbody",
  "spec",
]);
const DISALLOWED_KEYS = new Set([
  "apikey",
  "authorization",
  "baseurl",
  "commandbody",
  "commands",
  "credential",
  "credentials",
  "featurepayload",
  "features",
  "fullmapspec",
  "mapspec",
  "patch",
  "providerrawbody",
  "providerrequestbody",
  "providerresponsebody",
  "raw",
  "rawprompt",
  "rawproviderbody",
  "requestheaders",
  "responsebody",
  "screenshot",
  "spec",
  "stack",
]);

export interface WorkbenchContractDiagnostic {
  severity: "error";
  code: string;
  message: string;
  path: string;
  fix: {
    kind: "manual";
    confidence: "high";
    message: string;
  };
}

export interface WorkbenchPrincipal {
  id?: string | undefined;
  role?: string | undefined;
  projectIds?: string[] | undefined;
}

export interface WorkbenchDiagnosticCode {
  code?: string | undefined;
  path?: string | undefined;
}

export interface WorkbenchDiagnosticCounts {
  error?: number | undefined;
  warning?: number | undefined;
  info?: number | undefined;
}

export interface WorkbenchAuditRecordInput {
  projectId?: string | undefined;
  sessionId?: string | undefined;
  recordId?: string | undefined;
  createdAt?: string | undefined;
  status?: string | undefined;
  providerId?: string | undefined;
  promptHash?: string | undefined;
  traceId?: string | undefined;
  commandCount?: number | undefined;
  diagnosticCounts?: WorkbenchDiagnosticCounts | undefined;
  diagnosticCodes?: WorkbenchDiagnosticCode[] | undefined;
  diagnostics?: WorkbenchDiagnosticCode[] | undefined;
  fromRevision?: string | undefined;
  toRevision?: string | undefined;
  reviewOutcome?:
    | {
        decisionId?: string | undefined;
        status?: string | undefined;
        reasonCode?: string | undefined;
      }
    | undefined;
  [key: string]: unknown;
}

export interface WorkbenchAuditRecord {
  recordVersion: typeof AUDIT_RECORD_VERSION;
  projectId: string;
  sessionId: string;
  recordId: string;
  id: string;
  createdAt: string;
  timestamp: string;
  status: string;
  providerId: string;
  commandCount: number;
  diagnosticCounts: Required<WorkbenchDiagnosticCounts>;
  promptHash?: string;
  traceId?: string;
  diagnosticCodes?: Required<WorkbenchDiagnosticCode>[];
  fromRevision: string;
  toRevision: string;
  reviewOutcome?: {
    decisionId: string;
    status: string;
    reasonCode: string;
  };
}

export interface WorkbenchAuditExportEnvelope {
  auditExportVersion: typeof AUDIT_EXPORT_VERSION;
  generatedAt: string;
  projectId: string;
  filters: Record<string, unknown>;
  records: WorkbenchAuditRecord[];
  nextCursor: string | null;
}

export interface WorkbenchAuditDeletionReceipt {
  deletionReceiptVersion: typeof AUDIT_DELETION_RECEIPT_VERSION;
  projectId: string;
  deletedAt: string;
  actorId: string;
  reasonCode: string;
  filterSummary: Record<string, string>;
  deletedCount: number;
}

export interface WorkbenchReviewDecisionInput {
  projectId?: string;
  principal?: WorkbenchPrincipal | undefined;
  decisionId?: string | undefined;
  createdAt?: string | undefined;
  request?: Record<string, unknown> | undefined;
  evidence?: WorkbenchAuditRecord | Record<string, unknown> | undefined;
}

export interface WorkbenchReviewDecision {
  recordVersion: typeof REVIEW_DECISION_VERSION;
  decisionId: string;
  createdAt: string;
  projectId: string;
  sessionId: string;
  auditRecordId: string;
  outcome: string;
  providerId: string;
  deliveryStatus: string;
  commandEvidence: {
    commandCount: number;
    committed: boolean;
    rolledBack: boolean;
    failed: boolean;
    changedPathCount: number;
  };
  diagnosticCounts: Required<WorkbenchDiagnosticCounts>;
  reasonCodes: string[];
  promptHash?: string;
  traceId?: string;
  diagnosticCodes?: Required<WorkbenchDiagnosticCode>[];
  followUpTaskIds?: string[];
}

export type WorkbenchContractResult<T, K extends string> =
  | ({ ok: true } & { [P in K]: T })
  | { ok: false; diagnostics: WorkbenchContractDiagnostic[] };

export function authorizeAuditOperation(input: {
  operation?: string | undefined;
  principal?: WorkbenchPrincipal | undefined;
  projectId?: string | undefined;
}): { ok: true } | { ok: false; diagnostics: WorkbenchContractDiagnostic[] } {
  const { operation, principal, projectId } = input;
  if (!VALID_AUDIT_OPERATIONS.has(operation ?? "")) return auditError("/auditAccess", "Unsupported audit operation.");
  if (!isValidProjectId(projectId)) return auditError("/auditAccess", "Audit project id is not authorized.");
  if (!principal || typeof principal !== "object") return auditError("/auditAccess", "Audit principal is required.");

  const allowedProjectIds = Array.isArray(principal.projectIds) ? principal.projectIds : [];
  const projectAllowed = allowedProjectIds.includes(projectId) || allowedProjectIds.includes("*");
  if (!projectAllowed) return auditError("/auditAccess", "Audit principal cannot access this project.");
  if (principal.role === "admin") return { ok: true };
  if (principal.role === "reviewer" && (operation === "list" || operation === "export")) return { ok: true };
  if (principal.role === "service" && operation === "append") return { ok: true };
  return auditError("/auditAccess", "Audit principal role cannot perform this operation.");
}

export function createDurableAuditRecord(
  input: WorkbenchAuditRecordInput,
): WorkbenchContractResult<WorkbenchAuditRecord, "record"> {
  const payloadCheck = auditPayloadSafe(input);
  if (!payloadCheck.ok) return payloadCheck;
  if (!isValidProjectId(input.projectId)) return auditError("/auditPayload", "Audit record project id is invalid.");
  if (!isSafeToken(input.sessionId)) return auditError("/auditPayload", "Audit record session id is invalid.");
  if (!isSafeToken(input.recordId)) return auditError("/auditPayload", "Audit record id is invalid.");
  if (!isIsoTimestamp(input.createdAt)) return auditError("/auditPayload", "Audit record timestamp is invalid.");
  if (!VALID_AUDIT_STATUSES.has(input.status ?? "")) {
    return auditError("/auditPayload", "Audit record status is invalid.");
  }
  if (!isSafeToken(input.providerId)) return auditError("/auditPayload", "Audit provider id is invalid.");
  const commandCount =
    Number.isSafeInteger(input.commandCount) && typeof input.commandCount === "number" && input.commandCount >= 0
      ? input.commandCount
      : undefined;
  if (commandCount === undefined) {
    return auditError("/auditPayload", "Audit command count is invalid.");
  }

  const diagnosticCodes = normalizeDiagnosticCodes(input.diagnosticCodes ?? diagnosticCodesFrom(input.diagnostics), {
    surface: "audit",
  });
  if (!diagnosticCodes.ok) return diagnosticCodes;

  const record = removeUndefined({
    recordVersion: AUDIT_RECORD_VERSION,
    projectId: input.projectId,
    sessionId: input.sessionId,
    recordId: input.recordId,
    id: input.recordId,
    createdAt: input.createdAt,
    timestamp: input.createdAt,
    status: input.status,
    providerId: input.providerId,
    promptHash: validPromptHash(input.promptHash) ? input.promptHash : undefined,
    traceId: isSafeToken(input.traceId) ? input.traceId : undefined,
    commandCount,
    diagnosticCounts: normalizeDiagnosticCounts(input.diagnosticCounts),
    diagnosticCodes: diagnosticCodes.value.length > 0 ? diagnosticCodes.value : undefined,
    fromRevision: safeRevision(input.fromRevision),
    toRevision: safeRevision(input.toRevision),
    reviewOutcome: normalizeReviewOutcome(input.reviewOutcome),
  }) as unknown as WorkbenchAuditRecord;

  if (byteLength(JSON.stringify(record)) > AUDIT_RECORD_BYTE_CAP) {
    return auditError("/auditPayload", "Audit record exceeds the byte cap.");
  }
  return { ok: true, record };
}

export function createAuditExportEnvelope(input: {
  principal?: WorkbenchPrincipal;
  projectId?: string;
  generatedAt?: string;
  records?: WorkbenchAuditRecord[];
  filters?: Record<string, unknown>;
  nextCursor?: string;
}): WorkbenchContractResult<WorkbenchAuditExportEnvelope, "envelope"> {
  const access = authorizeAuditOperation({
    operation: "export",
    principal: input.principal,
    projectId: input.projectId,
  });
  if (!access.ok) return access;
  if (!isIsoTimestamp(input.generatedAt)) return auditError("/auditExport", "Audit export timestamp is invalid.");

  const records = Array.isArray(input.records) ? input.records : [];
  if (records.length > AUDIT_EXPORT_RECORD_CAP) {
    return auditError("/auditExport/size", "Audit export exceeds the record cap.");
  }
  for (const record of records) {
    const payloadCheck = auditPayloadSafe(record);
    if (!payloadCheck.ok) return payloadCheck;
    if (record.recordVersion !== AUDIT_RECORD_VERSION || record.projectId !== input.projectId) {
      return auditError("/auditExport", "Audit export record does not match the project contract.");
    }
  }

  const envelope = {
    auditExportVersion: AUDIT_EXPORT_VERSION,
    generatedAt: input.generatedAt,
    projectId: input.projectId,
    filters: normalizeExportFilters(input.filters),
    records,
    nextCursor: isSafeToken(input.nextCursor) ? input.nextCursor : null,
  } as WorkbenchAuditExportEnvelope;
  if (byteLength(JSON.stringify(envelope)) > AUDIT_EXPORT_BYTE_CAP) {
    return auditError("/auditExport/size", "Audit export exceeds the byte cap.");
  }
  return { ok: true, envelope };
}

export function createAuditDeletionReceipt(input: {
  principal?: WorkbenchPrincipal;
  projectId?: string;
  deletedAt?: string;
  actorId?: string;
  reasonCode?: string;
  filterSummary?: Record<string, unknown>;
  deletedCount?: number;
}): WorkbenchContractResult<WorkbenchAuditDeletionReceipt, "receipt"> {
  const access = authorizeAuditOperation({
    operation: "delete",
    principal: input.principal,
    projectId: input.projectId,
  });
  if (!access.ok) return access;
  if (!isIsoTimestamp(input.deletedAt)) return auditError("/auditDeletion", "Audit deletion timestamp is invalid.");
  if (!isSafeToken(input.actorId)) return auditError("/auditDeletion", "Audit deletion actor is invalid.");
  if (!isSafeToken(input.reasonCode)) return auditError("/auditDeletion", "Audit deletion reason is invalid.");
  const { projectId, deletedAt, actorId, reasonCode } = input as {
    projectId: string;
    deletedAt: string;
    actorId: string;
    reasonCode: string;
  };
  const deletedCount =
    Number.isSafeInteger(input.deletedCount) && typeof input.deletedCount === "number" ? input.deletedCount : undefined;
  if (deletedCount === undefined || deletedCount < 0 || deletedCount > AUDIT_DELETION_RECORD_CAP) {
    return auditError("/auditDeletion/size", "Audit deletion count exceeds the cap.");
  }

  const filterSummary = normalizeDeletionFilter(input.filterSummary);
  if (!filterSummary.ok) return filterSummary;

  return {
    ok: true,
    receipt: {
      deletionReceiptVersion: AUDIT_DELETION_RECEIPT_VERSION,
      projectId,
      deletedAt,
      actorId,
      reasonCode,
      filterSummary: filterSummary.value,
      deletedCount,
    },
  };
}

export function auditPayloadSafe(
  value: unknown,
): { ok: true } | { ok: false; diagnostics: WorkbenchContractDiagnostic[] } {
  const disallowedPath = findDisallowedPayloadPath(value);
  if (disallowedPath) {
    return auditError(`/auditPayload${disallowedPath}`, "Audit payload contains a disallowed raw field.");
  }
  return { ok: true };
}

export function createReviewDecision(
  input: WorkbenchReviewDecisionInput,
): WorkbenchContractResult<WorkbenchReviewDecision, "decision"> {
  const request = input.request ?? {};
  const commandSafetyPath = findCommandSafetyViolation(request);
  if (commandSafetyPath) return reviewError("/reviewAction/commandSafety", "Review actions cannot mutate map state.");
  const payloadCheck = auditPayloadSafe(request);
  if (!payloadCheck.ok) {
    return reviewError("/reviewDecision/payload", "Review decision request contains raw payload fields.");
  }
  if (!isValidProjectId(input.projectId)) {
    return reviewError("/reviewDecision/authorization", "Review project id is invalid.");
  }
  const access = authorizeReviewDecision({ principal: input.principal, projectId: input.projectId });
  if (!access.ok) return reviewError("/reviewDecision/authorization", "Reviewer cannot decide for this project.");

  const evidence = normalizeReviewEvidence(input.evidence);
  if (!evidence) return reviewError("/reviewAction/evidence", "Review decision requires compact evidence.");

  const outcome = stringValue(request.outcome);
  if (!VALID_REVIEW_OUTCOMES.has(outcome)) {
    return reviewError("/reviewAction/outcome", "Review outcome is not supported.");
  }

  const reasonCodes = normalizeReasonCodes(request.reasonCodes);
  if (!reasonCodes.ok) return reasonCodes;
  const followUpTaskIds = normalizeFollowUpTaskIds(request.followUpTaskIds);
  if (!followUpTaskIds.ok) return followUpTaskIds;
  const reasonValidation = validateOutcomeReasonCodes(outcome, reasonCodes.value);
  if (!reasonValidation.ok) return reasonValidation;
  const evidenceCheck = validateOutcomeAgainstEvidence(outcome, evidence, reasonCodes.value, followUpTaskIds.value);
  if (!evidenceCheck.ok) return evidenceCheck;

  const diagnosticCodes = normalizeDiagnosticCodes(evidence.diagnosticCodes ?? []);
  if (!diagnosticCodes.ok) return diagnosticCodes;

  const decision = removeUndefined({
    recordVersion: REVIEW_DECISION_VERSION,
    decisionId: input.decisionId,
    createdAt: input.createdAt,
    projectId: input.projectId,
    sessionId: evidence.sessionId,
    auditRecordId: evidence.id,
    outcome,
    providerId: evidence.providerId,
    promptHash: validPromptHash(evidence.promptHash) ? evidence.promptHash : undefined,
    traceId: isSafeToken(evidence.traceId) ? evidence.traceId : undefined,
    deliveryStatus: evidence.status,
    commandEvidence: {
      commandCount: evidence.commandCount,
      committed: evidence.status === "applied" || evidence.status === "reset",
      rolledBack: false,
      failed: evidence.status === "blocked" || evidence.status === "unsupported",
      changedPathCount: evidence.commandCount > 0 ? evidence.commandCount : 0,
    },
    diagnosticCounts: normalizeDiagnosticCounts(evidence.diagnosticCounts),
    diagnosticCodes: diagnosticCodes.value.length > 0 ? diagnosticCodes.value : undefined,
    reasonCodes: reasonCodes.value,
    followUpTaskIds: followUpTaskIds.value.length > 0 ? followUpTaskIds.value : undefined,
  }) as unknown as WorkbenchReviewDecision;

  if (!isSafeToken(decision.decisionId) || !isIsoTimestamp(decision.createdAt) || !isSafeToken(decision.sessionId)) {
    return reviewError("/reviewDecision/payload", "Review decision server fields are invalid.");
  }
  if (byteLength(JSON.stringify(decision)) > REVIEW_DECISION_BYTE_CAP) {
    return reviewError("/reviewDecision/payload", "Review decision exceeds the byte cap.");
  }
  return { ok: true, decision };
}

function validateOutcomeAgainstEvidence(
  outcome: string,
  evidence: ReviewEvidence,
  reasonCodes: string[],
  followUpTaskIds: string[],
): { ok: true } | { ok: false; diagnostics: WorkbenchContractDiagnostic[] } {
  const errorCount = evidence.diagnosticCounts?.error ?? 0;
  const deliveryStatus = evidence.deliveryStatus ?? evidence.delivery?.status ?? evidence.status;
  const sourceReadiness = Array.isArray(evidence.sourceReadiness)
    ? evidence.sourceReadiness
    : Array.isArray(evidence.delivery?.sourceReadiness)
      ? evidence.delivery.sourceReadiness
      : [];
  const hasUnsupportedSourceReadiness = sourceReadiness.some((entry) => objectValue(entry)?.state !== "supported");
  if (
    outcome === "accepted" &&
    (errorCount > 0 ||
      evidence.status === "blocked" ||
      evidence.status === "unsupported" ||
      deliveryStatus !== "ready" ||
      hasUnsupportedSourceReadiness)
  ) {
    return reviewError(
      "/reviewAction/evidence",
      "Accepted decisions require ready delivery and supported source readiness.",
    );
  }
  if (outcome === "blocked" && reasonCodes.length === 0) {
    return reviewError("/reviewAction/outcome", "Blocked decisions require a reason code.");
  }
  if (outcome === "follow-up-required" && followUpTaskIds.length === 0) {
    return reviewError("/reviewAction/followUp", "Follow-up decisions require a task id.");
  }
  return { ok: true };
}

function validateOutcomeReasonCodes(
  outcome: string,
  reasonCodes: string[],
): { ok: true } | { ok: false; diagnostics: WorkbenchContractDiagnostic[] } {
  if (outcome === "accepted") {
    return reasonCodes.length === 1 && reasonCodes[0] === "review-accepted"
      ? { ok: true }
      : reviewError("/reviewAction/reasons", "Accepted decisions require the review-accepted reason.");
  }
  return reasonCodes.includes("review-accepted")
    ? reviewError("/reviewAction/reasons", "Blocked and follow-up decisions cannot use the review-accepted reason.")
    : { ok: true };
}

function normalizeReasonCodes(
  value: unknown,
): { ok: true; value: string[] } | { ok: false; diagnostics: WorkbenchContractDiagnostic[] } {
  if (!Array.isArray(value) || value.length === 0) {
    return reviewError("/reviewDecision/reasons", "Reason codes are required.");
  }
  if (value.length > REVIEW_REASON_CAP) {
    return reviewError("/reviewDecision/reasons", "Reason code list exceeds the cap.");
  }
  const reasonCodes: string[] = [];
  for (const reasonCode of value) {
    if (typeof reasonCode !== "string" || !VALID_REASON_CODES.has(reasonCode)) {
      return reviewError("/reviewDecision/reasons", "Reason code is not supported.");
    }
    if (!reasonCodes.includes(reasonCode)) reasonCodes.push(reasonCode);
  }
  return { ok: true, value: reasonCodes };
}

function normalizeFollowUpTaskIds(
  value: unknown,
): { ok: true; value: string[] } | { ok: false; diagnostics: WorkbenchContractDiagnostic[] } {
  if (value === undefined) return { ok: true, value: [] };
  if (!Array.isArray(value)) return reviewError("/reviewDecision/followUps", "Follow-up task ids must be an array.");
  if (value.length > REVIEW_FOLLOW_UP_CAP) {
    return reviewError("/reviewDecision/followUps", "Follow-up task id list exceeds the cap.");
  }
  const followUps: string[] = [];
  for (const taskId of value) {
    if (typeof taskId !== "string" || !/^TASK-\d{4}W\d{2}-[A-Z]+-\d{3}$/.test(taskId)) {
      return reviewError("/reviewDecision/followUps", "Follow-up task id is invalid.");
    }
    if (!followUps.includes(taskId)) followUps.push(taskId);
  }
  return { ok: true, value: followUps };
}

function normalizeDiagnosticCodes(
  value: unknown,
  options: { surface: "audit" | "review" } = { surface: "review" },
):
  | { ok: true; value: Required<WorkbenchDiagnosticCode>[] }
  | { ok: false; diagnostics: WorkbenchContractDiagnostic[] } {
  if (!Array.isArray(value)) return { ok: true, value: [] };
  if (value.length > REVIEW_DIAGNOSTIC_CAP) {
    return options.surface === "audit"
      ? auditError("/auditPayload/diagnostics", "Audit diagnostic code list exceeds the cap.")
      : reviewError("/reviewDecision/diagnostics", "Diagnostic list exceeds the cap.");
  }
  const entries: Required<WorkbenchDiagnosticCode>[] = [];
  for (const item of value) {
    const diagnostic = objectValue(item);
    if (!isSafeToken(diagnostic?.code) || typeof diagnostic.path !== "string" || !diagnostic.path.startsWith("/")) {
      return options.surface === "audit"
        ? auditError("/auditPayload/diagnostics", "Audit diagnostic code entry is invalid.")
        : reviewError("/reviewDecision/diagnostics", "Diagnostic code entry is invalid.");
    }
    entries.push({ code: diagnostic.code, path: diagnostic.path.slice(0, 120) });
  }
  return { ok: true, value: entries };
}

function diagnosticCodesFrom(value: unknown): WorkbenchDiagnosticCode[] {
  if (!Array.isArray(value)) return [];
  return value.map((diagnostic) => {
    const item = objectValue(diagnostic);
    return { code: stringValue(item?.code), path: stringValue(item?.path) };
  });
}

function normalizeDiagnosticCounts(value: WorkbenchDiagnosticCounts | undefined): Required<WorkbenchDiagnosticCounts> {
  return {
    error: nonNegativeInteger(value?.error),
    warning: nonNegativeInteger(value?.warning),
    info: nonNegativeInteger(value?.info),
  };
}

function normalizeReviewOutcome(value: unknown): WorkbenchAuditRecord["reviewOutcome"] {
  const item = objectValue(value);
  if (!item) return undefined;
  const status = ["accepted", "blocked", "follow-up-required"].includes(stringValue(item.status))
    ? stringValue(item.status)
    : undefined;
  const decisionId = isSafeToken(item.decisionId) ? item.decisionId : undefined;
  const reasonCode = isSafeToken(item.reasonCode) ? item.reasonCode : undefined;
  return status && decisionId && reasonCode ? { decisionId, status, reasonCode } : undefined;
}

function normalizeExportFilters(value: unknown): Record<string, unknown> {
  const item = objectValue(value);
  if (!item) return {};
  return removeUndefined({
    from: isIsoTimestamp(item.from) ? item.from : undefined,
    to: isIsoTimestamp(item.to) ? item.to : undefined,
    status: Array.isArray(item.status)
      ? item.status.filter((status) => typeof status === "string" && VALID_AUDIT_STATUSES.has(status)).slice(0, 10)
      : undefined,
  });
}

function normalizeDeletionFilter(
  value: unknown,
): { ok: true; value: Record<string, string> } | { ok: false; diagnostics: WorkbenchContractDiagnostic[] } {
  const item = objectValue(value);
  if (!item) return auditError("/auditDeletion", "Audit deletion filter is required.");
  const payloadCheck = auditPayloadSafe(item);
  if (!payloadCheck.ok) return auditError("/auditDeletion", "Audit deletion filter contains disallowed payload.");
  const filter = removeUndefined({
    recordId: isSafeToken(item.recordId) ? item.recordId : undefined,
    sessionId: isSafeToken(item.sessionId) ? item.sessionId : undefined,
    from: isIsoTimestamp(item.from) ? item.from : undefined,
    to: isIsoTimestamp(item.to) ? item.to : undefined,
    status: typeof item.status === "string" && VALID_AUDIT_STATUSES.has(item.status) ? item.status : undefined,
  }) as Record<string, string>;
  return Object.keys(filter).length > 0
    ? { ok: true, value: filter }
    : auditError("/auditDeletion", "Audit deletion filter is empty.");
}

function authorizeReviewDecision(input: {
  principal?: WorkbenchPrincipal | undefined;
  projectId?: string | undefined;
}): { ok: true } | { ok: false } {
  if (!isValidProjectId(input.projectId)) return { ok: false };
  const principal = input.principal;
  if (!principal || typeof principal !== "object") return { ok: false };
  if (!VALID_REVIEW_ROLES.has(principal.role ?? "")) return { ok: false };
  const allowedProjectIds = Array.isArray(principal.projectIds) ? principal.projectIds : [];
  return allowedProjectIds.includes(input.projectId) || allowedProjectIds.includes("*") ? { ok: true } : { ok: false };
}

interface ReviewEvidence {
  id: string;
  sessionId: string;
  providerId: string;
  status: string;
  commandCount: number;
  diagnosticCounts?: Required<WorkbenchDiagnosticCounts>;
  diagnosticCodes?: Required<WorkbenchDiagnosticCode>[];
  deliveryStatus?: string;
  delivery?: {
    status?: string;
    sourceReadiness?: unknown[];
  };
  sourceReadiness?: unknown[];
  promptHash?: string;
  traceId?: string;
}

function normalizeReviewEvidence(value: unknown): ReviewEvidence | undefined {
  const evidence = objectValue(value);
  if (!evidence) return undefined;
  const id = stringValue(evidence.id) || stringValue(evidence.recordId);
  const sessionId = stringValue(evidence.sessionId);
  const providerId = stringValue(evidence.providerId);
  const status = stringValue(evidence.status);
  const commandCount = nonNegativeInteger(evidence.commandCount);
  if (!isSafeToken(id) || !isSafeToken(sessionId) || !isSafeToken(providerId) || !VALID_AUDIT_STATUSES.has(status)) {
    return undefined;
  }
  const delivery = objectValue(evidence.delivery);
  const normalized: ReviewEvidence = {
    id,
    sessionId,
    providerId,
    status,
    commandCount,
    diagnosticCounts: normalizeDiagnosticCounts(objectValue(evidence.diagnosticCounts) as WorkbenchDiagnosticCounts),
  };
  const diagnosticCodes = normalizeDiagnosticCodes(evidence.diagnosticCodes);
  if (diagnosticCodes.ok && diagnosticCodes.value.length > 0) normalized.diagnosticCodes = diagnosticCodes.value;
  if (typeof evidence.deliveryStatus === "string") normalized.deliveryStatus = evidence.deliveryStatus;
  if (delivery) {
    normalized.delivery = {
      status: stringValue(delivery.status),
      sourceReadiness: Array.isArray(delivery.sourceReadiness) ? delivery.sourceReadiness : [],
    };
  }
  if (Array.isArray(evidence.sourceReadiness)) normalized.sourceReadiness = evidence.sourceReadiness;
  if (typeof evidence.promptHash === "string") normalized.promptHash = evidence.promptHash;
  if (typeof evidence.traceId === "string") normalized.traceId = evidence.traceId;
  return normalized;
}

function findCommandSafetyViolation(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findCommandSafetyViolation(item);
      if (nested) return nested;
    }
    return undefined;
  }
  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (COMMAND_SAFETY_KEYS.has(normalizedKey)) return key;
    const nested = findCommandSafetyViolation(child);
    if (nested) return nested;
  }
  return undefined;
}

function findDisallowedPayloadPath(value: unknown, path = ""): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const childPath = findDisallowedPayloadPath(value[index], `${path}/${index}`);
      if (childPath) return childPath;
    }
    return undefined;
  }
  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    const childPath = `${path}/${key}`;
    if (DISALLOWED_KEYS.has(normalizedKey)) return childPath;
    const nestedPath = findDisallowedPayloadPath(child, childPath);
    if (nestedPath) return nestedPath;
  }
  return undefined;
}

function auditError(path: string, message: string): { ok: false; diagnostics: WorkbenchContractDiagnostic[] } {
  return {
    ok: false,
    diagnostics: [
      {
        severity: "error",
        code: AUDIT_DIAGNOSTIC_CODE,
        message,
        path,
        fix: { kind: "manual", confidence: "high", message: "Use compact audit evidence only." },
      },
    ],
  };
}

function reviewError(path: string, message: string): { ok: false; diagnostics: WorkbenchContractDiagnostic[] } {
  return {
    ok: false,
    diagnostics: [
      {
        severity: "error",
        code: REVIEW_DIAGNOSTIC_CODE,
        message,
        path,
        fix: { kind: "manual", confidence: "high", message: "Record compact review decision evidence only." },
      },
    ],
  };
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function removeUndefined<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter((entry) => entry[1] !== undefined));
}

function isValidProjectId(value: unknown): value is string {
  return typeof value === "string" && PROJECT_ID_PATTERN.test(value);
}

function isSafeToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

function validPromptHash(value: unknown): value is string {
  return typeof value === "string" && PROMPT_HASH_PATTERN.test(value);
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) && value.endsWith("Z");
}

function safeRevision(value: unknown): string {
  return isSafeToken(value) ? value : "0";
}

function nonNegativeInteger(value: unknown): number {
  return Number.isSafeInteger(value) && typeof value === "number" && value >= 0 ? value : 0;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
