import { DiagnosticCodes } from "../diagnostics/codes.js";
import { escapePathSegment } from "../spec/patch/path.js";
import { defaultResourcePolicy, type ResourcePolicy, validateResourcePolicy } from "../spec/resource-policy.js";
import type { Diagnostic, MapSpec, SourceSpec } from "../types.js";
import { createPMTilesRuntimeLoadPlan, type PMTilesRuntimeLoadPlan, type PMTilesRuntimeSourcePlan } from "./pmtiles.js";

export type SourceReadinessState = "supported" | "readiness-only" | "blocked";
export type SourceReadinessReportStatus = "ready" | "follow-up-required" | "blocked";
export type SourceResourcePolicyStatus = "passed" | "blocked" | "not-applicable";

export interface CreateSourceReadinessReportOptions {
  resourcePolicy?: ResourcePolicy;
  pmtilesLoadPlan?: PMTilesRuntimeLoadPlan;
}

export interface SourceRuntimeReadinessSummary {
  status: PMTilesRuntimeSourcePlan["status"];
  sourceLayerIds: string[];
  diagnosticCounts: {
    error: number;
    warning: number;
    info: number;
  };
  requirements: PMTilesRuntimeSourcePlan["requirements"];
}

export interface SourceReadinessEntry {
  sourceId: string;
  type: string;
  state: SourceReadinessState;
  displayReady: boolean;
  queryReady: boolean;
  resourcePolicy: SourceResourcePolicyStatus;
  diagnostics: Diagnostic[];
  limitations: string[];
  nextAction: string;
  runtimeLoadPlan?: SourceRuntimeReadinessSummary;
}

export interface SourceReadinessReport {
  status: SourceReadinessReportStatus;
  sources: SourceReadinessEntry[];
  diagnostics: Diagnostic[];
  summary: {
    sourceCount: number;
    supportedSourceCount: number;
    readinessOnlySourceCount: number;
    blockedSourceCount: number;
    displayReadySourceCount: number;
    queryReadySourceCount: number;
  };
}

export function createSourceReadinessReport(
  spec: MapSpec,
  options: CreateSourceReadinessReportOptions = {},
): SourceReadinessReport {
  const resourcePolicy = options.resourcePolicy ?? defaultResourcePolicy;
  const resourceDiagnostics = validateResourcePolicy(spec, resourcePolicy);
  const pmtilesLoadPlan = options.pmtilesLoadPlan ?? createPMTilesRuntimeLoadPlan(spec, { resourcePolicy });
  const pmtilesPlans = new Map(pmtilesLoadPlan.sources.map((sourcePlan) => [sourcePlan.sourceId, sourcePlan]));

  const sources = Object.entries(spec.sources).map(([sourceId, source]) =>
    createSourceReadinessEntry(sourceId, source, resourceDiagnostics, pmtilesPlans.get(sourceId)),
  );
  const diagnostics = sources.flatMap((source) => source.diagnostics);
  const supportedSourceCount = sources.filter((source) => source.state === "supported").length;
  const readinessOnlySourceCount = sources.filter((source) => source.state === "readiness-only").length;
  const blockedSourceCount = sources.filter((source) => source.state === "blocked").length;

  return {
    status: blockedSourceCount > 0 ? "blocked" : readinessOnlySourceCount > 0 ? "follow-up-required" : "ready",
    sources,
    diagnostics,
    summary: {
      sourceCount: sources.length,
      supportedSourceCount,
      readinessOnlySourceCount,
      blockedSourceCount,
      displayReadySourceCount: sources.filter((source) => source.displayReady).length,
      queryReadySourceCount: sources.filter((source) => source.queryReady).length,
    },
  };
}

