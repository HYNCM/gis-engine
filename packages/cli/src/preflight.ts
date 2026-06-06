import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createPMTilesRuntimeLoadPlan,
  type Diagnostic,
  DiagnosticCodes,
  type MapSpec,
  type PMTilesArchiveMetadata,
  type PMTilesRuntimeLoadPlan,
  type ValidationReport,
  validateSpec,
} from "@gis-engine/engine";

export interface PreflightOptions {
  filePath: string;
  requireArchiveMetadata?: boolean;
  pmtilesMetadata?: string[];
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
  inputs: {
    requireArchiveMetadata: boolean;
    pmtilesMetadataSourceIds: string[];
  };
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
  const metadata = readPMTilesMetadataInputs(options.pmtilesMetadata ?? []);

  if (!metadata.ok) {
    return blockedResult(filePath, metadata.diagnostics, {
      requireArchiveMetadata: options.requireArchiveMetadata === true,
      pmtilesMetadataSourceIds: metadata.sourceIds,
    });
  }

  const parsed = readMapSpecJson(filePath);

  if (!parsed.ok) {
    return blockedResult(filePath, [parsed.diagnostic], {
      requireArchiveMetadata: options.requireArchiveMetadata === true,
      pmtilesMetadataSourceIds: metadata.sourceIds,
    });
  }

  const validation = validateSpec(parsed.value);
  const pmtiles = isMapSpecLike(parsed.value)
    ? createPMTilesRuntimeLoadPlan(parsed.value, {
        archiveMetadata: metadata.archiveMetadata,
        requireArchiveMetadata: options.requireArchiveMetadata === true,
      })
    : emptyPMTilesRuntimeLoadPlan();
  const diagnostics = [...validation.diagnostics, ...pmtiles.diagnostics];
  const blocked = !validation.valid || pmtiles.status === "blocked";
  const metadataRequired = options.requireArchiveMetadata === true && pmtiles.status === "metadata-required";
  const status = blocked ? "blocked" : pmtiles.status === "metadata-required" ? "metadata-required" : "ready";

  return {
    ok: !blocked && !metadataRequired,
    status,
    filePath,
    mode: "mapspec-preflight",
    inputs: {
      requireArchiveMetadata: options.requireArchiveMetadata === true,
      pmtilesMetadataSourceIds: metadata.sourceIds,
    },
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
    `  Metadata:   ${result.inputs.requireArchiveMetadata ? "required" : "optional"} (${result.inputs.pmtilesMetadataSourceIds.length} provided)`,
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

function blockedResult(
  filePath: string,
  diagnostics: Diagnostic[],
  inputs: PreflightResult["inputs"] = { requireArchiveMetadata: false, pmtilesMetadataSourceIds: [] },
): PreflightResult {
  return {
    ok: false,
    status: "blocked",
    filePath,
    mode: "mapspec-preflight",
    inputs,
    validation: {
      valid: false,
      stats: { sourceCount: 0, layerCount: 0, visibleLayerCount: 0 },
      diagnosticCounts: countDiagnostics(diagnostics),
    },
    pmtiles: emptyPMTilesRuntimeLoadPlan(),
    diagnostics,
  };
}

function readPMTilesMetadataInputs(inputs: string[]): {
  ok: boolean;
  sourceIds: string[];
  archiveMetadata: Record<string, PMTilesArchiveMetadata | undefined>;
  diagnostics: Diagnostic[];
} {
  const archiveMetadata: Record<string, PMTilesArchiveMetadata | undefined> = {};
  const diagnostics: Diagnostic[] = [];
  const sourceIds: string[] = [];

  for (const input of inputs) {
    const separator = input.indexOf("=");
    const sourceId = separator >= 0 ? input.slice(0, separator).trim() : "";
    const metadataPath = separator >= 0 ? input.slice(separator + 1).trim() : "";
    const diagnosticPath = sourceId ? `/pmtilesMetadata/${pathSegment(sourceId)}` : "/pmtilesMetadata";

    if (!sourceId || !metadataPath) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SchemaInvalid,
        message: 'PMTiles metadata input must use "source-id=metadata.json".',
        path: diagnosticPath,
      });
      continue;
    }

    sourceIds.push(sourceId);
    const resolvedPath = resolve(metadataPath);
    const parsed = readJsonFile(resolvedPath, diagnosticPath);
    if (!parsed.ok) {
      diagnostics.push(parsed.diagnostic);
      continue;
    }

    if (!isPMTilesArchiveMetadata(parsed.value)) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.SchemaInvalid,
        message:
          "PMTiles metadata JSON must include specVersion, archiveBytes, rootDirectoryOffset, rootDirectoryLength, hasVectorTiles, and hasRasterTiles.",
        path: diagnosticPath,
        relatedResources: [
          { kind: "source", id: sourceId },
          { kind: "schema", id: resolvedPath },
        ],
      });
      continue;
    }

    archiveMetadata[sourceId] = parsed.value;
  }

  return {
    ok: diagnostics.length === 0,
    sourceIds,
    archiveMetadata,
    diagnostics,
  };
}

function readJsonFile(
  filePath: string,
  diagnosticPath: string,
): { ok: true; value: unknown } | { ok: false; diagnostic: Diagnostic } {
  try {
    return { ok: true, value: JSON.parse(readFileSync(filePath, "utf-8")) };
  } catch (error) {
    return {
      ok: false,
      diagnostic: {
        severity: "error",
        code: DiagnosticCodes.SpecInvalidType,
        message: `Could not read or parse JSON: ${error instanceof Error ? error.message : String(error)}`,
        path: diagnosticPath,
        relatedResources: [{ kind: "schema", id: filePath }],
      },
    };
  }
}

function isPMTilesArchiveMetadata(value: unknown): value is PMTilesArchiveMetadata {
  if (!value || typeof value !== "object") return false;
  const metadata = value as Partial<PMTilesArchiveMetadata>;
  return (
    (metadata.specVersion === 3 || metadata.specVersion === "3") &&
    isInteger(metadata.archiveBytes) &&
    isInteger(metadata.rootDirectoryOffset) &&
    isInteger(metadata.rootDirectoryLength) &&
    typeof metadata.hasVectorTiles === "boolean" &&
    typeof metadata.hasRasterTiles === "boolean" &&
    (metadata.tileType === undefined || metadata.tileType === "vector" || metadata.tileType === "raster") &&
    (metadata.minZoom === undefined || isInteger(metadata.minZoom)) &&
    (metadata.maxZoom === undefined || isInteger(metadata.maxZoom)) &&
    (metadata.bounds === undefined || isBounds(metadata.bounds))
  );
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBounds(value: unknown): value is [number, number, number, number] {
  return Array.isArray(value) && value.length === 4 && value.every(isFiniteNumber);
}

function pathSegment(value: string): string {
  return encodeURIComponent(value).replace(/%2F/gi, "~1");
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
