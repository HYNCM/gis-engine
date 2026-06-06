import { type Static, Type } from "@sinclair/typebox";
import { DiagnosticCodes, Scene3DStableRuntimeBlockerCodes } from "../../diagnostics/codes.js";

const DiagnosticCodeSchema = Type.Union(Object.values(DiagnosticCodes).map((code) => Type.Literal(code)));

const JsonPatchOperationSchema = Type.Object(
  {
    op: Type.Union([Type.Literal("add"), Type.Literal("remove"), Type.Literal("replace")]),
    path: Type.String(),
    value: Type.Optional(Type.Unknown()),
  },
  { additionalProperties: false },
);

export const DiagnosticSchema = Type.Object(
  {
    severity: Type.Union([Type.Literal("error"), Type.Literal("warning"), Type.Literal("info")]),
    code: DiagnosticCodeSchema,
    blockerCode: Type.Optional(
      Type.Union(Object.values(Scene3DStableRuntimeBlockerCodes).map((code) => Type.Literal(code))),
    ),
    message: Type.String(),
    path: Type.Optional(Type.String()),
    relatedResources: Type.Optional(
      Type.Array(
        Type.Object(
          {
            kind: Type.Union([
              Type.Literal("source"),
              Type.Literal("layer"),
              Type.Literal("command"),
              Type.Literal("url"),
              Type.Literal("schema"),
              Type.Literal("adapter"),
            ]),
            id: Type.Optional(Type.String()),
            path: Type.Optional(Type.String()),
          },
          { additionalProperties: false },
        ),
      ),
    ),
    fix: Type.Optional(
      Type.Object(
        {
          kind: Type.Union([Type.Literal("json-patch"), Type.Literal("command"), Type.Literal("manual")]),
          confidence: Type.Union([Type.Literal("high"), Type.Literal("medium"), Type.Literal("low")]),
          message: Type.String(),
          patch: Type.Optional(Type.Array(JsonPatchOperationSchema)),
          command: Type.Optional(Type.Unknown()),
        },
        { additionalProperties: false },
      ),
    ),
  },
  {
    $id: "https://gis-engine.dev/schemas/diagnostics.v0.1.schema.json",
    additionalProperties: false,
  },
);

export type DiagnosticFromSchema = Static<typeof DiagnosticSchema>;
