[**@gis-engine/engine v1.4.0**](../index.md)

***

# Interface: CommandResult

## Properties

### commandId

> **commandId**: `string`

***

### sequenceId

> **sequenceId**: `number`

***

### status

> **status**: `"applied"` \| `"skipped"` \| `"failed"`

***

### baseRevision?

> `optional` **baseRevision?**: `string`

***

### nextRevision?

> `optional` **nextRevision?**: `string`

***

### changedPaths

> **changedPaths**: `string`[]

***

### patch?

> `optional` **patch?**: [`JsonPatchOperation`](JsonPatchOperation.md)[]

***

### inversePatch?

> `optional` **inversePatch?**: [`JsonPatchOperation`](JsonPatchOperation.md)[]

***

### diagnostics

> **diagnostics**: [`Diagnostic`](Diagnostic.md)[]

***

### traceId?

> `optional` **traceId?**: `string`
