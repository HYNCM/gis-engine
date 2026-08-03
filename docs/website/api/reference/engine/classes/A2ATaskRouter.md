[**@gis-engine/engine v1.5.0**](../index.md)

***

# Class: A2ATaskRouter

## Constructors

### Constructor

> **new A2ATaskRouter**(`options`): `A2ATaskRouter`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`A2ATaskRouterOptions`](../interfaces/A2ATaskRouterOptions.md) |

#### Returns

`A2ATaskRouter`

## Methods

### getAgentCard()

> **getAgentCard**(): [`A2AAgentCard`](../interfaces/A2AAgentCard.md)

#### Returns

[`A2AAgentCard`](../interfaces/A2AAgentCard.md)

***

### handleTaskSend()

> **handleTaskSend**(`request`): `Promise`\&lt;[`A2ATaskSendResponse`](../interfaces/A2ATaskSendResponse.md)\&gt;

Route a task send request to the appropriate skill handler.
Currently returns a stub "working" response for all skills.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`A2ATaskSendRequest`](../interfaces/A2ATaskSendRequest.md) |

#### Returns

`Promise`\&lt;[`A2ATaskSendResponse`](../interfaces/A2ATaskSendResponse.md)\&gt;

***

### handleTaskGet()

> **handleTaskGet**(`taskId`): `Promise`\<[`A2ATask`](../interfaces/A2ATask.md) \| `null`\>

Get a task by ID.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `taskId` | `string` |

#### Returns

`Promise`\<[`A2ATask`](../interfaces/A2ATask.md) \| `null`\>

***

### handleTaskCancel()

> **handleTaskCancel**(`taskId`): `Promise`\<[`A2ATask`](../interfaces/A2ATask.md) \| `null`\>

Cancel a task.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `taskId` | `string` |

#### Returns

`Promise`\<[`A2ATask`](../interfaces/A2ATask.md) \| `null`\>