function createSourceReadinessEntry(
  sourceId: string,
  source: SourceSpec,
  resourceDiagnostics: Diagnostic[],
  pmtilesPlan?: PMTilesRuntimeSourcePlan,
): SourceReadinessEntry {
  const sourceType = getSourceType(source);
  const sourceDiagnostics =
    sourceType === "pmtiles"
      ? (pmtilesPlan?.diagnostics ?? sourceDiagnosticsFor(sourceId, resourceDiagnostics))
      : sourceDiagnosticsFor(sourceId, resourceDiagnostics);
  const resourcePolicy = resourcePolicyStatus(sourceType, source, sourceDiagnostics);
  const resourceBlocked = resourcePolicy === "blocked";

  if (sourceType === "geojson") {
    const inline = typeof (source as { data?: unknown }).data !== "string";
    return {
      sourceId,
      type: sourceType,
      state: resourceBlocked ? "blocked" : inline ? "supported" : "readiness-only",
      displayReady: !resourceBlocked,
      queryReady: inline && !resourceBlocked,
      resourcePolicy,
      diagnostics: sourceDiagnostics,
      limitations: inline ? [] : ["URL GeoJSON headless query requires a future fetch/cache contract."],
      nextAction: inline
        ? "Ready for display/export and inline GeoJSON point/bbox query."
        : "Inline the GeoJSON data or add a future fetch/cache contract before claiming headless query support.",
    };
  }

  if (sourceType === "raster") {
    return {
      sourceId,
      type: sourceType,
      state: resourceBlocked ? "blocked" : "supported",
      displayReady: !resourceBlocked,
      queryReady: false,
      resourcePolicy,
      diagnostics: sourceDiagnostics,
      limitations: ["Raster feature query and sampling are not implemented."],
      nextAction: resourceBlocked
        ? "Fix the raster tile resource policy blockers."
        : "Use display/export evidence; keep raster query or sampling as a follow-up contract.",
    };
  }

  if (sourceType === "vector") {
    return {
      sourceId,
      type: sourceType,
      state: resourceBlocked ? "blocked" : "supported",
      displayReady: !resourceBlocked,
      queryReady: false,
      resourcePolicy,
      diagnostics: sourceDiagnostics,
      limitations: ["Vector tile feature query requires a future decode/query contract."],
      nextAction: resourceBlocked
        ? "Fix the vector tile resource policy blockers."
        : "Use display/export evidence; keep feature query as a follow-up contract.",
    };
  }

  if (sourceType === "pmtiles") {
    const blocked = pmtilesPlan?.status === "blocked" || resourceBlocked;
    const metadataRequired = pmtilesPlan?.status === "metadata-required";
    return {
      sourceId,
      type: sourceType,
      state: blocked ? "blocked" : "readiness-only",
      displayReady: !blocked && !metadataRequired,
      queryReady: false,
      resourcePolicy,
      diagnostics: sourceDiagnostics,
      limitations: ["PMTiles archive parsing, mutation/export handoff, and feature query are not implemented."],
      nextAction: blocked
        ? "Fix PMTiles load-plan blockers before delivery."
        : metadataRequired
          ? "Provide caller-supplied PMTiles archive metadata for the requested preflight gate."
          : "Use URL-compatible display/export evidence; keep archive parsing and feature query as follow-up contracts.",
      ...(pmtilesPlan ? { runtimeLoadPlan: summarizePMTilesRuntimeLoadPlan(pmtilesPlan) } : {}),
    };
  }

  const unsupportedDiagnostic = unsupportedSourceDiagnostic(sourceId, sourceType);
  return {
    sourceId,
    type: sourceType,
    state: "blocked",
    displayReady: false,
    queryReady: false,
    resourcePolicy: "not-applicable",
    diagnostics: [unsupportedDiagnostic],
    limitations: ["This source type is not accepted by the public MapSpec source contract."],
    nextAction:
      "Add a TypeBox source schema, resource-policy paths, diagnostics, adapter boundary tests, and docs before generating this source type.",
  };
}

function getSourceType(source: SourceSpec): string {
  const value = (source as { type?: unknown }).type;
  return typeof value === "string" && value.trim().length > 0 ? value : "unknown";
}

function sourceDiagnosticsFor(sourceId: string, diagnostics: Diagnostic[]): Diagnostic[] {
  const sourcePath = `/sources/${escapePathSegment(sourceId)}`;
  return diagnostics.filter(
    (diagnostic) => diagnostic.path === sourcePath || diagnostic.path?.startsWith(`${sourcePath}/`),
  );
}

function resourcePolicyStatus(
  sourceType: string,
  source: SourceSpec,
  diagnostics: Diagnostic[],
): SourceResourcePolicyStatus {
  if (diagnostics.some((diagnostic) => diagnostic.code === DiagnosticCodes.SecurityUrlBlocked)) return "blocked";

  if (sourceType === "geojson") {
    return typeof (source as { data?: unknown }).data === "string" ? "passed" : "not-applicable";
  }

  if (sourceType === "raster" || sourceType === "vector" || sourceType === "pmtiles") return "passed";

  return "not-applicable";
}

function summarizePMTilesRuntimeLoadPlan(plan: PMTilesRuntimeSourcePlan): SourceRuntimeReadinessSummary {
  return {
    status: plan.status,
    sourceLayerIds: plan.sourceLayerIds,
    diagnosticCounts: countDiagnostics(plan.diagnostics),
    requirements: plan.requirements,
  };
}

function countDiagnostics(diagnostics: Diagnostic[]): SourceRuntimeReadinessSummary["diagnosticCounts"] {
  return diagnostics.reduce<SourceRuntimeReadinessSummary["diagnosticCounts"]>(
    (counts, diagnostic) => {
      counts[diagnostic.severity] += 1;
      return counts;
    },
    { error: 0, warning: 0, info: 0 },
  );
}

function unsupportedSourceDiagnostic(sourceId: string, sourceType: string): Diagnostic {
  return {
    severity: "error",
    code: DiagnosticCodes.CapabilityUnsupported,
    message: `Source type "${sourceType}" is not part of the public MapSpec source contract.`,
    path: `/sources/${escapePathSegment(sourceId)}/type`,
    relatedResources: [{ kind: "source", id: sourceId }],
    fix: {
      kind: "manual",
      confidence: "high",
      message:
        "Keep unsupported cloud-native formats as planning evidence until their schema/resource-policy gate lands.",
    },
  };
}
