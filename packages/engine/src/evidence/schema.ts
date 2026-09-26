import { type Static, Type } from "@sinclair/typebox";
import { DiagnosticSchema } from "../spec/schemas/diagnostics.schema.js";
import { stripNestedIds } from "../spec/schemas/generation.schema.js";
import { MapCommandSchema } from "../spec/schemas/index.js";

const NestedDiagnosticSchema = stripNestedIds(DiagnosticSchema);
const NestedMapCommandSchema = stripNestedIds(MapCommandSchema);

const Sha256 = Type.String({ pattern: "^sha256:[a-f0-9]{64}$" });
// This repo has no ajv-formats (`grep -rn "ajv-formats" packages` is empty), so we do NOT write
// `format: "date-time"` here — Ajv would silently ignore it and leave a field that looks
// validated but never actually is.
const Iso8601Utc = Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,3})?Z$" });

export const EngineCapabilityBlockerSchema = Type.Object(
  { code: Type.String(), reason: Type.String(), path: Type.Optional(Type.String()) },
  { additionalProperties: false },
);

export const EngineCapabilityMatrixSchema = Type.Object(
  {
    schemaVersion: Type.Literal("engine-capabilities.v0.1"),
    available: Type.Array(Type.String()),
    blocked: Type.Array(EngineCapabilityBlockerSchema),
  },
  { $id: "https://gis-engine.dev/schemas/engine-capabilities.v0.1.schema.json", additionalProperties: false },
);

const NestedEngineCapabilityMatrixSchema = stripNestedIds(EngineCapabilityMatrixSchema);

export const EvidenceRecordSchema = Type.Object(
  {
    schemaVersion: Type.Literal("evidence-record.v0.1"),
    recordId: Sha256,
    project: Type.Object(
      {
        id: Type.String({ minLength: 1 }),
        baseRevision: Type.String({ minLength: 1 }),
        revision: Type.String({ minLength: 1 }),
      },
      { additionalProperties: false },
    ),
    origin: Type.Object(
      {
        actor: Type.String({ minLength: 1 }),
        providerKind: Type.String({ minLength: 1 }),
        promptHash: Type.Optional(Sha256),
        planHash: Type.Optional(Sha256),
      },
      { additionalProperties: false },
    ),
    commands: Type.Array(
      Type.Object(
        {
          command: NestedMapCommandSchema,
          outcome: Type.Union([Type.Literal("applied"), Type.Literal("skipped"), Type.Literal("failed")]),
          diagnostics: Type.Array(NestedDiagnosticSchema),
          inversePatchHash: Sha256,
          baseRevision: Type.Optional(Type.String()),
          nextRevision: Type.Optional(Type.String()),
        },
        { additionalProperties: false },
      ),
      { minItems: 1 },
    ),
    spec: Type.Object({ beforeHash: Sha256, afterHash: Sha256, diffHash: Sha256 }, { additionalProperties: false }),
    artifacts: Type.Array(
      Type.Object(
        {
          path: Type.String({ minLength: 1 }),
          role: Type.String({ minLength: 1 }),
          bytes: Type.Integer({ minimum: 0 }),
          sha256: Sha256,
        },
        { additionalProperties: false },
      ),
      { minItems: 1 },
    ),
    capabilities: NestedEngineCapabilityMatrixSchema,
    toolchain: Type.Object(
      {
        engineVersion: Type.String({ minLength: 1 }),
        nodeMajor: Type.String({ minLength: 1 }),
        pnpmVersion: Type.String({ minLength: 1 }),
      },
      { additionalProperties: false },
    ),
    issuedAt: Iso8601Utc,
    issuer: Type.String({ minLength: 1 }),
    exclusions: Type.Array(Type.Union([Type.Literal("VISUAL_CONSISTENCY"), Type.Literal("OFFLINE_REPLAY")]), {
      minItems: 1,
    }),
  },
  { $id: "https://gis-engine.dev/schemas/evidence-record.v0.1.schema.json", additionalProperties: false },
);

export type EvidenceRecordFromSchema = Static<typeof EvidenceRecordSchema>;
export type EngineCapabilityMatrixFromSchema = Static<typeof EngineCapabilityMatrixSchema>;
