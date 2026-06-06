export const STUDIO_AUDIT_RECORD_VERSION = "studio.audit.v1";
export const STUDIO_AUDIT_RECORD_CAP = 50;

const AUDIT_DIAGNOSTIC_CODE = "STUDIO.AUDIT_CONTRACT_VIOLATION";
const TOKEN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
const PROMPT_HASH_PATTERN = /^sha256:[A-Za-z0-9._:-]{1,96}$/;
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

export function appendAuditRecord(records, input) {
  const record = {
    recordVersion: STUDIO_AUDIT_RECORD_VERSION,
    id: `${safeToken(input.sessionId, "studio-session")}.${records.length + 1}`,
    sessionId: safeToken(input.sessionId, "studio-session"),
    timestamp: new Date().toISOString(),
    status: normalizeStatus(input.status),
    providerId: safeToken(input.providerId, "studio-provider"),
    ...(safePromptHash(input.promptHash) ? { promptHash: input.promptHash } : {}),
    ...(safeToken(input.traceId) ? { traceId: input.traceId } : {}),
    commandCount: nonNegativeInteger(input.commandCount),
    diagnosticCounts: countDiagnostics(input.diagnostics ?? []),
    ...(compactDiagnosticCodes(input.diagnostics ?? []).length > 0
      ? { diagnosticCodes: compactDiagnosticCodes(input.diagnostics ?? []) }
      : {}),
    fromRevision: safeRevision(input.fromRevision),
    toRevision: safeRevision(input.toRevision),
  };

  records.push(record);
  if (records.length > STUDIO_AUDIT_RECORD_CAP) records.splice(0, records.length - STUDIO_AUDIT_RECORD_CAP);
  return record;
}

export function auditPayloadSafe(value) {
  const disallowedPath = findDisallowedPayloadPath(value);
  if (!disallowedPath) return { ok: true };
  return {
    ok: false,
    diagnostics: [
      {
        severity: "error",
        code: AUDIT_DIAGNOSTIC_CODE,
        path: `/auditPayload${disallowedPath}`,
        message: "Audit payload contains a disallowed raw field.",
        fix: { kind: "manual", confidence: "high", message: "Use compact audit evidence only." },
      },
    ],
  };
}

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

function normalizeStatus(value) {
  return ["applied", "blocked", "ready", "reviewed"].includes(value) ? value : "ready";
}

function safeToken(value, fallback = undefined) {
  return typeof value === "string" && TOKEN_PATTERN.test(value) ? value : fallback;
}

function safePromptHash(value) {
  return typeof value === "string" && PROMPT_HASH_PATTERN.test(value);
}

function nonNegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function safeRevision(value) {
  return typeof value === "string" && value.length > 0 ? value : "0";
}
