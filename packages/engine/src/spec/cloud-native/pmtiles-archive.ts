import { type Static, Type } from "@sinclair/typebox";

/**
 * PMTiles archive metadata contract.
 * Defines the schema for PMTiles archive metadata validation.
 * Runtime parsing/query remains blocked -- this is a schema/policy contract only.
 */
export const PMTilesArchiveMetadataSchema = Type.Object(
  {
    /** PMTiles spec version (must be 3) */
    specVersion: Type.Union([Type.Literal(3), Type.Literal("3")]),
    /** Total archive byte size */
    archiveBytes: Type.Integer({ minimum: 0 }),
    /** Root directory byte offset */
    rootDirectoryOffset: Type.Integer({ minimum: 0 }),
    /** Root directory byte length */
    rootDirectoryLength: Type.Integer({ minimum: 0 }),
    /** Whether archive contains vector tiles */
    hasVectorTiles: Type.Boolean(),
    /** Whether archive contains raster tiles */
    hasRasterTiles: Type.Boolean(),
    /** Tile type: "vector" or "raster" */
    tileType: Type.Optional(Type.Union([Type.Literal("vector"), Type.Literal("raster")])),
    /** Minimum zoom level */
    minZoom: Type.Optional(Type.Integer({ minimum: 0, maximum: 30 })),
    /** Maximum zoom level */
    maxZoom: Type.Optional(Type.Integer({ minimum: 0, maximum: 30 })),
    /** Bounds [west, south, east, north] */
    bounds: Type.Optional(Type.Tuple([Type.Number(), Type.Number(), Type.Number(), Type.Number()])),
  },
  { $id: "PMTilesArchiveMetadata", additionalProperties: false },
);

export type PMTilesArchiveMetadata = Static<typeof PMTilesArchiveMetadataSchema>;

/**
 * PMTiles archive resource policy.
 * Defines byte/range budgets for archive access.
 */
export const PMTilesArchivePolicySchema = Type.Object(
  {
    /** Maximum archive byte size (default: 500MB) */
    maxArchiveBytes: Type.Optional(Type.Integer({ minimum: 0 })),
    /** Maximum root directory byte length (default: 16MB) */
    maxRootDirectoryBytes: Type.Optional(Type.Integer({ minimum: 0 })),
    /** Whether range requests are allowed */
    allowRangeRequests: Type.Optional(Type.Boolean()),
    /** Maximum number of range request segments */
    maxRangeSegments: Type.Optional(Type.Integer({ minimum: 1 })),
    /** Archive open timeout in ms */
    timeoutMs: Type.Optional(Type.Integer({ minimum: 1000 })),
  },
  { $id: "PMTilesArchivePolicy", additionalProperties: false },
);

export type PMTilesArchivePolicy = Static<typeof PMTilesArchivePolicySchema>;

export const defaultPMTilesArchivePolicy: PMTilesArchivePolicy = {
  maxArchiveBytes: 524_288_000,
  maxRootDirectoryBytes: 16_777_216,
  allowRangeRequests: true,
  maxRangeSegments: 8,
  timeoutMs: 30_000,
};
