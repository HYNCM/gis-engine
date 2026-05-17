import type { ErrorObject } from "ajv/dist/ajv.js";
import { DiagnosticCodes, type Diagnostic } from "@gis-engine/engine";

export function toolInputErrorsToDiagnostics(errors: ErrorObject[] | null | undefined, fallbackMessage: string): Diagnostic[] {
  const ajvErrors = errors ?? [];
  if (ajvErrors.length === 0) {
    return [
      {
        severity: "error",
        code: DiagnosticCodes.SpecInvalidType,
        message: fallbackMessage,
        path: "/"
      }
    ];
  }

  return ajvErrors.map((error) => ({
    severity: "error",
    code: toolInputErrorToCode(error),
    message: error.message ?? fallbackMessage,
    path: error.instancePath || "/"
  }));
}

function toolInputErrorToCode(error: ErrorObject): Diagnostic["code"] {
  if (error.keyword === "additionalProperties") return DiagnosticCodes.SpecUnknownField;
  if (error.keyword === "required") return DiagnosticCodes.SpecMissingField;
  if (error.keyword === "const" && error.instancePath.endsWith("/version")) return DiagnosticCodes.SpecInvalidVersion;
  return DiagnosticCodes.SpecInvalidType;
}
