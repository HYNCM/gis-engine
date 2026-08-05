# Migrating GeoParquet Versioned Metadata

The GeoParquet source contract now requires exact, versioned metadata evidence.
This is a breaking schema and TypeScript change for consumers that used the
earlier optional top-level `parquetVersion`, `encoding`, `crs`, or `bbox`
fields. The change does not add a parser, IO, worker, display, or query runtime:
GeoParquet runtime remains blocked and is still a No-go.

## MapSpec Source Migration

Replace inferred top-level fields:

```json
{
  "type": "geoparquet",
  "url": "./parcels.parquet",
  "parquetVersion": 1,
  "encoding": "geoarrow-point",
  "crs": { "authority": "EPSG", "code": "4326" },
  "bbox": [-123, 37, -122, 38]
}
```

with an exact GeoParquet 1.1 identity and inline PROJJSON CRS:

The required discriminator paths are `metadata.releaseIdentity` and
`metadata.geoVersion`; neither may be inferred from the other.

```json
{
  "type": "geoparquet",
  "url": "./parcels.parquet",
  "metadata": {
    "releaseIdentity": "1.1.0",
    "geoVersion": "1.1.0",
    "encoding": "point",
    "crs": {
      "$schema": "https://proj.org/schemas/v0.7/projjson.schema.json",
      "type": "GeographicCRS",
      "name": "WGS 84"
    },
    "bbox": [-123, 37, -122, 38]
  }
}
```

The 1.1 native encodings use the official names `point`, `linestring`,
`polygon`, `multipoint`, `multilinestring`, and `multipolygon`; the legacy
`geoarrow-*` aliases and `WKT` are not accepted. `WKB` remains accepted.

For the reviewed GeoParquet 2.0 RC boundary, use the release tag separately
from the embedded raw metadata version and provide positive capability
evidence:

```json
{
  "type": "geoparquet",
  "url": "./parcels-2.0-rc.1.parquet",
  "metadata": {
    "releaseIdentity": "2.0.0-rc.1",
    "geoVersion": "2.0.0",
    "encoding": "WKB",
    "logicalType": "GEOMETRY",
    "crs": null,
    "rowGroupStatistics": {
      "bbox": true,
      "geometryTypes": true
    }
  }
}
```

Do not infer `metadata.releaseIdentity` from `metadata.geoVersion`. Unsupported, missing,
mismatched, or mixed-version metadata fails closed with stable `GEOPARQUET.*`
diagnostics.

## CRS And Bbox Evidence

An inline CRS is either `null` or a PROJJSON CRS object with a recognized CRS
`type` and a nonempty `name`. Additional PROJJSON properties are retained.

GeoParquet 1.1 bbox accepts exactly 4 or 6 numbers.
GeoParquet 2.0 RC bbox accepts 4, 6, or 8 numbers.

Validation does not assume WGS84 bounds, coordinate order, or
minimum-before-maximum semantics: projected coordinates and an
antimeridian-crossing extent such as `[170, -10, -170, 10]` are valid metadata
evidence. Interpret coordinates only with the associated CRS and versioned
GeoParquet metadata.

## WASM Stub Type Migration

The exported `GeoParquetMetadata` stub no longer duplicates incompatible
`parquetVersion`, `encoding`, `crs`, and `bbox` fields. Read the same reviewed
schema-derived evidence through `sourceMetadata`:

```ts
import type { GeoParquetMetadata } from "@gis-engine/engine";

declare const result: GeoParquetMetadata;

const release = result.sourceMetadata.releaseIdentity;
const geoVersion = result.sourceMetadata.geoVersion;
const encoding = result.sourceMetadata.encoding;
const crs = result.sourceMetadata.crs;
```

This is type-level consistency for a future parser boundary. It is not runtime
implementation evidence: `GeoParquetWasmLoader` continues to return a blocked
readiness result and does not fetch or decode a Parquet file.
