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

export function validateExpression(
  expr: unknown,
  path: string,
  options: ExpressionValidationOptions = {},
): Diagnostic[] {
  return inferExpression(expr, path, normalizeOptions(options)).diagnostics;
}

export function validateFilterExpression(
  filter: unknown,
  path: string,
  options: ExpressionValidationOptions = {},
): Diagnostic[] {
  const inference = inferExpression(filter, path, normalizeOptions(options));
  const diagnostics = [...inference.diagnostics];
  if (!diagnostics.some((diagnostic) => diagnostic.severity === "error") && inference.type !== "boolean") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: "Layer filter expressions must evaluate to boolean values.",
      path,
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
          path,
        },
      ],
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
          path: `${path}/0`,
        },
      ],
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
    case "+":
    case "-":
    case "*":
    case "/":
      return inferArithmeticExpression(expr, path, options, operator);
    case "coalesce":
      return inferCoalesceExpression(expr, path, options);
    case "heatmap-density":
      return inferHeatmapDensityExpression(expr, path);
    case "concat":
      return inferConcatExpression(expr, path, options);
    case "upcase":
    case "downcase":
      return inferCaseTransformExpression(expr, path, options, operator);
    case "feature-state":
      return inferFeatureStateExpression(expr, path, options);
    case "geometry-type":
      return inferGeometryTypeExpression(expr, path);
    case "id":
      return inferIdExpression(expr, path);
    case "properties":
      return inferPropertiesExpression(expr, path);
    case "abs":
    case "ceil":
    case "floor":
    case "round":
    case "sqrt":
    case "sin":
    case "cos":
    case "tan":
    case "asin":
    case "acos":
    case "atan":
    case "ln":
    case "log10":
    case "log2":
      return inferUnaryMathExpression(expr, path, options, operator);
    case "min":
    case "max":
      return inferVariadicMathExpression(expr, path, options, operator);
    case "pow":
      return inferPowExpression(expr, path, options);
    case "pi":
    case "e":
    case "ln2":
      return inferMathConstantExpression(expr, path, operator);
    case "typeof":
      return inferTypeofExpression(expr, path, options);
    case "to-boolean":
      return inferToBooleanExpression(expr, path, options);
    case "to-color":
      return inferToColorExpression(expr, path, options);
    case "length":
      return inferLengthExpression(expr, path, options);
    case "slice":
      return inferSliceExpression(expr, path, options);
    case "index-of":
      return inferIndexOfExpression(expr, path, options);
    case "rgb":
      return inferRgbExpression(expr, path, options);
    case "rgba":
      return inferRgbaExpression(expr, path, options);
    case "to-rgba":
      return inferToRgbaExpression(expr, path, options);
    case "string":
      return inferStringExpression(expr, path, options);
    case "number-format":
      return inferNumberFormatExpression(expr, path, options);
    case "let":
      return inferLetExpression(expr, path, options);
    case "var":
      return inferVarExpression(expr, path, options);
    case "at":
      return inferAtExpression(expr, path, options);
    case "interpolate-hcl":
    case "interpolate-lab":
      return inferInterpolateColorExpression(expr, path, options, operator);
    case "array":
      return inferArrayTypeExpression(expr, path, options);
    case "boolean":
      return inferBooleanTypeExpression(expr, path, options);
    case "number":
      return inferNumberTypeExpression(expr, path, options);
    case "object":
      return inferObjectTypeExpression(expr, path, options);
    case "collator":
      return inferCollatorExpression(expr, path, options);
    case "format":
      return inferFormatExpression(expr, path, options);
    case "image":
      return inferImageExpression(expr, path, options);
    case "line-progress":
    case "accumulated":
      return inferZeroArgNumberExpression(expr, path, operator);
    case "is-supported-script":
      return inferIsSupportedScriptExpression(expr, path, options);
    case "resolved-locale":
      return inferResolvedLocaleExpression(expr, path, options);
    default:
      return {
        type: "unknown",
        diagnostics: [
          {
            severity: "error",
            code: DiagnosticCodes.ExpressionUnknownOperator,
            message: `Unknown expression operator "${operator}".`,
            path: `${path}/0`,
          },
        ],
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
          path,
        },
      ],
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
          path,
        },
      ],
    };
  }

  const propertyName = expr[1];
  if (typeof propertyName !== "string") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: '"get" property name must be a string.',
      path: `${path}/1`,
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
        message: "Verify the source feature property name or provide a sample/property schema.",
      },
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
          message: 'Expected "case" syntax: ["case", condition1, output1, ..., fallback].',
          path,
        },
      ],
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
        message: '"case" conditions must evaluate to boolean values.',
        path: `${path}/${conditionIndex}`,
      });
    }
  }

  const outputs = collectOutputTypesAtIndexes(expr, path, options, outputIndexesForCase(expr.length));
  diagnostics.push(...outputs.diagnostics);

  return { type: outputs.type, diagnostics };
}

function inferMatchExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length < 5 || expr.length % 2 !== 1) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: 'Expected "match" syntax: ["match", input, label1, output1, ..., fallback].',
          path,
        },
      ],
    };
  }

  const diagnostics: Diagnostic[] = [];
  diagnostics.push(...inferExpression(expr[1], `${path}/1`, options).diagnostics);

  for (let labelIndex = 2; labelIndex < expr.length - 1; labelIndex += 2) {
    if (!isMatchLabel(expr[labelIndex])) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
        message: '"match" labels must be strings, numbers, booleans, or arrays of those literal values.',
        path: `${path}/${labelIndex}`,
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
          message: 'Expected "step" syntax: ["step", input, output0, stop1, output1, ...].',
          path,
        },
      ],
    };
  }

  const diagnostics: Diagnostic[] = [];
  diagnostics.push(...inferExpression(expr[1], `${path}/1`, options).diagnostics);

  for (let stopIndex = 3; stopIndex < expr.length; stopIndex += 2) {
    if (typeof expr[stopIndex] !== "number") {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
        message: '"step" stop inputs must be numbers.',
        path: `${path}/${stopIndex}`,
      });
    }
  }

  const outputs = collectOutputTypes(expr, path, options, 2);
  diagnostics.push(...outputs.diagnostics);

  return { type: outputs.type, diagnostics };
}

function inferInterpolateExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length < 7 || expr.length % 2 === 0) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message:
            'Expected "interpolate" syntax: ["interpolate", ["linear"|"exponential", base|"cubic-bezier", x1, y1, x2, y2], input, stop1, output1, stop2, output2, ...].',
          path,
        },
      ],
    };
  }

  const diagnostics: Diagnostic[] = [];
  const interpolationResult = isInterpolationType(expr[1]);
  if (!interpolationResult.valid) {
    for (const diagnostic of interpolationResult.diagnostics) {
      diagnostics.push({ ...diagnostic, path: `${path}/1` });
    }
  }

  diagnostics.push(...inferExpression(expr[2], `${path}/2`, options).diagnostics);

  for (let stopIndex = 3; stopIndex < expr.length; stopIndex += 2) {
    if (typeof expr[stopIndex] !== "number") {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
        message: '"interpolate" stop inputs must be numbers.',
        path: `${path}/${stopIndex}`,
      });
    }
  }

  const outputs = collectOutputTypes(expr, path, options, 4);
  diagnostics.push(...outputs.diagnostics);

  if (outputs.type !== "unknown" && outputs.type !== "number" && outputs.type !== "color") {
    diagnostics.push({
      severity: "error",
      code: outputs.type === "string" ? DiagnosticCodes.ExpressionInvalidColor : DiagnosticCodes.ExpressionTypeMismatch,
      message: '"interpolate" outputs must be numbers or valid color strings.',
      path,
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
          path,
        },
      ],
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
          path,
        },
      ],
    };
  }

  const diagnostics: Diagnostic[] = [];
  const propertyName = expr[1];
  if (typeof propertyName !== "string") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: '"has" property name must be a string.',
      path: `${path}/1`,
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
        message: "Verify the source feature property name or provide a sample/property schema.",
      },
    });
  }
  if (expr.length === 3) diagnostics.push(...inferExpression(expr[2], `${path}/2`, options).diagnostics);
  return { type: "boolean", diagnostics };
}

function inferLogicalExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  const operator = String(expr[0]);
  if (expr.length < 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected at least 1 argument for "${operator}".`,
          path,
        },
      ],
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
        path: `${path}/${argumentIndex}`,
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
          path,
        },
      ],
    };
  }

  const argument = inferExpression(expr[1], `${path}/1`, options);
  const diagnostics = [...argument.diagnostics];
  if (argument.type !== "unknown" && argument.type !== "boolean") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: '"!" argument must evaluate to a boolean value.',
      path: `${path}/1`,
    });
  }
  return { type: "boolean", diagnostics };
}

function inferComparisonExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  const operator = String(expr[0]);
  if (expr.length !== 3) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 2 arguments for "${operator}", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "boolean", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferMembershipExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length < 3) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected at least 2 arguments for "in", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "boolean", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferToNumberExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length < 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: 'Expected at least 1 argument for "to-number".',
          path,
        },
      ],
    };
  }

  return { type: "number", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferToStringExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "to-string", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }

  return { type: "string", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferArithmeticExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
  operator: string,
): ExpressionInference {
  if (expr.length !== 3) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 2 arguments for "${operator}", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }

  const diagnostics: Diagnostic[] = [];
  const left = inferExpression(expr[1], `${path}/1`, options);
  diagnostics.push(...left.diagnostics);
  const right = inferExpression(expr[2], `${path}/2`, options);
  diagnostics.push(...right.diagnostics);

  if (left.type !== "unknown" && left.type !== "number") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: `"${operator}" operands must evaluate to number values.`,
      path: `${path}/1`,
    });
  }
  if (right.type !== "unknown" && right.type !== "number") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: `"${operator}" operands must evaluate to number values.`,
      path: `${path}/2`,
    });
  }

  return { type: "number", diagnostics };
}

function inferCoalesceExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length < 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected at least 1 argument for "coalesce", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }

  const diagnostics: Diagnostic[] = [];
  let resolvedType: ExprType | undefined;

  for (let argumentIndex = 1; argumentIndex < expr.length; argumentIndex += 1) {
    const argument = inferExpression(expr[argumentIndex], `${path}/${argumentIndex}`, options);
    diagnostics.push(...argument.diagnostics);

    if (argument.type === "unknown" || argument.type === "null") continue;
    if (resolvedType === undefined) {
      resolvedType = argument.type;
      continue;
    }

    if (resolvedType !== argument.type) {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
        message: `"coalesce" arguments must use a consistent type. Expected ${resolvedType}, found ${argument.type}.`,
        path: `${path}/${argumentIndex}`,
      });
    }
  }

  return { type: resolvedType ?? "unknown", diagnostics };
}

function inferHeatmapDensityExpression(expr: unknown[], path: string): ExpressionInference {
  if (expr.length !== 1) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 0 arguments for "heatmap-density", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "number", diagnostics: [] };
}

function inferConcatExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length < 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected at least 1 argument for "concat", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "string", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferFeatureStateExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "feature-state", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }

  const diagnostics: Diagnostic[] = [];
  const arg = inferExpression(expr[1], `${path}/1`, options);
  diagnostics.push(...arg.diagnostics);
  if (arg.type !== "unknown" && arg.type !== "string") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: '"feature-state" argument must evaluate to a string value.',
      path: `${path}/1`,
    });
  }
  return { type: "unknown", diagnostics };
}

function inferGeometryTypeExpression(expr: unknown[], path: string): ExpressionInference {
  if (expr.length !== 1) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 0 arguments for "geometry-type", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "string", diagnostics: [] };
}

function inferIdExpression(expr: unknown[], path: string): ExpressionInference {
  if (expr.length !== 1) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 0 arguments for "id", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "unknown", diagnostics: [] };
}

function inferPropertiesExpression(expr: unknown[], path: string): ExpressionInference {
  if (expr.length !== 1) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 0 arguments for "properties", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "object", diagnostics: [] };
}

function inferCaseTransformExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
  operator: string,
): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "${operator}", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  const diagnostics: Diagnostic[] = [];
  const arg = inferExpression(expr[1], `${path}/1`, options);
  diagnostics.push(...arg.diagnostics);
  if (arg.type !== "unknown" && arg.type !== "string") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: `"${operator}" argument must evaluate to a string value.`,
      path: `${path}/1`,
    });
  }
  return { type: "string", diagnostics };
}

function collectOutputTypes(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
  firstOutputIndex: number,
): ExpressionInference {
  return collectOutputTypesAtIndexes(expr, path, options, outputIndexesFromStride(expr.length, firstOutputIndex));
}

function collectOutputTypesAtIndexes(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
  outputIndexes: number[],
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
        path: `${path}/${outputIndex}`,
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

function collectArgumentDiagnostics(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
  firstArgumentIndex: number,
): Diagnostic[] {
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

interface InterpolationTypeResult {
  valid: boolean;
  diagnostics: Omit<Diagnostic, "path">[];
}

function isInterpolationType(value: unknown): InterpolationTypeResult {
  if (value === "linear" || (Array.isArray(value) && value.length === 1 && value[0] === "linear")) {
    return { valid: true, diagnostics: [] };
  }

  if (Array.isArray(value)) {
    const kind = value[0];

    if (kind === "exponential") {
      if (value.length !== 2 || typeof value[1] !== "number") {
        return {
          valid: false,
          diagnostics: [
            {
              severity: "error",
              code: DiagnosticCodes.ExpressionInvalidArity,
              message: '"exponential" interpolation requires exactly 1 numeric base argument.',
            },
          ],
        };
      }
      if (value[1] <= 0) {
        return {
          valid: false,
          diagnostics: [
            {
              severity: "error",
              code: DiagnosticCodes.ExpressionTypeMismatch,
              message: '"exponential" interpolation base must be a positive number.',
            },
          ],
        };
      }
      return { valid: true, diagnostics: [] };
    }

    if (kind === "cubic-bezier") {
      if (value.length !== 5) {
        return {
          valid: false,
          diagnostics: [
            {
              severity: "error",
              code: DiagnosticCodes.ExpressionInvalidArity,
              message: '"cubic-bezier" interpolation requires exactly 4 numeric arguments (x1, y1, x2, y2).',
            },
          ],
        };
      }
      for (let i = 1; i < 5; i++) {
        if (typeof value[i] !== "number") {
          return {
            valid: false,
            diagnostics: [
              {
                severity: "error",
                code: DiagnosticCodes.ExpressionTypeMismatch,
                message: '"cubic-bezier" interpolation arguments must all be numbers.',
              },
            ],
          };
        }
      }
      return { valid: true, diagnostics: [] };
    }
  }

  return {
    valid: false,
    diagnostics: [
      {
        severity: "error",
        code: DiagnosticCodes.CapabilityUnsupported,
        message: "Supported interpolation types: linear, exponential, cubic-bezier.",
      },
    ],
  };
}

function isColorString(value: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) || /^rgba?\(/i.test(value);
}

function inferUnaryMathExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
  operator: string,
): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "${operator}", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }

  const diagnostics: Diagnostic[] = [];
  const arg = inferExpression(expr[1], `${path}/1`, options);
  diagnostics.push(...arg.diagnostics);
  if (arg.type !== "unknown" && arg.type !== "number") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: `"${operator}" argument must evaluate to a number value.`,
      path: `${path}/1`,
    });
  }
  return { type: "number", diagnostics };
}

function inferVariadicMathExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
  operator: string,
): ExpressionInference {
  if (expr.length < 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected at least 1 argument for "${operator}", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }

  const diagnostics: Diagnostic[] = [];
  for (let argumentIndex = 1; argumentIndex < expr.length; argumentIndex += 1) {
    const arg = inferExpression(expr[argumentIndex], `${path}/${argumentIndex}`, options);
    diagnostics.push(...arg.diagnostics);
    if (arg.type !== "unknown" && arg.type !== "number") {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
        message: `"${operator}" arguments must evaluate to number values.`,
        path: `${path}/${argumentIndex}`,
      });
    }
  }
  return { type: "number", diagnostics };
}

function inferTypeofExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "typeof", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }

  return { type: "string", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferToBooleanExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "to-boolean", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }

  return { type: "boolean", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferToColorExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "to-color", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }

  return { type: "color", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function normalizeOptions(options: ExpressionValidationOptions): NormalizedExpressionOptions {
  return {
    knownProperties: new Set(options.knownProperties ?? []),
  };
}

// ---------------------------------------------------------------------------
// Sprint 2 (T-03b): length, slice, index-of, rgb, rgba, to-rgba, string, number-format
// ---------------------------------------------------------------------------

function inferLengthExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "length", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "number", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferSliceExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length < 3 || expr.length > 4) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 2 or 3 arguments for "slice", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  const diagnostics = collectArgumentDiagnostics(expr, path, options, 1);
  // slice can operate on strings or arrays; output type depends on input
  return { type: "unknown", diagnostics };
}

function inferIndexOfExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length !== 3) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 2 arguments for "index-of", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "number", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferRgbExpression(expr: unknown[], path: string, options: NormalizedExpressionOptions): ExpressionInference {
  if (expr.length !== 4) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 3 arguments for "rgb", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  const diagnostics = collectArgumentDiagnostics(expr, path, options, 1);
  for (let argumentIndex = 1; argumentIndex <= 3; argumentIndex++) {
    const arg = inferExpression(expr[argumentIndex], `${path}/${argumentIndex}`, options);
    if (arg.type !== "unknown" && arg.type !== "number") {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
        message: `"rgb" arguments must evaluate to number values.`,
        path: `${path}/${argumentIndex}`,
      });
    }
  }
  return { type: "color", diagnostics };
}

function inferRgbaExpression(expr: unknown[], path: string, options: NormalizedExpressionOptions): ExpressionInference {
  if (expr.length !== 5) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 4 arguments for "rgba", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  const diagnostics = collectArgumentDiagnostics(expr, path, options, 1);
  for (let argumentIndex = 1; argumentIndex <= 4; argumentIndex++) {
    const arg = inferExpression(expr[argumentIndex], `${path}/${argumentIndex}`, options);
    if (arg.type !== "unknown" && arg.type !== "number") {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
        message: `"rgba" arguments must evaluate to number values.`,
        path: `${path}/${argumentIndex}`,
      });
    }
  }
  return { type: "color", diagnostics };
}

function inferToRgbaExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "to-rgba", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  const diagnostics = collectArgumentDiagnostics(expr, path, options, 1);
  const arg = inferExpression(expr[1], `${path}/1`, options);
  if (arg.type !== "unknown" && arg.type !== "color" && arg.type !== "string") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: `"to-rgba" argument must evaluate to a color value.`,
      path: `${path}/1`,
    });
  }
  return { type: "array", diagnostics };
}

function inferStringExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length < 2 || expr.length > 3) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 or 2 arguments for "string", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "string", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferNumberFormatExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length < 3) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected at least 2 arguments for "number-format", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  const diagnostics = collectArgumentDiagnostics(expr, path, options, 1);
  const numArg = inferExpression(expr[1], `${path}/1`, options);
  if (numArg.type !== "unknown" && numArg.type !== "number") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: `First argument of "number-format" must evaluate to a number.`,
      path: `${path}/1`,
    });
  }
  return { type: "string", diagnostics };
}

// ---------------------------------------------------------------------------
// Sprint 3 (T-03c): pow, math constants, trig, let/var, at, interpolate-hcl/lab,
// type assertions, collator, format, image, line-progress, accumulated,
// is-supported-script, resolved-locale
// ---------------------------------------------------------------------------

function inferPowExpression(expr: unknown[], path: string, options: NormalizedExpressionOptions): ExpressionInference {
  if (expr.length !== 3) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 2 arguments for "pow", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }

  const diagnostics: Diagnostic[] = [];
  const base = inferExpression(expr[1], `${path}/1`, options);
  diagnostics.push(...base.diagnostics);
  const exponent = inferExpression(expr[2], `${path}/2`, options);
  diagnostics.push(...exponent.diagnostics);

  if (base.type !== "unknown" && base.type !== "number") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: `"pow" arguments must evaluate to number values.`,
      path: `${path}/1`,
    });
  }
  if (exponent.type !== "unknown" && exponent.type !== "number") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: `"pow" arguments must evaluate to number values.`,
      path: `${path}/2`,
    });
  }
  return { type: "number", diagnostics };
}

function inferMathConstantExpression(expr: unknown[], path: string, operator: string): ExpressionInference {
  if (expr.length !== 1) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 0 arguments for "${operator}", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "number", diagnostics: [] };
}

function inferLetExpression(expr: unknown[], path: string, options: NormalizedExpressionOptions): ExpressionInference {
  // ["let", name1, value1, name2, value2, ..., body]
  // Must have at least 3 elements: name, value, body
  // The number of elements must be even (pairs) + 1 (body) = odd total
  if (expr.length < 4 || expr.length % 2 !== 0) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: 'Expected "let" syntax: ["let", name1, value1, ..., body].',
          path,
        },
      ],
    };
  }

  const diagnostics: Diagnostic[] = [];

  // Validate variable name/value pairs
  for (let i = 1; i < expr.length - 1; i += 2) {
    if (typeof expr[i] !== "string") {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
        message: '"let" variable names must be strings.',
        path: `${path}/${i}`,
      });
    }
    diagnostics.push(...inferExpression(expr[i + 1], `${path}/${i + 1}`, options).diagnostics);
  }

  // Validate body expression
  const bodyIndex = expr.length - 1;
  const body = inferExpression(expr[bodyIndex], `${path}/${bodyIndex}`, options);
  diagnostics.push(...body.diagnostics);

  return { type: body.type, diagnostics };
}

function inferVarExpression(expr: unknown[], path: string, _options: NormalizedExpressionOptions): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "var", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }

  const diagnostics: Diagnostic[] = [];
  if (typeof expr[1] !== "string") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: '"var" argument must be a string variable name.',
      path: `${path}/1`,
    });
  }
  return { type: "unknown", diagnostics };
}

function inferAtExpression(expr: unknown[], path: string, options: NormalizedExpressionOptions): ExpressionInference {
  if (expr.length !== 3) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 2 arguments for "at", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }

  const diagnostics: Diagnostic[] = [];
  const index = inferExpression(expr[1], `${path}/1`, options);
  diagnostics.push(...index.diagnostics);
  if (index.type !== "unknown" && index.type !== "number") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: '"at" first argument must evaluate to a number (index).',
      path: `${path}/1`,
    });
  }
  diagnostics.push(...inferExpression(expr[2], `${path}/2`, options).diagnostics);
  return { type: "unknown", diagnostics };
}

function inferInterpolateColorExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
  operator: string,
): ExpressionInference {
  // interpolate-hcl and interpolate-lab have the same structure as interpolate
  // but always produce color outputs
  if (expr.length < 7 || expr.length % 2 === 0) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected "${operator}" syntax: ["${operator}", ["linear"|"exponential", base|"cubic-bezier", x1, y1, x2, y2], input, stop1, output1, stop2, output2, ...].`,
          path,
        },
      ],
    };
  }

  const diagnostics: Diagnostic[] = [];
  const interpolationResult = isInterpolationType(expr[1]);
  if (!interpolationResult.valid) {
    for (const diagnostic of interpolationResult.diagnostics) {
      diagnostics.push({ ...diagnostic, path: `${path}/1` });
    }
  }

  diagnostics.push(...inferExpression(expr[2], `${path}/2`, options).diagnostics);

  for (let stopIndex = 3; stopIndex < expr.length; stopIndex += 2) {
    if (typeof expr[stopIndex] !== "number") {
      diagnostics.push({
        severity: "error",
        code: DiagnosticCodes.ExpressionTypeMismatch,
        message: `"${operator}" stop inputs must be numbers.`,
        path: `${path}/${stopIndex}`,
      });
    }
  }

  // Color interpolation outputs are always colors
  collectOutputTypes(expr, path, options, 4);

  return { type: "color", diagnostics };
}

function inferArrayTypeExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  // ["array", value] or ["array", itemType, value] or ["array", itemType, minLength, maxLength, value]
  if (expr.length < 2 || expr.length > 5) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 to 4 arguments for "array", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "array", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferBooleanTypeExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "boolean", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "boolean", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferNumberTypeExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "number", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "number", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferObjectTypeExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "object", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "object", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferCollatorExpression(
  expr: unknown[],
  path: string,
  _options: NormalizedExpressionOptions,
): ExpressionInference {
  // ["collator", { case-sensitive?: boolean, diacritic-sensitive?: boolean, locale?: string | string[] }]
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "collator", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }

  const diagnostics: Diagnostic[] = [];
  if (typeof expr[1] !== "object" || expr[1] === null || Array.isArray(expr[1])) {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: '"collator" argument must be an options object.',
      path: `${path}/1`,
    });
  }
  return { type: "object", diagnostics };
}

function inferFormatExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  // ["format", text1, options1?, text2, options2?, ...]
  // Must have at least 2 elements (text + optional options pairs)
  if (expr.length < 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected at least 1 argument for "format", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "string", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}

function inferImageExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  // ["image", name]
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "image", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  const diagnostics: Diagnostic[] = [];
  const arg = inferExpression(expr[1], `${path}/1`, options);
  diagnostics.push(...arg.diagnostics);
  if (arg.type !== "unknown" && arg.type !== "string") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: '"image" argument must evaluate to a string value.',
      path: `${path}/1`,
    });
  }
  return { type: "string", diagnostics };
}

