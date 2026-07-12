import {
  createReviewDecision as createWorkbenchReviewDecision,
  REVIEW_DECISION_BYTE_CAP,
  REVIEW_DECISION_VERSION,
  REVIEW_DIAGNOSTIC_CAP,
  REVIEW_FOLLOW_UP_CAP,
  REVIEW_REASON_CAP,
} from "@gis-engine/ai";

export const STUDIO_REVIEW_DECISION_VERSION = REVIEW_DECISION_VERSION;
export const STUDIO_REVIEW_DECISION_CAP = 50;
export const STUDIO_REVIEW_REASON_CAP = REVIEW_REASON_CAP;
export const STUDIO_REVIEW_DIAGNOSTIC_CAP = REVIEW_DIAGNOSTIC_CAP;
export const STUDIO_REVIEW_FOLLOW_UP_CAP = REVIEW_FOLLOW_UP_CAP;
export const STUDIO_REVIEW_BYTE_CAP = REVIEW_DECISION_BYTE_CAP;

export function createReviewDecision(input) {
  return createWorkbenchReviewDecision({
    ...input,
    evidence: normalizeStudioEvidence(input?.evidence),
  });
}

function normalizeStudioEvidence(evidence) {
  if (!evidence || typeof evidence !== "object") return evidence;
  return {
    ...evidence,
    id: evidence.id ?? evidence.recordId,
  };
}
