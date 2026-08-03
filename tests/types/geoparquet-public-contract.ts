import type {
  GeoParquetGeometryEncoding,
  GeoParquetMetadata,
  GeoParquetSourceMetadata,
} from "../../packages/engine/src/index.js";

const sourceMetadata = {
  releaseIdentity: "1.1.0",
  geoVersion: "1.1.0",
  encoding: "point",
  crs: {
    type: "GeographicCRS",
    name: "WGS 84",
  },
  bbox: [170, -10, -170, 10],
} as const satisfies GeoParquetSourceMetadata;

const publicMetadata = {
  rowCount: 1,
  columnCount: 2,
  columns: [{ name: "geometry", type: "binary", nullable: false, isGeometry: true }],
  geometryColumn: "geometry",
  sourceMetadata,
} satisfies GeoParquetMetadata;

const encoding: GeoParquetGeometryEncoding = publicMetadata.sourceMetadata.encoding;
void encoding;
