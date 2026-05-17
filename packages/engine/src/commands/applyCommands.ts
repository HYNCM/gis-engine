import { DiagnosticCodes } from "../diagnostics/codes.js";
import { applyJsonPatch, changedPathsForPatch, invertPatch, normalizePatch, validatePatch } from "../spec/patch/index.js";
import { validateSpec } from "../spec/validate.js";
import type { ApplyOptions, CommandResult, Diagnostic, MapCommand, MapSpec } from "../types.js";
import { buildPatch } from "./buildPatch.js";

export interface ApplyCommandsResult {
  spec: MapSpec;
  results: CommandResult[];
  transaction: "atomic" | "best-effort";
  dryRun: boolean;
  committed: boolean;
  rolledBack: boolean;
  traceId: string;
}

export function applyCommands(spec: MapSpec, commands: MapCommand | MapCommand[], options: ApplyOptions = {}): ApplyCommandsResult {
  const commandList = Array.isArray(commands) ? commands : [commands];
  const transaction = options.transaction ?? "atomic";
  const dryRun = options.dryRun ?? false;
  const traceId = options.traceId ?? createTraceId(spec, commandList);
  let currentSpec = structuredClone(spec);
  const results: CommandResult[] = [];
  let committed = false;

  for (const [sequenceId, command] of commandList.entries()) {
    if (command.baseRevision && command.baseRevision !== currentSpec.revision) {
      const failed = failedResult(command, sequenceId, traceId, [
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
      if (transaction === "atomic") return finish(spec, [...results, failed], { transaction, dryRun, traceId, committed: false, rolledBack: true });
      results.push(failed);
      continue;
    }

    const build = buildPatch(command, currentSpec);
    if (build.skipped) {
      const skipped: CommandResult = {
        commandId: command.id,
        sequenceId,
        status: "skipped",
        changedPaths: [],
        diagnostics: [],
        traceId
      };
      if (currentSpec.revision) {
        skipped.baseRevision = currentSpec.revision;
        skipped.nextRevision = currentSpec.revision;
      }
      results.push(skipped);
      continue;
    }

    if (hasErrors(build.diagnostics)) {
      const failed = failedResult(command, sequenceId, traceId, build.diagnostics);
      if (transaction === "atomic") return finish(spec, [...results, failed], { transaction, dryRun, traceId, committed: false, rolledBack: true });
      results.push(failed);
      continue;
    }

    const basePatch = normalizePatch(build.patch);
    const nextSpec = withNextRevision(applyJsonPatch(currentSpec, basePatch));
    const patch = [...basePatch, buildRevisionPatch(currentSpec, nextSpec)];
    const patchDiagnostics = validatePatch(patch);
    if (hasErrors(patchDiagnostics)) {
      const failed = failedResult(command, sequenceId, traceId, patchDiagnostics);
      if (transaction === "atomic") return finish(spec, [...results, failed], { transaction, dryRun, traceId, committed: false, rolledBack: true });
      results.push(failed);
      continue;
    }

    const inversePatch = invertPatch(currentSpec, patch);
    const validation = validateSpec(nextSpec);

    if (!validation.valid) {
      const failed = failedResult(command, sequenceId, traceId, validation.diagnostics);
      if (transaction === "atomic") return finish(spec, [...results, failed], { transaction, dryRun, traceId, committed: false, rolledBack: true });
      results.push(failed);
      continue;
    }

    const result: CommandResult = {
      commandId: command.id,
      sequenceId,
      status: "applied",
      changedPaths: changedPathsForPatch(patch),
      patch,
      inversePatch,
      diagnostics: [],
      traceId
    };
    if (currentSpec.revision) result.baseRevision = currentSpec.revision;
    if (nextSpec.revision) result.nextRevision = nextSpec.revision;
    results.push(result);
    if (!command.dryRun) {
      currentSpec = nextSpec;
      if (!dryRun) committed = true;
    }
  }

  return finish(dryRun ? spec : currentSpec, results, { transaction, dryRun, traceId, committed, rolledBack: false });
}

function failedResult(command: MapCommand, sequenceId: number, traceId: string, diagnostics: Diagnostic[]): CommandResult {
  const result: CommandResult = {
    commandId: command.id,
    sequenceId,
    status: "failed",
    changedPaths: [],
    diagnostics,
    traceId
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

function buildRevisionPatch(currentSpec: MapSpec, nextSpec: MapSpec) {
  return currentSpec.revision
    ? { op: "replace" as const, path: "/revision", value: nextSpec.revision }
    : { op: "add" as const, path: "/revision", value: nextSpec.revision };
}

function finish(
  spec: MapSpec,
  results: CommandResult[],
  meta: Omit<ApplyCommandsResult, "spec" | "results">
): ApplyCommandsResult {
  return { spec, results, ...meta };
}

function createTraceId(spec: MapSpec, commands: MapCommand[]): string {
  const specId = sanitizeTracePart(spec.id ?? "map");
  const revision = sanitizeTracePart(spec.revision ?? "0");
  const commandPart = commands.length > 0 ? commands.map((command) => sanitizeTracePart(command.id)).join(".") : "empty";
  return `apply.${specId}.r${revision}.${commandPart}`;
}

function sanitizeTracePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}
