import { type Static, Type } from "@sinclair/typebox";

const FlatGeobufSourceProperties = {
  type: Type.Literal("flatgeobuf"),
  url: Type.String({ minLength: 1 }),
  /** Whether the file has a spatial index */
  hasIndex: Type.Optional(Type.Boolean()),
  /** Feature count metadata */
  featureCount: Type.Optional(Type.Integer({ minimum: 0 })),
  /** Bounding box [west, south, east, north] */
  bbox: Type.Optional(Type.Tuple([Type.Number(), Type.Number(), Type.Number(), Type.Number()])),
  /** Geometry type */
  geometryType: Type.Optional(
    Type.Union([
      Type.Literal("Point"),
      Type.Literal("LineString"),
      Type.Literal("Polygon"),
      Type.Literal("MultiPoint"),
      Type.Literal("MultiLineString"),
      Type.Literal("MultiPolygon"),
    ]),
  ),
  /** File byte size */
  fileBytes: Type.Optional(Type.Integer({ minimum: 0 })),
} as const;

function createFlatGeobufSourceSchema(id?: string) {
  return Type.Object(FlatGeobufSourceProperties, {
    ...(id ? { $id: id } : {}),
    additionalProperties: false,
  });
}

/**
 * FlatGeobuf source schema contract (stub).
 * Defines the metadata schema for FlatGeobuf sources.
 * Runtime loading/query remains blocked.
 */
export const FlatGeobufSourceSchema = createFlatGeobufSourceSchema("FlatGeobufSourceSpec");

/**
 * FlatGeobuf schema variant without an `$id` for embedding inside MapSpecSchema.
 */
export const FlatGeobufSourceSchemaForMapSpec = createFlatGeobufSourceSchema();

export type FlatGeobufSourceSpec = Static<typeof FlatGeobufSourceSchema>;

/**
 * FlatGeobuf resource policy.
 */
export const FlatGeobufPolicySchema = Type.Object(
  {
    maxFileBytes: Type.Optional(Type.Integer({ minimum: 0 })),
    maxFeatureCount: Type.Optional(Type.Integer({ minimum: 0 })),
    allowRangeRequests: Type.Optional(Type.Boolean()),
    indexRequired: Type.Optional(Type.Boolean()),
    timeoutMs: Type.Optional(Type.Integer({ minimum: 1000 })),
  },
  { $id: "FlatGeobufPolicy", additionalProperties: false },
);

export type FlatGeobufPolicy = Static<typeof FlatGeobufPolicySchema>;

export const defaultFlatGeobufPolicy: FlatGeobufPolicy = {
  maxFileBytes: 524_288_000,
  maxFeatureCount: 5_000_000,
  allowRangeRequests: true,
  indexRequired: false,
  timeoutMs: 30_000,
};
