[**@gis-engine/engine v1.1.0**](../index.md)

***

# Interface: RendererAdapter

## Properties

### id

> `readonly` **id**: `string`

***

### version

> `readonly` **version**: `string`

## Methods

### getCapabilities()

> **getCapabilities**(): `Promise`\&lt;[`CapabilityReport`](CapabilityReport.md)\&gt;

#### Returns

`Promise`\&lt;[`CapabilityReport`](CapabilityReport.md)\&gt;

***

### load()

> **load**(`spec`, `context`): `Promise`\&lt;`void`\&gt;

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | [`MapSpec`](MapSpec.md) |
| `context` | [`RenderContext`](RenderContext.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### applyPatch()

> **applyPatch**(`patch`, `context`): `Promise`\&lt;[`AdapterApplyResult`](AdapterApplyResult.md)\&gt;

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `patch` | [`JsonPatchOperation`](JsonPatchOperation.md)[] |
| `context` | [`RenderContext`](RenderContext.md) |

#### Returns

`Promise`\&lt;[`AdapterApplyResult`](AdapterApplyResult.md)\&gt;

***

### queryFeatures()

> **queryFeatures**(`options`): `Promise`\&lt;[`FeatureQueryResult`](FeatureQueryResult.md)\&gt;

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`QueryFeaturesOptions`](QueryFeaturesOptions.md) |

#### Returns

`Promise`\&lt;[`FeatureQueryResult`](FeatureQueryResult.md)\&gt;

***

### snapshot()

> **snapshot**(`options`): `Promise`\&lt;[`SnapshotResult`](SnapshotResult.md)\&gt;

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`SnapshotOptions`](SnapshotOptions.md) |

#### Returns

`Promise`\&lt;[`SnapshotResult`](SnapshotResult.md)\&gt;

***

### resize()

> **resize**(`size`): `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `size` | \{ `width`: `number`; `height`: `number`; \} |
| `size.width` | `number` |
| `size.height` | `number` |

#### Returns

`void`

***

### destroy()

> **destroy**(): `Promise`\&lt;[`ResourceReport`](ResourceReport.md)\&gt;

#### Returns

`Promise`\&lt;[`ResourceReport`](ResourceReport.md)\&gt;

***

### on()

> **on**(`event`, `listener`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `"error"` \| `"warning"` \| `"stats"` |
| `listener` | [`AdapterEventListener`](../type-aliases/AdapterEventListener.md) |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)
