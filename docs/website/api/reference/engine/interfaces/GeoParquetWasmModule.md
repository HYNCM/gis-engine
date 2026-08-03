[**@gis-engine/engine v1.5.0**](../index.md)

***

# Interface: GeoParquetWasmModule

## Methods

### parseMetadata()

> **parseMetadata**(`buffer`): [`GeoParquetMetadata`](GeoParquetMetadata.md)

Parse raw Parquet bytes and return metadata + feature count.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `buffer` | `ArrayBuffer` |

#### Returns

[`GeoParquetMetadata`](GeoParquetMetadata.md)

***

### decodeRows()

> **decodeRows**(`buffer`, `offset`, `count`): [`GeoParquetDecodedRow`](GeoParquetDecodedRow.md)[]

Decode a row range into GeoJSON-like features.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `buffer` | `ArrayBuffer` |
| `offset` | `number` |
| `count` | `number` |

#### Returns

[`GeoParquetDecodedRow`](GeoParquetDecodedRow.md)[]
