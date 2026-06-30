[**@gis-engine/engine v1.1.0**](../index.md)

***

# Class: MapRuntime

## Methods

### create()

> `static` **create**(`spec`, `options`): `Promise`\&lt;`MapRuntime`\&gt;

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | [`MapSpec`](../interfaces/MapSpec.md) |
| `options` | [`MapRuntimeOptions`](../interfaces/MapRuntimeOptions.md) |

#### Returns

`Promise`\&lt;`MapRuntime`\&gt;

***

### apply()

> **apply**(`commands`, `options?`): `Promise`\&lt;[`CommandResult`](../interfaces/CommandResult.md)[]\&gt;

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `commands` | [`MapCommand`](../type-aliases/MapCommand.md) \| [`MapCommand`](../type-aliases/MapCommand.md)[] |
| `options` | [`ApplyOptions`](../interfaces/ApplyOptions.md) |

#### Returns

`Promise`\&lt;[`CommandResult`](../interfaces/CommandResult.md)[]\&gt;

***

### exportSpec()

> **exportSpec**(): [`MapSpec`](../interfaces/MapSpec.md)

#### Returns

[`MapSpec`](../interfaces/MapSpec.md)

***

### validate()

> **validate**(): [`ValidationReport`](../interfaces/ValidationReport.md)

#### Returns

[`ValidationReport`](../interfaces/ValidationReport.md)

***

### queryFeatures()

> **queryFeatures**(`options`): `Promise`\&lt;[`FeatureQueryResult`](../interfaces/FeatureQueryResult.md)\&gt;

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`QueryFeaturesOptions`](../interfaces/QueryFeaturesOptions.md) |

#### Returns

`Promise`\&lt;[`FeatureQueryResult`](../interfaces/FeatureQueryResult.md)\&gt;

***

### snapshot()

> **snapshot**(`options?`): `Promise`\&lt;[`SnapshotResult`](../interfaces/SnapshotResult.md)\&gt;

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`SnapshotOptions`](../interfaces/SnapshotOptions.md) |

#### Returns

`Promise`\&lt;[`SnapshotResult`](../interfaces/SnapshotResult.md)\&gt;

***

### destroy()

> **destroy**(): `Promise`\&lt;[`ResourceReport`](../interfaces/ResourceReport.md)\&gt;

#### Returns

`Promise`\&lt;[`ResourceReport`](../interfaces/ResourceReport.md)\&gt;
