[**@gis-engine/engine v1.5.0**](../index.md)

***

# Interface: GeoParquetWasmLoaderOptions

## Properties

### sourceId

> **sourceId**: `string`

***

### source

> **source**: `object`

#### type

> `readonly` **type**: `"geoparquet"`

#### url

> `readonly` **url**: `string`

URL is policy-validated, but this metadata-only boundary never fetches it.

#### metadata

> `readonly` **metadata**: \{ `releaseIdentity`: `"1.1.0"`; `geoVersion`: `"1.1.0"`; `encoding`: `"WKB"` \| `"point"` \| `"linestring"` \| `"polygon"` \| `"multipoint"` \| `"multilinestring"` \| `"multipolygon"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\]; `covering?`: \{ `bbox`: \{ `xmin`: \[`string`, `"xmin"`\]; `xmax`: \[`string`, `"xmax"`\]; `ymin`: \[`string`, `"ymin"`\]; `ymax`: \[`string`, `"ymax"`\]; \}; \}; \} \| \{ `releaseIdentity`: `"2.0.0-rc.1"`; `geoVersion`: `"2.0.0"`; `encoding`: `"WKB"`; `logicalType`: `"GEOMETRY"` \| `"GEOGRAPHY"`; `crs?`: \{ `$schema?`: `string`; `type`: `"BoundCRS"` \| `"CompoundCRS"` \| `"DerivedEngineeringCRS"` \| `"DerivedGeodeticCRS"` \| `"DerivedGeographicCRS"` \| `"DerivedParametricCRS"` \| `"DerivedProjectedCRS"` \| `"DerivedTemporalCRS"` \| `"DerivedVerticalCRS"` \| `"EngineeringCRS"` \| `"GeodeticCRS"` \| `"GeographicCRS"` \| `"ParametricCRS"` \| `"ProjectedCRS"` \| `"TemporalCRS"` \| `"VerticalCRS"`; `name`: `string`; \} \| `null`; `bbox?`: \[`number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`, `number`, `number`, `number`, `number`\]; `rowGroupStatistics`: \{ `bbox`: `true`; `geometryTypes`: `true`; \}; \} = `GeoParquetSourceMetadataSchema`

Exact readiness release identity and version-specific metadata evidence.

#### rowCount?

> `readonly` `optional` **rowCount?**: `number`

Row count metadata.

#### fileBytes?

> `readonly` `optional` **fileBytes?**: `number`

File byte size metadata.

***

### wasmModuleFactory?

> `optional` **wasmModuleFactory?**: () => `Promise`\&lt;[`GeoParquetWasmModule`](GeoParquetWasmModule.md)\&gt;

Caller-supplied WASM module factory (ownership inversion).

#### Returns

`Promise`\&lt;[`GeoParquetWasmModule`](GeoParquetWasmModule.md)\&gt;

***

### fetchBytes?

> `optional` **fetchBytes?**: (`url`, `range?`) => `Promise`\&lt;`ArrayBuffer`\&gt;

Caller-supplied byte fetcher.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |
| `range?` | \{ `offset`: `number`; `length`: `number`; \} |
| `range.offset?` | `number` |
| `range.length?` | `number` |

#### Returns

`Promise`\&lt;`ArrayBuffer`\&gt;
