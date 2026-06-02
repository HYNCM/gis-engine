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

export function validateFilterExpression(filter: unknown, path: string, options: ExpressionValidationOptions = {}): Diagnostic[] {
  const inference = inferExpression(filter, path, normalizeOptions(options));
  const diagnostics = [...inference.diagnostics];
  if (!diagnostics.some((diagnostic) => diagnostic.severity === "error") && inference.type !== "boolean") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: "Layer filter expressions must evaluate to boolean values.",
      path
    });
  }
  return diagnostics;
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

  switch (operator) {
    case "literal":
      return inferLiteralExpression(expr, path);
    case "get":
      return inferGetExpression(expr, path, options);
    case "case":
      return inferCaseExpression(expr, path, options);
    case "match":
      return inferMatchExpression(expr, path, options);
    case "step":
      return inferStepExpression(expr, path, options);
    case "interpolate":
      return inferInterpolateExpression(expr, path, options);
    case "zoom":
      return inferZoomExpression(expr, path);
    case "has":
      return inferHasExpression(expr, path, options);
    case "all":
    case "any":
      return inferLogicalExpression(expr, path, options);
    case "!":
      return inferNotExpression(expr, path, options);
    case "==":
    case "!=":
    case ">":
    case "<":
    case ">=":
    case "<=":
      return inferComparisonExpression(expr, path, options);
    case "in":
      return inferMembershipExpression(expr, path, options);
    case "to-number":
      return inferToNumberExpression(expr, path, options);
    case "to-string":
      return inferToStringExpression(expr, path, options);
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

function inferCaseExpression(expr: unknown[], path: string, options: NormalizedExpressionOptions): ExpressionInference {
  if (expr.length < 4 || expr.length % 2 !== 0) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: "Expected \"case\" syntax: [\"case\", condition1, output1, ..., fallback].",
          path
        }
      ]
    };
  }

  const diagnostics: Diagnostic[] = [];
  for (let conditionIndex = 1; conditionIndex < expr.length - 1; conditionIndex += 2) {
    const condition = inferExpression(expr[conditionIndex], `${path}/${conditionIndex}`, options);
    diagnostics.push(...condition.diagnostics);
    if (condition.type !== "unknown" && condition.type !== "boolean") {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
        message: "\"case\" conditions must evaluate to boolean values.",
        path: `${path}/${conditionIndex}`
      });
    }
  }

  const outputs = collectOutputTypesAtIndexes(expr, path, options, outputIndexesForCase(expr.length));
  diagnostics.push(...outputs.diagnostics);

  return { type: outputs.type, diagnostics };
}

function inferMatchExpression(expr: unknown[], path: string, options: NormalizedExpressionOptions): ExpressionInference {
  if (expr.length < 5 || expr.length % 2 !== 1) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: "Expected \"match\" syntax: [\"match\", input, label1, output1, ..., fallback].",
          path
        }
      ]
    };
  }

  const diagnostics: Diagnostic[] = [];
  diagnostics.push(...inferExpression(expr[1], `${path}/1`, options).diagnostics);

  for (let labelIndex = 2; labelIndex < expr.length - 1; labelIndex += 2) {
    if (!isMatchLabel(expr[labelIndex])) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
        message: "\"match\" labels must be strings, numbers, booleans, or arrays of those literal values.",
        path: `${path}/${labelIndex}`
      });
    }
  }

  const outputs = collectOutputTypesAtIndexes(expr, path, options, outputIndexesForMatch(expr.length));
  diagnostics.push(...outputs.diagnostics);

  return { type: outputs.type, diagnostics };
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

function inferZoomExpression(expr: unknown[], path: string): ExpressionInference {
  if (expr.length !== 1) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 0 arguments for "zoom", found ${expr.length - 1}.`,
          path
        }
      ]
    };
  }

  return { type: "number", diagnostics: [] };
}

function inferHasExpression(expr: unknown[], path: string, options: NormalizedExpressionOptions): ExpressionInference {
  if (expr.length < 2 || expr.length > 3) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 or 2 arguments for "has", found ${expr.length - 1}.`,
          path
        }
      ]
    };
  }

  const diagnostics: Diagnostic[] = [];
  const propertyName = expr[1];
  if (typeof propertyName !== "string") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: "\"has\" property name must be a string.",
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
  if (expr.length === 3) diagnostics.push(...inferExpression(expr[2], `${path}/2`, options).diagnostics);
  return { type: "boolean", diagnostics };
}

