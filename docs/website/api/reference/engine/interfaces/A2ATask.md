[**@gis-engine/engine v1.5.0**](../index.md)

***

# Interface: A2ATask

## Properties

### id

> **id**: `string`

***

### sessionId

> **sessionId**: `string`

***

### status

> **status**: `object`

#### state

> **state**: [`A2ATaskState`](../type-aliases/A2ATaskState.md)

#### message?

> `optional` **message?**: [`A2AMessage`](A2AMessage.md)

#### timestamp

> **timestamp**: `string`

***

### history

> **history**: [`A2AMessage`](A2AMessage.md)[]

***

### artifacts

> **artifacts**: [`A2AArtifact`](A2AArtifact.md)[]

***

### metadata

> **metadata**: `Record`\<`string`, `unknown`\>
