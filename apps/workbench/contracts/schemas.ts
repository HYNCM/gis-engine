import { type Diagnostic, DiagnosticSchema, type MapCommand, MapCommandSchema } from "@gis-engine/engine";
import { type Static, type TSchema, Type } from "@sinclair/typebox";
import { WorkbenchContractDiagnosticSchema } from "./diagnostics.js";

const SHA256_PATTERN = "^sha256:[a-f0-9]{64}$";
const TIMESTAMP_PATTERN = "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?Z$";
const RELATIVE_PATH_PATTERN = "^(?!/)(?!.*(?:^|/)\\.\\.(?:/|$))[^\\\\\\u0000-\\u001f]+$";

const IdSchema = Type.String({ minLength: 1, maxLength: 200 });
const RevisionSchema = Type.String({ minLength: 1, maxLength: 200 });
const Sha256Schema = Type.String({ pattern: SHA256_PATTERN });
const TimestampSchema = Type.String({ pattern: TIMESTAMP_PATTERN });
const RelativePathSchema = Type.String({ minLength: 1, maxLength: 1024, pattern: RELATIVE_PATH_PATTERN });

function withoutSchemaId<T extends TSchema>(schema: T): Omit<T, "$id"> {
  const { $id: _id, ...definition } = schema;
  return definition;
}

const WorkbenchMapCommandSchema = Type.Unsafe<MapCommand>(withoutSchemaId(MapCommandSchema));
const WorkbenchEngineDiagnosticSchema = Type.Unsafe<Diagnostic>(withoutSchemaId(DiagnosticSchema));
const WorkbenchResultDiagnosticSchema = Type.Union([
  WorkbenchEngineDiagnosticSchema,
  WorkbenchContractDiagnosticSchema,
]);

const WorkbenchProjectPathsSchema = Type.Object(
  {
    mapSpec: Type.Literal("mapspec.json"),
    dataDirectory: Type.Literal("data"),
    revisionsDirectory: Type.Literal(".gis-engine/revisions"),
    exportsDirectory: Type.Optional(Type.Literal("exports")),
  },
  { additionalProperties: false },
);

const WorkbenchProviderSelectionSchema = Type.Object(
  {
    kind: Type.Union([Type.Literal("mock"), Type.Literal("openai-compatible")]),
    profileId: Type.Optional(IdSchema),
    model: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
  },
  { additionalProperties: false },
);

export const WorkbenchProjectSchema = Type.Object(
  {
    schemaVersion: Type.Literal("gis-engine.workbench.project.v1"),
    id: IdSchema,
    name: Type.String({ minLength: 1, maxLength: 200 }),
    currentRevision: RevisionSchema,
    paths: WorkbenchProjectPathsSchema,
    provider: WorkbenchProviderSelectionSchema,
    telemetryConsent: Type.Boolean({ default: false }),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  },
  {
    $id: "https://gis-engine.dev/schemas/workbench/project.v1.schema.json",
    additionalProperties: false,
  },
);

const WorkbenchResourceRequestSchema = Type.Object(
  {
    kind: Type.Union([Type.Literal("url"), Type.Literal("tile"), Type.Literal("worker"), Type.Literal("asset")]),
    resource: Type.String({ minLength: 1, maxLength: 4096 }),
    confirmed: Type.Boolean(),
  },
  { additionalProperties: false },
);

export const WorkbenchPlanSchema = Type.Object(
  {
    schemaVersion: Type.Literal("gis-engine.workbench.plan.v1"),
    id: IdSchema,
    goal: Type.String({ minLength: 1, maxLength: 10_000 }),
    baseRevision: RevisionSchema,
    promptHash: Sha256Schema,
    commands: Type.Array(WorkbenchMapCommandSchema),
    affectedPaths: Type.Array(RelativePathSchema, { uniqueItems: true }),
    resourceRequests: Type.Array(WorkbenchResourceRequestSchema),
    unsupportedIntents: Type.Array(Type.String({ minLength: 1, maxLength: 500 })),
    diagnostics: Type.Array(WorkbenchResultDiagnosticSchema),
    createdAt: TimestampSchema,
  },
  {
    $id: "https://gis-engine.dev/schemas/workbench/plan.v1.schema.json",
    additionalProperties: false,
  },
);

export const WorkbenchApplyRequestSchema = Type.Object(
  {
    schemaVersion: Type.Literal("gis-engine.workbench.apply-request.v1"),
    projectId: IdSchema,
    planHash: Sha256Schema,
    baseRevision: RevisionSchema,
  },
  {
    $id: "https://gis-engine.dev/schemas/workbench/apply-request.v1.schema.json",
    additionalProperties: false,
  },
);

export const WorkbenchApplyResultSchema = Type.Object(
  {
    schemaVersion: Type.Literal("gis-engine.workbench.apply-result.v1"),
    projectId: IdSchema,
    planHash: Sha256Schema,
    previousRevision: RevisionSchema,
    revision: RevisionSchema,
    appliedCommandIds: Type.Array(IdSchema, { uniqueItems: true }),
    receiptHash: Sha256Schema,
    diagnostics: Type.Array(WorkbenchResultDiagnosticSchema),
    appliedAt: TimestampSchema,
  },
  {
    $id: "https://gis-engine.dev/schemas/workbench/apply-result.v1.schema.json",
    additionalProperties: false,
  },
);

