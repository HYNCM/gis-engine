import type { Static, TSchema } from "@sinclair/typebox";
import { Ajv, type ErrorObject, type ValidateFunction } from "ajv";
import { type WorkbenchContractDiagnostic, WorkbenchDiagnosticCodes } from "./diagnostics.js";
import {
  WorkbenchApplyRequestSchema,
  WorkbenchApplyResultSchema,
  WorkbenchExportPreviewSchema,
  WorkbenchExportReceiptSchema,
  WorkbenchPlanSchema,
  WorkbenchProjectSchema,
  WorkbenchTelemetryEventSchema,
} from "./schemas.js";

export interface WorkbenchValidationResult<T> {
  valid: boolean;
  value?: T;
  diagnostics: WorkbenchContractDiagnostic[];
}

const ajv = new Ajv({ allErrors: true, strict: true });
const validators = new WeakMap<TSchema, ValidateFunction>();

export function validateWorkbenchSchema<T extends TSchema>(
  schema: T,
  value: unknown,
): WorkbenchValidationResult<Static<T>> {
  const cached = validators.get(schema);
  const validate: ValidateFunction = cached ?? ajv.compile(schema);
  if (!cached) validators.set(schema, validate);

  if (validate(value)) {
    return { valid: true, value: value as Static<T>, diagnostics: [] };
  }

  const code = validationCode(schema, value);
  return {
    valid: false,
    diagnostics: (validate.errors ?? []).map((error) => toDiagnostic(error, code)),
  };
}

function validationCode(schema: TSchema, value: unknown) {
  if (schema !== WorkbenchTelemetryEventSchema) return WorkbenchDiagnosticCodes.SchemaInvalid;
  if (!isRecord(value) || value.consent !== true) return WorkbenchDiagnosticCodes.TelemetryConsentRequired;
  return WorkbenchDiagnosticCodes.TelemetryPayloadRejected;
}

function toDiagnostic(error: ErrorObject, code: WorkbenchContractDiagnostic["code"]): WorkbenchContractDiagnostic {
  const additionalProperty =
    error.keyword === "additionalProperties" && typeof error.params.additionalProperty === "string"
      ? `/${error.params.additionalProperty}`
      : "";
  return {
    severity: "error",
    code,
    message: error.message ?? "Value does not match the Workbench schema.",
    path: `${error.instancePath}${additionalProperty}` || "/",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export const validateWorkbenchProject = (value: unknown) => validateWorkbenchSchema(WorkbenchProjectSchema, value);
export const validateWorkbenchPlan = (value: unknown) => validateWorkbenchSchema(WorkbenchPlanSchema, value);
export const validateWorkbenchApplyRequest = (value: unknown) =>
  validateWorkbenchSchema(WorkbenchApplyRequestSchema, value);
export const validateWorkbenchApplyResult = (value: unknown) =>
  validateWorkbenchSchema(WorkbenchApplyResultSchema, value);
export const validateWorkbenchExportPreview = (value: unknown) =>
  validateWorkbenchSchema(WorkbenchExportPreviewSchema, value);
export const validateWorkbenchExportReceipt = (value: unknown) =>
  validateWorkbenchSchema(WorkbenchExportReceiptSchema, value);
export const validateWorkbenchTelemetryEvent = (value: unknown) =>
  validateWorkbenchSchema(WorkbenchTelemetryEventSchema, value);
