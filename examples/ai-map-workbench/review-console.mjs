// Review-console contract: computes review section states from a GenerationEvidenceBundle
// Version: gis.review-console.v1
// Does NOT add MCP tool names, mutate MapSpec, or write files.

export const REVIEW_CONSOLE_VERSION = "gis.review-console.v1";

// Six review sections per the feature spec
export const REVIEW_SECTION_IDS = [
  "delivery-summary",
  "files-and-export",
  "map-edits",
  "data-and-sources",
  "spatial-analysis",
  "scene-browsing"
];

// Acceptance states
export const ACCEPTANCE_STATES = ["ready", "blocked", "needs-confirmation", "follow-up-required"];

/**
 * Compute review console state from a compact generation evidence payload.
 * @param {object} evidence - compact generation evidence (as returned by /api/chat)
 * @returns {object} review console state with sections and overall acceptance
 */
export function computeReviewConsoleState(evidence) {
  if (!evidence || typeof evidence !== "object") {
    return { error: "invalid-evidence", sections: [], acceptance: "blocked" };
  }

  const delivery = evidence.delivery;
  if (!delivery) {
    return { error: "missing-delivery", sections: [], acceptance: "blocked" };
  }

  const sections = REVIEW_SECTION_IDS.map(id => computeSectionState(id, evidence));
  const acceptance = computeOverallAcceptance(sections, delivery);

  return {
    version: REVIEW_CONSOLE_VERSION,
    acceptance,
    deliveryStatus: delivery.status ?? "blocked",
    sections,
    sourceReadiness: delivery.sourceReadiness ?? [],
    confirmations: delivery.confirmations ?? [],
    followUps: delivery.followUps ?? [],
    diagnosticCounts: evidence.diagnostics ? {
      total: evidence.diagnostics.length,
      errors: evidence.diagnostics.filter(d => d.severity === "error").length,
      warnings: evidence.diagnostics.filter(d => d.severity === "warning").length
    } : { total: 0, errors: 0, warnings: 0 }
  };
}

function computeSectionState(sectionId, evidence) {
  const delivery = evidence.delivery ?? {};
  const section = (delivery.sections ?? []).find(s => s.id === sectionId);

  switch (sectionId) {
    case "delivery-summary":
      return {
        id: sectionId,
        state: delivery.status ?? "blocked",
        status: delivery.status ?? "blocked",
        acceptance: delivery.acceptance ?? { state: delivery.status ?? "blocked" },
        evidence: {
          commandCount: evidence.commandEvidence?.count ?? 0,
          validationValid: evidence.validation?.valid ?? false,
          diagnosticCount: evidence.diagnostics?.length ?? 0
        }
      };

    case "files-and-export":
      return {
        id: sectionId,
        state: delivery.status === "ready" ? "ready" : (section?.state ?? "follow-up-required"),
        evidence: {
          exportReady: evidence.exportEvidence?.ready ?? false,
          sourceCount: evidence.exportEvidence?.sourceCount ?? 0,
          layerCount: evidence.exportEvidence?.layerCount ?? 0,
          sideEffectFree: true
        },
        confirmations: (delivery.confirmations ?? [])
          .filter(c => c.reason === "file-write" || c.reason === "network-fetch")
      };

    case "map-edits":
      return {
        id: sectionId,
        state: evidence.commandEvidence?.count > 0 ? "ready" : "follow-up-required",
        evidence: {
          commandCount: evidence.commandEvidence?.count ?? 0,
          committed: evidence.commandEvidence?.committed ?? 0,
          rolledBack: evidence.commandEvidence?.rolledBack ?? 0,
          traceId: evidence.commandEvidence?.traceId ?? null
        }
      };

    case "data-and-sources":
      return computeDataSourceSection(evidence);

    case "spatial-analysis":
      return {
        id: sectionId,
        state: computeSpatialState(evidence),
        evidence: {
          requested: evidence.spatialQueryEvidence?.requested ?? false,
          ready: evidence.spatialQueryEvidence?.ready ?? false,
          cases: evidence.spatialQueryEvidence?.cases ?? [],
          capabilityGate: evidence.spatialQueryEvidence?.capabilityGate ?? "not-requested"
        }
      };

    case "scene-browsing":
      return computeSceneBrowsingSection(evidence);

    default:
      return { id: sectionId, state: "blocked", evidence: {} };
  }
}

function computeDataSourceSection(evidence) {
  const delivery = evidence.delivery ?? {};
  const sourceReadiness = delivery.sourceReadiness ?? [];

  const hasBlocked = sourceReadiness.some(s => s.state === "blocked");
  const hasReadinessOnly = sourceReadiness.some(s => s.state === "readiness-only");
  const allSupported = sourceReadiness.length > 0 && sourceReadiness.every(s => s.state === "supported");

  let state;
  if (hasBlocked) state = "blocked";
  else if (hasReadinessOnly) state = "follow-up-required";
  else if (allSupported) state = "ready";
  else state = "follow-up-required";

  return {
    id: "data-and-sources",
    state,
    sources: sourceReadiness.map(s => ({
      id: s.id,
      format: s.format ?? "unknown",
      state: s.state,
      queryReady: s.queryReady ?? false,
      resourcePolicy: s.resourcePolicy ?? "not-checked"
    })),
    summary: {
      total: sourceReadiness.length,
      supported: sourceReadiness.filter(s => s.state === "supported").length,
      readinessOnly: sourceReadiness.filter(s => s.state === "readiness-only").length,
      blocked: sourceReadiness.filter(s => s.state === "blocked").length
    }
  };
}

function computeSpatialState(evidence) {
  const spatial = evidence.spatialQueryEvidence;
  if (!spatial?.requested) return "not-requested";
  if (spatial.ready) return "ready";

  const hasBlockedOps = (spatial.cases ?? []).some(c => c.state === "blocked");
  if (hasBlockedOps) return "blocked";
  return "follow-up-required";
}

function computeSceneBrowsingSection(evidence) {
  const delivery = evidence.delivery ?? {};
  const sceneSection = (delivery.sections ?? []).find(s => s.id === "scene-browsing");

  return {
    id: "scene-browsing",
    state: sceneSection?.state ?? "not-requested",
    evidence: {
      stableRuntimeBlocked: true,
      extensionOnly: true
    },
    blockers: sceneSection?.blockers ?? []
  };
}

function computeOverallAcceptance(sections, delivery) {
  const states = sections.map(s => s.state);

  if (states.includes("blocked")) return "blocked";
  if ((delivery.confirmations ?? []).length > 0) return "needs-confirmation";
  if (states.includes("follow-up-required")) return "follow-up-required";
  if (states.every(s => s === "ready" || s === "not-requested")) return "ready";
  return delivery.status ?? "blocked";
}
