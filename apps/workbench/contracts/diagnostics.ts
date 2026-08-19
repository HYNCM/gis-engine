import { type Static, Type } from "@sinclair/typebox";

export const WorkbenchDiagnosticCodes = {
  SchemaInvalid: "WORKBENCH.SCHEMA_INVALID",
  ProjectInvalid: "WORKBENCH.PROJECT_INVALID",
  PlanInvalid: "WORKBENCH.PLAN_INVALID",
  PlanHashMismatch: "WORKBENCH.PLAN_HASH_MISMATCH",
  RevisionConflict: "WORKBENCH.REVISION_CONFLICT",
  UnsafePath: "WORKBENCH.UNSAFE_PATH",
  NetworkConfirmationRequired: "WORKBENCH.NETWORK_CONFIRMATION_REQUIRED",
  DataUnsupported: "WORKBENCH.DATA_UNSUPPORTED",
  TransactionFailed: "WORKBENCH.TRANSACTION_FAILED",
  ExportPreviewMismatch: "WORKBENCH.EXPORT_PREVIEW_MISMATCH",
  ExportCollision: "WORKBENCH.EXPORT_COLLISION",
  TelemetryConsentRequired: "WORKBENCH.TELEMETRY_CONSENT_REQUIRED",
  TelemetryPayloadRejected: "WORKBENCH.TELEMETRY_PAYLOAD_REJECTED",
} as const;

const WorkbenchDiagnosticCodeSchema = Type.Union(
  Object.values(WorkbenchDiagnosticCodes).map((code) => Type.Literal(code)),
);

export const WorkbenchContractDiagnosticSchema = Type.Object(
  {
    severity: Type.Literal("error"),
    code: WorkbenchDiagnosticCodeSchema,
    message: Type.String({ minLength: 1 }),
    path: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);

export type WorkbenchDiagnosticCode = Static<typeof WorkbenchDiagnosticCodeSchema>;
export type WorkbenchContractDiagnostic = Static<typeof WorkbenchContractDiagnosticSchema>;
