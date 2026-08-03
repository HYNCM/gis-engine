import { type Static, Type } from "@sinclair/typebox";

export const GeoParquetProjJsonCrsTypeValues = [
  "BoundCRS",
  "CompoundCRS",
  "DerivedEngineeringCRS",
  "DerivedGeodeticCRS",
  "DerivedGeographicCRS",
  "DerivedParametricCRS",
  "DerivedProjectedCRS",
  "DerivedTemporalCRS",
  "DerivedVerticalCRS",
  "EngineeringCRS",
  "GeodeticCRS",
  "GeographicCRS",
  "ParametricCRS",
  "ProjectedCRS",
  "TemporalCRS",
  "VerticalCRS",
] as const;

const GeoParquetProjJsonCrsTypeSchema = Type.Union(GeoParquetProjJsonCrsTypeValues.map((value) => Type.Literal(value)));

export const GeoParquetProjJsonCrsSchema = Type.Object(
  {
    $schema: Type.Optional(Type.String({ minLength: 1 })),
    type: GeoParquetProjJsonCrsTypeSchema,
    name: Type.String({ minLength: 1 }),
  },
  { additionalProperties: true },
);

const ProjJsonSchema = Type.Union([GeoParquetProjJsonCrsSchema, Type.Null()]);

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
        bbox: Type.Literal(true),
        geometryTypes: Type.Literal(true),
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

const geoParquetProjJsonCrsTypes = new Set<string>(GeoParquetProjJsonCrsTypeValues);

/** Minimal inline PROJJSON CRS shape needed for metadata-readiness evidence. */
export function isGeoParquetProjJsonCrs(value: unknown): value is Static<typeof GeoParquetProjJsonCrsSchema> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.type === "string" &&
    geoParquetProjJsonCrsTypes.has(record.type) &&
    typeof record.name === "string" &&
    record.name.length > 0 &&
    (record.$schema === undefined || (typeof record.$schema === "string" && record.$schema.length > 0))
  );
}

/** GeoParquet bbox evidence is dimensional, not implicitly geographic. */
export function isGeoParquetBbox(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    (value.length === 4 || value.length === 6 || value.length === 8) &&
    value.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate))
  );
}

/** GeoParquet 2.0 RC row-group statistics must be explicit capability evidence. */
export function hasGeoParquet20Rc1RowGroupStatistics(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    Object.keys(record).every((key) => key === "bbox" || key === "geometryTypes") &&
    record.bbox === true &&
    record.geometryTypes === true
  );
}

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
