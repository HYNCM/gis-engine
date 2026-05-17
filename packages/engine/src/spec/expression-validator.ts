import { DiagnosticCodes } from "../diagnostics/codes.js";
import type { Diagnostic } from "../types.js";

export type ExprType = "unknown" | "null" | "boolean" | "number" | "string" | "color" | "array" | "object";

export interface ExpressionValidationOptions {
  knownProperties?: Iterable<string>;
}

interface ExpressionInference {
  type: ExprType;
  diagnostics: Diagnostic[];
}

interface NormalizedExpressionOptions {
  knownProperties: ReadonlySet<string>;
}

export function validateExpression(expr: unknown, path: string, options: ExpressionValidationOptions = {}): Diagnostic[] {
  return inferExpression(expr, path, normalizeOptions(options)).diagnostics;
}

function inferExpression(expr: unknown, path: string, options: NormalizedExpressionOptions): ExpressionInference {
  if (!Array.isArray(expr)) {
    return { type: inferLiteralType(expr), diagnostics: [] };
  }

  if (expr.length === 0) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: "Expression array cannot be empty.",
          path
        }
      ]
    };
  }

  const operator = expr[0];
  if (typeof operator !== "string") {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionUnknownOperator,
          message: `Expression operator must be a string, found ${typeof operator}.`,
          path: `${path}/0`
        }
      ]
    };
  }

  if (operator === "match") {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.CapabilityUnsupported,
          message: "\"match\" expressions are outside the v0.1 supported expression matrix.",
          path: `${path}/0`
        }
      ]
    };
  }

  switch (operator) {
    case "literal":
      return inferLiteralExpression(expr, path);
    case "get":
      return inferGetExpression(expr, path, options);
    case "step":
      return inferStepExpression(expr, path, options);
    case "interpolate":
      return inferInterpolateExpression(expr, path, options);
    default:
      return {
        type: "unknown",
        diagnostics: [
          {
            severity: "error",
            code: DiagnosticCodes.ExpressionUnknownOperator,
            message: `Unknown expression operator "${operator}".`,
            path: `${path}/0`
          }
        ]
      };
  }
}

function inferLiteralExpression(expr: unknown[], path: string): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "literal", found ${expr.length - 1}.`,
          path
        }
      ]
    };
  }

  return { type: inferLiteralType(expr[1]), diagnostics: [] };
}

function inferGetExpression(expr: unknown[], path: string, options: NormalizedExpressionOptions): ExpressionInference {
  const diagnostics: Diagnostic[] = [];

  if (expr.length < 2 || expr.length > 3) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 or 2 arguments for "get", found ${expr.length - 1}.`,
          path
        }
      ]
    };
  }

  const propertyName = expr[1];
  if (typeof propertyName !== "string") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: "\"get\" property name must be a string.",
      path: `${path}/1`
    });
  } else if (options.knownProperties.size > 0 && !options.knownProperties.has(propertyName)) {
    diagnostics.push({
      severity: "warning",
      code: DiagnosticCodes.ExpressionPropertyUnknown,
      message: `Property "${propertyName}" is not present in the known feature property set.`,
      path: `${path}/1`,
      fix: {
        kind: "manual",
        confidence: "low",
        message: "Verify the source feature property name or provide a sample/property schema."
      }
    });
  }

  return { type: "unknown", diagnostics };
}

function inferStepExpression(expr: unknown[], path: string, options: NormalizedExpressionOptions): ExpressionInference {
  if (expr.length < 5 || expr.length % 2 === 0) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: "Expected \"step\" syntax: [\"step\", input, output0, stop1, output1, ...].",
          path
        }
      ]
    };
  }

  const diagnostics: Diagnostic[] = [];
  diagnostics.push(...inferExpression(expr[1], `${path}/1`, options).diagnostics);

  for (let stopIndex = 3; stopIndex < expr.length; stopIndex += 2) {
    if (typeof expr[stopIndex] !== "number") {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
        message: "\"step\" stop inputs must be numbers.",
        path: `${path}/${stopIndex}`
      });
    }
  }

  const outputs = collectOutputTypes(expr, path, options, 2);
  diagnostics.push(...outputs.diagnostics);

  return { type: outputs.type, diagnostics };
}

function inferInterpolateExpression(expr: unknown[], path: string, options: NormalizedExpressionOptions): ExpressionInference {
  if (expr.length < 7 || expr.length % 2 === 0) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: "Expected \"interpolate\" syntax: [\"interpolate\", [\"linear\"], input, stop1, output1, stop2, output2, ...].",
          path
        }
      ]
    };
  }

  const diagnostics: Diagnostic[] = [];
  if (!isLinearInterpolation(expr[1])) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.CapabilityUnsupported,
      message: "Only linear interpolate expressions are supported in v0.1.",
      path: `${path}/1`
    });
  }

  diagnostics.push(...inferExpression(expr[2], `${path}/2`, options).diagnostics);

  for (let stopIndex = 3; stopIndex < expr.length; stopIndex += 2) {
    if (typeof expr[stopIndex] !== "number") {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
        message: "\"interpolate\" stop inputs must be numbers.",
        path: `${path}/${stopIndex}`
      });
    }
  }

  const outputs = collectOutputTypes(expr, path, options, 4);
  diagnostics.push(...outputs.diagnostics);

  if (outputs.type !== "unknown" && outputs.type !== "number" && outputs.type !== "color") {
    diagnostics.push({
      severity: "error",
      code: outputs.type === "string" ? DiagnosticCodes.ExpressionInvalidColor : DiagnosticCodes.ExpressionTypeMismatch,
      message: "\"interpolate\" outputs must be numbers or valid color strings.",
      path
    });
  }

  return { type: outputs.type, diagnostics };
}

function collectOutputTypes(expr: unknown[], path: string, options: NormalizedExpressionOptions, firstOutputIndex: number): ExpressionInference {
  const diagnostics: Diagnostic[] = [];
  let expectedType: ExprType | undefined;

  for (let outputIndex = firstOutputIndex; outputIndex < expr.length; outputIndex += 2) {
    const output = inferExpression(expr[outputIndex], `${path}/${outputIndex}`, options);
    diagnostics.push(...output.diagnostics);

    if (output.type === "unknown") continue;
    if (expectedType === undefined) {
      expectedType = output.type;
      continue;
    }

    if (expectedType !== output.type) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
        message: `Expression branch outputs must use a consistent type. Expected ${expectedType}, found ${output.type}.`,
        path: `${path}/${outputIndex}`
      });
    }
  }

  return { type: expectedType ?? "unknown", diagnostics };
}

function inferLiteralType(value: unknown): ExprType {
  if (value === null) return "null";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string") return isColorString(value) ? "color" : "string";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return "unknown";
}

function isLinearInterpolation(value: unknown): boolean {
  return value === "linear" || (Array.isArray(value) && value.length === 1 && value[0] === "linear");
}

function isColorString(value: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) || /^rgba?\(/i.test(value);
}

function normalizeOptions(options: ExpressionValidationOptions): NormalizedExpressionOptions {
  return {
    knownProperties: new Set(options.knownProperties ?? [])
  };
}
