export const AUDIT_RECORD_VERSION = "amw.audit.v1";
export const AUDIT_EXPORT_VERSION = "amw.audit.export.v1";
export const AUDIT_DELETION_RECEIPT_VERSION = "amw.audit.deletion.v1";
export const AUDIT_RECORD_BYTE_CAP = 2 * 1024;
export const AUDIT_EXPORT_RECORD_CAP = 500;
export const AUDIT_EXPORT_BYTE_CAP = 1024 * 1024;
export const AUDIT_DELETION_RECORD_CAP = 10_000;

const AUDIT_DIAGNOSTIC_CODE = "AUDIT.CONTRACT_VIOLATION";
const VALID_STATUSES = new Set(["applied", "blocked", "unsupported", "reset", "accepted", "follow-up-required"]);
const VALID_OPERATIONS = new Set(["append", "list", "export", "delete", "retention"]);
const TOKEN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
const PROJECT_ID_PATTERN = /^project_[A-Za-z0-9][A-Za-z0-9_-]{0,62}$/;
const PROMPT_HASH_PATTERN = /^sha256:[a-f0-9]{64}$/;
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

export function authorizeAuditOperation(input) {
  const operation = input?.operation;
  const principal = input?.principal;
  const projectId = input?.projectId;
  if (!VALID_OPERATIONS.has(operation)) return auditError("/auditAccess", "Unsupported audit operation.");
  if (!isValidProjectId(projectId)) return auditError("/auditAccess", "Audit project id is not authorized.");
  if (!principal || typeof principal !== "object") return auditError("/auditAccess", "Audit principal is required.");

  const role = principal.role;
  const allowedProjectIds = Array.isArray(principal.projectIds) ? principal.projectIds : [];
  const projectAllowed = allowedProjectIds.includes(projectId) || allowedProjectIds.includes("*");
  if (!projectAllowed) return auditError("/auditAccess", "Audit principal cannot access this project.");

  if (role === "admin") return { ok: true };
  if (role === "reviewer" && (operation === "list" || operation === "export")) return { ok: true };
  if (role === "service" && operation === "append") return { ok: true };
  return auditError("/auditAccess", "Audit principal role cannot perform this operation.");
}

export function createDurableAuditRecord(input) {
  const payloadCheck = auditPayloadSafe(input);
  if (!payloadCheck.ok) return payloadCheck;

  if (!isValidProjectId(input?.projectId)) return auditError("/auditPayload", "Audit record project id is invalid.");
  if (!isSafeToken(input?.sessionId)) return auditError("/auditPayload", "Audit record session id is invalid.");
  if (!isSafeToken(input?.recordId)) return auditError("/auditPayload", "Audit record id is invalid.");
  if (!isIsoTimestamp(input?.createdAt)) return auditError("/auditPayload", "Audit record timestamp is invalid.");
  if (!VALID_STATUSES.has(input?.status)) return auditError("/auditPayload", "Audit record status is invalid.");
  if (!isSafeToken(input?.providerId)) return auditError("/auditPayload", "Audit provider id is invalid.");
  if (!Number.isSafeInteger(input?.commandCount) || input.commandCount < 0) {
    return auditError("/auditPayload", "Audit command count is invalid.");
  }

  const diagnosticCodes = normalizeDiagnosticCodes(input?.diagnosticCodes ?? diagnosticCodesFrom(input?.diagnostics));
  if (!diagnosticCodes.ok) return diagnosticCodes;

  const record = removeUndefined({
    recordVersion: AUDIT_RECORD_VERSION,
    projectId: input.projectId,
    sessionId: input.sessionId,
    recordId: input.recordId,
    createdAt: input.createdAt,
    status: input.status,
    providerId: input.providerId,
    promptHash: validPromptHash(input.promptHash) ? input.promptHash : undefined,
    traceId: isSafeToken(input.traceId) ? input.traceId : undefined,
    commandCount: input.commandCount,
    diagnosticCounts: normalizeDiagnosticCounts(input.diagnosticCounts),
    diagnosticCodes: diagnosticCodes.value.length > 0 ? diagnosticCodes.value : undefined,
    fromRevision: safeRevision(input.fromRevision),
    toRevision: safeRevision(input.toRevision),
    reviewOutcome: normalizeReviewOutcome(input.reviewOutcome),
  });

  if (byteLength(JSON.stringify(record)) > AUDIT_RECORD_BYTE_CAP) {
    return auditError("/auditPayload", "Audit record exceeds the byte cap.");
  }
  return { ok: true, record };
}

