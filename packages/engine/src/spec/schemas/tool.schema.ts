import { Type, type Static } from "@sinclair/typebox";
import { MapCommandSchema } from "./command.schema.js";
import { MapSpecSchema } from "./map-spec.schema.js";

export const ApplyCommandsToolInputSchema = Type.Object(
  {
    spec: MapSpecSchema,
    commands: Type.Array(MapCommandSchema),
    dryRun: Type.Optional(Type.Boolean()),
    transaction: Type.Optional(Type.Union([Type.Literal("atomic"), Type.Literal("best-effort")])),
    collectTrace: Type.Optional(Type.Boolean()),
    traceId: Type.Optional(Type.String({ minLength: 1 }))
  },
  {
    $id: "https://gis-engine.dev/schemas/ai-tools.v0.1.schema.json",
    additionalProperties: false
  }
);

export type ApplyCommandsToolInput = Static<typeof ApplyCommandsToolInputSchema>;
