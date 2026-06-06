import { type Static, Type } from "@sinclair/typebox";

/**
 * GeoParquet source schema contract.
 * Defines the metadata schema for GeoParquet sources.
 * Runtime loading/query remains blocked -- this is a schema/policy contract only.
 */
export const GeoParquetSourceSchema = Type.Object(
  {
    type: Type.Literal("geoparquet"),
    /** URL to the GeoParquet file */
    url: Type.String({ minLength: 1 }),
    /** CRS metadata */
    crs: Type.Optional(
      Type.Object({
        /** CRS authority code, e.g. "EPSG:4326" */
        authority: Type.Optional(Type.String()),
        /** CRS code, e.g. "4326" */
        code: Type.Optional(Type.String()),
        /** CRS WKT (for custom projections) */
        wkt: Type.Optional(Type.String()),
      }),
    ),
    /** Geometry encoding */
    encoding: Type.Optional(
      Type.Union([
        Type.Literal("WKB"),
        Type.Literal("WKT"),
        Type.Literal("geoarrow-point"),
        Type.Literal("geoarrow-linestring"),
        Type.Literal("geoarrow-polygon"),
        Type.Literal("geoarrow-multipoint"),
        Type.Literal("geoarrow-multilinestring"),
        Type.Literal("geoarrow-multipolygon"),
      ]),
    ),
    /** Bounding box [west, south, east, north] */
    bbox: Type.Optional(Type.Tuple([Type.Number(), Type.Number(), Type.Number(), Type.Number()])),
    /** Row count metadata */
    rowCount: Type.Optional(Type.Integer({ minimum: 0 })),
    /** File byte size */
    fileBytes: Type.Optional(Type.Integer({ minimum: 0 })),
    /** Parquet schema version */
    parquetVersion: Type.Optional(Type.Union([Type.Literal(1), Type.Literal(2)])),
  },
  { $id: "GeoParquetSourceSpec", additionalProperties: false },
);

export type GeoParquetSourceSpec = Static<typeof GeoParquetSourceSchema>;

/**
 * GeoParquet resource policy.
 */
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