function inferLogicalExpression(expr: unknown[], path: string, options: NormalizedExpressionOptions): ExpressionInference {
  const operator = String(expr[0]);
  if (expr.length < 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected at least 1 argument for "${operator}".`,
          path
        }
      ]
    };
  }

  const diagnostics: Diagnostic[] = [];
  for (let argumentIndex = 1; argumentIndex < expr.length; argumentIndex += 1) {
    const argument = inferExpression(expr[argumentIndex], `${path}/${argumentIndex}`, options);
    diagnostics.push(...argument.diagnostics);
    if (argument.type !== "unknown" && argument.type !== "boolean") {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
        message: `"${operator}" arguments must evaluate to boolean values.`,
        path: `${path}/${argumentIndex}`
      });
    }
  }
  return { type: "boolean", diagnostics };
}

function inferNotExpression(expr: unknown[], path: string, options: NormalizedExpressionOptions): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "!", found ${expr.length - 1}.`,
          path
        }
      ]
    };
  }

  const argument = inferExpression(expr[1], `${path}/1`, options);
  const diagnostics = [...argument.diagnostics];
  if (argument.type !== "unknown" && argument.type !== "boolean") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: "\"!\" argument must evaluate to a boolean value.",
      path: `${path}/1`
    });
  }
  return { type: "boolean", diagnostics };
}

function inferComparisonExpression(expr: unknown[], path: string, options: NormalizedExpressionOptions): ExpressionInference {
  const operator = String(expr[0]);
  if (expr.length !== 3) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 2 arguments for "${operator}", found ${expr.length - 1}.`,
          path
        }
      ]
    };
  }
  return { type: "boolean", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferMembershipExpression(expr: unknown[], path: string, options: NormalizedExpressionOptions): ExpressionInference {
  if (expr.length < 3) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected at least 2 arguments for "in", found ${expr.length - 1}.`,
          path
        }
      ]
    };
  }
  return { type: "boolean", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferToNumberExpression(expr: unknown[], path: string, options: NormalizedExpressionOptions): ExpressionInference {
  if (expr.length < 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: "Expected at least 1 argument for \"to-number\".",
          path
        }
      ]
    };
  }

  return { type: "number", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferToStringExpression(expr: unknown[], path: string, options: NormalizedExpressionOptions): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "to-string", found ${expr.length - 1}.`,
          path
        }
      ]
    };
  }

  return { type: "string", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function collectOutputTypes(expr: unknown[], path: string, options: NormalizedExpressionOptions, firstOutputIndex: number): ExpressionInference {
  return collectOutputTypesAtIndexes(expr, path, options, outputIndexesFromStride(expr.length, firstOutputIndex));
}

function collectOutputTypesAtIndexes(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
  outputIndexes: number[]
): ExpressionInference {
  const diagnostics: Diagnostic[] = [];
  let expectedType: ExprType | undefined;

  for (const outputIndex of outputIndexes) {
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

function outputIndexesFromStride(length: number, firstOutputIndex: number): number[] {
  const indexes: number[] = [];
  for (let outputIndex = firstOutputIndex; outputIndex < length; outputIndex += 2) indexes.push(outputIndex);
  return indexes;
}

function outputIndexesForCase(length: number): number[] {
  const indexes: number[] = [];
  for (let outputIndex = 2; outputIndex < length - 1; outputIndex += 2) indexes.push(outputIndex);
  indexes.push(length - 1);
  return indexes;
}

function outputIndexesForMatch(length: number): number[] {
  const indexes: number[] = [];
  for (let outputIndex = 3; outputIndex < length - 1; outputIndex += 2) indexes.push(outputIndex);
  indexes.push(length - 1);
  return indexes;
}

function collectArgumentDiagnostics(expr: unknown[], path: string, options: NormalizedExpressionOptions, firstArgumentIndex: number): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (let argumentIndex = firstArgumentIndex; argumentIndex < expr.length; argumentIndex += 1) {
    diagnostics.push(...inferExpression(expr[argumentIndex], `${path}/${argumentIndex}`, options).diagnostics);
  }
  return diagnostics;
}

function isMatchLabel(value: unknown): boolean {
  if (isMatchLabelLiteral(value)) return true;
  return Array.isArray(value) && value.length > 0 && value.every(isMatchLabelLiteral);
}

function isMatchLabelLiteral(value: unknown): boolean {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
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
