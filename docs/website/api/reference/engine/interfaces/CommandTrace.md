[**@gis-engine/engine v1.2.0**](../index.md)

***

# Interface: CommandTrace

## Properties

### traceId

> **traceId**: `string`

***

### commandId

> **commandId**: `string`

***

### sequenceId

> **sequenceId**: `number`

***

### status

> **status**: `"applied"` \| `"skipped"` \| `"failed"`

***

### startedAt

> **startedAt**: `string`

***

### endedAt

> **endedAt**: `string`

***

### baseRevision?

> `optional` **baseRevision?**: `string`

***

### nextRevision?

> `optional` **nextRevision?**: `string`

***

### author?

> `optional` **author?**: `object`

#### type

> **type**: `"human"` \| `"agent"` \| `"system"`

#### id?

> `optional` **id?**: `string`

#### name?

> `optional` **name?**: `string`

***

### reason?

> `optional` **reason?**: `string`

***

### sourcePromptHash?

> `optional` **sourcePromptHash?**: `string`

***

### diagnostics

> **diagnostics**: [`Diagnostic`](Diagnostic.md)[]

***

### changedPaths

> **changedPaths**: `string`[]
