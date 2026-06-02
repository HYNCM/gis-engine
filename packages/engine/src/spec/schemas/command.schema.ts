import { Type, type Static } from "@sinclair/typebox";
import { CapabilityRequestSchema, InteractionSpecSchema, LayerFilterSchema, LayerSpecSchema, SourceSpecSchema } from "./map-spec.schema.js";
import { SceneCameraSchema, SceneLayerSchema, SceneSourceSchema } from "./sceneview3d.schema.js";

const CommandBaseSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    version: Type.Literal("0.1"),
    baseRevision: Type.Optional(Type.String()),
    author: Type.Optional(
      Type.Object(
        {
          type: Type.Union([Type.Literal("human"), Type.Literal("agent"), Type.Literal("system")]),
          id: Type.Optional(Type.String()),
          name: Type.Optional(Type.String())
        },
        { additionalProperties: false }
      )
    ),
    reason: Type.Optional(Type.String()),
    createdAt: Type.Optional(Type.String()),
    sourcePromptHash: Type.Optional(Type.String()),
    dryRun: Type.Optional(Type.Boolean())
  },
  { additionalProperties: false }
);

const JsonValueSchema = Type.Unknown();

const PaintLayoutSchema = Type.Record(Type.String(), JsonValueSchema);

export const MapCommandSchema = Type.Union([
  Type.Composite([CommandBaseSchema, Type.Object({ type: Type.Literal("addSource"), sourceId: Type.String(), source: SourceSpecSchema })], {
    additionalProperties: false
  }),
  Type.Composite([CommandBaseSchema, Type.Object({ type: Type.Literal("removeSource"), sourceId: Type.String() })], {
    additionalProperties: false
  }),
  Type.Composite([
    CommandBaseSchema,
    Type.Object({ type: Type.Literal("addLayer"), layer: LayerSpecSchema, beforeLayerId: Type.Optional(Type.String()) })
  ], { additionalProperties: false }),
  Type.Composite([CommandBaseSchema, Type.Object({ type: Type.Literal("removeLayer"), layerId: Type.String() })], {
    additionalProperties: false
  }),
  Type.Composite([CommandBaseSchema, Type.Object({ type: Type.Literal("setPaint"), layerId: Type.String(), paint: PaintLayoutSchema })], {
    additionalProperties: false
  }),
  Type.Composite([CommandBaseSchema, Type.Object({ type: Type.Literal("setLayout"), layerId: Type.String(), layout: PaintLayoutSchema })], {
    additionalProperties: false
  }),
  Type.Composite([
    CommandBaseSchema,
    Type.Object({ type: Type.Literal("setFilter"), layerId: Type.String(), filter: Type.Union([LayerFilterSchema, Type.Null()]) })
  ], { additionalProperties: false }),
  Type.Composite([
    CommandBaseSchema,
    Type.Object({
      type: Type.Literal("setLayerZoomRange"),
      layerId: Type.String(),
      minzoom: Type.Number({ minimum: 0, maximum: 24 }),
      maxzoom: Type.Number({ minimum: 0, maximum: 24 })
    })
  ], { additionalProperties: false }),
  Type.Composite([
    CommandBaseSchema,
    Type.Object({ type: Type.Literal("reorderLayer"), layerId: Type.String(), beforeLayerId: Type.Optional(Type.String()) })
  ], { additionalProperties: false }),
  Type.Composite([
    CommandBaseSchema,
    Type.Object({
      type: Type.Literal("setView"),
      view: Type.Partial(
        Type.Object(
          {
            mode: Type.Optional(Type.Union([Type.Literal("map2d"), Type.Literal("map2_5d"), Type.Literal("scene3d")])),
            center: Type.Optional(Type.Tuple([Type.Number(), Type.Number()])),
            zoom: Type.Optional(Type.Number()),
            bearing: Type.Optional(Type.Number()),
            pitch: Type.Optional(Type.Number()),
            bounds: Type.Optional(Type.Tuple([Type.Number(), Type.Number(), Type.Number(), Type.Number()]))
          },
          { additionalProperties: false }
        )
      )
    })
  ], { additionalProperties: false }),
  Type.Composite([CommandBaseSchema, Type.Object({ type: Type.Literal("setCapabilities"), capabilities: CapabilityRequestSchema })], {
    additionalProperties: false
  }),
  Type.Composite([CommandBaseSchema, Type.Object({ type: Type.Literal("setInteractions"), interactions: InteractionSpecSchema })], {
    additionalProperties: false
  }),
  Type.Composite([
    CommandBaseSchema,
    Type.Object({
      type: Type.Literal("fitBounds"),
      bounds: Type.Tuple([Type.Number(), Type.Number(), Type.Number(), Type.Number()]),
      padding: Type.Optional(Type.Number())
    })
  ], { additionalProperties: false }),
  Type.Composite([CommandBaseSchema, Type.Object({ type: Type.Literal("setSceneCamera"), camera: SceneCameraSchema })], {
    additionalProperties: false
  }),
  Type.Composite([CommandBaseSchema, Type.Object({ type: Type.Literal("addSceneSource"), sourceId: Type.String(), source: SceneSourceSchema })], {
    additionalProperties: false
  }),
  Type.Composite([CommandBaseSchema, Type.Object({ type: Type.Literal("removeSceneSource"), sourceId: Type.String() })], {
    additionalProperties: false
  }),
  Type.Composite([CommandBaseSchema, Type.Object({ type: Type.Literal("addSceneLayer"), layer: SceneLayerSchema })], {
    additionalProperties: false
  }),
  Type.Composite([CommandBaseSchema, Type.Object({ type: Type.Literal("removeSceneLayer"), layerId: Type.String() })], {
    additionalProperties: false
  }),
  Type.Composite([
    CommandBaseSchema,
    Type.Object({ type: Type.Literal("setSceneLayerVisibility"), layerId: Type.String(), visible: Type.Boolean() })
  ], { additionalProperties: false })
], {
  $id: "https://gis-engine.dev/schemas/commands.v0.1.schema.json"
});

export type MapCommandFromSchema = Static<typeof MapCommandSchema>;
