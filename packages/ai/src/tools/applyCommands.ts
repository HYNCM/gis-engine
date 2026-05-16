import { Ajv } from "ajv/dist/ajv.js";
import type { ErrorObject } from "ajv/dist/ajv.js";
import {
  ApplyCommandsToolInputSchema,
  DiagnosticCodes,
  applyCommands,
  type ApplyCommandsResult,
  type Diagnostic,
  type MapCommand,
  type MapSpec
} from "@gis-engine/engine";

export interface ApplyCommandsToolInput {
  spec: MapSpec;
  commands: MapCommand[];
  dryRun?: boolean;
  transaction?: "atomic" | "best-effort";
}

export type ApplyCommandsToolResult =
  | { ok: true; result: ApplyCommandsResult; diagnostics: [] }
  | { ok: false; diagnostics: Diagnostic[] };

const ajv = new Ajv({ allErrors: true, strict: false });
const validateInput = ajv.compile(ApplyCommandsToolInputSchema);

export function applyCommandsTool(input: unknown): ApplyCommandsToolResult {
  if (!validateInput(input)) {
    return {
      ok: false,
      diagnostics: (validateInput.errors ?? []).map((error) => ({
        severity: "error",
        code: toolInputErrorToCode(error),
        message: error.message ?? "Invalid applyCommands tool input.",
        path: error.instancePath || "/"
      }))
    };
  }

  const typedInput = input as ApplyCommandsToolInput;
  return {
    ok: true,
    result: applyCommands(typedInput.spec, typedInput.commands, {
      dryRun: typedInput.dryRun ?? false,
      ...(typedInput.transaction ? { transaction: typedInput.transaction } : {})
    }),
    diagnostics: []
  };
}

function toolInputErrorToCode(error: ErrorObject): Diagnostic["code"] {
  if (error.keyword === "additionalProperties") return DiagnosticCodes.SpecUnknownField;
  if (error.keyword === "required") return DiagnosticCodes.SpecMissingField;
  if (error.keyword === "const" && error.instancePath.endsWith("/version")) return DiagnosticCodes.SpecInvalidVersion;
  return DiagnosticCodes.SpecInvalidType;
}
