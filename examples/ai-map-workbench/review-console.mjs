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

const PMTILES_ARCHIVE_CONTRACT = {
  state: "explicit",
  metadataFields: [
    "specVersion",
    "archiveBytes",
    "rootDirectoryOffset",
    "rootDirectoryLength",
    "hasVectorTiles",
    "hasRasterTiles",
    "tileType",
    "minZoom",
    "maxZoom",
    "bounds"
  ],
  policyFields: ["maxArchiveBytes", "maxRootDirectoryBytes", "allowRangeRequests", "maxRangeSegments", "timeoutMs"]
};

const SOURCE_CONTRACT_DEFINITIONS = {
  geoparquet: {
    kind: "schema",
    state: "explicit",
    metadataFields: ["type", "url", "crs", "encoding", "bbox", "rowCount", "fileBytes", "parquetVersion"],
    policyFields: ["maxFileBytes", "maxRowCount", "allowRemoteUrls", "timeoutMs", "workerBudget"]
  },
  flatgeobuf: {
    kind: "schema",
    state: "explicit",
    metadataFields: ["type", "url", "hasIndex", "featureCount", "bbox", "geometryType", "fileBytes"],
    policyFields: ["maxFileBytes", "maxFeatureCount", "allowRangeRequests", "indexRequired", "timeoutMs"]
  }
};

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
  const sourceReadiness = normalizeSourceReadinessEntries(delivery.sourceReadiness ?? []);
  const sourcePromotionCandidates = computeSourcePromotionCandidates(delivery, sourceReadiness);
  const acceptance = computeOverallAcceptance(sections, delivery);

  return {
    version: REVIEW_CONSOLE_VERSION,
    acceptance,
    deliveryStatus: delivery.status ?? "blocked",
    sections,
    sourceReadiness,
    sourcePromotionCandidates,
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
  const sourceReadiness = normalizeSourceReadinessEntries(delivery.sourceReadiness ?? []);
  const sourcePromotionCandidates = computeSourcePromotionCandidates(delivery, sourceReadiness);

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
      id: s.sourceId,
      format: s.format,
      state: s.state,
      queryReady: s.queryReady ?? false,
      resourcePolicy: s.resourcePolicy ?? "not-checked",
      ...(s.sourceContract ? { sourceContract: s.sourceContract } : {}),
      ...(s.archiveContract ? { archiveContract: s.archiveContract } : {})
    })),
    promotionCandidates: sourcePromotionCandidates.map(candidate => ({
      id: candidate.candidateId,
      format: candidate.format,
      state: candidate.state,
      resourcePolicy: candidate.resourcePolicy ?? "not-checked",
      ...(candidate.sourceContract ? { sourceContract: candidate.sourceContract } : {}),
      ...(candidate.archiveContract ? { archiveContract: candidate.archiveContract } : {}),
      target: candidate.target,
      exitCondition: candidate.exitCondition,
      sourceIds: candidate.sourceIds
    })),
    summary: {
      total: sourceReadiness.length,
      supported: sourceReadiness.filter(s => s.state === "supported").length,
      readinessOnly: sourceReadiness.filter(s => s.state === "readiness-only").length,
      blocked: sourceReadiness.filter(s => s.state === "blocked").length
    }
  };
}

function normalizeSourceReadinessEntries(sourceReadiness) {
  return sourceReadiness.map((source, index) => ({
    sourceId: source.sourceId ?? source.id ?? `source-${index + 1}`,
    format: source.format ?? source.type ?? "unknown",
    state: source.state ?? "blocked",
    queryReady: source.queryReady ?? false,
    resourcePolicy: source.resourcePolicy ?? "not-checked",
    ...buildContractFields(source.format ?? source.type, source.archiveContract, source.sourceContract),
    notes: Array.isArray(source.notes) ? source.notes : []
  }));
}

function computeSourcePromotionCandidates(delivery, sourceReadiness = normalizeSourceReadinessEntries(delivery.sourceReadiness ?? [])) {
  const explicitCandidates = delivery.sourcePromotionCandidates;
  if (Array.isArray(explicitCandidates) && explicitCandidates.length > 0) {
    return explicitCandidates.map(candidate => ({
      ...candidate,
      resourcePolicy: candidate.resourcePolicy ?? sourceReadiness.find((source) => source.sourceId === candidate.sourceIds?.[0])?.resourcePolicy ?? "not-checked",
      ...buildContractFields(
        candidate.format,
        candidate.archiveContract ?? sourceReadiness.find((source) => source.sourceId === candidate.sourceIds?.[0])?.archiveContract,
        candidate.sourceContract ?? sourceReadiness.find((source) => source.sourceId === candidate.sourceIds?.[0])?.sourceContract
      )
    }));
  }

  return sourceReadiness.flatMap((source) => {
    if (source.state === "supported") return [];
    const definition = SOURCE_PROMOTION_CANDIDATE_DEFINITIONS[source.format];
    if (!definition) return [];

    return [{
      candidateId: `source-promotion.${source.format}.${source.sourceId}`,
      format: source.format,
      state: source.state,
      resourcePolicy: source.resourcePolicy ?? "not-checked",
      ...buildContractFields(source.format, source.archiveContract, source.sourceContract),
      target: definition.target,
      exitCondition: definition.exitCondition,
      sourceIds: [source.sourceId],
      notes: [...source.notes, definition.note]
    }];
  });
}

function buildContractFields(format, archiveContract, sourceContract) {
  const resolvedArchiveContract = archiveContract ?? (format === "pmtiles" ? PMTILES_ARCHIVE_CONTRACT : undefined);
  const resolvedSourceContract = sourceContract ?? inferSourceContract(format);
  return {
    ...(resolvedSourceContract ? { sourceContract: resolvedSourceContract } : {}),
    ...(resolvedArchiveContract ? { archiveContract: resolvedArchiveContract } : {})
  };
}

function inferSourceContract(format) {
  return SOURCE_CONTRACT_DEFINITIONS[format] ?? undefined;
}

const SOURCE_PROMOTION_CANDIDATE_DEFINITIONS = {
  pmtiles: {
    target: "PMTiles archive metadata promotion gate",
    exitCondition: "Schema, resource-policy, and manifest evidence must prove archive metadata is explicit while archive parsing and feature query remain blocked.",
    note: "Promote only one format at a time; archive parsing stays blocked until the gate passes."
  },
  geoparquet: {
    target: "GeoParquet source schema gate",
    exitCondition: "TypeBox schema, CRS and encoding diagnostics, range policy, and no-runtime-claim manifest tests must pass before runtime loading is promoted.",
    note: "Runtime loading stays blocked until schema and diagnostics land."
  },
  flatgeobuf: {
    target: "FlatGeobuf source schema gate",
    exitCondition: "Stream and index schema, resource policy, and deterministic negative fixtures must pass before runtime loading is promoted.",
    note: "Only file-list evidence is allowed before the schema gate."
  },
  geotiff: {
    target: "GeoTIFF raster source gate",
    exitCondition: "Raster schema, band/CRS/no-data diagnostics, resource policy, and snapshot strategy must land before display/export is promoted.",
    note: "Raster sampling stays blocked until display evidence exists."
  },
  geozarr: {
    target: "GeoZarr array source gate",
    exitCondition: "Array-store schema, chunk policy, worker budget, and blocked query/sampling diagnostics must land before runtime support is promoted.",
    note: "Chunked array support stays blocked until deterministic fixtures exist."
  }
};

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
