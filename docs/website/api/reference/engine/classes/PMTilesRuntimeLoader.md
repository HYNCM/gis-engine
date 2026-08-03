[**@gis-engine/engine v1.5.0**](../index.md)

***

# Class: PMTilesRuntimeLoader

Compatibility shell for the previously exported experimental loader.
Calls intentionally perform no range IO or decoding while the runtime gate
is No-go.

## Constructors

### Constructor

> **new PMTilesRuntimeLoader**(`options`): `PMTilesRuntimeLoader`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`PMTilesRuntimeLoaderOptions`](../interfaces/PMTilesRuntimeLoaderOptions.md) |

#### Returns

`PMTilesRuntimeLoader`

## Properties

### sourceId

> `readonly` **sourceId**: `string`

***

### url

> `readonly` **url**: `string`

## Methods

### getSnapshot()

> **getSnapshot**(): [`PMTilesLoaderSnapshot`](../interfaces/PMTilesLoaderSnapshot.md)

#### Returns

[`PMTilesLoaderSnapshot`](../interfaces/PMTilesLoaderSnapshot.md)

***

### loadHeader()

> **loadHeader**(): `Promise`\&lt;`void`\&gt;

#### Returns

`Promise`\&lt;`void`\&gt;

***

### loadDirectory()

> **loadDirectory**(): `Promise`\&lt;`void`\&gt;

#### Returns

`Promise`\&lt;`void`\&gt;

***

### initialize()

> **initialize**(): `Promise`\&lt;`void`\&gt;

#### Returns

`Promise`\&lt;`void`\&gt;

***

### query()

> **query**(`_options?`): `Promise`\&lt;[`PMTilesLoaderQueryResult`](../interfaces/PMTilesLoaderQueryResult.md)\&gt;

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `_options` | [`PMTilesLoaderQueryOptions`](../interfaces/PMTilesLoaderQueryOptions.md) |

#### Returns

`Promise`\&lt;[`PMTilesLoaderQueryResult`](../interfaces/PMTilesLoaderQueryResult.md)\&gt;
