import { type Static, Type } from "@sinclair/typebox";

const GeoTiffBandSchema = Type.Object(
  {
    index: Type.Integer({ minimum: 1 }),
    name: Type.Optional(Type.String({ minLength: 1 })),
    dataType: Type.Optional(
      Type.Union([
        Type.Literal("uint8"),
        Type.Literal("uint16"),
        Type.Literal("uint32"),
        Type.Literal("int8"),
        Type.Literal("int16"),
        Type.Literal("int32"),
        Type.Literal("float32"),
        Type.Literal("float64"),
      ]),
    ),
    noData: Type.Optional(Type.Number()),
  },
  { additionalProperties: false },
);

const GeoTiffSourceProperties = {
  type: Type.Literal("geotiff"),
  /** URL to the GeoTIFF file */
  url: Type.String({ minLength: 1 }),
  /** CRS metadata */
  crs: Type.Optional(
    Type.Object(
      {
        /** CRS authority code, e.g. "EPSG:4326" */
        authority: Type.Optional(Type.String()),
        /** CRS code, e.g. "4326" */
        code: Type.Optional(Type.String()),
        /** CRS WKT (for custom projections) */
        wkt: Type.Optional(Type.String()),
      },
      { additionalProperties: false },
    ),
  ),
  /** Bounding box [west, south, east, north] */
  bbox: Type.Optional(Type.Tuple([Type.Number(), Type.Number(), Type.Number(), Type.Number()])),
  /** Raster width in pixels */
  width: Type.Optional(Type.Integer({ minimum: 1 })),
  /** Raster height in pixels */
  height: Type.Optional(Type.Integer({ minimum: 1 })),
  /** Number of raster bands */
  bandCount: Type.Optional(Type.Integer({ minimum: 1 })),
  /** Optional band metadata for diagnostics */
  bands: Type.Optional(Type.Array(GeoTiffBandSchema, { minItems: 1 })),
  /** File byte size */
  fileBytes: Type.Optional(Type.Integer({ minimum: 0 })),
} as const;

function createGeoTiffSourceSchema(id?: string) {
  return Type.Object(GeoTiffSourceProperties, {
    ...(id ? { $id: id } : {}),
    additionalProperties: false,
  });
}

/**
 * GeoTIFF source schema contract.
 * Defines metadata for GeoTIFF sources.
 * Runtime loading, decoding, sampling, and query remain blocked.
 */
export const GeoTiffSourceSchema = createGeoTiffSourceSchema("GeoTiffSourceSpec");

/**
 * GeoTIFF schema variant without an `$id` for embedding inside MapSpecSchema.
 */
export const GeoTiffSourceSchemaForMapSpec = createGeoTiffSourceSchema();

export type GeoTiffSourceSpec = Static<typeof GeoTiffSourceSchema>;

/**
 * GeoTIFF resource policy.
 */
export const GeoTiffPolicySchema = Type.Object(
  {
    maxFileBytes: Type.Optional(Type.Integer({ minimum: 0 })),
    maxPixels: Type.Optional(Type.Integer({ minimum: 0 })),
    maxBandCount: Type.Optional(Type.Integer({ minimum: 1 })),
    requireCrs: Type.Optional(Type.Boolean()),
    requireNoData: Type.Optional(Type.Boolean()),
    allowRemoteUrls: Type.Optional(Type.Boolean()),
    timeoutMs: Type.Optional(Type.Integer({ minimum: 1000 })),
    workerBudget: Type.Optional(Type.Integer({ minimum: 0, maximum: 4 })),
  },
  { $id: "GeoTiffPolicy", additionalProperties: false },
);

export type GeoTiffPolicy = Static<typeof GeoTiffPolicySchema>;

export const defaultGeoTiffPolicy: GeoTiffPolicy = {
  maxFileBytes: 536_870_912,
  maxPixels: 100_000_000,
  maxBandCount: 16,
  requireCrs: true,
  requireNoData: false,
  allowRemoteUrls: false,
  timeoutMs: 60_000,
  workerBudget: 0,
};
