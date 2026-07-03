[**@gis-engine/engine v1.4.0**](../index.md)

***

# Interface: SuggestedFix

## Properties

### kind

> **kind**: `"json-patch"` \| `"command"` \| `"manual"`

***

### confidence

> **confidence**: `"high"` \| `"medium"` \| `"low"`

***

### message

> **message**: `string`

***

### patch?

> `optional` **patch?**: [`JsonPatchOperation`](JsonPatchOperation.md)[]

***

### command?

> `optional` **command?**: [`MapCommand`](../type-aliases/MapCommand.md)
