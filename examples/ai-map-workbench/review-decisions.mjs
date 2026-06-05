import { auditPayloadSafe } from "./audit-contract.mjs";

export const REVIEW_DECISION_VERSION = "amw.review.v1";
export const REVIEW_DECISION_BYTE_CAP = 2 * 1024;
export const REVIEW_REASON_CAP = 8;
export const REVIEW_DIAGNOSTIC_CAP = 20;
export const REVIEW_FOLLOW_UP_CAP = 10;

const REVIEW_DIAGNOSTIC_CODE = "REVIEW.CONTRACT_VIOLATION";
const TOKEN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
const PROJECT_ID_PATTERN = /^project_[A-Za-z0-9][A-Za-z0-9_-]{0,62}$/;
const PROMPT_HASH_PATTERN = /^sha256:[a-f0-9]{64}$/;
const VALID_OUTCOMES = new Set(["accepted", "blocked", "follow-up-required"]);
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
  "product-promotion-required"
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
  "spec"
]);

export function createReviewDecision(input) {
  const request = input?.request ?? {};
  const commandSafetyPath = findCommandSafetyViolation(request);
  if (commandSafetyPath) return reviewError("/reviewAction/commandSafety", "Review actions cannot mutate map state.");
  const payloadCheck = auditPayloadSafe(request);
  if (!payloadCheck.ok) return reviewError("/reviewDecision/payload", "Review decision request contains raw payload fields.");

  const projectId = input?.projectId;
  if (!isValidProjectId(projectId)) return reviewError("/reviewDecision/authorization", "Review project id is invalid.");
  const access = authorizeReviewDecision({ principal: input?.principal, projectId });
  if (!access.ok) return reviewError("/reviewDecision/authorization", "Reviewer cannot decide for this project.");

  const evidence = input?.evidence;
  if (!evidence || typeof evidence !== "object") {
    return reviewError("/reviewAction/evidence", "Review decision requires compact evidence.");
  }

  const outcome = request.outcome;
  if (!VALID_OUTCOMES.has(outcome)) return reviewError("/reviewAction/outcome", "Review outcome is not supported.");

  const reasonCodes = normalizeReasonCodes(request.reasonCodes);
  if (!reasonCodes.ok) return reasonCodes;
  const followUpTaskIds = normalizeFollowUpTaskIds(request.followUpTaskIds);
  if (!followUpTaskIds.ok) return followUpTaskIds;

  const evidenceCheck = validateOutcomeAgainstEvidence(outcome, evidence, reasonCodes.value, followUpTaskIds.value);
  if (!evidenceCheck.ok) return evidenceCheck;

  const diagnosticCodes = normalizeDiagnosticCodes(evidence.diagnosticCodes ?? []);
  if (!diagnosticCodes.ok) return diagnosticCodes;

  const decision = removeUndefined({
    recordVersion: REVIEW_DECISION_VERSION,
    decisionId: input.decisionId,
    createdAt: input.createdAt,
    projectId,
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
      changedPathCount: evidence.commandCount > 0 ? evidence.commandCount : 0
    },
    diagnosticCounts: normalizeDiagnosticCounts(evidence.diagnosticCounts),
    diagnosticCodes: diagnosticCodes.value.length > 0 ? diagnosticCodes.value : undefined,
    reasonCodes: reasonCodes.value,
    followUpTaskIds: followUpTaskIds.value.length > 0 ? followUpTaskIds.value : undefined
  });

  if (!isSafeToken(decision.decisionId) || !isIsoTimestamp(decision.createdAt) || !isSafeToken(decision.sessionId)) {
    return reviewError("/reviewDecision/payload", "Review decision server fields are invalid.");
  }
  if (byteLength(JSON.stringify(decision)) > REVIEW_DECISION_BYTE_CAP) {
    return reviewError("/reviewDecision/payload", "Review decision exceeds the byte cap.");
  }
  return { ok: true, decision };
}

