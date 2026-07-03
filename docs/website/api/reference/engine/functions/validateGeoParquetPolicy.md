[**@gis-engine/engine v1.4.0**](../index.md)

***

# Function: validateGeoParquetPolicy()

> **validateGeoParquetPolicy**(`source`, `policy?`, `sourceId?`): [`Diagnostic`](../interfaces/Diagnostic.md)[]

Validate GeoParquet source metadata against policy.
Returns diagnostics without performing any IO.
Runtime loading/query remains blocked -- this validates metadata only.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `source` | \{ `type`: `"geoparquet"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `encoding?`: `"WKB"` \| `"WKT"` \| `"geoarrow-point"` \| `"geoarrow-linestring"` \| `"geoarrow-polygon"` \| `"geoarrow-multipoint"` \| `"geoarrow-multilinestring"` \| `"geoarrow-multipolygon"`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `rowCount?`: `number`; `fileBytes?`: `number`; `parquetVersion?`: `2` \| `1`; \} | `undefined` | - |
| `source.type` | `"geoparquet"` | `...` | - |
| `source.url` | `string` | `...` | URL to the GeoParquet file |
| `source.crs?` | \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \} | `...` | CRS metadata |
| `source.crs.authority?` | `string` | `...` | CRS authority code, e.g. "EPSG:4326" |
| `source.crs.code?` | `string` | `...` | CRS code, e.g. "4326" |
| `source.crs.wkt?` | `string` | `...` | CRS WKT (for custom projections) |
| `source.encoding?` | `"WKB"` \| `"WKT"` \| `"geoarrow-point"` \| `"geoarrow-linestring"` \| `"geoarrow-polygon"` \| `"geoarrow-multipoint"` \| `"geoarrow-multilinestring"` \| `"geoarrow-multipolygon"` | `...` | Geometry encoding |
| `source.bbox?` | \[`number`, `number`, `number`, `number`\] | `...` | Bounding box [west, south, east, north] |
| `source.rowCount?` | `number` | `...` | Row count metadata |
| `source.fileBytes?` | `number` | `...` | File byte size |
| `source.parquetVersion?` | `2` \| `1` | `...` | Parquet schema version |
| `policy` | \{ `maxFileBytes?`: `number`; `maxRowCount?`: `number`; `allowRemoteUrls?`: `boolean`; `timeoutMs?`: `number`; `workerBudget?`: `number`; \} | `defaultGeoParquetPolicy` | - |
| `policy.maxFileBytes?` | `number` | `...` | - |
| `policy.maxRowCount?` | `number` | `...` | - |
| `policy.allowRemoteUrls?` | `boolean` | `...` | - |
| `policy.timeoutMs?` | `number` | `...` | - |
| `policy.workerBudget?` | `number` | `...` | - |
| `sourceId` | `string` | `"geoparquet"` | - |

## Returns

[`Diagnostic`](../interfaces/Diagnostic.md)[]
