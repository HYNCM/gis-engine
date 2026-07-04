import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  type Diagnostic,
  DiagnosticCodes,
  type MapSpec,
  type ValidationReport,
  validateSpec,
} from "@gis-engine/engine";

export interface LintOptions {
  filePath: string;
}

export interface LintDiagnosticCounts {
  error: number;
  warning: number;
  info: number;
}

export interface LintResult {
  ok: boolean;
  filePath: string;
  mode: "mapspec-lint";
  validation: {
    valid: boolean;
    stats: ValidationReport["stats"];
    diagnosticCounts: LintDiagnosticCounts;
  };
  diagnostics: Diagnostic[];
}

/**
 * Validate a MapSpec JSON file and return diagnostics.
 *
 * This is a lightweight alternative to preflight — it only performs
 * schema validation and semantic checks, without PMTiles runtime
 * load plan or source readiness analysis.
 */
export function lintMapSpec(options: LintOptions): LintResult {
  const filePath = resolve(options.filePath);

  const parsed = readMapSpecJson(filePath);
  if (!parsed.ok) {
    return {
      ok: false,
      filePath,
      mode: "mapspec-lint",
      validation: {
        valid: false,
        stats: { sourceCount: 0, layerCount: 0, visibleLayerCount: 0 },
        diagnosticCounts: { error: 1, warning: 0, info: 0 },
      },
      diagnostics: [parsed.diagnostic],
    };
  }

  const validation = validateSpec(parsed.value);
  const diagnosticCounts = countDiagnostics(validation.diagnostics);

  return {
    ok: validation.valid,
    filePath,
    mode: "mapspec-lint",
    validation: {
      valid: validation.valid,
      stats: validation.stats,
      diagnosticCounts,
    },
    diagnostics: validation.diagnostics,
  };
}

/**
 * Format a LintResult as human-readable text.
 */
export function formatLintText(result: LintResult): string {
  const lines: string[] = [];

  lines.push(`GIS Engine MapSpec Lint`);
  lines.push(`  File:  ${result.filePath}`);
  lines.push(`  Valid: ${result.validation.valid}`);
  lines.push(
    `  Stats: ${result.validation.stats.sourceCount} source(s), ${result.validation.stats.layerCount} layer(s), ${result.validation.stats.visibleLayerCount} visible`,
  );
  lines.push(
    `  Diagnostics: ${result.validation.diagnosticCounts.error} error(s), ${result.validation.diagnosticCounts.warning} warning(s), ${result.validation.diagnosticCounts.info} info`,
  );
  lines.push("");

  if (result.diagnostics.length === 0) {
    lines.push("No diagnostics.");
  } else {
    for (const diagnostic of result.diagnostics) {
      const icon = diagnostic.severity === "error" ? "x" : diagnostic.severity === "warning" ? "!" : "i";
      const pathSuffix = diagnostic.path ? ` at ${diagnostic.path}` : "";
      lines.push(`  [${icon}] ${diagnostic.code}${pathSuffix}: ${diagnostic.message}`);
      if (diagnostic.fix) {
        lines.push(`      fix: ${diagnostic.fix.message}`);
      }
    }
  }

  lines.push("");
  lines.push(result.ok ? "Lint passed." : "Lint failed.");
  lines.push("");

  return lines.join("\n");
}

function countDiagnostics(diagnostics: Diagnostic[]): LintDiagnosticCounts {
  return diagnostics.reduce<LintDiagnosticCounts>(
    (counts, diagnostic) => {
      counts[diagnostic.severity] += 1;
      return counts;
    },
    { error: 0, warning: 0, info: 0 },
  );
}

function readMapSpecJson(filePath: string): { ok: true; value: MapSpec } | { ok: false; diagnostic: Diagnostic } {
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    return {
      ok: false,
      diagnostic: {
        severity: "error",
        code: DiagnosticCodes.SpecInvalidType,
        message: `Cannot read file: ${filePath}`,
        path: "/",
      },
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      diagnostic: {
        severity: "error",
        code: DiagnosticCodes.SpecInvalidType,
        message: `File is not valid JSON: ${filePath}`,
        path: "/",
      },
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      ok: false,
      diagnostic: {
        severity: "error",
        code: DiagnosticCodes.SpecInvalidType,
        message: "MapSpec must be a JSON object.",
        path: "/",
      },
    };
  }

  return { ok: true, value: parsed as MapSpec };
}
