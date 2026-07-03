[**@gis-engine/engine v1.4.0**](../index.md)

***

# Function: validateFlatGeobufPolicy()

> **validateFlatGeobufPolicy**(`source`, `policy?`, `sourceId?`): [`Diagnostic`](../interfaces/Diagnostic.md)[]

Validate FlatGeobuf source metadata against policy.
Returns diagnostics without performing any IO.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `source` | \{ `type`: `"flatgeobuf"`; `url`: `string`; `hasIndex?`: `boolean`; `featureCount?`: `number`; `bbox?`: \[`number`, `number`, `number`, `number`\]; `geometryType?`: `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"`; `fileBytes?`: `number`; \} | `undefined` | - |
| `source.type` | `"flatgeobuf"` | `...` | - |
| `source.url` | `string` | `...` | - |
| `source.hasIndex?` | `boolean` | `...` | Whether the file has a spatial index |
| `source.featureCount?` | `number` | `...` | Feature count metadata |
| `source.bbox?` | \[`number`, `number`, `number`, `number`\] | `...` | Bounding box [west, south, east, north] |
| `source.geometryType?` | `"Point"` \| `"LineString"` \| `"Polygon"` \| `"MultiPoint"` \| `"MultiLineString"` \| `"MultiPolygon"` | `...` | Geometry type |
| `source.fileBytes?` | `number` | `...` | File byte size |
| `policy` | \{ `maxFileBytes?`: `number`; `maxFeatureCount?`: `number`; `allowRangeRequests?`: `boolean`; `indexRequired?`: `boolean`; `timeoutMs?`: `number`; \} | `defaultFlatGeobufPolicy` | - |
| `policy.maxFileBytes?` | `number` | `...` | - |
| `policy.maxFeatureCount?` | `number` | `...` | - |
| `policy.allowRangeRequests?` | `boolean` | `...` | - |
| `policy.indexRequired?` | `boolean` | `...` | - |
| `policy.timeoutMs?` | `number` | `...` | - |
| `sourceId` | `string` | `"flatgeobuf"` | - |

## Returns

[`Diagnostic`](../interfaces/Diagnostic.md)[]
