[**@gis-engine/engine v1.1.0**](../index.md)

***

# Class: MockAdapter

## Implements

- [`RendererAdapter`](../interfaces/RendererAdapter.md)

## Constructors

### Constructor

> **new MockAdapter**(): `MockAdapter`

#### Returns

`MockAdapter`

## Properties

### id

> `readonly` **id**: `"mock"` = `"mock"`

#### Implementation of

[`RendererAdapter`](../interfaces/RendererAdapter.md).[`id`](../interfaces/RendererAdapter.md#id)

***

### version

> `readonly` **version**: `"0.1.0"` = `"0.1.0"`

#### Implementation of

[`RendererAdapter`](../interfaces/RendererAdapter.md).[`version`](../interfaces/RendererAdapter.md#version)

## Methods

### getCapabilities()

> **getCapabilities**(): `Promise`\&lt;[`CapabilityReport`](../interfaces/CapabilityReport.md)\&gt;

#### Returns

`Promise`\&lt;[`CapabilityReport`](../interfaces/CapabilityReport.md)\&gt;

#### Implementation of

[`RendererAdapter`](../interfaces/RendererAdapter.md).[`getCapabilities`](../interfaces/RendererAdapter.md#getcapabilities)

***

### load()

> **load**(`spec`, `_context`): `Promise`\&lt;`void`\&gt;

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | [`MapSpec`](../interfaces/MapSpec.md) |
| `_context` | [`RenderContext`](../interfaces/RenderContext.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Implementation of

[`RendererAdapter`](../interfaces/RendererAdapter.md).[`load`](../interfaces/RendererAdapter.md#load)

***

### applyPatch()

> **applyPatch**(`patch`, `_context`): `Promise`\&lt;[`AdapterApplyResult`](../interfaces/AdapterApplyResult.md)\&gt;

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `patch` | [`JsonPatchOperation`](../interfaces/JsonPatchOperation.md)[] |
| `_context` | [`RenderContext`](../interfaces/RenderContext.md) |

#### Returns

`Promise`\&lt;[`AdapterApplyResult`](../interfaces/AdapterApplyResult.md)\&gt;

#### Implementation of

[`RendererAdapter`](../interfaces/RendererAdapter.md).[`applyPatch`](../interfaces/RendererAdapter.md#applypatch)

***

### queryFeatures()

> **queryFeatures**(`options`): `Promise`\&lt;[`FeatureQueryResult`](../interfaces/FeatureQueryResult.md)\&gt;

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`QueryFeaturesOptions`](../interfaces/QueryFeaturesOptions.md) |

#### Returns

`Promise`\&lt;[`FeatureQueryResult`](../interfaces/FeatureQueryResult.md)\&gt;

#### Implementation of

[`RendererAdapter`](../interfaces/RendererAdapter.md).[`queryFeatures`](../interfaces/RendererAdapter.md#queryfeatures)

***

### snapshot()

> **snapshot**(`_options`): `Promise`\&lt;[`SnapshotResult`](../interfaces/SnapshotResult.md)\&gt;

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `_options` | [`SnapshotOptions`](../interfaces/SnapshotOptions.md) |

#### Returns

`Promise`\&lt;[`SnapshotResult`](../interfaces/SnapshotResult.md)\&gt;

#### Implementation of

[`RendererAdapter`](../interfaces/RendererAdapter.md).[`snapshot`](../interfaces/RendererAdapter.md#snapshot)

***

### resize()

> **resize**(`_size`): `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `_size` | \{ `width`: `number`; `height`: `number`; \} |
| `_size.width` | `number` |
| `_size.height` | `number` |

#### Returns

`void`

#### Implementation of

[`RendererAdapter`](../interfaces/RendererAdapter.md).[`resize`](../interfaces/RendererAdapter.md#resize)

***

### destroy()

> **destroy**(): `Promise`\&lt;[`ResourceReport`](../interfaces/ResourceReport.md)\&gt;

#### Returns

`Promise`\&lt;[`ResourceReport`](../interfaces/ResourceReport.md)\&gt;

#### Implementation of

[`RendererAdapter`](../interfaces/RendererAdapter.md).[`destroy`](../interfaces/RendererAdapter.md#destroy)

***

### on()

> **on**(`event`, `listener`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `string` |
| `listener` | [`AdapterEventListener`](../type-aliases/AdapterEventListener.md) |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Implementation of

[`RendererAdapter`](../interfaces/RendererAdapter.md).[`on`](../interfaces/RendererAdapter.md#on)

***

### exportSpec()

> **exportSpec**(): [`MapSpec`](../interfaces/MapSpec.md) \| `null`

#### Returns

[`MapSpec`](../interfaces/MapSpec.md) \| `null`
