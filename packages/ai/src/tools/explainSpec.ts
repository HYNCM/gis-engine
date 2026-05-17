import { Ajv } from "ajv/dist/ajv.js";
import {
  MapSpecSchema,
  validateSpec,
  type CapabilityReport,
  type Diagnostic,
  type MapSpec,
  type ValidationReport
} from "@gis-engine/engine";
import { getContextSummary, type ContextSummary } from "./contextSummary.js";
import { toolInputErrorsToDiagnostics } from "./schemaDiagnostics.js";

export const ExplainSpecToolInputSchema = {
  type: "object",
  properties: {
    spec: MapSpecSchema,
    capabilities: { type: "object" }
  },
  required: ["spec"],
  additionalProperties: false
} as const;

export interface ExplainSpecToolInput {
  spec: MapSpec;
  capabilities?: CapabilityReport;
}

export interface ExplainSpecToolResult {
  summary: ContextSummary;
  validation: ValidationReport;
  diagnostics: Diagnostic[];
}

export type ExplainSpecToolResponse =
  | { ok: true; result: ExplainSpecToolResult; diagnostics: [] }
  | { ok: false; diagnostics: Diagnostic[] };

const ajv = new Ajv({ allErrors: true, strict: false });
const validateInput = ajv.compile(ExplainSpecToolInputSchema);

export function explainSpecTool(input: unknown): ExplainSpecToolResponse {
  if (!validateInput(input)) {
    return {
      ok: false,
      diagnostics: toolInputErrorsToDiagnostics(validateInput.errors, "Invalid explain_spec tool input.")
    };
  }

  const typedInput = input as ExplainSpecToolInput;
  const validation = validateSpec(typedInput.spec);
  return {
    ok: true,
    result: {
      summary: getContextSummary({
        spec: typedInput.spec,
        ...(typedInput.capabilities ? { capabilities: typedInput.capabilities } : {})
      }),
      validation,
      diagnostics: validation.diagnostics
    },
    diagnostics: []
  };
}
