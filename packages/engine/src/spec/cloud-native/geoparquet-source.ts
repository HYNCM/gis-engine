import { type Static, Type } from "@sinclair/typebox";

const ProjJsonSchema = Type.Union([
  Type.Record(Type.String({ minLength: 1 }), Type.Unknown(), { minProperties: 1 }),
  Type.Null(),
]);

const Bbox2dSchema = Type.Tuple([Type.Number(), Type.Number(), Type.Number(), Type.Number()]);
const Bbox3dSchema = Type.Tuple([
  Type.Number(),
  Type.Number(),
  Type.Number(),
  Type.Number(),
  Type.Number(),
  Type.Number(),
]);
const Bbox3dMeasuredSchema = Type.Tuple([
  Type.Number(),
  Type.Number(),
  Type.Number(),
  Type.Number(),
  Type.Number(),
  Type.Number(),
  Type.Number(),
  Type.Number(),
]);

const GeoParquet11EncodingSchema = Type.Union([
  Type.Literal("WKB"),
  Type.Literal("point"),
  Type.Literal("linestring"),
  Type.Literal("polygon"),
  Type.Literal("multipoint"),
  Type.Literal("multilinestring"),
  Type.Literal("multipolygon"),
]);

const GeoParquetCoveringSchema = Type.Object(
  {
    bbox: Type.Object(
      {
        xmin: Type.Tuple([Type.String({ minLength: 1 }), Type.Literal("xmin")]),
        xmax: Type.Tuple([Type.String({ minLength: 1 }), Type.Literal("xmax")]),
        ymin: Type.Tuple([Type.String({ minLength: 1 }), Type.Literal("ymin")]),
        ymax: Type.Tuple([Type.String({ minLength: 1 }), Type.Literal("ymax")]),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const GeoParquet11MetadataSchema = Type.Object(
  {
    releaseIdentity: Type.Literal("1.1.0"),
    geoVersion: Type.Literal("1.1.0"),
    encoding: GeoParquet11EncodingSchema,
    crs: Type.Optional(ProjJsonSchema),
    bbox: Type.Optional(Type.Union([Bbox2dSchema, Bbox3dSchema])),
    covering: Type.Optional(GeoParquetCoveringSchema),
  },
  { additionalProperties: false },
);

export const GeoParquet20Rc1MetadataSchema = Type.Object(
  {
    releaseIdentity: Type.Literal("2.0.0-rc.1"),
    geoVersion: Type.Literal("2.0.0"),
    encoding: Type.Literal("WKB"),
    logicalType: Type.Union([Type.Literal("GEOMETRY"), Type.Literal("GEOGRAPHY")]),
    crs: Type.Optional(ProjJsonSchema),
    bbox: Type.Optional(Type.Union([Bbox2dSchema, Bbox3dSchema, Bbox3dMeasuredSchema])),
    rowGroupStatistics: Type.Object(
      {
        bbox: Type.Boolean(),
        geometryTypes: Type.Boolean(),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const GeoParquetSourceMetadataSchema = Type.Union([GeoParquet11MetadataSchema, GeoParquet20Rc1MetadataSchema]);

const GeoParquetSourceProperties = {
  type: Type.Literal("geoparquet"),
  /** URL is policy-validated, but this metadata-only boundary never fetches it. */
  url: Type.String({ minLength: 1 }),
  /** Exact readiness release identity and version-specific metadata evidence. */
  metadata: GeoParquetSourceMetadataSchema,
  /** Row count metadata. */
  rowCount: Type.Optional(Type.Integer({ minimum: 0 })),
  /** File byte size metadata. */
  fileBytes: Type.Optional(Type.Integer({ minimum: 0 })),
} as const;

function createGeoParquetSourceSchema(id?: string) {
  return Type.Object(GeoParquetSourceProperties, {
    ...(id ? { $id: id } : {}),
    additionalProperties: false,
  });
}

/**
 * Version-aware GeoParquet metadata-readiness contract.
 * Runtime loading/query remains blocked; this schema never implies parser support.
 */
export const GeoParquetSourceSchema = createGeoParquetSourceSchema("GeoParquetSourceSpec");

/** GeoParquet schema variant without an `$id` for embedding inside MapSpecSchema. */
export const GeoParquetSourceSchemaForMapSpec = createGeoParquetSourceSchema();

export type GeoParquet11Metadata = Static<typeof GeoParquet11MetadataSchema>;
export type GeoParquet20Rc1Metadata = Static<typeof GeoParquet20Rc1MetadataSchema>;
export type GeoParquetSourceMetadata = Static<typeof GeoParquetSourceMetadataSchema>;
export type GeoParquetSourceSpec = Static<typeof GeoParquetSourceSchema>;

/** GeoParquet resource policy. */
export const GeoParquetPolicySchema = Type.Object(
  {
    maxFileBytes: Type.Optional(Type.Integer({ minimum: 0 })),
    maxRowCount: Type.Optional(Type.Integer({ minimum: 0 })),
    allowRemoteUrls: Type.Optional(Type.Boolean()),
    timeoutMs: Type.Optional(Type.Integer({ minimum: 1000 })),
    workerBudget: Type.Optional(Type.Integer({ minimum: 0, maximum: 4 })),
  },
  { $id: "GeoParquetPolicy", additionalProperties: false },
);

export type GeoParquetPolicy = Static<typeof GeoParquetPolicySchema>;

export const defaultGeoParquetPolicy: GeoParquetPolicy = {
  maxFileBytes: 1_073_741_824,
  maxRowCount: 10_000_000,
  allowRemoteUrls: false,
  timeoutMs: 60_000,
  workerBudget: 2,
};
