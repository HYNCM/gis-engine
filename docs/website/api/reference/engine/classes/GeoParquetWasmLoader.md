[**@gis-engine/engine v1.5.0**](../index.md)

***

# Class: GeoParquetWasmLoader

## Constructors

### Constructor

> **new GeoParquetWasmLoader**(`options`): `GeoParquetWasmLoader`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`GeoParquetWasmLoaderOptions`](../interfaces/GeoParquetWasmLoaderOptions.md) |

#### Returns

`GeoParquetWasmLoader`

## Properties

### sourceId

> `readonly` **sourceId**: `string`

***

### source

> `readonly` **source**: `object`

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

## Methods

### getStatus()

> **getStatus**(): [`GeoParquetWasmStatus`](../type-aliases/GeoParquetWasmStatus.md)

#### Returns

[`GeoParquetWasmStatus`](../type-aliases/GeoParquetWasmStatus.md)

***

### getMetadata()

> **getMetadata**(): [`GeoParquetMetadata`](../interfaces/GeoParquetMetadata.md) \| `null`

#### Returns

[`GeoParquetMetadata`](../interfaces/GeoParquetMetadata.md) \| `null`

***

### assessReadiness()

> **assessReadiness**(): `Promise`\&lt;[`GeoParquetWasmReadinessReport`](../interfaces/GeoParquetWasmReadinessReport.md)\&gt;

Assess whether this loader can provide runtime GeoParquet parsing.
Currently returns stub status since WASM module is not yet implemented.

#### Returns

`Promise`\&lt;[`GeoParquetWasmReadinessReport`](../interfaces/GeoParquetWasmReadinessReport.md)\&gt;
