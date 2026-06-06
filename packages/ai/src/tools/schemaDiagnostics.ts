import { type Diagnostic, DiagnosticCodes, toolInputErrorToCode } from "@gis-engine/engine";
import type { ErrorObject } from "ajv/dist/ajv.js";

export function toolInputErrorsToDiagnostics(
  errors: ErrorObject[] | null | undefined,
  fallbackMessage: string,
): Diagnostic[] {
  const ajvErrors = errors ?? [];
  if (ajvErrors.length === 0) {
    return [
      {
        severity: "error",
        code: DiagnosticCodes.SpecInvalidType,
        message: fallbackMessage,
        path: "/",
      },
    ];
  }

  return ajvErrors.map((error) => ({
    severity: "error",
    code: toolInputErrorToCode(error),
    message: error.message ?? fallbackMessage,
    path: error.instancePath || "/",
  }));
}
