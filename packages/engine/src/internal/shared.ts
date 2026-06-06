import type { ErrorObject } from "ajv/dist/ajv.js";
import { DiagnosticCodes } from "../diagnostics/codes.js";
import type { Diagnostic, SuggestedFix } from "../types.js";

/**
 * Map an Ajv validation error to a structured Diagnostic code.
 */
export function toolInputErrorToCode(error: ErrorObject): Diagnostic["code"] {
  if (error.keyword === "additionalProperties") return DiagnosticCodes.SpecUnknownField;
  if (error.keyword === "required") return DiagnosticCodes.SpecMissingField;
  if (error.keyword === "const" && error.instancePath.endsWith("/version")) return DiagnosticCodes.SpecInvalidVersion;
  return DiagnosticCodes.SpecInvalidType;
}

/**
 * Safely read a non-empty string property from an unknown input object.
 */
export function readString(input: unknown, key: string): string | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const value = (input as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * Build a manual-fix SuggestedFix with the given message and confidence.
 */
export function manualFix(message: string, confidence: SuggestedFix["confidence"]): SuggestedFix {
  return {
    kind: "manual",
    confidence,
    message,
  };
}