function inferZeroArgNumberExpression(expr: unknown[], path: string, operator: string): ExpressionInference {
  if (expr.length !== 1) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 0 arguments for "${operator}", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "number", diagnostics: [] };
}

function inferIsSupportedScriptExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "is-supported-script", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  const diagnostics: Diagnostic[] = [];
  const arg = inferExpression(expr[1], `${path}/1`, options);
  diagnostics.push(...arg.diagnostics);
  if (arg.type !== "unknown" && arg.type !== "string") {
    diagnostics.push({
      severity: "error",
      code: DiagnosticCodes.ExpressionTypeMismatch,
      message: '"is-supported-script" argument must evaluate to a string value.',
      path: `${path}/1`,
    });
  }
  return { type: "boolean", diagnostics };
}

function inferResolvedLocaleExpression(
  expr: unknown[],
  path: string,
  options: NormalizedExpressionOptions,
): ExpressionInference {
  if (expr.length !== 2) {
    return {
      type: "unknown",
      diagnostics: [
        {
          severity: "error",
          code: DiagnosticCodes.ExpressionInvalidArity,
          message: `Expected 1 argument for "resolved-locale", found ${expr.length - 1}.`,
          path,
        },
      ],
    };
  }
  return { type: "string", diagnostics: collectArgumentDiagnostics(expr, path, options, 1) };
}
