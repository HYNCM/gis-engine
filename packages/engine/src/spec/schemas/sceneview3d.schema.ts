import { type Static, Type } from "@sinclair/typebox";

const SceneVector3Schema = Type.Tuple([Type.Number(), Type.Number(), Type.Number()]);
const ScenePositionSchema = SceneVector3Schema;

export const SceneCameraSchema = Type.Object(
  {
    type: Type.Optional(Type.Literal("perspective")),
    position: ScenePositionSchema,
    target: ScenePositionSchema,
    up: Type.Optional(SceneVector3Schema),
    fov: Type.Optional(Type.Number({ exclusiveMinimum: 0, exclusiveMaximum: 180 })),
    near: Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
    far: Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
  },
  { additionalProperties: false },
);

const SceneAmbientLightSchema = Type.Object(
  {
    type: Type.Literal("ambient"),
    intensity: Type.Optional(Type.Number({ minimum: 0 })),
  },
  { additionalProperties: false },
);

const SceneDirectionalLightSchema = Type.Object(
  {
    type: Type.Literal("directional"),
    direction: SceneVector3Schema,
    intensity: Type.Optional(Type.Number({ minimum: 0 })),
  },
  { additionalProperties: false },
);

export const SceneLightSchema = Type.Union([SceneAmbientLightSchema, SceneDirectionalLightSchema]);

export const SceneDepthOptionsSchema = Type.Object(
  {
    enabled: Type.Optional(Type.Boolean()),
    mode: Type.Optional(Type.Union([Type.Literal("standard"), Type.Literal("logarithmic")])),
    clearColor: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const SceneTransformSchema = Type.Object(
  {
    translate: Type.Optional(SceneVector3Schema),
    rotate: Type.Optional(SceneVector3Schema),
    scale: Type.Optional(Type.Union([Type.Number({ exclusiveMinimum: 0 }), SceneVector3Schema])),
  },
  { additionalProperties: false },
);

export const SceneTerrainSchema = Type.Object(
  {
    source: Type.String({ minLength: 1 }),
    exaggeration: Type.Optional(Type.Number({ minimum: 0 })),
  },
  { additionalProperties: false },
);

const TerrainRasterDemSourceSchema = Type.Object(
  {
    type: Type.Literal("terrain-raster-dem"),
    url: Type.String({ minLength: 1 }),
    encoding: Type.Optional(Type.Union([Type.Literal("mapbox"), Type.Literal("terrarium")])),
    attribution: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

const Tileset3dSourceSchema = Type.Object(
  {
    type: Type.Literal("3d-tiles"),
    url: Type.String({ minLength: 1 }),
    maximumScreenSpaceError: Type.Optional(Type.Number({ minimum: 0 })),
    attribution: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

const GltfSourceSchema = Type.Object(
  {
    type: Type.Literal("gltf"),
    url: Type.String({ minLength: 1 }),
    transform: Type.Optional(SceneTransformSchema),
    attribution: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const SceneSourceSchema = Type.Union([TerrainRasterDemSourceSchema, Tileset3dSourceSchema, GltfSourceSchema]);

const SceneTerrainLayerSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    type: Type.Literal("terrain"),
    source: Type.String({ minLength: 1 }),
    visible: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);

const SceneTileset3dLayerSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    type: Type.Literal("tileset3d"),
    source: Type.String({ minLength: 1 }),
    visible: Type.Optional(Type.Boolean()),
    pickable: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);

const SceneModelLayerSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    type: Type.Literal("model"),
    source: Type.String({ minLength: 1 }),
    visible: Type.Optional(Type.Boolean()),
    pickable: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);

export const SceneLayerSchema = Type.Union([SceneTerrainLayerSchema, SceneTileset3dLayerSchema, SceneModelLayerSchema]);

export const SceneSnapshotOptionsSchema = Type.Object(
  {
    width: Type.Optional(Type.Integer({ minimum: 1 })),
    height: Type.Optional(Type.Integer({ minimum: 1 })),
    pixelRatio: Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
    format: Type.Optional(Type.Union([Type.Literal("png"), Type.Literal("data-url")])),
    requireLoadedResources: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);

export const SceneResourcePolicySchema = Type.Object(
  {
    allowRelativeUrls: Type.Optional(Type.Boolean()),
    allowedSchemes: Type.Optional(Type.Array(Type.Union([Type.Literal("http:"), Type.Literal("https:")]))),
    allowedHosts: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
    allowedPathPrefixes: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
    maxTilesetJsonBytes: Type.Optional(Type.Integer({ minimum: 1 })),
    maxModelBytes: Type.Optional(Type.Integer({ minimum: 1 })),
    maxTextureCount: Type.Optional(Type.Integer({ minimum: 0 })),
    maxTextureBytes: Type.Optional(Type.Integer({ minimum: 1 })),
    maxWorkers: Type.Optional(Type.Integer({ minimum: 0 })),
    timeoutMs: Type.Optional(Type.Integer({ minimum: 1 })),
    retryCount: Type.Optional(Type.Integer({ minimum: 0 })),
  },
  { additionalProperties: false },
);

export const SceneView3DExtensionSchema = Type.Object(
  {
    camera: SceneCameraSchema,
    lights: Type.Optional(Type.Array(SceneLightSchema)),
    depth: Type.Optional(SceneDepthOptionsSchema),
    terrain: Type.Optional(SceneTerrainSchema),
    sources: Type.Optional(Type.Record(Type.String({ minLength: 1 }), SceneSourceSchema)),
    layers: Type.Optional(Type.Array(SceneLayerSchema)),
    snapshot: Type.Optional(SceneSnapshotOptionsSchema),
    resourcePolicy: Type.Optional(SceneResourcePolicySchema),
  },
  {
    $id: "https://gis-engine.dev/schemas/sceneview3d.v1.schema.json",
    additionalProperties: false,
  },
);

export type SceneView3DExtensionFromSchema = Static<typeof SceneView3DExtensionSchema>;
