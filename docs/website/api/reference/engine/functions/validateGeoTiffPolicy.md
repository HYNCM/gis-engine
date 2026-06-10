[**@gis-engine/engine v1.0.0**](../index.md)

***

# Function: validateGeoTiffPolicy()

> **validateGeoTiffPolicy**(`source`, `policy?`, `sourceId?`): [`Diagnostic`](../interfaces/Diagnostic.md)[]

Validate GeoTIFF source metadata against policy.
Returns diagnostics without performing any IO.
Runtime loading/query remains blocked -- this validates metadata only.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `source` | \{ `type`: `"geotiff"`; `url`: `string`; `crs?`: \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \}; `bbox?`: \[`number`, `number`, `number`, `number`\]; `width?`: `number`; `height?`: `number`; `bandCount?`: `number`; `bands?`: `object`[]; `fileBytes?`: `number`; \} | `undefined` | - |
| `source.type` | `"geotiff"` | `...` | - |
| `source.url` | `string` | `...` | URL to the GeoTIFF file |
| `source.crs?` | \{ `authority?`: `string`; `code?`: `string`; `wkt?`: `string`; \} | `...` | CRS metadata |
| `source.crs.authority?` | `string` | `...` | CRS authority code, e.g. "EPSG:4326" |
| `source.crs.code?` | `string` | `...` | CRS code, e.g. "4326" |
| `source.crs.wkt?` | `string` | `...` | CRS WKT (for custom projections) |
| `source.bbox?` | \[`number`, `number`, `number`, `number`\] | `...` | Bounding box [west, south, east, north] |
| `source.width?` | `number` | `...` | Raster width in pixels |
| `source.height?` | `number` | `...` | Raster height in pixels |
| `source.bandCount?` | `number` | `...` | Number of raster bands |
| `source.bands?` | `object`[] | `...` | Optional band metadata for diagnostics |
| `source.fileBytes?` | `number` | `...` | File byte size |
| `policy` | \{ `maxFileBytes?`: `number`; `maxPixels?`: `number`; `maxBandCount?`: `number`; `requireCrs?`: `boolean`; `requireNoData?`: `boolean`; `allowRemoteUrls?`: `boolean`; `timeoutMs?`: `number`; `workerBudget?`: `number`; \} | `defaultGeoTiffPolicy` | - |
| `policy.maxFileBytes?` | `number` | `...` | - |
| `policy.maxPixels?` | `number` | `...` | - |
| `policy.maxBandCount?` | `number` | `...` | - |
| `policy.requireCrs?` | `boolean` | `...` | - |
| `policy.requireNoData?` | `boolean` | `...` | - |
| `policy.allowRemoteUrls?` | `boolean` | `...` | - |
| `policy.timeoutMs?` | `number` | `...` | - |
| `policy.workerBudget?` | `number` | `...` | - |
| `sourceId` | `string` | `"geotiff"` | - |

## Returns

[`Diagnostic`](../interfaces/Diagnostic.md)[]
