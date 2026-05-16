import { DiagnosticCodes } from "../../diagnostics/codes.js";
import type { Diagnostic, JsonPatchOperation } from "../../types.js";

export function validatePatch(patch: JsonPatchOperation[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const [index, operation] of patch.entries()) {
    if (!operation.path.startsWith("/") && operation.path !== "") {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.CommandInvalidPatch,
        message: `Patch operation ${index} path must be a JSON Pointer.`,
        path: `/patch/${index}/path`
      });
    }

    if ((operation.op === "add" || operation.op === "replace") && !("value" in operation)) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.CommandInvalidPatch,
        message: `Patch operation ${index} requires a value.`,
        path: `/patch/${index}/value`
      });
    }
  }

  return diagnostics;
}