export function createAuditExportEnvelope(input) {
  const access = authorizeAuditOperation({
    operation: "export",
    principal: input?.principal,
    projectId: input?.projectId,
  });
  if (!access.ok) return access;
  if (!isIsoTimestamp(input?.generatedAt)) return auditError("/auditExport", "Audit export timestamp is invalid.");
  const records = Array.isArray(input?.records) ? input.records : [];
  if (records.length > AUDIT_EXPORT_RECORD_CAP) {
    return auditError("/auditExport/size", "Audit export exceeds the record cap.");
  }
  for (const record of records) {
    const payloadCheck = auditPayloadSafe(record);
    if (!payloadCheck.ok) return payloadCheck;
    if (record?.recordVersion !== AUDIT_RECORD_VERSION || record?.projectId !== input.projectId) {
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
  };
  if (byteLength(JSON.stringify(envelope)) > AUDIT_EXPORT_BYTE_CAP) {
    return auditError("/auditExport/size", "Audit export exceeds the byte cap.");
  }
  return { ok: true, envelope };
}

export function createAuditDeletionReceipt(input) {
  const access = authorizeAuditOperation({
    operation: "delete",
    principal: input?.principal,
    projectId: input?.projectId,
  });
  if (!access.ok) return access;
  if (!isIsoTimestamp(input?.deletedAt)) return auditError("/auditDeletion", "Audit deletion timestamp is invalid.");
  if (!isSafeToken(input?.actorId)) return auditError("/auditDeletion", "Audit deletion actor is invalid.");
  if (!isSafeToken(input?.reasonCode)) return auditError("/auditDeletion", "Audit deletion reason is invalid.");
  if (
    !Number.isSafeInteger(input?.deletedCount) ||
    input.deletedCount < 0 ||
    input.deletedCount > AUDIT_DELETION_RECORD_CAP
  ) {
    return auditError("/auditDeletion/size", "Audit deletion count exceeds the cap.");
  }
  const filterSummary = normalizeDeletionFilter(input.filterSummary);
  if (!filterSummary.ok) return filterSummary;

  return {
    ok: true,
    receipt: {
      deletionReceiptVersion: AUDIT_DELETION_RECEIPT_VERSION,
      projectId: input.projectId,
      deletedAt: input.deletedAt,
      actorId: input.actorId,
      reasonCode: input.reasonCode,
      filterSummary: filterSummary.value,
      deletedCount: input.deletedCount,
    },
  };
}

export function auditPayloadSafe(value) {
  const disallowedPath = findDisallowedPayloadPath(value);
  if (disallowedPath)
    return auditError(`/auditPayload${disallowedPath}`, "Audit payload contains a disallowed raw field.");
  return { ok: true };
}

function normalizeDiagnosticCodes(value) {
  if (!Array.isArray(value)) return { ok: true, value: [] };
  if (value.length > 20) return auditError("/auditPayload/diagnostics", "Audit diagnostic code list exceeds the cap.");
  const entries = [];
  for (const item of value) {
    if (!item || typeof item !== "object")
      return auditError("/auditPayload/diagnostics", "Audit diagnostic code entry is invalid.");
    if (!isSafeToken(item.code) || typeof item.path !== "string" || !item.path.startsWith("/")) {
      return auditError("/auditPayload/diagnostics", "Audit diagnostic code entry is invalid.");
    }
    entries.push({ code: item.code, path: item.path.slice(0, 120) });
  }
  return { ok: true, value: entries };
}

function diagnosticCodesFrom(diagnostics) {
  if (!Array.isArray(diagnostics)) return [];
  return diagnostics.map((diagnostic) => ({
    code: diagnostic?.code,
    path: diagnostic?.path,
  }));
}

function normalizeDiagnosticCounts(value) {
  return {
    error: nonNegativeInteger(value?.error),
    warning: nonNegativeInteger(value?.warning),
    info: nonNegativeInteger(value?.info),
  };
}

function normalizeReviewOutcome(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const status = ["accepted", "blocked", "follow-up-required"].includes(value.status) ? value.status : undefined;
  const decisionId = isSafeToken(value.decisionId) ? value.decisionId : undefined;
  const reasonCode = isSafeToken(value.reasonCode) ? value.reasonCode : undefined;
  return status && decisionId && reasonCode ? { decisionId, status, reasonCode } : undefined;
}

function normalizeExportFilters(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return removeUndefined({
    from: isIsoTimestamp(value.from) ? value.from : undefined,
    to: isIsoTimestamp(value.to) ? value.to : undefined,
    status: Array.isArray(value.status)
      ? value.status.filter((status) => VALID_STATUSES.has(status)).slice(0, 10)
      : undefined,
  });
}

function normalizeDeletionFilter(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return auditError("/auditDeletion", "Audit deletion filter is required.");
  }
  const payloadCheck = auditPayloadSafe(value);
  if (!payloadCheck.ok) return auditError("/auditDeletion", "Audit deletion filter contains disallowed payload.");
  const filter = removeUndefined({
    recordId: isSafeToken(value.recordId) ? value.recordId : undefined,
    sessionId: isSafeToken(value.sessionId) ? value.sessionId : undefined,
    from: isIsoTimestamp(value.from) ? value.from : undefined,
    to: isIsoTimestamp(value.to) ? value.to : undefined,
    status: VALID_STATUSES.has(value.status) ? value.status : undefined,
  });
  return Object.keys(filter).length > 0
    ? { ok: true, value: filter }
    : auditError("/auditDeletion", "Audit deletion filter is empty.");
}

function findDisallowedPayloadPath(value, path = "") {
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

function removeUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter((entry) => entry[1] !== undefined));
}

function auditError(path, message) {
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

function isValidProjectId(value) {
  return typeof value === "string" && PROJECT_ID_PATTERN.test(value);
}

function isSafeToken(value) {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

function validPromptHash(value) {
  return typeof value === "string" && PROMPT_HASH_PATTERN.test(value);
}

function isIsoTimestamp(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) && value.endsWith("Z");
}

function safeRevision(value) {
  return isSafeToken(value) ? value : "0";
}

function nonNegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function byteLength(value) {
  return new TextEncoder().encode(value).byteLength;
}
