import { AUDIT_RECORD_VERSION, auditPayloadSafe, createDurableAuditRecord } from "@gis-engine/ai";

export const STUDIO_AUDIT_RECORD_VERSION = AUDIT_RECORD_VERSION;
export const STUDIO_AUDIT_RECORD_CAP = 50;

export function appendAuditRecord(records, input) {
  const sessionId = safeToken(input.sessionId, "studio-session");
  const recordId = `${sessionId}.${records.length + 1}`;
  const result = createDurableAuditRecord({
    projectId: safeProjectId(input.projectId),
    sessionId,
    recordId,
    createdAt: new Date().toISOString(),
    status: normalizeStatus(input.status),
    providerId: safeToken(input.providerId, "studio-provider"),
    promptHash: input.promptHash,
    traceId: input.traceId,
    commandCount: nonNegativeInteger(input.commandCount),
    diagnosticCounts: countDiagnostics(input.diagnostics ?? []),
    diagnosticCodes: compactDiagnosticCodes(input.diagnostics ?? []),
    fromRevision: input.fromRevision,
    toRevision: input.toRevision,
  });

  if (!result.ok) {
    throw new Error(result.diagnostics.map((diagnostic) => diagnostic.message).join("; "));
  }

  records.push(result.record);
  if (records.length > STUDIO_AUDIT_RECORD_CAP) records.splice(0, records.length - STUDIO_AUDIT_RECORD_CAP);
  return result.record;
}

export { auditPayloadSafe };

export function compactDiagnosticCodes(diagnostics) {
  return diagnostics
    .filter(
      (diagnostic) =>
        safeToken(diagnostic?.code) && typeof diagnostic?.path === "string" && diagnostic.path.startsWith("/"),
    )
    .slice(0, 20)
    .map((diagnostic) => ({ code: diagnostic.code, path: diagnostic.path.slice(0, 120) }));
}

export function countDiagnostics(diagnostics) {
  return diagnostics.reduce(
    (counts, diagnostic) => {
      if (diagnostic?.severity === "error" || diagnostic?.severity === "warning" || diagnostic?.severity === "info") {
        counts[diagnostic.severity] += 1;
      }
      return counts;
    },
    { error: 0, warning: 0, info: 0 },
  );
}

function normalizeStatus(value) {
  return ["applied", "blocked", "ready", "reviewed", "unsupported", "reset"].includes(value) ? value : "ready";
}

function safeProjectId(value) {
  return typeof value === "string" && /^project_[A-Za-z0-9][A-Za-z0-9_-]{0,62}$/.test(value) ? value : "project_studio";
}

function safeToken(value, fallback = undefined) {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(value) ? value : fallback;
}

function nonNegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}