const WorkbenchExportFileSchema = Type.Object(
  {
    path: RelativePathSchema,
    role: Type.Union([
      Type.Literal("application"),
      Type.Literal("manifest"),
      Type.Literal("documentation"),
      Type.Literal("configuration"),
      Type.Literal("data"),
      Type.Literal("evidence"),
    ]),
    bytes: Type.Integer({ minimum: 0 }),
    sha256: Sha256Schema,
    collision: Type.Boolean(),
  },
  { additionalProperties: false },
);

const WorkbenchWrittenFileSchema = Type.Object(
  {
    path: RelativePathSchema,
    bytes: Type.Integer({ minimum: 0 }),
    sha256: Sha256Schema,
  },
  { additionalProperties: false },
);

const WorkbenchPreflightCommandSchema = Type.Union([
  Type.Literal("pnpm install"),
  Type.Literal("pnpm build"),
  Type.Literal("pnpm test"),
]);

export const WorkbenchExportPreviewSchema = Type.Object(
  {
    schemaVersion: Type.Literal("gis-engine.workbench.export-preview.v1"),
    projectId: IdSchema,
    targetRelativePath: RelativePathSchema,
    files: Type.Array(WorkbenchExportFileSchema),
    preflightCommands: Type.Array(WorkbenchPreflightCommandSchema, { uniqueItems: true }),
    diagnostics: Type.Array(WorkbenchResultDiagnosticSchema),
    previewHash: Sha256Schema,
    createdAt: TimestampSchema,
  },
  {
    $id: "https://gis-engine.dev/schemas/workbench/export-preview.v1.schema.json",
    additionalProperties: false,
  },
);

export const WorkbenchExportReceiptSchema = Type.Object(
  {
    schemaVersion: Type.Literal("gis-engine.workbench.export-receipt.v1"),
    projectId: IdSchema,
    previewHash: Sha256Schema,
    targetRelativePath: RelativePathSchema,
    writtenFiles: Type.Array(WorkbenchWrittenFileSchema),
    manifestHash: Sha256Schema,
    diagnostics: Type.Array(WorkbenchResultDiagnosticSchema),
    committedAt: TimestampSchema,
  },
  {
    $id: "https://gis-engine.dev/schemas/workbench/export-receipt.v1.schema.json",
    additionalProperties: false,
  },
);

const WorkbenchTelemetryPropertiesSchema = Type.Object(
  {
    durationMs: Type.Optional(Type.Integer({ minimum: 0 })),
    commandCount: Type.Optional(Type.Integer({ minimum: 0 })),
    diagnosticCount: Type.Optional(Type.Integer({ minimum: 0 })),
    fileCount: Type.Optional(Type.Integer({ minimum: 0 })),
    bytes: Type.Optional(Type.Integer({ minimum: 0 })),
    providerKind: Type.Optional(Type.Union([Type.Literal("mock"), Type.Literal("openai-compatible")])),
    sourceKind: Type.Optional(
      Type.Union([
        Type.Literal("geojson"),
        Type.Literal("pmtiles"),
        Type.Literal("flatgeobuf"),
        Type.Literal("geoparquet"),
        Type.Literal("raster"),
        Type.Literal("unknown"),
      ]),
    ),
    outcome: Type.Optional(Type.Union([Type.Literal("success"), Type.Literal("failure"), Type.Literal("abandoned")])),
  },
  { additionalProperties: false },
);

export const WorkbenchTelemetryEventSchema = Type.Object(
  {
    schemaVersion: Type.Literal("gis-engine.workbench.telemetry.v1"),
    event: Type.Union([
      Type.Literal("project_created"),
      Type.Literal("project_opened"),
      Type.Literal("data_inspected"),
      Type.Literal("plan_previewed"),
      Type.Literal("plan_applied"),
      Type.Literal("plan_abandoned"),
      Type.Literal("revision_restored"),
      Type.Literal("export_previewed"),
      Type.Literal("export_committed"),
    ]),
    occurredAt: TimestampSchema,
    projectId: IdSchema,
    consent: Type.Literal(true),
    properties: WorkbenchTelemetryPropertiesSchema,
  },
  {
    $id: "https://gis-engine.dev/schemas/workbench/telemetry-event.v1.schema.json",
    additionalProperties: false,
  },
);

export type WorkbenchProject = Static<typeof WorkbenchProjectSchema>;
export type WorkbenchPlan = Static<typeof WorkbenchPlanSchema>;
export type WorkbenchApplyRequest = Static<typeof WorkbenchApplyRequestSchema>;
export type WorkbenchApplyResult = Static<typeof WorkbenchApplyResultSchema>;
export type WorkbenchExportPreview = Static<typeof WorkbenchExportPreviewSchema>;
export type WorkbenchExportReceipt = Static<typeof WorkbenchExportReceiptSchema>;
export type WorkbenchTelemetryEvent = Static<typeof WorkbenchTelemetryEventSchema>;
