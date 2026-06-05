import { describe, expect, it } from "vitest";
import {
  createReviewDecision,
  REVIEW_DECISION_VERSION,
  REVIEW_REASON_CAP,
  REVIEW_DIAGNOSTIC_CAP,
  REVIEW_FOLLOW_UP_CAP
} from "../../examples/ai-map-workbench/review-decisions.mjs";
import {
  createDurableAuditRecord,
  AUDIT_RECORD_VERSION,
  AUDIT_EXPORT_RECORD_CAP,
  AUDIT_EXPORT_BYTE_CAP,
  auditPayloadSafe
} from "../../examples/ai-map-workbench/audit-contract.mjs";

const PROJECT_ID = "project_test-001";
const SESSION_ID = "session-w24-hardening";
const PRINCIPAL = { id: "reviewer-1", role: "reviewer", projectIds: [PROJECT_ID] };

function makeEvidence(status = "applied", commandCount = 2) {
  return {
    id: "audit-rec-001",
    sessionId: SESSION_ID,
    providerId: "mock-ai",
    status,
    commandCount,
    diagnosticCounts: { error: 0, warning: 0, info: 0 },
    diagnosticCodes: []
  };
}

describe("Workbench hardening: review actions (RCU-003)", () => {
  it("accepts valid accepted review decision", () => {
    const result = createReviewDecision({
      projectId: PROJECT_ID,
      principal: PRINCIPAL,
      decisionId: "dec-001",
      createdAt: "2026-06-05T12:00:00Z",
      request: {
        outcome: "accepted",
        reasonCodes: ["review-accepted"]
      },
      evidence: makeEvidence()
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.decision.recordVersion).toBe(REVIEW_DECISION_VERSION);
      expect(result.decision.outcome).toBe("accepted");
    }
  });

  it("accepts valid blocked review decision with reason codes", () => {
    const result = createReviewDecision({
      projectId: PROJECT_ID,
      principal: PRINCIPAL,
      decisionId: "dec-002",
      createdAt: "2026-06-05T12:00:00Z",
      request: {
        outcome: "blocked",
        reasonCodes: ["provider-output-blocked"]
      },
      evidence: makeEvidence("blocked", 0)
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.decision.outcome).toBe("blocked");
    }
  });

  it("accepts valid follow-up-required decision with task ids", () => {
    const result = createReviewDecision({
      projectId: PROJECT_ID,
      principal: { id: "admin-1", role: "admin", projectIds: [PROJECT_ID] },
      decisionId: "dec-003",
      createdAt: "2026-06-05T12:00:00Z",
      request: {
        outcome: "follow-up-required",
        reasonCodes: ["spatial-query-follow-up"],
        followUpTaskIds: ["TASK-2026W24-CNS-001"]
      },
      evidence: makeEvidence("applied", 1)
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.decision.outcome).toBe("follow-up-required");
    }
  });

  it("rejects invalid outcome", () => {
    const result = createReviewDecision({
      projectId: PROJECT_ID,
      principal: PRINCIPAL,
      decisionId: "dec-004",
      createdAt: "2026-06-05T12:00:00Z",
      request: {
        outcome: "invalid-state",
        reasonCodes: ["review-accepted"]
      },
      evidence: makeEvidence()
    });

    expect(result.ok).toBe(false);
  });

  it("rejects command-unsafe review request (contains MapSpec mutation keys)", () => {
    const result = createReviewDecision({
      projectId: PROJECT_ID,
      principal: PRINCIPAL,
      decisionId: "dec-005",
      createdAt: "2026-06-05T12:00:00Z",
      request: {
        outcome: "accepted",
        reasonCodes: ["review-accepted"],
        spec: { version: "0.1", id: "hack" }
      },
      evidence: makeEvidence()
    });

    expect(result.ok).toBe(false);
  });

  it("exposes frozen review decision constants", () => {
    expect(REVIEW_DECISION_VERSION).toBe("amw.review.v1");
    expect(REVIEW_REASON_CAP).toBe(8);
    expect(REVIEW_DIAGNOSTIC_CAP).toBe(20);
    expect(REVIEW_FOLLOW_UP_CAP).toBe(10);
  });
});

describe("Workbench hardening: durable audit contract", () => {
  it("creates valid audit record with compact fields only", () => {
    const result = createDurableAuditRecord({
      projectId: PROJECT_ID,
      sessionId: SESSION_ID,
      recordId: "rec-w24-001",
      createdAt: "2026-06-05T12:00:00Z",
      status: "applied",
      providerId: "mock-ai",
      commandCount: 3,
      diagnosticCounts: { error: 0, warning: 0, info: 1 },
      fromRevision: "1",
      toRevision: "2"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.recordVersion).toBe(AUDIT_RECORD_VERSION);
      expect(result.record.status).toBe("applied");
      expect(result.record.commandCount).toBe(3);
    }
  });

  it("rejects audit records with disallowed payload keys", () => {
    const disallowed = ["rawPrompt", "apiKey", "mapSpec", "patch", "screenshot", "credential"];
    for (const key of disallowed) {
      const check = auditPayloadSafe({ [key]: "leaked-data" });
      expect(check.ok).toBe(false);
    }
  });

  it("exposes frozen audit contract constants", () => {
    expect(AUDIT_RECORD_VERSION).toBe("amw.audit.v1");
    expect(AUDIT_EXPORT_RECORD_CAP).toBe(500);
    expect(AUDIT_EXPORT_BYTE_CAP).toBe(1_048_576);
  });
});

describe("Workbench hardening: credential safety", () => {
  it("review decision does not store raw prompt or provider body", () => {
    const result = createReviewDecision({
      projectId: PROJECT_ID,
      principal: PRINCIPAL,
      decisionId: "dec-safety-001",
      createdAt: "2026-06-05T12:00:00Z",
      request: {
        outcome: "accepted",
        reasonCodes: ["review-accepted"]
      },
      evidence: {
        ...makeEvidence(),
        promptHash: "sha256:" + "a".repeat(64)
      }
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const serialized = JSON.stringify(result.decision);
      expect(serialized).not.toContain("rawPrompt");
      expect(serialized).not.toContain("providerBody");
      expect(serialized).not.toContain("apiKey");
      expect(serialized).not.toContain("credential");
    }
  });

  it("audit record does not retain sensitive payloads", () => {
    const result = createDurableAuditRecord({
      projectId: PROJECT_ID,
      sessionId: SESSION_ID,
      recordId: "rec-safety-001",
      createdAt: "2026-06-05T12:00:00Z",
      status: "applied",
      providerId: "mock-ai",
      commandCount: 1,
      diagnosticCounts: { error: 0, warning: 0, info: 0 },
      fromRevision: "1",
      toRevision: "2",
      promptHash: "sha256:" + "b".repeat(64)
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const serialized = JSON.stringify(result.record);
      expect(serialized).not.toContain("apiKey");
      expect(serialized).not.toContain("secret");
      expect(serialized).not.toContain("credential");
    }
  });
});
