import { DiagnosticCodes } from "../diagnostics/codes.js";
import { applyJsonPatch, changedPathsForPatch, invertPatch, normalizePatch, validatePatch } from "../spec/patch/index.js";
import { validateSpec } from "../spec/validate.js";
import type { ApplyOptions, CommandResult, Diagnostic, MapCommand, MapSpec } from "../types.js";
import { buildPatch } from "./buildPatch.js";

export interface ApplyCommandsResult {
  spec: MapSpec;
  results: CommandResult[];
}

export function applyCommands(spec: MapSpec, commands: MapCommand | MapCommand[], options: ApplyOptions = {}): ApplyCommandsResult {
  const commandList = Array.isArray(commands) ? commands : [commands];
  const transaction = options.transaction ?? "atomic";
  const dryRun = options.dryRun ?? false;
  let currentSpec = structuredClone(spec);
  const results: CommandResult[] = [];

  for (const command of commandList) {
    if (command.baseRevision && command.baseRevision !== currentSpec.revision) {
      const failed = failedResult(command, [
        {
          severity: "error",
          code: DiagnosticCodes.ConflictBaseRevision,
          message: `Command baseRevision "${command.baseRevision}" does not match current revision "${currentSpec.revision ?? "none"}".`,
          path: "/revision",
          fix: {
            kind: "manual",
            confidence: "medium",
            message: "Reload the latest MapSpec, rebase the command, then retry."
          }
        }
      ]);
      if (transaction === "atomic") return { spec, results: [...results, failed] };
      results.push(failed);
      continue;
    }

    const build = buildPatch(command, currentSpec);
    if (build.skipped) {
      const skipped: CommandResult = {
        commandId: command.id,
        status: "skipped",
        changedPaths: [],
        diagnostics: []
      };
      if (currentSpec.revision) {
        skipped.baseRevision = currentSpec.revision;
        skipped.nextRevision = currentSpec.revision;
      }
      results.push(skipped);
      continue;
    }

    if (hasErrors(build.diagnostics)) {
      const failed = failedResult(command, build.diagnostics);
      if (transaction === "atomic") return { spec, results: [...results, failed] };
      results.push(failed);
      continue;
    }

    const patch = normalizePatch(build.patch);
    const patchDiagnostics = validatePatch(patch);
    if (hasErrors(patchDiagnostics)) {
      const failed = failedResult(command, patchDiagnostics);
      if (transaction === "atomic") return { spec, results: [...results, failed] };
      results.push(failed);
      continue;
    }

    const inversePatch = invertPatch(currentSpec, patch);
    const nextSpec = withNextRevision(applyJsonPatch(currentSpec, patch));
    const validation = validateSpec(nextSpec);

    if (!validation.valid) {
      const failed = failedResult(command, validation.diagnostics);
      if (transaction === "atomic") return { spec, results: [...results, failed] };
      results.push(failed);
      continue;
    }

    const result: CommandResult = {
      commandId: command.id,
      status: "applied",
      changedPaths: changedPathsForPatch(patch),
      patch,
      inversePatch,
      diagnostics: []
    };
    if (currentSpec.revision) result.baseRevision = currentSpec.revision;
    if (nextSpec.revision) result.nextRevision = nextSpec.revision;
    results.push(result);
    if (!dryRun && !command.dryRun) currentSpec = nextSpec;
  }

  return { spec: dryRun ? spec : currentSpec, results };
}

function failedResult(command: MapCommand, diagnostics: Diagnostic[]): CommandResult {
  const result: CommandResult = {
    commandId: command.id,
    status: "failed",
    changedPaths: [],
    diagnostics
  };
  if (command.baseRevision) result.baseRevision = command.baseRevision;
  return result;
}

function hasErrors(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

function withNextRevision(spec: MapSpec): MapSpec {
  const current = Number.parseInt(spec.revision ?? "0", 10);
  const next = Number.isSafeInteger(current) && current >= 0 ? String(current + 1) : "1";
  return { ...spec, revision: next };
}
