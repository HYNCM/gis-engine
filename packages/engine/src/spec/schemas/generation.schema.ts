import { Type, type Static } from "@sinclair/typebox";
import { MapCommandSchema } from "./command.schema.js";
import { DiagnosticSchema } from "./diagnostics.schema.js";
import {
  CapabilityRequestSchema,
  InteractionSpecSchema,
  LayerSpecSchema,
  MapSpecSchema,
  SourceSpecSchema,
  ViewSpecSchema
} from "./map-spec.schema.js";
import { SceneView3DExtensionSchema } from "./sceneview3d.schema.js";

const NestedDiagnosticSchema = stripNestedIds(DiagnosticSchema);
const NestedMapCommandSchema = stripNestedIds(MapCommandSchema);
const NestedMapSpecSchema = stripNestedIds(MapSpecSchema);
const NestedSceneView3DExtensionSchema = stripNestedIds(SceneView3DExtensionSchema);

export const MapGenerationTargetDomainSchema = Type.Union([
  Type.Literal("feature-display"),
  Type.Literal("spatial-analysis"),
  Type.Literal("scene-browsing")
]);

export const MapGenerationAnalysisOperationSchema = Type.Union([
  Type.Literal("point-query"),
  Type.Literal("bbox-query"),
  Type.Literal("buffer"),
  Type.Literal("intersection"),
  Type.Literal("overlay"),
  Type.Literal("routing"),
  Type.Literal("aggregation")
]);

const PaintLayoutSchema = Type.Record(Type.String(), Type.Unknown());

const MapGenerationStyleEditSchema = Type.Object(
  {
    layerId: Type.String({ minLength: 1 }),
    paint: Type.Optional(PaintLayoutSchema),
    layout: Type.Optional(PaintLayoutSchema)
  },
  { additionalProperties: false }
);

const MapGenerationAnalysisRequestSchema = Type.Object(
  {
    operations: Type.Array(MapGenerationAnalysisOperationSchema, { minItems: 1 })
  },
  { additionalProperties: false }
);

export const MapGenerationRequestSchema = Type.Object(
  {
    mapId: Type.Optional(Type.String({ minLength: 1 })),
    promptHash: Type.Optional(Type.String({ minLength: 1 })),
    createdAt: Type.Optional(Type.String({ minLength: 1 })),
    traceId: Type.Optional(Type.String({ minLength: 1 })),
    targetDomains: Type.Optional(Type.Array(MapGenerationTargetDomainSchema, { minItems: 1 })),
    baseSpec: Type.Optional(NestedMapSpecSchema),
    capabilities: Type.Optional(CapabilityRequestSchema),
    view: Type.Optional(ViewSpecSchema),
    sources: Type.Optional(Type.Record(Type.String(), SourceSpecSchema)),
    layers: Type.Optional(Type.Array(LayerSpecSchema)),
    styleEdits: Type.Optional(Type.Array(MapGenerationStyleEditSchema)),
    interactions: Type.Optional(InteractionSpecSchema),
    analysis: Type.Optional(MapGenerationAnalysisRequestSchema),
    scene3d: Type.Optional(NestedSceneView3DExtensionSchema)
  },
  {
    $id: "https://gis-engine.dev/schemas/map-generation-request.v0.1.schema.json",
    additionalProperties: false
  }
);

export const MapGenerationCommandSkeletonSchema = Type.Object(
  {
    status: Type.Union([Type.Literal("ready"), Type.Literal("blocked")]),
    targetDomains: Type.Array(MapGenerationTargetDomainSchema),
    baseSpec: NestedMapSpecSchema,
    spec: NestedMapSpecSchema,
    commands: Type.Array(NestedMapCommandSchema),
    diagnostics: Type.Array(NestedDiagnosticSchema),
    traceId: Type.String({ minLength: 1 })
  },
  {
    $id: "https://gis-engine.dev/schemas/map-generation-command-skeleton.v0.1.schema.json",
    additionalProperties: false
  }
);

export type MapGenerationTargetDomain = Static<typeof MapGenerationTargetDomainSchema>;
export type MapGenerationAnalysisOperation = Static<typeof MapGenerationAnalysisOperationSchema>;
export type MapGenerationRequestFromSchema = Static<typeof MapGenerationRequestSchema>;
export type MapGenerationCommandSkeletonFromSchema = Static<typeof MapGenerationCommandSkeletonSchema>;

function stripNestedIds<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripNestedIds) as T;
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "$id").map(([key, entry]) => [key, stripNestedIds(entry)])) as T;
}
