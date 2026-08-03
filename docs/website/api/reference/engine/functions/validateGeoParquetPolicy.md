[**@gis-engine/engine v1.5.0**](../index.md)

***

# Function: validateGeoParquetPolicy()

> **validateGeoParquetPolicy**(`source`, `policy?`, `sourceId?`): `object`[]

Validate GeoParquet source metadata against policy.
Returns diagnostics without performing any IO.
Runtime loading/query remains blocked -- this validates metadata only.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `source` | `unknown` | `undefined` |
| `policy` | \{ `maxFileBytes?`: `number`; `maxRowCount?`: `number`; `allowRemoteUrls?`: `boolean`; `timeoutMs?`: `number`; `workerBudget?`: `number`; \} | `defaultGeoParquetPolicy` |
| `policy.maxFileBytes?` | `number` | `...` |
| `policy.maxRowCount?` | `number` | `...` |
| `policy.allowRemoteUrls?` | `boolean` | `...` |
| `policy.timeoutMs?` | `number` | `...` |
| `policy.workerBudget?` | `number` | `...` |
| `sourceId` | `string` | `"geoparquet"` |

## Returns

`object`[]
