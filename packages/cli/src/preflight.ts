import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createPMTilesRuntimeLoadPlan,
  type Diagnostic,
  DiagnosticCodes,
  type MapSpec,
  type PMTilesRuntimeLoadPlan,
  type ValidationReport,
  validateSpec,
} from "@gis-engine/engine";

export interface PreflightOptions {
  filePath: string;
}

export interface PreflightDiagnosticCounts {
  error: number;
  warning: number;
  info: number;
}

export interface PreflightResult {
  ok: boolean;
  status: "ready" | "metadata-required" | "blocked";
  filePath: string;
  mode: "mapspec-preflight";
  validation: {
    valid: boolean;
    stats: ValidationReport["stats"];
    diagnosticCounts: PreflightDiagnosticCounts;
  };
  pmtiles: PMTilesRuntimeLoadPlan;
  diagnostics: Diagnostic[];
}

export function preflightMapSpec(options: PreflightOptions): PreflightResult {
  const filePath = resolve(options.filePath);
  const parsed = readMapSpecJson(filePath);

  if (!parsed.ok) {
    return blockedResult(filePath, [parsed.diagnostic]);
  }

  const validation = validateSpec(parsed.value);
  const pmtiles = isMapSpecLike(parsed.value)
    ? createPMTilesRuntimeLoadPlan(parsed.value)
    : emptyPMTilesRuntimeLoadPlan();
  const diagnostics = [...validation.diagnostics, ...pmtiles.diagnostics];
  const blocked = !validation.valid || pmtiles.status === "blocked";
  const status = blocked ? "blocked" : pmtiles.status === "metadata-required" ? "metadata-required" : "ready";

  return {
    ok: !blocked,
    status,
    filePath,
    mode: "mapspec-preflight",
    validation: {
      valid: validation.valid,
      stats: validation.stats,
      diagnosticCounts: countDiagnostics(validation.diagnostics),
    },
    pmtiles,
    diagnostics,
  };
}

export function formatPreflightText(result: PreflightResult): string {
  const lines = [
    "MapSpec preflight",
    `  File:       ${result.filePath}`,
    `  Status:     ${result.status}`,
    `  Valid:      ${result.validation.valid}`,
    `  Sources:    ${result.validation.stats.sourceCount}`,
    `  Layers:     ${result.validation.stats.layerCount}`,
    `  PMTiles:    ${result.pmtiles.status} (${result.pmtiles.summary.pmtilesSourceCount} sources)`,
  ];

  const counts = countDiagnostics(result.diagnostics);
  lines.push(`  Diagnostics: ${counts.error} errors, ${counts.warning} warnings, ${counts.info} info`);

  for (const diagnostic of result.diagnostics) {
    lines.push(`  - [${diagnostic.severity}] ${diagnostic.code} ${diagnostic.path ?? "/"}: ${diagnostic.message}`);
  }

  return `${lines.join("\n")}\n`;
}

function readMapSpecJson(filePath: string): { ok: true; value: unknown } | { ok: false; diagnostic: Diagnostic } {
  try {
    return { ok: true, value: JSON.parse(readFileSync(filePath, "utf-8")) };
  } catch (error) {
    return {
      ok: false,
      diagnostic: {
        severity: "error",
        code: DiagnosticCodes.SpecInvalidType,
        message: `Could not read or parse MapSpec JSON: ${error instanceof Error ? error.message : String(error)}`,
        path: "/",
        relatedResources: [{ kind: "schema", id: filePath }],
      },
    };
  }
}

function blockedResult(filePath: string, diagnostics: Diagnostic[]): PreflightResult {
  return {
    ok: false,
    status: "blocked",
    filePath,
    mode: "mapspec-preflight",
    validation: {
      valid: false,
      stats: { sourceCount: 0, layerCount: 0, visibleLayerCount: 0 },
      diagnosticCounts: countDiagnostics(diagnostics),
    },
    pmtiles: emptyPMTilesRuntimeLoadPlan(),
    diagnostics,
  };
}

function emptyPMTilesRuntimeLoadPlan(): PMTilesRuntimeLoadPlan {
  return {
    status: "not-applicable",
    sources: [],
    diagnostics: [],
    summary: {
      pmtilesSourceCount: 0,
      readySourceCount: 0,
      metadataRequiredSourceCount: 0,
      blockedSourceCount: 0,
    },
  };
}

function countDiagnostics(diagnostics: Diagnostic[]): PreflightDiagnosticCounts {
  return diagnostics.reduce<PreflightDiagnosticCounts>(
    (counts, diagnostic) => {
      counts[diagnostic.severity] += 1;
      return counts;
    },
    { error: 0, warning: 0, info: 0 },
  );
}

function isMapSpecLike(value: unknown): value is MapSpec {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MapSpec>;
  return (
    candidate.version === "0.1" &&
    Boolean(candidate.view) &&
    Boolean(candidate.sources) &&
    Array.isArray(candidate.layers)
  );
}