function validateOutcomeAgainstEvidence(outcome, evidence, reasonCodes, followUpTaskIds) {
  const errorCount = evidence.diagnosticCounts?.error ?? 0;
  const deliveryStatus = evidence.deliveryStatus ?? evidence.delivery?.status ?? evidence.status;
  const sourceReadiness = Array.isArray(evidence.sourceReadiness)
    ? evidence.sourceReadiness
    : Array.isArray(evidence.delivery?.sourceReadiness)
      ? evidence.delivery.sourceReadiness
      : [];
  const hasUnsupportedSourceReadiness = sourceReadiness.some((entry) => entry.state !== "supported");
  if (
    outcome === "accepted" &&
    (errorCount > 0 || evidence.status === "blocked" || evidence.status === "unsupported" || deliveryStatus !== "ready" || hasUnsupportedSourceReadiness)
  ) {
    return reviewError("/reviewAction/evidence", "Accepted decisions require ready delivery and supported source readiness.");
  }
  if (outcome === "blocked" && reasonCodes.length === 0) {
    return reviewError("/reviewAction/outcome", "Blocked decisions require a reason code.");
  }
  if (outcome === "follow-up-required" && followUpTaskIds.length === 0) {
    return reviewError("/reviewAction/followUp", "Follow-up decisions require a task id.");
  }
  return { ok: true };
}

function normalizeReasonCodes(value) {
  if (!Array.isArray(value) || value.length === 0) return reviewError("/reviewDecision/reasons", "Reason codes are required.");
  if (value.length > REVIEW_REASON_CAP) return reviewError("/reviewDecision/reasons", "Reason code list exceeds the cap.");
  const reasonCodes = [];
  for (const reasonCode of value) {
    if (!VALID_REASON_CODES.has(reasonCode)) return reviewError("/reviewDecision/reasons", "Reason code is not supported.");
    if (!reasonCodes.includes(reasonCode)) reasonCodes.push(reasonCode);
  }
  return { ok: true, value: reasonCodes };
}

function normalizeFollowUpTaskIds(value) {
  if (value === undefined) return { ok: true, value: [] };
  if (!Array.isArray(value)) return reviewError("/reviewDecision/followUps", "Follow-up task ids must be an array.");
  if (value.length > REVIEW_FOLLOW_UP_CAP) return reviewError("/reviewDecision/followUps", "Follow-up task id list exceeds the cap.");
  const followUps = [];
  for (const taskId of value) {
    if (!/^TASK-\d{4}W\d{2}-[A-Z]+-\d{3}$/.test(taskId)) {
      return reviewError("/reviewDecision/followUps", "Follow-up task id is invalid.");
    }
    if (!followUps.includes(taskId)) followUps.push(taskId);
  }
  return { ok: true, value: followUps };
}

function normalizeDiagnosticCodes(value) {
  if (!Array.isArray(value)) return { ok: true, value: [] };
  if (value.length > REVIEW_DIAGNOSTIC_CAP) return reviewError("/reviewDecision/diagnostics", "Diagnostic list exceeds the cap.");
  return {
    ok: true,
    value: value
      .filter((item) => isSafeToken(item?.code) && typeof item?.path === "string" && item.path.startsWith("/"))
      .map((item) => ({ code: item.code, path: item.path.slice(0, 120) }))
  };
}

function findCommandSafetyViolation(value) {
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

function normalizeDiagnosticCounts(value) {
  return {
    error: nonNegativeInteger(value?.error),
    warning: nonNegativeInteger(value?.warning),
    info: nonNegativeInteger(value?.info)
  };
}

function authorizeReviewDecision(input) {
  const principal = input?.principal;
  const projectId = input?.projectId;
  if (!isValidProjectId(projectId)) return { ok: false };
  if (!principal || typeof principal !== "object") return { ok: false };
  if (!VALID_REVIEW_ROLES.has(principal.role)) return { ok: false };
  const allowedProjectIds = Array.isArray(principal.projectIds) ? principal.projectIds : [];
  return allowedProjectIds.includes(projectId) || allowedProjectIds.includes("*") ? { ok: true } : { ok: false };
}

function reviewError(path, message) {
  return {
    ok: false,
    diagnostics: [
      {
        severity: "error",
        code: REVIEW_DIAGNOSTIC_CODE,
        message,
        path,
        fix: { kind: "manual", confidence: "high", message: "Record compact review decision evidence only." }
      }
    ]
  };
}

function removeUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter((entry) => entry[1] !== undefined));
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

function nonNegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function byteLength(value) {
  return new TextEncoder().encode(value).byteLength;
}
